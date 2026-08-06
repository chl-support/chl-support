# HARMONI COMMAND CENTER - Design Brief 1 Halaman
PT Cipta Harmoni Lestari | Aplikasi web internal developer perumahan

## Inti
Satu sumber kebenaran untuk kewajiban, dokumen, tenggat, dan biaya awal proyek. Setiap baris data punya PIC, tenggat, bukti dokumen, dan verifikator dari divisi lain.

## Tokens
Latar `#F7F8FA` · kartu `#FFFFFF` radius 10 border `#E5E7EB` · teks `#111827` / `#6B7280` · aksen `#0F5C6B` · font Inter, body 14px tabel 13px · spacing kelipatan 4 · sidebar 240px collapse 64px · topbar 56px.
Status: Selesai `#16A34A` · Berjalan `#2563EB` · Jatuh tempo <=30hr `#F59E0B` · Terlambat/Diblokir `#DC2626` · Belum mulai `#9CA3AF`.
Bahasa Indonesia · tanggal `DD MMM YYYY` · Rp 1.250.000.000 · tabel-first · responsif.

## Navigasi (10 item, jangan ditambah)
Dashboard · Proyek · **5 Bagan:** Corporate, Commercial, Land Acquisition, License & Documentation, Social & Litigation · **Lintas fungsi:** Feasibility & Initial Cost, Finance & Correspondence, Internal Audit · Pengaturan.
Topbar: dropdown proyek aktif, notifikasi, avatar.

## Objek Item (semua tabel sama)
Judul · Modul · Proyek · Horizon · Status · PIC · Verifikator · Target · Kedaluwarsa · Nilai · Risiko · Dokumen.
Status: Belum Dimulai > Berjalan > Menunggu Pihak Ketiga > Menunggu Verifikasi > Selesai. Cabang: Diblokir, Dibatalkan.
Alur: PIC tandai selesai + bukti > verifikator divisi lain setuju/kembalikan > kadiv tutup > audit sampling.

## Komponen (buat sekali)
StatusBadge · StatusDot · DataTable · KpiCard · ItemDrawer · DependencyChain · DeadlineChip · VerificationStepper · BlockerBanner · EmptyState.

## Layar
**P0**
1. **Dashboard Eksekutif** - 6 KPI (tenggat 30hr, item terlambat, proyek aktif, kas 13 minggu, deviasi initial cost, perkara aktif) + matriks proyek x 6 modul (titik warna) + kalender 90 hari.
2. **Detail Proyek** - header + 7 tab modul, tiap tab tabel Item, sub-tab Jangka Pendek/Panjang.
3. **License & Documentation** - tombol "Buat checklist perizinan" per PEMDA + tabel izin + rantai ketergantungan: LSD > KKPR > PTP > Lingkungan > Andalalin > Peil Banjir > KRK > Siteplan > PBG > SLF > PSU. Izin terkunci abu + gembok. Chip H-180/90/30/7.
4. **Feasibility & Initial Cost** - kartu NPV/IRR/Payback/Margin/BEP/Peak Cash + tabel 11 tahap (Rencana, Realisasi, Deviasi Rp & %, % terserap) + kurva kas kumulatif dengan titik terdalam + tabel sensitivitas Pesimis/Basis/Optimis. Badge Baseline Terkunci.
5. **ItemDrawer** (480px kanan) - stepper verifikasi + form + lampiran + ketergantungan + komentar + audit trail. Tombol: Simpan, Ajukan Verifikasi, Kembalikan.

**P1** Dashboard Divisi (5 kolom kanban) · Daftar Proyek · Corporate (6 tab) · Commercial (kontrak + termin) · Land Acquisition (bidang tanah + checklist due diligence) · Kalender Kepatuhan.
**P2** Social & Litigation · Finance & Correspondence · Internal Audit (baca saja) · Pengaturan.

## Gerbang pemblokir (BlockerBanner merah, tombol simpan disabled)
SPK ← Siteplan/PBG selesai · PPJB ← keterbangunan 20% + PBG + tanah atas nama PT · Pelunasan tanah ← due diligence bersih · Mobilisasi ← sosialisasi selesai · Konstruksi ← Feasibility Baseline Terkunci.

## Dummy data
Harmoni Serpong Fase 2 (Tangsel, 8,4Ha, 320 unit, Perizinan, hijau) · Harmoni Bogor Timur (Kab. Bogor, 15,2Ha, 540, Akuisisi, kuning) · Harmoni Residence Bogor (Kota Bogor, 4,1Ha, 180, Konstruksi, hijau) · Harmoni Cikupa (Kab. Tangerang, 22,7Ha, 760, Pra-Akuisisi, merah).
PIC: Rani Puspita, Bagas Prasetyo, Sinta Mahardika, Yudha Firmansyah, Nurul Aisyah, Dimas Aryo, Lestari Wijaya.
Feasibility Serpong: NPV Rp 42,8M · IRR 18,4% · Payback 3,2th · Margin 22,1% · Peak Cash Rp 78,5M bulan ke-14 · Initial cost Rp 96,2M rencana / Rp 88,7M realisasi.
PEMDA tercepat Tangsel (KKPR 1x24 jam), terlambat Kab. Tangerang (PKKPR 5+20 hari kerja).

## Tidak dibuat
Login, GL akuntansi, integrasi OSS/Coretax/SIMBG, mobile native, portal konsumen, TTD digital, animasi/ilustrasi kustom.

## Prompt berurutan
1. Design system + app shell + 10 komponen.
2. Dashboard Eksekutif.
3. Detail Proyek + License.
4. Feasibility & Initial Cost.
5. ItemDrawer, sambungkan ke semua tabel.
6. Layar P1.
