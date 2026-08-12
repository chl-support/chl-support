import type { VercelRequest, VercelResponse } from '@vercel/node'
import { blobToken, databaseUrl, openaiKey } from './_lib/env.js'
import {
  gmailUser,
  penyedia,
  pesanGalatSmtp,
  reminderFrom,
  resendKey,
  smtp,
} from './_lib/mailer.js'
import { ambilSheet, sheetUrl } from './_lib/sheet.js'
import { db, ensureReady, ensureSchema, getItems, getPermits, getProjects, hasDb } from './_lib/db.js'
import { fail, methodNotAllowed } from './_lib/http.js'

/**
 * Tiga endpoint sistem digabung dalam satu Serverless Function agar jumlah
 * function tetap di bawah batas paket Vercel (Hobby: 12 per deployment).
 * `vercel.json` menulis ulang path lamanya, jadi URL yang dipakai front-end
 * dan bookmark tidak berubah:
 *
 * GET  /api/health    → /api/system?action=health    diagnostik resource
 * GET  /api/bootstrap → /api/system?action=bootstrap skema + seed + data awal
 * POST /api/reset     → /api/system?action=reset     bersihkan sisa data demo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? 'health')
  if (action === 'health') return health(res)
  if (action === 'bootstrap') return bootstrap(res)
  if (action === 'reset') return reset(req, res)
  return fail(res, 400, 'Param "action" harus health / bootstrap / reset.')
}

/**
 * Diagnostic endpoint — visit /api/health to confirm the three Vercel resources
 * are actually wired up and reachable. Never throws; every check is reported.
 */
async function health(res: VercelResponse) {
  const checks: Record<string, { configured: boolean; ok: boolean; detail: string }> = {
    neon: { configured: !!databaseUrl(), ok: false, detail: '' },
    blob: { configured: !!blobToken(), ok: false, detail: '' },
    openai: { configured: !!openaiKey(), ok: false, detail: '' },
  }

  // Neon: run a trivial query to prove the connection actually works.
  if (checks.neon.configured) {
    try {
      const sql = db()
      const [row] = (await sql`
        SELECT
          (SELECT count(*) FROM information_schema.tables
             WHERE table_name IN ('projects','items','permits','attachments'))::int AS tables,
          (SELECT count(*) FROM projects)::int AS projects
      `.catch(async () => {
        // Tables may not exist yet — connection is still fine.
        await sql`SELECT 1`
        return [{ tables: 0, projects: 0 }]
      })) as { tables: number; projects: number }[]
      checks.neon.ok = true
      checks.neon.detail =
        row.tables >= 4
          ? `terhubung · ${row.projects} proyek ter-seed`
          : 'terhubung · skema belum dibuat (buka /api/bootstrap sekali)'
    } catch (e) {
      checks.neon.detail = `gagal konek: ${(e as Error).message}`
    }
  } else {
    checks.neon.detail = 'DATABASE_URL / POSTGRES_URL belum di-set'
  }

  checks.blob.ok = checks.blob.configured
  checks.blob.detail = checks.blob.configured
    ? 'token tersedia (BLOB_READ_WRITE_TOKEN)'
    : 'BLOB_READ_WRITE_TOKEN belum di-set (hubungkan Blob store)'

  checks.openai.ok = checks.openai.configured
  checks.openai.detail = checks.openai.configured
    ? 'API key tersedia (OPENAI_API_KEY)'
    : 'OPENAI_API_KEY belum di-set'

  // Kesiapan reminder otomatis diperiksa terpisah: bukan syarat aplikasi jalan,
  // tapi penentu apakah penjadwal harian benar-benar bisa mengirim.
  const reminder = await cekReminder()

  const ready = Object.values(checks).every((c) => c.ok)
  res.status(200).json({ ok: ready, ready, checks, reminder })
}

/**
 * Kesiapan penjadwal reminder: jalur email yang aktif benar-benar dicoba
 * (login SMTP ke Google, atau panggilan ke Resend — bukan sekadar mengecek
 * variabelnya ada), lalu apakah Google Sheet-nya sudah bisa dibaca.
 */
