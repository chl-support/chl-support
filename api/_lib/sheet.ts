/**
 * Pembaca jadwal pembayaran dari Google Sheet yang dipublikasikan.
 *
 * Sheet dibaca sebagai CSV, jadi tidak perlu kredensial apa pun — syaratnya
 * sheet itu dibagikan sebagai "siapa saja yang memiliki link" atau
 * dipublikasikan lewat File → Bagikan → Publikasikan ke web.
 *
 * Susunan kolomnya tidak dipatok: header dicocokkan dengan daftar alias, dan
 * hasil pencocokannya dilaporkan lewat `/api/collection?action=sheet` supaya
 * salah petak langsung kelihatan tanpa perlu menebak-nebak.
 */

/** Sheet bawaan; timpa lewat SHEET_TAGIHAN_URL atau SHEET_TAGIHAN_ID/GID. */
const SHEET_ID_DEFAULT = '1tWL35cjL3grqSRKqAz66_SROzZSLeTAQJcPiGXX1EC8'
const SHEET_GID_DEFAULT = '1935898076'

export function sheetUrl(): string {
  if (process.env.SHEET_TAGIHAN_URL) return process.env.SHEET_TAGIHAN_URL
  const id = process.env.SHEET_TAGIHAN_ID || SHEET_ID_DEFAULT
  const gid = process.env.SHEET_TAGIHAN_GID || SHEET_GID_DEFAULT
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

// ---- CSV ----

/**
 * Pemecah CSV yang menghormati tanda kutip, koma di dalam kutip, kutip ganda
 * sebagai escape, dan baris yang berakhiran CRLF.
 */
export function parseCsv(teks: string): string[][] {
  const baris: string[][] = []
  let sel = ''
  let baris_ini: string[] = []
  let dalamKutip = false

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i]
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') {
          sel += '"'
          i++
        } else {
          dalamKutip = false
        }
      } else {
        sel += c
      }
      continue
    }
    if (c === '"') {
      dalamKutip = true
    } else if (c === ',') {
      baris_ini.push(sel)
      sel = ''
    } else if (c === '\n') {
      baris_ini.push(sel)
      baris.push(baris_ini)
      baris_ini = []
      sel = ''
    } else if (c !== '\r') {
      sel += c
    }
  }
  if (sel !== '' || baris_ini.length) {
    baris_ini.push(sel)
    baris.push(baris_ini)
  }
  // Buang baris yang seluruh selnya kosong.
  return baris.filter((r) => r.some((s) => s.trim() !== ''))
}

// ---- Pencocokan kolom ----

export type Kolom =
  | 'nama'
  | 'unit'
  | 'telepon'
  | 'email'
  | 'proyek'
  | 'tglBayar'
  | 'jatuhTempo'
  | 'nominal'
  | 'status'

/** Alias header per kolom, sudah dinormalkan (huruf kecil, tanpa non-alfanumerik). */
const ALIAS: Record<Kolom, string[]> = {
  nama: ['nama', 'namakonsumen', 'namacustomer', 'namapembeli', 'customer', 'konsumen', 'debitur', 'pembeli'],
  unit: ['unit', 'nounit', 'kavling', 'nokavling', 'blok', 'noblok', 'unitkavling', 'rumah'],
  telepon: ['whatsapp', 'nowhatsapp', 'wa', 'nowa', 'nohp', 'hp', 'telepon', 'notelepon', 'telp', 'notelp', 'kontak'],
  email: ['email', 'alamatemail', 'surel', 'emailkonsumen'],
  proyek: ['proyek', 'project', 'perumahan', 'cluster', 'lokasi'],
  tglBayar: ['tanggalpembayaran', 'tglpembayaran', 'tanggalbayar', 'tglbayar', 'tanggaltransfer', 'paymentdate', 'tanggalangsuran'],
  jatuhTempo: ['jatuhtempo', 'tanggaljatuhtempo', 'tgljatuhtempo', 'jatuhtempopembayaran', 'duedate', 'tempo'],
  nominal: ['nominal', 'jumlah', 'jumlahtagihan', 'angsuran', 'tagihan', 'nilai', 'amount', 'besarangsuran'],
  status: ['status', 'statusbayar', 'statuspembayaran', 'keterangan', 'ket'],
}

