import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteComment, ensureSchema, getComments, hasDb, insertComment } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/** Entitas yang boleh punya komentar & jejak audit. */
const ENTITY = ['corp', 'item']

/**
 * Komentar & jejak audit — dipakai bersama oleh bagan Corporate (`corp`) dan
 * item proyek (`item`). Entri `sistem` ditulis backend saat data berubah;
 * entri `komentar` ditulis pengguna lewat endpoint ini.
 *
 * GET    /api/comments?entity=corp&id=3 → daftar komentar (terbaru di atas)
 * POST   /api/comments                   → tambah komentar { entity, entityId, aktor, teks }
 * DELETE /api/comments?id=9              → hapus satu komentar
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const entity = String(req.query.entity ?? '')
      const id = Number(req.query.id)
      if (!ENTITY.includes(entity) || !id) {
        return fail(res, 400, `Param "entity" (${ENTITY.join('/')}) dan "id" wajib.`)
      }
      return res.status(200).json({ ok: true, comments: await getComments(entity, id) })
    }

    if (req.method === 'POST') {
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      const entity = String(b.entity ?? '')
      const entityId = Number(b.entityId)
      const teks = String(b.teks ?? '').trim()
      if (!ENTITY.includes(entity) || !entityId) {
        return fail(res, 400, `Field "entity" (${ENTITY.join('/')}) dan "entityId" wajib.`)
      }
      if (!teks) return fail(res, 400, 'Komentar tidak boleh kosong.')
      const id = await insertComment({
        entity,
        entityId,
        aktor: b.aktor ? String(b.aktor).trim() : '',
        teks,
        // Pengguna hanya boleh menulis komentar — entri sistem dibuat backend.
        jenis: 'komentar',
      })
      return res.status(201).json({ ok: true, id })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteComment(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi komentar gagal.', (e as Error).message)
  }
}
