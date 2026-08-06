import { useEffect, useMemo, useState } from 'react'
import { BAGAN } from '@/data/constants'
import { ITEMS } from '@/data/items'
import { PROYEK } from '@/data/projects'
import type { Horizon, Item, ModuleId, NavId, ProjectId, ScreenId } from '@/data/types'
import { fetchBootstrap } from '@/lib/api'
import { AssistantDock } from '@/components/AssistantDock'
import { ItemDrawer } from '@/components/ItemDrawer'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import type { MatrixStyle } from '@/components/ProjectMatrix'
import { ROW_HEIGHT, type Density } from '@/lib/columns'
import { fmtTgl } from '@/lib/format'
import { buildPermitRows } from '@/lib/permits'
import { buildRow, isTerlambat, sortRows, type Row, type SortDir } from '@/lib/rows'
import { DashboardEksekutif } from '@/screens/DashboardEksekutif'
import { DetailProyek } from '@/screens/DetailProyek'
import { FeasibilityInitialCost } from '@/screens/FeasibilityInitialCost'
import { LicenseDocumentation } from '@/screens/LicenseDocumentation'
import { ModulKosong } from '@/screens/ModulKosong'
import { Tim } from '@/screens/Tim'

const isBagan = (id: NavId): id is (typeof BAGAN)[number] =>
  (BAGAN as readonly string[]).includes(id)

