/**
 * Thin browser client for the Vercel serverless backend. Every call fails soft:
 * the UI keeps working on bundled demo data when the backend is not reachable.
 */
import type {
  AuditDoc,
  Corporate,
  CorpDoc,
  Item,
  Komentar,
  KprBerkas,
  KprDokumen,
  KprFollowup,
  Land,
  Permit,
  Personel,
  Project,
  SignoffStatus,
  SignoffStep,
} from '@/data/types'

export interface HealthCheck {
  configured: boolean
  ok: boolean
  detail: string
}
/** Hasil pemeriksaan satu jalur email; `catatan` hanya muncul bila relevan. */
export interface ReminderEmail {
  jalur: 'gmail' | 'resend' | 'none'
  ok: boolean
  detail: string
  from: string
  akun?: string
  catatan?: string
}
export interface ReminderSheet {
  ok: boolean
  url: string
  detail: string
  kolomHilang?: string[]
}
export interface ReminderStatus {
  /** Reminder dokumen KPR — sumbernya database, tidak butuh Google Sheet. */
  dokumenSiap?: boolean
  /** Reminder tagihan — butuh sheet terbaca selain jalur email. */
  tagihanSiap?: boolean
  /** Medan lama; masih dikirim server untuk halaman yang belum ikut diperbarui. */
  siapKirim?: boolean
  email: ReminderEmail
  cron: { ok: boolean; detail: string; jadwal: string }
  sheet: ReminderSheet
}
export interface Health {
  ok: boolean
  ready: boolean
  checks: { neon: HealthCheck; blob: HealthCheck; openai: HealthCheck }
  reminder?: ReminderStatus
}

export interface Bootstrap {
  projects: Project[]
  items: Item[]
  seeded: boolean
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.ok === false) return null
    return data as T
  } catch {
    return null
  }
}

/** Loads projects + items from Neon. Returns null when the backend is absent. */
export async function fetchBootstrap(): Promise<Bootstrap | null> {
  const data = await getJson<{ projects: Project[]; items: Item[]; seeded: boolean }>(
    '/api/bootstrap',
  )
  return data ? { projects: data.projects, items: data.items, seeded: data.seeded } : null
}

export async function fetchHealth(): Promise<Health | null> {
  return getJson<Health>('/api/health')
}

/** Satu baris antrean reminder hari ini, apa adanya dari penjadwal. */
export interface AntreanBaris {
  nama: string
  unit: string
  tingkat: string
  jenis?: string
  lewatHari: number
  tanggal?: string
  email?: string | null
  kurang?: string[]
}
export interface Antrean {
  dokumen: AntreanBaris[]
  tagihan: AntreanBaris[]
  perluDitinjau: AntreanBaris[]
  errorTagihan?: string
}

/**
 * Antrean hari ini tanpa mengirim apa pun (`dry=1`). Dipakai untuk memeriksa
 * daftar penerima sebelum jam kirim — pertanyaan "siapa saja yang akan dihubungi
 * hari ini" tidak bisa dijawab dari layar mana pun selain ini.
 */
export async function fetchAntreanReminder(): Promise<Antrean | null> {
  const data = await getJson<{
    dokumen?: AntreanBaris[]
    tagihan?: { ok?: boolean; error?: string; antre?: AntreanBaris[]; perluDitinjau?: AntreanBaris[] }
  }>('/api/collection?action=reminder&dry=1')
  if (!data) return null
  return {
    dokumen: data.dokumen ?? [],
    tagihan: data.tagihan?.antre ?? [],
    perluDitinjau: data.tagihan?.perluDitinjau ?? [],
    errorTagihan: data.tagihan?.ok === false ? data.tagihan.error : undefined,
  }
}

export interface AskResult {
  ok: boolean
  text?: string
  error?: string
}

export async function askAI(prompt: string, context?: unknown): Promise<AskResult> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    }
    return { ok: true, text: data.text }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface UploadResult {
  ok: boolean
  url?: string
  filename?: string
  size?: number
  error?: string
}

// ---- Tim (menu Tim / direktori personel) ----

export type TimRecord = Personel & { id: number }

export async function fetchTim(): Promise<TimRecord[] | null> {
  const data = await getJson<{ tim: TimRecord[] }>('/api/tim')
  return data ? data.tim : null
}

export interface MutateResult {
  ok: boolean
  id?: number
  error?: string
}

// ---- Projects (proyek) ----

