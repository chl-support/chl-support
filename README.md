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
| **Corporate** | Agenda RUPS & aksi korporasi · 6 KPI · filter event/action · lampiran bukti · kendala · jejak audit |
| **Document & License** | Bagan izin bertahap 4 fase (Pra-Akuisisi → Serah Terima) · CRUD izin per proyek · progress per fase |
| **Land Acquisition** | Status sertifikasi bidang tanah · 2 tahap × 2 jalur · 5 KPI · CRUD bidang per proyek |
| **Feasibility & Initial Cost** | KPI NPV/IRR/Payback/Margin/BEP/Peak Cash · kurva kas kumulatif · sensitivitas · 11 tahap initial cost |
| **ItemDrawer** | Panel 480px: stepper verifikasi · form · lampiran nyata · kendala · komentar & jejak audit |
| **Internal Audit** | Unggah dokumen · 5 KPI alur · filter status · stepper tanda tangan bertahap antar divisi |
| **Collection** | Pipeline KPR 11 langkah · monitoring checklist dokumen · follow-up otomatis bertingkat |

Modul P2 (Finance & Correspondence, Pengaturan) menampilkan `ModulKosong` — strukturnya identik
dengan modul lain, jadi tidak ada komponen baru yang perlu dirancang.

### Agenda korporasi (Corporate)

Susunan dasar tiap baris (`src/data/corporate.ts`):

| Kolom | Isi |
| --- | --- |
| **Event** | RUPST · RUPS Biasa |
| **Action** | Perubahan Direksi · Komisaris · Pemegang Saham · Anggaran Dasar · KBLI · Modal · Corporate Action Lainnya |
| **Tanggal · PIC · Nilai** | Tanggal RUPS/efektif, penanggung jawab, nilai transaksi (rupiah penuh, 0 bila tidak relevan) |
| **Lampiran bukti** | Berkas nyata di Blob (cadangan Neon) — dialog menampilkan bukti yang lazim per action |
| **Kendala** | Menggantikan kolom "ketergantungan": hambatan di bagan Corporate sendiri |
| **Komentar & jejak audit** | Lini masa gabungan komentar orang + catatan sistem |

**Kendala, bukan ketergantungan.** Kolom ketergantungan sebelumnya menayangkan rantai izin
(siteplan, PBG, balik nama SHGB) di semua modul — konteks Document & License yang tidak nyambung
dengan urusan korporasi. Sekarang yang dicatat adalah kendala milik bagan itu sendiri: agenda
korporasi punya field `kendala`, dan `ItemDrawer` menampilkan `blockReason` item yang dibuka.

**Jejak audit yang nyata.** Komentar dan jejak audit tersimpan di tabel `comments`
(`entity` + `entity_id`), dipakai bersama bagan Corporate dan item proyek lewat komponen
`CommentThread`. Entri `sistem` ditulis backend saat agenda dibuat, statusnya berubah, kendalanya
berubah, atau bukti diunggah; entri `komentar` ditulis pengguna. Contoh dummy di `ItemDrawer`
(lampiran, ketergantungan, dan jejak audit karangan) sudah dihapus — seluruh isinya kini dibaca
dari database untuk item yang bersangkutan.

### Status sertifikasi tanah (Land Acquisition)

Layar ini menayangkan posisi sertifikat tiap **bidang tanah** dalam dua tahap; tiap tahap punya
dua jalur, dan tiap jalur satu hasil akhir yang tetap (`src/data/lands.ts`):

| Tahap | Jalur | Hasil |
| --- | --- | --- |
| **Akuisisi** — perolehan PT | Tanah Girik | Penerbitan Sertifikat |
| | Tanah Sertifikat | Balik Nama PT |
| **Pasca Akuisisi** — pelepasan PT kepada konsumen | Sertifikat Hak Guna Bangunan | Siap AJB |
| | Sertifikat Hak Milik | Siap AJB |

