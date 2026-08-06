/**
 * Thin browser client for the Vercel serverless backend. Every call fails soft:
 * the UI keeps working on bundled demo data when the backend is not reachable.
 */
import type { Item, Project } from '@/data/types'

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
