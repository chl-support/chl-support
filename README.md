# Harmoni Command Center

Aplikasi web internal PT Cipta Harmoni Lestari — satu sumber kebenaran untuk kewajiban,
dokumen, tenggat, dan biaya awal proyek perumahan.

React + TypeScript + Vite. Implementasi dari mockup Claude Design di `project/`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produksi → dist/
npm run typecheck
```

## Layar (P0)

| Layar | Isi |
| --- | --- |
| **Dashboard Eksekutif** | 6 KPI · matriks proyek × 6 modul · kalender kepatuhan 90 hari · tabel "Perlu perhatian Anda" |
| **Detail Proyek** | Header proyek · 7 tab modul · sub-tab Jangka Pendek/Panjang · filter status · BlockerBanner |
| **License & Documentation** | Rantai 11 izin (LSD → PSU) dengan izin terkunci · chip H-180/90/30/7 · tabel izin |
| **Feasibility & Initial Cost** | KPI NPV/IRR/Payback/Margin/BEP/Peak Cash · kurva kas kumulatif · sensitivitas · 11 tahap initial cost |
| **ItemDrawer** | Panel 480px: stepper verifikasi · form · lampiran · ketergantungan · jejak audit |
| **Internal Audit** | Unggah dokumen · 5 KPI alur · filter status · stepper tanda tangan bertahap antar divisi |

Modul P2 (Finance & Correspondence, Pengaturan) menampilkan `ModulKosong` — strukturnya identik
dengan modul lain, jadi tidak ada komponen baru yang perlu dirancang.

### Monitoring tanda tangan (Internal Audit)

Tiap dokumen membawa **alur tanda tangan**: satu langkah per divisi, dikerjakan **berurutan**.
Alur baku `Admin Sales → License & Perizinan → Collection → Keuangan → Head Legal → Direksi`
(diatur di `src/data/divisi.ts`) bisa disusun ulang saat mengunggah, dan tiap dokumen masih bisa
ditambah/dikurangi divisinya kemudian.

Status per langkah: `Menunggu → Diproses → Ditandatangani`, dengan cabang `Revisi` (dikembalikan
ke pengunggah beserta alasannya) dan `Dilewati` (divisi tidak relevan untuk dokumen itu). Hanya
langkah aktif — langkah pertama yang belum tuntas — yang bisa ditindaklanjuti; sisanya terkunci,
persis seperti gerbang prasyarat pada bagan perizinan. Tenggat per langkah memunculkan chip
H-30/H-7/Terlambat, dan status dokumen (`Menunggu tanda tangan` / `Perlu revisi` / `Selesai`)
diturunkan dari alurnya di `src/lib/signoff.ts`.

## Interaksi yang berfungsi

Pemilih proyek · seluruh item navigasi · 7 tab modul · Jangka Pendek/Panjang · chip filter status ·
urut kolom · pencarian topbar · toggle kerapatan baris (Rapat/Longgar) · sel matriks → lompat ke
modulnya · baris tabel → ItemDrawer · "Buat checklist perizinan" · ciutkan sidebar ·
susun alur tanda tangan lewat chip divisi · baris dokumen audit → buka stepper tanda tangan.

## Struktur

```
src/
  data/         Data dummy + konstanta (warna, status, modul, ikon, navigasi)
  lib/          Format tanggal/rupiah, derivasi Row, kolom tabel, logika gerbang izin,
                ringkasan alur tanda tangan (signoff.ts)
  components/   DataTable, ItemDrawer, DependencyChain, ProjectMatrix, ComplianceCalendar,
                CashCurve, KpiCard, BlockerBanner, EmptyState, Sidebar, Topbar, PillButton,
                SignoffStepper
  screens/      Empat layar P0 + ModulKosong
  styles/       global.css — token aplikasi, reset, dan seluruh state hover/focus
project/        Bundel handoff Claude Design (sumber desain + design system)
chats/          Transkrip percakapan desain
```

## Token

Warna dan geometri mengikuti PRD (`#0F5C6B`, `#F7F8FA`, radius 10, tabel 13px, sidebar 240px,
topbar 56px). Tipografi, radius pill, shadow, dan permukaan glass berasal dari design system
Dhany Indraswara.

`vite.config.ts` memetakan alias `@ds` ke folder design system di dalam bundel handoff, sehingga
`colors_and_type.css` (token + Plus Jakarta Sans yang di-host sendiri) hanya punya satu sumber.

