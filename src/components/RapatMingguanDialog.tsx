import { useMemo, useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import type { Project } from '@/data/types'
import { beritaAcaraDocHtml, downloadWordDoc, printHtml, type BeritaAcaraFields } from '@/lib/docs'
import type { Row } from '@/lib/rows'
import { buildSummary } from '@/lib/summary'

interface Props {
  rows: Row[]
  projects: Project[]
  hariIni: string
  onClose: () => void
}

const AGENDA = [
  { t: 'Pembukaan', d: 'Tinjau tindak lanjut rapat sebelumnya.' },
  { t: 'Ringkasan status', d: 'Indikator utama & status tiap proyek.' },
  { t: 'Item mendesak', d: 'Bahas item terlambat, diblokir, menunggu verifikasi.' },
  { t: 'Progres perizinan', d: 'Perizinan per fase: Pra-Akuisisi → Serah Terima.' },
  { t: 'Keputusan', d: 'Tetapkan keputusan, PIC, dan target tindak lanjut.' },
  { t: 'Penutup', d: 'Jadwal rapat berikutnya.' },
]

export function RapatMingguanDialog({ rows, projects, hariIni, onClose }: Props) {
  const s = useMemo(() => buildSummary(rows, projects), [rows, projects])
  const [f, setF] = useState<BeritaAcaraFields>({
    nomor: '',
    hariTanggal: hariIni,
    waktu: '09.00 WIB',
    tempat: 'Ruang Rapat Kantor Pusat',
    pimpinan: '',
    notulen: '',
    peserta: '',
    keputusan: '',
  })
  const set = (patch: Partial<BeritaAcaraFields>) => setF((p) => ({ ...p, ...patch }))

  function onDoc() {
    downloadWordDoc(
      `berita-acara-rapat-${hariIni.replace(/\s+/g, '-')}.doc`,
      'Berita Acara Rapat Mingguan',
      beritaAcaraDocHtml(f, s, hariIni),
    )
  }
  function onPrint() {
    printHtml('Berita Acara Rapat Mingguan', beritaAcaraDocHtml(f, s, hariIni))
  }

  return (
    <>
      <div onClick={onClose} style={overlay} />
      <div role="dialog" aria-modal="true" style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: A }}>RAPAT MINGGUAN</div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Agenda &amp; Berita Acara
            </h2>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>
              {hariIni} · {s.projects.length} proyek · {s.attention.length} item perlu perhatian
            </div>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} style={closeBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* agenda bagan */}
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>Bagan agenda rapat</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
              gap: 10,
              marginBottom: 20,
            }}
          >
            {AGENDA.map((a, i) => (
              <div key={a.t} style={{ background: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      flex: 'none',
                      borderRadius: 6,
                      background: A,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>{a.t}</span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#6B7280', marginTop: 6, lineHeight: 1.4 }}>
                  {a.d}
                </div>
              </div>
            ))}
          </div>

          {/* berita acara fields */}
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>
            Berita Acara (template profesional)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="NOMOR BERITA ACARA" value={f.nomor} onChange={(v) => set({ nomor: v })} placeholder="mis. 012/BA-RM/VIII/2026" />
            <Field label="HARI / TANGGAL" value={f.hariTanggal} onChange={(v) => set({ hariTanggal: v })} />
            <Field label="WAKTU" value={f.waktu} onChange={(v) => set({ waktu: v })} />
            <Field label="TEMPAT" value={f.tempat} onChange={(v) => set({ tempat: v })} />
            <Field label="PIMPINAN RAPAT" value={f.pimpinan} onChange={(v) => set({ pimpinan: v })} placeholder="nama & jabatan" />
            <Field label="NOTULEN" value={f.notulen} onChange={(v) => set({ notulen: v })} placeholder="nama & jabatan" />
            <Area label="PESERTA (satu per baris)" value={f.peserta} onChange={(v) => set({ peserta: v })} placeholder={'Willy Susanto — Head Legal\nYudi Sugiharto — License'} />
            <Area label="KEPUTUSAN (satu per baris)" value={f.keputusan} onChange={(v) => set({ keputusan: v })} placeholder={'Percepat pengurusan PBG tahap 1\nEskalasi bidang sengketa ke Head Legal'} />
          </div>

          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 600, color: '#9CA3AF', lineHeight: 1.5 }}>
            Ringkasan status, daftar item perlu perhatian, dan tindak lanjut (PIC &amp; target) terisi otomatis
            dari data proyek saat dokumen dibuat.
          </div>
        </div>

        <div style={footer}>
          <button type="button" onClick={onDoc} className="hc-primary" style={primaryBtn}>
            Unduh Berita Acara (.doc)
          </button>
          <button type="button" onClick={onPrint} style={outlineBtn}>
            Cetak / PDF
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={outlineBtn}>
            Tutup
          </button>
        </div>
      </div>
    </>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input style={inp} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <label style={lbl}>{label}</label>
      <textarea
        style={{ ...inp, height: 72, padding: '9px 12px', resize: 'vertical' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

const lbl: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: 6,
  display: 'block',
}
const inp: CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 9,
  outline: 0,
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  background: '#fff',
  boxSizing: 'border-box',
}
const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.28)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  zIndex: 80,
}
const modal: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 760,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 64px)',
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 14,
  boxShadow: 'var(--shadow-lg)',
  zIndex: 81,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}
const header: CSSProperties = {
  flex: 'none',
  padding: '16px 20px',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const footer: CSSProperties = {
  flex: 'none',
  padding: '13px 20px',
  borderTop: '1px solid #E5E7EB',
  background: '#FCFDFD',
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}
const closeBtn: CSSProperties = {
  width: 30,
  height: 30,
  flex: 'none',
  border: '1px solid #E5E7EB',
  background: '#fff',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}
const primaryBtn: CSSProperties = {
  height: 38,
  padding: '0 18px',
  border: 0,
  borderRadius: 'var(--radius-pill)',
  background: A,
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
}
const outlineBtn: CSSProperties = {
  height: 38,
  padding: '0 16px',
  border: '1px solid #E5E7EB',
  borderRadius: 'var(--radius-pill)',
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  cursor: 'pointer',
}
