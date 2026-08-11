import nodemailer, { type Transporter } from 'nodemailer'

/**
 * Pengiriman email transaksional reminder.
 *
 * Dua jalur didukung; yang dipakai ditentukan oleh variabel lingkungan yang
 * tersedia, Gmail lebih dulu:
 *
 * 1. Gmail / Google Workspace lewat SMTP — set `GMAIL_USER` (alamat lengkap)
 *    dan `GMAIL_APP_PASSWORD` (App Password 16 huruf dari Google, BUKAN kata
 *    sandi akun). Tidak perlu verifikasi domain: Google sudah menandatangani
 *    kirimannya dengan DKIM domainnya sendiri. Kiriman otomatis tersimpan di
 *    folder Terkirim milik akun tersebut.
 * 2. Resend lewat HTTP API — set `RESEND_API_KEY`. Alamat pengirim harus di
 *    domain yang sudah diverifikasi di Resend.
 *
 * Tanpa keduanya seluruh alur reminder tetap berjalan, tapi tidak ada email
 * yang benar-benar dikirim — penjadwal melaporkan daftar jatuh tempo saja.
 */

export type Penyedia = 'gmail' | 'resend' | 'none'

export function resendKey(): string | undefined {
  return process.env.RESEND_API_KEY || undefined
}

export function gmailUser(): string | undefined {
  return process.env.GMAIL_USER?.trim() || undefined
}

/** App Password Google. Spasi yang ikut ter-copy dari Google dibuang. */
export function gmailPassword(): string | undefined {
  const p = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  return p || undefined
}

/** Jalur pengiriman yang aktif saat ini. Gmail didahulukan bila keduanya ada. */
export function penyedia(): Penyedia {
  if (gmailUser() && gmailPassword()) return 'gmail'
  if (resendKey()) return 'resend'
  return 'none'
}

/**
 * Alamat pengirim reminder.
 *
 * Pada jalur Gmail, `GMAIL_USER` yang menentukan — bukan `REMINDER_FROM`.
 * Google hanya mengizinkan pengiriman atas nama akun yang login (atau alias
 * "Kirim email sebagai" yang sudah diverifikasi); alamat lain diam-diam ditulis
 * ulang oleh Google ke akun tersebut, sehingga `REMINDER_FROM` yang berbeda
 * hanya membuat tampilan di aplikasi berbeda dari yang benar-benar diterima
 * konsumen. Karena itu di jalur ini `REMINDER_FROM` diabaikan — nilai lama yang
 * masih tertinggal di Vercel tidak lagi berpengaruh.
 *
 * Pada jalur Resend alamat pengirim tidak bisa disimpulkan dari kunci API, jadi
 * di sana `REMINDER_FROM` tetap dipakai (domainnya harus sudah diverifikasi).
 */
export function reminderFrom(): string {
  // Digantung pada jalur yang benar-benar aktif, bukan sekadar adanya
  // GMAIL_USER: akun Gmail tanpa App Password berarti kiriman lewat Resend,
  // dan alamat gmail di sana pasti ditolak karena domainnya tak terverifikasi.
  if (penyedia() === 'gmail') return `Collection CHL <${gmailUser()}>`
  return process.env.REMINDER_FROM || 'Collection CHL <nemtour09@gmail.com>'
}

/** Alamat yang menerima salinan/eskalasi; kosong berarti tidak ada salinan. */
export function reminderBcc(): string | undefined {
  return process.env.REMINDER_BCC || undefined
}

export interface HasilKirim {
  ok: boolean
  id?: string
  error?: string
  /** Jalur yang benar-benar dipakai — ikut dicatat di jejak audit. */
  lewat?: Penyedia
}

let transporter: Transporter | undefined

/** Koneksi SMTP Gmail dipakai ulang antar pemanggilan dalam satu instance. */
export function smtp(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser(), pass: gmailPassword() },
    })
  }
  return transporter
}

/** Mengirim satu email teks biasa. Tidak pernah melempar — galat dikembalikan. */
export async function kirimEmail(pesan: {
  to: string
  subject: string
  text: string
}): Promise<HasilKirim> {
  const jalur = penyedia()
  if (jalur === 'gmail') return lewatGmail(pesan)
  if (jalur === 'resend') return lewatResend(pesan)
  return {
    ok: false,
    error: 'Belum ada jalur email: set GMAIL_USER + GMAIL_APP_PASSWORD, atau RESEND_API_KEY.',
    lewat: 'none',
  }
}

async function lewatGmail(pesan: {
  to: string
  subject: string
  text: string
}): Promise<HasilKirim> {
  try {
    const info = await smtp().sendMail({
      from: reminderFrom(),
      to: pesan.to,
      ...(reminderBcc() ? { bcc: reminderBcc() } : {}),
      subject: pesan.subject,
      text: pesan.text,
    })
    // Gmail menerima seluruh penerima atau menolak seluruhnya; `rejected`
    // yang tidak kosong berarti kiriman ini tidak sampai.
    if (info.rejected?.length) {
      return { ok: false, error: `Gmail menolak: ${info.rejected.join(', ')}`, lewat: 'gmail' }
    }
    return { ok: true, id: info.messageId, lewat: 'gmail' }
  } catch (e) {
    return { ok: false, error: pesanGalatSmtp(e as Error), lewat: 'gmail' }
  }
}

/**
 * Galat SMTP Google datang sebagai teks panjang berisi tautan bantuan.
 * Diterjemahkan ke sebab yang bisa langsung ditindaklanjuti.
 */
export function pesanGalatSmtp(e: Error): string {
  const t = `${e.message}`
  if (/Username and Password not accepted|BadCredentials|535/i.test(t)) {
    return (
      'Google menolak login (535). Pastikan Verifikasi 2 Langkah aktif dan ' +
      'GMAIL_APP_PASSWORD berisi App Password 16 huruf, bukan kata sandi akun.'
    )
  }
  if (/Daily user sending (limit|quota) exceeded|550-5\.4\.5/i.test(t)) {
    return 'Kuota kirim harian Google terlampaui — sisa antrean dikirim besok.'
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(t)) {
    return `Tidak bisa menghubungi smtp.gmail.com (${t}).`
  }
  return t
}

async function lewatResend(pesan: {
  to: string
  subject: string
  text: string
}): Promise<HasilKirim> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: reminderFrom(),
        to: [pesan.to],
        ...(reminderBcc() ? { bcc: [reminderBcc()] } : {}),
        subject: pesan.subject,
        text: pesan.text,
      }),
    })
    const data = (await res.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null
    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || `Resend menolak (HTTP ${res.status}).`,
        lewat: 'resend',
      }
    }
    return { ok: true, id: data?.id, lewat: 'resend' }
  } catch (e) {
    return { ok: false, error: (e as Error).message, lewat: 'resend' }
  }
}
