interface BlockerBannerProps {
  judul: string
  pesan: string
  onOpen: () => void
}

/** Red gate banner shown when a blocking prerequisite is unmet. */
export function BlockerBanner({ judul, pesan, onOpen }: BlockerBannerProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 10,
        padding: '13px 15px',
        marginBottom: 14,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ flex: 'none', marginTop: 1 }}
      >
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', marginBottom: 3 }}>
          Kendala aktif — {judul}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#B91C1C' }}>{pesan}</div>
      </div>
      <button
        type="button"
        className="hc-blocker-btn"
        onClick={onOpen}
        style={{
          height: 30,
          padding: '0 12px',
          border: '1px solid #FCA5A5',
          background: '#fff',
          borderRadius: 'var(--radius-pill)',
          fontSize: 11.5,
          fontWeight: 700,
          color: '#B91C1C',
          cursor: 'pointer',
          flex: 'none',
          fontFamily: 'inherit',
        }}
      >
        Lihat kendala
      </button>
    </div>
  )
}
