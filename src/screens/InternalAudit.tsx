import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { A, C } from '@/data/constants'
import { ALUR_TTD_DEFAULT, DIVISI, DIVISI_PERAN } from '@/data/divisi'
import type { AuditDoc } from '@/data/types'
import { deleteAuditDoc, fetchAuditDocs, uploadAuditDoc } from '@/lib/api'
import { kpiAudit, ringkasDok, type StatusDok } from '@/lib/signoff'
import { SignoffStepper } from '@/components/SignoffStepper'

const fmtSize = (n: number): string =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB'

function fmtWaktu(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
}
const td: CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid #F1F3F5',
  verticalAlign: 'middle',
}
const label: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: 6,
  display: 'block',
}
const input: CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 9,
  outline: 0,
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  background: '#fff',
  boxSizing: 'border-box',
}

function badge(warna: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: '0 10px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '16',
  }
}

const FILTER = ['Semua', 'Menunggu tanda tangan', 'Perlu revisi', 'Selesai', 'Terlambat'] as const
type Filter = (typeof FILTER)[number]

function Kpi({ nilai, judul, warna }: { nilai: number; judul: string; warna: string }) {
  return (
    <div
      style={{
        flex: '1 1 120px',
        minWidth: 120,
        padding: '12px 14px',
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: warna }}>
        {nilai}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{judul}</div>
    </div>
  )
}

/** Bilah kemajuan "x dari n divisi" pada baris tabel. */
function Kemajuan({ rasio, warna }: { rasio: number; warna: string }) {
  return (
    <div style={{ width: 92, height: 5, borderRadius: 3, background: '#EEF0F3', overflow: 'hidden' }}>
      <div style={{ width: Math.round(rasio * 100) + '%', height: '100%', background: warna }} />
    </div>
  )
}

