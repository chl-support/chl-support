import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, ensureSchema, hasDb } from './_lib/db'
import { fail, methodNotAllowed } from './_lib/http'

/**
 * POST /api/reset  { "confirm": "HAPUS DEMO" }
 * Menghapus SEMUA sisa data demo (projects, items, permits, attachments) dari
 * database — dipakai sekali kalau deployment sebelumnya sempat men-seed data
 * contoh. Tabel `tim` (data asli) TIDAK disentuh. Perlu konfirmasi eksplisit.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
  if (b.confirm !== 'HAPUS DEMO') {
    return fail(res, 400, 'Konfirmasi diperlukan: kirim body { "confirm": "HAPUS DEMO" }.')
  }

  try {
    await ensureSchema()
    const sql = db()
    await sql`TRUNCATE items, permits, attachments RESTART IDENTITY`
    await sql`DELETE FROM projects`
    res.status(200).json({ ok: true, message: 'Data demo dibersihkan. Tabel tim tidak disentuh.' })
  } catch (e) {
    fail(res, 500, 'Reset gagal.', (e as Error).message)
  }
}
