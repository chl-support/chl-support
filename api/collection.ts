import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  deleteKprBerkas,
  deleteKprDokumen,
  deleteKprFollowup,
  ensureSchema,
  getKprBerkas,
  hasDb,
  insertKprDokumen,
  insertKprFollowup,
  seedKprDokumen,
  updateKprDokumen,
  upsertKprBerkas,
} from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/** Checklist bawaan — sama persis dengan `DOK_WAJIB` di `src/data/kpr.ts`. */
const DOK_WAJIB = [
  'KTP',
  'Kartu Keluarga',
  'NPWP',
  'Slip Gaji / Rekening Koran',
  'Surat Keterangan Kerja',
]

const TAHAP = [
  'booking',
  'verifikasi',
  'dp',
  'pengajuan',
  'appraisal',
  'sp3k',
  'pelunasan',
  'akad',
  'angsuran',
]
const STATUS = ['Berjalan', 'Tertahan', 'Ditolak Bank', 'Selesai', 'Batal']
const DOK_STATUS = ['Belum', 'Diterima', 'Perlu perbaikan']

const body = (req: VercelRequest): Record<string, unknown> =>
  ((typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ??
    {}) as Record<string, unknown>

/**
 * Menu Collection — berkas KPR beserta checklist dokumen dan riwayat follow-up.
 * Semuanya dilayani satu Serverless Function (`?action=`) agar jumlah function
 * tetap di bawah batas paket Vercel.
 *
 * GET    /api/collection?proyek=srp          → daftar berkas + dokumen + follow-up
 * POST   /api/collection                     → buat/ubah berkas (checklist ikut dibuat)
 * POST   /api/collection?action=dokumen      → tambah dokumen di luar checklist baku
 * POST   /api/collection?action=followup     → catat satu follow-up
 * PATCH  /api/collection?dokumen=7           → ubah status/catatan satu dokumen
 * DELETE /api/collection?id=3                → hapus berkas + checklist + riwayatnya
 * DELETE /api/collection?dokumen=7           → hapus satu baris checklist
 * DELETE /api/collection?followup=9          → hapus satu catatan follow-up
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      const proyek = req.query.proyek ? String(req.query.proyek) : undefined
      return res.status(200).json({ ok: true, berkas: await getKprBerkas(proyek) })
    }

    if (req.method === 'POST') {
      const action = String(req.query.action ?? 'berkas')

      if (action === 'dokumen') {
        const b = body(req)
        const kprId = Number(b.kprId)
        const jenis = String(b.jenis ?? '').trim()
        if (!kprId || !jenis) return fail(res, 400, 'kprId dan jenis dokumen wajib diisi.')
        const id = await insertKprDokumen({
          kprId,
          jenis,
          catatan: b.catatan ? String(b.catatan) : '',
        })
        return res.status(201).json({ ok: true, id })
      }

      if (action === 'followup') {
        const b = body(req)
        const kprId = Number(b.kprId)
        if (!kprId) return fail(res, 400, 'kprId wajib diisi.')
        const pesan = String(b.pesan ?? '').trim()
        if (!pesan) return fail(res, 400, 'Isi pesan follow-up tidak boleh kosong.')
        const id = await insertKprFollowup({
          kprId,
          tingkat: Number(b.tingkat) || 0,
          kanal: b.kanal ? String(b.kanal) : 'WhatsApp',
          pesan,
          hasil: b.hasil ? String(b.hasil).trim() : '',
          oleh: b.oleh ? String(b.oleh).trim() : '',
        })
        return res.status(201).json({ ok: true, id })
      }

      const b = body(req)
      if (!b.proyek || !String(b.nama ?? '').trim()) {
        return fail(res, 400, 'proyek dan nama customer wajib diisi.')
      }
      const tahap = b.tahap ? String(b.tahap) : 'booking'
      const status = b.status ? String(b.status) : 'Berjalan'
      if (!TAHAP.includes(tahap)) {
        return fail(res, 400, `Tahap tidak dikenal. Gunakan salah satu: ${TAHAP.join(', ')}.`)
      }
      if (!STATUS.includes(status)) {
        return fail(res, 400, `Status tidak dikenal. Gunakan ${STATUS.join(' / ')}.`)
      }

      const id = await upsertKprBerkas({
        id: b.id ? Number(b.id) : undefined,
        proyek: String(b.proyek),
        nama: String(b.nama).trim(),
        unit: b.unit ? String(b.unit).trim() : '',
        telepon: b.telepon ? String(b.telepon).trim() : '',
        email: b.email ? String(b.email).trim() : '',
        tahap,
        status,
        bank: b.bank ? String(b.bank).trim() : '',
        nilai: Number(b.nilai) || 0,
        bookingTgl: b.bookingTgl ? String(b.bookingTgl) : null,
        tenggatDokumen: b.tenggatDokumen ? String(b.tenggatDokumen) : null,
        sp3kTgl: b.sp3kTgl ? String(b.sp3kTgl) : null,
        sp3kBerlaku: Number(b.sp3kBerlaku) || 30,
        akadTgl: b.akadTgl ? String(b.akadTgl) : null,
        pic: b.pic ? String(b.pic).trim() : '',
        catatan: b.catatan ? String(b.catatan).trim() : '',
      })
      // Berkas baru langsung membawa checklist dokumen wajibnya.
      await seedKprDokumen(id, DOK_WAJIB)
      return res.status(b.id ? 200 : 201).json({ ok: true, id })
    }

    if (req.method === 'PATCH') {
      const dokId = Number(req.query.dokumen)
      if (!dokId) return fail(res, 400, 'Param "dokumen" wajib.')
      const b = body(req)
      const status = b.status == null ? undefined : String(b.status)
      if (status && !DOK_STATUS.includes(status)) {
        return fail(res, 400, `Status dokumen tidak dikenal. Gunakan ${DOK_STATUS.join(' / ')}.`)
      }
      const dok = await updateKprDokumen(dokId, {
        status,
        catatan: b.catatan == null ? undefined : String(b.catatan),
      })
      if (!dok) return fail(res, 404, 'Dokumen tidak ditemukan.')
      return res.status(200).json({ ok: true, dokumen: dok })
    }

    if (req.method === 'DELETE') {
      if (req.query.dokumen != null) {
        const id = Number(req.query.dokumen)
        if (!id) return fail(res, 400, 'Param "dokumen" tidak valid.')
        await deleteKprDokumen(id)
        return res.status(200).json({ ok: true, id })
      }
      if (req.query.followup != null) {
        const id = Number(req.query.followup)
        if (!id) return fail(res, 400, 'Param "followup" tidak valid.')
        await deleteKprFollowup(id)
        return res.status(200).json({ ok: true, id })
      }
      const id = Number(req.query.id)
      if (!id) return fail(res, 400, 'Param "id" wajib.')
      await deleteKprBerkas(id)
      return res.status(200).json({ ok: true, id })
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE'])
  } catch (e) {
    fail(res, 500, 'Operasi berkas KPR gagal.', (e as Error).message)
  }
}
