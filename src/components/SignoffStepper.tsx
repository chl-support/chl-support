import { useState, type CSSProperties } from 'react'
import { A, C } from '@/data/constants'
import { DIVISI, DIVISI_PERAN, SIGNOFF_WARNA } from '@/data/divisi'
import type { AuditDoc, SignoffStatus, SignoffStep } from '@/data/types'
import { addSignoff, deleteSignoff, updateSignoff } from '@/lib/api'
import { stepAktif, stepTerkunci, stepTuntas, tenggatMeta, urutkan } from '@/lib/signoff'

interface SignoffStepperProps {
  doc: AuditDoc
  /** Muat ulang daftar dokumen setelah alur berubah. */
  onChanged: () => void
}

const label: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: 5,
  display: 'block',
}
const input: CSSProperties = {
  width: '100%',
  height: 32,
  padding: '0 10px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 0,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#111827',
  background: '#fff',
  boxSizing: 'border-box',
}

function badge(warna: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 21,
    padding: '0 9px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 10.5,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '16',
  }
}

function aksi(warna: string, solid = false): CSSProperties {
  return {
    height: 30,
    padding: '0 13px',
    border: solid ? 0 : '1px solid ' + warna + '55',
    borderRadius: 'var(--radius-pill)',
    background: solid ? warna : '#fff',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 700,
    color: solid ? '#fff' : warna,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }
}