Design system tersebut juga memuat `_ds_bundle.js` dan `ui_kits/media_kit_website/styles.css`.
Keduanya tidak dimuat di sini: `_ds_manifest.json` mencantumkan `"components": []`, dan isi bundel
adalah komponen React khusus halaman media kit (Hero, Partners, WhyBrands, …) yang dipasang ke
`window`. Tidak ada yang bisa dipakai aplikasi ini, jadi yang diambil hanya file tokennya.

## Backend & deploy Vercel

Aplikasi kini punya backend serverless di `api/` yang tersambung ke tiga resource Vercel.
Data `src/data/` dipakai sebagai **seed** database sekaligus **fallback** bila backend belum aktif —
jadi app tetap jalan meski satu pun resource belum dikonfigurasi.

| Resource | Env var (nama persis) | Cara set |
| --- | --- | --- |
| **Neon Postgres** | `DATABASE_URL` / `POSTGRES_URL` | Vercel → **Storage** → hubungkan Neon (env terisi otomatis) |
| **Vercel Blob** | `BLOB_READ_WRITE_TOKEN` | Vercel → **Storage** → hubungkan Blob store (otomatis) |
| **OpenAI (AI)** | `OPENAI_API_KEY` | Vercel → **Settings → Environment Variables** (set manual) |

### Endpoint

| Route | Fungsi |
| --- | --- |
| `GET /api/health` | Diagnostik — pastikan ketiga resource terhubung & Neon reachable |
| `GET /api/bootstrap` | Buat skema + seed data (sekali), lalu kembalikan projects/items/permits dari Neon |
| `GET·POST·DELETE /api/projects` | Menu **Proyek** — CRUD proyek (hapus ikut membersihkan item & izinnya) |
| `GET·POST·DELETE /api/permits` | Menu **Perizinan** — CRUD izin per proyek, dikelompokkan 4 fase |
| `GET·POST /api/items` | Baca / buat / ubah item di Neon |
| `POST /api/upload?filename=…&itemId=…` | Unggah lampiran ke Blob (body = isi berkas) |
| `POST /api/ai` | Asisten AI (OpenAI) — body `{ prompt, context? }` |
| `GET·POST·DELETE /api/tim` | Menu **Tim** — CRUD direktori jabatan/PIC di Neon |
| `GET·POST·PATCH·DELETE /api/audit` | Menu **Internal Audit** — unggah dokumen ke Blob + alur tanda tangan lintas divisi di Neon |
| `POST /api/reset` | Bersihkan sisa data demo (butuh body `{ "confirm": "HAPUS DEMO" }`) — tabel `tim` tidak disentuh |

> **Catatan data:** data demo (proyek, item, izin, kelayakan) sudah dikosongkan.
> Menu lama tetap ada namun kosong sampai diisi data nyata. Menu baru **Tim**
> berisi direktori jabatan → PIC dan ter-seed dengan data awal saat pertama jalan.

### Cara memastikan sudah jalan

1. Deploy ke Vercel (import repo — framework Vite terdeteksi otomatis).
2. Set env var di atas, lalu **redeploy**.
3. Buka `https://<domain>/api/health` — semua cek harus `ok: true`.
4. Buka aplikasi: tombol **Asisten AI** kanan-bawah menampilkan status backend, badge
   **"Data live · Neon"** menandakan tabel sudah terbaca dari database, dan panel item
   (tombol **+ Unggah**) mengunggah berkas nyata ke Blob.

Skema dibuat & di-seed otomatis saat `/api/bootstrap` pertama kali dipanggil (idempoten —
aman dipanggil ulang, tidak menimpa data yang sudah ada). Lampiran ≤ 4,5 MB per berkas
(batas body serverless Vercel).

## Data

Seluruh data awal (seed) hidup di `src/data/`. Dua hal yang masih perlu diperhatikan:

- `TODAY` di `src/data/constants.ts` dipatok ke 6 Agu 2026 agar demo selalu konsisten — ganti
  dengan `new Date()`.
- `UNLOCK_GATE` di `src/data/permits.ts` menentukan berapa langkah rantai izin terbuka setelah izin
  terakhir yang selesai.

Status keterlambatan tidak pernah disimpan; selalu diturunkan dari `tgl` terhadap `TODAY`.

## Desain sumber

`project/Harmoni Command Center.dc.html` dan `project/Harmoni Table.dc.html` adalah prototipe
aslinya, `project/uploads/PRD_1Page_Harmoni.md` adalah briefnya, dan `project/HANDOFF.md`
adalah instruksi handoff dari Claude Design.
