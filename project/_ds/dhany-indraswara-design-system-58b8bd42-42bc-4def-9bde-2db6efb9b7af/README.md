# Dhany Indraswara — Media Kit Design System

A design system for **Dhany Indraswara**, a creator brand focused on practical educational content around Data Analytics, Power BI, Dashboard Design, AI for Productivity, Digital Product, Business Process, and Career Growth.

This system powers a **one-page media kit website** aimed at brand/sponsor collaboration, with a primary focus on **Instagram content partnerships**.

> **Sources provided to build this system:** none — built from the brief in the project prompt. No codebase, Figma, or slide deck was attached. All visuals are constructed directly from the brand guidance (colors, type, voice, motifs). If you have official logo files, asset packs, or a Figma library, drop them into `assets/` and re-run the system to refine.

---

## Brand snapshot

- **Who:** Dhany Indraswara — data analytics & BI educator, digital product builder, content creator.
- **Primary audience:** AI learners, data analysts, BI developers, business professionals, career growers.
- **Primary platform:** Instagram (35.5K+ followers).
- **Tone:** Simple, intelligent, practical, useful, credible, friendly, sponsor-ready.
- **Vibe:** Premium creator media kit — not a corporate company profile.

---

## Content fundamentals

The voice is **direct, useful, and warm** — a real person who teaches, not a corporate brochure.

**Rules of the voice**
- **Lead with the value.** Say what the reader gets in the first sentence. ("Practical, no-fluff content for data and AI learners.")
- **Short sentences.** One idea per line. Prefer five-word headlines over ten-word ones.
- **Personal "I", inclusive "you".** Dhany speaks in the first person when introducing himself ("I teach…"), and uses "you" / "your brand" when talking to sponsors.
- **No jargon, no buzzwords.** Avoid: *synergy, leverage, ecosystem, world-class, cutting-edge, game-changing*. Prefer: *useful, practical, clear, actionable, real*.
- **Numbers, not adjectives.** "35,500+ followers" instead of "a massive audience." Always cite the metric.
- **Sentence case** everywhere. Headings, CTAs, navigation. No `Title Case For Headings`.
- **Active voice.** "Brands sponsor a carousel" ✓ vs. "Carousels are sponsored by brands" ✗.
- **No emoji in body copy.** Emoji are acceptable as a sparing visual marker in chips/badges (e.g. ✦ or a single ✓), but never inside paragraphs.

**Casing & punctuation**
- Headings: sentence case ("Why brands work with me").
- Buttons: sentence case, no period ("Start a collaboration").
- Metrics: use comma separators ("35,500+"), with a `+` to denote "and growing".
- Always pair a number with a plain-language unit on the same line ("21K · Facebook reach").

**Examples (copy patterns to reuse)**

- Hero subhead: *"Practical, educational content for data, BI, and AI professionals — built for brands that want real reach with the right audience."*
- About: *"I'm Dhany. I teach Power BI, data analytics, and AI for productivity to a working audience of analysts, BI developers, and business pros."*
- CTA: *"Let's collaborate"* / *"Start a project together"* / *"See collaboration options"*.
- Empty stat caption: *"Engaged daily. Verified by platform analytics."*

---

## Visual foundations

**Overall feel.** Clean, modern, premium, personal, friendly, professional. The page should feel like a **creator's portfolio + media kit hybrid** — light, airy, with one or two anchored glass cards per section. Not corporate, not playful-cartoony.

**Backgrounds.** Light. The page is layered like this, back to front:
1. A near-white page (`#F7F8FA`) with a subtle radial wash toward soft-blue in the top-left.
2. Two or three **blurred orbs** of `--halo-primary` (cyan) and `--halo-secondary` (royal blue), 380–620px wide, opacity ~40–60%, placed asymmetrically per section.
3. Section content sits on top, often inside **glass cards** (white at ~55% opacity, `backdrop-filter: blur(28px) saturate(140%)`, 1px white border at 65% opacity).

There are **no full-bleed photos**, no repeating patterns, no textures, no grain. The richness comes entirely from blur + light + glass.

