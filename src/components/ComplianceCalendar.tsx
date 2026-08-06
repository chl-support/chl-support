import { A, BL, C } from '@/data/constants'
import { fmtTgl } from '@/lib/format'
import type { Row } from '@/lib/rows'

/** Density ramp, sepi → padat. */
const SKALA = ['#EFF1F4', '#CFE3E6', '#9FC8CE', '#5EA3AE', A]

/** The three months the 90-day window spans, and the day that counts as today. */
const BULAN_BLOK: [number, number][] = [
  [7, 2026],
  [8, 2026],
  [9, 2026],
]
const TODAY_CELL = { y: 2026, m: 7, d: 6 }

/** 90-day deadline heatmap, one block per month, Monday-first. */
export function ComplianceCalendar({ rows, total }: { rows: Row[]; total: number }) {
  const perDay: Record<string, number> = {}
  rows.forEach((r) => {
    perDay[r.tgl] = (perDay[r.tgl] ?? 0) + 1
  })

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Kalender kepatuhan 90 hari
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
          Kepadatan tenggat per hari — {total} tenggat mendatang
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {BULAN_BLOK.map(([m, y]) => {
          const dim = new Date(y, m + 1, 0).getDate()
          const off = (new Date(y, m, 1).getDay() + 6) % 7
          const cells: { key: string; n: string; tip: string; count: number; today: boolean }[] = []

          for (let k = 0; k < off; k++) {
            cells.push({ key: 'pad' + k, n: '', tip: '', count: -1, today: false })
          }

          let tot = 0
          for (let dn = 1; dn <= dim; dn++) {
            const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dn).padStart(2, '0')}`
            const c = perDay[iso] ?? 0
            tot += c
            cells.push({
              key: iso,
              n: String(dn),
              tip: `${fmtTgl(iso)} — ${c} tenggat`,
              count: c,
              today: y === TODAY_CELL.y && m === TODAY_CELL.m && dn === TODAY_CELL.d,
            })
          }

          return (
            <div key={`${y}-${m}`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 7,
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {BL[m]} {y}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF' }}>{tot} tenggat</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                {cells.map((c) =>
                  c.count < 0 ? (
                    <div key={c.key} style={{ height: 20 }} />
                  ) : (
                    <div
                      key={c.key}
                      title={c.tip}
                      style={{
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 5,
                        fontSize: 9.5,
                        fontWeight: 700,
                        background: c.count === 0 ? '#F7F8FA' : SKALA[Math.min(4, c.count)],
                        color: c.today ? C.late : c.count >= 2 ? '#fff' : '#9CA3AF',
                        outline: c.today ? `2px solid ${C.late}` : undefined,
                        outlineOffset: c.today ? -2 : undefined,
                      }}
                    >
                      {c.n}
                    </div>
                  ),
                )}
              </div>
            </div>
          )
        })}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 10,
            borderTop: '1px solid #F1F3F5',
          }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF' }}>Sepi</span>
          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
            {SKALA.map((w) => (
              <span key={w} style={{ height: 9, flex: 1, borderRadius: 3, background: w }} />
            ))}
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF' }}>Padat</span>
        </div>
      </div>
    </div>
  )
}
