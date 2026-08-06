/**
 * Seed data for a fresh database — derived straight from the front-end's demo
 * data so there is a single source of truth. These modules are pure data (no
 * DOM, no React), so they bundle cleanly into a serverless function.
 */
import { ITEMS } from '../../src/data/items'
import { PROYEK } from '../../src/data/projects'
import {
  PERMITS,
  PERMIT_PICS,
  PERMIT_VERIFIERS,
  PERMIT_DOCS,
} from '../../src/data/permits'
import type { Item, Permit, Project, ProjectId } from '../../src/data/types'

export interface SeedProject extends Project {}
export interface SeedItem extends Item {}
export interface SeedPermit extends Permit {
  proyek: ProjectId
  pic: string
  verif: string
  dok: number
}

export const seedProjects: SeedProject[] = PROYEK

export const seedItems: SeedItem[] = ITEMS

/** Data tim nyata PT Cipta Harmoni Lestari — di-seed sekali saat tabel kosong. */
export const seedTim: { jabatan: string; nama: string; kontak: string; catatan: string }[] = [
  { jabatan: 'Head Legal', nama: 'Willy Susanto S.H., M.Kn', kontak: '', catatan: '' },
  { jabatan: 'License Perizinan', nama: 'Yudi Sugiharto', kontak: '', catatan: '' },
  { jabatan: 'Collection', nama: 'Agung M. Ramdhani', kontak: '', catatan: '' },
  { jabatan: 'Keuangan', nama: 'Rudy Susanto', kontak: '', catatan: '' },
  { jabatan: 'Admin Sales', nama: 'Anneke', kontak: '', catatan: '' },
]

/**
 * The 11-permit chain is the same template for every project, so seed one copy
 * per project with the divisional PIC / verifier / document assignments.
 */
export const seedPermits: SeedPermit[] = PROYEK.flatMap((p) =>
  PERMITS.map((permit, n) => ({
    ...permit,
    proyek: p.id,
    pic: PERMIT_PICS[n],
    verif: PERMIT_VERIFIERS[n],
    dok: PERMIT_DOCS[n],
  })),
)
