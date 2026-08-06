import type { Permit } from './types'

/** Data demo dikosongkan — rantai izin nyata bersumber dari database. */
export const PERMITS: Permit[] = []

/** Empat kondisi/fase proyek — perizinan dikelompokkan & dikerjakan bertahap. */
export const PERMIT_FASE = ['Pra-Akuisisi', 'Akuisisi', 'Konstruksi', 'Serah Terima'] as const
export type Fase = (typeof PERMIT_FASE)[number]

interface TemplatePermit {
  kode: string
  nama: string
  prasyarat: string
}

/**
 * Bagan izin standar pengembangan perumahan, dipetakan ke empat fase. Dipakai
 * tombol "Buat checklist perizinan" untuk menambahkan izin per fase sekaligus;
 * masing-masing tetap bisa diubah, dihapus, atau ditambah manual.
 */
export const PERMIT_TEMPLATE: Record<Fase, TemplatePermit[]> = {
  'Pra-Akuisisi': [
    { kode: 'ITR', nama: 'Informasi Tata Ruang', prasyarat: '—' },
    { kode: 'LSD', nama: 'Konfirmasi Lahan Sawah Dilindungi', prasyarat: 'ITR' },
    { kode: 'FS', nama: 'Studi Kelayakan Awal (Feasibility)', prasyarat: 'ITR' },
  ],
  Akuisisi: [
    { kode: 'PKKPR', nama: 'Persetujuan KKPR', prasyarat: 'LSD' },
    { kode: 'PTP', nama: 'Persetujuan Teknis Pertanahan', prasyarat: 'PKKPR' },
    { kode: 'AJB', nama: 'Pelepasan Hak / AJB', prasyarat: 'PTP' },
    { kode: 'SHGB', nama: 'Balik Nama SHM → SHGB atas nama PT', prasyarat: 'AJB' },
  ],
  Konstruksi: [
    { kode: 'PL', nama: 'Persetujuan Lingkungan (UKL-UPL / AMDAL)', prasyarat: 'PKKPR' },
    { kode: 'ANDALALIN', nama: 'Analisis Dampak Lalu Lintas', prasyarat: 'PL' },
    { kode: 'PEIL', nama: 'Rekomendasi Peil Banjir', prasyarat: 'PL' },
    { kode: 'SITEPLAN', nama: 'Pengesahan Siteplan', prasyarat: 'PTP' },
    { kode: 'PBG', nama: 'Persetujuan Bangunan Gedung', prasyarat: 'SITEPLAN' },
  ],
  'Serah Terima': [
    { kode: 'SLF', nama: 'Sertifikat Laik Fungsi', prasyarat: 'PBG' },
    { kode: 'PECAH', nama: 'Pemecahan Sertifikat per Unit', prasyarat: 'SHGB' },
    { kode: 'PSU', nama: 'Penyerahan Prasarana, Sarana & Utilitas', prasyarat: 'SLF' },
  ],
}

/**
 * How many permits past the last completed one may still be worked on before the
 * chain locks. Everything beyond the gate renders grey with a padlock.
 */
export const UNLOCK_GATE = 4

export const PERMIT_PICS: string[] = []
export const PERMIT_VERIFIERS: string[] = []
export const PERMIT_DOCS: number[] = []

/** Deadline chips shown above the chain. */
export const H_CHIPS = [180, 90, 30, 7]
