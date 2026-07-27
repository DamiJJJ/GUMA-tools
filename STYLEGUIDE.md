# STYLEGUIDE.md — GUMA-Tools

Wygenerowane z kodu. Update przez `/styleguide`.

## Tech stack

- HTML5, one file per page, no templating.
- Tailwind CSS, vendored at `js/tailwind.js` (CDN build snapshot), `darkMode: 'class'`.
- Vanilla JS — no modules, no imports. Every script is a global
  `<script src="js/...">`.
- HTML5 Canvas for card / document rendering and PNG export.
- Web Components (`customElements`) for shared header + footer
  (`js/components.js`).
- Supabase REST for visit + download counters (`js/counters.js`).
- No build step. No package manager runtime. No CI build.

## File layout

```
/
├── index.html
├── about.html
├── officer_generator.html
├── firefighter_generator.html
├── business_card_generator.html
├── firearm_discharge.html
├── traffic_collision_report.html
├── personnel_file_generator.html
├── arrest_report.html
├── prehospital_care_report.html
├── readme.md
├── tailwind.config.js          # reference only (CDN reads js/tailwind-config.js)
├── manifest.json
├── assets/                     # logos, badges, favicons (192×192 PNG for factions)
└── js/
    ├── theme-init.js           # anti-FOUC + theme-aware favicon swap, runs first
    ├── tailwind.js             # Tailwind CDN snapshot
    ├── tailwind-config.js      # design tokens (colors, shadows, fonts, keyframes)
    ├── guma-styles.js          # @layer base/components/utilities rules
    ├── components.js           # <guma-header>, <guma-footer>, <guma-history-drawer>
    ├── animations.js           # page entrance animations
    ├── counters.js             # Supabase visit/download counters + Hot/Popular flags
    ├── factions.js             # FACTIONS dict (LSPD/LSSD/BCSO/SAHP/...)
    ├── streets.js              # GTA V street-name pools (LS_STREETS, BLAINE_STREETS)
    ├── random-character.js     # shared "Randomize Character" form filler
    ├── history.js              # GumaHistory — localStorage saved cards/reports engine
    ├── history-wiring.js       # GumaHistoryWiring — shared save/serialize glue
    ├── ui-helpers.js
    └── <page>.js               # one JS file per generator/report
```

## Script load order (every HTML page)

In `<head>`, in this exact order:

```html
<script src="js/theme-init.js"></script>
<script src="js/tailwind.js"></script>
<script src="js/tailwind-config.js"></script>
<script src="js/guma-styles.js"></script>
<!-- page-specific scripts at the end of <body> -->
```

`theme-init.js` **must** run before paint to avoid white-flash in dark mode.

Shared cross-page utilities (e.g. `js/random-character.js`) load in `<head>`
right after `js/guma-styles.js`. Data files they depend on load first on the
pages that need them (e.g. `js/streets.js` before `js/random-character.js`
on the personnel file page). Page-specific scripts stay at the end of `<body>`.

## HTML conventions

- `<!doctype html>` lowercase.
- `<html lang="en" class="h-full">` — site is in English even though the team
  works in PL.
- File naming: `snake_case.html` at repo root.
- Body uses Tailwind utilities + optional `theme-*` accent class:
  `<body class="theme-navy-soft flex min-h-full flex-col">`.
- Every page includes `<guma-header></guma-header>` and `<guma-footer></guma-footer>`.
- Inline event handlers (`onclick="..."`, `oninput="..."`) **are** used in this
  codebase for form bindings — match the existing style rather than wiring
  `addEventListener` unless there's a reason.
- No inline `style="..."` except where dynamically toggled (e.g.
  `style="display: none"` placeholders that JS flips).
- No `<style>` blocks. All CSS goes through `js/guma-styles.js`.
- **No emoji in UI.** Buttons and controls use inline SVG icons
  (lucide-style, 16×16, `fill="none"`, `stroke="currentColor"`,
  stroke-width 2–2.5) so the icon inherits the button's color in both
  themes. Monochrome text glyphs (`✕`, `✓`) in small action links are fine.
- **Hot/Popular flags**: mark an element with `data-generator-key="<counter
  key>"` to make it eligible for a trend badge (`applyHotFlags()` decorates
  the top-2 by download count). Index tiles use the bare attribute (corner
  pill + moved to the front of their grid); nav links add
  `data-hot-flag="icon"` (small right-edge icon, out of text flow).

## Tailwind & design tokens

Defined in `js/tailwind-config.js`. Two parallel palettes — dark and light:

| Concern    | Dark token    | Light token     |
| ---------- | ------------- | --------------- |
| Background | `guma-bg`     | `guma-l-bg`     |
| Panel      | `guma-panel`  | `guma-l-panel`  |
| Input bg   | `guma-input`  | `guma-l-input`  |
| Accent     | `guma-gold`   | `guma-l-gold`   |
| Border     | `guma-border` | `guma-l-border` |
| Text       | `guma-text`   | `guma-l-text`   |
| Muted text | `guma-muted`  | `guma-l-muted`  |

Usage pattern in markup — always pair light + dark variants:

```html
<div class="bg-guma-l-panel text-guma-l-text dark:bg-guma-panel dark:text-guma-text"></div>
```

Other tokens already defined:

- Shadows: `panel`, `glow`, `canvas` (+ `-light` variants).
- Max-width: `max-w-8xl` = 1400px.
- Font stack: `font-sans` → `Segoe UI, Arial, sans-serif`.
- Keyframes: `guma-fade-up`, header-drop, etc.

**When you need a new color/shadow, add it to `js/tailwind-config.js`.**
Never hard-code hex in markup or inline style.

## CSS layer rules (js/guma-styles.js)

Shared component classes live here under `@layer components`. Already
in use, reuse first:

- `guma-page` — max-width page container with horizontal padding.
- `guma-panel` — themed panel surface with border + shadow.
- `guma-input`, `guma-label`, `guma-form-section` — form primitives.
- `guma-page-title`, `guma-faction-switcher-wrap`, `guma-panel-form`, etc.
- `guma-seg` + `guma-seg-btn` (with `.active`) — segmented control for picking
  between a few mutually exclusive options, e.g. the card layout picker in
  `business_card_generator.html`.
- `guma-tile-flag` (+ `-corner` / `-icon` position modifiers, `-hot` /
  `-popular` color modifiers) — Hot/Popular trend badges, injected by
  `applyHotFlags()` in `js/counters.js`.

**Report form helpers (unprefixed — deliberate exception):** report-style pages
share a small set of non-`guma-` layout classes, also defined under
`@layer components` in `js/guma-styles.js` and reused across `firearm_discharge`,
`arrest_report`, `traffic_collision_report`, and `prehospital_care_report`:

- `.form-group` — label-over-input field wrapper (`.form-group label` and
  `.form-group input/select` style the children, so a bare
  `<label>…</label><input>` inside gets the full themed treatment).
- `.two-col` / `.three-col` / `.four-col` — 2/3/4-column form grids.
- `.checkbox-group` / `.checkbox-item` — vertical checkbox list + a single row
  (`<label class="checkbox-item"><input type="checkbox"> …</label>`).

These predate the `guma-` prefix rule and are the established pattern for report
forms — **reuse them as-is on new reports; don't reinvent them or rename them to
`guma-*`.** Styling for the rendered card/document surface still goes through
`guma-*` tokens and classes as usual.

Rules of thumb:

- If a class is reused in ≥ 2 places, promote it to `guma-styles.js` as a
  `guma-*` utility. Don't repeat the same `@apply` chain inline.
- All `@layer base` (resets, body background, selection) and
  `@layer utilities` (one-off helpers) live in the same file — single source
  of truth.

## JS conventions

- 2-space indent, double quotes, semicolons.
- `function name() {}` for top-level handlers wired via inline `onclick=`,
  arrow functions for callbacks.
- State vars: `let FACTION_KEY;`, `let faction;` at top of file. UPPER_SNAKE
  for true constants (`FACTIONS`, `GUMA_VERSION`), `camelCase` for everything else.
- Function names: camelCase verbs (`switchFaction`, `applyCustomFaction`,
  `populateSelects`, `randomizePay`).
- Section dividers — pad with em-dash box-drawing characters to ~60 cols:

```js
// ── Switch faction ────────────────────────────────────────────
```

- **All inline comments in English.** (A few legacy PL comments in
  `guma-styles.js` predate this rule and should be migrated when touched.)
- The codebase deliberately uses some globals (`faction`, `FACTION_KEY`) so
  inline `onclick` handlers can call them. Match the surrounding pattern —
  don't introduce a module system just for one file.
- **Shared data files**: static lookup pools live in their own `/js/` file as
  top-level `UPPER_SNAKE` consts (`FACTIONS` in `factions.js`, `LS_STREETS` /
  `BLAINE_STREETS` in `streets.js`). Loaded via plain `<script>` before any
  consumer; consumers guard with `typeof X !== "undefined"` when the data may
  be absent on a page.
