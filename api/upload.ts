import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import { db, ensureSchema, hasDb } from './_lib/db.js'
import { fail, methodNotAllowed, readRawBody } from './_lib/http.js'

// Keep the raw body intact so we can stream the file to Blob.
export const config = { api: { bodyParser: false } }

/**
 * POST /api/upload?filename=berkas.pdf&itemId=12
 * Body: the raw file bytes. Stores the file in Vercel Blob and, when itemId is
 * given and Neon is configured, records the attachment row.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const token = blobToken()
  if (!token) {
    return fail(res, 503, 'Blob belum terhubung — hubungkan Blob store (BLOB_READ_WRITE_TOKEN) di Vercel.')
  }

  const filename = String(req.query.filename || 'lampiran')
  const itemId = req.query.itemId ? Number(req.query.itemId) : null

  try {
    const body = await readRawBody(req)
    if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')

    const contentType = req.headers['content-type'] || 'application/octet-stream'
    const blob = await put(filename, body, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
      token,
    })

    if (itemId && hasDb()) {
      await ensureSchema()
      await db()`
        INSERT INTO attachments (item_id, url, filename, size)
        VALUES (${itemId}, ${blob.url}, ${filename}, ${body.length})`
    }

    res.status(201).json({ ok: true, url: blob.url, filename, size: body.length })
  } catch (e) {
    fail(res, 500, 'Upload gagal.', (e as Error).message)
  }
}
