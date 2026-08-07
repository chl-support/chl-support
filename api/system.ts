import type { VercelRequest, VercelResponse } from '@vercel/node'
import { blobToken, databaseUrl, openaiKey } from './_lib/env.js'
import { db, ensureReady, ensureSchema, getItems, getPermits, getProjects, hasDb } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/**
 * Tiga endpoint sistem digabung dalam satu Serverless Function agar jumlah
 * function tetap di bawah batas paket Vercel (Hobby: 12 per deployment).
 * `vercel.json` menulis ulang path lamanya, jadi URL yang dipakai front-end
 * dan bookmark tidak berubah:
 *
 * GET  /api/health    → /api/system?action=health    diagnostik resource
 * GET  /api/bootstrap → /api/system?action=bootstrap skema + seed + data awal
 * POST /api/reset     → /api/system?action=reset     bersihkan sisa data demo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? 'health')
  if (action === 'health') return health(res)
  if (action === 'bootstrap') return bootstrap(res)
  if (action === 'reset') return reset(req, res)
  return fail(res, 400, 'Param "action" harus health / bootstrap / reset.')
}

/**
 * Diagnostic endpoint — visit /api/health to confirm the three Vercel resources
 * are actually wired up and reachable. Never throws; every check is reported.
 */
async function health(res: VercelResponse) {
  const checks: Record<string, { configured: boolean; ok: boolean; detail: string }> = {
    neon: { configured: !!databaseUrl(), ok: false, detail: '' },
    blob: { configured: !!blobToken(), ok: false, detail: '' },
    openai: { configured: !!openaiKey(), ok: false, detail: '' },
  }

  // Neon: run a trivial query to prove the connection actually works.
  if (checks.neon.configured) {
    try {
      const sql = db()
      const [row] = (await sql`
        SELECT
          (SELECT count(*) FROM information_schema.tables
             WHERE table_name IN ('projects','items','permits','attachments'))::int AS tables,
          (SELECT count(*) FROM projects)::int AS projects
      `.catch(async () => {
        // Tables may not exist yet — connection is still fine.
        await sql`SELECT 1`
        return [{ tables: 0, projects: 0 }]
      })) as { tables: number; projects: number }[]
      checks.neon.ok = true
      checks.neon.detail =
        row.tables >= 4
          ? `terhubung · ${row.projects} proyek ter-seed`
          : 'terhubung · skema belum dibuat (buka /api/bootstrap sekali)'
    } catch (e) {
      checks.neon.detail = `gagal konek: ${(e as Error).message}`
    }
  } else {
    checks.neon.detail = 'DATABASE_URL / POSTGRES_URL belum di-set'
  }

  checks.blob.ok = checks.blob.configured
  checks.blob.detail = checks.blob.configured
    ? 'token tersedia (BLOB_READ_WRITE_TOKEN)'
    : 'BLOB_READ_WRITE_TOKEN belum di-set (hubungkan Blob store)'

  checks.openai.ok = checks.openai.configured
  checks.openai.detail = checks.openai.configured
    ? 'API key tersedia (OPENAI_API_KEY)'
    : 'OPENAI_API_KEY belum di-set'

  const ready = Object.values(checks).every((c) => c.ok)
  res.status(200).json({ ok: ready, ready, checks })
}

/**
 * Single call the front-end makes on load: creates the schema + seeds demo data
 * the first time, then returns everything the UI needs from Neon.
 */
async function bootstrap(res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }
  try {
    const { seeded } = await ensureReady()
    const [projects, items, permits] = await Promise.all([getProjects(), getItems(), getPermits()])
    res.status(200).json({ ok: true, seeded, projects, items, permits })
  } catch (e) {
    fail(res, 500, 'Gagal memuat data dari database.', (e as Error).message)
  }
}

/**
 * POST /api/reset  { "confirm": "HAPUS DEMO" }
 * Menghapus SEMUA sisa data demo (projects, items, permits, attachments) dari
 * database — dipakai sekali kalau deployment sebelumnya sempat men-seed data
 * contoh. Tabel `tim` (data asli) TIDAK disentuh. Perlu konfirmasi eksplisit.
 */
async function reset(req: VercelRequest, res: VercelResponse) {
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
