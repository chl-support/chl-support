import { BL, TODAY } from '@/data/constants'

/** `2026-08-19` → `19 Agu 2026` */
export function fmtTgl(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return String(d.getDate()).padStart(2, '0') + ' ' + BL[d.getMonth()] + ' ' + d.getFullYear()
}

/** Days from TODAY to `iso`. Negative means overdue. */
export function hari(iso: string): number {
  const d = new Date(iso + 'T00:00:00')
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000)
}

/** `1250000000` → `Rp 1.250.000.000`, `0` → `—` */
export function rp(n: number): string {
  if (!n) return '—'
  return 'Rp ' + n.toLocaleString('id-ID')
}

export function num(n: number): string {
  return n.toLocaleString('id-ID')
}

export function inisial(nama: string): string {
  return nama
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Indonesian decimal comma, e.g. `-7.8` → `7,8` */
export function desimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}
