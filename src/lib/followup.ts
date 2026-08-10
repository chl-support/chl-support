import { C, CURRENT_USER } from '@/data/constants'
import {
  DOK_WAJIB,
  SP3K_BERLAKU_DEFAULT,
  TANGGA_FOLLOWUP,
  langkahDari,
  urutanLangkah,
  type TingkatFollowup,
} from '@/data/kpr'
import { KPR_LANGKAH } from '@/data/kpr'
import type { KprBerkas, KprDokumen } from '@/data/types'
import { fmtTgl, hari } from './format'

/** Dokumen dianggap beres begitu statusnya Diterima. */
export const dokBeres = (d: KprDokumen): boolean => d.status === 'Diterima'

export interface StatusDokumen {
  total: number
  diterima: number
  /** Jenis dokumen yang belum diterima — bahan isi pesan follow-up. */
  kurang: string[]
  lengkap: boolean
  rasio: number
}

export function statusDokumen(berkas: KprBerkas): StatusDokumen {
  const list = berkas.dokumen ?? []
  const diterima = list.filter(dokBeres).length
  return {
    total: list.length,
    diterima,
    kurang: list.filter((d) => !dokBeres(d)).map((d) => d.jenis),
    lengkap: list.length > 0 && diterima === list.length,
    rasio: list.length ? diterima / list.length : 0,
  }
}

export interface StatusFollowup {
  /** Berkas ini memang perlu dikejar (dokumen belum lengkap & ada tenggat). */
  perlu: boolean
  /** Hari terhadap tenggat: negatif = belum jatuh tempo, positif = terlambat. */
  lewat: number
  /** Tingkat yang jatuh tempo sekarang, null bila belum ada yang jatuh tempo. */
  jatuhTempo: TingkatFollowup | null
  /** Tingkat tertinggi yang sudah pernah dikirim. */
  terkirim: number
  /** Masih ada follow-up jatuh tempo yang belum dikirim. */
  tertunggak: boolean
  /** Tingkat berikutnya beserta tanggal jadwalnya. */
  berikutnya: { tingkat: TingkatFollowup; tgl: string } | null
  warna: string
  label: string
}