function fmtWaktu(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Lingkaran nomor langkah — dicentang saat sudah ditandatangani. */
function Bulatan({ n, status, aktif }: { n: number; status: SignoffStatus; aktif: boolean }) {
  const warna = SIGNOFF_WARNA[status]
  const isi = status === 'Ditandatangani' || status === 'Revisi'
  return (
    <div
      style={{
        width: 26,
        height: 26,
        flex: 'none',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11.5,
        fontWeight: 800,
        color: isi ? '#fff' : warna,
        background: isi ? warna : warna + '1A',
        border: aktif ? '2px solid ' + warna : '2px solid transparent',
        boxShadow: aktif ? '0 0 0 3px ' + warna + '1F' : 'none',
      }}
    >
      {status === 'Ditandatangani' ? '✓' : status === 'Revisi' ? '!' : n}
    </div>
  )
}

/**
 * Alur tanda tangan satu dokumen: satu baris per divisi, dikerjakan berurutan.
 * Hanya langkah aktif (langkah tuntas pertama yang belum selesai) yang bisa
 * ditindaklanjuti — sama seperti gerbang prasyarat pada bagan perizinan.
 */
export function SignoffStepper({ doc, onChanged }: SignoffStepperProps) {
  const alur = urutkan(doc.alur ?? [])
  const aktif = stepAktif(alur)
  const [busy, setBusy] = useState<number | null>(null)
  const [pic, setPic] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tambah, setTambah] = useState(false)
  const [divisiBaru, setDivisiBaru] = useState<string>(DIVISI[0])
  const [tenggatBaru, setTenggatBaru] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function ubah(step: SignoffStep, status: SignoffStatus) {
    if (status === 'Revisi' && !catatan.trim()) {
      setErr('Tulis alasan revisi agar pengunggah tahu apa yang harus diperbaiki.')
      return
    }
    setBusy(step.id)
    setErr(null)
    const res = await updateSignoff(step.id, {
      status,
      // Isian PIC/catatan hanya menimpa bila diisi pada langkah aktif.
      ...(pic.trim() ? { pic: pic.trim() } : {}),
      ...(catatan.trim() ? { catatan: catatan.trim() } : {}),
    })
    setBusy(null)
    if (!res.ok) {
      setErr(res.error ?? 'Gagal memperbarui langkah.')
      return
    }
    setPic('')
    setCatatan('')
    onChanged()
  }

  async function batalkan(step: SignoffStep) {
    setBusy(step.id)
    const res = await updateSignoff(step.id, { status: 'Menunggu', catatan: '' })
    setBusy(null)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Gagal membatalkan tanda tangan.')
  }

  async function hapus(step: SignoffStep) {
    if (!window.confirm(`Hapus langkah "${step.divisi}" dari alur dokumen ini?`)) return
    setBusy(step.id)
    const res = await deleteSignoff(step.id)
    setBusy(null)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Gagal menghapus langkah.')
  }

  async function tambahLangkah() {
    const divisi = divisiBaru.trim()
    if (!divisi) {
      setErr('Pilih atau tulis nama divisi.')
      return
    }
    setBusy(-1)
    const res = await addSignoff(doc.id, { divisi, tenggat: tenggatBaru || undefined })
    setBusy(null)
    if (!res.ok) {
      setErr(res.error ?? 'Gagal menambah langkah.')
      return
    }
    setTambah(false)
    setTenggatBaru('')
    onChanged()
  }

  return (
    <div style={{ padding: '4px 2px 2px' }}>
      {alur.length === 0 && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', marginBottom: 10 }}>
          Dokumen ini belum punya alur tanda tangan. Tambahkan divisi di bawah untuk mulai
          memonitor siapa yang harus menandatangani dan urutannya.
        </div>
      )}

      {alur.map((s, i) => {
        const terkunci = stepTerkunci(alur, s)
        const isAktif = aktif?.id === s.id
        const meta = tenggatMeta(s)
        const warna = SIGNOFF_WARNA[s.status]
        const sedang = busy === s.id

        return (
          <div key={s.id} style={{ display: 'flex', gap: 12, opacity: terkunci ? 0.55 : 1 }}>
            {/* rel vertikal + bulatan */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Bulatan n={i + 1} status={s.status} aktif={isAktif} />
              {i < alur.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 18,
                    background: stepTuntas(s) ? C.done + '66' : '#E5E7EB',
                  }}
                />
              )}
            </div>

            {/* kartu langkah */}
            <div
              style={{
                flex: 1,
                marginBottom: 10,
                padding: '10px 12px',
                border: '1px solid ' + (isAktif ? warna + '44' : '#E5E7EB'),
                borderRadius: 10,
                background: isAktif ? warna + '08' : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{s.divisi}</div>
                <span style={badge(warna)}>{s.status}</span>
                {meta.chip && <span style={badge(meta.warna)}>{meta.chip}</span>}
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => hapus(s)}
                  title="Hapus langkah ini"
                  style={{
                    border: 0,
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Hapus
                </button>
              </div>

              <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
                {DIVISI_PERAN[s.divisi] ?? 'Pemeriksaan & tanda tangan divisi terkait'}
                {s.tenggat && ` · tenggat ${meta.txt}`}
              </div>

              {(s.pic || s.signedAt) && (
                <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: '#111827' }}>
                  {s.pic || '—'}
                  {s.signedAt && (
                    <span style={{ color: '#9CA3AF', fontWeight: 600 }}>
                      {' '}
                      · ditandatangani {fmtWaktu(s.signedAt)}
                    </span>
                  )}
                </div>
              )}

              {s.catatan && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '7px 10px',
                    borderRadius: 8,
                    background: s.status === 'Revisi' ? '#FEF2F2' : '#F7F8FA',
                    fontSize: 12,
                    fontWeight: 600,
                    color: s.status === 'Revisi' ? '#B91C1C' : '#4B5563',
                  }}
                >
                  {s.catatan}
                </div>
              )}

              {terkunci && (
                <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: '#9CA3AF' }}>
                  Menunggu divisi sebelumnya menandatangani.
                </div>
              )}

              {/* isian + aksi hanya pada langkah aktif */}
              {isAktif && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label style={label}>PENANDA TANGAN</label>
                      <input
                        value={pic}
                        onChange={(e) => setPic(e.target.value)}
                        placeholder={s.pic || 'Nama pejabat divisi'}
                        style={input}
                      />
                    </div>
                    <div style={{ flex: 2, minWidth: 200 }}>
                      <label style={label}>CATATAN / ALASAN REVISI</label>
                      <input
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="mis. lampiran RAB belum terbaru"
                        style={input}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={sedang}
                      onClick={() => ubah(s, 'Ditandatangani')}
                      style={{ ...aksi(A, true), cursor: sedang ? 'wait' : 'pointer' }}
                    >
                      {sedang ? 'Menyimpan…' : '✓ Tanda tangani'}
                    </button>
                    {s.status !== 'Diproses' && (
                      <button
                        type="button"
                        disabled={sedang}
                        onClick={() => ubah(s, 'Diproses')}
                        style={aksi(C.run)}
                      >
                        Mulai diproses
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={sedang}
                      onClick={() => ubah(s, 'Revisi')}
                      style={aksi(C.late)}
                    >
                      Minta revisi
                    </button>
                    <button
                      type="button"
                      disabled={sedang}
                      onClick={() => ubah(s, 'Dilewati')}
                      style={aksi('#9CA3AF')}
                    >
                      Lewati
                    </button>
                  </div>
                </div>
              )}

              {stepTuntas(s) && (
                <button
                  type="button"
                  disabled={sedang}
                  onClick={() => batalkan(s)}
                  style={{ ...aksi('#9CA3AF'), marginTop: 9, height: 27 }}
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        )
      })}

      {err && (
        <div style={{ margin: '2px 0 10px', fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
          {err}
        </div>
      )}

      {/* tambah divisi di ujung alur */}
      {tambah ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={label}>DIVISI</label>
            <input
              list="divisi-audit"
              value={divisiBaru}
              onChange={(e) => setDivisiBaru(e.target.value)}
              placeholder="Pilih atau tulis divisi"
              style={input}
            />
            <datalist id="divisi-audit">
              {DIVISI.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={label}>TENGGAT (OPSIONAL)</label>
            <input
              type="date"
              value={tenggatBaru}
              onChange={(e) => setTenggatBaru(e.target.value)}
              style={input}
            />
          </div>
          <button
            type="button"
            disabled={busy === -1}
            onClick={tambahLangkah}
            style={{ ...aksi(A, true), height: 32 }}
          >
            {busy === -1 ? 'Menambah…' : 'Tambah langkah'}
          </button>
          <button
            type="button"
            onClick={() => setTambah(false)}
            style={{ ...aksi('#9CA3AF'), height: 32 }}
          >
            Batal
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setTambah(true)} style={{ ...aksi(A), height: 30 }}>
          + Tambah divisi ke alur
        </button>
      )}
    </div>
  )
}
