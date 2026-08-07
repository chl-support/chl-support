import { PermitStages } from '@/components/PermitStages'
import type { Project } from '@/data/types'
import type { PermitRecord } from '@/lib/api'

interface LicenseProps {
  proyekAktif: Project
  permits: PermitRecord[]
  loading: boolean
  notice: string | null
  onChanged: () => void
}

export function LicenseDocumentation({ proyekAktif, permits, loading, notice, onChanged }: LicenseProps) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#0F5C6B',
            marginBottom: 5,
          }}
        >
          DIVISI SUPPORT CHL · DOCUMENT &amp; LICENSE
        </div>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Perizinan {proyekAktif.nama}
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          PEMDA {proyekAktif.pemda || '—'}
          {proyekAktif.sla ? ` · ${proyekAktif.sla}` : ''} · fase proyek: {proyekAktif.fase || '—'}
        </p>
      </div>

      <PermitStages
        proyek={proyekAktif.id}
        permits={permits}
        loading={loading}
        notice={notice}
        onChanged={onChanged}
      />
    </div>
  )
}
