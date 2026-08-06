import { useState, type CSSProperties } from 'react'
import { A, C } from '@/data/constants'
import type { Project } from '@/data/types'
import { saveProject } from '@/lib/api'

const FASE_OPTS = ['Pra-Akuisisi', 'Akuisisi', 'Perizinan', 'Konstruksi', 'Serah Terima']
const WARNA_OPTS = [
  { label: 'Teal', v: A },
  { label: 'Hijau', v: C.done },
  { label: 'Biru', v: C.run },
  { label: 'Kuning', v: C.due },
  { label: 'Merah', v: C.late },
]

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'proyek'
  )
}

interface NewProjectDialogProps {
  /** id proyek yang sudah ada — untuk mencegah tabrakan slug. */
  existingIds: string[]
  onClose: () => void
  onCreated: (project: Project) => void
}

const label: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: 6,
  display: 'block',
}
const field: CSSProperties = {
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

/** Modal "Proyek baru" — menulis satu baris ke `/api/projects`. */
export function NewProjectDialog({ existingIds, onClose, onCreated }: NewProjectDialogProps) {
  const [nama, setNama] = useState('')
  const [idTouched, setIdTouched] = useState(false)
  const [id, setId] = useState('')
  const [lok, setLok] = useState('')
  const [ha, setHa] = useState('')
  const [unit, setUnit] = useState('')
  const [fase, setFase] = useState(FASE_OPTS[0])
  const [warna, setWarna] = useState(A)
  const [pemda, setPemda] = useState('')
  const [sla, setSla] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // The slug follows the name until the user edits the id field directly.
  const effectiveId = (idTouched ? id : slugify(nama)).trim()

  async function onSave() {
    if (!nama.trim()) {
      setErr('Nama proyek wajib diisi.')
      return
    }
    if (!effectiveId) {
      setErr('Id/slug proyek tidak valid.')
      return
    }
    if (existingIds.includes(effectiveId)) {
      setErr(`Id "${effectiveId}" sudah dipakai proyek lain. Ubah id-nya.`)
      return
    }
    setSaving(true)
    setErr(null)
    const project: Project = {
      id: effectiveId,
      nama: nama.trim(),
      lok: lok.trim(),
      ha: ha.trim(),
      unit: Number(unit) || 0,
      fase,
      warna,
      pemda: pemda.trim(),
      sla: sla.trim(),
    }
    const res = await saveProject(project)
    setSaving(false)
    if (res.ok) {
      onCreated({ ...project, id: res.slug ?? effectiveId })
    } else {
      setErr(res.error ?? 'Gagal menyimpan proyek.')
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17,24,39,0.28)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 80,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 560,
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
        }}
      >
        {/* header */}
        <div
          style={{
            flex: 'none',
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: A }}>
              PROYEK BARU
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Tambah proyek
            </h2>
          </div>
          <button
            type="button"
            className="hc-outline"
            aria-label="Tutup"
            onClick={onClose}
            style={{
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
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>NAMA PROYEK *</label>
              <input
                style={field}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="mis. Harmoni Serpong Fase 2"
                autoFocus
              />
            </div>

            <div>
              <label style={label}>ID / SLUG</label>
              <input
                style={field}
                value={effectiveId}
                onChange={(e) => {
                  setIdTouched(true)
                  setId(slugify(e.target.value))
                }}
                placeholder="otomatis dari nama"
              />
            </div>
            <div>
              <label style={label}>FASE</label>
              <select style={field} value={fase} onChange={(e) => setFase(e.target.value)}>
                {FASE_OPTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>LOKASI</label>
              <input
                style={field}
                value={lok}
                onChange={(e) => setLok(e.target.value)}
                placeholder="mis. Tangerang Selatan"
              />
            </div>
            <div>
              <label style={label}>PEMDA</label>
              <input
                style={field}
                value={pemda}
                onChange={(e) => setPemda(e.target.value)}
                placeholder="mis. Kota Tangerang Selatan"
              />
            </div>

            <div>
              <label style={label}>LUAS (HA)</label>
              <input
                style={field}
                value={ha}
                onChange={(e) => setHa(e.target.value)}
                placeholder="mis. 8,4 Ha"
              />
            </div>
            <div>
              <label style={label}>JUMLAH UNIT</label>
              <input
                style={field}
                type="number"
                min={0}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="0"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>SLA / CATATAN</label>
              <input
                style={field}
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                placeholder="mis. KKPR terbit 1×24 jam"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>WARNA PENANDA</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {WARNA_OPTS.map((w) => (
                  <button
                    key={w.v}
                    type="button"
                    onClick={() => setWarna(w.v)}
                    title={w.label}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: w.v,
                      border: warna === w.v ? '2px solid #111827' : '2px solid transparent',
                      boxShadow: warna === w.v ? '0 0 0 2px #fff inset' : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: '#B91C1C' }}>{err}</div>
          )}
        </div>

        {/* actions */}
        <div
          style={{
            flex: 'none',
            padding: '13px 20px',
            borderTop: '1px solid #E5E7EB',
            background: '#FCFDFD',
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="hc-primary"
            style={{
              height: 38,
              padding: '0 18px',
              border: 0,
              borderRadius: 'var(--radius-pill)',
              background: saving ? '#9DBEC4' : A,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {saving ? 'Menyimpan…' : 'Simpan proyek'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38,
              padding: '0 18px',
              border: '1px solid #E5E7EB',
              borderRadius: 'var(--radius-pill)',
              background: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </>
  )
}
