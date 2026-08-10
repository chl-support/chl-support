/**
 * Alur kerja Collection untuk jobscope KPR — dua tahap, sembilan langkah, dan
 * dua percabangan yang menjadi titik rawan operasional.
 *
 * Percabangan tidak disimpan sebagai langkah tersendiri: hasilnya tercermin
 * pada status berkas (`Tertahan` saat dokumen belum lengkap, `Ditolak Bank`
 * saat kredit tidak disetujui), sehingga satu berkas tidak bisa berada di
 * langkah dan hasil yang saling bertentangan.
 */

export const KPR_FASE = [
  'Booking fee sampai pengajuan ke bank',
  'Appraisal bank sampai akad kredit',
] as const
export type KprFase = (typeof KPR_FASE)[number]

export interface KprLangkah {
  /** Kunci yang disimpan di kolom `tahap`. */
  id: string
  /** Nomor urut sesuai penomoran alur kerja (1..11, termasuk percabangan). */
  no: number
  fase: KprFase
  label: string
  ket: string
  /** Percabangan yang dievaluasi setelah langkah ini selesai. */
  cabang?: { pertanyaan: string; ya: string; tidak: string }
}

export const KPR_LANGKAH: KprLangkah[] = [
  {
    id: 'booking',
    no: 1,
    fase: KPR_FASE[0],
    label: 'Booking fee',
    ket: 'Customer membayar tanda jadi atas unit yang dipilih — titik awal seluruh proses.',
  },
  {
    id: 'verifikasi',
    no: 2,
    fase: KPR_FASE[0],
    label: 'Verifikasi dokumen',
    ket: 'Cek kelengkapan berkas customer sebelum apa pun diajukan ke bank.',
    cabang: {
      pertanyaan: 'Dokumen lengkap?',
      ya: 'Lanjut ke pembayaran DP',
      tidak: 'Follow-up ke customer, verifikasi diulang sampai lengkap',
    },
  },
  {
    id: 'dp',
    no: 4,
    fase: KPR_FASE[0],
    label: 'Pembayaran DP',
    ket: 'Monitor uang muka yang dibayar bertahap sesuai skema dengan developer.',
  },
  {
    id: 'pengajuan',
    no: 5,
    fase: KPR_FASE[0],
    label: 'Pengajuan KPR',
    ket: 'Berkas disubmit ke bank pilihan untuk diproses sebagai pengajuan kredit.',
  },
  {
    id: 'appraisal',
    no: 6,
    fase: KPR_FASE[1],
    label: 'Appraisal & BI checking',
    ket: 'Bank menilai agunan dan memeriksa riwayat kredit customer lewat SLIK.',
    cabang: {
      pertanyaan: 'Kredit disetujui?',
      ya: 'Lanjut ke penerbitan SP3K',
      tidak: 'Cari bank alternatif atau skema pembayaran lain',
    },
  },
  {
    id: 'sp3k',
    no: 8,
    fase: KPR_FASE[1],
    label: 'SP3K terbit',
    ket: 'Surat Persetujuan Pemberian Kredit terbit — masa berlakunya harus dikawal.',
  },
  {
    id: 'pelunasan',
    no: 9,
    fase: KPR_FASE[1],
    label: 'Pelunasan DP',
    ket: 'Sisa uang muka ditagih dan dilunasi sebelum akad dijadwalkan.',
  },
  {
    id: 'akad',
    no: 10,
    fase: KPR_FASE[1],
    label: 'Akad kredit',
    ket: 'Penandatanganan di hadapan notaris dan bank — titik resmi kredit terjadi.',
  },
  {
    id: 'angsuran',
    no: 11,
    fase: KPR_FASE[1],
    label: 'Monitoring angsuran',
    ket: 'Pemantauan cicilan bulanan selama developer masih terlibat.',
  },
]

export const langkahDari = (id: string): KprLangkah | undefined =>
  KPR_LANGKAH.find((l) => l.id === id)

export const langkahFase = (fase: KprFase): KprLangkah[] =>
  KPR_LANGKAH.filter((l) => l.fase === fase)

/** Urutan langkah, dipakai untuk menghitung kemajuan berkas. */
export const urutanLangkah = (id: string): number =>
  Math.max(0, KPR_LANGKAH.findIndex((l) => l.id === id))

export const KPR_STATUS = [
  'Berjalan',
  'Tertahan',
  'Ditolak Bank',
  'Selesai',
  'Batal',
] as const
export type KprStatus = (typeof KPR_STATUS)[number]

