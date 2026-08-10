import { useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import { KPR_LANGKAH, KPR_STATUS, SP3K_BERLAKU_DEFAULT, STATUS_KET } from '@/data/kpr'
import type { KprBerkas } from '@/data/types'
import { saveKpr } from '@/lib/api'
import { rp } from '@/lib/format'

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

interface KprDialogProps {
  proyek: string
  initial?: KprBerkas
  onClose: () => void
  onSaved: () => void
}

/** Modal tambah/ubah satu berkas KPR — menulis ke `/api/collection`. */
export function KprDialog({ proyek, initial, onClose, onSaved }: KprDialogProps) {
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [telepon, setTelepon] = useState(initial?.telepon ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [tahap, setTahap] = useState(initial?.tahap ?? 'booking')
  const [status, setStatus] = useState(initial?.status ?? 'Berjalan')
  const [bank, setBank] = useState(initial?.bank ?? '')
  const [nilai, setNilai] = useState(initial?.nilai ? String(initial.nilai) : '')
  const [bookingTgl, setBookingTgl] = useState(initial?.bookingTgl ?? '')
  const [tenggat, setTenggat] = useState(initial?.tenggatDokumen ?? '')
  const [sp3kTgl, setSp3kTgl] = useState(initial?.sp3kTgl ?? '')
  const [sp3kBerlaku, setSp3kBerlaku] = useState(
    String(initial?.sp3kBerlaku || SP3K_BERLAKU_DEFAULT),
  )
  const [akadTgl, setAkadTgl] = useState(initial?.akadTgl ?? '')
  const [pic, setPic] = useState(initial?.pic ?? '')
  const [catatan, setCatatan] = useState(initial?.catatan ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave() {
    if (!nama.trim()) {
      setErr('Nama customer wajib diisi.')
      return
    }
    setSaving(true)
    setErr(null)
    const res = await saveKpr({
      id: initial?.id,
      proyek,
      nama: nama.trim(),
      unit: unit.trim(),
      telepon: telepon.trim(),
      email: email.trim(),
      tahap,
      status,
      bank: bank.trim(),
      nilai: Number(nilai) || 0,
      bookingTgl,
      tenggatDokumen: tenggat,
      sp3kTgl,
      sp3kBerlaku: Number(sp3kBerlaku) || SP3K_BERLAKU_DEFAULT,
      akadTgl,
      pic: pic.trim(),
      catatan: catatan.trim(),
    })
    setSaving(false)
    if (res.ok) onSaved()
    else setErr(res.error ?? 'Gagal menyimpan berkas.')
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
          width: 620,
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
              {initial ? 'UBAH BERKAS KPR' : 'BERKAS KPR BARU'}
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {initial ? initial.nama : 'Tambah berkas customer'}
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
              <label style={label}>NAMA CUSTOMER *</label>
              <input
                style={field}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="mis. Budi Santoso"
                autoFocus
              />
            </div>
            <div>
              <label style={label}>UNIT / KAVLING</label>
              <input
                style={field}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mis. Blok C1 No. 12"
              />
            </div>

            <div>
              <label style={label}>TELEPON / WHATSAPP</label>
              <input
                style={field}
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="mis. 0812xxxxxxx"
              />
            </div>
            <div>
              <label style={label}>EMAIL</label>
              <input
                style={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opsional"
              />
            </div>

            <div>
              <label style={label}>TAHAP</label>
              <select style={field} value={tahap} onChange={(e) => setTahap(e.target.value)}>
                {KPR_LANGKAH.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.no}. {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>STATUS</label>
              <select style={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                {KPR_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
                {STATUS_KET[status]}
              </div>
            </div>

            <div>
              <label style={label}>TANGGAL BOOKING FEE</label>
              <input
                style={field}
                type="date"
                value={bookingTgl}
                onChange={(e) => setBookingTgl(e.target.value)}
              />
            </div>
            <div>
              <label style={label}>TENGGAT DOKUMEN (DISEPAKATI) </label>
              <input
                style={field}
                type="date"
                value={tenggat}
                onChange={(e) => setTenggat(e.target.value)}
              />
              <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
                Dasar penjadwalan follow-up otomatis.
              </div>
            </div>

            <div>
              <label style={label}>BANK</label>
              <input
                style={field}
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="mis. BTN / BCA / Mandiri"
              />
            </div>
            <div>
              <label style={label}>NILAI KPR (RP)</label>
              <input
                style={field}
                type="number"
                min="0"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="0 bila belum ditentukan"
              />
              {nilaiAngka > 0 && (
                <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 700, color: '#6B7280' }}>
                  {rp(nilaiAngka)}
                </div>
              )}
            </div>

            <div>
              <label style={label}>TANGGAL SP3K TERBIT</label>
              <input
                style={field}
                type="date"
                value={sp3kTgl}
                onChange={(e) => setSp3kTgl(e.target.value)}
              />
            </div>
            <div>
              <label style={label}>MASA BERLAKU SP3K (HARI)</label>
              <input
                style={field}
                type="number"
                min="1"
                value={sp3kBerlaku}
                onChange={(e) => setSp3kBerlaku(e.target.value)}
                placeholder="30"
              />
            </div>

            <div>
              <label style={label}>JADWAL / TANGGAL AKAD</label>
              <input
                style={field}
                type="date"
                value={akadTgl}
                onChange={(e) => setAkadTgl(e.target.value)}
              />
            </div>
            <div>
              <label style={label}>PIC COLLECTION</label>
              <input
                style={field}
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="petugas penagih"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>CATATAN</label>
              <input
                style={field}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="mis. DP dicicil 3x, jatuh tempo tiap tanggal 10"
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
            {saving ? 'Menyimpan…' : 'Simpan berkas'}
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