async function cekReminder() {
  const jalur = penyedia()
  const email =
    jalur === 'gmail' ? await cekGmail() : jalur === 'resend' ? await cekResend() : belumAdaJalur()

  const cron = {
    configured: !!process.env.CRON_SECRET,
    ok: !!process.env.CRON_SECRET,
    detail: process.env.CRON_SECRET
      ? 'CRON_SECRET terpasang — endpoint penjadwal terkunci.'
      : 'CRON_SECRET belum di-set; endpoint penjadwal bisa dipanggil siapa saja.',
    jadwal: '05:00 UTC / 12:00 WIB setiap hari',
  }

  const hasil = await ambilSheet()
  const sheet: Record<string, unknown> = {
    ok: hasil.ok,
    // Tautan yang benar-benar melayani, bukan yang dicoba pertama.
    url: hasil.ok ? hasil.url : sheetUrl(),
    detail: hasil.ok
      ? `Terbaca — ${hasil.baris.length} baris konsumen, header di baris ${hasil.barisHeader}.`
      : (hasil.error ?? 'Sheet tidak terbaca.'),
    percobaan: hasil.percobaan,
  }
  if (hasil.ok) {
    sheet.kolomDikenali = hasil.kolom
    sheet.kolomHilang = hasil.hilang
    sheet.adaTanggalAmbigu = hasil.adaTanggalAmbigu
  }

  // Dua jenis reminder punya sumber data berbeda, jadi kesiapannya dipisah:
  // reminder dokumen dihitung dari berkas KPR di database dan tetap terkirim
  // meski sheet-nya tidak terbaca; hanya reminder tagihan yang bergantung pada
  // Google Sheet. Menggabungkan keduanya membuat sheet yang belum dibagikan
  // terbaca seolah seluruh penjadwal mati.
  return {
    dokumenSiap: email.ok,
    tagihanSiap: email.ok && hasil.ok,
    // Halaman yang masih ter-cache di browser membaca `siapKirim`; tanpa medan
    // ini ia menyimpulkan "belum siap" padahal semua pemeriksaan lolos.
    siapKirim: email.ok && hasil.ok,
    email,
    cron,
    sheet,
  }
}

interface CekEmail {
  jalur: string
  ok: boolean
  detail: string
  from: string
  [k: string]: unknown
}

function belumAdaJalur(): CekEmail {
  return {
    jalur: 'none',
    ok: false,
    from: reminderFrom(),
    detail:
      'Belum ada jalur email. Pilih salah satu: GMAIL_USER + GMAIL_APP_PASSWORD (Google), ' +
      'atau RESEND_API_KEY. Tanpa itu penjadwal tetap jalan tapi tidak mengirim.',
  }
}

/**
 * Login SMTP sungguhan ke smtp.gmail.com. Ini yang membedakan "App Password
 * sudah dipasang" dari "App Password diterima Google" — App Password yang
 * salah ketik atau dicabut baru ketahuan di sini, bukan nanti jam 12:00.
 */
async function cekGmail(): Promise<CekEmail> {
  const akun = gmailUser()!
  const hasil: CekEmail = { jalur: 'gmail', ok: false, detail: '', from: reminderFrom(), akun }

  try {
    await smtp().verify()
  } catch (e) {
    hasil.detail = pesanGalatSmtp(e as Error)
    return hasil
  }

  hasil.ok = true

  // REMINDER_FROM sengaja tidak dipakai di jalur Gmail. Kalau nilainya masih
  // tertinggal di Vercel dan berbeda dari akunnya, katakan bahwa ia diabaikan —
  // supaya tidak ada yang mengira konsumen menerima alamat itu.
  const sisa = process.env.REMINDER_FROM
  const alamatSisa = sisa ? (sisa.match(/<([^>]+)>/)?.[1] ?? sisa).trim().toLowerCase() : ''
  if (alamatSisa && alamatSisa !== akun.toLowerCase()) {
    hasil.catatan =
      `REMINDER_FROM masih berisi ${alamatSisa} dan diabaikan — pengirimnya ${akun}. ` +
      'Boleh dihapus dari Environment Variables agar tidak membingungkan.'
  }
  hasil.detail = `Login Google diterima — siap mengirim atas nama ${akun}.`
  return hasil
}

