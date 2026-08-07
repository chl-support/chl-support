import { useState, type CSSProperties } from 'react'
import { A, CURRENT_USER } from '@/data/constants'
import { ACTION_BUKTI, CORP_ACTION, CORP_EVENT, EVENT_KET } from '@/data/corporate'
import type { Corporate, ItemStatus } from '@/data/types'
import { saveCorporate } from '@/lib/api'
import { rp } from '@/lib/format'

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

interface CorporateDialogProps {
  proyek: string
  /** Event awal saat menambah dari kolom event tertentu. */
  defaultEvent: string
  /** Diisi saat mengubah agenda yang sudah ada. */
  initial?: Corporate
  onClose: () => void
  onSaved: () => void
}

/** Modal tambah/ubah satu agenda korporasi — menulis ke `/api/corporate`. */
export function CorporateDialog({
  proyek,
  defaultEvent,
  initial,
  onClose,
  onSaved,
}: CorporateDialogProps) {
  const [event, setEvent] = useState(initial?.event ?? defaultEvent)
  const [action, setAction] = useState(initial?.action ?? CORP_ACTION[0])
  const [judul, setJudul] = useState(initial?.judul ?? '')
  const [tgl, setTgl] = useState(initial?.tgl ?? '')
  const [pic, setPic] = useState(initial?.pic ?? '')
  const [nilai, setNilai] = useState(initial?.nilai ? String(initial.nilai) : '')
  const [kendala, setKendala] = useState(initial?.kendala ?? '')
  const [status, setStatus] = useState<ItemStatus>((initial?.status as ItemStatus) ?? 'Belum Dimulai')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave() {
    setSaving(true)
    setErr(null)
    const res = await saveCorporate({
      id: initial?.id,
      proyek,
      event,
      action,
      judul: judul.trim(),
      tgl,
      pic: pic.trim(),
      nilai: Number(nilai) || 0,
      kendala: kendala.trim(),
      status,
      aktor: CURRENT_USER.nama,
    })
    setSaving(false)
    if (res.ok) onSaved()
    else setErr(res.error ?? 'Gagal menyimpan agenda.')
  }

  const nilaiAngka = Number(nilai) || 0

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
          width: 600,
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
              {initial ? 'UBAH AGENDA KORPORASI' : 'AGENDA KORPORASI BARU'}
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {initial ? initial.action : 'Tambah agenda'}
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
            <div>
              <label style={label}>EVENT *</label>
              <select style={field} value={event} onChange={(e) => setEvent(e.target.value)}>
                {CORP_EVENT.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>ACTION *</label>
              <select style={field} value={action} onChange={(e) => setAction(e.target.value)}>
                {CORP_ACTION.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: -4 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
                {EVENT_KET[event]}
              </div>
              <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
                Bukti yang biasanya dilampirkan: <strong>{ACTION_BUKTI[action]}</strong>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>JUDUL / KETERANGAN</label>
              <input
                style={field}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="mis. RUPST 2026 — pengangkatan direktur operasional"
                autoFocus
              />
            </div>

            <div>
              <label style={label}>TANGGAL</label>
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

            <div>
              <label style={label}>NILAI (RP)</label>
              <input
                style={field}
                type="number"
                min="0"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="0 bila tidak relevan"
              />
              {nilaiAngka > 0 && (
                <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 700, color: '#6B7280' }}>
                  {rp(nilaiAngka)}
                </div>
              )}
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

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>KENDALA</label>
              <input
                style={field}
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                placeholder="mis. menunggu tanda tangan pemegang saham minoritas"
              />
              <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
                Kendala di bagan Corporate — apa yang menahan agenda ini, bukan ketergantungan
                pada izin di bagan lain. Perubahannya tercatat di jejak audit.
              </div>
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
            {saving ? 'Menyimpan…' : 'Simpan agenda'}
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
