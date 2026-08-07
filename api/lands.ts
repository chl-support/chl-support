import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteLand, ensureSchema, getLands, hasDb, upsertLand } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/** Jalur sertifikasi yang dikenal — sama persis dengan `src/data/lands.ts`. */
const JENIS = [
  'Tanah Girik',
  'Tanah Sertifikat',
  'Sertifikat Hak Guna Bangunan',
  'Sertifikat Hak Milik',
]

/**
 * Bagan Land Acquisition — bidang tanah per proyek.
 *
 * GET    /api/lands?proyek=srp → daftar bidang (opsional difilter per proyek)
 * POST   /api/lands            → buat (tanpa id) / ubah (dengan id) satu bidang
 * DELETE /api/lands?id=12      → hapus satu bidang
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const proyek = req.query.proyek ? String(req.query.proyek) : undefined
      return res.status(200).json({ ok: true, lands: await getLands(proyek) })
    }

    if (req.method === 'POST') {
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      if (!b.proyek || !b.nama?.trim()) {
        return fail(res, 400, 'proyek dan nama bidang wajib diisi.')
      }
      const jenis = String(b.jenis ?? '')
      if (!JENIS.includes(jenis)) {
        return fail(res, 400, `Jenis bidang tidak dikenal. Gunakan ${JENIS.join(' / ')}.`)
      }
      const id = await upsertLand({
        id: b.id ? Number(b.id) : undefined,
        proyek: String(b.proyek),
        kode: b.kode ? String(b.kode).trim() : '',
        nama: String(b.nama).trim(),
        pemilik: b.pemilik ? String(b.pemilik).trim() : '',
        luas: Number(b.luas) || 0,
        jenis,
        noDok: b.noDok ? String(b.noDok).trim() : '',
        status: b.status ? String(b.status) : 'Belum Dimulai',
        tgl: b.tgl ?? null,
        pic: b.pic ? String(b.pic).trim() : '',
        catatan: b.catatan ? String(b.catatan).trim() : '',
      })
      return res.status(b.id ? 200 : 201).json({ ok: true, id })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteLand(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi bidang tanah gagal.', (e as Error).message)
  }
}