/** Menggeser tanggal ISO sejumlah hari, mengembalikan ISO yyyy-mm-dd. */
function geser(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Menentukan posisi berkas pada tangga follow-up. Semuanya diturunkan — tidak
 * ada status follow-up yang disimpan — sehingga daftar "perlu dikejar hari ini"
 * selalu konsisten dengan tenggat dan riwayat kontak yang tercatat.
 */
export function statusFollowup(berkas: KprBerkas): StatusFollowup {
  const dok = statusDokumen(berkas)
  const riwayat = berkas.followup ?? []
  const terkirim = riwayat.length ? Math.max(...riwayat.map((f) => f.tingkat)) : -1
  const diam: StatusFollowup = {
    perlu: false,
    lewat: 0,
    jatuhTempo: null,
    terkirim,
    tertunggak: false,
    berikutnya: null,
    warna: C.idle,
    label: '—',
  }

  // Sudah lengkap, dibatalkan, atau belum ada tenggat → tidak dikejar.
  if (dok.lengkap || !berkas.tenggatDokumen) return diam
  if (berkas.status === 'Batal' || berkas.status === 'Selesai') return diam

  const lewat = -hari(berkas.tenggatDokumen)
  const jatuhTempo =
    TANGGA_FOLLOWUP.filter((t) => lewat >= t.hari).sort((a, b) => b.tingkat - a.tingkat)[0] ?? null
  const berikutnyaTingkat = TANGGA_FOLLOWUP.find((t) => t.tingkat > Math.max(terkirim, -1))
  const berikutnya = berikutnyaTingkat
    ? { tingkat: berikutnyaTingkat, tgl: geser(berkas.tenggatDokumen, berikutnyaTingkat.hari) }
    : null
  const tertunggak = !!jatuhTempo && jatuhTempo.tingkat > terkirim

  const warna = lewat >= 7 ? C.late : lewat >= 1 ? C.due : C.run
  const label = tertunggak
    ? `${jatuhTempo!.nama} jatuh tempo`
    : lewat > 0
      ? `Terlambat ${lewat} hr · ${TANGGA_FOLLOWUP[terkirim]?.nama ?? 'follow-up'} terkirim`
      : `H-${Math.abs(lewat)} tenggat`

  return { perlu: true, lewat, jatuhTempo, terkirim, tertunggak, berikutnya, warna, label }
}

/** Mengisi placeholder template dengan data berkas. */
export function susunPesan(
  berkas: KprBerkas,
  tingkat: TingkatFollowup,
  proyekNama: string,
): string {
  const dok = statusDokumen(berkas)
  const lewat = berkas.tenggatDokumen ? -hari(berkas.tenggatDokumen) : 0
  const isi: Record<string, string> = {
    nama: berkas.nama || 'Bapak/Ibu',
    unit: berkas.unit || '-',
    proyek: proyekNama || 'developer',
    dokumen: dok.kurang.length ? dok.kurang.join(', ') : 'seluruh dokumen sudah lengkap',
    tenggat: berkas.tenggatDokumen ? fmtTgl(berkas.tenggatDokumen) : '-',
    // Sebelum tenggat placeholder {hari} berarti sisa hari, sesudahnya keterlambatan.
    hari: String(Math.abs(lewat)),
    pic: berkas.pic || CURRENT_USER.nama,
  }
  return tingkat.template.replace(/\{(\w+)\}/g, (cocok, kunci: string) => isi[kunci] ?? cocok)
}

/** `08xx` / `+62 8xx` → `628xx`, agar bisa dipakai pada tautan wa.me. */
export function nomorWa(telepon: string): string {
  const angka = telepon.replace(/\D/g, '')
  if (!angka) return ''
  if (angka.startsWith('62')) return angka
  if (angka.startsWith('0')) return '62' + angka.slice(1)
  if (angka.startsWith('8')) return '62' + angka
  return angka
}

export const tautanWa = (telepon: string, pesan: string): string =>
  `https://wa.me/${nomorWa(telepon)}?text=${encodeURIComponent(pesan)}`

// ---- SP3K ----

export interface StatusSp3k {
  ada: boolean
  /** ISO yyyy-mm-dd batas akhir masa berlaku. */
  kedaluwarsa: string
  sisa: number
  warna: string
  chip: string
}

/**
 * Masa berlaku SP3K — titik kritis yang harus dikawal supaya pelunasan DP dan
 * akad tidak lewat dari surat persetujuan bank.
 */
export function statusSp3k(berkas: KprBerkas): StatusSp3k {
  if (!berkas.sp3kTgl) {
    return { ada: false, kedaluwarsa: '', sisa: 0, warna: C.idle, chip: '' }
  }
  const kedaluwarsa = geser(berkas.sp3kTgl, berkas.sp3kBerlaku || SP3K_BERLAKU_DEFAULT)
  const sisa = hari(kedaluwarsa)
  // Setelah akad, masa berlaku tidak relevan lagi.
  const selesai = berkas.tahap === 'akad' || berkas.tahap === 'angsuran'
  if (selesai) return { ada: true, kedaluwarsa, sisa, warna: C.done, chip: '' }
  const warna = sisa < 0 ? C.late : sisa <= 7 ? C.late : sisa <= 14 ? C.due : '#6B7280'
  const chip = sisa < 0 ? `SP3K lewat ${Math.abs(sisa)} hr` : `SP3K H-${sisa}`
  return { ada: true, kedaluwarsa, sisa, warna, chip }
}

// ---- Ringkasan layar ----

export interface KpiCollection {
  berkas: number
  dokumenKurang: number
  perluFollowup: number
  tertahan: number
  ditolak: number
  sp3kKritis: number
  akadSiap: number
}

export function kpiCollection(list: KprBerkas[]): KpiCollection {
  const aktif = list.filter((b) => b.status !== 'Batal')
  return {
    berkas: list.length,
    dokumenKurang: aktif.filter((b) => !statusDokumen(b).lengkap).length,
    perluFollowup: aktif.filter((b) => statusFollowup(b).tertunggak).length,
    tertahan: aktif.filter((b) => b.status === 'Tertahan').length,
    ditolak: list.filter((b) => b.status === 'Ditolak Bank').length,
    sp3kKritis: aktif.filter((b) => {
      const s = statusSp3k(b)
      return s.ada && !!s.chip && s.sisa <= 14
    }).length,
    akadSiap: aktif.filter((b) => b.tahap === 'pelunasan' || b.tahap === 'akad').length,
  }
}

/** Jumlah berkas yang berhenti di tiap langkah — untuk corong pipeline. */
export function corongPipeline(list: KprBerkas[]): { id: string; label: string; n: number }[] {
  return KPR_LANGKAH.map((l) => ({
    id: l.id,
    label: l.label,
    n: list.filter((b) => b.tahap === l.id && b.status !== 'Batal').length,
  }))
}

/** Berkas yang perlu dikejar hari ini, terlambat paling lama di atas. */
export function antrianFollowup(list: KprBerkas[]): KprBerkas[] {
  return list
    .filter((b) => statusFollowup(b).tertunggak)
    .sort((a, b) => statusFollowup(b).lewat - statusFollowup(a).lewat)
}

/** Checklist bawaan dipakai saat berkas belum punya baris dokumen sama sekali. */
export const jenisWajib = (): string[] => DOK_WAJIB.map((d) => d.jenis)

export const labelTahap = (id: string): string => langkahDari(id)?.label ?? id
export const nomorTahap = (id: string): number => urutanLangkah(id) + 1
