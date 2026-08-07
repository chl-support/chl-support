/**
 * Neon Postgres access over HTTP (serverless-friendly — no connection pooling
 * to manage). Exposes schema creation, one-time seeding, and the small set of
 * queries the API needs.
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { databaseUrl } from './env.js'
import { seedItems, seedPermits, seedProjects, seedTim } from './seed.js'

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
  await sql`
    CREATE TABLE IF NOT EXISTS tim (
      id         SERIAL PRIMARY KEY,
      jabatan    TEXT NOT NULL,
      nama       TEXT NOT NULL,
      kontak     TEXT DEFAULT '',
      catatan    TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS audit_docs (
      id           SERIAL PRIMARY KEY,
      judul        TEXT DEFAULT '',
      filename     TEXT NOT NULL,
      url          TEXT NOT NULL,
      size         INTEGER DEFAULT 0,
      content_type TEXT DEFAULT '',
      catatan      TEXT DEFAULT '',
      uploaded_at  TIMESTAMPTZ DEFAULT now()
    )`

  // Alur tanda tangan lintas divisi untuk tiap dokumen audit — satu baris per
  // langkah, dikerjakan berurutan menurut kolom "urut".
  await sql`
    CREATE TABLE IF NOT EXISTS audit_signoffs (
      id         SERIAL PRIMARY KEY,
      doc_id     INTEGER NOT NULL,
      urut       INTEGER NOT NULL DEFAULT 1,
      divisi     TEXT NOT NULL,
      pic        TEXT DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'Menunggu',
      catatan    TEXT DEFAULT '',
      tenggat    DATE,
      signed_at  TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS audit_signoffs_doc_idx ON audit_signoffs (doc_id, urut)`

  // Divisi "Head Legal" dinamai ulang menjadi "Legal" — samakan alur yang sudah
  // tersimpan agar labelnya konsisten dengan alur baru (idempoten).
  await sql`UPDATE audit_signoffs SET divisi='Legal' WHERE divisi='Head Legal'`

  // Fallback storage: when Vercel Blob is not connected, the file bytes are kept
  // (base64) in these columns so uploads still work with only Neon configured.
  // Added via ALTER so deployments created before the fallback pick them up too.
  await sql`ALTER TABLE audit_docs ADD COLUMN IF NOT EXISTS data TEXT`
  await sql`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS data TEXT`
  await sql`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT ''`

  // Permits are grouped by project phase (Pra-Akuisisi … Serah Terima).
  await sql`ALTER TABLE permits ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT ''`
}

/** Seeds the real team directory the first time the table is empty. */
export async function seedTimIfEmpty(): Promise<void> {
  const sql = db()
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM tim`) as { n: number }[]
  if (n > 0 || !seedTim.length) return
  const t = bulk(seedTim.map((r) => [r.jabatan, r.nama, r.kontak, r.catatan]))
  await sql.query(`INSERT INTO tim (jabatan,nama,kontak,catatan) VALUES ${t.placeholders}`, t.params)
}

/**
 * Inserts seed data only when the projects table is empty, so re-running is
 * safe. With demo data cleared, the seed arrays are empty and nothing is
 * inserted — each insert is guarded so empty arrays never build a bad query.
 */
export async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  const sql = db()
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM projects`) as { n: number }[]
  if (n > 0) return { seeded: false }

  if (seedProjects.length) {
    const proj = bulk(
      seedProjects.map((p) => [p.id, p.nama, p.lok, p.ha, p.unit, p.fase, p.warna, p.pemda, p.sla]),
    )
    await sql.query(
      `INSERT INTO projects (id,nama,lok,ha,unit,fase,warna,pemda,sla) VALUES ${proj.placeholders}`,
      proj.params,
    )
  }

  if (seedItems.length) {
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
  }

  if (seedPermits.length) {
    const permits = bulk(
      seedPermits.map((p) => [p.proyek, p.kode, p.nama, p.prasyarat, p.status, p.tgl, p.pic, p.verif, p.dok]),
    )
    await sql.query(
      `INSERT INTO permits (proyek,kode,nama,prasyarat,status,tgl,pic,verif,dok) VALUES ${permits.placeholders}`,
      permits.params,
    )
  }

  return { seeded: seedProjects.length > 0 }
}

