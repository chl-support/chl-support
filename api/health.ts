import type { VercelRequest, VercelResponse } from '@vercel/node'
import { blobToken, databaseUrl, openaiKey } from './_lib/env.js'
import { db } from './_lib/db.js'

/**
 * Diagnostic endpoint — visit /api/health to confirm the three Vercel resources
 * are actually wired up and reachable. Never throws; every check is reported.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
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
