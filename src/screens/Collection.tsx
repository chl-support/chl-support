import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { A, C, CURRENT_USER } from '@/data/constants'
import { KPR_FASE, KPR_STATUS, PENGIRIM_REMINDER, langkahFase } from '@/data/kpr'
import type { KprBerkas, Project } from '@/data/types'
import {
  deleteKpr,
  deleteKprReport,
  fetchKpr,
  fetchKprReports,
  uploadKprReport,
  type KprRecord,
  type KprReport,
} from '@/lib/api'
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
import { StatusReminder } from '@/components/StatusReminder'

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
  const [reports, setReports] = useState<KprReport[]>([])
  const [reportGagal, setReportGagal] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const [data, rep] = await Promise.all([
      fetchKpr(proyekAktif.id),
      fetchKprReports(proyekAktif.id),
    ])
    if (data) {
      setRows(data)
      setNotice(null)
    } else {
      setRows([])
      setNotice('Backend belum terhubung — hubungkan Neon di Vercel agar berkas KPR bisa disimpan.')
    }
    setReports(rep ?? [])
    // `null` berarti permintaan gagal — dibedakan dari daftar yang memang kosong.
    setReportGagal(rep === null)
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

      <StatusReminder />

      <ReportPanel
        proyek={proyekAktif.id}
        reports={reports}
        gagalMuat={reportGagal}
        onChanged={reload}
      />

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

/** Batas body serverless Vercel — berkas di atas ini ditolak sebelum dikirim. */
const BATAS_UNGGAH = 4_500_000

const fmtSize = (n: number): string =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB'

function fmtWaktu(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Arsip laporan Collection: rekap follow-up/reminder yang diunggah tim menjadi
 * satu tempat penyimpanan per proyek. Berkasnya masuk Vercel Blob (cadangan
 * Neon) dan metadatanya tercatat lengkap dengan periode serta pengunggahnya.
 */
function ReportPanel({
  proyek,
  reports,
  gagalMuat,
  onChanged,
}: {
  proyek: string
  reports: KprReport[]
  gagalMuat: boolean
  onChanged: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [judul, setJudul] = useState('')
  const [periode, setPeriode] = useState('')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sukses, setSukses] = useState<string | null>(null)
  // Arsip terbuka sejak awal supaya berkas yang baru diunggah langsung terlihat.
  const [buka, setBuka] = useState(true)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr(null)
    setSukses(null)
    // Vercel menolak body di atas ~4,5 MB dengan galat yang tidak informatif,
    // jadi berkas kebesaran dihentikan di sini dengan pesan yang jelas.
    if (file.size > BATAS_UNGGAH) {
      setErr(
        `Berkas ${fmtSize(file.size)} melebihi batas ${fmtSize(BATAS_UNGGAH)} per unggahan. ` +
          'Perkecil berkas (mis. simpan sebagai PDF/CSV) atau pecah per periode.',
      )
      return
    }
    setUploading(true)
    const res = await uploadKprReport(proyek, file, {
      judul,
      periode,
      oleh: CURRENT_USER.nama,
    })
    setUploading(false)
    if (res.ok) {
      setJudul('')
      setPeriode('')
      setBuka(true)
      setSukses(`"${res.filename ?? file.name}" tersimpan di arsip report.`)
      onChanged()
    } else {
      setErr(res.error ?? 'Upload gagal.')
    }
  }

  async function onHapus(r: KprReport) {
    if (!window.confirm(`Hapus report "${r.judul || r.filename}"?`)) return
    const res = await deleteKprReport(r.id)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Gagal menghapus report.')
  }

  const isian: CSSProperties = {
    height: 34,
    padding: '0 11px',
    border: '1px solid #E5E7EB',
    borderRadius: 9,
    outline: 0,
    fontFamily: 'inherit',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#111827',
    background: '#fff',
    boxSizing: 'border-box',
  }

  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>
            Report follow-up &amp; reminder
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
            Arsip rekap yang diunggah tim · {reports.length} berkas · pengirim reminder{' '}
            {PENGIRIM_REMINDER.email} · WA {PENGIRIM_REMINDER.whatsapp}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setBuka(!buka)}
          style={{
            height: 30,
            padding: '0 13px',
            border: '1px solid #E5E7EB',
            borderRadius: 'var(--radius-pill)',
            background: '#fff',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            color: '#6B7280',
            cursor: 'pointer',
          }}
        >
          {buka ? 'Sembunyikan arsip' : `Lihat arsip (${reports.length})`}
        </button>
        <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="hc-primary"
          style={{
            height: 34,
            padding: '0 16px',
            border: 0,
            borderRadius: 'var(--radius-pill)',
            background: uploading ? '#9DBEC4' : A,
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {uploading ? 'Mengunggah…' : '+ Upload report'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 11, flexWrap: 'wrap' }}>
        <input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul report (mis. Rekap follow-up dokumen KPR)"
          style={{ ...isian, flex: '1 1 260px' }}
        />
        <input
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          placeholder="Periode (mis. Agustus 2026 / minggu ke-2)"
          style={{ ...isian, flex: '1 1 200px' }}
        />
      </div>
      {err && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: C.late }}>{err}</div>
      )}
      {sukses && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: C.done }}>{sukses}</div>
      )}
      {gagalMuat && (
        <div
          style={{
            marginTop: 10,
            padding: '9px 12px',
            borderRadius: 9,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            fontSize: 11.5,
            fontWeight: 600,
            color: '#92400E',
          }}
        >
          Daftar report gagal dimuat — arsip di bawah mungkin tidak lengkap. Periksa koneksi
          database (Neon) di Vercel, lalu muat ulang halaman.
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
        Maksimal {fmtSize(BATAS_UNGGAH)} per berkas (batas body serverless Vercel). Isi judul dan
        periode sebelum memilih berkas — keduanya ikut tersimpan.
      </div>

      {buka && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reports.length === 0 && (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
              Belum ada report terunggah untuk proyek ini.
            </div>
          )}
          {reports.map((r) => (
            <div
              key={r.id}
              className="hc-attach"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 11px',
                border: '1px solid #E5E7EB',
                borderRadius: 9,
              }}
            >
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
              >
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#111827' }}>
                  {r.judul || r.filename}
                  {r.periode && (
                    <span style={{ color: '#9CA3AF', fontWeight: 600 }}> · {r.periode}</span>
                  )}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                  {r.filename} · {fmtSize(r.size)} · {fmtWaktu(r.uploadedAt)}
                  {r.oleh && ` · ${r.oleh}`}
                </span>
              </a>
              <button
                type="button"
                onClick={() => onHapus(r)}
                style={{
                  flex: 'none',
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
