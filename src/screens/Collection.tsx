import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { A, C } from '@/data/constants'
import { KPR_FASE, KPR_STATUS, langkahFase } from '@/data/kpr'
import type { KprBerkas, Project } from '@/data/types'
import { deleteKpr, fetchKpr, type KprRecord } from '@/lib/api'
import { fmtTgl, rp } from '@/lib/format'
import {
  corongPipeline,
  kpiCollection,
  labelTahap,
  statusDokumen,
  statusFollowup,
  statusSp3k,
} from '@/lib/followup'
import { FollowupPanel } from '@/components/FollowupPanel'
import { KprDialog } from '@/components/KprDialog'

interface CollectionProps {
  proyekAktif: Project
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
  padding: '11px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid #F1F3F5',
  verticalAlign: 'middle',
}

function badge(warna: string, tebal = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 21,
    padding: '0 9px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 10.5,
    fontWeight: tebal ? 800 : 700,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '16',
  }
}

const STATUS_WARNA: Record<string, string> = {
  Berjalan: C.run,
  Tertahan: C.due,
  'Ditolak Bank': C.late,
  Selesai: C.done,
  Batal: C.idle,
}

function Kpi({ nilai, judul, warna }: { nilai: string; judul: string; warna: string }) {
  return (
    <div
      style={{
        flex: '1 1 130px',
        minWidth: 130,
        padding: '12px 14px',
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', color: warna }}>
        {nilai}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{judul}</div>
    </div>
  )
}

const FILTER = ['Semua', 'Perlu follow-up', 'Dokumen kurang', 'SP3K kritis', ...KPR_STATUS] as const
type Filter = (typeof FILTER)[number]

/**
 * Menu Collection — pipeline KPR dari booking fee sampai monitoring angsuran,
 * dengan monitoring kelengkapan dokumen dan follow-up bertingkat untuk customer
 * yang melewati tenggat yang disepakati.
 */
export function Collection({ proyekAktif }: CollectionProps) {
  const [rows, setRows] = useState<KprRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ initial?: KprBerkas } | null>(null)
  const [buka, setBuka] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('Semua')

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchKpr(proyekAktif.id)
    if (data) {
      setRows(data)
      setNotice(null)
    } else {
      setRows([])
      setNotice('Backend belum terhubung — hubungkan Neon di Vercel agar berkas KPR bisa disimpan.')
    }
    setLoading(false)
  }, [proyekAktif.id])

  useEffect(() => {
    reload()
  }, [reload])

  const kpi = useMemo(() => kpiCollection(rows), [rows])
  const corong = useMemo(() => corongPipeline(rows), [rows])

  const tampil = useMemo(
    () =>
      rows.filter((b) => {
        if (filter === 'Semua') return true
        if (filter === 'Perlu follow-up') return statusFollowup(b).tertunggak
        if (filter === 'Dokumen kurang') return !statusDokumen(b).lengkap && b.status !== 'Batal'
        if (filter === 'SP3K kritis') {
          const s = statusSp3k(b)
          return s.ada && !!s.chip && s.sisa <= 14
        }
        return b.status === filter
      }),
    [rows, filter],
  )

  async function onHapus(b: KprRecord) {
    if (!window.confirm(`Hapus berkas "${b.nama}" beserta checklist & riwayat follow-up-nya?`))
      return
    const res = await deleteKpr(b.id)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus berkas.')
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: A, marginBottom: 5 }}>
          LINTAS FUNGSI · COLLECTION
        </div>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Pipeline KPR {proyekAktif.nama}
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          Dari booking fee sampai monitoring angsuran — kelengkapan dokumen dikawal, customer yang
          lewat tenggat difollow-up bertingkat.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Kpi nilai={String(kpi.berkas)} judul="Berkas KPR" warna="#111827" />
        <Kpi nilai={String(kpi.dokumenKurang)} judul="Dokumen belum lengkap" warna={C.due} />
        <Kpi nilai={String(kpi.perluFollowup)} judul="Perlu follow-up hari ini" warna={C.late} />
        <Kpi nilai={String(kpi.sp3kKritis)} judul="SP3K mendekati kedaluwarsa" warna={C.late} />
        <Kpi nilai={String(kpi.akadSiap)} judul="Menuju akad" warna={C.run} />
        <Kpi nilai={String(kpi.ditolak)} judul="Ditolak bank" warna={C.late} />
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 16,
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

      {/* corong pipeline dua tahap */}
      <div
        style={{
          padding: 16,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 16,
        }}
      >
        {KPR_FASE.map((fase, i) => (
          <div key={fase} style={{ marginBottom: i === 0 ? 14 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  flex: 'none',
                  borderRadius: '50%',
                  background: A,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '-0.01em' }}>
                Tahap {i + 1}: {fase}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {langkahFase(fase).map((l) => {
                const n = corong.find((c) => c.id === l.id)?.n ?? 0
                return (
                  <div
                    key={l.id}
                    title={l.ket + (l.cabang ? ` · Percabangan: ${l.cabang.pertanyaan}` : '')}
                    style={{
                      flex: '1 1 150px',
                      minWidth: 150,
                      padding: '9px 11px',
                      border: '1px solid ' + (n ? A + '40' : '#E5E7EB'),
                      borderRadius: 10,
                      background: n ? A + '08' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF' }}>{l.no}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                        {l.label}
                      </span>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: n ? A : '#D1D5DB' }}>
                        {n}
                      </span>
                    </div>
                    {l.cabang && (
                      <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: C.due }}>
                        ⑂ {l.cabang.pertanyaan}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* filter + tambah */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTER.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              height: 30,
              padding: '0 13px',
              border: '1px solid ' + (filter === f ? A : '#E5E7EB'),
              borderRadius: 'var(--radius-pill)',
              background: filter === f ? A : '#fff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              color: filter === f ? '#fff' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setDialog({})}
          className="hc-primary"
          style={{
            height: 34,
            padding: '0 16px',
            border: 0,
            borderRadius: 'var(--radius-pill)',
            background: A,
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          + Berkas KPR
        </button>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ ...th, minWidth: 210 }}>CUSTOMER</th>
                <th style={th}>TAHAP</th>
                <th style={th}>DOKUMEN</th>
                <th style={th}>TENGGAT</th>
                <th style={th}>FOLLOW-UP</th>
                <th style={th}>SP3K</th>
                <th style={{ ...th, textAlign: 'right' }}>NILAI</th>
                <th style={{ ...th, textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={8}>
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading && tampil.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#9CA3AF' }} colSpan={8}>
                    {rows.length === 0
                      ? 'Belum ada berkas KPR. Tambahkan customer pertama di atas — checklist lima dokumen wajib dibuat otomatis.'
                      : 'Tidak ada berkas pada filter ini.'}
                  </td>
                </tr>
              )}
              {!loading &&
                tampil.map((b) => {
                  const terbuka = buka === b.id
                  const dok = statusDokumen(b)
                  const fu = statusFollowup(b)
                  const sp3k = statusSp3k(b)
                  const warna = STATUS_WARNA[b.status] ?? C.idle
                  return [
                    <tr
                      key={b.id}
                      className="hc-attach"
                      onClick={() => setBuka(terbuka ? null : b.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ ...td, fontWeight: 700, minWidth: 210 }}>
                        <span style={{ color: '#9CA3AF', marginRight: 7, fontSize: 11 }}>
                          {terbuka ? '▾' : '▸'}
                        </span>
                        {b.nama}
                        <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
                          {b.unit || 'unit —'}
                          {b.bank && ` · ${b.bank}`}
                          {b.pic && ` · PIC ${b.pic}`}
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{labelTahap(b.tahap)}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={badge(warna)}>{b.status}</span>
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 70,
                              height: 5,
                              borderRadius: 3,
                              background: '#EEF0F3',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: Math.round(dok.rasio * 100) + '%',
                                height: '100%',
                                background: dok.lengkap ? C.done : C.due,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#6B7280' }}>
                            {dok.diterima}/{dok.total}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: b.tenggatDokumen ? '#111827' : '#9CA3AF' }}>
                        {b.tenggatDokumen ? fmtTgl(b.tenggatDokumen) : '—'}
                      </td>
                      <td style={td}>
                        {fu.perlu ? (
                          <span style={badge(fu.warna, fu.tertunggak)}>{fu.label}</span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                      <td style={td}>
                        {sp3k.chip ? (
                          <span style={badge(sp3k.warna, true)}>{sp3k.chip}</span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {b.nilai ? rp(b.nilai) : '—'}
                      </td>
                      <td
                        style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setDialog({ initial: b })}
                          style={{
                            height: 28,
                            padding: '0 11px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 'var(--radius-pill)',
                            background: '#fff',
                            fontFamily: 'inherit',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: A,
                            cursor: 'pointer',
                            marginRight: 5,
                          }}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => onHapus(b)}
                          style={{
                            height: 28,
                            padding: '0 11px',
                            border: '1px solid #FECACA',
                            borderRadius: 'var(--radius-pill)',
                            background: '#fff',
                            fontFamily: 'inherit',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#B91C1C',
                            cursor: 'pointer',
                          }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>,
                    terbuka && (
                      <tr key={b.id + '-detail'}>
                        <td
                          colSpan={8}
                          style={{
                            padding: '16px 18px 18px',
                            background: '#FAFBFC',
                            borderBottom: '1px solid #F1F3F5',
                          }}
                        >
                          <FollowupPanel
                            berkas={b}
                            proyekNama={proyekAktif.nama}
                            onChanged={reload}
                          />
                        </td>
                      </tr>
                    ),
                  ]
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
        Follow-up dijadwalkan sendiri dari tenggat yang disepakati: pengingat H-3, lalu H+1, H+4,
        dan eskalasi H+7. Pesannya disusun otomatis berisi dokumen yang masih kurang; pengiriman
        WhatsApp dibuka satu klik lewat wa.me dan setiap kontak tercatat sebagai riwayat.
      </div>

      {dialog && (
        <KprDialog
          proyek={proyekAktif.id}
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
