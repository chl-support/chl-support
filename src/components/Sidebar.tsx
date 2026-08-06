import { A, NAV_GROUPS } from '@/data/constants'
import type { NavId } from '@/data/types'

interface SidebarProps {
  nav: NavId
  collapsed: boolean
  /** Count of blocked/overdue items per module, badged on the matching nav item. */
  counts: Partial<Record<string, number>>
  onNav: (id: NavId) => void
  onToggle: () => void
}

export function Sidebar({ nav, collapsed, counts, onNav, onToggle }: SidebarProps) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        flex: 'none',
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 220ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid #E5E7EB',
          flex: 'none',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            flex: 'none',
            borderRadius: 8,
            background: 'linear-gradient(150deg,#0F5C6B,#12808f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '-0.02em',
          }}
        >
          H
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Harmoni
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#9CA3AF',
                fontWeight: 600,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              COMMAND CENTER
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px 20px' }}>
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.label || gi} style={{ marginBottom: 14 }}>
            {!!g.label && !collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: '#9CA3AF',
                  padding: '6px 10px',
                }}
              >
                {g.label}
              </div>
            )}
            {g.items.map((n) => {
              const active = nav === n.id
              const count = counts[n.id] ?? 0
              return (
                <button
                  key={n.id}
                  type="button"
                  className={'hc-nav-item' + (active ? ' is-active' : '')}
                  onClick={() => onNav(n.id)}
                  title={n.label}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    height: 34,
                    padding: '0 10px',
                    marginBottom: 1,
                    border: 0,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 600,
                    background: active ? A : 'transparent',
                    color: active ? '#fff' : '#6B7280',
                    transition: 'background 160ms',
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flex: 'none' }}
                  >
                    <path d={n.icon} />
                  </svg>
                  {!collapsed && (
                    <span
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {n.label}
                    </span>
                  )}
                  {count > 0 && !collapsed && (
                    <span
                      style={{
                        minWidth: 19,
                        height: 18,
                        padding: '0 5px',
                        borderRadius: 'var(--radius-pill)',
                        background: active ? 'rgba(255,255,255,0.22)' : '#FEE2E2',
                        color: active ? '#fff' : '#B91C1C',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ flex: 'none', borderTop: '1px solid #E5E7EB', padding: 10 }}>
        <button
          type="button"
          className="hc-nav-item"
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            border: 0,
            background: 'transparent',
            borderRadius: 8,
            color: '#6B7280',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: 'none' }}
          >
            <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4M9 3v18" />
          </svg>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Ciutkan menu</span>}
        </button>
      </div>
    </aside>
  )
}