/** Penjelasan status, khususnya dua hasil percabangan. */
export const STATUS_KET: Record<string, string> = {
  Berjalan: 'Berkas bergerak normal di langkah saat ini.',
  Tertahan: 'Dokumen belum lengkap — menunggu customer melengkapi berkas.',
  'Ditolak Bank': 'Kredit tidak disetujui — perlu bank alternatif atau skema lain.',
  Selesai: 'Akad selesai dan angsuran berjalan.',
  Batal: 'Customer membatalkan atau booking hangus.',
}

// ---- Monitoring dokumen ----

export interface DokumenWajib {
  jenis: string
  ket: string
}

/** Berkas standar yang harus lengkap sebelum pengajuan dikirim ke bank. */
export const DOK_WAJIB: DokumenWajib[] = [
  { jenis: 'KTP', ket: 'KTP pemohon (dan pasangan bila sudah menikah)' },
  { jenis: 'Kartu Keluarga', ket: 'KK terbaru sesuai data pemohon' },
  { jenis: 'NPWP', ket: 'NPWP pribadi pemohon' },
  { jenis: 'Slip Gaji / Rekening Koran', ket: 'Slip 3 bulan terakhir atau rekening koran 3–6 bulan' },
  { jenis: 'Surat Keterangan Kerja', ket: 'Surat keterangan kerja / SK pengangkatan dari perusahaan' },
]

export const DOK_STATUS = ['Belum', 'Diterima', 'Perlu perbaikan'] as const
export type DokStatus = (typeof DOK_STATUS)[number]

// ---- Follow-up otomatis ----

export interface TingkatFollowup {
  /** Tingkat 0 = pengingat sebelum tenggat, 1..3 = setelah lewat tenggat. */
  tingkat: number
  nama: string
  /**
   * Hari relatif terhadap tenggat kesepakatan. Negatif = sebelum tenggat.
   * Follow-up jatuh tempo begitu hari berjalan mencapai angka ini.
   */
  hari: number
  nada: string
  /**
   * Template pesan. Placeholder: {nama} {unit} {proyek} {dokumen} {tenggat}
   * {hari} {pic}
   */
  template: string
}

/**
 * Tangga follow-up untuk customer yang belum melengkapi dokumen sampai tenggat
 * yang disepakati. Sistem menghitung sendiri tingkat yang jatuh tempo dari
 * selisih hari terhadap tenggat, lalu menyusun pesannya.
 */
export const TANGGA_FOLLOWUP: TingkatFollowup[] = [
  {
    tingkat: 0,
    nama: 'Pengingat H-3',
    hari: -3,
    nada: 'Ramah — mengingatkan sebelum tenggat',
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
    nada: 'Sopan — tenggat baru lewat',
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
    nada: 'Tegas — sudah lewat beberapa hari',
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
    nada: 'Eskalasi ke supervisor & peringatan booking',
    template:
      'Bapak/Ibu {nama}, sampai hari ini ({hari} hari setelah tenggat {tenggat}) dokumen KPR unit {unit} ' +
      'belum lengkap: {dokumen}. ' +
      'Berkas Bapak/Ibu kami eskalasi ke supervisor Collection untuk ditinjau, termasuk status booking unit. ' +
      'Mohon segera menghubungi kami hari ini agar unit tetap dapat kami tahan. — {pic}',
  },
]

/**
 * Identitas pengirim reminder Collection. Dipakai untuk menyusun tautan
 * WhatsApp/email dan sebagai tanda tangan pesan. Bila nanti pengiriman
 * dijalankan penjadwal (bukan satu klik), nilai inilah yang menjadi akun
 * pengirimnya.
 */
export const PENGIRIM_REMINDER = {
  nama: 'Agung M. Ramdhani',
  jabatan: 'Collection',
  email: 'agung.mulyana@ciptaharmoni.com',
  whatsapp: '087898116981',
}

/** Subjek email per tingkat, dipakai saat follow-up dikirim lewat email. */
export const SUBJEK_EMAIL: Record<number, string> = {
  0: 'Pengingat kelengkapan dokumen KPR — {unit}',
  1: 'Follow-up dokumen KPR yang belum lengkap — {unit}',
  2: 'Dokumen KPR belum lengkap {hari} hari setelah tenggat — {unit}',
  3: 'Eskalasi: dokumen KPR belum lengkap — {unit}',
}

export const KANAL_FOLLOWUP = ['WhatsApp', 'Telepon', 'Email', 'Kunjungan'] as const
export type KanalFollowup = (typeof KANAL_FOLLOWUP)[number]

/** Masa berlaku SP3K bawaan (hari) bila tidak diisi manual per berkas. */
export const SP3K_BERLAKU_DEFAULT = 30
