import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import {
  deleteAuditDoc,
  deleteSignoff,
  ensureSchema,
  getAuditDocData,
  getAuditDocUrl,
  getAuditDocs,
  hasDb,
  insertAuditDoc,
  insertSignoff,
  insertSignoffChain,
  updateSignoff,
} from './_lib/db.js'
import { fail, methodNotAllowed, readRawBody, sendFile } from './_lib/http.js'

// Keep the raw body intact so the file can be streamed to Blob.
export const config = { api: { bodyParser: false } }

const SIGNOFF_STATUS = ['Menunggu', 'Diproses', 'Ditandatangani', 'Revisi', 'Dilewati']

/** Parses a JSON request body from the raw stream (bodyParser is disabled). */
async function readJson(req: VercelRequest): Promise<Record<string, unknown>> {
  const raw = await readRawBody(req)
  if (!raw.length) return {}
  try {
    const parsed = JSON.parse(raw.toString('utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * Dokumen Internal Audit — berkas di Vercel Blob, metadata + alur tanda tangan
 * lintas divisi di Neon.
 *
 * GET    /api/audit                                   → daftar dokumen + alur tanda tangan
 * GET    /api/audit?download=12                        → unduh berkas yang disimpan di Neon (fallback)
 * POST   /api/audit?filename=x.pdf&judul=…&divisi=A|B  → unggah + buat alur tanda tangan
 * POST   /api/audit?docId=12                           → tambah satu langkah (JSON: divisi, pic, tenggat)
 * PATCH  /api/audit?step=7                             → ubah langkah (JSON: status, pic, catatan, tenggat)
 * DELETE /api/audit?step=7                             → hapus satu langkah
 * DELETE /api/audit?id=12                              → hapus dokumen (Blob + baris DB + alur)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      // Serve a DB-stored file (used when Blob is not connected).
      if (req.query.download != null) {
        const id = Number(req.query.download)
        if (!id) return fail(res, 400, 'Param "download" tidak valid.')
        const file = await getAuditDocData(id)
        if (!file) return fail(res, 404, 'Berkas tidak ditemukan atau tersimpan di Blob.')
        return sendFile(res, file)
      }
      return res.status(200).json({ ok: true, docs: await getAuditDocs() })
    }

    if (req.method === 'POST') {
      // Menambah satu langkah tanda tangan pada dokumen yang sudah ada.
      if (req.query.docId != null) {
        const docId = Number(req.query.docId)
        if (!docId) return fail(res, 400, 'Param "docId" tidak valid.')
        const body = await readJson(req)
        const divisi = String(body.divisi ?? '').trim()
        if (!divisi) return fail(res, 400, 'Nama divisi wajib diisi.')
        const id = await insertSignoff({
          docId,
          divisi,
          pic: String(body.pic ?? ''),
          tenggat: body.tenggat ? String(body.tenggat) : null,
        })
        return res.status(201).json({ ok: true, id })
      }

      const filename = String(req.query.filename || 'dokumen')
      const judul = req.query.judul ? String(req.query.judul) : filename
      const catatan = req.query.catatan ? String(req.query.catatan) : ''
      // Divisi dipisah "|" agar nama seperti "License & Perizinan" tetap utuh.
      const divisi = req.query.divisi
        ? String(req.query.divisi).split('|').map((d) => d.trim()).filter(Boolean)
        : []
      const tenggat = req.query.tenggat ? String(req.query.tenggat) : null

      const body = await readRawBody(req)
      if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')
      const contentType = req.headers['content-type'] || 'application/octet-stream'

      const token = blobToken()
      let id: number
      let url: string
      if (token) {
        // Preferred path: object storage in Vercel Blob.
        const blob = await put(`audit/${filename}`, body, {
          access: 'public',
          contentType,
          addRandomSuffix: true,
          token,
        })
        url = blob.url
        id = await insertAuditDoc({
          judul, filename, url, size: body.length, contentType, catatan,
        })
      } else {
        // Fallback: no Blob store — keep the bytes in Neon so uploads still work.
        id = await insertAuditDoc({
          judul, filename, url: '', size: body.length, contentType, catatan,
          data: body.toString('base64'),
        })
        url = `/api/audit?download=${id}`
      }

      const langkah = await insertSignoffChain(id, divisi, tenggat)
      return res.status(201).json({ ok: true, id, url, filename, size: body.length, langkah })
    }

    if (req.method === 'PATCH') {
      const stepId = Number(req.query.step)
      if (!stepId) return fail(res, 400, 'Param "step" wajib.')
      const body = await readJson(req)
      const status = body.status == null ? undefined : String(body.status)
      if (status && !SIGNOFF_STATUS.includes(status)) {
        return fail(res, 400, `Status tidak dikenal. Gunakan ${SIGNOFF_STATUS.join(' / ')}.`)
      }
      const step = await updateSignoff(stepId, {
        status,
        pic: body.pic == null ? undefined : String(body.pic),
        catatan: body.catatan == null ? undefined : String(body.catatan),
        tenggat: body.tenggat === undefined ? undefined : body.tenggat ? String(body.tenggat) : null,
      })
      if (!step) return fail(res, 404, 'Langkah tanda tangan tidak ditemukan.')
      return res.status(200).json({ ok: true, step })
    }

    if (req.method === 'DELETE') {
      if (req.query.step != null) {
        const stepId = Number(req.query.step)
        if (!stepId) return fail(res, 400, 'Param "step" tidak valid.')
        await deleteSignoff(stepId)
        return res.status(200).json({ ok: true, id: stepId })
      }
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      const url = await getAuditDocUrl(id)
      // Only Blob-hosted files (absolute http URL) need remote cleanup.
      if (url && /^https?:\/\//.test(url) && blobToken()) {
        await del(url, { token: blobToken() }).catch(() => {}) // best-effort blob cleanup
      }
      await deleteAuditDoc(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi dokumen audit gagal.', (e as Error).message)
  }
}
