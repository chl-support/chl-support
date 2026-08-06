import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { blobToken } from './_lib/env'
import {
  deleteAuditDoc,
  ensureSchema,
  getAuditDocUrl,
  getAuditDocs,
  hasDb,
  insertAuditDoc,
} from './_lib/db'
import { fail, methodNotAllowed, readRawBody } from './_lib/http'

// Keep the raw body intact so the file can be streamed to Blob.
export const config = { api: { bodyParser: false } }

/**
 * Dokumen Internal Audit — tersimpan di Vercel Blob, metadatanya di Neon.
 *
 * GET    /api/audit                              → daftar dokumen
 * POST   /api/audit?filename=x.pdf&judul=...     → unggah (body = isi berkas)
 * DELETE /api/audit?id=12                         → hapus dokumen (Blob + baris DB)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, docs: await getAuditDocs() })
    }

    if (req.method === 'POST') {
      const token = blobToken()
      if (!token) {
        return fail(res, 503, 'Blob belum terhubung — hubungkan Blob store (BLOB_READ_WRITE_TOKEN) di Vercel.')
      }
      const filename = String(req.query.filename || 'dokumen')
      const judul = req.query.judul ? String(req.query.judul) : filename
      const catatan = req.query.catatan ? String(req.query.catatan) : ''

      const body = await readRawBody(req)
      if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')

      const contentType = req.headers['content-type'] || 'application/octet-stream'
      const blob = await put(`audit/${filename}`, body, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
        token,
      })

      const id = await insertAuditDoc({
        judul,
        filename,
        url: blob.url,
        size: body.length,
        contentType,
        catatan,
      })
      return res.status(201).json({ ok: true, id, url: blob.url, filename, size: body.length })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      const url = await getAuditDocUrl(id)
      if (url && blobToken()) {
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
