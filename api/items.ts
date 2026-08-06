import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, ensureSchema, getItems, hasDb } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/**
 * GET  /api/items          → list all items
 * POST /api/items          → create (no id) or update (with id) a single item
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    if (req.method === 'GET') {
      await ensureSchema()
      return res.status(200).json({ ok: true, items: await getItems() })
    }

    if (req.method === 'POST') {
      await ensureSchema()
      const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
      if (!b.judul || !b.modul || !b.proyek) {
        return fail(res, 400, 'judul, modul, dan proyek wajib diisi.')
      }
      const sql = db()
      const row = {
        judul: b.judul, modul: b.modul, proyek: b.proyek,
        horizon: b.horizon ?? 'Pendek', status: b.status ?? 'Belum Dimulai',
        pic: b.pic ?? '', verif: b.verif ?? '', tgl: b.tgl ?? null,
        nilai: b.nilai ?? 0, risiko: b.risiko ?? 'Rendah', dok: b.dok ?? 0,
        blockReason: b.blockReason ?? null,
      }

      if (b.id) {
        const [updated] = (await sql`
          UPDATE items SET
            judul=${row.judul}, modul=${row.modul}, proyek=${row.proyek},
            horizon=${row.horizon}, status=${row.status}, pic=${row.pic},
            verif=${row.verif}, tgl=${row.tgl}, nilai=${row.nilai},
            risiko=${row.risiko}, dok=${row.dok}, block_reason=${row.blockReason},
            updated_at=now()
          WHERE id=${b.id}
          RETURNING id`) as { id: number }[]
        if (!updated) return fail(res, 404, `Item id ${b.id} tidak ditemukan.`)
        return res.status(200).json({ ok: true, id: updated.id })
      }

      const [created] = (await sql`
        INSERT INTO items (judul,modul,proyek,horizon,status,pic,verif,tgl,nilai,risiko,dok,block_reason)
        VALUES (${row.judul},${row.modul},${row.proyek},${row.horizon},${row.status},${row.pic},
                ${row.verif},${row.tgl},${row.nilai},${row.risiko},${row.dok},${row.blockReason})
        RETURNING id`) as { id: number }[]
      return res.status(201).json({ ok: true, id: created.id })
    }

    return methodNotAllowed(res, ['GET', 'POST'])
  } catch (e) {
    fail(res, 500, 'Operasi item gagal.', (e as Error).message)
  }
}
