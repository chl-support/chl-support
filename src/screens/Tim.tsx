import { useEffect, useState, type CSSProperties } from 'react'
import { A } from '@/data/constants'
import type { Personel } from '@/data/types'
import { deleteTim, fetchTim, saveTim, type TimRecord } from '@/lib/api'

const EMPTY: Personel = { jabatan: '', nama: '', kontak: '', catatan: '' }

const label: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: 6,
  display: 'block',
}
const input: CSSProperties = {
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
const th: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
}
const td: CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid #F1F3F5',
  verticalAlign: 'top',
}

export function Tim() {
  const [rows, setRows] = useState<TimRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<Personel | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const data = await fetchTim()
    if (data) {
      setRows(data)
      setNotice(null)
    } else {
      setRows([])
      setNotice('Database belum terhubung — hubungkan Neon di Vercel untuk menyimpan & memuat data tim.')
    }
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function onSave() {
    if (!form) return
    if (!form.jabatan.trim() || !form.nama.trim()) {
      setFormErr('Jabatan dan nama wajib diisi.')
      return
    }
    setSaving(true)
    setFormErr(null)
    const res = await saveTim(form)
    setSaving(false)
    if (res.ok) {
      setForm(null)
      reload()
    } else {
      setFormErr(res.error ?? 'Gagal menyimpan.')
    }
  }

  async function onDelete(row: TimRecord) {
    if (!window.confirm(`Hapus "${row.jabatan} — ${row.nama}"?`)) return
    const res = await deleteTim(row.id)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus.')
  }

  const set = (patch: Partial<Personel>) => setForm((f) => ({ ...(f ?? EMPTY), ...patch }))

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: '#9CA3AF' }}>
            DATA
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Tim
          </h1>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            Direktori jabatan & penanggung jawab. Tersimpan di database.
          </div>
        </div>
        {!form && (
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="hc-primary"
            style={{
              height: 38,
              padding: '0 16px',
              border: 0,
              borderRadius: 'var(--radius-pill)',
              background: A,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              flex: 'none',
            }}
          >
            + Tambah
          </button>
        )}
      </div>

      {notice && (
        <div
          style={{
            marginTop: 16,
            padding: '11px 14px',
            borderRadius: 10,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#92400E',
          }}
        >
          {notice}
        </div>
      )}

      {/* form tambah/edit */}
      {form && (
        <div
          style={{
            marginTop: 16,
            padding: 18,
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
            {form.id ? 'Ubah data' : 'Tambah data baru'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>JABATAN / DIVISI *</label>
              <input
                style={input}
                value={form.jabatan}
                onChange={(e) => set({ jabatan: e.target.value })}
                placeholder="mis. Legal"
              />
            </div>
            <div>
              <label style={label}>NAMA *</label>
              <input
                style={input}
                value={form.nama}
                onChange={(e) => set({ nama: e.target.value })}
                placeholder="mis. Willy Susanto S.H., M.Kn"
              />
            </div>
            <div>
              <label style={label}>KONTAK</label>
              <input
                style={input}
                value={form.kontak}
                onChange={(e) => set({ kontak: e.target.value })}
                placeholder="telp / email (opsional)"
              />
            </div>
            <div>
              <label style={label}>CATATAN</label>
              <input
                style={input}
                value={form.catatan}
                onChange={(e) => set({ catatan: e.target.value })}
                placeholder="opsional"
              />
            </div>
          </div>
          {formErr && (
            <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: '#B91C1C' }}>{formErr}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="hc-primary"
              style={{
                height: 36,
                padding: '0 16px',
                border: 0,
                borderRadius: 'var(--radius-pill)',
                background: saving ? '#9DBEC4' : A,
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(null)
                setFormErr(null)
              }}
              style={{
                height: 36,
                padding: '0 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 'var(--radius-pill)',
                background: '#fff',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* tabel */}
      <div
        style={{
          marginTop: 16,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr>
                <th style={th}>JABATAN / DIVISI</th>
                <th style={th}>NAMA</th>
                <th style={th}>KONTAK</th>
                <th style={th}>CATATAN</th>
                <th style={{ ...th, textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={5}>
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={5}>
                    Belum ada data. Klik “+ Tambah” untuk menambahkan.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="hc-attach">
                    <td style={{ ...td, fontWeight: 700 }}>{r.jabatan}</td>
                    <td style={td}>{r.nama}</td>
                    <td style={{ ...td, color: r.kontak ? '#111827' : '#C4C9D0' }}>{r.kontak || '—'}</td>
                    <td style={{ ...td, color: r.catatan ? '#111827' : '#C4C9D0' }}>{r.catatan || '—'}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => setForm({ ...r })}
                        style={{
                          height: 30,
                          padding: '0 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: 'var(--radius-pill)',
                          background: '#fff',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 700,
                          color: A,
                          cursor: 'pointer',
                          marginRight: 6,
                        }}
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        style={{
                          height: 30,
                          padding: '0 12px',
                          border: '1px solid #FECACA',
                          borderRadius: 'var(--radius-pill)',
                          background: '#fff',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#B91C1C',
                          cursor: 'pointer',
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
