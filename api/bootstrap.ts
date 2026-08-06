import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureReady, getItems, getPermits, getProjects, hasDb } from './_lib/db'
import { fail } from './_lib/http'

/**
 * Single call the front-end makes on load: creates the schema + seeds demo data
 * the first time, then returns everything the UI needs from Neon.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
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
