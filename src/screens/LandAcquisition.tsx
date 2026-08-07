import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { A, C, ST } from '@/data/constants'
import { LAND_TAHAP, TAHAP_JUDUL, TAHAP_KET, jalurTahap, type JalurTanah } from '@/data/lands'
import type { ItemStatus, Land, Project } from '@/data/types'
import { deleteLand, fetchLands, type LandRecord } from '@/lib/api'
import { num } from '@/lib/format'
import { deadlineMeta } from '@/lib/rows'
import { LandDialog } from '@/components/LandDialog'

interface LandAcquisitionProps {
  proyekAktif: Project
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  boxShadow: 'var(--shadow-xs)',
  display: 'flex',
  flexDirection: 'column',
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

/** Sebuah bidang dianggap tuntas begitu statusnya Selesai. */
const tuntas = (l: Land): boolean => l.status === 'Selesai'

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
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', color: warna }}>
        {nilai}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{judul}</div>
    </div>
  )
}

/** Satu baris bidang di dalam kartu jalur. */
function BarisBidang({
  land,
  onEdit,
  onHapus,
  busy,
}: {
  land: LandRecord
  onEdit: () => void
  onHapus: () => void
  busy: boolean
}) {
  const warna = ST[land.status as ItemStatus] ?? C.idle
  // Chip tenggat hanya relevan selama bidang belum tuntas — kalau sudah, chip
  // "Selesai" hanya mengulang badge statusnya.
  const dm = land.tgl && !tuntas(land) ? deadlineMeta(land.status as ItemStatus, land.tgl) : null

  return (
    <div
      className="hc-attach"
      onClick={onEdit}
      style={{
        padding: '10px 14px',
        borderTop: '1px solid #F1F3F5',
        cursor: 'pointer',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          {land.kode && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#9CA3AF' }}>{land.kode}</span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{land.nama}</span>
          <span style={badge(warna)}>{land.status}</span>
          {dm?.chip && <span style={badge(dm.warna, true)}>{dm.chip}</span>}
        </div>
        <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
          {land.luas ? num(land.luas) + ' m²' : 'luas —'}
          {land.pemilik && ` · a.n. ${land.pemilik}`}
          {land.noDok && ` · ${land.noDok}`}
          {land.pic && ` · PIC ${land.pic}`}
        </div>
        {land.catatan && (
          <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>
            {land.catatan}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onHapus()
        }}
        disabled={busy}
        style={{
          flex: 'none',
          border: 0,
          background: 'transparent',
          padding: 0,
          fontFamily: 'inherit',
          fontSize: 11.5,
          fontWeight: 700,
          color: '#9CA3AF',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        Hapus
      </button>
    </div>
  )
}

/**
 * Bagan Land Acquisition — status sertifikasi bidang tanah dalam dua tahap:
 * Akuisisi (perolehan PT) dan Pasca Akuisisi (pelepasan ke konsumen). Tiap
 * tahap punya dua jalur, dan tiap jalur punya satu hasil akhir yang tetap.
 */
export function LandAcquisition({ proyekAktif }: LandAcquisitionProps) {
  const [lands, setLands] = useState<LandRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ jenis: string; initial?: Land } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchLands(proyekAktif.id)
    if (data) {
      setLands(data)
      setNotice(null)
    } else {
      setLands([])
      setNotice('Backend belum terhubung — hubungkan Neon di Vercel agar bidang tanah bisa disimpan.')
    }
    setLoading(false)
  }, [proyekAktif.id])

  useEffect(() => {
    reload()
  }, [reload])

  const kpi = useMemo(() => {
    const akuisisi = lands.filter((l) => jalurTahap('Akuisisi').some((j) => j.jenis === l.jenis))
    const pasca = lands.filter((l) => jalurTahap('Pasca Akuisisi').some((j) => j.jenis === l.jenis))
    const terlambat = lands.filter(
      (l) => l.tgl && !tuntas(l) && deadlineMeta(l.status as ItemStatus, l.tgl).chip.startsWith('Terlambat'),
    )
    return {
      bidang: lands.length,
      luas: lands.reduce((s, l) => s + (l.luas || 0), 0),
      perolehan: akuisisi.filter(tuntas).length,
      perolehanTotal: akuisisi.length,
      siapAjb: pasca.filter(tuntas).length,
      siapAjbTotal: pasca.length,
      terlambat: terlambat.length,
    }
  }, [lands])

  async function onHapus(l: LandRecord) {
    if (!window.confirm(`Hapus bidang "${l.nama}"?`)) return
    setBusyId(l.id)
    const res = await deleteLand(l.id)
    setBusyId(null)
    if (res.ok) reload()
    else setNotice(res.error ?? 'Gagal menghapus bidang.')
  }

  function KartuJalur({ jalur }: { jalur: JalurTanah }) {
    const isi = lands.filter((l) => l.jenis === jalur.jenis)
    const selesai = isi.filter(tuntas).length
    const rasio = isi.length ? selesai / isi.length : 0

    return (
      <div style={card}>
        <div style={{ padding: '13px 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {jalur.jenis}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>→</span>
            <span style={badge(A, true)}>{jalur.hasil}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>
            {jalur.ket}
          </div>
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: '#EEF0F3',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: Math.round(rasio * 100) + '%',
                  height: '100%',
                  background: rasio === 1 ? C.done : A,
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280' }}>
              {selesai}/{isi.length}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {loading && (
            <div style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 600, color: '#9CA3AF', borderTop: '1px solid #F1F3F5' }}>
              Memuat…
            </div>
          )}
          {!loading && isi.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 600, color: '#9CA3AF', borderTop: '1px solid #F1F3F5' }}>
              Belum ada bidang pada jalur ini.
            </div>
          )}
          {!loading &&
            isi.map((l) => (
              <BarisBidang
                key={l.id}
                land={l}
                busy={busyId === l.id}
                onEdit={() => setDialog({ jenis: l.jenis, initial: l })}
                onHapus={() => onHapus(l)}
              />
            ))}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #F1F3F5' }}>
          <button
            type="button"
            onClick={() => setDialog({ jenis: jalur.jenis })}
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
              cursor: 'pointer',
            }}
          >
            + Tambah bidang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: A,
            marginBottom: 5,
          }}
        >
          DIVISI SUPPORT CHL · LAND ACQUISITION
        </div>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Sertifikasi tanah {proyekAktif.nama}
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
          Status sertifikat tiap bidang, dari perolehan PT sampai siap AJB dengan konsumen.
          {proyekAktif.lok ? ` · ${proyekAktif.lok}` : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Kpi nilai={String(kpi.bidang)} judul="Bidang tanah" warna="#111827" />
        <Kpi nilai={kpi.luas ? num(kpi.luas) + ' m²' : '—'} judul="Total luas" warna="#111827" />
        <Kpi
          nilai={`${kpi.perolehan}/${kpi.perolehanTotal}`}
          judul="Perolehan PT tuntas"
          warna={C.run}
        />
        <Kpi nilai={`${kpi.siapAjb}/${kpi.siapAjbTotal}`} judul="Siap AJB" warna={C.done} />
        <Kpi nilai={String(kpi.terlambat)} judul="Lewat target" warna={C.late} />
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

      {LAND_TAHAP.map((tahap, i) => (
        <div key={tahap} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span
              style={{
                width: 22,
                height: 22,
                flex: 'none',
                borderRadius: '50%',
                background: A,
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </span>
            <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Status sertifikasi sertifikat tanah — Tahap {tahap}
            </div>
            <span style={badge(A, true)}>{TAHAP_JUDUL[tahap]}</span>
          </div>
          <div style={{ margin: '4px 0 11px 31px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
            {TAHAP_KET[tahap]}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 12,
            }}
          >
            {jalurTahap(tahap).map((j) => (
              <KartuJalur key={j.jenis} jalur={j} />
            ))}
          </div>
        </div>
      ))}

      {dialog && (
        <LandDialog
          proyek={proyekAktif.id}
          defaultJenis={dialog.jenis}
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
