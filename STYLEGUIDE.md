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
├── officer_generator.html
├── firefighter_generator.html
├── business_card_generator.html
├── firearm_discharge.html
├── traffic_collision_report.html
├── readme.md
├── tailwind.config.js          # reference only (CDN reads js/tailwind-config.js)
├── manifest.json
├── assets/                     # logos, badges, favicons (192×192 PNG for factions)
└── js/
    ├── theme-init.js           # anti-FOUC, runs first
    ├── tailwind.js             # Tailwind CDN snapshot
    ├── tailwind-config.js      # design tokens (colors, shadows, fonts, keyframes)
    ├── guma-styles.js          # @layer base/components/utilities rules
    ├── components.js           # <guma-header>, <guma-footer> Web Components
    ├── animations.js           # page entrance animations
    ├── counters.js             # Supabase visit/download counters
    ├── factions.js             # FACTIONS dict (LSPD/LSSD/BCSO/SAHP/...)
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

## Naming

| Thing                | Convention                    | Example                                                  |
| -------------------- | ----------------------------- | -------------------------------------------------------- |
| HTML files           | snake_case                    | `firearm_discharge.html`                                 |
| JS files             | kebab- _or_ snake-case        | `business-card.js`, `firearm_discharge_investigation.js` |
| HTML IDs             | camelCase                     | `customFactionPanel`, `photoInput`                       |
| Tailwind utilities   | kebab-case (Tailwind default) | `bg-guma-l-panel`                                        |
| Custom component cls | kebab + `guma-` prefix        | `guma-input`, `guma-panel`                               |
| JS functions         | camelCase                     | `switchFaction()`                                        |
| JS constants         | UPPER_SNAKE_CASE              | `FACTIONS`, `GUMA_VERSION`                               |

For a new JS file paired with a new HTML page, mirror the nearest existing
sibling (snake if it's a report, kebab if it's a card — match the pattern).

## Theming (dark / light)

- Dark is default. `theme-init.js` reads `localStorage.theme` and toggles
  `html.dark` synchronously before first paint.
- Light/dark toggle lives in the header (`<guma-header>`, see `components.js`).
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
4. Create `js/<name>.js`. Mirror naming. Page-specific logic only —
   shared helpers go to `js/ui-helpers.js` or a new shared file.
5. Register the page in `js/components.js` — update the `isCard` / `isReport`
   arrays and the dropdown link lists, so the header highlights correctly.
6. Update `readme.md`: add a row to the **Available Generators** table and
   a Features sub-section (use `/readme`).
7. Add a faction icon / asset to `assets/` if needed (192×192 PNG to match
   the rest).
8. Test in light + dark. Test PNG download and clipboard copy paths.
9. Use `/commit` for the commit message, `/changelog` for the announcement.

## Things to avoid

- Static `.css` files.
- `<style>` blocks in HTML.
- New CDN scripts without explicit approval.
- `npm install` / build steps / module bundlers.
- ES module `import` / `export`.
- Hex colors hard-coded in markup or inline style — always go through tokens.
- Renaming public-facing file paths without updating every internal link
  (header dropdowns in `components.js`, readme tables, `index.html` tiles).
