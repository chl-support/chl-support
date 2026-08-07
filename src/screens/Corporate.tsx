import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { A, C, CURRENT_USER, ST } from '@/data/constants'
import { ACTION_BUKTI, CORP_ACTION, CORP_EVENT, EVENT_KET } from '@/data/corporate'
import type { Corporate, ItemStatus, Project } from '@/data/types'
import {
  deleteCorpDoc,
  deleteCorporate,
  fetchCorporates,
  uploadCorpDoc,
  type CorporateRecord,
} from '@/lib/api'
import { fmtTgl, rp } from '@/lib/format'
import { deadlineMeta } from '@/lib/rows'
import { CommentThread } from '@/components/CommentThread'
import { CorporateDialog } from '@/components/CorporateDialog'

interface CorporateProps {
  proyekAktif: Project
}

const fmtSize = (n: number): string =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB'

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
const seksi: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.07em',
  color: '#9CA3AF',
  marginBottom: 9,
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

function Kpi({ nilai, judul, warna }: { nilai: string; judul: string; warna: string }) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        minWidth: 140,
        padding: '12px 14px',
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          // Nilai rupiah penuh jauh lebih panjang dari angka cacah — kecilkan
          // agar tidak menabrak tepi kartu.
          fontSize: nilai.length > 12 ? 15 : 21,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: warna,
        }}
      >
        {nilai}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{judul}</div>
    </div>
  )
}

/**
 * Bagan Corporate — agenda RUPS dan aksi korporasi per proyek.
 *
 * Tiap baris membawa event, action, tanggal, PIC, nilai, lampiran bukti,
 * kendala, dan jejak auditnya. "Kendala" menggantikan kolom ketergantungan:
 * yang dicatat adalah hambatan di bagan Corporate sendiri, bukan rantai izin
 * dari bagan Document & License.
 */