/** Schema + seed in one call; used by /api/bootstrap. */
export async function ensureReady(): Promise<{ seeded: boolean }> {
  await ensureSchema()
  const r = await seedIfEmpty()
  await seedTimIfEmpty()
  return r
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

export async function upsertProject(p: {
  id: string
  nama: string
  lok?: string
  ha?: string
  unit?: number
  fase?: string
  warna?: string
  pemda?: string
  sla?: string
}): Promise<string> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO projects (id, nama, lok, ha, unit, fase, warna, pemda, sla)
    VALUES (${p.id}, ${p.nama}, ${p.lok ?? ''}, ${p.ha ?? ''}, ${p.unit ?? 0},
            ${p.fase ?? ''}, ${p.warna ?? '#0F5C6B'}, ${p.pemda ?? ''}, ${p.sla ?? ''})
    ON CONFLICT (id) DO UPDATE SET
      nama=EXCLUDED.nama, lok=EXCLUDED.lok, ha=EXCLUDED.ha, unit=EXCLUDED.unit,
      fase=EXCLUDED.fase, warna=EXCLUDED.warna, pemda=EXCLUDED.pemda, sla=EXCLUDED.sla
    RETURNING id`) as { id: string }[]
  return r.id
}

/** Removes a project and everything scoped to it (items + permits). */
export async function deleteProject(id: string): Promise<void> {
  const sql = db()
  await sql`DELETE FROM items WHERE proyek=${id}`
  await sql`DELETE FROM permits WHERE proyek=${id}`
  await sql`DELETE FROM projects WHERE id=${id}`
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

export async function getPermits(proyek?: string) {
  const sql = db()
  const rows = (
    proyek
      ? await sql`SELECT * FROM permits WHERE proyek=${proyek} ORDER BY id`
      : await sql`SELECT * FROM permits ORDER BY proyek, id`
  ) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id), proyek: r.proyek, fase: String(r.fase ?? ''), kode: r.kode, nama: r.nama,
    prasyarat: r.prasyarat, status: r.status, tgl: isoDate(r.tgl),
    pic: r.pic, verif: r.verif, dok: Number(r.dok),
  }))
}

export async function upsertPermit(p: {
  id?: number
  proyek: string
  fase: string
  kode: string
  nama: string
  prasyarat?: string
  status: string
  tgl?: string | null
  pic?: string
  verif?: string
  dok?: number
}): Promise<number> {
  const sql = db()
  const prasyarat = p.prasyarat ?? '—'
  const tgl = p.tgl || null
  const pic = p.pic ?? ''
  const verif = p.verif ?? ''
  const dok = p.dok ?? 0
  if (p.id) {
    const [r] = (await sql`
      UPDATE permits SET proyek=${p.proyek}, fase=${p.fase}, kode=${p.kode}, nama=${p.nama},
        prasyarat=${prasyarat}, status=${p.status}, tgl=${tgl}, pic=${pic}, verif=${verif}, dok=${dok}
      WHERE id=${p.id} RETURNING id`) as { id: number }[]
    return r?.id ?? 0
  }
  const [r] = (await sql`
    INSERT INTO permits (proyek, fase, kode, nama, prasyarat, status, tgl, pic, verif, dok)
    VALUES (${p.proyek}, ${p.fase}, ${p.kode}, ${p.nama}, ${prasyarat}, ${p.status}, ${tgl}, ${pic}, ${verif}, ${dok})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deletePermit(id: number): Promise<void> {
  await db()`DELETE FROM permits WHERE id=${id}`
}

// ---- Tim (menu Catatan/direktori) ----

export interface TimRow {
  id: number
  jabatan: string
  nama: string
  kontak: string
  catatan: string
}

export async function getTim(): Promise<TimRow[]> {
  const sql = db()
  const rows = (await sql`SELECT * FROM tim ORDER BY id`) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id),
    jabatan: String(r.jabatan ?? ''),
    nama: String(r.nama ?? ''),
    kontak: String(r.kontak ?? ''),
    catatan: String(r.catatan ?? ''),
  }))
}

