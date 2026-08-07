/**
 * Susunan dasar bagan Corporate: setiap agenda adalah satu *event* RUPS yang
 * membawa satu *action* korporasi. Daftar ini dipakai pemilih pada dialog dan
 * dikirim apa adanya ke `/api/corporate`, yang memvalidasi ulang nilainya.
 */

export const CORP_EVENT = ['RUPST', 'RUPS Biasa'] as const
export type CorpEvent = (typeof CORP_EVENT)[number]

export const EVENT_KET: Record<string, string> = {
  RUPST: 'Rapat Umum Pemegang Saham Tahunan — agenda wajib tiap tahun buku.',
  'RUPS Biasa': 'RUPS di luar agenda tahunan, dipanggil sesuai kebutuhan korporasi.',
}

export const CORP_ACTION = [
  'Perubahan Direksi',
  'Perubahan Komisaris',
  'Perubahan Pemegang Saham',
  'Perubahan Anggaran Dasar',
  'Perubahan KBLI',
  'Perubahan Modal',
  'Corporate Action Lainnya',
] as const
export type CorpAction = (typeof CORP_ACTION)[number]

/** Bukti yang biasanya harus dilampirkan tiap aksi — muncul sebagai petunjuk. */
export const ACTION_BUKTI: Record<string, string> = {
  'Perubahan Direksi': 'Akta perubahan direksi + SK Kemenkumham',
  'Perubahan Komisaris': 'Akta perubahan komisaris + SK Kemenkumham',
  'Perubahan Pemegang Saham': 'Akta pengalihan saham + daftar pemegang saham terbaru',
  'Perubahan Anggaran Dasar': 'Akta perubahan anggaran dasar + persetujuan Kemenkumham',
  'Perubahan KBLI': 'Akta/berita acara + NIB dengan KBLI terbaru (OSS)',
  'Perubahan Modal': 'Akta penambahan/pengurangan modal + bukti setor',
  'Corporate Action Lainnya': 'Akta atau berita acara RUPS beserta lampirannya',
}
