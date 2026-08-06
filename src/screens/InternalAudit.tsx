import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import type { AuditDoc } from '@/data/types'
import { deleteAuditDoc, fetchAuditDocs, uploadAuditDoc } from '@/lib/api'

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

export function InternalAudit() {
  const [docs, setDocs] = useState<AuditDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [judul, setJudul] = useState('')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
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

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setErr(null)
    const res = await uploadAuditDoc(file, judul)
    setUploading(false)
    if (res.ok) {
      setJudul('')
      reload()
    } else {
      setErr(res.error ?? 'Upload gagal.')
    }
  }

  async function onDelete(doc: AuditDoc) {
    if (!window.confirm(`Hapus dokumen "${doc.judul || doc.filename}"?`)) return
    const res = await deleteAuditDoc(doc.id)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus.')
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: '#9CA3AF' }}>
          LINTAS FUNGSI
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Internal Audit
        </h1>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          Unggah & kelola dokumen audit. Berkas tersimpan di Vercel Blob, metadatanya di Neon.
        </div>
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

      {/* panel unggah */}
      <div
        style={{
          marginTop: 16,
          padding: 18,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <label
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#9CA3AF',
              marginBottom: 6,
              display: 'block',
            }}
          >
            JUDUL DOKUMEN (opsional)
          </label>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="mis. Laporan Audit Q3 2026"
            style={{
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
              boxSizing: 'border-box',
            }}
          />
        </div>
        <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="hc-primary"
          style={{
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
          {uploading ? 'Mengunggah…' : '+ Unggah dokumen'}
        </button>
      </div>
      {err && (
        <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: '#B91C1C' }}>{err}</div>
      )}

      {/* daftar dokumen */}
      <div
        style={{
          marginTop: 16,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>
                <th style={th}>JUDUL</th>
                <th style={th}>BERKAS</th>
                <th style={th}>DIUNGGAH</th>
                <th style={{ ...th, textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={4}>
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading && docs.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={4}>
                    Belum ada dokumen. Unggah berkas pertama di atas.
                  </td>
                </tr>
              )}
              {!loading &&
                docs.map((d) => (
                  <tr key={d.id} className="hc-attach">
                    <td style={{ ...td, fontWeight: 700 }}>{d.judul || d.filename}</td>
                    <td style={td}>
                      <span style={{ color: '#111827' }}>{d.filename}</span>
                      <span style={{ color: '#9CA3AF', fontWeight: 600 }}> · {fmtSize(d.size)}</span>
                    </td>
                    <td style={{ ...td, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtWaktu(d.uploadedAt)}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
        Catatan: batas ukuran berkas ± 4,5 MB per unggahan (batas body serverless Vercel). Bila Vercel
        Blob belum terhubung, berkas otomatis disimpan di database Neon sebagai cadangan — unggahan tetap
        berfungsi. Hubungkan Blob store untuk penyimpanan berkas yang lebih ideal.
      </div>
    </div>
  )
}
