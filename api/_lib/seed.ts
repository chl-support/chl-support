/**
 * Seed data — self-contained so the serverless bundle has no cross-boundary
 * imports (ESM runtime resolves every file locally). The demo datasets are
 * intentionally empty; only the real team directory is seeded.
 */

export interface SeedProject {
  id: string
  nama: string
  lok: string
  ha: string
  unit: number
  fase: string
  warna: string
  pemda: string
  sla: string
}

export interface SeedItem {
  judul: string
  modul: string
  proyek: string
  horizon: string
  status: string
  pic: string
  verif: string
  tgl: string
  nilai?: number
  risiko: string
  dok?: number
  blockReason?: string | null
}

export interface SeedPermit {
  proyek: string
  kode: string
  nama: string
  prasyarat: string
  status: string
  tgl: string
  pic: string
  verif: string
  dok: number
}

export const seedProjects: SeedProject[] = []
export const seedItems: SeedItem[] = []
export const seedPermits: SeedPermit[] = []

/** Data tim nyata PT Cipta Harmoni Lestari — di-seed sekali saat tabel kosong. */
export const seedTim: { jabatan: string; nama: string; kontak: string; catatan: string }[] = [
  { jabatan: 'Head Legal', nama: 'Willy Susanto S.H., M.Kn', kontak: '', catatan: '' },
  { jabatan: 'License Perizinan', nama: 'Yudi Sugiharto', kontak: '', catatan: '' },
  { jabatan: 'Collection', nama: 'Agung M. Ramdhani', kontak: '', catatan: '' },
  { jabatan: 'Keuangan', nama: 'Rudy Susanto', kontak: '', catatan: '' },
  { jabatan: 'Admin Sales', nama: 'Anneke', kontak: '', catatan: '' },
]
