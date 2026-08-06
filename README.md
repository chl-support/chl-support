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

Modul P2 (Finance & Correspondence, Internal Audit, Pengaturan) menampilkan `ModulKosong` —
strukturnya identik dengan modul lain, jadi tidak ada komponen baru yang perlu dirancang.

## Interaksi yang berfungsi

Pemilih proyek · seluruh item navigasi · 7 tab modul · Jangka Pendek/Panjang · chip filter status ·
urut kolom · pencarian topbar · toggle kerapatan baris (Rapat/Longgar) · sel matriks → lompat ke
modulnya · baris tabel → ItemDrawer · "Buat checklist perizinan" · ciutkan sidebar.

## Struktur

```
src/
  data/         Data dummy + konstanta (warna, status, modul, ikon, navigasi)
  lib/          Format tanggal/rupiah, derivasi Row, kolom tabel, logika gerbang izin
  components/   DataTable, ItemDrawer, DependencyChain, ProjectMatrix, ComplianceCalendar,
                CashCurve, KpiCard, BlockerBanner, EmptyState, Sidebar, Topbar, PillButton
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

## Data

Seluruh data masih dummy dan hidup di `src/data/`. Dua hal yang perlu diganti saat backend siap:

- `TODAY` di `src/data/constants.ts` dipatok ke 6 Agu 2026 agar demo selalu konsisten — ganti
  dengan `new Date()`.
- `UNLOCK_GATE` di `src/data/permits.ts` menentukan berapa langkah rantai izin terbuka setelah izin
  terakhir yang selesai.

Status keterlambatan tidak pernah disimpan; selalu diturunkan dari `tgl` terhadap `TODAY`.

## Desain sumber

`project/Harmoni Command Center.dc.html` dan `project/Harmoni Table.dc.html` adalah prototipe
aslinya, `project/uploads/PRD_1Page_Harmoni.md` adalah briefnya, dan `project/HANDOFF.md`
adalah instruksi handoff dari Claude Design.
