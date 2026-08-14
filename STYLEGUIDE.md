# STYLEGUIDE.md - GUMA-Tools

Generated from the code. Regenerate with `/styleguide`.

## Tech stack

- HTML5, one file per page, no templating.
- Tailwind CSS, vendored at `js/tailwind.js` (CDN build snapshot), `darkMode: "class"`.
- Vanilla JS - no modules, no imports. Every script is a global
  `<script src="js/...">`.
- HTML5 Canvas for card / document rendering, PNG export and clipboard copy.
- Web Components (`customElements`) for shared header, footer, history drawer
  and export preview modal (`js/components.js`).
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
├── personnel_file_generator.html
├── bodycam_overlay.html
├── firearm_discharge.html
├── traffic_collision_report.html
├── arrest_report.html
├── prehospital_care_report.html
├── investigative_report.html
├── readme.md
├── STYLEGUIDE.md
├── tailwind.config.js          # reference only (CDN reads js/tailwind-config.js)
├── manifest.json
├── assets/                     # logos, badges, favicons (192x192 PNG for factions)
│   └── screenshots/            # showcase PNGs, one per generator page
└── js/
    ├── theme-init.js           # anti-FOUC + theme-aware favicon swap, runs first
    ├── tailwind.js             # Tailwind CDN snapshot
    ├── tailwind-config.js      # design tokens + animation component classes
    ├── guma-styles.js          # @layer base/components/utilities rules
    ├── components.js           # <guma-header>, <guma-footer>,
    │                           # <guma-history-drawer>, <guma-preview-modal>
    ├── animations.js           # scroll reveal + tile stagger
    ├── counters.js             # Supabase visit/download counters + Hot/Popular flags
    ├── latest-video.js         # GumaLatestVideo - "Latest Video" tile on the index
    ├── factions.js             # FACTIONS dict (LSPD/LSSD/BCSO/SAHP/...)
    ├── streets.js              # GTA V street-name pools (LS_STREETS, BLAINE_STREETS)
    ├── random-character.js     # shared "Randomize Character" form filler
    ├── history.js              # GumaHistory - localStorage saved cards/reports engine
    ├── history-wiring.js       # GumaHistoryWiring - shared save/serialize glue
    ├── guma-clipboard.js       # GumaClipboard - canvas -> clipboard, one error copy
    ├── guma-upload.js          # GumaUpload - dropzone: click, drag & drop, paste
    ├── guma-fit.js             # GumaFit - shrink-to-fit text + input caps
    ├── photo-crop.js           # GumaPhotoCrop - drag/zoom photo inside the card frame
    ├── canvas-edit.js          # GumaCanvasEdit - WYSIWYG editing on the document
    ├── ui-helpers.js           # buildFactionSwitcher() and small shared UI bits
    ├── tire-spin.js            # GumaTireSpin - rolling-tire SVG (about page)
    ├── easter-egg.js           # hidden burnout easter egg, opt-in via [data-guma-egg]
    ├── bodycam-*.js            # bodycam overlay: cameras/layers/render/stage/page
    └── <page>.js               # one JS file per generator/report
