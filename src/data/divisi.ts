import type { SignoffStatus } from './types'
import { C } from './constants'

/**
 * Divisi/fungsi yang bisa dilibatkan pada alur tanda tangan dokumen audit.
 * Selaras dengan direktori Tim; daftar ini hanya menentukan urutan baku dan
 * penjelasan singkat tiap peran — divisi lain tetap bisa ditambahkan manual.
 */
export const DIVISI = [
  'Admin Proyek',
  'Marketing',
  'Marcom',
  'Admin Sales',
  'License & Perizinan',
  'Collection',
  'Keuangan',
  'Legal',
  'Direksi',
] as const

export type Divisi = (typeof DIVISI)[number]

/** Apa yang diperiksa tiap divisi sebelum membubuhkan tanda tangan. */
export const DIVISI_PERAN: Record<string, string> = {
  'Admin Proyek': 'Data teknis, progres pembangunan & serah terima unit',
  Marketing: 'Harga, stok unit, dan komitmen penjualan',
  Marcom: 'Materi promosi, publikasi & kesesuaian merek',
  'Admin Sales': 'Kelengkapan berkas & data pelanggan',
  'License & Perizinan': 'Kesesuaian izin dan dokumen legal proyek',
  Collection: 'Status penagihan & piutang terkait',
  Keuangan: 'Verifikasi nilai, anggaran, dan pembayaran',
  Legal: 'Telaah hukum & klausul perjanjian',
  Direksi: 'Persetujuan akhir dan tanda tangan pengesahan',
}

/**
 * Urutan baku tanda tangan: divisi penyiapan dokumen (Admin Proyek → Marketing
 * → Marcom → Admin Sales), lalu divisi pemeriksa (Perizinan → Collection →
 * Keuangan → Legal), ditutup pengesahan Direksi. Dipakai tombol "Pakai alur
 * baku" pada panel unggah; divisi yang tidak relevan tinggal diklik untuk
 * dikeluarkan sebelum dokumen diunggah.
 */
export const ALUR_TTD_DEFAULT: string[] = [
  'Admin Proyek',
  'Marketing',
  'Marcom',
  'Admin Sales',
  'License & Perizinan',
  'Collection',
  'Keuangan',
  'Legal',
  'Direksi',
]

export const SIGNOFF_STATUS: SignoffStatus[] = [
  'Menunggu',
  'Diproses',
  'Ditandatangani',
  'Revisi',
  'Dilewati',
]

/** Warna badge per status langkah, memakai palet status aplikasi. */
export const SIGNOFF_WARNA: Record<SignoffStatus, string> = {
  Menunggu: C.idle,
  Diproses: C.run,
  Ditandatangani: C.done,
  Revisi: C.late,
  Dilewati: C.idle,
}
