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
import type { BarisTagihan } from './sheet.js'

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


// ---- Reminder tagihan & tenggat (sumber: Google Sheet) ----

/**
 * Tiga peristiwa yang dikawal dari sheet. Tangga waktunya satu dan sama;
 * yang membedakan hanya frasa `{peristiwa}` di dalam pesannya.
 */
export const PERISTIWA = {
  bayar: { kunci: 'bayar', label: 'Pembayaran DP', frasa: 'pembayaran DP sebesar {nominal}' },
  dokumen: { kunci: 'dokumen', label: 'Jatuh tempo dokumen', frasa: 'batas kelengkapan dokumen KPR' },
  akad: { kunci: 'akad', label: 'Jatuh tempo akad kredit', frasa: 'jadwal akad kredit' },
} as const
export type JenisPeristiwa = keyof typeof PERISTIWA

/**
 * Tangga reminder terhadap tanggal peristiwa. Ubah `hari` di sini untuk
 * menggeser jadwalnya; nama tingkat ikut dipakai pada ringkasan harian.
 */
export const TANGGA_TAGIHAN: TingkatReminder[] = [
  {
    tingkat: 0,
    nama: 'Pengingat H-3',
    hari: -3,
    subjek: 'Pengingat: {label} unit {unit} pada {tenggat}',
    template:
      'Selamat pagi Bapak/Ibu {nama}, kami dari tim Collection {proyek}. ' +
      'Mengingatkan {peristiwa} untuk unit {unit} dijadwalkan pada {tenggat} ({hari} hari lagi). ' +
      'Mohon dapat dipersiapkan agar prosesnya tidak tertunda. Terima kasih. — {pic}',
  },
  {
    tingkat: 1,
    nama: 'Hari-H',
    hari: 0,
    subjek: 'Hari ini: {label} unit {unit}',
    template:
      'Selamat pagi Bapak/Ibu {nama}, hari ini ({tenggat}) adalah jadwal {peristiwa} untuk unit {unit}. ' +
      'Mohon dapat diselesaikan hari ini; bila sudah, mohon kirimkan buktinya kepada kami. ' +
      'Terima kasih. — {pic}',
  },
  {
    tingkat: 2,
    nama: 'Terlambat 3 hari',
    hari: 3,
    subjek: '{label} unit {unit} terlambat {hari} hari',
    template:
      'Bapak/Ibu {nama}, {peristiwa} untuk unit {unit} sudah {hari} hari melewati {tenggat} ' +
      'dan belum kami terima. Mohon konfirmasi kapan dapat diselesaikan. — {pic}',
  },
  {
    tingkat: 3,
    nama: 'Eskalasi',
    hari: 7,
    subjek: 'Eskalasi: {label} unit {unit} tertunggak {hari} hari',
    template:
      'Bapak/Ibu {nama}, sampai hari ini {peristiwa} untuk unit {unit} tertunggak {hari} hari ' +
      'sejak {tenggat}. Berkas Bapak/Ibu kami eskalasi ke supervisor Collection untuk ditinjau. ' +
      'Mohon segera menghubungi kami hari ini. — {pic}',
  },
]

/**
 * Peristiwa yang lewat lebih lama dari ini tidak dikirimi reminder.
 *
 * Tanpa batas ini, penjalanan pertama akan mengirim eskalasi untuk seluruh
 * baris lama di sheet sekaligus — konsumen menerima tagihan berumur berbulan-
 * bulan yang mestinya sudah diselesaikan di luar sistem. Baris setua itu
 * dilaporkan sebagai perlu ditinjau manusia, bukan dikirimi pesan.
 */
export const BATAS_KADALUARSA_HARI = 30

/** `15000000` → `Rp 15.000.000`; 0 → `-`. */
function rupiah(n: number): string {
  if (!n) return '-'
  return 'Rp ' + n.toLocaleString('id-ID')
}