Hasil tidak disimpan di database — selalu diturunkan dari jenis bidangnya lewat `hasilDari()`,
jadi satu bidang tidak bisa berada di jalur dan hasil yang tidak cocok. Tiap bidang membawa kode,
letak, luas, pemilik/atas nama, nomor girik/sertifikat, status (memakai palet status yang sama
dengan modul lain), target, PIC, dan catatan. Bidang yang lewat target memunculkan chip
Terlambat, dan KPI di atas merangkum jumlah bidang, total luas, perolehan PT yang tuntas, bidang
siap AJB, serta yang lewat target.

### Pipeline KPR & follow-up otomatis (Collection)

Alur kerja Collection dimodelkan di `src/data/kpr.ts`: dua tahap, sembilan langkah, dan dua
percabangan.

| Tahap | Langkah |
| --- | --- |
| **1 · Booking fee sampai pengajuan ke bank** | Booking fee → Verifikasi dokumen ⑂ → Pembayaran DP → Pengajuan KPR |
| **2 · Appraisal bank sampai akad kredit** | Appraisal & BI checking ⑂ → SP3K terbit → Pelunasan DP → Akad kredit → Monitoring angsuran |

Kedua percabangan (⑂) tidak disimpan sebagai langkah tersendiri — hasilnya tercermin pada status
berkas, sehingga satu berkas tidak bisa berada di langkah dan hasil yang bertentangan:
`Tertahan` saat dokumen belum lengkap, `Ditolak Bank` saat kredit tidak disetujui.

**Monitoring dokumen.** Tiap berkas baru otomatis membawa checklist lima dokumen wajib (KTP, KK,
NPWP, slip gaji/rekening koran, surat keterangan kerja). Statusnya `Belum` / `Diterima` /
`Perlu perbaikan`; tanggal terima distempel sendiri saat ditandai diterima. Dokumen tambahan yang
diminta bank bisa ditambahkan per berkas.

**Follow-up otomatis.** Jadwalnya dihitung dari tenggat yang disepakati dengan customer — tidak
ada status follow-up yang disimpan, semuanya diturunkan di `src/lib/followup.ts` sehingga daftar
"perlu dikejar hari ini" selalu konsisten dengan riwayat kontak:

| Tingkat | Jadwal | Nada |
| --- | --- | --- |
| Pengingat | H-3 | Ramah, sebelum tenggat |
| Follow-up 1 | H+1 | Sopan, tenggat baru lewat |
| Follow-up 2 | H+4 | Tegas, jadwal akad berpotensi mundur |
| Eskalasi | H+7 | Eskalasi supervisor + peringatan booking |

Pesannya disusun otomatis dari template: nama, unit, proyek, **daftar dokumen yang masih kurang**,
tenggat, hitungan hari, dan PIC terisi sendiri. Petugas boleh mengedit sebelum mengirim. Tombol
"Kirim WhatsApp & catat" membuka `wa.me` dengan pesan tersebut lalu mencatatnya sebagai riwayat;
"Catat saja" dipakai untuk kanal lain (telepon, email, kunjungan).

Dua kanal tersedia: **WhatsApp** (`wa.me`) dan **email** (`mailto:` dengan subjek per tingkat).
Identitas pengirim diatur di `PENGIRIM_REMINDER` (`src/data/kpr.ts`).

**Pengiriman otomatis (penjadwal harian).** Vercel Cron memanggil
`GET /api/collection?action=reminder` setiap hari pukul 01.00 UTC (08.00 WIB). Penjadwal menghitung
berkas yang jatuh tempo dengan aturan yang sama persis seperti layarnya, mengirim emailnya lewat
Resend, lalu mencatat tiap pengiriman sebagai riwayat follow-up dengan kanal `Email (otomatis)`.
Pencatatan **hanya** untuk email yang benar-benar terkirim, sehingga jejak audit tidak pernah
mengklaim kontak yang tidak terjadi. Satu tingkat tidak akan dikirim dua kali: posisi berkas
selalu diturunkan dari tenggat dan riwayat kontaknya.

Env var yang dibutuhkan agar penjadwal benar-benar mengirim:

