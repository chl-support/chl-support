/**
 * Thin browser client for the Vercel serverless backend. Every call fails soft:
 * the UI keeps working on bundled demo data when the backend is not reachable.
 */
import type { AuditDoc, Item, Personel, Project } from '@/data/types'

export interface HealthCheck {
  configured: boolean
  ok: boolean
  detail: string
}
export interface Health {
  ok: boolean
  ready: boolean
  checks: { neon: HealthCheck; blob: HealthCheck; openai: HealthCheck }
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

export async function uploadAuditDoc(
  file: File,
  judul?: string,
  catatan?: string,
): Promise<UploadResult> {
  try {
    const qs = new URLSearchParams({ filename: file.name })
    if (judul?.trim()) qs.set('judul', judul.trim())
    if (catatan?.trim()) qs.set('catatan', catatan.trim())
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