export function Corporate({ proyekAktif }: CorporateProps) {
  const [rows, setRows] = useState<CorporateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ event: string; initial?: Corporate } | null>(null)
  const [buka, setBuka] = useState<number | null>(null)
  const [filterEvent, setFilterEvent] = useState<string>('Semua')
  const [filterAction, setFilterAction] = useState<string>('Semua')

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchCorporates(proyekAktif.id)
    if (data) {
      setRows(data)
      setNotice(null)
    } else {
      setRows([])
      setNotice('Backend belum terhubung — hubungkan Neon di Vercel agar agenda korporasi bisa disimpan.')
    }
    setLoading(false)
  }, [proyekAktif.id])

  useEffect(() => {
    reload()
  }, [reload])

  const kpi = useMemo(() => {
    const terlambat = rows.filter(
      (r) =>
        r.tgl &&
        r.status !== 'Selesai' &&
        deadlineMeta(r.status as ItemStatus, r.tgl).chip.startsWith('Terlambat'),
    )
    return {
      agenda: rows.length,
      rupst: rows.filter((r) => r.event === 'RUPST').length,
      selesai: rows.filter((r) => r.status === 'Selesai').length,
      kendala: rows.filter((r) => r.kendala.trim()).length,
      terlambat: terlambat.length,
      nilai: rows.reduce((s, r) => s + (r.nilai || 0), 0),
    }
  }, [rows])

  const tampil = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filterEvent === 'Semua' || r.event === filterEvent) &&
          (filterAction === 'Semua' || r.action === filterAction),
      ),
    [rows, filterEvent, filterAction],
  )

  async function onHapus(r: CorporateRecord) {
    if (!window.confirm(`Hapus agenda "${r.judul || r.action}" beserta lampiran & jejak auditnya?`))
      return
    const res = await deleteCorporate(r.id)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus agenda.')
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: A, marginBottom: 5 }}>
          DIVISI SUPPORT CHL · CORPORATE
        </div>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Agenda korporasi {proyekAktif.nama}
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          RUPS dan aksi korporasi — tanggal, PIC, nilai, bukti, kendala, dan jejak auditnya.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Kpi nilai={String(kpi.agenda)} judul="Agenda korporasi" warna="#111827" />
        <Kpi nilai={String(kpi.rupst)} judul="RUPST" warna={C.run} />
        <Kpi nilai={String(kpi.selesai)} judul="Selesai" warna={C.done} />
        <Kpi nilai={String(kpi.kendala)} judul="Berkendala" warna={C.due} />
        <Kpi nilai={String(kpi.terlambat)} judul="Lewat tanggal" warna={C.late} />
        <Kpi nilai={kpi.nilai ? rp(kpi.nilai) : '—'} judul="Total nilai" warna="#111827" />
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

      {/* filter event + action, lalu tombol tambah */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['Semua', ...CORP_EVENT] as string[]).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setFilterEvent(e)}
            title={EVENT_KET[e]}
            style={{
              height: 30,
              padding: '0 13px',
              border: '1px solid ' + (filterEvent === e ? A : '#E5E7EB'),
              borderRadius: 'var(--radius-pill)',
              background: filterEvent === e ? A : '#fff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              color: filterEvent === e ? '#fff' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {e}
          </button>
        ))}
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            height: 30,
            padding: '0 10px',
            border: '1px solid #E5E7EB',
            borderRadius: 'var(--radius-pill)',
            background: '#fff',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            color: filterAction === 'Semua' ? '#6B7280' : A,
            cursor: 'pointer',
          }}
        >
          <option value="Semua">Semua action</option>
          {CORP_ACTION.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() =>
            setDialog({ event: filterEvent === 'Semua' ? CORP_EVENT[0] : filterEvent })
          }
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
          + Agenda korporasi
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>EVENT</th>
                <th style={th}>ACTION</th>
                <th style={th}>TANGGAL</th>
                <th style={th}>PIC</th>
                <th style={{ ...th, textAlign: 'right' }}>NILAI</th>
                <th style={th}>BUKTI</th>
                <th style={th}>KENDALA</th>
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
                      ? 'Belum ada agenda korporasi. Tambahkan RUPST atau RUPS Biasa di atas.'
                      : 'Tidak ada agenda pada filter ini.'}
                  </td>
                </tr>
              )}
              {!loading &&
                tampil.map((r) => {
                  const terbuka = buka === r.id
                  const warna = ST[r.status as ItemStatus] ?? C.idle
                  const dm =
                    r.tgl && r.status !== 'Selesai' ? deadlineMeta(r.status as ItemStatus, r.tgl) : null
                  return [
                    <tr
                      key={r.id}
                      className="hc-attach"
                      onClick={() => setBuka(terbuka ? null : r.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#9CA3AF', marginRight: 7, fontSize: 11 }}>
                          {terbuka ? '▾' : '▸'}
                        </span>
                        {r.event}
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 700 }}>{r.action}</div>
                        {r.judul && (
                          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
                            {r.judul}
                          </div>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <span style={badge(warna)}>{r.status}</span>
                          {dm?.chip && (
                            <span style={{ ...badge(dm.warna, true), marginLeft: 5 }}>{dm.chip}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: r.tgl ? '#111827' : '#9CA3AF' }}>
                        {r.tgl ? fmtTgl(r.tgl) : '—'}
                      </td>
                      <td style={{ ...td, color: r.pic ? '#111827' : '#9CA3AF' }}>{r.pic || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {r.nilai ? rp(r.nilai) : '—'}
                      </td>
                      <td style={td}>
                        <span
                          style={badge(r.lampiran.length ? A : '#9CA3AF')}
                        >{`${r.lampiran.length} berkas`}</span>
                      </td>
                      <td style={{ ...td, maxWidth: 220 }}>
                        {r.kendala ? (
                          <span style={{ color: C.late, fontWeight: 700 }}>{r.kendala}</span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                      <td
                        style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setDialog({ event: r.event, initial: r })}
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
                          onClick={() => onHapus(r)}
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
                      <tr key={r.id + '-detail'}>
                        <td
                          colSpan={8}
                          style={{
                            padding: '16px 18px 18px',
                            background: '#FAFBFC',
                            borderBottom: '1px solid #F1F3F5',
                          }}
                        >
                          <DetailAgenda agenda={r} onChanged={reload} />
                        </td>
                      </tr>
                    ),
                  ]
                })}
            </tbody>
          </table>
        </div>
      </div>

      {dialog && (
        <CorporateDialog
          proyek={proyekAktif.id}
          defaultEvent={dialog.event}
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

/** Panel yang terbuka di bawah baris: lampiran bukti, kendala, jejak audit. */
function DetailAgenda({ agenda, onChanged }: { agenda: CorporateRecord; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setErr(null)
    const res = await uploadCorpDoc(agenda.id, file, CURRENT_USER.nama)
    setUploading(false)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Upload gagal.')
  }

  async function onHapusDoc(docId: number, nama: string) {
    if (!window.confirm(`Hapus lampiran "${nama}"?`)) return
    const res = await deleteCorpDoc(docId)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Gagal menghapus lampiran.')
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 18,
        alignItems: 'start',
      }}
    >
      {/* lampiran bukti + kendala */}
      <div>
        <div style={seksi}>LAMPIRAN BUKTI</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {agenda.lampiran.length === 0 && (
            <div
              style={{
                padding: 14,
                border: '1px dashed #D9DEE5',
                borderRadius: 9,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: '#9CA3AF',
              }}
            >
              Belum ada bukti. {ACTION_BUKTI[agenda.action] ?? ''}
            </div>
          )}
          {agenda.lampiran.map((d) => (
            <div
              key={d.id}
              className="hc-attach"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 11px',
                border: '1px solid #E5E7EB',
                borderRadius: 9,
                background: '#fff',
              }}
            >
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.filename}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                  {fmtSize(d.size)}
                </span>
              </a>
              <button
                type="button"
                onClick={() => onHapusDoc(d.id, d.filename)}
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
        <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            height: 30,
            padding: '0 13px',
            border: '1px solid #E5E7EB',
            borderRadius: 'var(--radius-pill)',
            background: '#fff',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            color: A,
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? 'Mengunggah…' : '+ Unggah bukti'}
        </button>
        {err && (
          <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: C.late }}>{err}</div>
        )}

        <div style={{ ...seksi, marginTop: 18 }}>KENDALA</div>
        {agenda.kendala ? (
          <div
            style={{
              padding: '9px 12px',
              borderRadius: 9,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#B91C1C',
            }}
          >
            {agenda.kendala}
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
            Tidak ada kendala tercatat pada agenda ini.
          </div>
        )}
      </div>

      {/* komentar & jejak audit */}
      <div>
        <div style={seksi}>KOMENTAR &amp; JEJAK AUDIT</div>
        <CommentThread
          entity="corp"
          entityId={agenda.id}
          initial={agenda.komentar}
          onAdded={onChanged}
        />
      </div>
    </div>
  )
}
