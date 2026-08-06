import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteProject, ensureSchema, getProjects, hasDb, upsertProject } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/** Turns "Harmoni Serpong Fase 2" into a short, url-safe slug. */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'proyek'
  )
}

/**
 * GET    /api/projects        → daftar proyek
 * POST   /api/projects        → buat (tanpa id → slug dari nama) / ubah (dengan id)
 * DELETE /api/projects?id=srp → hapus proyek beserta item & izinnya
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, projects: await getProjects() })
    }

    if (req.method === 'POST') {
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      if (!b.nama?.trim()) return fail(res, 400, 'Nama proyek wajib diisi.')

      const id = (b.id ? String(b.id) : slugify(String(b.nama))).trim()
      if (!id) return fail(res, 400, 'Id proyek tidak valid.')

      const saved = await upsertProject({
        id,
        nama: String(b.nama).trim(),
        lok: b.lok ? String(b.lok).trim() : '',
        ha: b.ha ? String(b.ha).trim() : '',
        unit: Number(b.unit) || 0,
        fase: b.fase ? String(b.fase).trim() : '',
        warna: b.warna ? String(b.warna).trim() : '#0F5C6B',
        pemda: b.pemda ? String(b.pemda).trim() : '',
        sla: b.sla ? String(b.sla).trim() : '',
      })
      return res.status(b.id ? 200 : 201).json({ ok: true, id: saved })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id ? String(req.query.id) : ''
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteProject(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi proyek gagal.', (e as Error).message)
  }
}
