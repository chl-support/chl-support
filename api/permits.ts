import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deletePermit, ensureSchema, getPermits, hasDb, upsertPermit } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/**
 * GET    /api/permits?proyek=srp   → daftar izin (opsional difilter per proyek)
 * POST   /api/permits              → buat (tanpa id) / ubah (dengan id) satu izin
 * DELETE /api/permits?id=12        → hapus satu izin
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const proyek = req.query.proyek ? String(req.query.proyek) : undefined
      return res.status(200).json({ ok: true, permits: await getPermits(proyek) })
    }

    if (req.method === 'POST') {
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      if (!b.proyek || !b.fase || !b.nama?.trim()) {
        return fail(res, 400, 'proyek, fase, dan nama izin wajib diisi.')
      }
      const id = await upsertPermit({
        id: b.id ? Number(b.id) : undefined,
        proyek: String(b.proyek),
        fase: String(b.fase),
        kode: b.kode ? String(b.kode).trim() : String(b.nama).trim().slice(0, 12).toUpperCase(),
        nama: String(b.nama).trim(),
        prasyarat: b.prasyarat ? String(b.prasyarat).trim() : '—',
        status: b.status ? String(b.status) : 'Belum Dimulai',
        tgl: b.tgl ?? null,
        pic: b.pic ? String(b.pic).trim() : '',
        verif: b.verif ? String(b.verif).trim() : '',
        dok: Number(b.dok) || 0,
      })
      return res.status(b.id ? 200 : 201).json({ ok: true, id })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deletePermit(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi izin gagal.', (e as Error).message)
  }
}
