/**
 * Neon Postgres access over HTTP (serverless-friendly — no connection pooling
 * to manage). Exposes schema creation, one-time seeding, and the small set of
 * queries the API needs.
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { databaseUrl } from './env'
import { seedItems, seedPermits, seedProjects } from './seed'

let cached: NeonQueryFunction<false, false> | null = null

export function hasDb(): boolean {
  return !!databaseUrl()
}

/** Returns the sql client, or throws a clear error if the DB is not configured. */
export function db(): NeonQueryFunction<false, false> {
  const url = databaseUrl()
  if (!url) {
    throw new Error(
      'Database belum terhubung. Set DATABASE_URL / POSTGRES_URL di Vercel (integrasi Neon).',
    )
  }
  if (!cached) cached = neon(url)
  return cached
}

/** Builds "($1,$2,...),($n,...)" plus a flat params array for a bulk insert. */
function bulk(rows: unknown[][]): { placeholders: string; params: unknown[] } {
  const cols = rows[0].length
  const params: unknown[] = []
  const groups = rows.map((row, r) => {
    const ph = row.map((_, c) => `$${r * cols + c + 1}`)
    params.push(...row)
    return `(${ph.join(',')})`
  })
  return { placeholders: groups.join(','), params }
}

export async function ensureSchema(): Promise<void> {
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id     TEXT PRIMARY KEY,
      nama   TEXT NOT NULL,
      lok    TEXT,
      ha     TEXT,
      unit   INTEGER,
      fase   TEXT,
      warna  TEXT,
      pemda  TEXT,
      sla    TEXT
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id           SERIAL PRIMARY KEY,
      judul        TEXT NOT NULL,
      modul        TEXT NOT NULL,
      proyek       TEXT NOT NULL,
      horizon      TEXT NOT NULL,
      status       TEXT NOT NULL,
      pic          TEXT,
      verif        TEXT,
      tgl          DATE,
      nilai        BIGINT DEFAULT 0,
      risiko       TEXT,
      dok          INTEGER DEFAULT 0,
      block_reason TEXT,
      updated_at   TIMESTAMPTZ DEFAULT now()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS permits (
      id        SERIAL PRIMARY KEY,
      proyek    TEXT NOT NULL,
      kode      TEXT NOT NULL,
      nama      TEXT,
      prasyarat TEXT,
      status    TEXT,
      tgl       DATE,
      pic       TEXT,
      verif     TEXT,
      dok       INTEGER DEFAULT 0
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS attachments (
      id         SERIAL PRIMARY KEY,
      item_id    INTEGER,
      url        TEXT NOT NULL,
      filename   TEXT,
      size       INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
    )`
}

/** Inserts the demo data only when a table is empty, so re-running is safe. */
export async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  const sql = db()
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM projects`) as { n: number }[]
  if (n > 0) return { seeded: false }

  const proj = bulk(
    seedProjects.map((p) => [p.id, p.nama, p.lok, p.ha, p.unit, p.fase, p.warna, p.pemda, p.sla]),
  )
  await sql.query(
    `INSERT INTO projects (id,nama,lok,ha,unit,fase,warna,pemda,sla) VALUES ${proj.placeholders}`,
    proj.params,
  )

  const items = bulk(
    seedItems.map((i) => [
      i.judul, i.modul, i.proyek, i.horizon, i.status, i.pic, i.verif,
      i.tgl, i.nilai ?? 0, i.risiko, i.dok ?? 0, i.blockReason ?? null,
    ]),
  )
  await sql.query(
    `INSERT INTO items (judul,modul,proyek,horizon,status,pic,verif,tgl,nilai,risiko,dok,block_reason) VALUES ${items.placeholders}`,
    items.params,
  )

  const permits = bulk(
    seedPermits.map((p) => [p.proyek, p.kode, p.nama, p.prasyarat, p.status, p.tgl, p.pic, p.verif, p.dok]),
  )
  await sql.query(
    `INSERT INTO permits (proyek,kode,nama,prasyarat,status,tgl,pic,verif,dok) VALUES ${permits.placeholders}`,
    permits.params,
  )

  return { seeded: true }
}

/** Schema + seed in one call; used by /api/bootstrap. */
export async function ensureReady(): Promise<{ seeded: boolean }> {
  await ensureSchema()
  return seedIfEmpty()
}

// ---- read helpers ----

const isoDate = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '')

export async function getProjects() {
  const sql = db()
  const rows = (await sql`SELECT * FROM projects ORDER BY nama`) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: r.id, nama: r.nama, lok: r.lok, ha: r.ha, unit: Number(r.unit),
    fase: r.fase, warna: r.warna, pemda: r.pemda, sla: r.sla,
  }))
}

export async function getItems() {
  const sql = db()
  const rows = (await sql`SELECT * FROM items ORDER BY id`) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id),
    judul: r.judul, modul: r.modul, proyek: r.proyek, horizon: r.horizon,
    status: r.status, pic: r.pic, verif: r.verif, tgl: isoDate(r.tgl),
    nilai: Number(r.nilai), risiko: r.risiko, dok: Number(r.dok),
    blockReason: r.block_reason ?? null,
  }))
}

export async function getPermits() {
  const sql = db()
  const rows = (await sql`SELECT * FROM permits ORDER BY proyek, id`) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id), proyek: r.proyek, kode: r.kode, nama: r.nama,
    prasyarat: r.prasyarat, status: r.status, tgl: isoDate(r.tgl),
    pic: r.pic, verif: r.verif, dok: Number(r.dok),
  }))
}
