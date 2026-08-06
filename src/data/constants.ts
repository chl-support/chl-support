import type { ItemStatus, Modul, NavId } from './types'

/** PRD accent. */
export const A = '#0F5C6B'

/** PRD status palette. */
export const C = {
  done: '#16A34A',
  run: '#2563EB',
  due: '#F59E0B',
  late: '#DC2626',
  idle: '#9CA3AF',
  verif: '#0F5C6B',
} as const

export const BL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * The prototype pins "today" so the demo data always reads the same. Swap for
 * `new Date()` once this is fed by a real backend.
 */
export const TODAY = new Date(2026, 7, 6)

export const MODUL: Modul[] = [
  { id: 'corporate', label: 'Corporate', pendek: 'Corp' },
  { id: 'commercial', label: 'Commercial', pendek: 'Comm' },
  { id: 'land', label: 'Land Acquisition', pendek: 'Land' },
  { id: 'license', label: 'Document & License', pendek: 'Izin' },
  { id: 'social', label: 'Social & Litigation', pendek: 'Sosial' },
  { id: 'feasibility', label: 'Feasibility', pendek: 'Feas' },
  { id: 'finance', label: 'Finance & Corr.', pendek: 'Fin' },
]

/** The five bagan get their own sidebar entry and drive the module tabs. */
export const BAGAN = ['corporate', 'commercial', 'land', 'license', 'social'] as const

export const ST: Record<ItemStatus, string> = {
  'Belum Dimulai': C.idle,
  Berjalan: C.run,
  'Menunggu Pihak Ketiga': C.due,
  'Menunggu Verifikasi': C.verif,
  Selesai: C.done,
  Diblokir: C.late,
  Dibatalkan: C.idle,
}

/** The happy path of the verification flow, used by the stepper. */
export const STEPS: ItemStatus[] = [
  'Belum Dimulai',
  'Berjalan',
  'Menunggu Pihak Ketiga',
  'Menunggu Verifikasi',
  'Selesai',
]

export const ICON: Record<string, string> = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  proyek:
    'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  corporate:
    'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 7h4M10 11h4M10 15h4',
  commercial: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 17h6M8 13h3',
  land: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  license: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4',
  social: 'M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l3 7a4 4 0 0 0-6 0z',
  feasibility: 'M3 17l6-6 4 4 8-8M17 7h4v4',
  finance: 'M3 8a2 2 0 0 1 2-2h13v3M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2M17 14h.01',
  audit: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  pengaturan: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  tim: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
}

export interface NavEntry {
  id: NavId
  label: string
  icon: string
}

export interface NavGroup {
  label: string
  items: NavEntry[]
}

/** Ten navigation items, per the PRD — do not add more. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: ICON.dashboard },
      { id: 'proyek', label: 'Proyek', icon: ICON.proyek },
    ],
  },
  {
    label: '5 BAGAN',
    items: [
      { id: 'corporate', label: 'Corporate', icon: ICON.corporate },
      { id: 'commercial', label: 'Commercial', icon: ICON.commercial },
      { id: 'land', label: 'Land Acquisition', icon: ICON.land },
      { id: 'license', label: 'Document & License', icon: ICON.license },
      { id: 'social', label: 'Social & Litigation', icon: ICON.social },
    ],
  },
  {
    label: 'LINTAS FUNGSI',
    items: [
      { id: 'feasibility', label: 'Feasibility & Initial Cost', icon: ICON.feasibility },
      { id: 'finance', label: 'Finance & Correspondence', icon: ICON.finance },
      { id: 'audit', label: 'Internal Audit', icon: ICON.audit },
    ],
  },
  {
    label: 'DATA',
    items: [{ id: 'tim', label: 'Tim', icon: ICON.tim }],
  },
  {
    label: 'SISTEM',
    items: [{ id: 'pengaturan', label: 'Pengaturan', icon: ICON.pengaturan }],
  },
]

/** Signed-in user shown in the topbar. */
export const CURRENT_USER = {
  nama: 'Rani Puspita',
  inisial: 'RP',
  jabatan: 'Kadiv License & Doc',
  notifikasi: 7,
}
