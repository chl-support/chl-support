import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import { ensureSchema, getAttachmentData, hasDb, insertAttachment } from './_lib/db.js'
import { fail, methodNotAllowed, readRawBody, sendFile } from './_lib/http.js'

// Keep the raw body intact so we can stream the file to Blob.
export const config = { api: { bodyParser: false } }

/**
 * POST /api/upload?filename=berkas.pdf&itemId=12
 *   Body: the raw file bytes. Stores the file in Vercel Blob when connected;
 *   otherwise falls back to keeping the bytes in Neon so uploads still work.
 * GET  /api/upload?download=12
 *   Serves an attachment that was stored in Neon (the fallback path).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Serve a DB-stored attachment (used when Blob is not connected).
  if (req.method === 'GET') {
    if (!hasDb()) return fail(res, 503, 'Database belum terhubung.')
    const id = Number(req.query.download)
    if (!id) return fail(res, 400, 'Param "download" tidak valid.')
    try {
      await ensureSchema()
      const file = await getAttachmentData(id)
      if (!file) return fail(res, 404, 'Berkas tidak ditemukan atau tersimpan di Blob.')
      return sendFile(res, file)
    } catch (e) {
      return fail(res, 500, 'Gagal mengambil berkas.', (e as Error).message)
    }
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST'])

  const token = blobToken()
  if (!token && !hasDb()) {
    return fail(
      res,
      503,
      'Penyimpanan belum tersedia — hubungkan Vercel Blob (BLOB_READ_WRITE_TOKEN) atau Neon (DATABASE_URL) di Vercel.',
    )
  }

  const filename = String(req.query.filename || 'lampiran')
  const itemId = req.query.itemId ? Number(req.query.itemId) : null

  try {
    const body = await readRawBody(req)
    if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')
    const contentType = req.headers['content-type'] || 'application/octet-stream'

    if (token) {
      // Preferred path: object storage in Vercel Blob.
      const blob = await put(filename, body, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
        token,
      })
      if (hasDb()) {
        await ensureSchema()
        await insertAttachment({ itemId, url: blob.url, filename, size: body.length, contentType })
      }
      return res.status(201).json({ ok: true, url: blob.url, filename, size: body.length })
    }

    // Fallback: no Blob store — keep the bytes in Neon and hand back a download route.
    await ensureSchema()
    const id = await insertAttachment({
      itemId, url: '', filename, size: body.length, contentType, data: body.toString('base64'),
    })
    const url = `/api/upload?download=${id}`
    res.status(201).json({ ok: true, url, filename, size: body.length })
  } catch (e) {
    fail(res, 500, 'Upload gagal.', (e as Error).message)
  }
}
