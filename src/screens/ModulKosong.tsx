import { PillButton } from '@/components/PillButton'

/** Placeholder for the P2 modules that reuse the existing table and flow. */
export function ModulKosong({ judul, onBack }: { judul: string; onBack: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '110px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#EEF2F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0F5C6B"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h18M3 12h18M3 17h10" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
        {judul}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#6B7280',
          maxWidth: 420,
          textWrap: 'pretty',
        }}
      >
        Modul ini masuk gelombang P2. Struktur tabel dan alur verifikasinya identik dengan modul lain,
        jadi tidak ada komponen baru yang perlu dirancang.
      </div>
      <div style={{ marginTop: 18 }}>
        <PillButton onClick={onBack}>Kembali ke dashboard</PillButton>
      </div>
    </div>
  )
}
