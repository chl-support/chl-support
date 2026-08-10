export type ModuleId =
  | 'corporate'
  | 'commercial'
  | 'land'
  | 'license'
  | 'social'
  | 'feasibility'
  | 'finance'

export type NavId =
  | 'dashboard'
  | 'proyek'
  | ModuleId
  | 'audit'
  | 'collection'
  | 'pengaturan'
  | 'tim'

export type ScreenId =
  | 'dashboard'
  | 'proyek'
  | 'lisensi'
  | 'feasibility'
  | 'kosong'
  | 'tim'
  | 'audit'
  | 'land'
  | 'corporate'
  | 'collection'

/**
 * Status satu langkah tanda tangan. Menunggu → Diproses → Ditandatangani,
 * dengan Revisi (dikembalikan ke pengunggah) dan Dilewati (tidak relevan)
 * sebagai cabang.
 */
export type SignoffStatus = 'Menunggu' | 'Diproses' | 'Ditandatangani' | 'Revisi' | 'Dilewati'

/** Satu langkah pada alur tanda tangan sebuah dokumen audit. */
export interface SignoffStep {
  id: number
  docId: number
  /** Urutan langkah, 1..n — dokumen ditandatangani berurutan. */
  urut: number
  divisi: string
  /** Nama penanda tangan dari divisi tersebut. */
  pic: string
  status: SignoffStatus
  catatan: string
  /** ISO yyyy-mm-dd — tenggat tanda tangan langkah ini. */
  tenggat: string
  /** ISO timestamp saat langkah ditandatangani; kosong bila belum. */
  signedAt: string
  updatedAt: string
}

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
  /** Alur tanda tangan lintas divisi, terurut menaik menurut `urut`. */
  alur: SignoffStep[]
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
  /** Present only when the permit comes from the database. */
  id?: number
  proyek?: ProjectId
  /** Project phase this permit belongs to (Pra-Akuisisi … Serah Terima). */
  fase: string
  kode: string
  nama: string
  /** Prerequisite permit code, or '—' for the root of the chain. */
  prasyarat: string
  status: ItemStatus
  /** ISO yyyy-mm-dd target date. */
  tgl: string
  pic?: string
  verif?: string
  dok?: number
}

/** Satu entri komentar / jejak audit. */
export interface Komentar {
  id: number
  /** Jenis catatan induknya — 'corp' (agenda korporasi) atau 'item'. */
  entity: string
  entityId: number
  aktor: string
  teks: string
  /** 'komentar' ditulis orang, 'sistem' dicatat otomatis saat data berubah. */
  jenis: 'komentar' | 'sistem' | string
  createdAt: string
}

/** Lampiran bukti sebuah agenda korporasi. */
export interface CorpDoc {
  id: number
  corpId: number
  filename: string
  url: string
  size: number
  contentType: string
  uploadedAt: string
}

/** Satu agenda / aksi korporasi pada bagan Corporate. */
export interface Corporate {
  /** Present only when the agenda comes from the database. */
  id?: number
  proyek: ProjectId
  /** RUPST atau RUPS Biasa. */
  event: string
  /** Aksi korporasi yang diputuskan — lihat `CORP_ACTION`. */
  action: string
  /** Judul bebas, mis. "RUPST 2026 — pengangkatan direktur operasional". */
  judul: string
  /** ISO yyyy-mm-dd tanggal RUPS / efektif aksi. */
  tgl: string
  pic: string
  /** Nilai transaksi/modal dalam rupiah penuh; 0 bila tidak relevan. */
  nilai: number
  /** Kendala yang menahan agenda ini — menggantikan kolom "ketergantungan". */
  kendala: string
  status: ItemStatus
  lampiran?: CorpDoc[]
  komentar?: Komentar[]
}

/** Satu bidang tanah pada bagan Land Acquisition. */
export interface Land {
  /** Present only when the parcel comes from the database. */
  id?: number
  proyek: ProjectId
  /** Kode bidang, mis. "BID-01". */
  kode: string
  /** Nama/letak bidang, mis. "Persil Blok C1". */
  nama: string
  /** Pemilik asal (tahap akuisisi) atau konsumen (tahap pasca akuisisi). */
  pemilik: string
  /** Luas bidang dalam m². */
  luas: number
  /**
   * Jalur sertifikasi bidang ini — salah satu dari `LAND_JENIS`. Tahap dan
   * hasil akhirnya diturunkan dari nilai ini, tidak disimpan terpisah.
   */
  jenis: string
  /** Nomor girik / sertifikat yang sedang diproses. */
  noDok: string
  status: ItemStatus
  /** ISO yyyy-mm-dd target penyelesaian. */
  tgl: string
  pic: string
  catatan: string
}

/** Satu dokumen pada checklist berkas KPR. */
export interface KprDokumen {
  id: number
  kprId: number
  /** Salah satu dari `DOK_WAJIB`, atau dokumen tambahan yang diminta bank. */
  jenis: string
  /** 'Belum' | 'Diterima' | 'Perlu perbaikan' */
  status: string
  /** ISO yyyy-mm-dd saat dokumen diterima; kosong bila belum. */
  tglTerima: string
  catatan: string
}

/** Satu catatan follow-up ke customer. */
export interface KprFollowup {
  id: number
  kprId: number
  /** 0 = pengingat H-3, 1..3 = tangga setelah tenggat. */
  tingkat: number
  kanal: string
  /** Isi pesan yang dikirim — disimpan apa adanya untuk jejak audit. */
  pesan: string
  /** Tanggapan customer / hasil kontak. */
  hasil: string
  oleh: string
  createdAt: string
}

/** Satu berkas KPR yang dikawal tim Collection. */
export interface KprBerkas {
  /** Present only when the file comes from the database. */
  id?: number
  proyek: ProjectId
  nama: string
  /** Unit / kavling yang dibooking. */
  unit: string
  telepon: string
  email: string
  /** Kunci langkah pada `KPR_LANGKAH`. */
  tahap: string
  /** 'Berjalan' | 'Tertahan' | 'Ditolak Bank' | 'Selesai' | 'Batal' */
  status: string
  bank: string
  /** Nilai KPR yang diajukan, rupiah penuh. */
  nilai: number
  /** ISO yyyy-mm-dd — tanggal booking fee dibayar. */
  bookingTgl: string
  /** ISO yyyy-mm-dd — tenggat pengumpulan dokumen yang disepakati customer. */
  tenggatDokumen: string
  /** ISO yyyy-mm-dd — tanggal SP3K terbit. */
  sp3kTgl: string
  /** Masa berlaku SP3K dalam hari (default 30). */
  sp3kBerlaku: number
  /** ISO yyyy-mm-dd — jadwal/realisasi akad kredit. */
  akadTgl: string
  /** Petugas collection yang menangani. */
  pic: string
  catatan: string
  dokumen?: KprDokumen[]
  followup?: KprFollowup[]
}

export interface Tahap {
  nama: string
  /** Rp juta */
  rencana: number
  /** Rp juta */
  realisasi: number
}
