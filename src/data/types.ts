export type ModuleId =
  | 'corporate'
  | 'commercial'
  | 'land'
  | 'license'
  | 'social'
  | 'feasibility'
  | 'finance'

export type NavId = 'dashboard' | 'proyek' | ModuleId | 'audit' | 'pengaturan' | 'tim'

export type ScreenId =
  | 'dashboard'
  | 'proyek'
  | 'lisensi'
  | 'feasibility'
  | 'kosong'
  | 'tim'
  | 'audit'

/** Dokumen pada menu Internal Audit (file di Blob, metadata di Neon). */
export interface AuditDoc {
  id: number
  judul: string
  filename: string
  url: string
  size: number
  contentType: string
  catatan: string
  uploadedAt: string
}

/** Baris data untuk menu Tim — direktori jabatan/divisi (CRUD tersimpan di Neon). */
export interface Personel {
  id?: number
  jabatan: string
  nama: string
  kontak: string
  catatan: string
}

export type Horizon = 'Pendek' | 'Panjang'

/** Belum Dimulai → Berjalan → Menunggu Pihak Ketiga → Menunggu Verifikasi → Selesai,
 *  with Diblokir and Dibatalkan as branches. */
export type ItemStatus =
  | 'Belum Dimulai'
  | 'Berjalan'
  | 'Menunggu Pihak Ketiga'
  | 'Menunggu Verifikasi'
  | 'Selesai'
  | 'Diblokir'
  | 'Dibatalkan'

export type Risiko = 'Rendah' | 'Sedang' | 'Tinggi'

/** Project ids are free-form slugs now that projects are created at runtime. */
export type ProjectId = string

export interface Project {
  id: ProjectId
  nama: string
  lok: string
  ha: string
  unit: number
  fase: string
  warna: string
  pemda: string
  sla: string
}

export interface Modul {
  id: ModuleId
  label: string
  pendek: string
}

/** The shared Item object — every table in the app renders this shape. */
export interface Item {
  /** Present only when the item comes from the database (used for saves/uploads). */
  id?: number
  judul: string
  modul: ModuleId
  proyek: ProjectId
  horizon: Horizon
  status: ItemStatus
  pic: string
  verif: string
  /** ISO yyyy-mm-dd */
  tgl: string
  nilai: number
  risiko: Risiko
  dok: number
  blockReason?: string | null
}

export interface Permit {
  kode: string
  nama: string
  /** Prerequisite permit code, or '—' for the root of the chain. */
  prasyarat: string
  status: ItemStatus
  tgl: string
}

export interface Tahap {
  nama: string
  /** Rp juta */
  rencana: number
  /** Rp juta */
  realisasi: number
}