| Env var | Wajib | Fungsi |
| --- | --- | --- |
| `RESEND_API_KEY` | ya | Kunci API Resend. Tanpa ini penjadwal berjalan sebagai laporan saja — tidak mengirim, tidak mencatat |
| `REMINDER_FROM` | tidak | Alamat pengirim; bawaannya `Collection CHL <agung.mulyana@ciptaharmoni.com>`. **Domainnya harus sudah diverifikasi di Resend**, kalau tidak Resend menolak permintaannya |
| `REMINDER_BCC` | tidak | Salinan ke supervisor |
| `CRON_SECRET` | disarankan | Bila di-set, endpoint hanya menerima panggilan dengan `Authorization: Bearer <secret>` — Vercel Cron mengirimkannya otomatis |

Uji coba tanpa mengirim apa pun: `GET /api/collection?action=reminder&dry=1` mengembalikan daftar
jatuh tempo hari ini beserta tingkat, keterlambatan, dan dokumen yang kurang.

### Reminder pembayaran dari Google Sheet

Jadwal pembayaran dibaca dari Google Sheet yang dipublikasikan (`api/_lib/sheet.ts`), tanpa
kredensial: sheet diminta sebagai CSV lewat `export?format=csv`. Syaratnya sheet dibagikan sebagai
"Siapa saja yang memiliki link" atau dipublikasikan lewat **File → Bagikan → Publikasikan ke web**.

> **Konsekuensi privasi.** Dengan cara ini siapa pun yang mengetahui tautannya dapat membaca nama,
> nomor telepon, dan nominal konsumen. Bila itu tidak dikehendaki, ganti pembacanya ke Google Sheets
> API dengan service account — hanya `ambilSheet()` yang perlu diubah.

**Susunan kolom tidak dipatok.** Header dicocokkan dengan daftar alias, jadi `Nama Konsumen`,
`CUSTOMER`, dan `Nama Pembeli` sama-sama dikenali sebagai nama; begitu pula `Jatuh Tempo` /
`TGL JATUH TEMPO` / `Due Date`. Kolom yang dikenali dan yang tidak ditemukan dilaporkan lewat
`GET /api/collection?action=sheet`, bersama jumlah baris, contoh lima baris pertama, dan baris yang
tanggalnya gagal diurai — pakai endpoint itu untuk memastikan pemetaannya benar sebelum reminder
dikirim ke konsumen.

Tanggal diterima dalam bentuk `2026-08-04`, `04/08/2026`, `4-8-26`, dan `4 Agustus 2026`. Bentuk
`d/m/y` dibaca **hari lebih dulu** sesuai kebiasaan Indonesia; bila kedua angkanya ≤ 12 hasilnya
ambigu dan ditandai `adaTanggalAmbigu` agar diperiksa manusia. Nominal menerima `Rp 15.000.000`
maupun `1,500,000`. Baris berstatus lunas/sudah bayar/paid dilewati.

Tangga reminder tagihan dihitung terhadap **tanggal jatuh tempo**:

| Tingkat | Jadwal |
| --- | --- |
| Pengingat | H-3 |
| Hari jatuh tempo | H |
| Terlambat | H+3 |
| Eskalasi | H+7 |

Email ke konsumen dikirim otomatis oleh penjadwal harian yang sama. WhatsApp tidak bisa dikirim
sendiri, jadi tautan `wa.me` untuk semua konsumen yang jatuh tempo hari itu dirangkum dalam satu
email ringkasan ke petugas — tetap terkirim hari itu juga, cukup satu ketuk per konsumen.
Pengiriman yang berhasil dicatat di tabel `tagihan_reminder` dengan kunci `nama|unit|jatuh tempo`,
sehingga satu termin tidak pernah dikejar dua kali pada tingkat yang sama.

Env var terkait: `SHEET_TAGIHAN_URL` (URL CSV penuh) atau `SHEET_TAGIHAN_ID` + `SHEET_TAGIHAN_GID`.
Bila tidak di-set, dipakai sheet bawaan yang tertulis di `api/_lib/sheet.ts`.