```

## Script load order

In `<head>`, in this exact order:

```html
<script src="js/theme-init.js"></script>
<script src="js/tailwind.js"></script>
<script src="js/tailwind-config.js"></script>
<script src="js/guma-styles.js"></script>
```

`theme-init.js` **must** run before paint to avoid a white flash in dark mode.

Cross-page utilities that pages call early (`js/guma-clipboard.js`,
`js/random-character.js`) also load in `<head>`, right after `js/guma-styles.js`.
Data files load before their consumers (e.g. `js/streets.js` before
`js/random-character.js`).

Everything else goes at the end of `<body>`, and order matters - each shared
module must precede the page JS that calls it. The two established tails:

```html
<!-- Card generators (officer_generator.html) -->
<script src="js/history.js"></script>
<script src="js/history-wiring.js"></script>
<script src="js/counters.js"></script>
<script src="js/components.js"></script>
<script src="js/factions.js"></script>
<script src="js/ui-helpers.js"></script>
<script src="js/guma-upload.js"></script>
<script src="js/guma-fit.js"></script>
<script src="js/photo-crop.js"></script>
<script src="js/app.js"></script>
<script src="js/animations.js"></script>
```

```html
<!-- Report generators (prehospital_care_report.html) -->
<script src="js/history.js"></script>
<script src="js/history-wiring.js"></script>
<script src="js/guma-fit.js"></script>
<script src="js/canvas-edit.js"></script>
<script src="js/prehospital-care-report.js"></script>
<script src="js/counters.js"></script>
<script src="js/components.js"></script>
<script src="js/animations.js"></script>
```

## HTML conventions

- `<!doctype html>` lowercase.
- `<html lang="en" class="h-full">` - the UI is in English even though the team
  works in PL. `about.html` is the exception: its copy is Polish.
- File naming: `snake_case.html` at repo root.
- Body uses Tailwind utilities plus an optional `theme-*` accent class:
  `<body class="theme-navy-soft flex min-h-full flex-col">`.
- Every page includes `<guma-header></guma-header>` and `<guma-footer></guma-footer>`.
- Inline event handlers (`onclick="..."`, `oninput="..."`) **are** used here for
  form bindings - match the existing style rather than wiring `addEventListener`
  unless there is a reason.
- No inline `style="..."` except where JS toggles it (e.g. `style="display:none"`
  placeholders).
- No `<style>` blocks. All CSS goes through `js/guma-styles.js`.
- **No emoji in UI.** Buttons and controls use inline SVG icons (lucide-style,
  16x16, `fill="none"`, `stroke="currentColor"`, stroke-width 2-2.5) so the icon
  inherits the button colour in both themes. Monochrome text glyphs (`✕`, `✓`)
  in small action links are fine.
- **Hot/Popular flags**: mark an element with `data-generator-key="<counter key>"`
  to make it eligible for a trend badge (`applyHotFlags()` decorates the top 2 by
  download count). Index tiles use the bare attribute (corner pill, moved to the
  front of their grid); nav links add `data-hot-flag="icon"` (small right-edge
  icon, out of the text flow).

## Tailwind & design tokens

Defined in `js/tailwind-config.js`. Two parallel palettes, dark and light:

| Concern    | Dark token    | Light token     |
| ---------- | ------------- | --------------- |
| Background | `guma-bg`     | `guma-l-bg`     |
| Panel      | `guma-panel`  | `guma-l-panel`  |
| Input bg   | `guma-input`  | `guma-l-input`  |
| Accent     | `guma-gold`   | `guma-l-gold`   |
| Border     | `guma-border` | `guma-l-border` |
| Text       | `guma-text`   | `guma-l-text`   |
| Muted text | `guma-muted`  | `guma-l-muted`  |

Usage in markup - always pair the light and dark variants:

```html
<div class="bg-guma-l-panel text-guma-l-text dark:bg-guma-panel dark:text-guma-text"></div>
```

Other tokens:

- Shadows: `panel`, `glow`, plus `panel-light` / `glow-light`.
- Max width: `max-w-8xl` = 2000px.
- Font stack: `font-sans` -> `Segoe UI, Arial, sans-serif`.
- Keyframes + `animation` entries: `guma-fade-up`, `guma-fade-up-dim`,
  `guma-fade-in`, `guma-slide-in-left` / `-right`, `guma-header-drop`,
  `guma-mobile-open`, `guma-slide-up-out`, `guma-dropdown-open`,
  `guma-rubber-ball`, and the `guma-egg-*` set (easter egg).

**A new colour or shadow goes into `js/tailwind-config.js`.** Never hard-code a
hex value in markup or an inline style.

`js/tailwind-config.js` also injects a second `<style type="text/tailwindcss">`
block holding the *animation* component classes (`guma-anim-header-drop`,
`guma-page-title`, `guma-panel-form`, `guma-panel-preview`, `guma-reveal`,
`guma-tile-stagger`, `guma-card`, `guma-card-disabled`, `guma-anim-rubber`).
Structural and visual component classes live in `js/guma-styles.js`. Keep the
split: motion in the config file, everything else in the styles file.

## CSS layer rules (js/guma-styles.js)

One IIFE injecting one `<style type="text/tailwindcss">` with all three layers.
Sections are separated by `/* ─── Title ─── */` comments, in this order: Layout,
Panels, Upload dropzone, Themed scrollbar, Canvas preview, Photo cropping, Section
titles, Index tiles, Latest video widget, Form labels/inputs, Buttons, Form
section header, Faction switcher, Segmented control, Bodycam stage, Report
dynamic rows, Form grid helpers, Checkbox group, WYSIWYG canvas editing,
Easter egg.

Reuse before adding:

- `guma-page` - max-width page container with horizontal padding.
- `guma-panel` - themed panel surface with border + shadow.
- `guma-input`, `guma-label`, `guma-form-section` - form primitives.
- `guma-seg` + `guma-seg-btn` (with `.active`) - segmented control for a few
  mutually exclusive options (card layout picker, zoom control).
- `guma-tile-flag` (+ `-corner` / `-icon` position modifiers, `-hot` /
  `-popular` colour modifiers) - Hot/Popular badges, injected by `applyHotFlags()`.
- `guma-zoom-*` - the shared zoom segmented control, used by both the WYSIWYG
  toolbar and `<guma-preview-modal>`.

**Report form helpers (unprefixed - deliberate exception):** report pages share a
set of non-`guma-` layout classes, also under `@layer components`, reused across
`firearm_discharge`, `arrest_report`, `traffic_collision_report`,
`prehospital_care_report` and `investigative_report`:

- `.form-group` - label-over-input wrapper (`.form-group label` and
  `.form-group input/select` style the children, so a bare
  `<label>…</label><input>` inside gets the full themed treatment).
- `.two-col` / `.three-col` / `.four-col` - 2/3/4-column form grids.
- `.checkbox-group` / `.checkbox-item` - vertical checkbox list plus one row.

These predate the `guma-` prefix rule and are the established pattern for report
forms - **reuse them as-is on new reports; do not reinvent or rename them.**
The rendered document surface still uses `guma-*` tokens and classes.

Rules of thumb:

- A class reused in 2 or more places gets promoted to `guma-styles.js` as a
  `guma-*` class. Do not repeat the same `@apply` chain inline.
- `@layer base` (resets, body background, selection) and `@layer utilities`
  (one-off helpers) live in the same file - single source of truth.
- `guma-header { display: contents }` in `@layer base` is load-bearing: without
  it the custom-element host becomes the sticky `<header>`'s containing block and
  the sticky effect dies. Do not "clean it up".

## Shared JS modules

Each is an IIFE exposing one `window.*` object. Feature-detect and reuse instead
of forking a per-page variant.

| Module | Global | What it owns |
| ------ | ------ | ------------ |
| `guma-clipboard.js` | `GumaClipboard` | canvas -> PNG -> clipboard, plus the single insecure-context / unsupported error copy |
| `guma-upload.js` | `GumaUpload` | `init()` on a dropzone: click, keyboard, drag & drop and paste routing |
| `guma-fit.js` | `GumaFit` | `fitFont`, `fitBlock`, `wrapLines`, `colFonts`, `capFor`, `applyCaps`, `applyCapsBySelector` |
| `photo-crop.js` | `GumaPhotoCrop` | `attach`, `setSource`, `paint`, `hasImage`, `getState`, `setState`, `reset` |
| `canvas-edit.js` | `GumaCanvasEdit` | `attach`, `begin`, `field`, `action`, `end`, `schedule`, `commitEdit`, `cancelEdit`, `isEditing`, `setZoom`, `fitZoom` |
| `history.js` | `GumaHistory` | localStorage store, thumbnails, quota recovery |
| `history-wiring.js` | `GumaHistoryWiring` | `register`, `save`, `buildFaction`, `setVal`, `setChecked` |
| `counters.js` | `GumaCounters` | Supabase counters, `initDownloadCounter`, `applyHotFlags` |
| `random-character.js` | `randomizeCharacter(generatorKey)` | shared form filler |
| `tire-spin.js` | `GumaTireSpin` | tread-only rotation of `assets/tire.svg` |

### Shrink-to-fit text (`GumaFit`)

Overlong values are scaled down, never cut with an ellipsis. `applyCaps` /
`applyCapsBySelector` set `maxLength` on `<input>`s from the real cell width, so
the form cannot hold more than the document can print. `applyCaps` only touches
`<input>` - a `<textarea>` needs its own `maxlength` in the markup.

### WYSIWYG editing (`GumaCanvasEdit`)

A page registers hitboxes during its normal draw pass, then attaches:

```js
window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "firearm",
});
```

A field's `kind` is one of `text | check | select | date | datetime | time |
multiline`. `multiline` is inferred when the source element is a `<textarea>` and
opens a floating `<textarea>` (`.guma-ce-editor-multi`) over the narrative boxes:
Enter inserts a newline, Tab advances, Escape reverts. Editing is gated behind a
media query - it stays off on small screens.

### Export & preview modal (`window.GumaExport`)

Every generator exposes its export to `<guma-preview-modal>` instead of wiring
its own download / copy buttons:

```js
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
  // optional, multi-page documents only:
  pages: () => [{ label: "Investigative Report", canvas: page1 }, ...],
};
```

Routing exports through the modal keeps counters and history firing from one
place. The modal opens at the zoom that fits the whole document and offers a
segmented zoom control, ctrl+wheel and a fit-following resize handler.

**Multi-page documents (`investigative_report`):** both sheets render stacked on
the ONE page canvas (white page rects separated by a `PAGE_GAP` strip), so the
preview modal, history, clipboard and canvas-edit wiring keep working unchanged.
Each page's height comes from running the same draw function once against a 1x1
measuring canvas with hitbox registration gated off (`REG` flag), then once for
real - no hand-maintained height formula. When `pages()` is present the modal
shows one sheet at a time with a `‹ Page n / N ›` pager (arrow keys work) and
passes the visible index into `download(pageIndex)` / `copy(pageIndex)`, so each
sheet exports as its own readable PNG. History always stores the full stacked
document.

### Multi-file features

When one feature outgrows a single file, split it by responsibility and keep the
`<feature>-<part>.js` naming, as the bodycam overlay does:

- `bodycam-cameras.js` - static camera data
- `bodycam-layers.js` - geometry
- `bodycam-render.js` - drawing + pixel effects, owns `state`
- `bodycam-stage.js` - direct manipulation on the frame
- `bodycam-overlay.js` - page wiring only

## JS conventions

- `"use strict";` at the top of every file.
- 2-space indent, double quotes, semicolons.
- `function name() {}` for top-level handlers wired via inline `onclick=`;
  arrow functions for callbacks.
- State vars at the top of the file (`let FACTION_KEY;`, `let faction;`).
  `UPPER_SNAKE` for true constants (`FACTIONS`, `GUMA_VERSION`), `camelCase` for
  everything else.
- Function names are camelCase verbs (`switchFaction`, `applyCustomFaction`,
  `populateSelects`, `randomizePay`). Page-specific helpers may take a short
  page prefix (`fdSerializeState`, `bcamRender`).
- Section dividers - pad with box-drawing characters to about 60 columns:

```js
// ── Switch faction ────────────────────────────────────────────
```

- **All comments in English**, inline and JSDoc alike. A few legacy PL comments
  survive in `guma-styles.js`, `tailwind-config.js` and `components.js`; migrate
  them when you touch those lines.
- Some globals are deliberate (`faction`, `FACTION_KEY`) so inline `onclick`
  handlers can reach them. Match the surrounding pattern - do not introduce a
  module system for one file.
- **Shared data files**: static lookup pools live in their own `/js/` file as
  top-level `UPPER_SNAKE` consts (`FACTIONS`, `LS_STREETS`, `BLAINE_STREETS`).
  Consumers guard with `typeof X !== "undefined"` when the data may be absent.
- **Shared feature utilities**: wrapped in an IIFE exposing a single `window.*`
  entry point; they feature-detect the page via `document.getElementById(...)`
  and `typeof` checks instead of forking per-page variants.
- Optional chaining on shared globals (`window.GumaCanvasEdit?.attach(...)`) so a
  page still works when a module is not loaded.

## Naming

| Thing                | Convention                    | Example                                                              |
| -------------------- | ----------------------------- | -------------------------------------------------------------------- |
| HTML files           | snake_case                    | `firearm_discharge.html`                                             |
| JS files             | kebab-case                    | `business-card.js`, `arrest-report.js`, `prehospital-care-report.js` |
| HTML IDs             | camelCase                     | `customFactionPanel`, `photoInput`                                   |
| Tailwind utilities   | kebab-case (Tailwind default) | `bg-guma-l-panel`                                                    |
| Custom component cls | kebab + `guma-` prefix        | `guma-input`, `guma-panel`                                           |
| Data attributes      | kebab-case                    | `data-generator-key`, `data-hot-flag`, `data-guma-egg`               |
| JS functions         | camelCase                     | `switchFaction()`                                                    |
| JS constants         | UPPER_SNAKE_CASE              | `FACTIONS`, `GUMA_VERSION`                                           |
| JS globals (modules) | `Guma` + PascalCase           | `GumaFit`, `GumaPhotoCrop`, `GumaCanvasEdit`                         |

New JS files use **kebab-case**, cards and reports alike.
`firearm_discharge_investigation.js` is a lone legacy snake_case holdover; do not
copy it. Paired HTML pages stay `snake_case.html` regardless.

## Theming (dark / light)

- Dark is the default. `theme-init.js` reads `localStorage["guma-theme"]` and
  toggles `html.dark` synchronously before first paint.
- The toggle lives in the header (`<guma-header>`, `components.js`).
- Pages using the logo favicon (`index`, `about`) get it swapped to the
  light/dark variant by `gumaApplyThemeFavicon()`, re-run on every toggle;
  generator pages keep their own static favicons.
- Per-page accent: add `theme-navy` (default), `theme-navy-soft` or `theme-red`
  to `<body>`. These only affect the dark-mode background gradient.
- **Every visual change must be checked in both modes.** New `guma-*` classes
  need `dark:` variants where relevant.

## Adding a new generator (checklist)

1. Create `<name>.html` at repo root, copying the closest existing generator.
   Include the four head scripts in order.
2. Add the body accent class: `theme-navy-soft` (cards, most reports),
   `theme-red` (fire), default navy for index / business card.
3. Drop in `<guma-header>` + `<guma-footer>`.
4. Create `js/<name>.js` (kebab-case, even for reports). Page-specific logic
   only - shared helpers go to an existing module or a new shared file. Reports
   reuse `.form-group` / `.two-col` / `.checkbox-item`.
5. Expose `window.GumaExport` and add `<guma-preview-modal>`; do not build your
   own download/copy button pair.
6. Register the page in `js/components.js` - the `isCard` / `isReport` / `isImage`
   arrays and the dropdown + mobile link lists (with `data-generator-key` and
   `data-hot-flag="icon"`), so the header highlights correctly and the page joins
   the Hot/Popular flags. Add the same `data-generator-key` to its `index.html`
   tile.
7. Wire **Saved Cards / Reports** (see below): page-specific `serialize` /
   `hydrate` / `buildLabel` (+ `buildFaction`), one `GumaHistoryWiring.register`,
   `await GumaHistoryWiring.save(canvas)` in the download and copy paths, and the
   three markup additions.
8. For a report, wire `GumaCanvasEdit.attach({...})` and `GumaFit.applyCaps`.
9. **Seed the download counter row in Supabase** (see below). Skipping this
   leaves the counter permanently dead, silently.
10. Render a demo export into `assets/screenshots/<name>.png` with realistic
    Los Santos sample data (use `/screenshot`).
11. Update `readme.md`: a row in **Available Generators** plus a Features
    sub-section (use `/readme`).
12. Add faction icons / assets to `assets/` if needed (192x192 PNG).
13. Test in light + dark, PNG download and clipboard copy, and save -> reload
    from the drawer.
14. Use `/commit` for the message, `/changelog` for the announcement.

## Download counters (Supabase)

`js/counters.js` talks to one table, `public.counters` (`key` text, `value`
number). Two kinds of key:

- `visits`, the global page-visit count in the footer.
- `downloads_<generator key>`, one per generator, e.g. `downloads_officer`.

**The row has to exist before the generator ships.** As deployed, the
`increment_counter` RPC bumps an existing row without creating a missing one, and
a generator whose row was never seeded then counts nothing and shows nothing:
`_getCounter` returns `null`, so `initDownloadCounter` never unhides the
"Generated N times" line and the page just looks like it has no counter. This bit
`arrest` and `bodycam`, which sat with no row for weeks after launch. (If the RPC
is ever changed to upsert, update this paragraph; seeding stays correct anyway.)

After adding a generator, run this in **Supabase -> SQL Editor**:

```sql
insert into public.counters (key, value) values
  ('downloads_<generator key>', 0)
