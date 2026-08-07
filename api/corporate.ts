import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import {
  deleteCorpDoc,
  deleteCorporate,
  ensureSchema,
  getCorpDocData,
  getCorpDocUrl,
  getCorporateState,
  getCorporates,
  hasDb,
  insertComment,
  insertCorpDoc,
  upsertCorporate,
} from './_lib/db.js'
import { fail, methodNotAllowed, readRawBody, sendFile } from './_lib/http.js'

// Keep the raw body intact so evidence files can be streamed to Blob.
export const config = { api: { bodyParser: false } }

/** Agenda korporasi yang dikenal — sama persis dengan `src/data/corporate.ts`. */
const EVENT = ['RUPST', 'RUPS Biasa']
const ACTION = [
  'Perubahan Direksi',
  'Perubahan Komisaris',
  'Perubahan Pemegang Saham',
  'Perubahan Anggaran Dasar',
  'Perubahan KBLI',
  'Perubahan Modal',
  'Corporate Action Lainnya',
]

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
 * Bagan Corporate — agenda RUPS dan aksi korporasi per proyek, lengkap dengan
 * lampiran bukti dan jejak auditnya.
 *
 * GET    /api/corporate?proyek=srp                    → daftar agenda + lampiran + komentar
 * GET    /api/corporate?download=7                     → unduh lampiran yang disimpan di Neon
 * POST   /api/corporate                                → buat (tanpa id) / ubah (dengan id) agenda
 * POST   /api/corporate?corpId=3&filename=akta.pdf     → unggah lampiran bukti (body = isi berkas)
 * DELETE /api/corporate?id=3                           → hapus agenda + lampiran + jejak auditnya
 * DELETE /api/corporate?doc=7                          → hapus satu lampiran
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      if (req.query.download != null) {
        const id = Number(req.query.download)
        if (!id) return fail(res, 400, 'Param "download" tidak valid.')
        const file = await getCorpDocData(id)
        if (!file) return fail(res, 404, 'Berkas tidak ditemukan atau tersimpan di Blob.')
        return sendFile(res, file)
      }
      const proyek = req.query.proyek ? String(req.query.proyek) : undefined
      return res.status(200).json({ ok: true, corporates: await getCorporates(proyek) })
    }

    if (req.method === 'POST') {
      // Unggah lampiran bukti untuk satu agenda.
      if (req.query.corpId != null) {
        const corpId = Number(req.query.corpId)
        if (!corpId) return fail(res, 400, 'Param "corpId" tidak valid.')
        const filename = String(req.query.filename || 'bukti')
        const body = await readRawBody(req)
        if (!body.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')
        const contentType = req.headers['content-type'] || 'application/octet-stream'
        const aktor = req.query.aktor ? String(req.query.aktor) : ''

        const token = blobToken()
        let id: number
        let url: string
        if (token) {
          const blob = await put(`corporate/${filename}`, body, {
            access: 'public',
            contentType,
            addRandomSuffix: true,
            token,
          })
          url = blob.url
          id = await insertCorpDoc({ corpId, filename, url, size: body.length, contentType })
        } else {
          // Fallback: no Blob store — keep the bytes in Neon so uploads still work.
          id = await insertCorpDoc({
            corpId, filename, url: '', size: body.length, contentType,
            data: body.toString('base64'),
          })
          url = `/api/corporate?download=${id}`
        }
        await insertComment({
          entity: 'corp',
          entityId: corpId,
          aktor,
          teks: `Lampiran bukti "${filename}" diunggah.`,
          jenis: 'sistem',
        })
        return res.status(201).json({ ok: true, id, url, filename, size: body.length })
      }

      const b = await readJson(req)
      if (!b.proyek || !b.event || !b.action) {
        return fail(res, 400, 'proyek, event, dan action wajib diisi.')
      }
      const event = String(b.event)
      const action = String(b.action)
      if (!EVENT.includes(event)) {
        return fail(res, 400, `Event tidak dikenal. Gunakan ${EVENT.join(' / ')}.`)
      }
      if (!ACTION.includes(action)) {
        return fail(res, 400, `Action tidak dikenal. Gunakan salah satu: ${ACTION.join(', ')}.`)
      }

      const id = b.id ? Number(b.id) : undefined
      const aktor = b.aktor ? String(b.aktor) : String(b.pic ?? '')
      const status = b.status ? String(b.status) : 'Belum Dimulai'
      const kendala = b.kendala ? String(b.kendala).trim() : ''
      // Snapshot the old values so the audit trail can record what changed.
      const before = id ? await getCorporateState(id) : null

      const savedId = await upsertCorporate({
        id,
        proyek: String(b.proyek),
        event,
        action,
        judul: b.judul ? String(b.judul).trim() : '',
        tgl: b.tgl ? String(b.tgl) : null,
        pic: b.pic ? String(b.pic).trim() : '',
        nilai: Number(b.nilai) || 0,
        kendala,
        status,
      })

      if (!before) {
        await insertComment({
          entity: 'corp',
          entityId: savedId,
          aktor,
          teks: `Agenda dibuat — ${event} · ${action}.`,
          jenis: 'sistem',
        })
      } else {
        if (before.status !== status) {
          await insertComment({
            entity: 'corp',
            entityId: savedId,
            aktor,
            teks: `Status diubah dari ${before.status} ke ${status}.`,
            jenis: 'sistem',
          })
        }
        if (before.kendala !== kendala) {
          await insertComment({
            entity: 'corp',
            entityId: savedId,
            aktor,
            teks: kendala ? `Kendala dicatat: ${kendala}` : 'Kendala dinyatakan selesai.',
            jenis: 'sistem',
          })
        }
      }

      return res.status(id ? 200 : 201).json({ ok: true, id: savedId })
    }

    if (req.method === 'DELETE') {
      if (req.query.doc != null) {
        const docId = Number(req.query.doc)
        if (!docId) return fail(res, 400, 'Param "doc" tidak valid.')
        const url = await getCorpDocUrl(docId)
        // Only Blob-hosted files (absolute http URL) need remote cleanup.
        if (url && /^https?:\/\//.test(url) && blobToken()) {
          await del(url, { token: blobToken() }).catch(() => {}) // best-effort blob cleanup
        }
        await deleteCorpDoc(docId)
        return res.status(200).json({ ok: true, id: docId })
      }
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteCorporate(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi agenda korporasi gagal.', (e as Error).message)
  }
}
