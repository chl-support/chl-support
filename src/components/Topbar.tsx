import { CURRENT_USER } from '@/data/constants'
import type { Project, ProjectId } from '@/data/types'

interface TopbarProps {
  proyekAktif: Project | undefined
  projects: Project[]
  menuOpen: boolean
  query: string
  onToggleMenu: () => void
  onPickProyek: (id: ProjectId) => void
  onAddProject: () => void
  onQuery: (q: string) => void
}

export function Topbar({
  proyekAktif,
  projects,
  menuOpen,
  query,
  onToggleMenu,
  onPickProyek,
  onAddProject,
  onQuery,
}: TopbarProps) {
  return (
    <header
      style={{
        height: 56,
        flex: 'none',
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        position: 'relative',
        zIndex: 30,
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="hc-outline"
          onClick={onToggleMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            height: 36,
            padding: '0 12px',
            border: '1px solid #E5E7EB',
            background: '#fff',
            borderRadius: 9,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: '50%', background: proyekAktif?.warna ?? '#9CA3AF' }}
          />
          <span>{proyekAktif?.nama ?? 'Belum ada proyek'}</span>
          <span style={{ fontWeight: 600, color: '#9CA3AF', fontSize: 12 }}>{proyekAktif?.fase ?? ''}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 44,
              left: 0,
              width: 330,
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
              animation: 'hcFadeUp 180ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {projects.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
                Belum ada proyek.
              </div>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hc-menu-item"
                onClick={() => onPickProyek(p.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  border: 0,
                  borderRadius: 9,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: p.id === proyekAktif?.id ? '#F0F6F7' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    flex: 'none',
                    background: p.warna,
                  }}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {p.nama}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
                    {p.lok} · {p.ha} · {p.unit} unit
                  </span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{p.fase}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #EEF0F3', marginTop: 6, paddingTop: 6 }}>
              <button
                type="button"
                className="hc-menu-item"
                onClick={onAddProject}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  border: 0,
                  borderRadius: 9,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: '#0F5C6B',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    flex: 'none',
                    borderRadius: 6,
                    background: '#0F5C6B14',
                    color: '#0F5C6B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                Proyek baru
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 34,
          padding: '0 12px',
          border: '1px solid #E5E7EB',
          background: '#fff',
          borderRadius: 'var(--radius-pill)',
          width: 260,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari item, dokumen, PIC…"
          style={{
            border: 0,
            outline: 0,
            flex: 1,
            minWidth: 0,
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#111827',
            background: 'transparent',
          }}
        />
      </div>

      <button
        type="button"
        className="hc-outline"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          border: '1px solid #E5E7EB',
          background: '#fff',
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 17,
            height: 17,
            padding: '0 4px',
            borderRadius: 'var(--radius-pill)',
            background: '#DC2626',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}
        >
          {CURRENT_USER.notifikasi}
        </span>
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          paddingLeft: 12,
          borderLeft: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#0F5C6B',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {CURRENT_USER.inisial}
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{CURRENT_USER.nama}</div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>{CURRENT_USER.jabatan}</div>
        </div>
      </div>
    </header>
  )
}
