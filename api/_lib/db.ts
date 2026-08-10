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
  // Berkas KPR yang dikawal tim Collection, dari booking fee sampai angsuran.
  await sql`
    CREATE TABLE IF NOT EXISTS kpr_berkas (
      id              SERIAL PRIMARY KEY,
      proyek          TEXT NOT NULL,
      nama            TEXT NOT NULL,
      unit            TEXT DEFAULT '',
      telepon         TEXT DEFAULT '',
      email           TEXT DEFAULT '',
      tahap           TEXT NOT NULL DEFAULT 'booking',
      status          TEXT NOT NULL DEFAULT 'Berjalan',
      bank            TEXT DEFAULT '',
      nilai           BIGINT DEFAULT 0,
      booking_tgl     DATE,
      tenggat_dokumen DATE,
      sp3k_tgl        DATE,
      sp3k_berlaku    INTEGER DEFAULT 30,
      akad_tgl        DATE,
      pic             TEXT DEFAULT '',
      catatan         TEXT DEFAULT '',
      created_at      TIMESTAMPTZ DEFAULT now(),
      updated_at      TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS kpr_berkas_proyek_idx ON kpr_berkas (proyek)`

  // Checklist dokumen per berkas — satu baris per jenis dokumen.
  await sql`
    CREATE TABLE IF NOT EXISTS kpr_dokumen (
      id         SERIAL PRIMARY KEY,
      kpr_id     INTEGER NOT NULL,
      jenis      TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'Belum',
      tgl_terima DATE,
      catatan    TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS kpr_dokumen_kpr_idx ON kpr_dokumen (kpr_id)`

  // Riwayat follow-up ke customer — jejak setiap kontak beserta pesannya.
  await sql`
    CREATE TABLE IF NOT EXISTS kpr_followup (
      id         SERIAL PRIMARY KEY,
      kpr_id     INTEGER NOT NULL,
      tingkat    INTEGER NOT NULL DEFAULT 0,
      kanal      TEXT NOT NULL DEFAULT 'WhatsApp',
      pesan      TEXT DEFAULT '',
      hasil      TEXT DEFAULT '',
      oleh       TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS kpr_followup_kpr_idx ON kpr_followup (kpr_id)`

  // Agenda korporasi pada bagan Corporate — satu baris per aksi korporasi
  // (RUPST/RUPS Biasa → perubahan direksi, modal, anggaran dasar, dll).
  await sql`
    CREATE TABLE IF NOT EXISTS corporates (
      id         SERIAL PRIMARY KEY,
      proyek     TEXT NOT NULL,
      event      TEXT NOT NULL,
      action     TEXT NOT NULL,
      judul      TEXT DEFAULT '',
      tgl        DATE,
      pic        TEXT DEFAULT '',
      nilai      BIGINT DEFAULT 0,
      kendala    TEXT DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'Belum Dimulai',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS corporates_proyek_idx ON corporates (proyek)`

  // Lampiran bukti tiap agenda korporasi (Blob, dengan cadangan bytes di Neon).
  await sql`
    CREATE TABLE IF NOT EXISTS corp_docs (
      id           SERIAL PRIMARY KEY,
      corp_id      INTEGER NOT NULL,
      filename     TEXT NOT NULL,
      url          TEXT NOT NULL,
      size         INTEGER DEFAULT 0,
      content_type TEXT DEFAULT '',
      data         TEXT,
      uploaded_at  TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS corp_docs_corp_idx ON corp_docs (corp_id)`

  // Komentar & jejak audit, dipakai bersama oleh beberapa jenis catatan.
  // `entity` menyimpan jenisnya ('corp', 'item'), `entity_id` kuncinya.
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id         SERIAL PRIMARY KEY,
      entity     TEXT NOT NULL,
      entity_id  INTEGER NOT NULL,
      aktor      TEXT DEFAULT '',
      teks       TEXT NOT NULL,
      -- 'komentar' ditulis orang; 'sistem' dicatat otomatis saat data berubah.
      jenis      TEXT NOT NULL DEFAULT 'komentar',
      created_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS comments_entity_idx ON comments (entity, entity_id)`

  // Bidang tanah pada bagan Land Acquisition. Tahap & hasil akhir diturunkan
  // dari kolom "jenis" di frontend, jadi tidak ada kolom turunan di sini.
  await sql`
    CREATE TABLE IF NOT EXISTS lands (
      id         SERIAL PRIMARY KEY,
      proyek     TEXT NOT NULL,
      kode       TEXT DEFAULT '',
      nama       TEXT NOT NULL,
      pemilik    TEXT DEFAULT '',
      luas       INTEGER DEFAULT 0,
      jenis      TEXT NOT NULL,
      no_dok     TEXT DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'Belum Dimulai',
      tgl        DATE,
      pic        TEXT DEFAULT '',
      catatan    TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    )`
  await sql`CREATE INDEX IF NOT EXISTS lands_proyek_idx ON lands (proyek)`
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

  // Divisi "Head Legal" dinamai ulang menjadi "Legal" — samakan data yang sudah
  // tersimpan (alur tanda tangan & direktori tim) agar labelnya konsisten di
  // seluruh aplikasi. Keduanya idempoten, jadi aman dijalankan tiap request.
  await sql`UPDATE audit_signoffs SET divisi='Legal' WHERE divisi='Head Legal'`
  await sql`UPDATE tim SET jabatan='Legal' WHERE jabatan IN ('Head Legal', 'Head of Legal')`

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

/** Removes a project and everything scoped to it (items, permits, lands, corporate). */
export async function deleteProject(id: string): Promise<void> {
  const sql = db()
  await sql`DELETE FROM items WHERE proyek=${id}`
  await sql`DELETE FROM permits WHERE proyek=${id}`
  await sql`DELETE FROM lands WHERE proyek=${id}`
  // Evidence and audit trail hang off the agenda rows, so clear them first.
  await sql`
    DELETE FROM corp_docs WHERE corp_id IN (SELECT id FROM corporates WHERE proyek=${id})`
  await sql`
    DELETE FROM comments WHERE entity='corp'
      AND entity_id IN (SELECT id FROM corporates WHERE proyek=${id})`
  await sql`DELETE FROM corporates WHERE proyek=${id}`
  // Checklist dan riwayat follow-up menggantung pada berkas KPR-nya.
  await sql`
    DELETE FROM kpr_dokumen WHERE kpr_id IN (SELECT id FROM kpr_berkas WHERE proyek=${id})`
  await sql`
    DELETE FROM kpr_followup WHERE kpr_id IN (SELECT id FROM kpr_berkas WHERE proyek=${id})`
  await sql`DELETE FROM kpr_berkas WHERE proyek=${id}`
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

// ---- Komentar & jejak audit (dipakai bersama beberapa entitas) ----

export interface CommentRow {
  id: number
  entity: string
  entityId: number
  aktor: string
  teks: string
  jenis: string
  createdAt: string
}

const toComment = (r: Record<string, unknown>): CommentRow => ({
  id: Number(r.id),
  entity: String(r.entity ?? ''),
  entityId: Number(r.entity_id),
  aktor: String(r.aktor ?? ''),
  teks: String(r.teks ?? ''),
  jenis: String(r.jenis ?? 'komentar'),
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
})

export async function getComments(entity: string, entityId: number): Promise<CommentRow[]> {
  const sql = db()
  const rows = (await sql`
    SELECT * FROM comments WHERE entity=${entity} AND entity_id=${entityId}
    ORDER BY created_at DESC, id DESC`) as Record<string, unknown>[]
  return rows.map(toComment)
}

/** Every comment for a set of ids, grouped — avoids one query per record. */
async function getCommentsByEntity(entity: string): Promise<Map<number, CommentRow[]>> {
  const sql = db()
  const rows = (await sql`
    SELECT * FROM comments WHERE entity=${entity}
    ORDER BY created_at DESC, id DESC`) as Record<string, unknown>[]
  const map = new Map<number, CommentRow[]>()
  for (const r of rows) {
    const c = toComment(r)
    const list = map.get(c.entityId)
    if (list) list.push(c)
    else map.set(c.entityId, [c])
  }
  return map
}

export async function insertComment(c: {
  entity: string
  entityId: number
  aktor?: string
  teks: string
  jenis?: string
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO comments (entity, entity_id, aktor, teks, jenis)
    VALUES (${c.entity}, ${c.entityId}, ${c.aktor ?? ''}, ${c.teks}, ${c.jenis ?? 'komentar'})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deleteComment(id: number): Promise<void> {
  await db()`DELETE FROM comments WHERE id=${id}`
}

// ---- Collection — berkas KPR, checklist dokumen, follow-up ----

export interface KprDokumenRow {
  id: number
  kprId: number
  jenis: string
  status: string
  tglTerima: string
  catatan: string
}

export interface KprFollowupRow {
  id: number
  kprId: number
  tingkat: number
  kanal: string
  pesan: string
  hasil: string
  oleh: string
  createdAt: string
}

export interface KprBerkasRow {
  id: number
  proyek: string
  nama: string
  unit: string
  telepon: string
  email: string
  tahap: string
  status: string
  bank: string
  nilai: number
  bookingTgl: string
  tenggatDokumen: string
  sp3kTgl: string
  sp3kBerlaku: number
  akadTgl: string
  pic: string
  catatan: string
  dokumen: KprDokumenRow[]
  followup: KprFollowupRow[]
}

const toKprDok = (r: Record<string, unknown>): KprDokumenRow => ({
  id: Number(r.id),
  kprId: Number(r.kpr_id),
  jenis: String(r.jenis ?? ''),
  status: String(r.status ?? 'Belum'),
  tglTerima: r.tgl_terima ? isoDate(r.tgl_terima) : '',
  catatan: String(r.catatan ?? ''),
})

const toKprFu = (r: Record<string, unknown>): KprFollowupRow => ({
  id: Number(r.id),
  kprId: Number(r.kpr_id),
  tingkat: Number(r.tingkat ?? 0),
  kanal: String(r.kanal ?? ''),
  pesan: String(r.pesan ?? ''),
  hasil: String(r.hasil ?? ''),
  oleh: String(r.oleh ?? ''),
  createdAt: isoTime(r.created_at),
})

/** Groups child rows by their parent id in one pass. */
function groupBy<T>(rows: T[], key: (row: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const row of rows) {
    const k = key(row)
    const list = map.get(k)
    if (list) list.push(row)
    else map.set(k, [row])
  }
  return map
}

export async function getKprBerkas(proyek?: string): Promise<KprBerkasRow[]> {
  const sql = db()
  const [rows, dok, fu] = await Promise.all([
    (proyek
      ? sql`SELECT * FROM kpr_berkas WHERE proyek=${proyek} ORDER BY id DESC`
      : sql`SELECT * FROM kpr_berkas ORDER BY proyek, id DESC`) as Promise<Record<string, unknown>[]>,
    sql`SELECT * FROM kpr_dokumen ORDER BY id` as Promise<Record<string, unknown>[]>,
    sql`SELECT * FROM kpr_followup ORDER BY created_at DESC, id DESC` as Promise<
      Record<string, unknown>[]
    >,
  ])
  const dokMap = groupBy(dok.map(toKprDok), (d) => d.kprId)
  const fuMap = groupBy(fu.map(toKprFu), (f) => f.kprId)
  return rows.map((r) => {
    const id = Number(r.id)
    return {
      id,
      proyek: String(r.proyek ?? ''),
      nama: String(r.nama ?? ''),
      unit: String(r.unit ?? ''),
      telepon: String(r.telepon ?? ''),
      email: String(r.email ?? ''),
      tahap: String(r.tahap ?? 'booking'),
      status: String(r.status ?? 'Berjalan'),
      bank: String(r.bank ?? ''),
      nilai: Number(r.nilai ?? 0),
      bookingTgl: r.booking_tgl ? isoDate(r.booking_tgl) : '',
      tenggatDokumen: r.tenggat_dokumen ? isoDate(r.tenggat_dokumen) : '',
      sp3kTgl: r.sp3k_tgl ? isoDate(r.sp3k_tgl) : '',
      sp3kBerlaku: Number(r.sp3k_berlaku ?? 30),
      akadTgl: r.akad_tgl ? isoDate(r.akad_tgl) : '',
      pic: String(r.pic ?? ''),
      catatan: String(r.catatan ?? ''),
      dokumen: dokMap.get(id) ?? [],
      followup: fuMap.get(id) ?? [],
    }
  })
}

export async function upsertKprBerkas(b: {
  id?: number
  proyek: string
  nama: string
  unit?: string
  telepon?: string
  email?: string
  tahap?: string
  status?: string
  bank?: string
  nilai?: number
  bookingTgl?: string | null
  tenggatDokumen?: string | null
  sp3kTgl?: string | null
  sp3kBerlaku?: number
  akadTgl?: string | null
  pic?: string
  catatan?: string
}): Promise<number> {
  const sql = db()
  const v = {
    unit: b.unit ?? '',
    telepon: b.telepon ?? '',
    email: b.email ?? '',
    tahap: b.tahap ?? 'booking',
    status: b.status ?? 'Berjalan',
    bank: b.bank ?? '',
    nilai: b.nilai ?? 0,
    booking: b.bookingTgl || null,
    tenggat: b.tenggatDokumen || null,
    sp3k: b.sp3kTgl || null,
    berlaku: b.sp3kBerlaku ?? 30,
    akad: b.akadTgl || null,
    pic: b.pic ?? '',
    catatan: b.catatan ?? '',
  }
  if (b.id) {
    const [r] = (await sql`
      UPDATE kpr_berkas SET proyek=${b.proyek}, nama=${b.nama}, unit=${v.unit}, telepon=${v.telepon},
        email=${v.email}, tahap=${v.tahap}, status=${v.status}, bank=${v.bank}, nilai=${v.nilai},
        booking_tgl=${v.booking}, tenggat_dokumen=${v.tenggat}, sp3k_tgl=${v.sp3k},
        sp3k_berlaku=${v.berlaku}, akad_tgl=${v.akad}, pic=${v.pic}, catatan=${v.catatan},
        updated_at=now()
      WHERE id=${b.id} RETURNING id`) as { id: number }[]
    return r?.id ?? 0
  }
  const [r] = (await sql`
    INSERT INTO kpr_berkas (proyek, nama, unit, telepon, email, tahap, status, bank, nilai,
      booking_tgl, tenggat_dokumen, sp3k_tgl, sp3k_berlaku, akad_tgl, pic, catatan)
    VALUES (${b.proyek}, ${b.nama}, ${v.unit}, ${v.telepon}, ${v.email}, ${v.tahap}, ${v.status},
      ${v.bank}, ${v.nilai}, ${v.booking}, ${v.tenggat}, ${v.sp3k}, ${v.berlaku}, ${v.akad},
      ${v.pic}, ${v.catatan})
    RETURNING id`) as { id: number }[]
  return r.id
}

/** Creates the standard checklist rows for a new file, skipping existing ones. */
export async function seedKprDokumen(kprId: number, jenisList: string[]): Promise<void> {
  if (!jenisList.length) return
  const sql = db()
  const rows = (await sql`SELECT jenis FROM kpr_dokumen WHERE kpr_id=${kprId}`) as {
    jenis: string
  }[]
  const ada = new Set(rows.map((r) => r.jenis))
  const baru = jenisList.filter((j) => !ada.has(j))
  if (!baru.length) return
  const { placeholders, params } = bulk(baru.map((j) => [kprId, j, 'Belum']))
  await sql.query(
    `INSERT INTO kpr_dokumen (kpr_id, jenis, status) VALUES ${placeholders}`,
    params,
  )
}

export async function updateKprDokumen(
  id: number,
  patch: { status?: string; catatan?: string },
): Promise<KprDokumenRow | null> {
  const sql = db()
  const [cur] = (await sql`SELECT * FROM kpr_dokumen WHERE id=${id}`) as Record<string, unknown>[]
  if (!cur) return null
  const status = patch.status ?? String(cur.status ?? 'Belum')
  const catatan = patch.catatan ?? String(cur.catatan ?? '')
  // Tanggal terima distempel saat dokumen diterima, dihapus saat status mundur.
  const tglTerima = status === 'Diterima' ? new Date().toISOString().slice(0, 10) : null
  const [r] = (await sql`
    UPDATE kpr_dokumen SET status=${status}, catatan=${catatan}, tgl_terima=${tglTerima},
      updated_at=now()
    WHERE id=${id} RETURNING *`) as Record<string, unknown>[]
  return r ? toKprDok(r) : null
}

export async function insertKprDokumen(d: {
  kprId: number
  jenis: string
  catatan?: string
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO kpr_dokumen (kpr_id, jenis, status, catatan)
    VALUES (${d.kprId}, ${d.jenis}, 'Belum', ${d.catatan ?? ''})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deleteKprDokumen(id: number): Promise<void> {
  await db()`DELETE FROM kpr_dokumen WHERE id=${id}`
}

export async function insertKprFollowup(f: {
  kprId: number
  tingkat: number
  kanal: string
  pesan: string
  hasil?: string
  oleh?: string
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO kpr_followup (kpr_id, tingkat, kanal, pesan, hasil, oleh)
    VALUES (${f.kprId}, ${f.tingkat}, ${f.kanal}, ${f.pesan}, ${f.hasil ?? ''}, ${f.oleh ?? ''})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deleteKprFollowup(id: number): Promise<void> {
  await db()`DELETE FROM kpr_followup WHERE id=${id}`
}

/** Removes a file together with its checklist and follow-up history. */
export async function deleteKprBerkas(id: number): Promise<void> {
  const sql = db()
  await sql`DELETE FROM kpr_dokumen WHERE kpr_id=${id}`
  await sql`DELETE FROM kpr_followup WHERE kpr_id=${id}`
  await sql`DELETE FROM kpr_berkas WHERE id=${id}`
}

// ---- Corporate — agenda & aksi korporasi ----

export interface CorpDocRow {
  id: number
  corpId: number
  filename: string
  url: string
  size: number
  contentType: string
  uploadedAt: string
}

export interface CorporateRow {
  id: number
  proyek: string
  event: string
  action: string
  judul: string
  tgl: string
  pic: string
  nilai: number
  kendala: string
  status: string
  createdAt: string
  lampiran: CorpDocRow[]
  komentar: CommentRow[]
}

function toCorpDoc(r: Record<string, unknown>): CorpDocRow {
  const id = Number(r.id)
  const stored = String(r.url ?? '')
  return {
    id,
    corpId: Number(r.corp_id),
    filename: String(r.filename ?? ''),
    // Blob-hosted files carry an absolute URL; DB-stored files get a download route.
    url: stored || `/api/corporate?download=${id}`,
    size: Number(r.size ?? 0),
    contentType: String(r.content_type ?? ''),
    uploadedAt: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString() : String(r.uploaded_at ?? ''),
  }
}

export async function getCorporates(proyek?: string): Promise<CorporateRow[]> {
  const sql = db()
  const [rows, docs, komentar] = await Promise.all([
    (proyek
      ? sql`SELECT * FROM corporates WHERE proyek=${proyek} ORDER BY tgl DESC NULLS LAST, id DESC`
      : sql`SELECT * FROM corporates ORDER BY proyek, tgl DESC NULLS LAST, id DESC`) as Promise<
      Record<string, unknown>[]
    >,
    sql`SELECT * FROM corp_docs ORDER BY uploaded_at DESC, id DESC` as Promise<
      Record<string, unknown>[]
    >,
    getCommentsByEntity('corp'),
  ])
  const byCorp = new Map<number, CorpDocRow[]>()
  for (const r of docs) {
    const d = toCorpDoc(r)
    const list = byCorp.get(d.corpId)
    if (list) list.push(d)
    else byCorp.set(d.corpId, [d])
  }
  return rows.map((r) => {
    const id = Number(r.id)
    return {
      id,
      proyek: String(r.proyek ?? ''),
      event: String(r.event ?? ''),
      action: String(r.action ?? ''),
      judul: String(r.judul ?? ''),
      tgl: r.tgl ? isoDate(r.tgl) : '',
      pic: String(r.pic ?? ''),
      nilai: Number(r.nilai ?? 0),
      kendala: String(r.kendala ?? ''),
      status: String(r.status ?? 'Belum Dimulai'),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
      lampiran: byCorp.get(id) ?? [],
      komentar: komentar.get(id) ?? [],
    }
  })
}

/** Status & kendala sebelum perubahan — dipakai untuk menulis jejak audit. */
export async function getCorporateState(
  id: number,
): Promise<{ status: string; kendala: string } | null> {
  const sql = db()
  const [r] = (await sql`SELECT status, kendala FROM corporates WHERE id=${id}`) as {
    status: string
    kendala: string
  }[]
  return r ? { status: String(r.status ?? ''), kendala: String(r.kendala ?? '') } : null
}

export async function upsertCorporate(c: {
  id?: number
  proyek: string
  event: string
  action: string
  judul?: string
  tgl?: string | null
  pic?: string
  nilai?: number
  kendala?: string
  status?: string
}): Promise<number> {
  const sql = db()
  const judul = c.judul ?? ''
  const tgl = c.tgl || null
  const pic = c.pic ?? ''
  const nilai = c.nilai ?? 0
  const kendala = c.kendala ?? ''
  const status = c.status ?? 'Belum Dimulai'
  if (c.id) {
    const [r] = (await sql`
      UPDATE corporates SET proyek=${c.proyek}, event=${c.event}, action=${c.action}, judul=${judul},
        tgl=${tgl}, pic=${pic}, nilai=${nilai}, kendala=${kendala}, status=${status}, updated_at=now()
      WHERE id=${c.id} RETURNING id`) as { id: number }[]
    return r?.id ?? 0
  }
  const [r] = (await sql`
    INSERT INTO corporates (proyek, event, action, judul, tgl, pic, nilai, kendala, status)
    VALUES (${c.proyek}, ${c.event}, ${c.action}, ${judul}, ${tgl}, ${pic}, ${nilai}, ${kendala}, ${status})
    RETURNING id`) as { id: number }[]
  return r.id
}

/** Removes an agenda together with its evidence and its audit trail. */
export async function deleteCorporate(id: number): Promise<void> {
  const sql = db()
  await sql`DELETE FROM corp_docs WHERE corp_id=${id}`
  await sql`DELETE FROM comments WHERE entity='corp' AND entity_id=${id}`
  await sql`DELETE FROM corporates WHERE id=${id}`
}

export async function insertCorpDoc(d: {
  corpId: number
  filename: string
  url: string
  size: number
  contentType: string
  data?: string | null
}): Promise<number> {
  const sql = db()
  const [r] = (await sql`
    INSERT INTO corp_docs (corp_id, filename, url, size, content_type, data)
    VALUES (${d.corpId}, ${d.filename}, ${d.url}, ${d.size}, ${d.contentType}, ${d.data ?? null})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function getCorpDocUrl(id: number): Promise<string | null> {
  const sql = db()
  const [r] = (await sql`SELECT url FROM corp_docs WHERE id=${id}`) as { url: string }[]
  return r?.url ?? null
}

