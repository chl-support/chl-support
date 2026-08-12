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
  return kandidatUrl()[0]
}

/**
 * Bentuk URL CSV yang dicoba berurutan.
 *
 * Google menyajikan spreadsheet yang sama lewat beberapa endpoint, dan izin
 * yang dibutuhkan tiap endpoint berbeda — `export` kadang tetap meminta login
 * padahal `gviz` sudah melayani sheet yang sama, dan `pub` hanya hidup setelah
 * File → Bagikan → Publikasikan ke web. Karena tidak ada satu bentuk yang benar
 * untuk semua cara berbagi, ketiganya dicoba dan yang pertama berhasil dipakai.
 *
 * `SHEET_TAGIHAN_URL` menimpa semuanya: bila di-set, hanya itu yang dicoba.
 */
export function kandidatUrl(): string[] {
  if (process.env.SHEET_TAGIHAN_URL) return [process.env.SHEET_TAGIHAN_URL]
  const id = process.env.SHEET_TAGIHAN_ID || SHEET_ID_DEFAULT
  const gid = process.env.SHEET_TAGIHAN_GID || SHEET_GID_DEFAULT
  const dasar = `https://docs.google.com/spreadsheets/d/${id}`
  return [
    `${dasar}/export?format=csv&gid=${gid}`,
    `${dasar}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `${dasar}/pub?output=csv&gid=${gid}`,
  ]
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
  | 'jatuhTempoDokumen'
  | 'jatuhTempoAkad'
  | 'nominal'
  | 'status'

/** Alias header per kolom, sudah dinormalkan (huruf kecil, tanpa non-alfanumerik). */
const ALIAS: Record<Kolom, string[]> = {
  nama: ['nama', 'namakonsumen', 'namacustomer', 'namapembeli', 'customer', 'konsumen', 'debitur', 'pembeli'],
  unit: ['blokunit', 'unit', 'nounit', 'kavling', 'nokavling', 'blok', 'noblok', 'unitkavling', 'rumah'],
  telepon: [
    'notlp', 'tlp', 'nohp', 'hp', 'whatsapp', 'nowhatsapp', 'wa', 'nowa', 'telepon', 'notelepon',
    'telp', 'notelp', 'nomortelepon', 'kontak',
  ],
  email: ['email', 'alamatemail', 'surel', 'emailkonsumen'],
  proyek: ['proyek', 'project', 'perumahan', 'cluster', 'lokasi'],
  tglBayar: [
    'tanggalpembayarandp', 'tanggalpembayaran', 'tglpembayaran', 'tanggalbayar', 'tglbayar',
    'tanggaltransfer', 'paymentdate', 'tanggalangsuran',
  ],
  jatuhTempoDokumen: [
    'jatuhtempodokumen', 'jatuhtempoberkas', 'tenggatdokumen', 'batasdokumen',
    'jatuhtempo', 'tanggaljatuhtempo', 'tgljatuhtempo', 'duedate',
  ],
  jatuhTempoAkad: ['jatuhtempoakadkredit', 'jatuhtempoakad', 'batasakad', 'tenggatakad'],
  nominal: [
    'nominalpembayarandp', 'nominal', 'jumlah', 'jumlahtagihan', 'angsuran', 'tagihan', 'nilai',
    'amount', 'besarangsuran',
  ],
  status: ['status', 'statusbayar', 'statuspembayaran', 'keterangan', 'ket'],
}

const normal = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Mencari baris header. Sheet nyata sering diawali judul dan baris kosong,
 * jadi baris pertama belum tentu headernya — yang dipakai adalah baris dengan
 * kecocokan alias terbanyak di antara 15 baris pertama.
 */
export function cariBarisHeader(tabel: string[][]): number {
  let terbaik = 0
  let skorTerbaik = 0
  for (let i = 0; i < Math.min(15, tabel.length); i++) {
    const peta = petakanKolom(tabel[i])
    const skor = Object.keys(peta).length
    if (skor > skorTerbaik) {
      skorTerbaik = skor
      terbaik = i
    }
  }
  return terbaik
}

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

  // Serial Excel/Sheets (mis. 46013) — muncul bila selnya tidak berformat tanggal.
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const n = Math.floor(Number(t))
    if (n >= 20000 && n <= 60000) {
      // Epoch Excel 1899-12-30; hitung dalam UTC agar tidak bergeser zona waktu.
      const d = new Date(Date.UTC(1899, 11, 30) + n * 86_400_000)
      return { iso: d.toISOString().slice(0, 10), ambigu: false }
    }
  }

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
  jatuhTempoDokumen: string
  jatuhTempoAkad: string
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
  tanggalGagal: { baris: number; nilai: string[] }[]
  /** Baris header yang dipakai (1 = baris pertama sheet). */
  barisHeader: number
  /** Ada tanggal d/m yang bisa terbaca dua arti — perlu dipastikan manusia. */
  adaTanggalAmbigu: boolean
  /** Riwayat tiap bentuk URL yang dicoba — kosong bila yang pertama berhasil. */
  percobaan?: PercobaanUrl[]
}

const sel = (row: string[], idx: number | undefined): string =>
  idx == null ? '' : (row[idx] ?? '').trim()

/** Hasil satu percobaan URL, dilaporkan apa adanya untuk keperluan diagnosa. */
export interface PercobaanUrl {
  url: string
  status: number | null
  hasil: string
}

/**
 * Satu percobaan pengambilan CSV. Balasan HTML dihitung gagal walau HTTP 200:
 * sheet privat memulangkan halaman login dengan status sukses, dan menguraikannya
 * sebagai CSV akan menghasilkan "sheet kosong" alih-alih "sheet masih privat".
 */
async function coba(url: string): Promise<{ teks: string | null; laporan: PercobaanUrl }> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      return { teks: null, laporan: { url, status: res.status, hasil: `HTTP ${res.status}` } }
    }
    const teks = await res.text()
    if (/^\s*<(!doctype|html)/i.test(teks)) {
      return { teks: null, laporan: { url, status: res.status, hasil: 'halaman HTML (login)' } }
    }
    return { teks, laporan: { url, status: res.status, hasil: 'terbaca' } }
  } catch (e) {
    return { teks: null, laporan: { url, status: null, hasil: (e as Error).message } }
  }
}

/** Pesan yang menyebut sebab paling mungkin, bukan sekadar kode status. */
function ringkasKegagalan(percobaan: PercobaanUrl[]): string {
  const bentuk = (u: string) =>
    u.includes('/gviz/') ? 'gviz' : u.includes('/pub?') ? 'publikasi web' : 'export'
  const rincian = percobaan.map((p) => `${bentuk(p.url)}: ${p.hasil}`).join(' · ')

  const semuaHtml = percobaan.every((p) => p.hasil.startsWith('halaman HTML'))
  const adaAuth = percobaan.some((p) => p.status === 401 || p.status === 403)

  if (semuaHtml || adaAuth) {
    return (
      `Sheet belum bisa dibaca tanpa login (${rincian}). Buka sheet → Bagikan → ubah Akses umum ` +
      'menjadi "Siapa saja yang memiliki link" sebagai Pelihat. Kalau file-nya hasil unggahan ' +
      'Excel, buka File → Simpan sebagai Google Spreadsheet dulu — file .xlsx di Drive tidak ' +
      'bisa diekspor sebagai CSV lewat tautan.'
    )
  }
  return `Sheet tidak terbaca (${rincian}).`
}

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
    barisHeader: 0,
  }

  const daftar = url === sheetUrl() ? kandidatUrl() : [url]
  const percobaan: PercobaanUrl[] = []
  let teks = ''
  let dipakai = ''

  for (const kandidat of daftar) {
    const hasil = await coba(kandidat)
    percobaan.push(hasil.laporan)
    if (hasil.teks != null) {
      teks = hasil.teks
      dipakai = kandidat
      break
    }
  }

  if (!dipakai) {
    return { ...kosong, percobaan, error: ringkasKegagalan(percobaan) }
  }
  // Sejak sini `url` adalah bentuk yang benar-benar melayani, bukan yang dicoba
  // pertama — supaya diagnosa menunjuk tautan yang memang bisa dibuka.
  kosong.url = dipakai

  const tabel = parseCsv(teks)
  if (!tabel.length) return { ...kosong, error: 'Sheet terbaca tapi tidak berisi baris apa pun.' }

  const idxHeader = cariBarisHeader(tabel)
  const header = tabel[idxHeader].map((h) => h.trim())
  const peta = petakanKolom(header)
  const kolom: Partial<Record<Kolom, string>> = {}
  for (const [k, i] of Object.entries(peta) as [Kolom, number][]) kolom[k] = header[i]
  const hilang = (Object.keys(ALIAS) as Kolom[]).filter((k) => peta[k] == null)

  const baris: BarisTagihan[] = []
  const tanggalGagal: HasilSheet['tanggalGagal'] = []
  let adaTanggalAmbigu = false

  for (let i = idxHeader + 1; i < tabel.length; i++) {
    const row = tabel[i]
    const nama = sel(row, peta.nama)
    // Baris tanpa nama adalah sub-header, pemisah, atau baris total.
    if (!nama) continue

    const mentah = {
      bayar: sel(row, peta.tglBayar),
      dokumen: sel(row, peta.jatuhTempoDokumen),
      akad: sel(row, peta.jatuhTempoAkad),
    }
    const bayar = uraiTanggal(mentah.bayar)
    const dokumen = uraiTanggal(mentah.dokumen)
    const akad = uraiTanggal(mentah.akad)
    if (bayar.ambigu || dokumen.ambigu || akad.ambigu) adaTanggalAmbigu = true
    const gagal = [
      mentah.bayar && !bayar.iso ? mentah.bayar : '',
      mentah.dokumen && !dokumen.iso ? mentah.dokumen : '',
      mentah.akad && !akad.iso ? mentah.akad : '',
    ].filter(Boolean)
    if (gagal.length) tanggalGagal.push({ baris: i + 1, nilai: gagal })

    // Kolom email kadang berisi penanda 1/0, bukan alamat — hanya nilai yang
    // benar-benar beralamat yang dipakai supaya tidak ada kiriman salah tujuan.
    const emailMentah = sel(row, peta.email)
    const email = emailMentah.includes('@') ? emailMentah : ''
    const unit = sel(row, peta.unit)

    baris.push({
      baris: i + 1,
      nama,
      unit,
      telepon: sel(row, peta.telepon),
      email,
      proyek: sel(row, peta.proyek),
      tglBayar: bayar.iso ?? '',
      jatuhTempoDokumen: dokumen.iso ?? '',
      jatuhTempoAkad: akad.iso ?? '',
      nominal: uraiNominal(sel(row, peta.nominal)),
      status: sel(row, peta.status),
      // Nama + unit cukup unik untuk satu konsumen; jenis & tanggal peristiwa
      // ditambahkan saat reminder dicatat.
      kunci: `${normal(nama)}|${normal(unit)}`,
    })
  }

  return {
    ok: true,
    url: dipakai,
    percobaan,
    header,
    kolom,
    hilang,
    baris,
    tanggalGagal,
    adaTanggalAmbigu,
    barisHeader: idxHeader + 1,
  }
}

/** Status yang berarti tagihan sudah beres — reminder tidak perlu dikirim. */
export function sudahBayar(status: string): boolean {
  const s = normal(status)
  if (!s) return false
  return ['lunas', 'sudahbayar', 'paid', 'sudahlunas', 'selesai', 'terbayar', 'ok', 'closed'].some(
    (t) => s.includes(t),
  )
}
