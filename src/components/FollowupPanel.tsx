import { useEffect, useState, type CSSProperties } from 'react'
import { A, C, CURRENT_USER } from '@/data/constants'
import {
  DOK_STATUS,
  DOK_WAJIB,
  KANAL_FOLLOWUP,
  PENGIRIM_REMINDER,
  TANGGA_FOLLOWUP,
} from '@/data/kpr'
import type { KprDokumen } from '@/data/types'
import { addKprFollowup, updateKprDokumen, type KprRecord } from '@/lib/api'
import { fmtTgl } from '@/lib/format'
import {
  statusDokumen,
  statusFollowup,
  susunPesan,
  susunSubjek,
  tautanEmail,
  tautanWa,
} from '@/lib/followup'

interface FollowupPanelProps {
  berkas: KprRecord
  proyekNama: string
  onChanged: () => void
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
    height: 20,
    padding: '0 8px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 10,
    fontWeight: tebal ? 800 : 700,
    whiteSpace: 'nowrap',
    color: warna,
    background: warna + '16',
  }
}

const DOK_WARNA: Record<string, string> = {
  Belum: C.idle,
  Diterima: C.done,
  'Perlu perbaikan': C.late,
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

const ketDok = (jenis: string): string =>
  DOK_WAJIB.find((d) => d.jenis === jenis)?.ket ?? 'Dokumen tambahan'

/**
 * Panel di bawah baris berkas: checklist dokumen di kiri, mesin follow-up di
 * kanan. Pesan disusun otomatis dari template sesuai tingkat yang jatuh tempo,
 * lalu dikirim lewat WhatsApp dan dicatat sebagai riwayat.
 */
export function FollowupPanel({ berkas, proyekNama, onChanged }: FollowupPanelProps) {
  const dok = statusDokumen(berkas)
  const fu = statusFollowup(berkas)
  // Tingkat yang jatuh tempo dipilih lebih dulu; kalau belum ada, pakai pengingat.
  const tingkatAwal = fu.jatuhTempo ?? TANGGA_FOLLOWUP[0]
  const [tingkat, setTingkat] = useState(tingkatAwal.tingkat)
  const [kanal, setKanal] = useState<string>(KANAL_FOLLOWUP[0])
  const [pesan, setPesan] = useState('')
  const [hasil, setHasil] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [tersalin, setTersalin] = useState(false)

  const pilihan = TANGGA_FOLLOWUP.find((t) => t.tingkat === tingkat) ?? TANGGA_FOLLOWUP[0]

  // Pesan disusun ulang setiap tingkat berubah atau checklist bergerak, kecuali
  // sudah diedit manual oleh petugas.
  const [manual, setManual] = useState(false)
  useEffect(() => {
    if (manual) return
    setPesan(susunPesan(berkas, pilihan, proyekNama))
  }, [berkas, pilihan, proyekNama, manual])

  async function ubahDok(d: KprDokumen, status: string) {
    setBusy(true)
    setErr(null)
    const res = await updateKprDokumen(d.id, { status })
    setBusy(false)
    if (res.ok) onChanged()
    else setErr(res.error ?? 'Gagal memperbarui dokumen.')
  }

  async function catat(kirim: 'wa' | 'email' | null) {
    if (!pesan.trim()) {
      setErr('Isi pesan tidak boleh kosong.')
      return
    }
    setBusy(true)
    setErr(null)
    const res = await addKprFollowup({
      kprId: berkas.id,
      tingkat: pilihan.tingkat,
      kanal,
      pesan: pesan.trim(),
      hasil: hasil.trim(),
      oleh: CURRENT_USER.nama,
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error ?? 'Gagal mencatat follow-up.')
      return
    }
    if (kirim === 'wa' && berkas.telepon) {
      window.open(tautanWa(berkas.telepon, pesan.trim()), '_blank', 'noopener')
    }
    if (kirim === 'email' && berkas.email) {
      // mailto membuka aplikasi email petugas dengan penerima, subjek, dan isi
      // sudah terisi — pengirimnya akun yang dipakai di aplikasi tersebut.
      window.location.href = tautanEmail(berkas.email, susunSubjek(berkas, pilihan), pesan.trim())
    }
    setHasil('')
    setManual(false)
    onChanged()
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(pesan)
      setTersalin(true)
      window.setTimeout(() => setTersalin(false), 1800)
    } catch {
      setErr('Peramban menolak akses papan klip — salin manual dari kotak pesan.')
    }
  }

  const tombol = (warna: string, solid = false): CSSProperties => ({
    height: 30,
    padding: '0 13px',
    border: solid ? 0 : '1px solid ' + warna + '55',
    borderRadius: 'var(--radius-pill)',
    background: solid ? warna : '#fff',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 700,
    color: solid ? '#fff' : warna,
    cursor: busy ? 'wait' : 'pointer',
    whiteSpace: 'nowrap',
  })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 18,
        alignItems: 'start',
      }}
    >
      {/* ---- checklist dokumen ---- */}
      <div>
        <div style={seksi}>
          MONITORING DOKUMEN · {dok.diterima}/{dok.total} DITERIMA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(berkas.dokumen ?? []).length === 0 && (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
              Checklist belum terbentuk. Simpan ulang berkas untuk membuat lima dokumen wajib.
            </div>
          )}
          {(berkas.dokumen ?? []).map((d) => (
            <div
              key={d.id}
              style={{
                padding: '9px 11px',
                border: '1px solid #E5E7EB',
                borderRadius: 9,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{d.jenis}</span>
                <span style={badge(DOK_WARNA[d.status] ?? C.idle)}>{d.status}</span>
                {d.tglTerima && (
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                    diterima {fmtTgl(d.tglTerima)}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                {ketDok(d.jenis)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                {DOK_STATUS.filter((s) => s !== d.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => ubahDok(d, s)}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 'var(--radius-pill)',
                      background: '#fff',
                      fontFamily: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      color: DOK_WARNA[s] ?? '#6B7280',
                      cursor: busy ? 'wait' : 'pointer',
                    }}
                  >
                    Tandai {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {dok.lengkap ? (
          <div
            style={{
              marginTop: 10,
              padding: '9px 12px',
              borderRadius: 9,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              fontSize: 12,
              fontWeight: 700,
              color: '#15803D',
            }}
          >
            Dokumen lengkap — berkas siap lanjut ke pembayaran DP / pengajuan bank.
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
            Kurang: <strong>{dok.kurang.join(', ')}</strong>
            {berkas.tenggatDokumen && ` · tenggat ${fmtTgl(berkas.tenggatDokumen)}`}
          </div>
        )}
      </div>

      {/* ---- mesin follow-up ---- */}
      <div>
        <div style={seksi}>FOLLOW-UP OTOMATIS</div>

        {!berkas.tenggatDokumen && (
          <div
            style={{
              marginBottom: 10,
              padding: '9px 12px',
              borderRadius: 9,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              fontSize: 12,
              fontWeight: 600,
              color: '#92400E',
            }}
          >
            Tenggat dokumen belum diisi, jadi jadwal follow-up belum bisa dihitung. Isi lewat tombol
            Ubah pada baris ini.
          </div>
        )}

        {/* tangga jadwal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          {TANGGA_FOLLOWUP.map((t) => {
            const sudah = fu.terkirim >= t.tingkat
            const jatuh = fu.jatuhTempo?.tingkat === t.tingkat && !sudah
            const warna = sudah ? C.done : jatuh ? C.late : '#9CA3AF'
            return (
              <div
                key={t.tingkat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: jatuh ? C.late + '0D' : '#F7F8FA',
                  border: '1px solid ' + (jatuh ? C.late + '33' : 'transparent'),
                }}
              >
                <span
                  style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: warna }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{t.nama}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                  {t.hari < 0 ? `H${t.hari}` : `H+${t.hari}`} · {t.nada}
                </span>
                <div style={{ flex: 1 }} />
                {sudah && <span style={badge(C.done)}>terkirim</span>}
                {jatuh && <span style={badge(C.late, true)}>jatuh tempo</span>}
              </div>
            )
          })}
        </div>

        {/* penyusun pesan */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <select
            value={tingkat}
            onChange={(e) => {
              setTingkat(Number(e.target.value))
              setManual(false)
            }}
            style={{
              height: 30,
              padding: '0 10px',
              border: '1px solid #E5E7EB',
              borderRadius: 'var(--radius-pill)',
              background: '#fff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              color: A,
              cursor: 'pointer',
            }}
          >
            {TANGGA_FOLLOWUP.map((t) => (
              <option key={t.tingkat} value={t.tingkat}>
                {t.nama}
              </option>
            ))}
          </select>
          <select
            value={kanal}
            onChange={(e) => setKanal(e.target.value)}
            style={{
              height: 30,
              padding: '0 10px',
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
            {KANAL_FOLLOWUP.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={pesan}
          onChange={(e) => {
            setPesan(e.target.value)
            setManual(true)
          }}
          rows={6}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: 9,
            outline: 0,
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#111827',
            background: '#fff',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
          Disusun otomatis dari template {pilihan.nama.toLowerCase()} — nama, unit, daftar dokumen
          yang kurang, tenggat, dan hitungan hari terisi sendiri. Boleh diedit sebelum dikirim.
          Pengirim: {PENGIRIM_REMINDER.email} · WA {PENGIRIM_REMINDER.whatsapp}.
        </div>

        <input
          value={hasil}
          onChange={(e) => setHasil(e.target.value)}
          placeholder="Hasil kontak (mis. dijanjikan kirim besok) — opsional"
          style={{
            width: '100%',
            height: 34,
            marginTop: 8,
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
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={busy || !berkas.telepon}
            onClick={() => catat('wa')}
            title={berkas.telepon ? '' : 'Nomor WhatsApp customer belum diisi'}
            style={{
              ...tombol(A, true),
              ...(berkas.telepon ? {} : { background: '#9DBEC4', cursor: 'not-allowed' }),
            }}
          >
            Kirim WhatsApp & catat
          </button>
          <button
            type="button"
            disabled={busy || !berkas.email}
            onClick={() => catat('email')}
            title={berkas.email ? '' : 'Email customer belum diisi'}
            style={{
              ...tombol(A),
              ...(berkas.email ? {} : { color: '#9CA3AF', cursor: 'not-allowed' }),
            }}
          >
            Kirim email & catat
          </button>
          <button type="button" disabled={busy} onClick={() => catat(null)} style={tombol(A)}>
            Catat saja
          </button>
          <button type="button" onClick={salin} style={tombol('#6B7280')}>
            {tersalin ? 'Tersalin' : 'Salin pesan'}
          </button>
        </div>
        {err && (
          <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: C.late }}>{err}</div>
        )}

        {/* riwayat */}
        <div style={{ ...seksi, marginTop: 18 }}>RIWAYAT FOLLOW-UP</div>
        {(berkas.followup ?? []).length === 0 ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>
            Belum ada follow-up tercatat untuk berkas ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(berkas.followup ?? []).map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '9px 11px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 9,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={badge(A, true)}>
                    {TANGGA_FOLLOWUP.find((t) => t.tingkat === f.tingkat)?.nama ??
                      `Tingkat ${f.tingkat}`}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{f.kanal}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF' }}>
                    {fmtWaktu(f.createdAt)}
                    {f.oleh && ` · ${f.oleh}`}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#4B5563',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {f.pesan}
                </div>
                {f.hasil && (
                  <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 700, color: '#111827' }}>
                    Hasil: {f.hasil}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