/** Bytes + metadata for a DB-stored evidence file, or null when it lives in Blob. */
export async function getCorpDocData(
  id: number,
): Promise<{ data: string; filename: string; contentType: string } | null> {
  const sql = db()
  const [r] = (await sql`
    SELECT data, filename, content_type FROM corp_docs WHERE id=${id}`) as {
    data: string | null
    filename: string
    content_type: string
  }[]
  if (!r || !r.data) return null
  return { data: r.data, filename: r.filename, contentType: r.content_type || 'application/octet-stream' }
}

export async function deleteCorpDoc(id: number): Promise<void> {
  await db()`DELETE FROM corp_docs WHERE id=${id}`
}

// ---- Land Acquisition — bidang tanah ----

export interface LandRow {
  id: number
  proyek: string
  kode: string
  nama: string
  pemilik: string
  luas: number
  jenis: string
  noDok: string
  status: string
  tgl: string
  pic: string
  catatan: string
}

export async function getLands(proyek?: string): Promise<LandRow[]> {
  const sql = db()
  const rows = (
    proyek
      ? await sql`SELECT * FROM lands WHERE proyek=${proyek} ORDER BY kode, id`
      : await sql`SELECT * FROM lands ORDER BY proyek, kode, id`
  ) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: Number(r.id),
    proyek: String(r.proyek ?? ''),
    kode: String(r.kode ?? ''),
    nama: String(r.nama ?? ''),
    pemilik: String(r.pemilik ?? ''),
    luas: Number(r.luas ?? 0),
    jenis: String(r.jenis ?? ''),
    noDok: String(r.no_dok ?? ''),
    status: String(r.status ?? 'Belum Dimulai'),
    tgl: r.tgl ? isoDate(r.tgl) : '',
    pic: String(r.pic ?? ''),
    catatan: String(r.catatan ?? ''),
  }))
}