**Color usage**
- `#02A0C1` (cyan-teal) is the primary brand color — used for the hero gradient orb, primary CTA fill, link color, eyebrow labels, and the dominant data-viz accent.
- `#3581E1` (royal blue) is the secondary — used for the second orb, secondary CTAs (outline), and chart bars/segments.
- `#D6FD91` (lime accent) is reserved for **emphasis chips and availability badges** ("Open for collabs", "Available Q2"). Never use as a large surface.
- `#97D1C6` (soft teal) is used for muted icon backings, supporting illustration fills, and 1:1 collab-options chips.
- `#D7E8FB` (soft blue) is the dominant pill / chip / quiet card background.
- `#EDEDED` is the section divider / outline tint.
- `#1F1F1F` is the main text. Never pure black.

**Typography.** Plus Jakarta Sans, weights 500 / 600 / 700 / 800.
- Display & H1 use **800 ExtraBold**, tracking tight (`-0.02em`).
- H2/H3 use **700 Bold**.
- Body uses **500 Medium** for readability at 16–18px. **Never** 400.
- Eyebrows: 13px Bold, uppercase, `letter-spacing: 0.08em`, colored `--brand-primary`.
- Long-form body: `text-wrap: pretty;` on paragraphs; `text-wrap: balance;` on headings.

**Cards.**
- **Glass card** (hero stat tiles, audience snapshot, social reach tiles): rounded `--radius-lg` (28px), white at 55% opacity, backdrop blur, 1px white border, soft inset highlight on the top edge.
- **Solid card** (collab options, content pillars): white background, 1px line in `--neutral-line`, `--shadow-md`, rounded `--radius-md` (20px).
- **Pill card** (audience chips): `--radius-pill`, `--brand-soft-blue` background, body text in `--text-primary`.

**Corner radii.** Almost everything is rounded. The system uses 8 / 14 / 20 / 28 / 36 / pill. Buttons are **pill** by default. Cards lean to **20–28px**. Avatars are **circular**.

**Shadows.** Soft, low-opacity, vertical-only. Two layers: `--shadow-md` for cards, `--shadow-lg` for hero / dominant cards. Brand CTAs get a glow shadow (`--shadow-glow-primary`) instead of a neutral one. Inner highlights (`--shadow-inner-soft`) sit on top of glass to mimic light catching the edge.

**Borders.** Hairline (1px). Glass borders are white at 65%. Solid card borders are `#E6E8EC`. No 2px borders, no dashed.

**Spacing & layout.**
- Generous whitespace. Sections are 96–120px tall vertical padding on desktop.
- Content max-width: **1200px**, centered, with 32px gutters.
- Section internal grid: 12-column, 24px gap.
- Inter-element rhythm uses the 4 / 8 / 12 / 16 / 24 / 40 / 64 spacing scale.
- Headers/footers are not fixed — the page scrolls naturally. The nav can be sticky with `backdrop-filter` once it leaves the hero.

**Imagery vibe.** Cool, bright, slightly desaturated. Portraits are warmed slightly to feel human against the cool background. Always cut out (no rectangle photos behind hero) — Dhany's portrait floats over the gradient orbs as if cut out and dropped in. Use generous halo behind portraits.

**Iconography vibe.** Outline icons, 1.5–2px stroke, rounded line caps. See ICONOGRAPHY below.

**Hover states.**
- Buttons: lift 1px (`translateY(-1px)`), shadow intensifies (`--shadow-glow-primary`), 180ms ease-out.
- Cards: lift 2px, shadow goes from `--shadow-md` → `--shadow-lg`, border tint warms 4%.
- Links: underline appears on hover (offset 4px, decoration 2px solid `--brand-primary`).
- Icons: scale 1.05.

**Press / active.**
- Buttons: `translateY(0)`, shadow snaps to `--shadow-sm`. Slight color darken (~6%).
- No "shrink" press; the system feels solid.

**Animation.**
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) for arrivals; `cubic-bezier(0.4, 0, 0.2, 1)` for hover/exits.
- Durations: 180ms (hover), 320ms (modal/section reveal), 600ms (hero stagger).
- Effects are subtle: fade-up by 8–16px, **no bounces**, no parallax. Halos breathe slowly (~12s) — optional, off if `prefers-reduced-motion`.

**Transparency & blur.** Used heavily, but with restraint:
- Glass cards (always on a page with orbs behind them).
- Sticky nav (after scroll).
- Halo accents.
- Never use blur on hover (causes jank). Never blur photos.

