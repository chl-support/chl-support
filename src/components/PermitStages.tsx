import { useState, type CSSProperties } from 'react'
import { A, C, ST } from '@/data/constants'
import { PERMIT_FASE, PERMIT_TEMPLATE, type Fase } from '@/data/permits'
import type { Permit } from '@/data/types'
import { deletePermit, savePermit, type PermitRecord } from '@/lib/api'
import { deadlineMeta } from '@/lib/rows'
import { PermitDialog } from './PermitDialog'

interface PermitStagesProps {
  proyek: string
  permits: PermitRecord[]
  loading: boolean
  notice: string | null
  /** Muat ulang daftar izin setelah perubahan. */
  onChanged: () => void
}

const faseHint: Record<Fase, string> = {
  'Pra-Akuisisi': 'Kelayakan & kesesuaian ruang sebelum tanah dikuasai.',
  Akuisisi: 'Penguasaan tanah & pengamanan hak (KKPR → SHGB).',
  Konstruksi: 'Izin teknis & lingkungan sampai PBG terbit.',
  'Serah Terima': 'Laik fungsi, pemecahan sertifikat, penyerahan PSU.',
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: 12,
}

export function PermitStages({ proyek, permits, loading, notice, onChanged }: PermitStagesProps) {
  const [dialog, setDialog] = useState<{ fase: string; initial?: Permit } | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const byFase = (f: string) => permits.filter((p) => p.fase === f)

  /** Adds every template permit whose kode is not already present for this project. */
  async function seedTemplate() {
    setSeeding(true)
    const existing = new Set(permits.map((p) => (p.kode || '').toUpperCase()))
    for (const fase of PERMIT_FASE) {
      for (const t of PERMIT_TEMPLATE[fase]) {
        if (existing.has(t.kode.toUpperCase())) continue
        await savePermit({
          proyek,
          fase,
          kode: t.kode,
          nama: t.nama,
          prasyarat: t.prasyarat,
          status: 'Belum Dimulai',
          tgl: '',
        })
        existing.add(t.kode.toUpperCase())
      }
    }
    setSeeding(false)
    onChanged()
  }

  async function onDelete(p: PermitRecord) {
    if (!window.confirm(`Hapus izin "${p.kode || p.nama}"?`)) return
    setBusyId(p.id)
    const res = await deletePermit(p.id)
    setBusyId(null)
    if (res.ok) onChanged()
    else window.alert(res.error ?? 'Gagal menghapus izin.')
  }

  return (
    <div>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>Bagan perizinan bertahap</div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF' }}>
          {permits.filter((p) => p.status === 'Selesai').length} selesai · {permits.length} izin
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={seedTemplate}
          disabled={seeding}
          style={{
            height: 34,
            padding: '0 14px',
            border: '1px solid #E5E7EB',
            borderRadius: 'var(--radius-pill)',
            background: '#fff',
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            color: A,
            cursor: seeding ? 'wait' : 'pointer',
          }}
        >
          {seeding ? 'Menambahkan…' : 'Buat checklist perizinan'}
        </button>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 14,
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

      {/* four phase columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
          gap: 12,
          alignItems: 'start',
        }}
      >
        {PERMIT_FASE.map((fase, fi) => {
          const list = byFase(fase)
          const selesai = list.filter((p) => p.status === 'Selesai').length
          const pct = list.length ? Math.round((selesai / list.length) * 100) : 0
          return (
            <div
              key={fase}
              style={{
                background: '#F7F8FA',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* phase header */}
              <div>
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
                    {fi + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{fase}</span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginTop: 4, lineHeight: 1.4 }}>
                  {faseHint[fase]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.done : A }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>
                    {selesai}/{list.length}
                  </span>
                </div>
              </div>

              {/* permit cards */}
              {loading && list.length === 0 && (
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9CA3AF', padding: '6px 2px' }}>Memuat…</div>
              )}
              {!loading &&
                list.map((p) => {
                  const dm = deadlineMeta(p.status, p.tgl)
                  const warna = ST[p.status] ?? C.idle
                  return (
                    <div key={p.id} style={card}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: A }}>{p.kode || '—'}</span>
                            {p.prasyarat && p.prasyarat !== '—' && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#9CA3AF' }}>
                                ← {p.prasyarat}
                              </span>
                            )}
                          </span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: '#111827',
                              marginTop: 2,
                              lineHeight: 1.3,
                            }}
                          >
                            {p.nama}
                          </span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            height: 20,
                            padding: '0 8px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 10,
                            fontWeight: 800,
                            color: warna,
                            background: warna + '18',
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: warna }} />
                          {p.status}
                        </span>
                        {p.tgl && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: dm.warna }}>{dm.chip}</span>
                        )}
                        <div style={{ flex: 1 }} />
                        <button
                          type="button"
                          onClick={() => setDialog({ fase, initial: p })}
                          title="Ubah"
                          style={iconBtn}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={busyId === p.id}
                          title="Hapus"
                          style={{ ...iconBtn, color: '#B91C1C', borderColor: '#FECACA' }}
                        >
                          {busyId === p.id ? '…' : 'Hapus'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              {!loading && list.length === 0 && (
                <div style={{ fontSize: 11, fontWeight: 600, color: '#B6BBC3', padding: '2px 2px 4px' }}>
                  Belum ada izin di fase ini.
                </div>
              )}

              {/* add */}
              <button
                type="button"
                onClick={() => setDialog({ fase })}
                style={{
                  height: 34,
                  border: '1px dashed #CBD5D8',
                  borderRadius: 9,
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 700,
                  color: A,
                  cursor: 'pointer',
                }}
              >
                + Tambah izin
              </button>
            </div>
          )
        })}
      </div>

      {dialog && (
        <PermitDialog
          proyek={proyek}
          defaultFase={dialog.fase}
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            onChanged()
          }}
        />
      )}
    </div>
  )
}

const iconBtn: CSSProperties = {
  height: 26,
  padding: '0 10px',
  border: '1px solid #E5E7EB',
  borderRadius: 'var(--radius-pill)',
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: 11,
  fontWeight: 700,
  color: '#0F5C6B',
  cursor: 'pointer',
}