/** Shown on project-scoped screens once the demo data is cleared. */
function NoProjectNotice() {
  return (
    <div style={{ padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Belum ada proyek</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', maxWidth: 440, margin: '0 auto' }}>
        Data demo sudah dibersihkan. Layar ini akan terisi setelah data proyek ada di database.
        Sementara itu, buka menu <b>Tim</b> di sidebar untuk mengelola data.
      </div>
    </div>
  )
}

/**
 * Matrix cells show item counts. `ProjectMatrix` also renders a dot-only
 * variant — the design ships the numeric one.
 */
const MATRIX_STYLE: MatrixStyle = 'Angka'

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('dashboard')
  const [nav, setNav] = useState<NavId>('dashboard')
  const [proyek, setProyek] = useState<ProjectId>('srp')
  const [modul, setModul] = useState<ModuleId>('license')
  const [horizon, setHorizon] = useState<Horizon>('Pendek')
  const [filter, setFilter] = useState('Semua')
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState('tgl')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsed, setCollapsed] = useState(false)
  const [projectMenu, setProjectMenu] = useState(false)
  const [drawer, setDrawer] = useState<Row | null>(null)
  const [density, setDensity] = useState<Density>('rapat')
  const [checklist, setChecklist] = useState(false)

  // Items start from the bundled demo data and are replaced by live rows from
  // Neon once /api/bootstrap responds. If the backend is absent, the app keeps
  // running on the demo data — no regression.
  const [items, setItems] = useState<Item[]>(ITEMS)
  const [dataSource, setDataSource] = useState<'demo' | 'live'>('demo')

  useEffect(() => {
    let alive = true
    fetchBootstrap().then((data) => {
      if (alive && data) {
        setItems(data.items)
        setDataSource('live')
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const proyekAktif = PROYEK.find((p) => p.id === proyek)
  const rowH = ROW_HEIGHT[density]

  const all = useMemo(() => items.map((i, n) => buildRow(i, n)), [items])

  /** Blocked + overdue counts, badged on the sidebar. */
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    all.forEach((r) => {
      if (r.status === 'Diblokir' || isTerlambat(r)) c[r.modul] = (c[r.modul] ?? 0) + 1
    })
    return c
  }, [all])

  const rows = useMemo(() => {
    let r = all.filter((x) => x.proyek === proyek && x.modul === modul && x.horizon === horizon)
    if (filter === 'Terlambat') r = r.filter(isTerlambat)
    else if (filter !== 'Semua') r = r.filter((x) => x.status === filter)
    if (q.trim()) {
      const needle = q.toLowerCase()
      r = r.filter((x) => (x.judul + x.pic + x.verif + x.kode).toLowerCase().includes(needle))
    }
    return sortRows(r, sortKey, sortDir)
  }, [all, proyek, modul, horizon, filter, q, sortKey, sortDir])

  const izinRows = useMemo(
    () => sortRows(buildPermitRows(proyek), sortKey, sortDir),
    [proyek, sortKey, sortDir],
  )

  function goNav(id: NavId) {
    setNav(id)
    if (id === 'dashboard') {
      setScreen('dashboard')
    } else if (id === 'proyek') {
      setScreen('proyek')
      setModul('corporate')
      setFilter('Semua')
    } else if (id === 'license') {
      setScreen('lisensi')
      setModul('license')
    } else if (id === 'feasibility') {
      setScreen('feasibility')
      setModul('feasibility')
    } else if (id === 'tim') {
      setScreen('tim')
    } else if (isBagan(id)) {
      setScreen('proyek')
      setModul(id)
      setFilter('Semua')
    } else {
      setScreen('kosong')
    }
  }

  function onSort(k: string) {
    setSortDir(sortKey === k && sortDir === 'asc' ? 'desc' : 'asc')
    setSortKey(k)
  }

  function onJump(p: ProjectId, m: ModuleId) {
    setScreen(m === 'license' ? 'lisensi' : m === 'feasibility' ? 'feasibility' : 'proyek')
    setNav(m)
    setProyek(p)
    setModul(m)
    setFilter('Semua')
  }

  /** Module tabs only swap the sidebar selection for the five bagan. */
  function onModul(m: ModuleId) {
    setModul(m)
    setFilter('Semua')
    if (isBagan(m)) setNav(m)
  }

  const kosongJudul =
    nav === 'finance'
      ? 'Finance & Correspondence'
      : nav === 'audit'
        ? 'Internal Audit'
        : 'Pengaturan'

  const densityLabel = density === 'rapat' ? 'Rapat' : 'Longgar'
  const toggleDensity = () => setDensity(density === 'rapat' ? 'longgar' : 'rapat')

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#F7F8FA',
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      <Sidebar
        nav={nav}
        collapsed={collapsed}
        counts={counts}
        onNav={goNav}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          proyekAktif={proyekAktif}
          menuOpen={projectMenu}
          query={q}
          onToggleMenu={() => setProjectMenu(!projectMenu)}
          onPickProyek={(id) => {
            setProyek(id)
            setProjectMenu(false)
          }}
          onQuery={setQ}
        />

        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(700px 380px at 12% -8%, rgba(15,92,107,0.07), transparent 70%), radial-gradient(620px 340px at 92% 2%, rgba(53,129,225,0.06), transparent 70%)',
            }}
          />
          <div style={{ position: 'relative', padding: '22px 26px 60px', maxWidth: 1560 }}>
            {screen === 'dashboard' && (
              <DashboardEksekutif
                all={all}
                hariIni={fmtTgl('2026-08-06')}
                rowH={rowH}
                sortKey={sortKey}
                sortDir={sortDir}
                matrixStyle={MATRIX_STYLE}
                onSort={onSort}
                onOpen={setDrawer}
                onJump={onJump}
                onSeeAll={() => goNav('proyek')}
              />
            )}

            {screen === 'proyek' &&
              (proyekAktif ? (
                <DetailProyek
                  proyekAktif={proyekAktif}
                  all={all}
                  rows={rows}
                  modul={modul}
                  horizon={horizon}
                  filter={filter}
                  rowH={rowH}
                  densityLabel={densityLabel}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onModul={onModul}
                  onHorizon={setHorizon}
                  onFilter={setFilter}
                  onToggleDensity={toggleDensity}
                  onNewItem={() => {}}
                  onSort={onSort}
                  onOpen={setDrawer}
                />
              ) : (
                <NoProjectNotice />
              ))}

            {screen === 'lisensi' &&
              (proyekAktif ? (
                <LicenseDocumentation
                  proyekAktif={proyekAktif}
                  rows={izinRows}
                  rowH={rowH}
                  densityLabel={densityLabel}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  checklistDibuat={checklist}
                  onBuatChecklist={() => setChecklist(true)}
                  onToggleDensity={toggleDensity}
                  onSort={onSort}
                  onOpen={setDrawer}
                  onSelectChain={() => setScreen('lisensi')}
                />
              ) : (
                <NoProjectNotice />
              ))}

            {screen === 'feasibility' &&
              (proyekAktif ? <FeasibilityInitialCost proyekAktif={proyekAktif} /> : <NoProjectNotice />)}

            {screen === 'tim' && <Tim />}

            {screen === 'kosong' && (
              <ModulKosong judul={kosongJudul} onBack={() => goNav('dashboard')} />
            )}
          </div>
        </main>
      </div>

      {drawer && <ItemDrawer row={drawer} onClose={() => setDrawer(null)} />}

      <AssistantDock dataSource={dataSource} items={items} proyekAktif={proyekAktif} />
    </div>
  )
}
