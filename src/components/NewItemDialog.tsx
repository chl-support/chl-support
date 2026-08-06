import { useState, type CSSProperties } from 'react'
import { A, MODUL } from '@/data/constants'
import { PROYEK } from '@/data/projects'
import type {
  Horizon,
  Item,
  ItemStatus,
  ModuleId,
  ProjectId,
  Risiko,
} from '@/data/types'
import { saveItem } from '@/lib/api'

const STATUS_OPTS: ItemStatus[] = [
  'Belum Dimulai',
  'Berjalan',
  'Menunggu Pihak Ketiga',
  'Menunggu Verifikasi',
  'Selesai',
  'Diblokir',
  'Dibatalkan',
]
const RISIKO_OPTS: Risiko[] = ['Rendah', 'Sedang', 'Tinggi']
const HORIZON_OPTS: Horizon[] = ['Pendek', 'Panjang']

interface NewItemDialogProps {
  /** Konteks layar aktif — dipakai sebagai nilai awal form. */
  defaultProyek: ProjectId
  defaultModul: ModuleId
  defaultHorizon: Horizon
  onClose: () => void
  /** Dipanggil dengan item lengkap (sudah punya id dari DB) setelah tersimpan. */
  onCreated: (item: Item) => void
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

/**
 * Modal "Item baru" — menulis satu baris ke `/api/items`. Nilai awal mengikuti
 * proyek/modul/horizon layar yang sedang dibuka, sehingga item langsung tampil
 * di tabel setelah dibuat.
 */
export function NewItemDialog({
  defaultProyek,
  defaultModul,
  defaultHorizon,
  onClose,
  onCreated,
}: NewItemDialogProps) {
  const [judul, setJudul] = useState('')
  const [modul, setModul] = useState<ModuleId>(defaultModul)
  const [proyek, setProyek] = useState<ProjectId>(defaultProyek)
  const [horizon, setHorizon] = useState<Horizon>(defaultHorizon)
  const [status, setStatus] = useState<ItemStatus>('Belum Dimulai')
  const [pic, setPic] = useState('')
  const [verif, setVerif] = useState('')
  const [tgl, setTgl] = useState('')
  const [nilai, setNilai] = useState('')
  const [risiko, setRisiko] = useState<Risiko>('Rendah')
  const [blockReason, setBlockReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave() {
    if (!judul.trim()) {
      setErr('Judul wajib diisi.')
      return
    }
    if (!tgl) {
      setErr('Tanggal target wajib diisi.')
      return
    }
    setSaving(true)
    setErr(null)
    const item: Item = {
      judul: judul.trim(),
      modul,
      proyek,
      horizon,
      status,
      pic: pic.trim(),
      verif: verif.trim(),
      tgl,
      nilai: Number(nilai) || 0,
      risiko,
      dok: 0,
      blockReason: status === 'Diblokir' ? blockReason.trim() || null : null,
    }
    const res = await saveItem(item)
    setSaving(false)
    if (res.ok) {
      onCreated({ ...item, id: res.id })
    } else {
      setErr(res.error ?? 'Gagal menyimpan.')
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
              ITEM BARU
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Tambah item proyek
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
              <label style={label}>JUDUL *</label>
              <input
                style={field}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="mis. Pengurusan PBG tahap 2"
                autoFocus
              />
            </div>

            <div>
              <label style={label}>MODUL</label>
              <select style={field} value={modul} onChange={(e) => setModul(e.target.value as ModuleId)}>
                {MODUL.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>PROYEK</label>
              <select style={field} value={proyek} onChange={(e) => setProyek(e.target.value as ProjectId)}>
                {PROYEK.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>HORIZON</label>
              <select
                style={field}
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as Horizon)}
              >
                {HORIZON_OPTS.map((h) => (
                  <option key={h} value={h}>
                    Jangka {h}
                  </option>
                ))}
              </select>
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
              <label style={label}>PIC</label>
              <input
                style={field}
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="penanggung jawab"
              />
            </div>
            <div>
              <label style={label}>VERIFIKATOR</label>
              <input
                style={field}
                value={verif}
                onChange={(e) => setVerif(e.target.value)}
                placeholder="pemverifikasi"
              />
            </div>

            <div>
              <label style={label}>TARGET *</label>
              <input style={field} type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
            </div>
            <div>
              <label style={label}>NILAI (Rp)</label>
              <input
                style={field}
                type="number"
                min={0}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label style={label}>RISIKO</label>
              <select style={field} value={risiko} onChange={(e) => setRisiko(e.target.value as Risiko)}>
                {RISIKO_OPTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {status === 'Diblokir' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>ALASAN DIBLOKIR</label>
                <input
                  style={field}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="mis. menunggu siteplan definitif"
                />
              </div>
            )}
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
            {saving ? 'Menyimpan…' : 'Simpan item'}
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
