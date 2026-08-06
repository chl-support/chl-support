import type { AttentionRow, Summary } from './summary'

/** Minimal HTML escape for values dropped into generated documents. */
export function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, rows: string[][]) {
  const body = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  triggerDownload(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }), filename)
}

/** Wraps a document body so Microsoft Word opens the .doc with formatting intact. */
export function downloadWordDoc(filename: string, title: string, bodyHtml: string) {
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>${esc(title)}</title></head><body>${bodyHtml}</body></html>`
  triggerDownload(new Blob(['﻿', html], { type: 'application/msword' }), filename)
}

/** Opens a print-ready window (Save as PDF from the browser dialog). */
export function printHtml(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) {
    alert('Popup diblokir. Izinkan popup untuk mencetak, atau gunakan tombol unduh.')
    return
  }
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body>${bodyHtml}` +
      `<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`,
  )
  w.document.close()
}

// ---- professional document bodies ----

const DOC_STYLE = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#111827; font-size:12px; line-height:1.5; margin:32px; }
    .kop { border-bottom:3px double #0F5C6B; padding-bottom:10px; margin-bottom:18px; }
    .kop h1 { margin:0; font-size:17px; color:#0F5C6B; letter-spacing:.02em; }
    .kop .sub { font-size:11px; color:#6B7280; margin-top:2px; }
    h2 { font-size:13px; margin:18px 0 8px; border-left:4px solid #0F5C6B; padding-left:8px; }
    table { border-collapse:collapse; width:100%; margin:6px 0 12px; font-size:11px; }
    th,td { border:1px solid #D1D5DB; padding:6px 8px; text-align:left; vertical-align:top; }
    th { background:#F0F6F7; color:#0F5C6B; }
    .meta td { border:0; padding:2px 6px; }
    .meta td.k { color:#6B7280; width:150px; }
    .kpi td { text-align:center; }
    .kpi .n { font-size:18px; font-weight:800; color:#0F5C6B; }
    .sign { margin-top:36px; width:100%; }
    .sign td { border:0; text-align:center; height:90px; vertical-align:bottom; width:50%; }
    .muted { color:#6B7280; }
    .foot { margin-top:22px; font-size:10px; color:#9CA3AF; border-top:1px solid #E5E7EB; padding-top:6px; }
  </style>`

function kop(judul: string, sub: string): string {
  return `<div class="kop"><h1>${esc(judul)}</h1><div class="sub">${esc(sub)}</div></div>`
}

function attentionTable(rows: AttentionRow[]): string {
  if (!rows.length) return '<p class="muted">Tidak ada item yang perlu perhatian khusus.</p>'
  const body = rows
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td><td>${esc(r.proyekNama)}</td><td>${esc(r.modulLabel)}</td><td>${esc(r.judul)}</td>` +
        `<td>${esc(r.status)}</td><td>${esc(r.pic)}</td><td>${esc(r.tglTxt)} (${esc(r.chip)})</td><td>${esc(r.risiko)}</td></tr>`,
    )
    .join('')
  return (
    `<table><thead><tr><th>#</th><th>Proyek</th><th>Modul</th><th>Item</th><th>Status</th><th>PIC</th><th>Tenggat</th><th>Risiko</th></tr></thead>` +
    `<tbody>${body}</tbody></table>`
  )
}

function projectTable(s: Summary): string {
  if (!s.projects.length) return '<p class="muted">Belum ada proyek.</p>'
  const body = s.projects
    .map(
      (p) =>
        `<tr><td>${esc(p.nama)}</td><td>${esc(p.fase)}</td><td>${p.total}</td><td>${p.selesai}</td>` +
        `<td>${p.berjalan}</td><td>${p.tenggat30}</td><td>${p.terlambat}</td><td>${p.diblokir}</td></tr>`,
    )
    .join('')
  return (
    `<table><thead><tr><th>Proyek</th><th>Fase</th><th>Total</th><th>Selesai</th><th>Berjalan</th><th>Tenggat ≤30h</th><th>Terlambat</th><th>Diblokir</th></tr></thead>` +
    `<tbody>${body}</tbody></table>`
  )
}

function kpiTable(s: Summary): string {
  const cell = (n: number, l: string) => `<td><div class="n">${n}</div><div class="muted">${esc(l)}</div></td>`
  return (
    `<table class="kpi"><tr>${cell(s.projects.length, 'Proyek aktif')}${cell(s.totalItem, 'Total item')}` +
    `${cell(s.selesai, 'Selesai')}${cell(s.tenggat30, 'Tenggat ≤30h')}${cell(s.terlambat, 'Terlambat')}${cell(s.diblokir, 'Diblokir')}</tr></table>`
  )
}

/** Professional executive summary document body. */
export function ringkasanDocHtml(s: Summary, hariIni: string): string {
  return (
    DOC_STYLE +
    kop('RINGKASAN EKSEKUTIF — HARMONI COMMAND CENTER', `PT Cipta Harmoni Lestari · Data per ${esc(hariIni)}`) +
    `<h2>Indikator Utama</h2>${kpiTable(s)}` +
    `<h2>Status per Proyek</h2>${projectTable(s)}` +
    `<h2>Item yang Perlu Perhatian</h2>${attentionTable(s.attention)}` +
    `<div class="foot">Dokumen dibuat otomatis dari Harmoni Command Center pada ${esc(hariIni)}.</div>`
  )
}

export interface BeritaAcaraFields {
  nomor: string
  hariTanggal: string
  waktu: string
  tempat: string
  pimpinan: string
  notulen: string
  peserta: string
  keputusan: string
}

/** Professional weekly-meeting minutes (Berita Acara) document body. */
export function beritaAcaraDocHtml(f: BeritaAcaraFields, s: Summary, hariIni: string): string {
  const peserta = f.peserta
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
  const pesertaHtml = peserta.length
    ? `<table><thead><tr><th>#</th><th>Nama / Jabatan</th></tr></thead><tbody>${peserta
        .map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p)}</td></tr>`)
        .join('')}</tbody></table>`
    : '<p class="muted">—</p>'

  const keputusanHtml = f.keputusan.trim()
    ? '<ol>' + f.keputusan.split('\n').map((x) => x.trim()).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('') + '</ol>'
    : '<p class="muted">—</p>'

  const tindakLanjut = s.attention.length
    ? `<table><thead><tr><th>#</th><th>Tindak Lanjut (Item)</th><th>Proyek</th><th>PIC</th><th>Target</th></tr></thead><tbody>${s.attention
        .slice(0, 12)
        .map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.judul)}</td><td>${esc(r.proyekNama)}</td><td>${esc(r.pic)}</td><td>${esc(r.tglTxt)} (${esc(r.chip)})</td></tr>`)
        .join('')}</tbody></table>`
    : '<p class="muted">Tidak ada tindak lanjut mendesak.</p>'

  return (
    DOC_STYLE +
    kop('BERITA ACARA RAPAT MINGGUAN', 'PT Cipta Harmoni Lestari — Harmoni Command Center') +
    `<table class="meta">
      <tr><td class="k">Nomor</td><td>: ${esc(f.nomor || '—')}</td></tr>
      <tr><td class="k">Hari / Tanggal</td><td>: ${esc(f.hariTanggal)}</td></tr>
      <tr><td class="k">Waktu</td><td>: ${esc(f.waktu || '—')}</td></tr>
      <tr><td class="k">Tempat</td><td>: ${esc(f.tempat || '—')}</td></tr>
      <tr><td class="k">Pimpinan Rapat</td><td>: ${esc(f.pimpinan || '—')}</td></tr>
      <tr><td class="k">Notulen</td><td>: ${esc(f.notulen || '—')}</td></tr>
    </table>` +
    `<h2>1. Peserta Rapat</h2>${pesertaHtml}` +
    `<h2>2. Agenda</h2><ol>
      <li>Pembukaan &amp; tinjauan tindak lanjut rapat sebelumnya</li>
      <li>Ringkasan status proyek &amp; indikator utama</li>
      <li>Pembahasan item mendesak, terlambat, dan diblokir</li>
      <li>Progres perizinan per fase</li>
      <li>Keputusan &amp; penetapan tindak lanjut (PIC &amp; target)</li>
      <li>Penutup</li>
    </ol>` +
    `<h2>3. Ringkasan Status</h2>${kpiTable(s)}${projectTable(s)}` +
    `<h2>4. Pembahasan — Perlu Perhatian</h2>${attentionTable(s.attention)}` +
    `<h2>5. Keputusan Rapat</h2>${keputusanHtml}` +
    `<h2>6. Tindak Lanjut</h2>${tindakLanjut}` +
    `<table class="sign">
      <tr><td>Pimpinan Rapat<br/><br/><br/>( ${esc(f.pimpinan || '..................')} )</td>
          <td>Notulen<br/><br/><br/>( ${esc(f.notulen || '..................')} )</td></tr>
    </table>` +
    `<div class="foot">Berita acara dibuat dari Harmoni Command Center pada ${esc(hariIni)}.</div>`
  )
}
