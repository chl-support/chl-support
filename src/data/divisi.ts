import type { SignoffStatus } from './types'
import { C } from './constants'

/**
 * Divisi/fungsi yang bisa dilibatkan pada alur tanda tangan dokumen audit.
 * Selaras dengan direktori Tim; daftar ini hanya menentukan urutan baku dan
 * penjelasan singkat tiap peran — divisi lain tetap bisa ditambahkan manual.
 */
export const DIVISI = [
  'Admin Sales',
  'License & Perizinan',
  'Collection',
  'Keuangan',
  'Head Legal',
  'Direksi',
] as const

export type Divisi = (typeof DIVISI)[number]

/** Apa yang diperiksa tiap divisi sebelum membubuhkan tanda tangan. */
export const DIVISI_PERAN: Record<string, string> = {
  'Admin Sales': 'Kelengkapan berkas & data pelanggan',
  'License & Perizinan': 'Kesesuaian izin dan dokumen legal proyek',
  Collection: 'Status penagihan & piutang terkait',
  Keuangan: 'Verifikasi nilai, anggaran, dan pembayaran',
  'Head Legal': 'Telaah hukum & klausul perjanjian',
  Direksi: 'Persetujuan akhir dan tanda tangan pengesahan',
}

/**
 * Urutan baku tanda tangan: dari penyiapan berkas di hilir sampai pengesahan
 * direksi. Dipakai tombol "Alur baku" pada panel unggah.
 */
export const ALUR_TTD_DEFAULT: string[] = [
  'Admin Sales',
  'License & Perizinan',
  'Collection',
  'Keuangan',
  'Head Legal',
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