export function InternalAudit() {
  const [docs, setDocs] = useState<AuditDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [judul, setJudul] = useState('')
  const [tenggat, setTenggat] = useState('')
  const [alur, setAlur] = useState<string[]>(ALUR_TTD_DEFAULT)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('Semua')
  const [buka, setBuka] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    setLoading(true)
    const data = await fetchAuditDocs()
    if (data) {
      setDocs(data)
      setNotice(null)
    } else {
      setDocs([])
      setNotice('Backend belum terhubung — hubungkan Neon & Blob di Vercel agar dokumen bisa diunggah & tersimpan.')
    }
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const kpi = useMemo(() => kpiAudit(docs), [docs])

  const baris = useMemo(
    () =>
      docs
        .map((d) => ({ doc: d, r: ringkasDok(d) }))
        .filter(({ r }) =>
          filter === 'Semua'
            ? true
            : filter === 'Terlambat'
              ? r.terlambat
              : r.status === (filter as StatusDok),
        ),
    [docs, filter],
  )

  /** Klik chip divisi: masuk ke ujung alur, klik lagi untuk mengeluarkannya. */
  function toggleDivisi(d: string) {
    setAlur((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setErr(null)
    const res = await uploadAuditDoc(file, { judul, divisi: alur, tenggat: tenggat || undefined })
    setUploading(false)
    if (res.ok) {
      setJudul('')
      setTenggat('')
      reload()
    } else {
      setErr(res.error ?? 'Upload gagal.')
    }
  }

  async function onDelete(doc: AuditDoc) {
    if (!window.confirm(`Hapus dokumen "${doc.judul || doc.filename}" beserta alur tanda tangannya?`))
      return
    const res = await deleteAuditDoc(doc.id)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus.')
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: '#9CA3AF' }}>
          LINTAS FUNGSI
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Internal Audit
        </h1>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          Monitoring dokumen yang harus ditandatangani — tiap dokumen berjalan bertahap melewati
          divisi terkait sampai pengesahan akhir.
        </div>
      </div>

      {/* KPI alur tanda tangan */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <Kpi nilai={kpi.total} judul="Dokumen" warna="#111827" />
        <Kpi nilai={kpi.berjalan} judul="Menunggu tanda tangan" warna={C.run} />
        <Kpi nilai={kpi.revisi} judul="Perlu revisi" warna={C.late} />
        <Kpi nilai={kpi.terlambat} judul="Lewat tenggat" warna={C.due} />
        <Kpi nilai={kpi.selesai} judul="Selesai ditandatangani" warna={C.done} />
      </div>

      {notice && (
        <div
          style={{
            marginTop: 16,
            padding: '11px 14px',
            borderRadius: 10,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#92400E',
          }}
        >
          {notice}
        </div>
      )}

      {/* panel unggah + penyusunan alur */}
      <div
        style={{
          marginTop: 16,
          padding: 18,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={label}>JUDUL DOKUMEN (OPSIONAL)</label>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="mis. Berita Acara Serah Terima Blok C"
              style={input}
            />
          </div>
          <div style={{ minWidth: 170 }}>
            <label style={label}>TENGGAT TANDA TANGAN</label>
            <input
              type="date"
              value={tenggat}
              onChange={(e) => setTenggat(e.target.value)}
              style={input}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={label}>ALUR TANDA TANGAN — KLIK DIVISI SESUAI URUTAN</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DIVISI.map((d) => {
              const idx = alur.indexOf(d)
              const dipilih = idx >= 0
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDivisi(d)}
                  title={DIVISI_PERAN[d]}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 32,
                    padding: '0 13px',
                    border: '1px solid ' + (dipilih ? A : '#E5E7EB'),
                    borderRadius: 'var(--radius-pill)',
                    background: dipilih ? A + '0F' : '#fff',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: dipilih ? A : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {dipilih && (
                    <span
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: '50%',
                        background: A,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                  {d}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAlur(ALUR_TTD_DEFAULT)}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                color: A,
                cursor: 'pointer',
              }}
            >
              Pakai alur baku
            </button>
            <button
              type="button"
              onClick={() => setAlur([])}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                color: '#9CA3AF',
                cursor: 'pointer',
              }}
            >
              Kosongkan
            </button>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
              {alur.length ? alur.join(' → ') : 'Belum ada divisi dipilih — alur bisa diatur nanti per dokumen.'}
            </span>
          </div>
        </div>

        <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="hc-primary"
          style={{
            marginTop: 14,
            height: 38,
            padding: '0 18px',
            border: 0,
            borderRadius: 'var(--radius-pill)',
            background: uploading ? '#9DBEC4' : A,
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {uploading ? 'Mengunggah…' : '+ Unggah dokumen & mulai alur'}
        </button>
      </div>
      {err && (
        <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: '#B91C1C' }}>{err}</div>
      )}

      {/* filter status */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {FILTER.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              height: 30,
              padding: '0 13px',
              border: '1px solid ' + (filter === f ? A : '#E5E7EB'),
              borderRadius: 'var(--radius-pill)',
              background: filter === f ? A : '#fff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              color: filter === f ? '#fff' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* daftar dokumen + alur */}
      <div
        style={{
          marginTop: 12,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>DOKUMEN</th>
                <th style={th}>STATUS ALUR</th>
                <th style={th}>MENUNGGU DIVISI</th>
                <th style={th}>KEMAJUAN</th>
                <th style={th}>DIUNGGAH</th>
                <th style={{ ...th, textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={6}>
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading && baris.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={6}>
                    {docs.length === 0
                      ? 'Belum ada dokumen. Unggah berkas pertama di atas.'
                      : 'Tidak ada dokumen pada filter ini.'}
                  </td>
                </tr>
              )}
              {!loading &&
                baris.map(({ doc: d, r }) => {
                  const terbuka = buka === d.id
                  return [
                    <tr
                      key={d.id}
                      className="hc-attach"
                      onClick={() => setBuka(terbuka ? null : d.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ ...td, fontWeight: 700 }}>
                        <span style={{ color: '#9CA3AF', marginRight: 8, fontSize: 11 }}>
                          {terbuka ? '▾' : '▸'}
                        </span>
                        {d.judul || d.filename}
                        <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
                          {d.filename} · {fmtSize(d.size)}
                        </div>
                      </td>
                      <td style={td}>
                        <span style={badge(r.warna)}>{r.status}</span>
                        {r.chip && (
                          <span style={{ ...badge(r.chipWarna), marginLeft: 6 }}>{r.chip}</span>
                        )}
                      </td>
                      <td style={{ ...td, color: r.menunggu ? '#111827' : '#9CA3AF' }}>
                        {r.menunggu || '—'}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Kemajuan rasio={r.rasio} warna={r.warna} />
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6B7280' }}>
                            {r.selesai}/{r.total || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...td, color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {fmtWaktu(d.uploadedAt)}
                      </td>
                      <td
                        style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            height: 30,
                            lineHeight: '30px',
                            padding: '0 12px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 'var(--radius-pill)',
                            background: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            color: A,
                            textDecoration: 'none',
                            marginRight: 6,
                          }}
                        >
                          Buka
                        </a>
                        <button
                          type="button"
                          onClick={() => onDelete(d)}
                          style={{
                            height: 30,
                            padding: '0 12px',
                            border: '1px solid #FECACA',
                            borderRadius: 'var(--radius-pill)',
                            background: '#fff',
                            fontFamily: 'inherit',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#B91C1C',
                            cursor: 'pointer',
                          }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>,
                    terbuka && (
                      <tr key={d.id + '-alur'}>
                        <td colSpan={6} style={{ padding: '14px 16px 16px', background: '#FAFBFC', borderBottom: '1px solid #F1F3F5' }}>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              color: '#9CA3AF',
                              marginBottom: 10,
                            }}
                          >
                            ALUR TANDA TANGAN ANTAR DIVISI
                          </div>
                          <SignoffStepper doc={d} onChanged={reload} />
                        </td>
                      </tr>
                    ),
                  ]
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
        Alur berjalan berurutan: divisi berikutnya baru bisa menandatangani setelah divisi
        sebelumnya selesai. "Minta revisi" mengembalikan dokumen ke pengunggah dengan catatan
        perbaikan. Batas ukuran berkas ± 4,5 MB per unggahan (batas body serverless Vercel); bila
        Vercel Blob belum terhubung, berkas disimpan di Neon sebagai cadangan.
      </div>
    </div>
  )
}
