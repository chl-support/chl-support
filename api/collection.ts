import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { blobToken } from './_lib/env.js'
import {
  deleteKprBerkas,
  deleteKprDokumen,
  deleteKprFollowup,
  ensureSchema,
  deleteKprReport,
  getKprBerkas,
  getKprReportData,
  getKprReportUrl,
  getKprReports,
  hasDb,
  insertKprDokumen,
  insertKprFollowup,
  insertKprReport,
  seedKprDokumen,
  updateKprDokumen,
  upsertKprBerkas,
} from './_lib/db.js'
import { getProjects } from './_lib/db.js'
import { kirimEmail, resendKey } from './_lib/mailer.js'
import { reminderJatuhTempo } from './_lib/reminder.js'
import { fail, methodNotAllowed, readRawBody, sendFile } from './_lib/http.js'

// Berkas report diunggah sebagai raw body, jadi parser bawaan dimatikan dan
// payload JSON dibaca manual lewat `body()`.
export const config = { api: { bodyParser: false } }

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

async function body(req: VercelRequest): Promise<Record<string, unknown>> {
  const raw = await readRawBody(req)
  if (!raw.length) return {}
  try {
    const parsed = JSON.parse(raw.toString('utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

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
 *
 * Arsip laporan Collection (rekap follow-up/reminder yang diunggah tim):
 * GET    /api/collection?reports=1&proyek=srp → daftar report
 * GET    /api/collection?download=4            → unduh report yang disimpan di Neon
 * POST   /api/collection?action=report&proyek=srp&filename=rekap.xlsx → unggah (body = berkas)
 * DELETE /api/collection?report=4              → hapus satu report
 *
 * Penjadwal reminder harian (dipanggil Vercel Cron):
 * GET    /api/collection?action=reminder       → kirim reminder yang jatuh tempo
 * GET    /api/collection?action=reminder&dry=1 → hanya laporkan, tanpa mengirim
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  try {
    await ensureSchema()

    if (req.method === 'GET') {
      if (String(req.query.action ?? '') === 'reminder') return reminder(req, res)
      const proyek = req.query.proyek ? String(req.query.proyek) : undefined
      if (req.query.download != null) {
        const id = Number(req.query.download)
        if (!id) return fail(res, 400, 'Param "download" tidak valid.')
        const file = await getKprReportData(id)
        if (!file) return fail(res, 404, 'Berkas tidak ditemukan atau tersimpan di Blob.')
        return sendFile(res, file)
      }
      if (req.query.reports != null) {
        return res.status(200).json({ ok: true, reports: await getKprReports(proyek) })
      }
      return res.status(200).json({ ok: true, berkas: await getKprBerkas(proyek) })
    }

    if (req.method === 'POST') {
      const action = String(req.query.action ?? 'berkas')

      if (action === 'dokumen') {
        const b = await body(req)
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

      if (action === 'report') {
        const proyek = String(req.query.proyek ?? '')
        if (!proyek) return fail(res, 400, 'Param "proyek" wajib untuk unggah report.')
        const filename = String(req.query.filename || 'report')
        const isi = await readRawBody(req)
        if (!isi.length) return fail(res, 400, 'Body kosong — kirim isi berkas sebagai body permintaan.')
        const contentType = req.headers['content-type'] || 'application/octet-stream'
        const meta = {
          proyek,
          judul: req.query.judul ? String(req.query.judul) : filename,
          periode: req.query.periode ? String(req.query.periode) : '',
          catatan: req.query.catatan ? String(req.query.catatan) : '',
          oleh: req.query.oleh ? String(req.query.oleh) : '',
        }

        const token = blobToken()
        if (token) {
          const blob = await put(`collection/${filename}`, isi, {
            access: 'public',
            contentType,
            addRandomSuffix: true,
            token,
          })
          const id = await insertKprReport({
            ...meta, filename, url: blob.url, size: isi.length, contentType,
          })
          return res.status(201).json({ ok: true, id, url: blob.url, filename, size: isi.length })
        }
        // Fallback: tanpa Blob store, bytes disimpan di Neon agar unggahan tetap jalan.
        const id = await insertKprReport({
          ...meta, filename, url: '', size: isi.length, contentType,
          data: isi.toString('base64'),
        })
        return res
          .status(201)
          .json({ ok: true, id, url: `/api/collection?download=${id}`, filename, size: isi.length })
      }

      if (action === 'followup') {
        const b = await body(req)
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

      const b = await body(req)
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
      const b = await body(req)
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
      if (req.query.report != null) {
        const id = Number(req.query.report)
        if (!id) return fail(res, 400, 'Param "report" tidak valid.')
        const url = await getKprReportUrl(id)
        // Hanya berkas di Blob (URL absolut) yang perlu dibersihkan di sana.
        if (url && /^https?:\/\//.test(url) && blobToken()) {
          await del(url, { token: blobToken() }).catch(() => {}) // best-effort blob cleanup
        }
        await deleteKprReport(id)
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

/**
 * Penjadwal reminder harian.
 *
 * Dipanggil Vercel Cron sekali sehari. Menghitung berkas mana yang jatuh tempo
 * hari ini, mengirim emailnya, lalu mencatat tiap pengiriman sebagai riwayat
 * follow-up — pencatatan hanya dilakukan untuk email yang benar-benar terkirim,
 * supaya jejaknya tidak pernah mengklaim kontak yang tidak terjadi.
 *
 * Tanpa `RESEND_API_KEY`, endpoint ini berjalan sebagai laporan saja: daftar
 * jatuh tempo dikembalikan, tidak ada yang dikirim maupun dicatat.
 */
async function reminder(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron mengirim `Authorization: Bearer $CRON_SECRET` bila secret di-set.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return fail(res, 401, 'Tidak berwenang memanggil penjadwal reminder.')
  }

  const dry = req.query.dry != null || !resendKey()
  const [daftar, projects] = await Promise.all([getKprBerkas(), getProjects()])
  const namaProyek = new Map(projects.map((p) => [String(p.id), String(p.nama)]))
  const antre = reminderJatuhTempo(daftar, namaProyek, new Date())

  if (dry) {
    return res.status(200).json({
      ok: true,
      terkirim: 0,
      dry: true,
      alasan: resendKey() ? 'Dijalankan sebagai uji coba (dry).' : 'RESEND_API_KEY belum di-set.',
      jatuhTempo: antre.map(ringkas),
    })
  }

  const hasil: Record<string, unknown>[] = []
  let terkirim = 0
  for (const item of antre) {
    const tujuan = item.berkas.email.trim()
    if (!tujuan) {
      hasil.push({ ...ringkas(item), status: 'dilewati', alasan: 'email customer kosong' })
      continue
    }
    const kirim = await kirimEmail({ to: tujuan, subject: item.subjek, text: item.pesan })
    if (!kirim.ok) {
      hasil.push({ ...ringkas(item), status: 'gagal', alasan: kirim.error })
      continue
    }
    await insertKprFollowup({
      kprId: item.berkas.id,
      tingkat: item.tingkat.tingkat,
      kanal: 'Email (otomatis)',
      pesan: item.pesan,
      hasil: `Terkirim otomatis ke ${tujuan}`,
      oleh: 'Sistem',
    })
    terkirim += 1
    hasil.push({ ...ringkas(item), status: 'terkirim' })
  }

  return res.status(200).json({ ok: true, terkirim, total: antre.length, hasil })
}

/** Ringkasan satu reminder untuk badan respons penjadwal. */
function ringkas(item: { berkas: { id: number; nama: string; unit: string }; tingkat: { nama: string }; lewat: number; kurang: string[] }) {
  return {
    id: item.berkas.id,
    nama: item.berkas.nama,
    unit: item.berkas.unit,
    tingkat: item.tingkat.nama,
    lewatHari: item.lewat,
    kurang: item.kurang,
  }
}
