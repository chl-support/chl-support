/**
 * Pengiriman email transaksional lewat Resend.
 *
 * Aktif hanya bila `RESEND_API_KEY` di-set di Vercel. Tanpa kunci itu seluruh
 * alur reminder tetap berjalan, tapi tidak ada email yang benar-benar dikirim —
 * penjadwal melaporkan daftar jatuh tempo saja. Alamat pengirim harus berada di
 * domain yang sudah diverifikasi di Resend; kalau belum, Resend menolak
 * permintaannya dan pesan galatnya diteruskan apa adanya.
 */

export function resendKey(): string | undefined {
  return process.env.RESEND_API_KEY || undefined
}

/** Alamat pengirim reminder; timpa lewat REMINDER_FROM bila perlu. */
export function reminderFrom(): string {
  return (
    process.env.REMINDER_FROM ||
    'Collection CHL <agung.mulyana@ciptaharmoni.com>'
  )
}

/** Alamat yang menerima salinan/eskalasi; kosong berarti tidak ada salinan. */
export function reminderBcc(): string | undefined {
  return process.env.REMINDER_BCC || undefined
}

export interface HasilKirim {
  ok: boolean
  id?: string
  error?: string
}

/** Mengirim satu email teks biasa. Tidak pernah melempar — galat dikembalikan. */
export async function kirimEmail(pesan: {
  to: string
  subject: string
  text: string
}): Promise<HasilKirim> {
  const key = resendKey()
  if (!key) return { ok: false, error: 'RESEND_API_KEY belum di-set.' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
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
      return { ok: false, error: data?.message || `Resend menolak (HTTP ${res.status}).` }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