on conflict (key) do nothing;
```

`on conflict do nothing` makes it idempotent: re-running can never reset a live
count, so pasting the whole known key list at any time is safe.

The generator key must be identical in four places, or the counter, the flags, or
both go quiet:

| Where | What |
| ----- | ---- |
| `<page>.html` | `initDownloadCounter("<key>", "downloadCount", "downloadBtn")` |
| `js/<page>.js` | `GumaCounters.trackDownload("<key>")` in the copy path |
| `index.html` tile + `components.js` nav links | `data-generator-key="<key>"` |
| Supabase | a `downloads_<key>` row |

Current keys: `officer`, `firefighter`, `business_card`, `personnel`, `firearm`,
`traffic`, `arrest`, `pcr`, `investigative`, `bodycam`, `chardesc`.

**Verify:** open the page. "Generated 0 times" should appear under the export
button (it stays hidden while the row is missing). Copy to clipboard once,
reload, and the count should read 1.

## Saved Cards / Reports (history)

Every generator can persist exported documents to `localStorage` and reload them
into the form. The engine is **generator-agnostic** - you only wire the
page-specific parts.

Three shared pieces (do not fork them):

- **`js/history.js`** -> `window.GumaHistory`: storage API (`save` / `list` /
  `load` / `setPinned` / `remove` / `clear` / `subscribe`) keyed by
  `guma:history:<key>`. Dedup of identical consecutive saves, pinned-aware FIFO
  trim (limit 10 unpinned), quota recovery. Plus `_downscaleAvatar` and
  `_makeThumbnail`.
- **`js/history-wiring.js`** -> `window.GumaHistoryWiring`: owns the save
  orchestration, the `GUMA_*` globals and the universal faction descriptor.
  API: `register(cfg)`, `save(canvas)`, `buildFaction(payload, opts)`,
  `setVal(id, v)`, `setChecked(id, v)`.
- **`<guma-history-drawer>`** (in `js/components.js`): the whole drawer UI (list,
  pin, remove, clear-all modal, counter, faction badge). Reads
  `window.GUMA_GENERATOR_KEY`, `window.GUMA_GENERATOR_NOUN` and calls
  `window.GUMA_HYDRATE`. **Do not touch the drawer** to wire a new page.

### Globals the engine reads

| Global                | Set by                  | Purpose                                        |
| --------------------- | ----------------------- | ---------------------------------------------- |
| `GUMA_GENERATOR_KEY`  | `register({ key })`     | storage namespace (`guma:history:<key>`)       |
| `GUMA_GENERATOR_NOUN` | `register({ noun })`    | `"card"` (default) or `"report"` - drawer copy |
| `GUMA_HYDRATE`        | `register({ hydrate })` | function the drawer calls on load              |

### Wiring a new generator (recipe)

In `js/<page>.js`, write only the page-specific functions, then register:

```js
// ── Saved cards: serialize / hydrate / wiring ─────────────────
function pgSerializeState() {
  // JSON-friendly snapshot of the real form fields. May be async if there is
  // a photo: photoDataUrl = await GumaHistory._downscaleAvatar(src, w, h)
  // (use the real canvas slot dims). Stable output - no random/time fields.
}
function pgHydrateState(payload) {
  // Inverse, safe (missing field = no-op). Faction first (switchFaction(...)),
  // then GumaHistoryWiring.setVal / setChecked, then rebuild dynamic rows in
  // saved order, then call the page's render fn (generate.../refreshPreview()).
}
function pgBuildLabel(payload) {
  // Short human title from the key fields. Do not repeat info already shown by
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

Then in the download **and** copy handlers, once the PNG is final, call
`await GumaHistoryWiring.save(canvas)` with the real page canvas. `save()` picks
the thumbnail source automatically: `payload.photoDataUrl` if present, otherwise
the canvas.

Markup (3 additions):

1. **Saved button** in the preview-panel header (next to "Preview" / "Document",
   far right), `border-2` gold accent - copy the block from any wired page. The
   drawer updates `#gumaHistoryCount` itself (shows `0` when empty).
2. `<guma-history-drawer></guma-history-drawer>` just before `</body>`.
3. `history.js` -> `history-wiring.js` first in the end-of-body script order,
   then `components.js` and the page JS.

### Rules

- **The faction descriptor stores a path only** (`FACTIONS[key].icon` or
  `assets/custom.png`) - never base64. Pages without factions omit
  `buildFaction`; the badge simply does not render.
- Serialize output must be **stable** - dedup compares `JSON.stringify(payload)`.
- Dynamic rows: serialize an array, hydrate by clearing the container, resetting
  its counter and re-adding rows in saved order (mind whether the page's add-row
  prepends or appends).
- No `alert` / `confirm` - "✕ Remove" deletes immediately; the only modal is the
  drawer's built-in "Clear all".

## Showcase screenshots

- After a new generator or a significant change to the output's appearance,
  render a demo export and save it as `assets/screenshots/<page name>.png`.
- The file is the rendered canvas, not a screenshot of the page.
- **Sample data must be American / Los Santos**, never Polish: US person names,
  LA / Los Santos streets and areas (Vespucci Blvd, Vinewood, Del Perro, Mission
  Row), US date and number formats, and the project's own agencies.

## Things to avoid

- Static `.css` files.
- `<style>` blocks in HTML.
- Emoji in buttons or GUI copy - use inline SVG icons.
- New CDN scripts without explicit approval.
- `npm install`, build steps, module bundlers.
- ES module `import` / `export`.
- Hex colours hard-coded in markup or inline style - always go through tokens.
- Per-page download/copy button pairs - route exports through `GumaExport` and
  `<guma-preview-modal>`.
- Ellipsis truncation of overlong values - use `GumaFit` shrink-to-fit + caps.
- Renaming public-facing paths without updating every internal link (header
  dropdowns in `components.js`, readme tables, `index.html` tiles).
