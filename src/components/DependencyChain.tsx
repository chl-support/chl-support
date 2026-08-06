import { C, ST } from '@/data/constants'
import { H_CHIPS, PERMITS } from '@/data/permits'
import { fmtTgl, hari } from '@/lib/format'
import { lockedIndex } from '@/lib/permits'

/** LSD → KKPR → … → PSU. Locked permits render grey with a padlock. */
export function DependencyChain({ onSelect }: { onSelect: () => void }) {
  const gate = lockedIndex()

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '16px 18px 20px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Rantai ketergantungan izin
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
            Izin terkunci tidak dapat diajukan sebelum prasyaratnya selesai.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {H_CHIPS.map((h) => {
            const warna = h <= 7 ? C.late : h <= 30 ? C.due : h <= 90 ? C.run : '#9CA3AF'
            const n = PERMITS.filter((p) => {
              const d = hari(p.tgl)
              return d >= 0 && d <= h
            }).length
            return (
              <span
                key={h}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 26,
                  padding: '0 11px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: warna,
                  background: warna + '14',
                }}
              >
                H-{h} · {n}
              </span>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 6 }}>
        {PERMITS.map((p, n) => {
          const locked = gate < n
          const st = locked ? 'Terkunci' : p.status
          const warna = locked ? C.idle : (ST[p.status] ?? C.idle)
          const done = st === 'Selesai'
          const h = hari(p.tgl)
          const sub = done
            ? fmtTgl(p.tgl)
            : locked
              ? 'Terkunci'
              : h < 0
                ? 'Terlambat ' + Math.abs(h) + ' hr'
                : 'H-' + h

          return (
            <div key={p.kode} style={{ display: 'flex', alignItems: 'flex-start', flex: 'none' }}>
              <button
                type="button"
                className="hc-chain-node"
                onClick={onSelect}
                title={`${p.nama} — ${st}${p.prasyarat !== '—' ? ' · prasyarat: ' + p.prasyarat : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 7,
                  width: 96,
                  padding: '8px 4px',
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'transform 180ms',
                  opacity: locked ? 0.62 : 1,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    color: done ? '#fff' : locked ? '#6B7280' : warna,
                    background: done ? C.done : locked ? '#EFF1F4' : warna + '1A',
                    border: `1.5px solid ${done ? C.done : locked ? '#E0E3E8' : warna + '55'}`,
                  }}
                >
                  {locked ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : done ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span>{n + 1}</span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: locked ? '#9CA3AF' : '#111827',
                    textAlign: 'center',
                    lineHeight: 1.25,
                  }}
                >
                  {p.kode}
                </span>
                <span
                  style={{ fontSize: 10, fontWeight: 700, color: locked ? '#B6BBC3' : warna }}
                >
                  {sub}
                </span>
              </button>

              {n < PERMITS.length - 1 && (
                <span
                  style={{
                    display: 'block',
                    width: 18,
                    height: 2,
                    borderRadius: 2,
                    marginTop: 24,
                    background: gate < n + 1 ? '#E5E7EB' : '#CBD5D8',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
