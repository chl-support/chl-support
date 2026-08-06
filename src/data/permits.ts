import type { Permit } from './types'

/** The 11-permit dependency chain: LSD → KKPR → … → PSU. */
export const PERMITS: Permit[] = [
  { kode: 'LSD', nama: 'Lokasi Sawah Dilindungi', prasyarat: '—', status: 'Selesai', tgl: '2026-03-04' },
  { kode: 'KKPR', nama: 'Kesesuaian Kegiatan Pemanfaatan Ruang', prasyarat: 'LSD', status: 'Selesai', tgl: '2026-03-27' },
  { kode: 'PTP', nama: 'Persetujuan Teknis Pertanahan', prasyarat: 'KKPR', status: 'Selesai', tgl: '2026-05-12' },
  { kode: 'Lingkungan', nama: 'Persetujuan Lingkungan (UKL-UPL)', prasyarat: 'PTP', status: 'Menunggu Verifikasi', tgl: '2026-08-19' },
  { kode: 'Andalalin', nama: 'Analisis Dampak Lalu Lintas', prasyarat: 'Lingkungan', status: 'Menunggu Pihak Ketiga', tgl: '2026-09-04' },
  { kode: 'Peil Banjir', nama: 'Rekomendasi Peil Banjir', prasyarat: 'Lingkungan', status: 'Belum Dimulai', tgl: '2026-09-25' },
  { kode: 'KRK', nama: 'Keterangan Rencana Kota', prasyarat: 'Andalalin', status: 'Belum Dimulai', tgl: '2026-10-06' },
  { kode: 'Siteplan', nama: 'Pengesahan Siteplan', prasyarat: 'KRK', status: 'Berjalan', tgl: '2026-08-16' },
  { kode: 'PBG', nama: 'Persetujuan Bangunan Gedung', prasyarat: 'Siteplan', status: 'Belum Dimulai', tgl: '2026-11-12' },
  { kode: 'SLF', nama: 'Sertifikat Laik Fungsi', prasyarat: 'PBG', status: 'Belum Dimulai', tgl: '2027-04-20' },
  { kode: 'PSU', nama: 'Serah terima PSU', prasyarat: 'SLF', status: 'Belum Dimulai', tgl: '2027-09-30' },
]

/**
 * How many permits past the last completed one may still be worked on before the
 * chain locks. Everything beyond the gate renders grey with a padlock and cannot
 * be submitted.
 */
export const UNLOCK_GATE = 4

/** PIC and verifier assignment, seeded from the divisional checklist template. */
export const PERMIT_PICS = [
  'Rani Puspita',
  'Nurul Aisyah',
  'Rani Puspita',
  'Rani Puspita',
  'Rani Puspita',
  'Nurul Aisyah',
  'Nurul Aisyah',
  'Rani Puspita',
  'Rani Puspita',
  'Nurul Aisyah',
  'Dimas Aryo',
]

export const PERMIT_VERIFIERS = [
  'Yudha Firmansyah',
  'Yudha Firmansyah',
  'Yudha Firmansyah',
  'Nurul Aisyah',
  'Bagas Prasetyo',
  'Rani Puspita',
  'Rani Puspita',
  'Bagas Prasetyo',
  'Yudha Firmansyah',
  'Dimas Aryo',
  'Sinta Mahardika',
]

export const PERMIT_DOCS = [4, 6, 3, 6, 3, 0, 0, 4, 0, 0, 0]

/** Deadline chips shown above the chain. */
export const H_CHIPS = [180, 90, 30, 7]