**Layout rules**
- One hero portrait, one glass stat stack, in every page header.
- Section eyebrow → H2 → optional subhead → content. Always in that order.
- Numbers always live in their own card; they are not embedded in paragraphs.

---

## Iconography

The system uses **[Lucide](https://lucide.dev)** as the icon set, loaded via CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

**Why Lucide.** Lucide's 24×24 outline icons with 2px stroke + rounded caps match the brand's clean, friendly, modern feel. No icon set was supplied by the brand — Lucide is the closest match and is the documented substitute. If Dhany supplies a custom icon set, drop the SVGs into `assets/icons/` and update components to use them.

**Rules**
- Stroke width: **2px**. Never fill icons except inside stat tiles where a 1px-stroke filled variant is acceptable.
- Default size: **20px** inline, **24px** standalone, **32px** in feature cards.
- Color: `currentColor`. In feature cards, place icons inside a 48×48 rounded square (`--radius-md`) with `--brand-soft-blue` background and `--brand-primary` icon color.
- Brand/social icons (Instagram, TikTok, X, LinkedIn, Facebook) come from Lucide as well.

**Emoji.** Not used in body copy. Acceptable in eyebrows as a single mark (e.g. `✦ Open for collabs`). Never use full emoji in headings.

**Unicode marks used as design elements.** `·` (middle dot) as a separator in meta rows; `→` as a CTA arrow; `+` as the metric "and growing" marker.

---

## Index — what's in this folder

| File / folder | Purpose |
|---|---|
| `README.md` | This file — brand context, content & visual foundations, iconography. |
| `SKILL.md` | Agent skill front-matter; lets this be invoked as a Claude Skill. |
| `colors_and_type.css` | All design tokens (color, type, spacing, radius, shadow). |
| `preview/` | One small HTML card per token/component cluster — populates the Design System tab. |
| `ui_kits/media_kit_website/` | The one-page media kit website UI kit: `index.html` + JSX components. |
| `assets/` | Logos, marks, and any imagery. |

**UI kits in this project**
- `ui_kits/media_kit_website/` — the full one-page brand/sponsor media kit. Sections: Hero → About → Audience → Reach → Why work with me → Content pillars → Collaboration options → Social proof → Process → Final CTA → Footer.

---

## Caveats / things to flag

- **No source assets were supplied.** No logo files, brand library, or codebase. The system is built directly from the written brief and the photo you uploaded for the hero. If you have official logo files or a brand library, drop them into `assets/` and re-run the system.
- **Plus Jakarta Sans** is **self-hosted** from `fonts/` (weights 200–800 + italics). A Google Fonts `@import` is also included as a fallback for environments that don't have the local files.
- **Icons** use Lucide (CDN) for UI icons and Simple Icons (CDN) for brand/social logos.
- **Audience demographics** (age, gender, top international markets) are illustrative placeholders. Replace with real Instagram Insights numbers when ready.

---

## Deploying on GitHub Pages

This repo is structured to serve directly from GitHub Pages:

1. **Push** the repo to GitHub (already done if you're reading this on github.com).
2. **Enable Pages:** GitHub → repo Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / root.
3. Your site goes live at `https://<your-username>.github.io/<repo>/` — the root `index.html` redirects to the media kit.
4. **Custom domain (optional):** the `CNAME` file in this repo points at `mediakit.dhanyindraswara.com`. To use it:
   - Add a CNAME DNS record at your registrar: `mediakit` → `dhanyindraswara.github.io`
   - In GitHub → Settings → Pages → Custom domain, paste `mediakit.dhanyindraswara.com` and Save
   - Wait for the DNS check to pass, then tick **Enforce HTTPS**

### Manual asset uploads needed

The GitHub API client used to push this project can only send text files. Two binary asset folders must be uploaded manually via the GitHub web UI (drag-and-drop in the "Add file → Upload files" menu):

- `fonts/` — 14 `.ttf` files for self-hosted Plus Jakarta Sans
- `assets/dhany-portrait.jpg` — your hero portrait

The site works without these (it falls back to Google Fonts and shows a placeholder), but uploading them gives you the full self-hosted, on-brand experience.
