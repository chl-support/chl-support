import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import {
  deleteAuditDoc,
  ensureSchema,
  getAuditDocData,
  getAuditDocUrl,
  getAuditDocs,
  hasDb,
  insertAuditDoc,
} from './_lib/db.js'
import { fail, methodNotAllowed, readRawBody, sendFile } from './_lib/http.js'

// Keep the raw body intact so the file can be streamed to Blob.
export const config = { api: { bodyParser: false } }

/**
 * Dokumen Internal Audit — tersimpan di Vercel Blob, metadatanya di Neon.
 *
 * GET    /api/audit                              → daftar dokumen
 * GET    /api/audit?download=12                   → unduh berkas yang disimpan di Neon (fallback)
 * POST   /api/audit?filename=x.pdf&judul=...     → unggah (Blob bila ada, jika tidak → Neon)
 * DELETE /api/audit?id=12                         → hapus dokumen (Blob + baris DB)
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
      const filename = String(req.query.filename || 'dokumen')
      const judul = req.query.judul ? String(req.query.judul) : filename
      const catatan = req.query.catatan ? String(req.query.catatan) : ''

      const body = await readRawBody(req)
      if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')
      const contentType = req.headers['content-type'] || 'application/octet-stream'

      const token = blobToken()
      if (token) {
        // Preferred path: object storage in Vercel Blob.
        const blob = await put(`audit/${filename}`, body, {
          access: 'public',
          contentType,
          addRandomSuffix: true,
          token,
        })
        const id = await insertAuditDoc({
          judul, filename, url: blob.url, size: body.length, contentType, catatan,
        })
        return res.status(201).json({ ok: true, id, url: blob.url, filename, size: body.length })
      }

      // Fallback: no Blob store — keep the bytes in Neon so uploads still work.
      const id = await insertAuditDoc({
        judul, filename, url: '', size: body.length, contentType, catatan,
        data: body.toString('base64'),
      })
      const url = `/api/audit?download=${id}`
      return res.status(201).json({ ok: true, id, url, filename, size: body.length })
    }

    if (req.method === 'DELETE') {
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

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi dokumen audit gagal.', (e as Error).message)
  }
}
