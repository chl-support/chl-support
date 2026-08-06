import type { Project } from '@/data/types'
import { hari } from './format'
import { isTerlambat, type Row } from './rows'

export interface ProjectStat {
  id: string
  nama: string
  fase: string
  total: number
  selesai: number
  berjalan: number
  terlambat: number
  diblokir: number
  tenggat30: number
}

export interface AttentionRow {
  proyekNama: string
  modulLabel: string
  judul: string
  status: string
  pic: string
  tglTxt: string
  chip: string
  risiko: string
}

export interface Summary {
  totalItem: number
  selesai: number
  terlambat: number
  tenggat30: number
  diblokir: number
  menungguVerif: number
  projects: ProjectStat[]
  attention: AttentionRow[]
}

/** Rolls the live rows up into the numbers the dashboard, export and minutes share. */
export function buildSummary(rows: Row[], projects: Project[]): Summary {
  const terlambat = rows.filter(isTerlambat).length
  const tenggat30 = rows.filter(
    (r) => r.status !== 'Selesai' && hari(r.tgl) >= 0 && hari(r.tgl) <= 30,
  ).length
  const diblokir = rows.filter((r) => r.blocked).length
  const menungguVerif = rows.filter((r) => r.status === 'Menunggu Verifikasi').length
  const selesai = rows.filter((r) => r.status === 'Selesai').length

  const projectStats: ProjectStat[] = projects.map((p) => {
    const set = rows.filter((r) => r.proyek === p.id)
    return {
      id: p.id,
      nama: p.nama,
      fase: p.fase || '—',
      total: set.length,
      selesai: set.filter((r) => r.status === 'Selesai').length,
      berjalan: set.filter((r) => r.status === 'Berjalan').length,
      terlambat: set.filter(isTerlambat).length,
      diblokir: set.filter((r) => r.blocked).length,
      tenggat30: set.filter((r) => r.status !== 'Selesai' && hari(r.tgl) >= 0 && hari(r.tgl) <= 30).length,
    }
  })

  const attention: AttentionRow[] = rows
    .filter((r) => r.blocked || isTerlambat(r) || r.status === 'Menunggu Verifikasi')
    .sort((a, b) => hari(a.tgl) - hari(b.tgl))
    .slice(0, 20)
    .map((r) => ({
      proyekNama: r.proyekNama,
      modulLabel: r.modulLabel,
      judul: r.judul,
      status: r.status,
      pic: r.pic,
      tglTxt: r.tglTxt,
      chip: r.chip,
      risiko: r.risiko,
    }))

  return { totalItem: rows.length, selesai, terlambat, tenggat30, diblokir, menungguVerif, projects: projectStats, attention }
}