- **Shared feature utilities**: cross-page logic (e.g. `js/random-character.js`)
  is wrapped in an IIFE exposing a single `window.*` entry point
  (`window.randomizeCharacter(generatorKey)`); it feature-detects the current
  page via `document.getElementById(...)` and `typeof` checks on page globals
  instead of forking per-page variants.

## Naming

| Thing                | Convention                    | Example                                                  |
| -------------------- | ----------------------------- | -------------------------------------------------------- |
| HTML files           | snake_case                    | `firearm_discharge.html`                                 |
| JS files             | kebab-case                    | `business-card.js`, `arrest-report.js`, `prehospital-care-report.js` |
| HTML IDs             | camelCase                     | `customFactionPanel`, `photoInput`                       |
| Tailwind utilities   | kebab-case (Tailwind default) | `bg-guma-l-panel`                                        |
| Custom component cls | kebab + `guma-` prefix        | `guma-input`, `guma-panel`                               |
| JS functions         | camelCase                     | `switchFaction()`                                        |
| JS constants         | UPPER_SNAKE_CASE              | `FACTIONS`, `GUMA_VERSION`                               |

New JS files use **kebab-case** — cards *and* reports alike
(`arrest-report.js`, `traffic-collision-report.js`, `prehospital-care-report.js`).
`firearm_discharge_investigation.js` is a lone legacy snake_case holdover; don't
copy it. Paired HTML pages stay `snake_case.html` regardless.

## Theming (dark / light)

- Dark is default. `theme-init.js` reads `localStorage["guma-theme"]` and
  toggles `html.dark` synchronously before first paint.
- Light/dark toggle lives in the header (`<guma-header>`, see `components.js`).
- Pages using the logo favicon (`index`, `about`) get it swapped to the
  light/dark variant by `gumaApplyThemeFavicon()` (`theme-init.js`), re-run
  on every toggle; generator pages keep their own static favicons.
- Per-page accent: add `theme-navy`, `theme-navy-soft`, or `theme-red` to
  `<body>` — these only affect dark-mode background gradients.
- **Every visual change must be checked in both modes.** New `guma-*` classes
  must include `dark:` variants where needed.

## Adding a new generator (checklist)

1. Create `<name>.html` at repo root. Copy structure from the closest
   existing generator. Include the 4 head scripts in order.
2. Add body class: `theme-navy-soft` (cards), `theme-red` (fire), default
   navy for index/business-card.
3. Drop in `<guma-header>` + `<guma-footer>`.
4. Create `js/<name>.js` (kebab-case, even for reports). Page-specific logic
   only — shared helpers go to `js/ui-helpers.js` or a new shared file. Reports
   reuse the `.form-group` / `.two-col` / `.checkbox-item` form helpers.
5. Register the page in `js/components.js` — update the `isCard` / `isReport`
   arrays and the dropdown + mobile link lists (with `data-generator-key` +
   `data-hot-flag="icon"`), so the header highlights correctly and the page
   participates in Hot/Popular flags. Add the same `data-generator-key` to
   its `index.html` tile.
6. Wire **Saved Cards / Reports** (see the section below): page-specific
   `serialize` / `hydrate` / `buildLabel` (+ `buildFaction`), one
   `GumaHistoryWiring.register({...})`, `await GumaHistoryWiring.save(canvas)`
   in Download + Copy, and the 3 markup additions (Saved button, drawer,
   `history.js` + `history-wiring.js` first).
7. Update `readme.md`: add a row to the **Available Generators** table and
   a Features sub-section (use `/readme`).
8. Add a faction icon / asset to `assets/` if needed (192×192 PNG to match
   the rest).
9. Test in light + dark. Test PNG download and clipboard copy paths, plus
   save → reload from the drawer.
10. Use `/commit` for the commit message, `/changelog` for the announcement.

## Saved Cards / Reports (history)

Every generator can persist exported documents to `localStorage` and reload
them into the form. The engine is **generator-agnostic** — you only wire the
page-specific parts.

