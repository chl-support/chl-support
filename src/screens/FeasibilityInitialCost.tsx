import { A, C } from '@/data/constants'
import { FEAS_KPIS, SENSITIVITAS, TAHAP, TAHAP_LEGEND } from '@/data/feasibility'
import type { Project } from '@/data/types'
import { CashCurve } from '@/components/CashCurve'
import { KpiCard } from '@/components/KpiCard'
import { PillButton } from '@/components/PillButton'
import { desimal, num } from '@/lib/format'

const thStyle = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
} as const

export function FeasibilityInitialCost({ proyekAktif }: { proyekAktif: Project }) {
  const tahapan = TAHAP.map((t, n) => {
    const dev = t.realisasi - t.rencana
    const pc = (dev / t.rencana) * 100
    const ters = (t.realisasi / t.rencana) * 100
    return {
      no: String(n + 1).padStart(2, '0'),
      nama: t.nama,
      rencana: num(t.rencana),
      realisasi: num(t.realisasi),
      devRp: (dev > 0 ? '+' : '−') + num(Math.abs(dev)),
      devPc: (pc > 0 ? '+' : '−') + desimal(Math.abs(pc)) + '%',
      warna: dev <= 0 ? C.done : C.late,
      terserap: ters.toFixed(0) + '%',
      barWidth: Math.min(100, ters),
      barColor: ters > 100 ? C.late : ters >= 85 ? A : '#8FC0C8',
    }
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#0F5C6B',
              marginBottom: 5,
            }}
          >
            LINTAS FUNGSI · FEASIBILITY &amp; INITIAL COST
          </div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Kelayakan {proyekAktif.nama}
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            Baseline v3.2 · disetujui 14 Feb 2026 oleh Direktur Keuangan
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              height: 32,
              padding: '0 14px',
              borderRadius: 'var(--radius-pill)',
              background: '#D6FD91',
              fontSize: 12,
              fontWeight: 800,
              color: '#33501A',
            }}
          >
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
            Baseline terkunci
          </span>
          <PillButton>Ajukan revisi baseline</PillButton>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {FEAS_KPIS.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))',
          gap: 14,
          marginBottom: 14,
          alignItems: 'start',
        }}
      >
        {/* ---- cash curve ---- */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Kurva kas kumulatif
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
                24 bulan · titik terdalam ditandai
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF' }}>PEAK CASH</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626', letterSpacing: '-0.02em' }}>
                −Rp 78,5 M
              </div>
            </div>
          </div>
          <CashCurve />
        </div>

        {/* ---- sensitivity ---- */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '15px 18px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>Sensitivitas</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
              Harga jual −8% / basis / +6%, biaya konstruksi ±5%
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ ...thStyle, textAlign: 'left', padding: '9px 18px' }}>SKENARIO</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '9px 10px' }}>NPV</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '9px 10px' }}>IRR</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '9px 10px' }}>PAYBACK</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '9px 18px' }}>MARGIN</th>
              </tr>
            </thead>
            <tbody>
              {SENSITIVITAS.map((s) => (
                <tr key={s.nama} style={s.rowStyle}>
                  <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 800, color: s.warna }}>
                    {s.nama}
                  </td>
                  {[s.npv, s.irr, s.payback, s.margin].map((v, i) => (
                    <td
                      key={v}
                      style={{
                        padding: i === 3 ? '12px 18px' : '12px 10px',
                        textAlign: 'right',
                        fontSize: 13,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid #F1F3F5',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#6B7280',
            }}
          >
            Ambang tolak: IRR &lt; 13% atau margin &lt; 15%. Skenario pesimis masih lolos.
          </div>
        </div>
      </div>

      {/* ---- initial cost, 11 tahap ---- */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px 12px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Initial cost — 11 tahap
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
              Rencana Rp 96,2 M · realisasi Rp 88,7 M · deviasi −Rp 7,5 M (−7,8%)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {TAHAP_LEGEND.map((l) => (
              <span
                key={l.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.warna }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ ...thStyle, textAlign: 'left', padding: '9px 18px' }}>TAHAP</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '9px 12px' }}>RENCANA</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '9px 12px' }}>REALISASI</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '9px 12px' }}>DEVIASI RP</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '9px 12px' }}>DEVIASI %</th>
              <th style={{ ...thStyle, textAlign: 'left', padding: '9px 18px 9px 24px', width: 190 }}>
                % TERSERAP
              </th>
            </tr>
          </thead>
          <tbody>
            {tahapan.map((t) => (
              <tr key={t.nama} className="hc-tahap-row" style={{ borderBottom: '1px solid #F1F3F5' }}>
                <td style={{ padding: '0 18px', height: 38, fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#C6CBD3',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {t.no}
                    </span>
                    {t.nama}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.rencana}
                </td>
                <td
                  style={{
                    padding: '0 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#111827',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.realisasi}
                </td>
                <td
                  style={{
                    padding: '0 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: t.warna,
                  }}
                >
                  {t.devRp}
                </td>
                <td
                  style={{
                    padding: '0 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: t.warna,
                  }}
                >
                  {t.devPc}
                </td>
                <td style={{ padding: '0 18px 0 24px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 'var(--radius-pill)',
                        background: '#EEF0F3',
                        overflow: 'hidden',
                        display: 'block',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          height: '100%',
                          borderRadius: 'var(--radius-pill)',
                          width: t.barWidth + '%',
                          background: t.barColor,
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6B7280',
                        fontVariantNumeric: 'tabular-nums',
                        width: 42,
                        textAlign: 'right',
                      }}
                    >
                      {t.terserap}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#FAFBFC', borderTop: '1px solid #E5E7EB' }}>
              <td style={{ padding: '0 18px', height: 42, fontSize: 13, fontWeight: 800 }}>Total</td>
              <td
                style={{
                  padding: '0 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                96.200
              </td>
              <td
                style={{
                  padding: '0 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                88.700
              </td>
              <td
                style={{
                  padding: '0 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#16A34A',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                −7.500
              </td>
              <td
                style={{
                  padding: '0 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#16A34A',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                −7,8%
              </td>
              <td
                style={{
                  padding: '0 18px 0 24px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#6B7280',
                }}
              >
                Nilai dalam Rp juta
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