> **WhatsApp masih manual.** Pengiriman WhatsApp tetap satu klik lewat `wa.me`. Otomatisasinya
> butuh akun WhatsApp Business API resmi beserta template yang disetujui Meta — nomor pribadi lewat
> gateway tidak resmi melanggar ketentuan WhatsApp dan berisiko diblokir permanen.

> **Tangga reminder ada dua salinan.** Fungsi serverless di-bundel terpisah dari aplikasi, jadi
> `api/_lib/reminder.ts` menyalin tangga dan template dari `src/data/kpr.ts`. Bila teksnya diubah
> di satu tempat, ubah juga di tempat lain.

**Arsip report.** Tombol **Upload report** menyimpan rekap follow-up/reminder per proyek ke Vercel
Blob (cadangan Neon) beserta judul, periode, pengunggah, dan waktunya — tabel `kpr_reports`.

**SP3K.** Masa berlaku (bawaan 30 hari) dihitung dari tanggal terbit dan memunculkan chip
`SP3K H-…` / `SP3K lewat … hr`, supaya pelunasan DP dan penjadwalan akad tidak melewati surat
persetujuan bank.

### Monitoring tanda tangan (Internal Audit)

Tiap dokumen membawa **alur tanda tangan**: satu langkah per divisi, dikerjakan **berurutan**.
Alur baku (diatur di `src/data/divisi.ts`) menyusun sepuluh divisi dalam tiga kelompok:

| Kelompok | Divisi |
| --- | --- |
| Penyiapan dokumen | Admin Proyek → Marketing → Marcom → Admin Sales |
| Pemeriksaan | License & Perizinan → Collection → Budget → Keuangan → Legal |
| Pengesahan | Direksi |

Urutannya bisa disusun ulang saat mengunggah (klik chip divisi sesuai urutan yang dikehendaki;
divisi yang tidak relevan tinggal dilepas), dan tiap dokumen masih bisa ditambah/dikurangi
divisinya kemudian lewat stepper.

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
                SignoffStepper, CommentThread, CorporateDialog, LandDialog
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
| `GET·POST /api/system` | Function gabungan di balik ketiga path sistem di atas (`?action=health/bootstrap/reset`) |
| `GET·POST·DELETE /api/projects` | Menu **Proyek** — CRUD proyek (hapus ikut membersihkan item & izinnya) |
| `GET·POST·DELETE /api/permits` | Menu **Perizinan** — CRUD izin per proyek, dikelompokkan 4 fase |
| `GET·POST·DELETE /api/corporate` | Bagan **Corporate** — CRUD agenda korporasi, unggah/hapus lampiran bukti |
| `GET·POST·DELETE /api/comments` | Komentar & jejak audit (`entity` = `corp` / `item`) |
| `GET·POST·DELETE /api/lands` | Bagan **Land Acquisition** — CRUD bidang tanah per proyek |
| `GET·POST·PATCH·DELETE /api/collection` | Menu **Collection** — berkas KPR, checklist dokumen (`?dokumen=`), riwayat follow-up (`?action=followup`), arsip report (`?action=report`, `?reports=1`, `?download=`) |
| `GET·POST /api/items` | Baca / buat / ubah item di Neon |
| `GET·POST /api/upload` | Unggah lampiran item ke Blob (`?filename=…&itemId=…`) · daftar lampiran (`?itemId=…`) |
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

> **Batas jumlah function.** Paket Hobby Vercel hanya mengizinkan **12 Serverless Function per
> deployment**, dan tiap berkas `api/*.ts` dihitung satu. Karena itu `health`, `bootstrap`, dan
> `reset` digabung ke `api/system.ts` dengan `?action=…`, sementara path lamanya dipertahankan
> lewat `rewrites` di `vercel.json`. Saat menambah endpoint baru, hitung dulu berkas di `api/`
> (`ls api/*.ts`) — bila sudah 12, gabungkan endpoint sejenis alih-alih menambah berkas, karena
> deployment akan **gagal total** begitu batasnya terlampaui. Saat ini terpakai **12 dari 12**,
> jadi endpoint berikutnya wajib menumpang berkas yang ada (pola `?action=` seperti
> `api/collection.ts`).

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
