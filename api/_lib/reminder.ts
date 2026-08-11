/**
 * Mesin reminder sisi server — dipakai penjadwal harian untuk menentukan
 * berkas KPR mana yang jatuh tempo hari ini dan menyusun pesannya.
 *
 * Tangga dan templatenya sengaja disalin dari `src/data/kpr.ts` (bersama
 * `DOK_WAJIB`, `TAHAP`, dan `STATUS` di `api/collection.ts`): fungsi serverless
 * di-bundel terpisah dari aplikasi, jadi tidak bisa mengimpor modul frontend.
 * Bila teksnya diubah di satu tempat, ubah juga di tempat lain.
 */
import type { KprBerkasRow } from './db.js'

export interface TingkatReminder {
  tingkat: number
  nama: string
  /** Hari relatif terhadap tenggat; negatif berarti sebelum tenggat. */
  hari: number
  subjek: string
  template: string
}

export const TANGGA_REMINDER: TingkatReminder[] = [
  {
    tingkat: 0,
    nama: 'Pengingat H-3',
    hari: -3,
    subjek: 'Pengingat kelengkapan dokumen KPR — {unit}',
    template:
      'Selamat pagi Bapak/Ibu {nama}, kami dari tim Collection {proyek}. ' +
      'Mengingatkan bahwa batas pengumpulan dokumen KPR untuk unit {unit} adalah {tenggat} ({hari} hari lagi). ' +
      'Dokumen yang masih kami tunggu: {dokumen}. ' +
      'Mohon dapat dikirimkan agar pengajuan ke bank tidak tertunda. Terima kasih. — {pic}',
  },
  {
    tingkat: 1,
    nama: 'Follow-up 1',
    hari: 1,
    subjek: 'Follow-up dokumen KPR yang belum lengkap — {unit}',
    template:
      'Selamat pagi Bapak/Ibu {nama}, batas pengumpulan dokumen KPR unit {unit} telah lewat pada {tenggat}. ' +
      'Dokumen yang belum kami terima: {dokumen}. ' +
      'Mohon dikirimkan hari ini agar berkas dapat segera kami verifikasi dan ajukan ke bank. ' +
      'Bila ada kendala, silakan hubungi kami. Terima kasih. — {pic}',
  },
  {
    tingkat: 2,
    nama: 'Follow-up 2',
    hari: 4,
    subjek: 'Dokumen KPR belum lengkap {hari} hari setelah tenggat — {unit}',
    template:
      'Bapak/Ibu {nama}, dokumen KPR unit {unit} sudah {hari} hari melewati tenggat {tenggat} ' +
      'dan belum kami terima: {dokumen}. ' +
      'Pengajuan ke bank tidak dapat kami proses tanpa berkas tersebut, sehingga jadwal akad berpotensi mundur. ' +
      'Mohon konfirmasi kapan dokumen dapat dikirimkan. — {pic}',
  },
  {
    tingkat: 3,
    nama: 'Eskalasi',
    hari: 7,
    subjek: 'Eskalasi: dokumen KPR belum lengkap — {unit}',
    template:
      'Bapak/Ibu {nama}, sampai hari ini ({hari} hari setelah tenggat {tenggat}) dokumen KPR unit {unit} ' +
      'belum lengkap: {dokumen}. ' +
      'Berkas Bapak/Ibu kami eskalasi ke supervisor Collection untuk ditinjau, termasuk status booking unit. ' +
      'Mohon segera menghubungi kami hari ini agar unit tetap dapat kami tahan. — {pic}',
  },
]

/** Nama pengirim bawaan bila berkas belum punya PIC. */
export const PENGIRIM_NAMA = 'Agung M. Ramdhani'

const BL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** `2026-08-04` → `04 Agu 2026` */
function fmtTgl(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return iso
  return `${String(d.getUTCDate()).padStart(2, '0')} ${BL[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Selisih hari dari `iso` ke hari ini. Positif berarti sudah lewat.
 * Dihitung dalam UTC agar tidak bergeser oleh zona waktu server.
 */
function lewatHari(iso: string, sekarang: Date): number {
  const tenggat = Date.parse(iso + 'T00:00:00Z')
  if (Number.isNaN(tenggat)) return 0
  const hariIni = Date.UTC(sekarang.getUTCFullYear(), sekarang.getUTCMonth(), sekarang.getUTCDate())
  return Math.round((hariIni - tenggat) / 86_400_000)
}

const isiTemplate = (teks: string, isi: Record<string, string>): string =>
  teks.replace(/\{(\w+)\}/g, (cocok, kunci: string) => isi[kunci] ?? cocok)

export interface ReminderJatuhTempo {
  berkas: KprBerkasRow
  tingkat: TingkatReminder
  /** Dokumen yang belum diterima — isi utama pesannya. */
  kurang: string[]
  lewat: number
  subjek: string
  pesan: string
}

/**
 * Berkas yang reminder-nya jatuh tempo hari ini.
 *
 * Aturannya sama persis dengan yang ditampilkan layar Collection: dokumen belum
 * lengkap, tenggat sudah diisi, status bukan Batal/Selesai, dan tingkat yang
 * jatuh tempo belum pernah dikirim. Tidak ada status yang disimpan — posisinya
 * selalu diturunkan dari tenggat dan riwayat kontak, sehingga penjadwal tidak
 * bisa mengirim tingkat yang sama dua kali.
 */
export function reminderJatuhTempo(
  daftar: KprBerkasRow[],
  proyekNama: Map<string, string>,
  sekarang: Date,
): ReminderJatuhTempo[] {
  const hasil: ReminderJatuhTempo[] = []

  for (const berkas of daftar) {
    if (!berkas.tenggatDokumen) continue
    if (berkas.status === 'Batal' || berkas.status === 'Selesai') continue

    const kurang = berkas.dokumen.filter((d) => d.status !== 'Diterima').map((d) => d.jenis)
    if (!berkas.dokumen.length || !kurang.length) continue

    const lewat = lewatHari(berkas.tenggatDokumen, sekarang)
    const jatuhTempo = TANGGA_REMINDER.filter((t) => lewat >= t.hari).sort(
      (a, b) => b.tingkat - a.tingkat,
    )[0]
    if (!jatuhTempo) continue

    const terkirim = berkas.followup.length
      ? Math.max(...berkas.followup.map((f) => f.tingkat))
      : -1
    if (jatuhTempo.tingkat <= terkirim) continue

    const isi: Record<string, string> = {
      nama: berkas.nama || 'Bapak/Ibu',
      unit: berkas.unit || '-',
      proyek: proyekNama.get(berkas.proyek) || 'developer',
      dokumen: kurang.join(', '),
      tenggat: fmtTgl(berkas.tenggatDokumen),
      hari: String(Math.abs(lewat)),
      pic: berkas.pic || PENGIRIM_NAMA,
    }

    hasil.push({
      berkas,
      tingkat: jatuhTempo,
      kurang,
      lewat,
      subjek: isiTemplate(jatuhTempo.subjek, isi),
      pesan: isiTemplate(jatuhTempo.template, isi),
    })
  }

  // Paling lama terlambat dikerjakan lebih dulu.
  return hasil.sort((a, b) => b.lewat - a.lewat)
}