export async function fetchProjects(): Promise<Project[] | null> {
  const data = await getJson<{ projects: Project[] }>('/api/projects')
  return data ? data.projects : null
}

export async function saveProject(project: Project): Promise<MutateResult & { slug?: string }> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, slug: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteProject(id: string): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Permits (perizinan) ----

export type PermitRecord = Permit & { id: number }

export async function fetchPermits(proyek: string): Promise<PermitRecord[] | null> {
  const data = await getJson<{ permits: PermitRecord[] }>(`/api/permits?proyek=${encodeURIComponent(proyek)}`)
  return data ? data.permits : null
}

export async function savePermit(permit: Permit): Promise<MutateResult> {
  try {
    const res = await fetch('/api/permits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permit),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deletePermit(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/permits?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Komentar & jejak audit (bersama: agenda korporasi + item) ----

export type CommentEntity = 'corp' | 'item'

export async function fetchComments(
  entity: CommentEntity,
  id: number,
): Promise<Komentar[] | null> {
  const data = await getJson<{ comments: Komentar[] }>(`/api/comments?entity=${entity}&id=${id}`)
  return data ? data.comments : null
}

export async function addComment(
  entity: CommentEntity,
  entityId: number,
  teks: string,
  aktor?: string,
): Promise<MutateResult> {
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, entityId, teks, aktor }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Lampiran item (dipakai ItemDrawer) ----

export interface Attachment {
  id: number
  itemId: number | null
  url: string
  filename: string
  size: number
  contentType: string
  createdAt: string
}

export async function fetchAttachments(itemId: number): Promise<Attachment[] | null> {
  const data = await getJson<{ attachments: Attachment[] }>(`/api/upload?itemId=${itemId}`)
  return data ? data.attachments : null
}

// ---- Corporate (agenda & aksi korporasi) ----

export type CorporateRecord = Corporate & { id: number; lampiran: CorpDoc[]; komentar: Komentar[] }

export async function fetchCorporates(proyek: string): Promise<CorporateRecord[] | null> {
  const data = await getJson<{ corporates: CorporateRecord[] }>(
    `/api/corporate?proyek=${encodeURIComponent(proyek)}`,
  )
  return data ? data.corporates : null
}

export async function saveCorporate(
  corp: Corporate & { aktor?: string },
): Promise<MutateResult> {
  try {
    const res = await fetch('/api/corporate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corp),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteCorporate(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/corporate?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Unggah satu lampiran bukti untuk sebuah agenda korporasi. */
export async function uploadCorpDoc(
  corpId: number,
  file: File,
  aktor?: string,
): Promise<UploadResult> {
  try {
    const qs = new URLSearchParams({ corpId: String(corpId), filename: file.name })
    if (aktor?.trim()) qs.set('aktor', aktor.trim())
    const res = await fetch(`/api/corporate?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, url: data.url, filename: data.filename, size: data.size }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteCorpDoc(docId: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/corporate?doc=${docId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: docId }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Collection (berkas KPR, checklist dokumen, follow-up) ----

export type KprRecord = KprBerkas & {
  id: number
  dokumen: KprDokumen[]
  followup: KprFollowup[]
}

export async function fetchKpr(proyek: string): Promise<KprRecord[] | null> {
  const data = await getJson<{ berkas: KprRecord[] }>(
    `/api/collection?proyek=${encodeURIComponent(proyek)}`,
  )
  return data ? data.berkas : null
}

export async function saveKpr(berkas: KprBerkas): Promise<MutateResult> {
  try {
    const res = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(berkas),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteKpr(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/collection?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Menandai satu dokumen checklist diterima / perlu perbaikan / belum. */
export async function updateKprDokumen(
  dokumenId: number,
  patch: { status?: string; catatan?: string },
): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/collection?dokumen=${dokumenId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: dokumenId }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Menambah dokumen di luar checklist baku (mis. permintaan tambahan bank). */
export async function addKprDokumen(kprId: number, jenis: string): Promise<MutateResult> {
  try {
    const res = await fetch('/api/collection?action=dokumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kprId, jenis }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Mencatat satu follow-up ke customer beserta isi pesannya. */
export async function addKprFollowup(f: {
  kprId: number
  tingkat: number
  kanal: string
  pesan: string
  hasil?: string
  oleh?: string
}): Promise<MutateResult> {
  try {
    const res = await fetch('/api/collection?action=followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Satu berkas laporan Collection yang diunggah tim. */
export interface KprReport {
  id: number
  proyek: string
  judul: string
  periode: string
  filename: string
  url: string
  size: number
  contentType: string
  catatan: string
  oleh: string
  uploadedAt: string
}

export async function fetchKprReports(proyek: string): Promise<KprReport[] | null> {
  const data = await getJson<{ reports: KprReport[] }>(
    `/api/collection?reports=1&proyek=${encodeURIComponent(proyek)}`,
  )
  return data ? data.reports : null
}

export async function uploadKprReport(
  proyek: string,
  file: File,
  meta: { judul?: string; periode?: string; catatan?: string; oleh?: string } = {},
): Promise<UploadResult> {
  try {
    const qs = new URLSearchParams({ action: 'report', proyek, filename: file.name })
    if (meta.judul?.trim()) qs.set('judul', meta.judul.trim())
    if (meta.periode?.trim()) qs.set('periode', meta.periode.trim())
    if (meta.catatan?.trim()) qs.set('catatan', meta.catatan.trim())
    if (meta.oleh?.trim()) qs.set('oleh', meta.oleh.trim())
    const res = await fetch(`/api/collection?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, url: data.url, filename: data.filename, size: data.size }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteKprReport(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/collection?report=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Lands (bidang tanah — bagan Land Acquisition) ----

export type LandRecord = Land & { id: number }

export async function fetchLands(proyek: string): Promise<LandRecord[] | null> {
  const data = await getJson<{ lands: LandRecord[] }>(
    `/api/lands?proyek=${encodeURIComponent(proyek)}`,
  )
  return data ? data.lands : null
}

export async function saveLand(land: Land): Promise<MutateResult> {
  try {
    const res = await fetch('/api/lands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(land),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteLand(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/lands?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Items (tabel proyek) ----

/** Membuat (tanpa id) atau mengubah (dengan id) satu item di Neon. */
export async function saveItem(item: Item): Promise<MutateResult> {
  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function saveTim(row: Personel): Promise<MutateResult> {
  try {
    const res = await fetch('/api/tim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteTim(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/tim?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Internal Audit — dokumen ----

export async function fetchAuditDocs(): Promise<AuditDoc[] | null> {
  const data = await getJson<{ docs: AuditDoc[] }>('/api/audit')
  return data ? data.docs : null
}

export interface UploadAuditOptions {
  judul?: string
  catatan?: string
  /** Divisi penanda tangan, urut sesuai alur yang dikehendaki. */
  divisi?: string[]
  /** ISO yyyy-mm-dd — tenggat yang dipasang pada setiap langkah. */
  tenggat?: string
}

export async function uploadAuditDoc(
  file: File,
  opts: UploadAuditOptions = {},
): Promise<UploadResult> {
  try {
    const qs = new URLSearchParams({ filename: file.name })
    if (opts.judul?.trim()) qs.set('judul', opts.judul.trim())
    if (opts.catatan?.trim()) qs.set('catatan', opts.catatan.trim())
    // Dipisah "|" agar nama divisi yang mengandung koma tetap utuh.
    if (opts.divisi?.length) qs.set('divisi', opts.divisi.join('|'))
    if (opts.tenggat) qs.set('tenggat', opts.tenggat)
    const res = await fetch(`/api/audit?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, url: data.url, filename: data.filename, size: data.size }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAuditDoc(id: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/audit?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ---- Internal Audit — alur tanda tangan per divisi ----

/** Menambah satu langkah divisi di ujung alur sebuah dokumen. */
export async function addSignoff(
  docId: number,
  step: { divisi: string; pic?: string; tenggat?: string },
): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/audit?docId=${docId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Mengubah satu langkah — tanda tangan, minta revisi, ganti PIC, atur tenggat. */
export async function updateSignoff(
  stepId: number,
  patch: { status?: SignoffStatus; pic?: string; catatan?: string; tenggat?: string | null },
): Promise<MutateResult & { step?: SignoffStep }> {
  try {
    const res = await fetch(`/api/audit?step=${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: stepId, step: data.step as SignoffStep }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteSignoff(stepId: number): Promise<MutateResult> {
  try {
    const res = await fetch(`/api/audit?step=${stepId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    return { ok: true, id: stepId }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function uploadFile(file: File, itemId?: number): Promise<UploadResult> {
  try {
    const qs = new URLSearchParams({ filename: file.name })
    if (itemId != null) qs.set('itemId', String(itemId))
    const res = await fetch(`/api/upload?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? `Gagal (HTTP ${res.status})` }
    }
    return { ok: true, url: data.url, filename: data.filename, size: data.size }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
