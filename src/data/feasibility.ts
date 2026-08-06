import type { CSSProperties } from 'react'
import type { Tahap } from './types'

/** Data demo dikosongkan. Nilai kelayakan nyata akan bersumber dari backend. */
export const TAHAP: Tahap[] = []

/** Cumulative cash by month, Rp juta. */
export const KAS: number[] = []

export const FEAS_KPIS: { label: string; nilai: string; sub: string; warna: string }[] = []

export const SENSITIVITAS: {
  nama: string
  npv: string
  irr: string
  payback: string
  margin: string
  warna: string
  rowStyle: CSSProperties
}[] = []

export const TAHAP_LEGEND: { label: string; warna: string }[] = []
