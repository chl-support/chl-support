import { A, C } from '@/data/constants'
import { KAS } from '@/data/feasibility'

const W = 560
const H = 210
const PAD = { l: 8, r: 8, t: 14, b: 26 }

/** Cumulative cash curve across 24 months, with the deepest point marked. */
export function CashCurve() {
  const min = Math.min(...KAS)
  const max = Math.max(...KAS)
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  const x = (n: number) => PAD.l + (n / (KAS.length - 1)) * iw
  const y = (v: number) => PAD.t + ((max - v) / (max - min)) * ih

  const pts = KAS.map((v, n) => `${x(n)},${y(v)}`).join(' ')
  const area = `M${x(0)},${y(0)} L${pts.split(' ').join(' L')} L${x(KAS.length - 1)},${y(0)} Z`
  const dip = KAS.indexOf(min)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', marginTop: 10 }}
    >
      <defs>
        <linearGradient id="hcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={A} stopOpacity={0.16} />
          <stop offset="100%" stopColor={A} stopOpacity={0.01} />
        </linearGradient>
      </defs>

      <path d={area} fill="url(#hcArea)" />
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={y(0)}
        y2={y(0)}
        stroke="#D9DEE5"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={A}
        strokeWidth={2.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <line
        x1={x(dip)}
        x2={x(dip)}
        y1={y(min)}
        y2={y(0)}
        stroke={C.late}
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <circle cx={x(dip)} cy={y(min)} r={5} fill="#fff" stroke={C.late} strokeWidth={2.6} />
      <text x={x(dip) + 10} y={y(min) + 4} fill={C.late} fontSize={11} fontWeight={800}>
        Bulan {dip} · −Rp 78,5 M
      </text>

      <circle cx={x(KAS.length - 1)} cy={y(max)} r={4} fill={C.done} />
      <text x={W - PAD.r} y={y(max) - 8} textAnchor="end" fill={C.done} fontSize={11} fontWeight={800}>
        +Rp 60,8 M
      </text>

      <g>
        {[0, 6, 12, 18, 24].map((n) => (
          <text
            key={n}
            x={x(n)}
            y={H - 6}
            textAnchor={n === 0 ? 'start' : n === 24 ? 'end' : 'middle'}
            fill="#9CA3AF"
            fontSize={10}
            fontWeight={700}
          >
            B{n}
          </text>
        ))}
      </g>
    </svg>
  )
}
