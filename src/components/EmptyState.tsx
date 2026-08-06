/** Empty state shown inside a DataTable when the active filter matches nothing. */
export function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '52px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-sm)',
          background: '#F1F3F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Tidak ada item pada filter ini
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280' }}>
        Ubah filter status, ganti horizon, atau buat item baru.
      </div>
    </div>
  )
}