const normal = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Memetakan indeks kolom untuk tiap field. Cocok persis diutamakan; bila tidak
 * ada, header yang *mengandung* alias dipakai sebagai cadangan.
 */
export function petakanKolom(header: string[]): Partial<Record<Kolom, number>> {
  const norm = header.map(normal)
  const peta: Partial<Record<Kolom, number>> = {}
  const terpakai = new Set<number>()

  for (const [kolom, alias] of Object.entries(ALIAS) as [Kolom, string[]][]) {
    let idx = norm.findIndex((h, i) => !terpakai.has(i) && alias.includes(h))
    if (idx < 0) {
      idx = norm.findIndex(
        (h, i) => !terpakai.has(i) && h.length > 2 && alias.some((a) => h.includes(a)),
      )
    }
    if (idx >= 0) {
      peta[kolom] = idx
      terpakai.add(idx)
    }
  }
  return peta
}

// ---- Tanggal & angka ----

const BULAN_ID: Record<string, number> = {
  jan: 1, januari: 1, feb: 2, februari: 2, pebruari: 2, mar: 3, maret: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, jul: 7, juli: 7,
  agu: 8, agt: 8, agust: 8, agustus: 8, aug: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12,
}

const pad = (n: number): string => String(n).padStart(2, '0')
const rakit = (y: number, m: number, d: number): string | null =>
  m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 ? `${y}-${pad(m)}-${pad(d)}` : null

/**
 * Mengurai tanggal dari sheet menjadi ISO `yyyy-mm-dd`.
 *
 * Format `d/m/y` dibaca **hari lebih dulu** mengikuti kebiasaan Indonesia.
 * Bila angka pertama > 12 urutannya pasti hari-bulan; bila keduanya ≤ 12
 * bentuknya ambigu (03/04 bisa 3 April atau 4 Maret) — `ambigu` menandainya
 * agar bisa dilaporkan dan diperiksa manusia.
 */
export function uraiTanggal(teks: string): { iso: string | null; ambigu: boolean } {
  const t = (teks ?? '').trim()
  if (!t) return { iso: null, ambigu: false }

  // 2026-08-04
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return { iso: rakit(+m[1], +m[2], +m[3]), ambigu: false }

  // 04/08/2026 · 4-8-2026 · 04.08.26
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const a = +m[1]
    const b = +m[2]
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]
    // Angka pertama > 12 → pasti hari; sisanya diasumsikan hari-bulan.
    return { iso: rakit(y, b, a), ambigu: a <= 12 && b <= 12 }
  }

  // 4 Agustus 2026 · 04 Agu 26
  m = t.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{2,4})$/)
  if (m) {
    const bulan = BULAN_ID[m[2].toLowerCase()]
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]
    if (bulan) return { iso: rakit(y, bulan, +m[1]), ambigu: false }
  }

  return { iso: null, ambigu: false }
}

/** `Rp 15.000.000` / `15,000,000` → `15000000`. */
export function uraiNominal(teks: string): number {
  const angka = (teks ?? '').replace(/[^\d]/g, '')
  return angka ? Number(angka) : 0
}

// ---- Baris tagihan ----

export interface BarisTagihan {
  /** Nomor baris di sheet (1 = header), untuk memudahkan penelusuran. */
  baris: number
  nama: string
  unit: string
  telepon: string
  email: string
  proyek: string
  /** ISO yyyy-mm-dd, kosong bila tidak terbaca. */
  tglBayar: string
  jatuhTempo: string
  nominal: number
  status: string
  /** Kunci stabil untuk mencegah reminder ganda pada baris yang sama. */
  kunci: string
}

export interface HasilSheet {
  ok: boolean
  url: string
  error?: string
  header: string[]
  /** Kolom yang dikenali → nama header aslinya. */
  kolom: Partial<Record<Kolom, string>>
  /** Kolom yang tidak ditemukan sama sekali. */
  hilang: Kolom[]
  baris: BarisTagihan[]
  /** Baris yang tanggalnya tidak terbaca, beserta isinya apa adanya. */
  tanggalGagal: { baris: number; tglBayar: string; jatuhTempo: string }[]
  /** Ada tanggal d/m yang bisa terbaca dua arti — perlu dipastikan manusia. */
  adaTanggalAmbigu: boolean
}

