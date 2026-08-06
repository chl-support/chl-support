import type { CSSProperties } from 'react'
import { C, MODUL, ST } from '@/data/constants'
import { PROYEK } from '@/data/projects'
import type { Item, ItemStatus, ModuleId, ProjectId } from '@/data/types'
import { fmtTgl, hari, inisial, rp } from './format'

export interface DeadlineMeta {
  txt: string
  warna: string
  chip: string
}

/**
 * Deadline chip logic — the PRD's H-180/90/30/7 ladder collapsed to the four
 * states a row can actually be in.
 */
export function deadlineMeta(status: ItemStatus, tgl: string): DeadlineMeta {
  const h = hari(tgl)
  if (status === 'Selesai') return { txt: fmtTgl(tgl), warna: C.done, chip: 'Selesai' }
  if (h < 0) return { txt: fmtTgl(tgl), warna: C.late, chip: 'Terlambat ' + Math.abs(h) + ' hr' }
  if (h <= 7) return { txt: fmtTgl(tgl), warna: C.late, chip: 'H-' + h }
  if (h <= 30) return { txt: fmtTgl(tgl), warna: C.due, chip: 'H-' + h }
  return { txt: fmtTgl(tgl), warna: '#6B7280', chip: 'H-' + h }
}

export interface Row {
  key: string
  kode: string
  judul: string
  modul: ModuleId
  modulLabel: string
  proyek: ProjectId
  proyekNama: string
  horizon: string
  status: string
  statusWarna: string
  statusStyle: CSSProperties
  dotStyle: CSSProperties
  pic: string
  picInit: string
  verif: string
  verifInit: string
  tgl: string
  tglTxt: string
  chip: string
  chipWarna: string
  chipStyle: CSSProperties
  nilai: number
  nilaiTxt: string
  risiko: string
  risikoWarna: string
  risikoStyle: CSSProperties
  dok: number
  blocked: boolean
  blockReason: string | null
  /** Only present on permit rows. */
  prasyarat?: string
  locked?: boolean
  /** Back-reference so the drawer can render the source item. */
  item: Item
  index: number
}

export function statusBadgeStyle(warna: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 22,
    padding: '0 9px 0 7px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '14',
  }
}

export function statusDotStyle(warna: string): CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', flex: 'none', background: warna }
}

export function deadlineChipStyle(warna: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: '0 8px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 10.5,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '16',
  }
}

export function riskChipStyle(warna: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: '0 8px',
    borderRadius: 6,
    fontSize: 10.5,
    fontWeight: 700,
    color: warna,
    background: warna + '14',
  }
}

export function riskColor(risiko: string): string {
  return risiko === 'Tinggi' ? C.late : risiko === 'Sedang' ? C.due : C.idle
}

/** Turns a raw Item into everything the tables, chips and drawer need. */
export function buildRow(i: Item, idx: number): Row {
  const dm = deadlineMeta(i.status, i.tgl)
  const warna = ST[i.status] ?? C.idle
  const kode = i.modul.slice(0, 3).toUpperCase() + '-' + String(idx + 101)
  const risikoWarna = riskColor(i.risiko)
  const mod = MODUL.find((m) => m.id === i.modul)
  const pr = PROYEK.find((p) => p.id === i.proyek)

  return {
    key: kode,
    kode,
    judul: i.judul,
    modul: i.modul,
    modulLabel: mod ? mod.label : i.modul,
    proyek: i.proyek,
    proyekNama: pr ? pr.nama : '',
    horizon: i.horizon,
    status: i.status,
    statusWarna: warna,
    statusStyle: statusBadgeStyle(warna),
    dotStyle: statusDotStyle(warna),
    pic: i.pic,
    picInit: inisial(i.pic),
    verif: i.verif,
    verifInit: inisial(i.verif),
    tgl: i.tgl,
    tglTxt: dm.txt,
    chip: dm.chip,
    chipWarna: dm.warna,
    chipStyle: deadlineChipStyle(dm.warna),
    nilai: i.nilai,
    nilaiTxt: i.nilai ? rp(i.nilai) : '—',
    risiko: i.risiko,
    risikoWarna,
    risikoStyle: riskChipStyle(risikoWarna),
    dok: i.dok,
    blocked: i.status === 'Diblokir',
    blockReason: i.blockReason ?? null,
    item: i,
    index: idx,
  }
}

export function isTerlambat(r: Row): boolean {
  return r.chip.startsWith('Terlambat')
}

export type SortDir = 'asc' | 'desc'

export function sortRows(rows: Row[], key: string, dir: SortDir): Row[] {
  const mult = dir === 'asc' ? 1 : -1
  return rows.slice().sort((a, b) => {
    const x = (a as unknown as Record<string, unknown>)[key]
    const y = (b as unknown as Record<string, unknown>)[key]
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * mult
    return String(x).localeCompare(String(y), 'id') * mult
  })
}