export async function upsertLand(p: {
  id?: number
  proyek: string
  kode?: string
  nama: string
  pemilik?: string
  luas?: number
  jenis: string
  noDok?: string
  status?: string
  tgl?: string | null
  pic?: string
  catatan?: string
}): Promise<number> {
  const sql = db()
  const kode = p.kode ?? ''
  const pemilik = p.pemilik ?? ''
  const luas = p.luas ?? 0
  const noDok = p.noDok ?? ''
  const status = p.status ?? 'Belum Dimulai'
  const tgl = p.tgl || null
  const pic = p.pic ?? ''
  const catatan = p.catatan ?? ''
  if (p.id) {
    const [r] = (await sql`
      UPDATE lands SET proyek=${p.proyek}, kode=${kode}, nama=${p.nama}, pemilik=${pemilik},
        luas=${luas}, jenis=${p.jenis}, no_dok=${noDok}, status=${status}, tgl=${tgl},
        pic=${pic}, catatan=${catatan}, updated_at=now()
      WHERE id=${p.id} RETURNING id`) as { id: number }[]
    return r?.id ?? 0
  }
  const [r] = (await sql`
    INSERT INTO lands (proyek, kode, nama, pemilik, luas, jenis, no_dok, status, tgl, pic, catatan)
    VALUES (${p.proyek}, ${kode}, ${p.nama}, ${pemilik}, ${luas}, ${p.jenis}, ${noDok},
            ${status}, ${tgl}, ${pic}, ${catatan})
    RETURNING id`) as { id: number }[]
  return r.id
}

export async function deleteLand(id: number): Promise<void> {
  await db()`DELETE FROM lands WHERE id=${id}`
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

export interface AttachmentRow {
  id: number
  itemId: number | null
  url: string
  filename: string
  size: number
  contentType: string
  createdAt: string
}

/** Attachments recorded for one item, newest first. */
export async function getAttachments(itemId: number): Promise<AttachmentRow[]> {
  const sql = db()
  const rows = (await sql`
    SELECT id, item_id, url, filename, size, content_type, created_at
    FROM attachments WHERE item_id=${itemId} ORDER BY created_at DESC, id DESC`) as Record<
    string,
    unknown
  >[]
  return rows.map((r) => {
    const id = Number(r.id)
    const stored = String(r.url ?? '')
    return {
      id,
      itemId: r.item_id == null ? null : Number(r.item_id),
      // Blob-hosted files carry an absolute URL; DB-stored files get a download route.
      url: stored || `/api/upload?download=${id}`,
      filename: String(r.filename ?? ''),
      size: Number(r.size ?? 0),
      contentType: String(r.content_type ?? ''),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
    }
  })
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
