import { A, C, MODUL } from '@/data/constants'
import type { Horizon, ModuleId, Project } from '@/data/types'
import { BlockerBanner } from '@/components/BlockerBanner'
import { DataTable } from '@/components/DataTable'
import { PillButton } from '@/components/PillButton'
import { COLS_ITEM } from '@/lib/columns'
import { isTerlambat, type Row, type SortDir } from '@/lib/rows'

interface DetailProyekProps {
  proyekAktif: Project
  all: Row[]
  rows: Row[]
  modul: ModuleId
  horizon: Horizon
  filter: string
  rowH: number
  densityLabel: string
  sortKey: string
  sortDir: SortDir
  onModul: (m: ModuleId) => void
  onHorizon: (h: Horizon) => void
  onFilter: (f: string) => void
  onToggleDensity: () => void
  onNewItem: () => void
  onSort: (k: string) => void
  onOpen: (row: Row) => void
}

const HORIZONS: Horizon[] = ['Pendek', 'Panjang']

export function DetailProyek({
  proyekAktif,
  all,
  rows,
  modul,
  horizon,
  filter,
  rowH,
  densityLabel,
  sortKey,
  sortDir,
  onModul,
  onHorizon,
  onFilter,
  onToggleDensity,
  onNewItem,
  onSort,
  onOpen,
}: DetailProyekProps) {
  const scoped = all.filter((r) => r.proyek === proyekAktif.id && r.modul === modul)
  const blocker = scoped.find((r) => r.blocked)

  const metaChips = [
    { k: 'Lokasi', v: proyekAktif.lok },
    { k: 'Luas', v: proyekAktif.ha },
    { k: 'Unit', v: proyekAktif.unit + ' unit' },
    { k: 'PEMDA', v: proyekAktif.pemda },
    { k: 'Kadiv', v: 'Rani Puspita' },
  ]

  const stat = [
    {
      label: 'ITEM AKTIF',
      v: String(all.filter((r) => r.proyek === proyekAktif.id && r.status !== 'Selesai').length),
      warna: '#111827',
    },
    {
      label: 'TERLAMBAT',
      v: String(all.filter((r) => r.proyek === proyekAktif.id && isTerlambat(r)).length),
      warna: C.late,
    },
    {
      label: 'DIBLOKIR',
      v: String(all.filter((r) => r.proyek === proyekAktif.id && r.blocked).length),
      warna: C.late,
    },
  ]

  const filterDefs: [string, string, number][] = [
    ['Semua', '#9CA3AF', scoped.length],
    ['Berjalan', C.run, scoped.filter((r) => r.status === 'Berjalan').length],
    ['Menunggu Verifikasi', C.verif, scoped.filter((r) => r.status === 'Menunggu Verifikasi').length],
    ['Menunggu Pihak Ketiga', C.due, scoped.filter((r) => r.status === 'Menunggu Pihak Ketiga').length],
    ['Diblokir', C.late, scoped.filter((r) => r.status === 'Diblokir').length],
    ['Terlambat', C.late, scoped.filter(isTerlambat).length],
  ]

  return (
    <div>
      {/* ---- project header ---- */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          padding: '18px 20px 0',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            paddingBottom: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: A }}>
                DETAIL PROYEK
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 22,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: proyekAktif.warna,
                  background: proyekAktif.warna + '16',
                }}
              >
                {proyekAktif.fase}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em' }}>
              {proyekAktif.nama}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
              {metaChips.map((c) => (
                <span
                  key={c.k}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 11px',
                    borderRadius: 'var(--radius-pill)',
                    background: '#F3F6F7',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#374151',
                  }}
                >
                  <span style={{ color: '#9CA3AF', fontWeight: 700 }}>{c.k}</span>
                  {c.v}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flex: 'none' }}>
            {stat.map((s) => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#9CA3AF',
                    marginBottom: 5,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', color: s.warna }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- module tabs ---- */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', borderTop: '1px solid #F1F3F5' }}>
          {MODUL.map((m) => {
            const active = modul === m.id
            const n = all.filter((r) => r.proyek === proyekAktif.id && r.modul === m.id).length
            return (
              <button
                key={m.id}
                type="button"
                className="hc-tab"
                onClick={() => onModul(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 42,
                  padding: '0 14px',
                  border: 0,
                  background: 'transparent',
                  borderBottom: `2px solid ${active ? A : 'transparent'}`,
                  color: active ? '#111827' : '#6B7280',
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{m.label}</span>
                <span
                  style={{
                    minWidth: 19,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 6,
                    background: active ? '#E3EFF1' : '#F3F4F6',
                    color: active ? A : '#9CA3AF',
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {n}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {blocker && (
        <BlockerBanner
          judul={blocker.judul}
          pesan={blocker.blockReason ?? ''}
          onOpen={() => onOpen(blocker)}
        />
      )}

      {/* ---- table ---- */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onHorizon(h)}
                style={{
                  height: 26,
                  padding: '0 13px',
                  border: 0,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: horizon === h ? '#fff' : 'transparent',
                  color: horizon === h ? '#111827' : '#6B7280',
                  boxShadow: horizon === h ? 'var(--shadow-xs)' : undefined,
                }}
              >
                Jangka {h}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 22, background: '#E5E7EB' }} />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filterDefs.map(([label, warna, n]) => {
              const active = filter === label
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onFilter(label)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 30,
                    padding: '0 11px',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 11.5,
                    fontWeight: 700,
                    border: `1px solid ${active ? A : '#E5E7EB'}`,
                    background: active ? '#F0F6F7' : '#fff',
                    color: active ? A : '#6B7280',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: warna }} />
                  {label}
                  <span style={{ fontWeight: 800, opacity: 0.55 }}>{n}</span>
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1 }} />

          <PillButton
            variant="outline-muted"
            height={30}
            fontSize={11.5}
            padding="0 12px"
            title="Ubah kerapatan baris"
            onClick={onToggleDensity}
          >
            {densityLabel}
          </PillButton>
          <PillButton variant="outline-muted" height={30} fontSize={11.5} padding="0 12px">
            Ekspor CSV
          </PillButton>
          <PillButton variant="primary" height={30} fontSize={11.5} padding="0 14px" onClick={onNewItem}>
            + Item baru
          </PillButton>
        </div>

        <DataTable
          rows={rows}
          cols={COLS_ITEM}
          rowH={rowH}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          onOpen={onOpen}
        />
      </div>
    </div>
  )
}