/** Kunci Resend dipakai memanggil Resend, plus status verifikasi domainnya. */
async function cekResend(): Promise<CekEmail> {
  const from = reminderFrom()
  const domainPengirim = (from.match(/@([^>\s]+)/)?.[1] ?? '').toLowerCase()
  const hasil: CekEmail = { jalur: 'resend', ok: false, detail: '', from }

  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${resendKey()}` },
    })
    if (r.status === 401 || r.status === 403) {
      hasil.detail = 'Kunci ditolak Resend (401/403) — periksa nilai RESEND_API_KEY.'
      return hasil
    }
    if (!r.ok) {
      hasil.detail = `Resend membalas HTTP ${r.status}.`
      return hasil
    }
    const body = (await r.json().catch(() => null)) as { data?: unknown[] } | null
    const daftar = Array.isArray(body?.data) ? (body!.data as Record<string, unknown>[]) : []
    const domains = daftar.map((d) => ({
      name: String(d.name ?? ''),
      status: String(d.status ?? ''),
    }))
    hasil.domains = domains
    const cocok = domains.find((d) => d.name.toLowerCase() === domainPengirim)
    if (!domainPengirim) {
      hasil.detail = 'Kunci valid, tapi alamat pengirim tidak terbaca.'
    } else if (!cocok) {
      hasil.detail =
        `Kunci valid, tapi domain "${domainPengirim}" belum terdaftar di Resend. ` +
        'Tambahkan lewat Domains → Add Domain lalu pasang catatan DNS-nya.'
    } else if (cocok.status !== 'verified') {
      hasil.detail = `Kunci valid, domain "${domainPengirim}" berstatus "${cocok.status}" — belum terverifikasi, kiriman akan ditolak.`
    } else {
      hasil.ok = true
      hasil.detail = `Siap mengirim atas nama ${domainPengirim} (terverifikasi).`
    }
  } catch (e) {
    hasil.detail = `Gagal menghubungi Resend: ${(e as Error).message}`
  }
  return hasil
}

/**
 * Single call the front-end makes on load: creates the schema + seeds demo data
 * the first time, then returns everything the UI needs from Neon.
 */
async function bootstrap(res: VercelResponse) {
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }
  try {
    const { seeded } = await ensureReady()
    const [projects, items, permits] = await Promise.all([getProjects(), getItems(), getPermits()])
    res.status(200).json({ ok: true, seeded, projects, items, permits })
  } catch (e) {
    fail(res, 500, 'Gagal memuat data dari database.', (e as Error).message)
  }
}

/**
 * POST /api/reset  { "confirm": "HAPUS DEMO" }
 * Menghapus SEMUA sisa data demo (projects, items, permits, attachments) dari
 * database — dipakai sekali kalau deployment sebelumnya sempat men-seed data
 * contoh. Tabel `tim` (data asli) TIDAK disentuh. Perlu konfirmasi eksplisit.
 */
async function reset(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  if (!hasDb()) {
    return fail(res, 503, 'Database belum terhubung — set DATABASE_URL / POSTGRES_URL di Vercel.')
  }

  const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
  if (b.confirm !== 'HAPUS DEMO') {
    return fail(res, 400, 'Konfirmasi diperlukan: kirim body { "confirm": "HAPUS DEMO" }.')
  }

  try {
    await ensureSchema()
    const sql = db()
    await sql`TRUNCATE items, permits, attachments RESTART IDENTITY`
    await sql`DELETE FROM projects`
    res.status(200).json({ ok: true, message: 'Data demo dibersihkan. Tabel tim tidak disentuh.' })
  } catch (e) {
    fail(res, 500, 'Reset gagal.', (e as Error).message)
  }
}
