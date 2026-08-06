import { C } from '@/data/constants'
import { PERMIT_DOCS, PERMIT_PICS, PERMIT_VERIFIERS, PERMITS, UNLOCK_GATE } from '@/data/permits'
import type { Item, Project, ProjectId } from '@/data/types'
import { buildRow, statusDotStyle, type Row } from './rows'

/**
 * Index of the last permit that may still be worked on. Everything after it is
 * locked: the chain only opens `UNLOCK_GATE` steps past the last completed permit.
 */
export function lockedIndex(): number {
  let last = 0
  for (let n = 0; n < PERMITS.length; n++) {
    if (PERMITS[n].status === 'Selesai') last = n
  }
  return last + UNLOCK_GATE
}

const lockedBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 22,
  padding: '0 9px 0 7px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  background: '#EFF1F4',
} as const

/** The 11 permits rendered as Item rows for the Daftar izin table. */
export function buildPermitRows(proyek: ProjectId, projects: Project[] = []): Row[] {
  const gate = lockedIndex()
  return PERMITS.map((p, n) => {
    const item: Item = {
      judul: p.kode + ' — ' + p.nama,
      modul: 'license',
      proyek,
      horizon: 'Pendek',
      status: p.status,
      pic: PERMIT_PICS[n],
      verif: PERMIT_VERIFIERS[n],
      tgl: p.tgl,
      nilai: 0,
      risiko: n >= 7 ? 'Tinggi' : 'Sedang',
      dok: PERMIT_DOCS[n],
    }
    const r = buildRow(item, 900 + n, projects)
    r.prasyarat = p.prasyarat
    r.locked = gate < n
    if (r.locked) {
      r.status = 'Terkunci'
      r.statusWarna = C.idle
      r.statusStyle = { ...lockedBadgeStyle }
      r.dotStyle = statusDotStyle(C.idle)
    }
    return r
  })
}

/** `3 selesai · 4 terkunci · 11 total` */
export function permitSummary(): string {
  const gate = lockedIndex()
  const selesai = PERMITS.filter((p) => p.status === 'Selesai').length
  const terkunci = PERMITS.length - gate - 1
  return `${selesai} selesai · ${terkunci} terkunci · ${PERMITS.length} total`
}
