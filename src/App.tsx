import { useMemo, useState } from 'react'
import { BAGAN } from '@/data/constants'
import { ITEMS, NEW_ITEM_INDEX } from '@/data/items'
import { PROYEK } from '@/data/projects'
import type { Horizon, ModuleId, NavId, ProjectId, ScreenId } from '@/data/types'
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

const isBagan = (id: NavId): id is (typeof BAGAN)[number] =>
  (BAGAN as readonly string[]).includes(id)

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

  const proyekAktif = PROYEK.find((p) => p.id === proyek) ?? PROYEK[0]
  const rowH = ROW_HEIGHT[density]

  const all = useMemo(() => ITEMS.map((i, n) => buildRow(i, n)), [])

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

            {screen === 'proyek' && (
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
                onNewItem={() => setDrawer(buildRow(ITEMS[NEW_ITEM_INDEX], NEW_ITEM_INDEX))}
                onSort={onSort}
                onOpen={setDrawer}
              />
            )}

            {screen === 'lisensi' && (
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
            )}

            {screen === 'feasibility' && <FeasibilityInitialCost proyekAktif={proyekAktif} />}

            {screen === 'kosong' && (
              <ModulKosong judul={kosongJudul} onBack={() => goNav('dashboard')} />
            )}
          </div>
        </main>
      </div>

      {drawer && <ItemDrawer row={drawer} onClose={() => setDrawer(null)} />}
    </div>
  )
}