export async function upsertTim(row: {
  id?: number
  jabatan: string
  nama: string
  kontak?: string
  catatan?: string
}): Promise<number> {
  const sql = db()
  const kontak = row.kontak ?? ''
  const catatan = row.catatan ?? ''
  if (row.id) {
    const [r] = (await sql`
      UPDATE tim SET jabatan=${row.jabatan}, nama=${row.nama}, kontak=${kontak},
        catatan=${catatan}, updated_at=now()
      WHERE id=${row.id} RETURNING id`) as { id: number }[]
    return r?.id ?? 0
  }
  const [r] = (await sql`
    INSERT INTO tim (jabatan, nama, kontak, catatan)
    VALUES (${row.jabatan}, ${row.nama}, ${kontak}, ${catatan})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deleteTim(id: number): Promise<void> {
  await db()`DELETE FROM tim WHERE id=${id}`
}

// ---- Internal Audit — dokumen (Blob + Neon) ----

export interface SignoffRow {
  id: number
  docId: number
  urut: number
  divisi: string
  pic: string
  status: string
  catatan: string
  tenggat: string
  signedAt: string
  updatedAt: string
}

export interface AuditDocRow {
  id: number
  judul: string
  filename: string
  url: string
  size: number
  contentType: string
  catatan: string
  uploadedAt: string
  alur: SignoffRow[]
}

const isoTime = (v: unknown): string =>
  v instanceof Date ? v.toISOString() : v ? String(v) : ''

function toSignoff(r: Record<string, unknown>): SignoffRow {
  return {
    id: Number(r.id),
    docId: Number(r.doc_id),
    urut: Number(r.urut ?? 1),
    divisi: String(r.divisi ?? ''),
    pic: String(r.pic ?? ''),
    status: String(r.status ?? 'Menunggu'),
    catatan: String(r.catatan ?? ''),
    tenggat: r.tenggat ? isoDate(r.tenggat) : '',
    signedAt: isoTime(r.signed_at),
    updatedAt: isoTime(r.updated_at),
  }
}

/** Every sign-off step in the system, grouped by document id. */
async function getSignoffsByDoc(): Promise<Map<number, SignoffRow[]>> {
  const sql = db()
  const rows = (await sql`
    SELECT * FROM audit_signoffs ORDER BY doc_id, urut, id`) as Record<string, unknown>[]
  const map = new Map<number, SignoffRow[]>()
  for (const r of rows) {
    const step = toSignoff(r)
    const list = map.get(step.docId)
    if (list) list.push(step)
    else map.set(step.docId, [step])
  }
  return map
}

export async function getAuditDocs(): Promise<AuditDocRow[]> {
  const sql = db()
  const [rows, alur] = await Promise.all([
    sql`
      SELECT id, judul, filename, url, size, content_type, catatan, uploaded_at
      FROM audit_docs ORDER BY uploaded_at DESC` as Promise<Record<string, unknown>[]>,
    getSignoffsByDoc(),
  ])
  return rows.map((r) => {
    const id = Number(r.id)
    const stored = String(r.url ?? '')
    return {
      id,
      judul: String(r.judul ?? ''),
      filename: String(r.filename ?? ''),
      // Blob-hosted files carry an absolute URL; DB-stored files get a download route.
      url: stored || `/api/audit?download=${id}`,
      size: Number(r.size ?? 0),
      contentType: String(r.content_type ?? ''),
      catatan: String(r.catatan ?? ''),
      uploadedAt: isoTime(r.uploaded_at),
      alur: alur.get(id) ?? [],
    }
  })
}

// ---- Alur tanda tangan (audit_signoffs) ----

/** Appends one step at the end of a document's chain; returns the new row id. */
export async function insertSignoff(step: {
  docId: number
  divisi: string
  pic?: string
  tenggat?: string | null
  urut?: number
}): Promise<number> {
  const sql = db()
  let urut = step.urut
  if (!urut) {
    const [r] = (await sql`
      SELECT COALESCE(max(urut), 0)::int AS n FROM audit_signoffs WHERE doc_id=${step.docId}`) as {
      n: number
    }[]
    urut = (r?.n ?? 0) + 1
  }
  const [row] = (await sql`
    INSERT INTO audit_signoffs (doc_id, urut, divisi, pic, status, tenggat)
    VALUES (${step.docId}, ${urut}, ${step.divisi}, ${step.pic ?? ''}, 'Menunggu',
            ${step.tenggat || null})
    RETURNING id`) as { id: number }[]
  return row.id
}

/** Creates the whole chain for a freshly uploaded document, in the order given. */
export async function insertSignoffChain(
  docId: number,
  divisi: string[],
  tenggat?: string | null,
): Promise<number> {
  const bersih = divisi.map((d) => d.trim()).filter(Boolean)
  if (!bersih.length) return 0
  const sql = db()
  const rows = bersih.map((d, i) => [docId, i + 1, d, '', 'Menunggu', tenggat || null])
  const { placeholders, params } = bulk(rows)
  await sql.query(
    `INSERT INTO audit_signoffs (doc_id, urut, divisi, pic, status, tenggat) VALUES ${placeholders}`,
    params,
  )
  return bersih.length
}

/**
 * Patches one step. `signed_at` is stamped when the step becomes
 * "Ditandatangani" and cleared whenever it moves back to any other status.
 */
export async function updateSignoff(
  id: number,
  patch: { status?: string; pic?: string; catatan?: string; tenggat?: string | null },
): Promise<SignoffRow | null> {
  const sql = db()
  const [current] = (await sql`SELECT * FROM audit_signoffs WHERE id=${id}`) as Record<
    string,
    unknown
  >[]
  if (!current) return null
  const status = patch.status ?? String(current.status ?? 'Menunggu')
  const pic = patch.pic ?? String(current.pic ?? '')
  const catatan = patch.catatan ?? String(current.catatan ?? '')
  const tenggat =
    patch.tenggat === undefined ? (current.tenggat ? isoDate(current.tenggat) : null) : patch.tenggat || null
  const signedAt = status === 'Ditandatangani' ? new Date().toISOString() : null
  const [row] = (await sql`
    UPDATE audit_signoffs
       SET status=${status}, pic=${pic}, catatan=${catatan}, tenggat=${tenggat},
           signed_at=${signedAt}, updated_at=now()
     WHERE id=${id}
     RETURNING *`) as Record<string, unknown>[]
  return row ? toSignoff(row) : null
}

export async function deleteSignoff(id: number): Promise<void> {
  const sql = db()
  const [row] = (await sql`SELECT doc_id FROM audit_signoffs WHERE id=${id}`) as {
    doc_id: number
  }[]
  await sql`DELETE FROM audit_signoffs WHERE id=${id}`
  if (row) await renumberSignoffs(Number(row.doc_id))
}

/** Closes gaps in `urut` so the chain stays 1..n after a deletion. */
async function renumberSignoffs(docId: number): Promise<void> {
  await db()`
    UPDATE audit_signoffs s
       SET urut = t.baris
      FROM (SELECT id, row_number() OVER (ORDER BY urut, id) AS baris
              FROM audit_signoffs WHERE doc_id=${docId}) t
     WHERE s.id = t.id AND s.urut <> t.baris`
}

export async function insertAuditDoc(doc: {
  judul: string
  filename: string
  url: string
  size: number
  contentType: string
  catatan: string
  /** base64 of the file bytes — set only for the Neon fallback (no Blob). */
  data?: string | null
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO audit_docs (judul, filename, url, size, content_type, catatan, data)
    VALUES (${doc.judul}, ${doc.filename}, ${doc.url}, ${doc.size}, ${doc.contentType},
            ${doc.catatan}, ${doc.data ?? null})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function getAuditDocUrl(id: number): Promise<string | null> {
  const sql = db()
  const [r] = (await sql`SELECT url FROM audit_docs WHERE id=${id}`) as { url: string }[]
  return r?.url ?? null
}

/** Bytes + metadata for a DB-stored audit file, or null when it lives in Blob. */
export async function getAuditDocData(
  id: number,
): Promise<{ data: string; filename: string; contentType: string } | null> {
  const sql = db()
  const [r] = (await sql`
    SELECT data, filename, content_type FROM audit_docs WHERE id=${id}`) as {
    data: string | null
    filename: string
    content_type: string
  }[]
  if (!r || !r.data) return null
  return { data: r.data, filename: r.filename, contentType: r.content_type || 'application/octet-stream' }
}

export async function deleteAuditDoc(id: number): Promise<void> {
  const sql = db()
  await sql`DELETE FROM audit_signoffs WHERE doc_id=${id}`
  await sql`DELETE FROM audit_docs WHERE id=${id}`
}

// ---- Lampiran item (attachments) — Blob dengan fallback Neon ----

/**
 * Records an attachment row. Pass `data` (base64) to store the bytes in Neon
 * when Blob is unavailable; leave it null when `url` already points to Blob.
 * Returns the new row id (used to build the download route for the fallback).
 */
export async function insertAttachment(a: {
  itemId: number | null
  url: string
  filename: string
  size: number
  contentType?: string
  data?: string | null
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO attachments (item_id, url, filename, size, content_type, data)
    VALUES (${a.itemId}, ${a.url}, ${a.filename}, ${a.size}, ${a.contentType ?? ''}, ${a.data ?? null})
    RETURNING id`) as { id: number }[]
  return r.id
}

/** Bytes + metadata for a DB-stored attachment, or null when it lives in Blob. */
export async function getAttachmentData(
  id: number,
): Promise<{ data: string; filename: string; contentType: string } | null> {
  const sql = db()
  const [r] = (await sql`
    SELECT data, filename, content_type FROM attachments WHERE id=${id}`) as {
    data: string | null
    filename: string
    content_type: string
  }[]
  if (!r || !r.data) return null
  return { data: r.data, filename: r.filename, contentType: r.content_type || 'application/octet-stream' }
}