const sel = (row: string[], idx: number | undefined): string =>
  idx == null ? '' : (row[idx] ?? '').trim()

/** Mengambil sheet dan menguraikannya menjadi baris tagihan + diagnostik. */
export async function ambilSheet(url = sheetUrl()): Promise<HasilSheet> {
  const kosong: HasilSheet = {
    ok: false,
    url,
    header: [],
    kolom: {},
    hilang: [],
    baris: [],
    tanggalGagal: [],
    adaTanggalAmbigu: false,
  }

  let teks: string
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      return {
        ...kosong,
        error:
          `Google menolak permintaan (HTTP ${res.status}). Pastikan sheet dibagikan sebagai ` +
          '"Siapa saja yang memiliki link" atau dipublikasikan lewat File → Bagikan → Publikasikan ke web.',
      }
    }
    teks = await res.text()
  } catch (e) {
    return { ...kosong, error: `Gagal menghubungi Google Sheet: ${(e as Error).message}` }
  }

  // Sheet privat memulangkan halaman login HTML, bukan CSV.
  if (/^\s*<(!doctype|html)/i.test(teks)) {
    return {
      ...kosong,
      error:
        'Yang diterima halaman HTML, bukan CSV — sheet masih privat. Ubah pembagiannya menjadi ' +
        '"Siapa saja yang memiliki link" (Pelihat), lalu coba lagi.',
    }
  }

  const tabel = parseCsv(teks)
  if (!tabel.length) return { ...kosong, error: 'Sheet terbaca tapi tidak berisi baris apa pun.' }

  const header = tabel[0].map((h) => h.trim())
  const peta = petakanKolom(header)
  const kolom: Partial<Record<Kolom, string>> = {}
  for (const [k, i] of Object.entries(peta) as [Kolom, number][]) kolom[k] = header[i]
  const hilang = (Object.keys(ALIAS) as Kolom[]).filter((k) => peta[k] == null)

  const baris: BarisTagihan[] = []
  const tanggalGagal: HasilSheet['tanggalGagal'] = []
  let adaTanggalAmbigu = false

  for (let i = 1; i < tabel.length; i++) {
    const row = tabel[i]
    const nama = sel(row, peta.nama)
    const unit = sel(row, peta.unit)
    if (!nama && !unit) continue // baris pemisah / total

    const bayarMentah = sel(row, peta.tglBayar)
    const tempoMentah = sel(row, peta.jatuhTempo)
    const bayar = uraiTanggal(bayarMentah)
    const tempo = uraiTanggal(tempoMentah)
    if (bayar.ambigu || tempo.ambigu) adaTanggalAmbigu = true
    if ((bayarMentah && !bayar.iso) || (tempoMentah && !tempo.iso)) {
      tanggalGagal.push({ baris: i + 1, tglBayar: bayarMentah, jatuhTempo: tempoMentah })
    }

    baris.push({
      baris: i + 1,
      nama,
      unit,
      telepon: sel(row, peta.telepon),
      email: sel(row, peta.email),
      proyek: sel(row, peta.proyek),
      tglBayar: bayar.iso ?? '',
      jatuhTempo: tempo.iso ?? '',
      nominal: uraiNominal(sel(row, peta.nominal)),
      status: sel(row, peta.status),
      // Nama + unit + jatuh tempo cukup unik untuk satu termin pembayaran.
      kunci: `${normal(nama)}|${normal(unit)}|${tempo.iso ?? 'x'}`,
    })
  }

  return { ok: true, url, header, kolom, hilang, baris, tanggalGagal, adaTanggalAmbigu }
}

/** Status yang berarti tagihan sudah beres — reminder tidak perlu dikirim. */
export function sudahBayar(status: string): boolean {
  const s = normal(status)
  if (!s) return false
  return ['lunas', 'sudahbayar', 'paid', 'sudahlunas', 'selesai', 'terbayar', 'ok', 'closed'].some(
    (t) => s.includes(t),
  )
}
