import { C } from '@/data/constants'
import type { AuditDoc, SignoffStep } from '@/data/types'
import { fmtTgl, hari } from './format'

/** Ringkasan status sebuah dokumen, diturunkan dari alur tanda tangannya. */
export type StatusDok = 'Belum diatur' | 'Menunggu tanda tangan' | 'Perlu revisi' | 'Selesai'

/** Langkah dianggap tuntas bila sudah ditandatangani atau memang dilewati. */
export const stepTuntas = (s: SignoffStep): boolean =>
  s.status === 'Ditandatangani' || s.status === 'Dilewati'

/** Alur dijalankan berurutan: hanya langkah tuntas pertama-pertama yang lewat. */
export function urutkan(alur: SignoffStep[]): SignoffStep[] {
  return alur.slice().sort((a, b) => a.urut - b.urut || a.id - b.id)
}

/**
 * Langkah yang sedang berjalan — langkah pertama yang belum tuntas. Bernilai
 * null saat seluruh divisi sudah menandatangani.
 */
export function stepAktif(alur: SignoffStep[]): SignoffStep | null {
  return urutkan(alur).find((s) => !stepTuntas(s)) ?? null
}

/** Langkah yang bisa ditindaklanjuti hanyalah langkah aktif — sisanya terkunci. */
export function stepTerkunci(alur: SignoffStep[], step: SignoffStep): boolean {
  const aktif = stepAktif(alur)
  return !stepTuntas(step) && aktif?.id !== step.id
}

export interface RingkasanDok {
  status: StatusDok
  warna: string
  /** Jumlah langkah tuntas. */
  selesai: number
  total: number
  /** 0..1 untuk bilah kemajuan. */
  rasio: number
  /** Divisi yang sedang ditunggu, kosong bila sudah selesai / belum diatur. */
  menunggu: string
  /** Teks tenggat langkah aktif, mis. "H-3" atau "Terlambat 5 hr". */
  chip: string
  chipWarna: string
  /** Langkah aktif melewati tenggatnya. */
  terlambat: boolean
}

/** Chip tenggat satu langkah, memakai tangga H-30/H-7 yang sama dengan izin. */
export function tenggatMeta(step: SignoffStep): { txt: string; chip: string; warna: string } {
  if (!step.tenggat) return { txt: '—', chip: '', warna: '#6B7280' }
  const txt = fmtTgl(step.tenggat)
  if (stepTuntas(step)) return { txt, chip: '', warna: C.done }
  const h = hari(step.tenggat)
  if (h < 0) return { txt, chip: 'Terlambat ' + Math.abs(h) + ' hr', warna: C.late }
  if (h <= 7) return { txt, chip: 'H-' + h, warna: C.late }
  if (h <= 30) return { txt, chip: 'H-' + h, warna: C.due }
  return { txt, chip: 'H-' + h, warna: '#6B7280' }
}

/** Semua angka yang dibutuhkan baris tabel & KPI untuk satu dokumen. */
export function ringkasDok(doc: AuditDoc): RingkasanDok {
  const alur = urutkan(doc.alur ?? [])
  const total = alur.length
  const selesai = alur.filter(stepTuntas).length
  const revisi = alur.find((s) => s.status === 'Revisi')
  const aktif = stepAktif(alur)
  const meta = aktif ? tenggatMeta(aktif) : { chip: '', warna: '#6B7280', txt: '' }

  if (!total) {
    return {
      status: 'Belum diatur',
      warna: C.idle,
      selesai: 0,
      total: 0,
      rasio: 0,
      menunggu: '',
      chip: '',
      chipWarna: '#6B7280',
      terlambat: false,
    }
  }

  const status: StatusDok = revisi
    ? 'Perlu revisi'
    : selesai === total
      ? 'Selesai'
      : 'Menunggu tanda tangan'

  return {
    status,
    warna: status === 'Selesai' ? C.done : status === 'Perlu revisi' ? C.late : C.run,
    selesai,
    total,
    rasio: selesai / total,
    menunggu: revisi ? revisi.divisi : (aktif?.divisi ?? ''),
    chip: meta.chip,
    chipWarna: meta.warna,
    terlambat: meta.chip.startsWith('Terlambat'),
  }
}

export interface KpiAudit {
  total: number
  berjalan: number
  revisi: number
  selesai: number
  terlambat: number
}

/** Angka untuk strip KPI di atas tabel. */
export function kpiAudit(docs: AuditDoc[]): KpiAudit {
  const r = docs.map(ringkasDok)
  return {
    total: docs.length,
    berjalan: r.filter((x) => x.status === 'Menunggu tanda tangan').length,
    revisi: r.filter((x) => x.status === 'Perlu revisi').length,
    selesai: r.filter((x) => x.status === 'Selesai').length,
    terlambat: r.filter((x) => x.terlambat).length,
  }
}
