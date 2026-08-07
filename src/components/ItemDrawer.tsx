import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { A, C, STEPS } from '@/data/constants'
import { fmtTgl } from '@/lib/format'
import { fetchAttachments, uploadFile, type Attachment } from '@/lib/api'
import type { Row } from '@/lib/rows'
import { CommentThread } from './CommentThread'

const fmtSize = (n: number): string =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB'

function fmtWaktu(iso: string): string {
  if (!iso) return 'baru saja'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'baru saja'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ItemDrawerProps {
  row: Row
  onClose: () => void
}

/**
 * The 480px right-hand drawer: verification stepper, read-only form, evidence,
 * blockers and the audit trail. Evidence and the trail are read from the
 * database for this item — nothing here is sample data. Blocked items get a red
 * banner and both primary actions disabled.
 */
export function ItemDrawer({ row, onClose }: ItemDrawerProps) {
  const isBlocked = row.blocked
  const cur = Math.max(0, STEPS.indexOf(row.status as (typeof STEPS)[number]))

  const itemId = row.item.id
  const fileRef = useRef<HTMLInputElement>(null)
  const [lampiran, setLampiran] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  const reloadLampiran = useCallback(async () => {
    if (!itemId) return
    const data = await fetchAttachments(itemId)
    if (data) setLampiran(data)
  }, [itemId])

  useEffect(() => {
    reloadLampiran()
  }, [reloadLampiran])

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setUploading(true)
    setUploadErr(null)
    const res = await uploadFile(file, itemId)
    if (res.ok) await reloadLampiran()
    else setUploadErr(res.error ?? 'Upload gagal.')
    setUploading(false)
  }

  const fields: { label: string; v: string; wide?: boolean }[] = [
    { label: 'PROYEK', v: row.proyekNama, wide: true },
    { label: 'MODUL', v: row.modulLabel },
    { label: 'HORIZON', v: 'Jangka ' + row.horizon },
    { label: 'PIC', v: row.pic },
    { label: 'VERIFIKATOR', v: row.verif },
    { label: 'TARGET', v: row.tglTxt },
    { label: 'KEDALUWARSA', v: row.status === 'Selesai' ? '—' : fmtTgl(row.tgl) },
    { label: 'NILAI', v: row.nilaiTxt, wide: true },
  ]

  const actionBase: CSSProperties = {
    height: 36,
    padding: '0 16px',
    border: 0,
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'inherit',
    fontSize: 12.5,
    fontWeight: 700,
  }

  const simpanStyle: CSSProperties = isBlocked
    ? { ...actionBase, background: '#EFF1F4', color: '#B6BBC3', cursor: 'not-allowed' }
    : {
        ...actionBase,
        background: '#fff',
        border: '1px solid #E5E7EB',
        color: '#111827',
        cursor: 'pointer',
      }

  const ajukanStyle: CSSProperties = isBlocked
    ? { ...actionBase, background: '#EFF1F4', color: '#B6BBC3', cursor: 'not-allowed' }
    : { ...actionBase, background: A, color: '#fff', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }

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
          zIndex: 60,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: '#fff',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 61,
          display: 'flex',
          flexDirection: 'column',
          animation: 'hcDrawerIn 320ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* ---- header ---- */}
        <div style={{ flex: 'none', padding: '16px 20px 14px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: A }}>
                  {row.modulLabel}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#D1D5DB' }}>·</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF' }}>{row.kode}</span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  textWrap: 'balance',
                }}
              >
                {row.judul}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
                <span style={row.statusStyle}>{row.status}</span>
                <span style={row.chipStyle}>
                  {row.chip} · {row.tglTxt}
                </span>
                <span style={row.risikoStyle}>Risiko {row.risiko}</span>
              </div>
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
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* ---- blocked ---- */}
          {isBlocked && (
            <div
              style={{
                margin: '16px 20px 0',
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DC2626"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flex: 'none', marginTop: 1 }}
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#991B1B', marginBottom: 3 }}>
                  Item ini terkendala
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C', textWrap: 'pretty' }}>
                  {row.blockReason}
                </div>
              </div>
            </div>
          )}

          {/* ---- verification stepper ---- */}
          <div style={{ padding: '18px 20px 0' }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#9CA3AF',
                marginBottom: 12,
              }}
            >
              ALUR VERIFIKASI
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {STEPS.map((label, n) => {
                const st = isBlocked ? (n <= 1 ? 'done' : 'todo') : n < cur ? 'done' : n === cur ? 'now' : 'todo'
                const warna = st === 'done' ? C.done : st === 'now' ? A : '#D5D9E0'
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 7,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flex: 'none',
                          color: st === 'todo' ? '#9CA3AF' : '#fff',
                          background: st === 'todo' ? '#EFF1F4' : warna,
                          boxShadow: st === 'now' ? `0 0 0 4px ${A}1F` : undefined,
                        }}
                      >
                        {st === 'done' ? '✓' : n + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          textAlign: 'center',
                          lineHeight: 1.25,
                          color: st === 'todo' ? '#B6BBC3' : st === 'now' ? A : '#6B7280',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {n < STEPS.length - 1 && (
                      <span
                        style={{
                          display: 'block',
                          height: 2,
                          flex: 'none',
                          width: 14,
                          marginTop: 11,
                          borderRadius: 2,
                          background: n < cur && !isBlocked ? C.done : '#E5E7EB',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ---- form ---- */}
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map((f) => (
              <div key={f.label} style={f.wide ? { gridColumn: '1 / -1' } : undefined}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#9CA3AF',
                    marginBottom: 6,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    minHeight: 36,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 11px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 9,
                    background: '#FCFDFD',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  {f.v}
                </div>
              </div>
            ))}
          </div>

          {/* ---- evidence ---- */}
          <div style={{ padding: '0 20px 20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: '#9CA3AF' }}>
                LAMPIRAN BUKTI
              </div>
              <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: 'none' }} />
              <button
                type="button"
                className="hc-outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                style={{
                  height: 26,
                  padding: '0 10px',
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: uploading ? '#9CA3AF' : A,
                  cursor: uploading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {uploading ? 'Mengunggah…' : '+ Unggah'}
              </button>
            </div>
            {uploadErr && (
              <div
                style={{
                  marginBottom: 8,
                  padding: '8px 11px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#B91C1C',
                }}
              >
                {uploadErr}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {lampiran.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hc-attach"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 11px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 9,
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      flex: 'none',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: A,
                      background: A + '14',
                    }}
                  >
                    {(l.filename.split('.').pop() ?? 'FILE').slice(0, 4).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
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
                      {l.filename}
                    </span>
                    <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                      {fmtSize(l.size)} · {fmtWaktu(l.createdAt)}
                    </span>
                  </span>
                </a>
              ))}
              {lampiran.length === 0 && (
                <div
                  style={{
                    padding: 16,
                    border: '1px dashed #D9DEE5',
                    borderRadius: 9,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9CA3AF',
                  }}
                >
                  Belum ada bukti. Verifikator tidak dapat menyetujui tanpa lampiran.
                </div>
              )}
            </div>
          </div>

          {/* ---- blockers ---- */}
          <div style={{ padding: '0 20px 20px' }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#9CA3AF',
                marginBottom: 10,
              }}
            >
              KENDALA
            </div>
            {row.blockReason ? (
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
                {row.blockReason}
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
                Tidak ada kendala tercatat pada item ini.
              </div>
            )}
          </div>

          {/* ---- audit trail ---- */}
          <div style={{ padding: '0 20px 20px' }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#9CA3AF',
                marginBottom: 10,
              }}
            >
              KOMENTAR &amp; JEJAK AUDIT
            </div>
            {itemId ? (
              <CommentThread entity="item" entityId={itemId} />
            ) : (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
                Item ini belum tersimpan di database, jadi belum punya jejak audit.
              </div>
            )}
          </div>
        </div>

        {/* ---- actions ---- */}
        <div
          style={{
            flex: 'none',
            padding: '13px 20px',
            borderTop: '1px solid #E5E7EB',
            background: '#FCFDFD',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button type="button" disabled={isBlocked} style={simpanStyle}>
            Simpan
          </button>
          <button type="button" disabled={isBlocked} className={isBlocked ? undefined : 'hc-primary'} style={ajukanStyle}>
            {row.status === 'Menunggu Verifikasi' ? 'Setujui & tutup' : 'Ajukan verifikasi'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="hc-return-btn"
            style={{
              height: 36,
              padding: '0 14px',
              border: '1px solid #E5E7EB',
              background: '#fff',
              borderRadius: 'var(--radius-pill)',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#B91C1C',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Kembalikan
          </button>
        </div>
      </aside>
    </>
  )
}
