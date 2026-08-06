import { useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import { PERMIT_FASE } from '@/data/permits'
import type { ItemStatus, Permit } from '@/data/types'

const STATUS_OPTS: ItemStatus[] = [
  'Belum Dimulai',
  'Berjalan',
  'Menunggu Pihak Ketiga',
  'Menunggu Verifikasi',
  'Selesai',
  'Diblokir',
  'Dibatalkan',
]

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

interface PermitDialogProps {
  proyek: string
  /** Fase awal saat menambah dari sebuah kolom fase. */
  defaultFase: string
  /** Diisi saat mengubah izin yang sudah ada. */
  initial?: Permit
  onClose: () => void
  onSaved: () => void
}

/** Modal tambah/ubah satu izin — menulis ke `/api/permits`. */
export function PermitDialog({ proyek, defaultFase, initial, onClose, onSaved }: PermitDialogProps) {
  const [kode, setKode] = useState(initial?.kode ?? '')
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [fase, setFase] = useState(initial?.fase ?? defaultFase)
  const [prasyarat, setPrasyarat] = useState(initial?.prasyarat ?? '—')
  const [status, setStatus] = useState<ItemStatus>((initial?.status as ItemStatus) ?? 'Belum Dimulai')
  const [tgl, setTgl] = useState(initial?.tgl ?? '')
  const [pic, setPic] = useState(initial?.pic ?? '')
  const [verif, setVerif] = useState(initial?.verif ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave() {
    if (!nama.trim()) {
      setErr('Nama izin wajib diisi.')
      return
    }
    setSaving(true)
    setErr(null)
    const { savePermit } = await import('@/lib/api')
    const res = await savePermit({
      id: initial?.id,
      proyek,
      fase,
      kode: kode.trim(),
      nama: nama.trim(),
      prasyarat: prasyarat.trim() || '—',
      status,
      tgl,
      pic: pic.trim(),
      verif: verif.trim(),
      dok: initial?.dok ?? 0,
    })
    setSaving(false)
    if (res.ok) onSaved()
    else setErr(res.error ?? 'Gagal menyimpan izin.')
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
          zIndex: 82,
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
          zIndex: 83,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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
              {initial ? 'UBAH IZIN' : 'IZIN BARU'}
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {initial ? initial.nama : 'Tambah izin'}
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

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>NAMA IZIN *</label>
              <input
                style={field}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="mis. Persetujuan Bangunan Gedung"
                autoFocus
              />
            </div>

            <div>
              <label style={label}>KODE</label>
              <input
                style={field}
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="mis. PBG"
              />
            </div>
            <div>
              <label style={label}>FASE</label>
              <select style={field} value={fase} onChange={(e) => setFase(e.target.value)}>
                {PERMIT_FASE.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>PRASYARAT</label>
              <input
                style={field}
                value={prasyarat}
                onChange={(e) => setPrasyarat(e.target.value)}
                placeholder="kode izin prasyarat atau —"
              />
            </div>
            <div>
              <label style={label}>STATUS</label>
              <select
                style={field}
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
              >
                {STATUS_OPTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>TARGET</label>
              <input style={field} type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
            </div>
            <div>
              <label style={label}>PIC</label>
              <input
                style={field}
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="penanggung jawab"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>VERIFIKATOR</label>
              <input
                style={field}
                value={verif}
                onChange={(e) => setVerif(e.target.value)}
                placeholder="pemverifikasi"
              />
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: '#B91C1C' }}>{err}</div>
          )}
        </div>

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
            {saving ? 'Menyimpan…' : 'Simpan izin'}
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
