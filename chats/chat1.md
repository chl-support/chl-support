# New UI mockups

_Started 2026-08-06 05:10 UTC_

---

## User

Make UI mockups for

## Assistant

I'll read the PRD first.

_[tool: read_file]_

_[tool: list_files]_

The PRD specifies its own design tokens (Inter, `#0F5C6B`, table-first) which differ from the attached Dhany Indraswara media-kit system. A few questions before I build.

_[tool: questions_v2]_

## User

Questions answered:
- tokens: Hybrid: PRD structure + design system's type & polish
- scope: P0 screens 1–4 (Dashboard, Detail Proyek, License, Feasibility)
- fidelity: Full prototype: filters, sort, tab switching, drawer states
- variations: Decide for me
- audience: Decide for me
- density: Decide for me
- dependency_viz: Decide for me
- charts: Decide for me
- lang: Bahasa Indonesia throughout (as PRD)
- blockers: Decide for me
- dashboard_matrix: Decide for me

## Assistant

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: show_html]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_set_props]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Built as a working prototype — 4 P0 screens live behind the sidebar, plus the ItemDrawer.

**Decisions I made on the "decide for me" answers:** kadiv-level audience (approve/monitor framing), compact 38px rows with a Rapat/Longgar toggle, horizontal stepper rail with lock icons for the 11-izin chain, real SVG cash curve, blocked states shown on Commercial + Land (BlockerBanner, disabled Simpan/Ajukan), colored-square matrix with counts.

**Interactions that work:** project switcher, all nav items, 7 module tabs, Jangka Pendek/Panjang, status filter chips, column sort, search, density toggle, matrix cells → jump to that module, permit chain → row click → drawer, "Buat checklist perizinan".

**Tokens:** PRD colors/geometry (`#0F5C6B`, `#F7F8FA`, radius 10, 13px tables) with Plus Jakarta Sans and the design system's shadow/pill/glass polish.

Tweaks panel has row density, matrix style (angka/titik), and a slider for how far the perizinan gate unlocks — useful for showing the locked-permit logic without editing data.

## User

Found issues — fixing…

## Assistant

_[tool: read_file]_

_[tool: read_file]_

The manifest shows `"components": []` — this DS exports no React components, so there's nothing to mount; but the bundle/stylesheet loads and the tokens are fair points.

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

Sizes are intact (h1 = 25px); the cramped look is just the 924px iframe vs the 1560px design.

_[tool: ready_for_verification]_

Fixed:

- **Bundle + kit stylesheet now loaded** in both DCs (`_ds_bundle.js`, `ui_kits/media_kit_website/styles.css`), verified as no style bleed — h1 still 25px.
- **DS tokens replacing invented values**: all shadows now `--shadow-xs/sm/md/lg`, pills use `--radius-pill`, topbar glass uses `--glass-bg-strong` + `--glass-blur`, body type from `--font-family-base`/`--fw-medium`.
- **Sidebar "Proyek"** now resets to the Corporate tab and clears the status filter.

On the Button component: `_ds_manifest.json` lists `"components": []` — this design system ships tokens, preview cards, and a static HTML/CSS media-kit kit, with no exported React components to mount. Nothing to swap the CTAs to, so they stay hand-composed but now on DS shadow/radius tokens.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

