import type { CSSProperties } from 'react'
import type { Row, SortDir } from '@/lib/rows'
import { EmptyState } from './EmptyState'

export type ColType = 'title' | 'status' | 'person' | 'date' | 'risk' | 'doc' | 'money' | 'text'

export interface Col {
  k: string
  label: string
  type: ColType
  w: string
  align: 'left' | 'right'
}

const ARROW: Record<SortDir, string> = { asc: '↑', desc: '↓' }

interface DataTableProps {
  rows: Row[]
  cols: Col[]
  rowH: number
  sortKey: string
  sortDir: SortDir
  onSort: (k: string) => void
  onOpen: (row: Row) => void
}

export function DataTable({ rows, cols, rowH, sortKey, sortDir, onSort, onOpen }: DataTableProps) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #E5E7EB' }}>
            {cols.map((c, n) => {
              const active = c.k === sortKey
              const pl = n === 0 ? 16 : 10
              const pr = n === cols.length - 1 ? 16 : 10
              return (
                <th key={c.k} style={{ padding: 0, width: c.w, border: 0 }}>
                  <button
                    type="button"
                    className="hc-th-btn"
                    onClick={() => onSort(c.k)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      width: '100%',
                      height: 34,
                      padding: `0 ${pr}px 0 ${pl}px`,
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 10.5,
                      letterSpacing: '0.055em',
                      fontWeight: 700,
                      color: active ? '#0F5C6B' : '#9CA3AF',
                      justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span>{c.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: active ? '#0F5C6B' : 'transparent',
                      }}
                    >
                      {active ? ARROW[sortDir] : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className="hc-row"
              onClick={() => onOpen(r)}
              style={{
                borderBottom: '1px solid #F1F3F5',
                cursor: 'pointer',
                height: rowH,
                background: r.blocked ? '#FFFCFC' : 'transparent',
              }}
            >
              {cols.map((c, n) => (
                <Cell key={c.k} col={c} row={r} rowH={rowH} first={n === 0} last={n === cols.length - 1} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && <EmptyState />}
    </div>
  )
}

function Cell({
  col,
  row,
  rowH,
  first,
  last,
}: {
  col: Col
  row: Row
  rowH: number
  first: boolean
  last: boolean
}) {
  const td: CSSProperties = {
    padding: `0 ${last ? 16 : 10}px 0 ${first ? 16 : 10}px`,
    height: rowH,
    overflow: 'hidden',
    textAlign: col.align === 'right' ? 'right' : 'left',
  }

  if (col.type === 'title') {
    return (
      <td style={td}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span
            style={{
              width: 3,
              height: 22,
              borderRadius: 2,
              flex: 'none',
              background: row.blocked ? '#DC2626' : row.statusWarna,
            }}
          />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.judul}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 10.5,
                fontWeight: 600,
                color: '#9CA3AF',
                letterSpacing: '0.02em',
              }}
            >
              {row.kode} · Jangka {row.horizon}
            </span>
          </span>
        </span>
      </td>
    )
  }

  if (col.type === 'status') {
    return (
      <td style={td}>
        <span style={row.statusStyle}>
          <span style={row.dotStyle} />
          {row.status}
        </span>
      </td>
    )
  }

  if (col.type === 'person') {
    const isPic = col.k === 'pic'
    const name = isPic ? row.pic : row.verif
    const init = isPic ? row.picInit : row.verifInit
    return (
      <td style={td}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 24,
              height: 24,
              flex: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              color: '#fff',
              background: isPic ? '#0F5C6B' : '#8FA3B8',
            }}
          >
            {init}
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#374151',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </span>
        </span>
      </td>
    )
  }

  if (col.type === 'date') {
    return (
      <td style={td}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#374151',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {row.tglTxt}
          </span>
          <span style={row.chipStyle}>{row.chip}</span>
        </span>
      </td>
    )
  }

  if (col.type === 'risk') {
    return (
      <td style={td}>
        <span style={row.risikoStyle}>{row.risiko}</span>
      </td>
    )
  }

  if (col.type === 'doc') {
    return (
      <td style={td}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 22,
            padding: '0 7px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            color: row.dok ? '#374151' : '#C6CBD3',
            background: row.dok ? '#F1F3F5' : 'transparent',
          }}
        >
          {row.dok}
        </span>
      </td>
    )
  }

  if (col.type === 'money') {
    return (
      <td style={td}>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: row.nilai ? 700 : 600,
            fontVariantNumeric: 'tabular-nums',
            color: row.nilai ? '#111827' : '#C6CBD3',
          }}
        >
          {row.nilaiTxt}
        </span>
      </td>
    )
  }

  const raw = (row as unknown as Record<string, unknown>)[col.k]
  return (
    <td style={td}>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: '#374151',
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {raw == null ? '—' : String(raw)}
      </span>
    </td>
  )
}
