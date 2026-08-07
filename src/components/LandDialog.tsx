import { useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import { LAND_JALUR, hasilDari } from '@/data/lands'
import type { ItemStatus, Land } from '@/data/types'
import { saveLand } from '@/lib/api'

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

interface LandDialogProps {
  proyek: string
  /** Jalur awal saat menambah dari sebuah kartu jalur. */
  defaultJenis: string
  /** Diisi saat mengubah bidang yang sudah ada. */
  initial?: Land
  onClose: () => void
  onSaved: () => void
}

/** Modal tambah/ubah satu bidang tanah — menulis ke `/api/lands`. */
export function LandDialog({ proyek, defaultJenis, initial, onClose, onSaved }: LandDialogProps) {
  const [kode, setKode] = useState(initial?.kode ?? '')
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [pemilik, setPemilik] = useState(initial?.pemilik ?? '')
  const [luas, setLuas] = useState(initial?.luas ? String(initial.luas) : '')
  const [jenis, setJenis] = useState(initial?.jenis ?? defaultJenis)
  const [noDok, setNoDok] = useState(initial?.noDok ?? '')
  const [status, setStatus] = useState<ItemStatus>((initial?.status as ItemStatus) ?? 'Belum Dimulai')
  const [tgl, setTgl] = useState(initial?.tgl ?? '')
  const [pic, setPic] = useState(initial?.pic ?? '')
  const [catatan, setCatatan] = useState(initial?.catatan ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave() {
    if (!nama.trim()) {
      setErr('Nama / letak bidang wajib diisi.')
      return
    }
    setSaving(true)
    setErr(null)
    const res = await saveLand({
      id: initial?.id,
      proyek,
      kode: kode.trim(),
      nama: nama.trim(),
      pemilik: pemilik.trim(),
      luas: Number(luas) || 0,
      jenis,
      noDok: noDok.trim(),
      status,
      tgl,
      pic: pic.trim(),
      catatan: catatan.trim(),
    })
    setSaving(false)
    if (res.ok) onSaved()
    else setErr(res.error ?? 'Gagal menyimpan bidang tanah.')
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
          width: 580,
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
              {initial ? 'UBAH BIDANG TANAH' : 'BIDANG TANAH BARU'}
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {initial ? initial.nama : 'Tambah bidang tanah'}
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
              <label style={label}>NAMA / LETAK BIDANG *</label>
              <input
                style={field}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="mis. Persil Blok C1, Desa Sukamaju"
                autoFocus
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>JALUR SERTIFIKASI *</label>
              <select style={field} value={jenis} onChange={(e) => setJenis(e.target.value)}>
                {LAND_JALUR.map((j) => (
                  <option key={j.jenis} value={j.jenis}>
                    {j.tahap} · {j.jenis} → {j.hasil}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
                Hasil akhir yang dikejar: <strong>{hasilDari(jenis)}</strong>
              </div>
            </div>

            <div>
              <label style={label}>KODE BIDANG</label>
              <input
                style={field}
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="mis. BID-01"
              />
            </div>
            <div>
              <label style={label}>LUAS (M²)</label>
              <input
                style={field}
                type="number"
                min="0"
                value={luas}
                onChange={(e) => setLuas(e.target.value)}
                placeholder="mis. 1250"
              />
            </div>

            <div>
              <label style={label}>PEMILIK / ATAS NAMA</label>
              <input
                style={field}
                value={pemilik}
                onChange={(e) => setPemilik(e.target.value)}
                placeholder="pemilik asal atau konsumen"
              />
            </div>
            <div>
              <label style={label}>NO. GIRIK / SERTIFIKAT</label>
              <input
                style={field}
                value={noDok}
                onChange={(e) => setNoDok(e.target.value)}
                placeholder="mis. SHGB 1234"
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

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>PIC</label>
              <input
                style={field}
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="penanggung jawab"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>CATATAN</label>
              <input
                style={field}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="mis. menunggu pengukuran ulang BPN"
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
            {saving ? 'Menyimpan…' : 'Simpan bidang'}
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
