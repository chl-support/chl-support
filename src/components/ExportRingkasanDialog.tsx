import { useMemo, type CSSProperties } from 'react'
import { A, C } from '@/data/constants'
import type { Project } from '@/data/types'
import { downloadCsv, downloadWordDoc, printHtml, ringkasanDocHtml } from '@/lib/docs'
import type { Row } from '@/lib/rows'
import { buildSummary } from '@/lib/summary'

interface Props {
  rows: Row[]
  projects: Project[]
  hariIni: string
  onClose: () => void
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: '#9CA3AF',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
}
const td: CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid #F1F3F5',
}

export function ExportRingkasanDialog({ rows, projects, hariIni, onClose }: Props) {
  const s = useMemo(() => buildSummary(rows, projects), [rows, projects])

  const kpis = [
    { l: 'Proyek aktif', n: s.projects.length, w: '#111827' },
    { l: 'Total item', n: s.totalItem, w: A },
    { l: 'Selesai', n: s.selesai, w: C.done },
    { l: 'Tenggat ≤30h', n: s.tenggat30, w: C.due },
    { l: 'Terlambat', n: s.terlambat, w: C.late },
    { l: 'Diblokir', n: s.diblokir, w: C.late },
  ]

  function onCsv() {
    const header = ['Proyek', 'Modul', 'Item', 'Status', 'PIC', 'Tenggat', 'Chip', 'Risiko']
    const body = s.attention.map((r) => [r.proyekNama, r.modulLabel, r.judul, r.status, r.pic, r.tglTxt, r.chip, r.risiko])
    downloadCsv(`ringkasan-eksekutif-${hariIni.replace(/\s+/g, '-')}.csv`, [header, ...body])
  }
  function onDoc() {
    downloadWordDoc(`ringkasan-eksekutif-${hariIni.replace(/\s+/g, '-')}.doc`, 'Ringkasan Eksekutif', ringkasanDocHtml(s, hariIni))
  }
  function onPrint() {
    printHtml('Ringkasan Eksekutif', ringkasanDocHtml(s, hariIni))
  }

  return (
    <>
      <div onClick={onClose} style={overlay} />
      <div role="dialog" aria-modal="true" style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: A }}>EKSPOR</div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Ringkasan Eksekutif
            </h2>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>Data per {hariIni}</div>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} style={closeBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
            {kpis.map((k) => (
              <div key={k.l} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.w }}>{k.n}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginTop: 2 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* per-project */}
          <div style={{ fontSize: 12.5, fontWeight: 800, margin: '18px 0 8px' }}>Status per proyek</div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead>
                  <tr>
                    <th style={th}>PROYEK</th>
                    <th style={th}>FASE</th>
                    <th style={th}>TOTAL</th>
                    <th style={th}>SELESAI</th>
                    <th style={th}>≤30H</th>
                    <th style={th}>TERLAMBAT</th>
                    <th style={th}>DIBLOKIR</th>
                  </tr>
                </thead>
                <tbody>
                  {s.projects.length === 0 && (
                    <tr>
                      <td style={{ ...td, color: '#9CA3AF' }} colSpan={7}>Belum ada proyek.</td>
                    </tr>
                  )}
                  {s.projects.map((p) => (
                    <tr key={p.id}>
                      <td style={{ ...td, fontWeight: 700 }}>{p.nama}</td>
                      <td style={td}>{p.fase}</td>
                      <td style={td}>{p.total}</td>
                      <td style={td}>{p.selesai}</td>
                      <td style={{ ...td, color: p.tenggat30 ? C.due : '#111827' }}>{p.tenggat30}</td>
                      <td style={{ ...td, color: p.terlambat ? C.late : '#111827' }}>{p.terlambat}</td>
                      <td style={{ ...td, color: p.diblokir ? C.late : '#111827' }}>{p.diblokir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* attention */}
          <div style={{ fontSize: 12.5, fontWeight: 800, margin: '18px 0 8px' }}>
            Perlu perhatian ({s.attention.length})
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 220 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={th}>PROYEK</th>
                    <th style={th}>ITEM</th>
                    <th style={th}>STATUS</th>
                    <th style={th}>PIC</th>
                    <th style={th}>TENGGAT</th>
                  </tr>
                </thead>
                <tbody>
                  {s.attention.length === 0 && (
                    <tr>
                      <td style={{ ...td, color: '#9CA3AF' }} colSpan={5}>Tidak ada item mendesak.</td>
                    </tr>
                  )}
                  {s.attention.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.proyekNama}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{r.judul}</td>
                      <td style={td}>{r.status}</td>
                      <td style={td}>{r.pic}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{r.chip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={footer}>
          <button type="button" onClick={onDoc} className="hc-primary" style={primaryBtn}>
            Unduh Word (.doc)
          </button>
          <button type="button" onClick={onCsv} style={outlineBtn}>
            Unduh CSV
          </button>
          <button type="button" onClick={onPrint} style={outlineBtn}>
            Cetak / PDF
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={outlineBtn}>
            Tutup
          </button>
        </div>
      </div>
    </>
  )
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.28)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  zIndex: 80,
}
const modal: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 760,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 64px)',
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 14,
  boxShadow: 'var(--shadow-lg)',
  zIndex: 81,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}
const header: CSSProperties = {
  flex: 'none',
  padding: '16px 20px',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const footer: CSSProperties = {
  flex: 'none',
  padding: '13px 20px',
  borderTop: '1px solid #E5E7EB',
  background: '#FCFDFD',
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}
const closeBtn: CSSProperties = {
  width: 30,
  height: 30,
  flex: 'none',
  border: '1px solid #E5E7EB',
  background: '#fff',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}
const primaryBtn: CSSProperties = {
  height: 38,
  padding: '0 18px',
  border: 0,
  borderRadius: 'var(--radius-pill)',
  background: A,
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
}
const outlineBtn: CSSProperties = {
  height: 38,
  padding: '0 16px',
  border: '1px solid #E5E7EB',
  borderRadius: 'var(--radius-pill)',
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  cursor: 'pointer',
}
