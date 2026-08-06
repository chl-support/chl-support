import { C, MODUL } from '@/data/constants'
import { PROYEK } from '@/data/projects'
import type { ModuleId, ProjectId } from '@/data/types'
import { isTerlambat, type Row } from '@/lib/rows'

export type MatrixStyle = 'Angka' | 'Titik'

interface ProjectMatrixProps {
  rows: Row[]
  gaya: MatrixStyle
  onJump: (proyek: ProjectId, modul: ModuleId) => void
}

const LEGEND = [
  { label: 'Aman', warna: C.done },
  { label: 'Tenggat dekat', warna: C.due },
  { label: 'Bermasalah', warna: C.late },
  { label: 'Kosong', warna: '#E5E7EB' },
]

/** Health of each bagan per project. Clicking a cell jumps to that module. */
export function ProjectMatrix({ rows, gaya, onJump }: ProjectMatrixProps) {
  const titik = gaya === 'Titik'
  const kolom = MODUL.slice(0, 6)

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Matriks proyek × modul
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
            Kesehatan tiap bagan per proyek. Klik sel untuk membuka modulnya.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {LEGEND.map((l) => (
            <span
              key={l.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10.5,
                fontWeight: 700,
                color: '#6B7280',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.warna }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '6px 16px 16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#9CA3AF',
                  padding: '10px 8px 8px',
                  width: '34%',
                }}
              >
                PROYEK
              </th>
              {kolom.map((m) => (
                <th
                  key={m.id}
                  style={{
                    textAlign: 'center',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    color: '#9CA3AF',
                    padding: '10px 4px 8px',
                  }}
                >
                  {m.pendek}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROYEK.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #F1F3F5' }}>
                <td style={{ padding: '9px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        flex: 'none',
                        background: p.warna,
                      }}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.nama}
                      </span>
                      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                        {p.lok} · {p.ha} · {p.unit} unit
                      </span>
                    </span>
                  </div>
                </td>
                {kolom.map((m) => {
                  const set = rows.filter((r) => r.proyek === p.id && r.modul === m.id)
                  const bad = set.filter((r) => r.status === 'Diblokir' || isTerlambat(r)).length
                  const warn = set.filter(
                    (r) => r.chip.startsWith('H-') && parseInt(r.chip.slice(2), 10) <= 30,
                  ).length

                  let warna: string = C.idle
                  let label = 'belum ada item'
                  if (set.length === 0) {
                    warna = '#E5E7EB'
                  } else if (bad > 0) {
                    warna = C.late
                    label = bad + ' item bermasalah'
                  } else if (warn > 0) {
                    warna = C.due
                    label = warn + ' tenggat dekat'
                  } else {
                    warna = C.done
                    label = 'aman'
                  }

                  return (
                    <td key={m.id} style={{ padding: '9px 4px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="hc-matrix-cell"
                        title={`${p.nama} · ${m.label} — ${label}`}
                        onClick={() => onJump(p.id, m.id)}
                        style={
                          titik
                            ? {
                                width: 13,
                                height: 13,
                                borderRadius: '50%',
                                border: 0,
                                padding: 0,
                                cursor: 'pointer',
                                background: set.length ? warna : '#E5E7EB',
                                transition: 'transform 160ms',
                              }
                            : {
                                width: 30,
                                height: 30,
                                borderRadius: 9,
                                border: 0,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 11,
                                fontWeight: 800,
                                color: set.length ? '#fff' : '#C6CBD3',
                                background: set.length ? warna : '#F1F3F5',
                                transition: 'transform 160ms',
                              }
                        }
                      >
                        {titik ? '' : set.length || ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
