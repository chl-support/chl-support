import { C } from '@/data/constants'
import type { ModuleId, Project, ProjectId } from '@/data/types'
import { ComplianceCalendar } from '@/components/ComplianceCalendar'
import { DataTable } from '@/components/DataTable'
import { KpiCard, type Kpi } from '@/components/KpiCard'
import { PillButton } from '@/components/PillButton'
import { ProjectMatrix, type MatrixStyle } from '@/components/ProjectMatrix'
import { COLS_RINGKAS } from '@/lib/columns'
import { hari } from '@/lib/format'
import { isTerlambat, sortRows, type Row, type SortDir } from '@/lib/rows'

interface DashboardProps {
  all: Row[]
  projects: Project[]
  hariIni: string
  rowH: number
  sortKey: string
  sortDir: SortDir
  matrixStyle: MatrixStyle
  onSort: (k: string) => void
  onOpen: (row: Row) => void
  onJump: (proyek: ProjectId, modul: ModuleId) => void
  onSeeAll: () => void
}

export function DashboardEksekutif({
  all,
  projects,
  hariIni,
  rowH,
  sortKey,
  sortDir,
  matrixStyle,
  onSort,
  onOpen,
  onJump,
  onSeeAll,
}: DashboardProps) {
  const terlambat = all.filter(isTerlambat).length
  const tenggat30 = all.filter(
    (r) => r.status !== 'Selesai' && hari(r.tgl) >= 0 && hari(r.tgl) <= 30,
  ).length

  const kpis: Kpi[] = [
    { label: 'Tenggat ≤ 30 hari', nilai: String(tenggat30), sub: 'Tersebar di 4 proyek', warna: C.due },
    { label: 'Item terlambat', nilai: String(terlambat), sub: '3 di antaranya risiko tinggi', warna: C.late },
    {
      label: 'Proyek aktif',
      nilai: String(projects.length),
      sub: projects.length ? `${projects.reduce((s, p) => s + (p.unit || 0), 0)} unit total` : 'belum ada proyek',
      warna: '#111827',
    },
    { label: 'Kas 13 minggu', nilai: 'Rp 24,6 M', sub: 'Cukup sampai minggu ke-11', warna: C.run },
    { label: 'Deviasi initial cost', nilai: '−7,8%', sub: 'Di bawah rencana — sehat', warna: C.done },
    { label: 'Perkara aktif', nilai: '3', sub: '2 mediasi · 1 gugatan perdata', warna: C.late },
  ]

  const totalTenggat = all.filter((r) => hari(r.tgl) >= 0 && hari(r.tgl) <= 90).length

  const perhatian = sortRows(
    all.filter((r) => r.status === 'Diblokir' || isTerlambat(r) || r.status === 'Menunggu Verifikasi'),
    sortKey,
    sortDir,
  ).slice(0, 8)

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
            RINGKASAN EKSEKUTIF
          </div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em', color: '#111827' }}>
            Dashboard Eksekutif
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            Data per {hariIni} · {projects.length} proyek aktif · pembaruan terakhir 12 menit lalu
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton>Ekspor ringkasan</PillButton>
          <PillButton variant="primary">Rapat mingguan →</PillButton>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} dot />
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(430px,1fr))',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <ProjectMatrix rows={all} projects={projects} gaya={matrixStyle} onJump={onJump} />
        <ComplianceCalendar rows={all} total={totalTenggat} />
      </div>

      <div
        style={{
          marginTop: 14,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
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
              Perlu perhatian Anda
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
              Item terlambat, diblokir, dan menunggu verifikasi lintas divisi
            </div>
          </div>
          <PillButton height={32} fontSize={12} padding="0 13px" onClick={onSeeAll}>
            Lihat semua item →
          </PillButton>
        </div>
        <DataTable
          rows={perhatian}
          cols={COLS_RINGKAS}
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
