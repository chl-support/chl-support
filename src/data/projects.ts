import { C } from './constants'
import type { Project } from './types'

export const PROYEK: Project[] = [
  {
    id: 'srp',
    nama: 'Harmoni Serpong Fase 2',
    lok: 'Tangerang Selatan',
    ha: '8,4 Ha',
    unit: 320,
    fase: 'Perizinan',
    warna: C.done,
    pemda: 'Tangerang Selatan',
    sla: 'KKPR terbit 1×24 jam · PEMDA tercepat dari 4 wilayah',
  },
  {
    id: 'bgt',
    nama: 'Harmoni Bogor Timur',
    lok: 'Kab. Bogor',
    ha: '15,2 Ha',
    unit: 540,
    fase: 'Akuisisi',
    warna: C.due,
    pemda: 'Kab. Bogor',
    sla: 'PKKPR 3+14 hari kerja',
  },
  {
    id: 'rsb',
    nama: 'Harmoni Residence Bogor',
    lok: 'Kota Bogor',
    ha: '4,1 Ha',
    unit: 180,
    fase: 'Konstruksi',
    warna: C.done,
    pemda: 'Kota Bogor',
    sla: 'PKKPR 2+10 hari kerja',
  },
  {
    id: 'ckp',
    nama: 'Harmoni Cikupa',
    lok: 'Kab. Tangerang',
    ha: '22,7 Ha',
    unit: 760,
    fase: 'Pra-Akuisisi',
    warna: C.late,
    pemda: 'Kab. Tangerang',
    sla: 'PKKPR 5+20 hari kerja · PEMDA terlambat',
  },
]
