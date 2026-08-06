import { useEffect, useRef, useState } from 'react'
import { A, C } from '@/data/constants'
import type { Item, Project } from '@/data/types'
import { askAI, fetchHealth, type Health } from '@/lib/api'

interface AssistantDockProps {
  dataSource: 'demo' | 'live'
  items: Item[]
  proyekAktif: Project | undefined
}

interface Turn {
  role: 'user' | 'ai'
  text: string
}

const dot = (warna: string) => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  flex: 'none' as const,
  background: warna,
})

/**
 * Floating assistant + backend status. Additive overlay — it does not touch the
 * existing layout. The status row lets you confirm at a glance that Neon, Blob,
 * and the OpenAI key are actually wired up.
 */
export function AssistantDock({ dataSource, items, proyekAktif }: AssistantDockProps) {
  const [open, setOpen] = useState(false)
  const [health, setHealth] = useState<Health | null>(null)
  const [healthLoaded, setHealthLoaded] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !healthLoaded) {
      fetchHealth().then((h) => {
        setHealth(h)
        setHealthLoaded(true)
      })
    }
  }, [open, healthLoaded])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [turns, busy])

  async function send() {
    const prompt = q.trim()
    if (!prompt || busy) return
    setTurns((t) => [...t, { role: 'user', text: prompt }])
    setQ('')
    setBusy(true)
    const proyekItems = items
      .filter((i) => !proyekAktif || i.proyek === proyekAktif.id)
      .map((i) => ({ judul: i.judul, modul: i.modul, status: i.status, tenggat: i.tgl, risiko: i.risiko }))
    const res = await askAI(prompt, { proyek: proyekAktif?.nama ?? 'Umum', items: proyekItems })
    setTurns((t) => [
      ...t,
      { role: 'ai', text: res.ok ? (res.text ?? '') : `⚠️ ${res.error}` },
    ])
    setBusy(false)
  }

  const statusRows = health
    ? [
        {
          label: 'Database (Neon)',
          ok: health.checks.neon.ok,
          detail: health.checks.neon.detail,
        },
        { label: 'Blob storage', ok: health.checks.blob.ok, detail: health.checks.blob.detail },
        { label: 'Fitur AI (OpenAI)', ok: health.checks.openai.ok, detail: health.checks.openai.detail },
      ]
    : []

  const aiReady = health?.checks.openai.ok ?? false

  return (
    <>
      {/* launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          height: 46,
          padding: '0 18px 0 15px',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          border: 0,
          borderRadius: 'var(--radius-pill)',
          background: A,
          color: '#fff',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 70,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3Z" />
          <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
        </svg>
        Asisten AI
        <span style={dot(dataSource === 'live' ? C.done : C.due)} />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 22,
            bottom: 80,
            width: 380,
            maxWidth: 'calc(100vw - 44px)',
            maxHeight: 'calc(100vh - 120px)',
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 14,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 70,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* header + status */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #EEF0F3' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>Asisten Harmoni</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: dataSource === 'live' ? C.done : '#B45309',
                  background: (dataSource === 'live' ? C.done : C.due) + '18',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {dataSource === 'live' ? 'Data live · Neon' : 'Data demo'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
              {!healthLoaded && (
                <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>Memeriksa status backend…</span>
              )}
              {healthLoaded && !health && (
                <span style={{ fontSize: 11.5, color: '#B45309', fontWeight: 600 }}>
                  Backend tidak merespons (mode statis / belum di-deploy ke Vercel).
                </span>
              )}
              {statusRows.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={dot(s.ok ? C.done : C.late)} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', flex: 'none' }}>{s.label}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: '#9CA3AF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* chat */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, minHeight: 160 }}>
            {turns.length === 0 && (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', lineHeight: 1.5 }}>
                {aiReady
                  ? `Tanya apa saja${proyekAktif ? ` tentang ${proyekAktif.nama}` : ''} — mis. "ringkas tugas yang mendesak" atau "buat draf checklist".`
                  : 'Fitur AI belum aktif. Set OPENAI_API_KEY di Vercel untuk mengaktifkan tanya-jawab.'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {turns.map((t, n) => (
                <div
                  key={n}
                  style={{
                    alignSelf: t.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    padding: '9px 12px',
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    color: t.role === 'user' ? '#fff' : '#111827',
                    background: t.role === 'user' ? A : '#F3F5F7',
                  }}
                >
                  {t.text}
                </div>
              ))}
              {busy && (
                <div style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
                  Menyusun jawaban…
                </div>
              )}
            </div>
          </div>

          {/* input */}
          <div style={{ padding: 12, borderTop: '1px solid #EEF0F3', display: 'flex', gap: 8 }}>
            <input
              className="hc-input"
              value={q}
              disabled={!aiReady || busy}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={aiReady ? 'Tulis pertanyaan…' : 'AI belum aktif'}
              style={{
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
                background: aiReady ? '#fff' : '#F7F8FA',
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={!aiReady || busy || !q.trim()}
              className={aiReady ? 'hc-primary' : undefined}
              style={{
                height: 36,
                padding: '0 15px',
                border: 0,
                borderRadius: 9,
                background: !aiReady || busy || !q.trim() ? '#EFF1F4' : A,
                color: !aiReady || busy || !q.trim() ? '#B6BBC3' : '#fff',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: !aiReady || busy || !q.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Kirim
            </button>
          </div>
        </div>
      )}
    </>
  )
}
