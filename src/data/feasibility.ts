import { A, C } from './constants'
import type { Tahap } from './types'

/** Initial cost, 11 tahap. Values in Rp juta. */
export const TAHAP: Tahap[] = [
  { nama: 'Studi kelayakan & riset pasar', rencana: 3500, realisasi: 3410 },
  { nama: 'Perizinan dasar (LSD–PTP)', rencana: 7800, realisasi: 7250 },
  { nama: 'Akuisisi lahan', rencana: 42000, realisasi: 41600 },
  { nama: 'Sertifikasi & balik nama', rencana: 4200, realisasi: 3980 },
  { nama: 'Perizinan konstruksi', rencana: 5600, realisasi: 5100 },
  { nama: 'Desain & perencanaan', rencana: 6100, realisasi: 5850 },
  { nama: 'Land clearing & cut-fill', rencana: 3800, realisasi: 2900 },
  { nama: 'Infrastruktur utama', rencana: 9400, realisasi: 8600 },
  { nama: 'Konstruksi unit tahap 1', rencana: 5200, realisasi: 4300 },
  { nama: 'PSU & serah terima', rencana: 4900, realisasi: 3200 },
  { nama: 'Legalitas konsumen', rencana: 3700, realisasi: 2510 },
]

/** Cumulative cash by month, Rp juta. Month 0 … month 24. */
export const KAS = [
  0, -6200, -14800, -24500, -33100, -41600, -49200, -56800, -62400, -67900, -71800, -74900, -76800,
  -77900, -78500, -74100, -63200, -48600, -31200, -12400, 7800, 26400, 41200, 52600, 60800,
]

export const FEAS_KPIS = [
  { label: 'NPV', nilai: 'Rp 42,8 M', sub: 'Diskonto 12% · 24 bulan', warna: '#111827' },
  { label: 'IRR', nilai: '18,4%', sub: 'Ambang minimum 13%', warna: C.done },
  { label: 'Payback', nilai: '3,2 th', sub: 'Target maksimum 4 th', warna: '#111827' },
  { label: 'Margin', nilai: '22,1%', sub: 'Ambang minimum 15%', warna: C.done },
  { label: 'BEP', nilai: '187 unit', sub: '58% dari 320 unit', warna: '#111827' },
  { label: 'Peak cash', nilai: 'Rp 78,5 M', sub: 'Bulan ke-14', warna: C.late },
]

export const SENSITIVITAS = [
  {
    nama: 'Pesimis',
    npv: 'Rp 18,3 M',
    irr: '13,9%',
    payback: '4,1 th',
    margin: '15,6%',
    warna: C.due,
    rowStyle: { borderBottom: '1px solid #F1F3F5' },
  },
  {
    nama: 'Basis',
    npv: 'Rp 42,8 M',
    irr: '18,4%',
    payback: '3,2 th',
    margin: '22,1%',
    warna: A,
    rowStyle: { borderBottom: '1px solid #F1F3F5', background: '#F5FAFA' },
  },
  {
    nama: 'Optimis',
    npv: 'Rp 61,5 M',
    irr: '22,7%',
    payback: '2,7 th',
    margin: '26,8%',
    warna: C.done,
    rowStyle: {},
  },
]

export const TAHAP_LEGEND = [
  { label: 'Sesuai/di bawah rencana', warna: A },
  { label: 'Melebihi rencana', warna: C.late },
]