Three shared pieces (don't fork them):

- **`js/history.js`** → `window.GumaHistory`: storage API (`save` / `list` /
  `load` / `setPinned` / `remove` / `clear` / `subscribe`) keyed by
  `guma:history:<key>`. Dedup of identical consecutive saves, pinned-aware
  FIFO trim (limit 10 unpinned), quota recovery. Plus helpers
  `_downscaleAvatar`, `_makeThumbnail`.
- **`js/history-wiring.js`** → `window.GumaHistoryWiring`: owns the save
  orchestration, the `GUMA_*` globals and the universal faction descriptor.
  API: `register(cfg)`, `save(canvas)`, `buildFaction(payload, opts)`,
  `setVal(id, v)`, `setChecked(id, v)`.
- **`<guma-history-drawer>`** (in `js/components.js`): the whole drawer UI
  (list, pin, remove, clear-all modal, counter, faction badge). Reads
  `window.GUMA_GENERATOR_KEY`, `window.GUMA_GENERATOR_NOUN`, and calls
  `window.GUMA_HYDRATE`. **Don't touch the drawer** to wire a new page.

### Globals the engine reads

| Global                   | Set by                  | Purpose                                  |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `GUMA_GENERATOR_KEY`     | `register({ key })`     | storage namespace (`guma:history:<key>`) |
| `GUMA_GENERATOR_NOUN`    | `register({ noun })`    | `"card"` (default) or `"report"` — drawer copy |
| `GUMA_HYDRATE`           | `register({ hydrate })` | function the drawer calls on load        |

`noun` = `"card"` for cards/business cards, `"report"` for report-style docs
(firearm, traffic, personnel) — drives "Saved Cards" vs "Saved Reports".

### Wiring a new generator (recipe)

In `js/<page>.js`, write only the page-specific functions, then register:

```js
// ── Saved cards: serialize / hydrate / wiring ─────────────────
function pgSerializeState() {
  // JSON-friendly snapshot of the real form fields. May be async if there's
  // a photo: photoDataUrl = await GumaHistory._downscaleAvatar(src, w, h)
  // (use the real canvas slot dims). Stable output — no random/time fields.
}
function pgHydrateState(payload) {
  // Inverse, safe (missing field = no-op). Faction first (switchFaction(...)),
  // then GumaHistoryWiring.setVal / setChecked, then rebuild dynamic rows in
  // saved order, then call the page's render fn (generate.../refreshPreview()).
}
function pgBuildLabel(payload) {
  // Short human title from the key fields. Don't repeat info already shown by
  // the corner faction badge.
}

GumaHistoryWiring.register({
  key: "<unique-key>",
  noun: "report", // or "card"
  serialize: pgSerializeState,
  hydrate: pgHydrateState,
  buildLabel: pgBuildLabel,
  // omit buildFaction entirely if the page has no faction switcher
  buildFaction: (p) =>
    GumaHistoryWiring.buildFaction(p, { customShort: (pp) => /* custom name */ "" }),
});
```

Then in the page's Download **and** Copy handlers, after the PNG is in its
final state, call `await GumaHistoryWiring.save(canvas)` (the real page canvas).
`save()` picks the thumbnail source automatically: `payload.photoDataUrl` if
present, otherwise the canvas.

Markup (3 additions):

1. **Saved button** in the preview-panel header (next to "Preview"/"Document",
   far right), `border-2` gold accent — copy the block from any wired page.
   The drawer updates `#gumaHistoryCount` itself (shows `0` when empty).
2. `<guma-history-drawer></guma-history-drawer>` just before `</body>`.
3. End-of-body script order: `history.js` → `history-wiring.js` first, then
   `components.js` and the page JS:

```html
<script src="js/history.js"></script>
<script src="js/history-wiring.js"></script>
<!-- ...components.js, page JS, etc. -->
```

### Rules

- **Faction descriptor stores a path only** (`FACTIONS[key].icon` /
  `assets/custom.png`) — never base64. Pages without factions: omit
  `buildFaction`, the badge just won't render.
- Serialize output must be **stable** — dedup compares `JSON.stringify(payload)`.
- Dynamic rows: serialize an array, hydrate by clearing the container,
  resetting its counter, and re-adding rows in saved order (mind whether the
  page's add-row prepends or appends).
- No `alert`/`confirm` — "✕ Remove" deletes immediately; the only modal is the
  drawer's built-in "Clear all".

## Things to avoid

- Static `.css` files.
- `<style>` blocks in HTML.
- Emoji in buttons or GUI copy — use inline SVG icons (see HTML conventions).
- New CDN scripts without explicit approval.
- `npm install` / build steps / module bundlers.
- ES module `import` / `export`.
- Hex colors hard-coded in markup or inline style — always go through tokens.
- Renaming public-facing file paths without updating every internal link
  (header dropdowns in `components.js`, readme tables, `index.html` tiles).
