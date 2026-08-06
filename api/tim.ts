import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteTim, ensureSchema, getTim, hasDb, seedTimIfEmpty, upsertTim } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/**
 * GET    /api/tim         → daftar seluruh personel/jabatan
 * POST   /api/tim         → tambah (tanpa id) atau ubah (dengan id)
 * DELETE /api/tim?id=12   → hapus satu baris
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      await seedTimIfEmpty()
      return res.status(200).json({ ok: true, tim: await getTim() })
    }

    if (req.method === 'POST') {
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      if (!b.jabatan?.trim() || !b.nama?.trim()) {
        return fail(res, 400, 'Jabatan dan nama wajib diisi.')
      }
      const id = await upsertTim({
        id: b.id ? Number(b.id) : undefined,
        jabatan: String(b.jabatan).trim(),
        nama: String(b.nama).trim(),
        kontak: b.kontak ? String(b.kontak).trim() : '',
        catatan: b.catatan ? String(b.catatan).trim() : '',
      })
      return res.status(b.id ? 200 : 201).json({ ok: true, id })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteTim(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi tim gagal.', (e as Error).message)
  }
}
