import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { A, C, CURRENT_USER } from '@/data/constants'
import type { Komentar } from '@/data/types'
import { addComment, fetchComments, type CommentEntity } from '@/lib/api'

interface CommentThreadProps {
  entity: CommentEntity
  entityId: number
  /**
   * Komentar yang sudah ikut terbawa saat memuat induknya. Bila diisi, thread
   * tidak memanggil API lagi sampai ada komentar baru dikirim.
   */
  initial?: Komentar[]
  /** Dipanggil setelah komentar baru tersimpan, agar induknya bisa memuat ulang. */
  onAdded?: () => void
  /** Ditampilkan saat backend tidak tersedia. */
  disabledNote?: string
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

const input: CSSProperties = {
  flex: 1,
  height: 36,
  padding: '0 12px',
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

/**
 * Komentar & jejak audit satu catatan. Entri `sistem` ditulis backend saat data
 * berubah (status, kendala, lampiran); entri `komentar` ditulis pengguna di
 * sini. Keduanya tampil dalam satu lini masa, terbaru di atas.
 */
export function CommentThread({
  entity,
  entityId,
  initial,
  onAdded,
  disabledNote,
}: CommentThreadProps) {
  const [items, setItems] = useState<Komentar[]>(initial ?? [])
  const [teks, setTeks] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(initial != null)

  const reload = useCallback(async () => {
    const data = await fetchComments(entity, entityId)
    if (data) setItems(data)
    setLoaded(true)
  }, [entity, entityId])

  useEffect(() => {
    if (initial) {
      setItems(initial)
      setLoaded(true)
      return
    }
    reload()
  }, [initial, reload])

  async function kirim() {
    const isi = teks.trim()
    if (!isi) return
    setSending(true)
    setErr(null)
    const res = await addComment(entity, entityId, isi, CURRENT_USER.nama)
    setSending(false)
    if (!res.ok) {
      setErr(res.error ?? 'Gagal mengirim komentar.')
      return
    }
    setTeks('')
    await reload()
    onAdded?.()
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loaded && items.length === 0 && (
          <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
            Belum ada komentar. Perubahan status, kendala, dan lampiran tercatat otomatis di sini.
          </div>
        )}
        {items.map((k, n) => {
          const sistem = k.jenis === 'sistem'
          const warna = sistem ? '#9CA3AF' : A
          return (
            <div key={k.id} style={{ display: 'flex', gap: 11 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 'none',
                  width: 22,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    marginTop: 5,
                    flex: 'none',
                    background: warna,
                  }}
                />
                {n < items.length - 1 && (
                  <span style={{ flex: 1, width: 1, background: '#E5E7EB', minHeight: 14 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>
                    {k.aktor || (sistem ? 'Sistem' : '—')}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                    {fmtWaktu(k.createdAt)}
                  </span>
                  {sistem && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: '#9CA3AF',
                        background: '#F1F3F5',
                        borderRadius: 'var(--radius-pill)',
                        padding: '1px 7px',
                      }}
                    >
                      JEJAK AUDIT
                    </span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: sistem ? '#6B7280' : '#374151',
                    textWrap: 'pretty',
                  }}
                >
                  {k.teks}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {disabledNote ? (
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>{disabledNote}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="hc-input"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') kirim()
              }}
              placeholder="Tulis komentar…"
              style={input}
            />
            <button
              type="button"
              className="hc-outline"
              onClick={kirim}
              disabled={sending || !teks.trim()}
              style={{
                height: 36,
                padding: '0 14px',
                border: '1px solid #E5E7EB',
                background: '#fff',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                color: teks.trim() ? A : '#9CA3AF',
                cursor: sending ? 'wait' : teks.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              {sending ? 'Mengirim…' : 'Kirim'}
            </button>
          </div>
          {err && (
            <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 700, color: C.late }}>{err}</div>
          )}
        </>
      )}
    </div>
  )
}
