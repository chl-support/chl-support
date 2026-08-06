import type { Col } from '@/components/DataTable'

/** Full Item columns — Detail Proyek. */
export const COLS_ITEM: Col[] = [
  { k: 'judul', label: 'JUDUL', type: 'title', w: 'auto', align: 'left' },
  { k: 'status', label: 'STATUS', type: 'status', w: '168px', align: 'left' },
  { k: 'pic', label: 'PIC', type: 'person', w: '150px', align: 'left' },
  { k: 'verif', label: 'VERIFIKATOR', type: 'person', w: '150px', align: 'left' },
  { k: 'tgl', label: 'TARGET', type: 'date', w: '205px', align: 'left' },
  { k: 'nilai', label: 'NILAI', type: 'money', w: '150px', align: 'right' },
  { k: 'risiko', label: 'RISIKO', type: 'risk', w: '90px', align: 'left' },
  { k: 'dok', label: 'DOK', type: 'doc', w: '64px', align: 'right' },
]

/** Condensed columns — dashboard "Perlu perhatian Anda". */
export const COLS_RINGKAS: Col[] = [
  { k: 'judul', label: 'JUDUL', type: 'title', w: 'auto', align: 'left' },
  { k: 'proyekNama', label: 'PROYEK', type: 'text', w: '210px', align: 'left' },
  { k: 'status', label: 'STATUS', type: 'status', w: '168px', align: 'left' },
  { k: 'pic', label: 'PIC', type: 'person', w: '150px', align: 'left' },
  { k: 'tgl', label: 'TARGET', type: 'date', w: '205px', align: 'left' },
  { k: 'risiko', label: 'RISIKO', type: 'risk', w: '90px', align: 'left' },
]

/** Permit columns — Document & License. */
export const COLS_IZIN: Col[] = [
  { k: 'judul', label: 'IZIN', type: 'title', w: 'auto', align: 'left' },
  { k: 'prasyarat', label: 'PRASYARAT', type: 'text', w: '150px', align: 'left' },
  { k: 'status', label: 'STATUS', type: 'status', w: '168px', align: 'left' },
  { k: 'pic', label: 'PIC', type: 'person', w: '150px', align: 'left' },
  { k: 'verif', label: 'VERIFIKATOR', type: 'person', w: '150px', align: 'left' },
  { k: 'tgl', label: 'TARGET', type: 'date', w: '205px', align: 'left' },
  { k: 'dok', label: 'DOK', type: 'doc', w: '64px', align: 'right' },
]

export type Density = 'rapat' | 'longgar'

export const ROW_HEIGHT: Record<Density, number> = { rapat: 38, longgar: 46 }
