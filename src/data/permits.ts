import type { Permit } from './types'

/** Data demo dikosongkan — rantai izin nyata bersumber dari database. */
export const PERMITS: Permit[] = []

/**
 * How many permits past the last completed one may still be worked on before the
 * chain locks. Everything beyond the gate renders grey with a padlock.
 */
export const UNLOCK_GATE = 4

export const PERMIT_PICS: string[] = []
export const PERMIT_VERIFIERS: string[] = []
export const PERMIT_DOCS: number[] = []

/** Deadline chips shown above the chain. */
export const H_CHIPS = [180, 90, 30, 7]
