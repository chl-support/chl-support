/**
 * Taksonomi status sertifikasi bidang tanah pada bagan Land Acquisition.
 *
 * Dua tahap, masing-masing dua jalur, dan tiap jalur punya satu hasil akhir
 * yang tetap — hasil tidak disimpan di database, selalu diturunkan dari jenis
 * bidangnya lewat `hasilDari()`.
 */

export const LAND_TAHAP = ['Akuisisi', 'Pasca Akuisisi'] as const
export type LandTahap = (typeof LAND_TAHAP)[number]

/** Judul besar tiap tahap: siapa yang memperoleh/melepas hak. */
export const TAHAP_JUDUL: Record<LandTahap, string> = {
  Akuisisi: 'Perolehan PT',
  'Pasca Akuisisi': 'Pelepasan PT kepada Konsumen',
}

export const TAHAP_KET: Record<LandTahap, string> = {
  Akuisisi: 'Tanah masuk ke penguasaan PT — dari pemilik asal sampai hak atas nama perseroan.',
  'Pasca Akuisisi': 'Hak dilepas ke konsumen — sertifikat pecahan siap ditandatangani di AJB.',
}

export interface JalurTanah {
  tahap: LandTahap
  /** Kondisi dokumen tanah saat masuk jalur ini. */
  jenis: string
  /** Hasil akhir yang dikejar pada jalur ini. */
  hasil: string
  /** Penjelasan singkat, ditampilkan di bawah judul kartu. */
  ket: string
}

/** Empat jalur sertifikasi yang ditayangkan pada layar Land Acquisition. */
export const LAND_JALUR: JalurTanah[] = [
  {
    tahap: 'Akuisisi',
    jenis: 'Tanah Girik',
    hasil: 'Penerbitan Sertifikat',
    ket: 'Tanah adat/girik belum bersertifikat — didaftarkan pertama kali ke BPN atas nama PT.',
  },
  {
    tahap: 'Akuisisi',
    jenis: 'Tanah Sertifikat',
    hasil: 'Balik Nama PT',
    ket: 'Tanah sudah bersertifikat atas nama pemilik asal — dialihkan menjadi atas nama PT.',
  },
  {
    tahap: 'Pasca Akuisisi',
    jenis: 'Sertifikat Hak Guna Bangunan',
    hasil: 'Siap AJB',
    ket: 'SHGB induk dipecah per unit sampai siap ditandatangani AJB dengan konsumen.',
  },
  {
    tahap: 'Pasca Akuisisi',
    jenis: 'Sertifikat Hak Milik',
    hasil: 'Siap AJB',
    ket: 'SHM per bidang disiapkan sampai siap ditandatangani AJB dengan konsumen.',
  },
]

/** Semua jenis bidang yang valid — dipakai pemilih pada dialog. */
export const LAND_JENIS: string[] = LAND_JALUR.map((j) => j.jenis)

export const jalurDari = (jenis: string): JalurTanah | undefined =>
  LAND_JALUR.find((j) => j.jenis === jenis)

/** Hasil akhir yang dikejar sebuah bidang, diturunkan dari jenisnya. */
export const hasilDari = (jenis: string): string => jalurDari(jenis)?.hasil ?? '—'

/** Tahap tempat sebuah jenis bidang berada. */
export const tahapDari = (jenis: string): LandTahap =>
  jalurDari(jenis)?.tahap ?? 'Akuisisi'

export const jalurTahap = (tahap: LandTahap): JalurTanah[] =>
  LAND_JALUR.filter((j) => j.tahap === tahap)
