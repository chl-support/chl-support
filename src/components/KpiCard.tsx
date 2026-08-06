export interface Kpi {
  label: string
  nilai: string
  sub: string
  warna: string
}

/**
 * Dashboard KPI tile. `dot` adds the leading status dot used on the executive
 * dashboard; the Feasibility grid renders the same card without it.
 */
export function KpiCard({ kpi, dot = false }: { kpi: Kpi; dot?: boolean }) {
  return (
    <div
      className={dot ? 'hc-kpi' : undefined}
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: dot ? '14px 15px 13px' : '14px 15px',
        boxShadow: dot ? 'var(--shadow-xs)' : undefined,
      }}
    >
      {dot ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: kpi.warna }} />
          <span
            style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '-0.005em' }}
          >
            {kpi.label}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 9 }}>
          {kpi.label}
        </div>
      )}
      <div
        style={{
          fontSize: dot ? 26 : 24,
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: kpi.warna,
        }}
      >
        {kpi.nilai}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{kpi.sub}</div>
    </div>
  )
}