export interface TagihanJatuhTempo {
  kunci: string
  baris: number
  nama: string
  unit: string
  telepon: string
  email: string
  nominal: number
  jenis: JenisPeristiwa
  label: string
  tanggal: string
  tingkat: TingkatReminder
  lewat: number
  subjek: string
  pesan: string
}

/**
 * Reminder yang jatuh tempo hari ini dari seluruh baris sheet.
 *
 * Tiap baris dievaluasi untuk ketiga peristiwanya, sehingga satu konsumen bisa
 * punya reminder pembayaran dan reminder dokumen sekaligus bila keduanya jatuh
 * pada hari yang sama. Kunci anti-ganda memuat jenis peristiwa dan tanggalnya,
 * jadi ketiganya tidak saling menutupi dan satu tingkat tidak pernah terkirim
 * dua kali. Baris berstatus lunas dilewati.
 */
export function tagihanJatuhTempo(
  baris: BarisTagihan[],
  terkirim: Map<string, number>,
  sekarang: Date,
  lunas: (status: string) => boolean,
): { antre: TagihanJatuhTempo[]; kedaluwarsa: TagihanJatuhTempo[] } {
  const hasil: TagihanJatuhTempo[] = []
  const kedaluwarsa: TagihanJatuhTempo[] = []

  for (const b of baris) {
    if (lunas(b.status)) continue

    const peristiwa: [JenisPeristiwa, string][] = [
      ['bayar', b.tglBayar],
      ['dokumen', b.jatuhTempoDokumen],
      ['akad', b.jatuhTempoAkad],
    ]

    for (const [jenis, tanggal] of peristiwa) {
      if (!tanggal) continue
      const lewat = lewatHari(tanggal, sekarang)
      const jt = TANGGA_TAGIHAN.filter((t) => lewat >= t.hari).sort(
        (a, c) => c.tingkat - a.tingkat,
      )[0]
      if (!jt) continue

      const kunci = `${b.kunci}|${jenis}|${tanggal}`
      if (jt.tingkat <= (terkirim.get(kunci) ?? -1)) continue

      const info = PERISTIWA[jenis]
      const isi: Record<string, string> = {
        nama: b.nama || 'Bapak/Ibu',
        unit: b.unit || '-',
        proyek: b.proyek || 'Cipta Harmoni Lestari',
        nominal: rupiah(b.nominal),
        tenggat: fmtTgl(tanggal),
        hari: String(Math.abs(lewat)),
        label: info.label,
        pic: PENGIRIM_NAMA,
      }
      // Frasa peristiwa boleh memuat {nominal}, jadi diisi lebih dulu.
      isi.peristiwa = isiTemplate(info.frasa, isi)

      const item = {
        kunci,
        baris: b.baris,
        nama: b.nama,
        unit: b.unit,
        telepon: b.telepon,
        email: b.email,
        nominal: b.nominal,
        jenis,
        label: info.label,
        tanggal,
        tingkat: jt,
        lewat,
        subjek: isiTemplate(jt.subjek, isi),
        pesan: isiTemplate(jt.template, isi),
      }
      if (lewat > BATAS_KADALUARSA_HARI) kedaluwarsa.push(item)
      else hasil.push(item)
    }
  }

  const urut = (a: TagihanJatuhTempo, b: TagihanJatuhTempo) => b.lewat - a.lewat
  return { antre: hasil.sort(urut), kedaluwarsa: kedaluwarsa.sort(urut) }
}

/** `08xx` → `628xx`, agar bisa dipakai pada tautan wa.me. */
export function nomorWa(telepon: string): string {
  const angka = (telepon || '').replace(/\D/g, '')
  if (!angka) return ''
  if (angka.startsWith('62')) return angka
  if (angka.startsWith('0')) return '62' + angka.slice(1)
  if (angka.startsWith('8')) return '62' + angka
  return angka
}

export const tautanWa = (telepon: string, pesan: string): string =>
  `https://wa.me/${nomorWa(telepon)}?text=${encodeURIComponent(pesan)}`
