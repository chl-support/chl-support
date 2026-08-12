import { useEffect, useState } from 'react'
import { A, C } from '@/data/constants'
import { fetchAntreanReminder, fetchHealth, type Antrean, type ReminderStatus } from '@/lib/api'

/**
 * Ringkasan kesiapan pengiriman reminder otomatis, dibaca dari `/api/health`.
 *
 * Isinya sama dengan JSON di endpoint itu, tapi disajikan sebagai kalimat —
 * pemasangan kunci pengirim dilakukan di dasbor Vercel oleh orang yang tidak
 * membaca JSON, dan tanpa panel ini satu-satunya cara memastikan penjadwal
 * benar-benar bisa mengirim adalah menunggu jam 12.00 dan melihat apakah ada
 * email yang keluar.
 */
export function StatusReminder() {
  const [data, setData] = useState<ReminderStatus | null>(null)
  const [gagal, setGagal] = useState(false)
  const [memuat, setMemuat] = useState(true)
  const [buka, setBuka] = useState(false)
  const [antrean, setAntrean] = useState<Antrean | null>(null)
  const [memuatAntrean, setMemuatAntrean] = useState(false)

  const lihatAntrean = () => {
    if (antrean) return setAntrean(null)
    setMemuatAntrean(true)
    fetchAntreanReminder()
      .then(setAntrean)
      .finally(() => setMemuatAntrean(false))
  }

  const muat = () => {
    setMemuat(true)
    fetchHealth()
      .then((h) => {
        // Deployment lama belum mengirim blok `reminder`; itu bukan kegagalan
        // koneksi, jadi dibedakan dari health yang tidak terjawab sama sekali.
        setData(h?.reminder ?? null)
        setGagal(!h)
      })
      .finally(() => setMemuat(false))
  }

  useEffect(muat, [])

  if (memuat && !data) return null

  // Sebagian siap bukan sama dengan mati: reminder dokumen tetap terkirim
  // walau sheet tagihan belum terbaca, jadi keduanya dibedakan.
  //
  // Server lama hanya mengirim `siapKirim`; disimpulkan dari pemeriksaan yang
  // ada supaya halaman baru tidak melaporkan "belum siap" hanya karena nama
  // medannya berbeda dari yang dijawab deployment saat itu.
  const dokumenSiap = data ? (data.dokumenSiap ?? data.email.ok) : false
  const tagihanSiap = data ? (data.tagihanSiap ?? (data.email.ok && data.sheet.ok)) : false
  const penuh = dokumenSiap && tagihanSiap
  const sebagian = dokumenSiap && !tagihanSiap
  const warna = gagal || !data ? '#9CA3AF' : penuh ? C.done : sebagian ? C.due : C.late
  const judul = gagal
    ? 'Status pengiriman tidak terbaca'
    : !data
      ? 'Status pengiriman belum tersedia'
      : penuh
        ? 'Reminder otomatis siap kirim'
        : sebagian
          ? 'Reminder dokumen siap · reminder tagihan belum'
          : 'Reminder otomatis belum bisa mengirim'

  return (
    <div
      data-testid="status-reminder"
      style={{
        border: '1px solid #E5E7EB',
        borderLeft: `3px solid ${warna}`,
        borderRadius: 'var(--radius-card)',
        background: '#fff',
        padding: '12px 14px',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 999, background: warna, flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{judul}</span>
        {data && (
          <span style={{ fontSize: 11.5, color: '#6B7280' }}>· {data.cron.jadwal}</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={muat}
          style={tombol}
          disabled={memuat}
        >
          {memuat ? 'Memeriksa…' : 'Periksa ulang'}
        </button>
        {data && (
          <button type="button" onClick={lihatAntrean} style={tombol} disabled={memuatAntrean}>
            {memuatAntrean ? 'Memuat…' : antrean ? 'Tutup antrean' : 'Antrean hari ini'}
          </button>
        )}
        {data && (
          <button type="button" onClick={() => setBuka((v) => !v)} style={tombol}>
            {buka ? 'Sembunyikan' : 'Rincian'}
          </button>
        )}
      </div>

      {gagal && (
        <p style={keterangan}>
          Tidak bisa menghubungi server. Coba muat ulang halaman; kalau tetap gagal, deployment-nya
          sedang bermasalah.
        </p>
      )}

      {!gagal && !data && (
        <p style={keterangan}>
          Deployment yang aktif belum memuat pemeriksaan ini. Jalankan Redeploy di Vercel, lalu tekan
          Periksa ulang.
        </p>
      )}

      {data && !buka && !penuh && <p style={keterangan}>{ringkasKendala(data)}</p>}

      {antrean && <PanelAntrean a={antrean} />}

      {data && buka && (
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          <Baris
            label="Jalur email"
            ok={data.email.ok}
            detail={data.email.detail}
            catatan={data.email.catatan}
            ekstra={`Pengirim: ${data.email.from}`}
          />
          <Baris label="Penjadwal harian" ok={data.cron.ok} detail={data.cron.detail} />
          <Baris
            label="Google Sheet"
            ok={data.sheet.ok}
            detail={data.sheet.detail}
            catatan={
              data.sheet.kolomHilang?.length
                ? `Kolom belum dikenali: ${data.sheet.kolomHilang.join(', ')}.`
                : undefined
            }
          />
        </div>
      )}
    </div>
  )
}

/**
 * Daftar penerima hari ini, hasil uji coba yang tidak mengirim apa pun.
 * Diperlihatkan sebelum jam kirim supaya nama yang tidak semestinya dihubungi
 * masih bisa dicegat.
 */
function PanelAntrean({ a }: { a: Antrean }) {
  const total = a.dokumen.length + a.tagihan.length
  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
        {total === 0
          ? 'Tidak ada yang dihubungi hari ini.'
          : `${total} pesan akan dikirim pada jadwal berikutnya`}
      </div>

      {a.errorTagihan && <div style={{ ...keterangan, color: C.due }}>{a.errorTagihan}</div>}

      {total > 0 && (
        <div style={{ display: 'grid', gap: 3 }}>
          {[...a.tagihan, ...a.dokumen].map((r, i) => (
            <div key={i} style={{ fontSize: 11.5, color: '#4B5563' }}>
              <span style={{ fontWeight: 700 }}>{r.nama}</span>
              {r.unit ? ` · ${r.unit}` : ''}
              {r.jenis ? ` · ${r.jenis}` : ''}
              <span style={{ color: A, fontWeight: 700 }}> · {r.tingkat}</span>
              {r.email ? <span style={{ color: '#9CA3AF' }}> → {r.email}</span> : null}
              {r.kurang?.length ? (
                <span style={{ color: '#9CA3AF' }}> · kurang: {r.kurang.join(', ')}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {a.perluDitinjau.length > 0 && (
        <div style={{ ...keterangan, color: C.due }}>
          {a.perluDitinjau.length} baris sudah lewat lebih dari 30 hari — ditahan, tidak dikirimi
          apa pun. Tangani manual: {a.perluDitinjau.slice(0, 5).map((r) => r.nama).join(', ')}
          {a.perluDitinjau.length > 5 ? ', …' : ''}
        </div>
      )}
    </div>
  )
}

/** Kendala pertama yang menghalangi pengiriman — yang perlu dibereskan duluan. */
function ringkasKendala(d: ReminderStatus): string {
  if (!d.email.ok) return d.email.detail
  if (!d.sheet.ok) {
    return (
      `Reminder dokumen KPR tetap terkirim. Yang tertahan hanya reminder tagihan: ${d.sheet.detail}`
    )
  }
  return 'Belum siap mengirim.'
}

function Baris({
  label,
  ok,
  detail,
  catatan,
  ekstra,
}: {
  label: string
  ok: boolean
  detail: string
  catatan?: string
  ekstra?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: ok ? C.done : C.due,
          width: 16,
          flexShrink: 0,
          lineHeight: '17px',
        }}
      >
        {ok ? '✓' : '!'}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: '#6B7280', wordBreak: 'break-word' }}>{detail}</div>
        {ekstra && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ekstra}</div>}
        {catatan && (
          <div style={{ fontSize: 11, color: C.due, marginTop: 2 }}>{catatan}</div>
        )}
      </div>
    </div>
  )
}

const keterangan = {
  margin: '8px 0 0',
  fontSize: 11.5,
  color: '#6B7280',
  lineHeight: 1.5,
} as const

const tombol = {
  height: 26,
  padding: '0 11px',
  border: '1px solid #E5E7EB',
  borderRadius: 'var(--radius-pill)',
  background: '#fff',
  color: A,
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
} as const
