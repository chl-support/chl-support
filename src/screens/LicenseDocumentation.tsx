import { DataTable } from '@/components/DataTable'
import { DependencyChain } from '@/components/DependencyChain'
import { PillButton } from '@/components/PillButton'
import type { Project } from '@/data/types'
import { COLS_IZIN } from '@/lib/columns'
import { permitSummary } from '@/lib/permits'
import type { Row, SortDir } from '@/lib/rows'

interface LicenseProps {
  proyekAktif: Project
  rows: Row[]
  rowH: number
  densityLabel: string
  sortKey: string
  sortDir: SortDir
  checklistDibuat: boolean
  onBuatChecklist: () => void
  onToggleDensity: () => void
  onSort: (k: string) => void
  onOpen: (row: Row) => void
  onSelectChain: () => void
}

export function LicenseDocumentation({
  proyekAktif,
  rows,
  rowH,
  densityLabel,
  sortKey,
  sortDir,
  checklistDibuat,
  onBuatChecklist,
  onToggleDensity,
  onSort,
  onOpen,
  onSelectChain,
}: LicenseProps) {
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
            BAGAN · LICENSE &amp; DOCUMENTATION
          </div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Perizinan {proyekAktif.nama}
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            PEMDA {proyekAktif.pemda} · {proyekAktif.sla}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton>Bandingkan PEMDA</PillButton>
          <PillButton variant="primary" onClick={onBuatChecklist}>
            Buat checklist perizinan
          </PillButton>
        </div>
      </div>

      {checklistDibuat && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 10,
            padding: '11px 15px',
            marginBottom: 14,
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534' }}>
            Checklist 11 izin untuk PEMDA {proyekAktif.pemda} dibuat. PIC &amp; verifikator terisi
            otomatis dari template divisi.
          </span>
        </div>
      )}

      <DependencyChain onSelect={onSelectChain} />

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>Daftar izin</div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF' }}>{permitSummary()}</span>
          <div style={{ flex: 1 }} />
          <PillButton
            variant="outline-muted"
            height={30}
            fontSize={11.5}
            padding="0 12px"
            onClick={onToggleDensity}
          >
            {densityLabel}
          </PillButton>
        </div>

        <DataTable
          rows={rows}
          cols={COLS_IZIN}
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
