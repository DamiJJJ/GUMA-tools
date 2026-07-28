# WYSIWYG canvas editing for Report Generators

> Feasibility assessment, implementation plan and running log.
> **Phases 0 and 1 are done and verified.** Phases 2-5 are not started.
> Read "Gotchas" before writing any code for the next phase - most of it was
> paid for the hard way in the pilot.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| **0 - Foundation** | `js/canvas-edit.js`, `<guma-preview-modal>`, `guma-ce-*` styles, PCR offscreen-canvas fix | **Done** |
| **1 - Arrest Report (pilot)** | Instrumented `cell()`, officer chips, preview modal, zoom | **Done, reviewed with the user, UX revised twice** |
| **2 - Traffic Collision** | Same primitive family as arrest | Not started |
| **3 - PCR** | 90 checkboxes + value rows | Not started |
| **4 - Firearm** | `gridRow` funnel + `_p` prefix | Not started |
| **5 - Randomize Character** | New branches in `js/random-character.js` | Not started |
| **6 - Personnel File Generator** | Deferred, separate decision | Not started |

Files touched so far: `js/canvas-edit.js` (new, 725 lines), `js/guma-styles.js`,
`js/components.js`, `js/arrest-report.js`, `js/prehospital-care-report.js`,
`arrest_report.html`, `assets/screenshots/arrest_report.png`.

Nothing has been committed. All of the above is uncommitted working tree.

## Context

Every generator in GUMA-Tools has the same shape: a left form panel
(`guma-panel-form`) full of `<input id="...">` fields, and a right preview panel
(`guma-panel-preview`) holding `<canvas id="docCanvas">`. Each keystroke fires
`refreshPreview()` -> `drawForm()`, which repaints the whole document by reading
`document.getElementById(id).value`.

The ask: for the **Report Generators** section only (Card Generators stay as they
are), drop the form and let the user type straight into the rendered document.

Two existing facts carried the whole thing, and both held up in practice:

1. `js/bodycam-stage.js` + `js/bodycam-layers.js` already implement the
   interaction model (register-bounds-during-draw, hit test with slop, DOM
   overlay chrome that never lands in an export).
2. Every value in every report is painted through a small number of funnels
   (`cell()`, `gridRow()`, `checkItem()`), and each already computes the exact
   `{x, y, w, h}` an editor needs. Adding one `GumaCanvasEdit.field(...)` line
   per funnel produces a full hit-test map.

Phase 1 came in roughly on the estimate. The overruns were all in the editor
chrome (dates especially), not in the registry.

## Decisions taken

| Decision | Choice |
| --- | --- |
| Mobile | WYSIWYG is desktop-only (`min-width: 1280px`). Below `xl` the form panel stays visible and the canvas stays a passive preview. The form markup remains in the DOM regardless. |
| Personnel File Generator | **Out of scope for now.** Structurally it is a card generator sitting in the Report section. Revisit as an optional Phase 6. |
| Rollout | Pilot on **Arrest Report** only, then stop and review. Done. |
| Default zoom | **100%**, not fit-to-container. Fit made the document too wide to read comfortably. `Fit` stays one click away in the zoom control. |
| Maximum zoom | **Fit is the ceiling.** There is no fixed upper bound any more. Past Fit the document would be wider than its box, and the page scrolled sideways instead. `+`, Ctrl+wheel and `setZoom()` all clamp, and narrowing the window pulls the current zoom down with the cap. |
| Export surface | The page carries **one** `Preview & Download` button. Download PNG, Copy and the counter live **inside** `<guma-preview-modal>`. There is no Download/Copy pair on the page any more. |
| Repeatable rows | A removed row **disappears** from the document. No empty padding rows to keep a minimum count. Default is 1 row. |
| Date editing | The editor shows the document's own **mm/dd/yyyy**, not the browser locale's format. See Gotcha 3. |
| Native pickers | **Only `<select>` auto-opens its picker on click.** Dates open the calendar from their own button. See Gotcha 4. |

## Scope

In scope (4 pages):

| Page | JS | Repeatable rows | Checkboxes | State |
| --- | --- | --- | --- | --- |
| `arrest_report.html` | `js/arrest-report.js` | officers (max 4) | 2 | **Done** |
| `traffic_collision_report.html` | `js/traffic-collision-report.js` | parties | 2 | Not started |
| `firearm_discharge.html` | `js/firearm_discharge_investigation.js` | involved + witnessing officers, civilians | 4 | Not started |
| `prehospital_care_report.html` | `js/prehospital-care-report.js` | none | **90** | Not started |

Deferred: `personnel_file_generator.html`.
Untouched: all Card Generators, `bodycam_overlay.html`.

## Architecture as built

### 1. `js/canvas-edit.js` - the hitbox registry

An IIFE exposing a single `window.GumaCanvasEdit`. **Zero top-level
declarations** that could collide with a page script: `SCALE`, `DOC_W`,
`MARGIN`, `BODY_W`, `clip`, `cell`, `row`, `getVal`, `drawForm`,
`refreshPreview`, `sectionBar`, `wrapText` are all page-level globals, and a
duplicate top-level `const` in a classic script is a page-blanking
`SyntaxError`.

```js
/** Open a hitbox pass. FIRST statement of drawForm(). */
begin({ scale })                      // scale = the page's SCALE (2 everywhere in scope)

/** Register an editable value box, in LOGICAL coordinates. */
field(ref, x, y, w, h, opts)
// ref  = DOM id (or CSS selector, see Phase 6)
// opts = { kind, label, align, minEditW, fontPx }
//   kind    text | check | select | date | time   (default: inferred from the source element)
//   label   tooltip + aria-label
//   align   "left" | "center"                     (default "left")
//   minEditW  logical-px floor for the editor box
//   fontPx  logical font size, default 8

/** Non-value affordance: the +/- row chips. */
action(id, x, y, w, h, handler, opts)
// opts = { label, kind, title }
//   kind "add" | "remove" -> .guma-ce-chip-add / .guma-ce-chip-remove

/** Close the pass: re-anchor the open editor BY REF, rebuild chrome. */
end()

attach({ canvas, frame, toolbar, redraw, key, resolve, media })
// media defaults to "(min-width: 1280px)"
// resolve defaults to getElementById(ref) || querySelector(ref)
// toolbar is optional; the zoom control and hint are injected into it

// plus: schedule(), cancelEdit(), commitEdit(), isEditing(), setZoom(), fitZoom()
```

**Divergence from the original plan:** `attach()` also takes `toolbar`, and the
`host` key documented earlier was never needed - the breakpoint gate is pure
CSS (`.guma-ce-host` plus a media query). `arrest-report.js` still passes
`host`; it is inert. Drop it when convenient.

Coordinate mapping, with one extra division because reports use
`ctx.scale(SCALE, SCALE)` and bodycam does not:

```js
logicalX = (e.clientX - rect.left) * (canvas.width / rect.width) / SCALE
```

`displayScale()` is `canvas.clientWidth / canvas.width`. One logical px is
`cssPerLogical() = displayScale() * SCALE` CSS px; that factor is used for every
piece of chrome. Hit slop is `HIT_SLOP / cssPerLogical()`.

### 2. The form stays in the DOM as the state store

The single biggest de-risking decision, and it paid off: history wiring,
`collectOfficers()`, `GumaHistoryWiring.setVal/setChecked` and
`window.randomizeCharacter(key)` all kept working untouched.

Two hard rules, both still true:

- **Never `display: none` the host.** You cannot `.focus()` or `.showPicker()` a
  `display:none` input. `.guma-ce-host` is visually-hidden-but-focusable
  (`position:absolute; width:1px; height:1px; clip-path:inset(50%)`), applied
  only inside `@media (min-width: 1280px)`.
- **Never re-parent an input.** `collectOfficers()`, `collectParties()` and
  `collectOfficerRows()` walk the DOM by container. Moving a node out of its
  `.dynamic-row` mid-edit makes the collector return `""` while the user is
  typing, visible only in the export.

`resolve(ref)` is the seam for a future migration to a real state object.

### 3. Click-to-edit with a single floating editor

One editor at a time, mounted absolutely inside `#ceFrame`
(`position:relative; display:inline-block`), which shrink-wraps the canvas.

The editor is modelled as **two references**, because the date editor is a
composite:

```js
editing = { ref, field, kind, el, input, original }
// el    = the positioned box (what gets sized, styled and removed)
// input = what takes focus, keys and blur
// For text/time/select, el === input. For date, el is a <span> wrapper.
```

Anything added later that needs more than one node (a textarea with a toolbar,
a combo box) plugs into that split without touching the rest.

- **Do not use `position: fixed`.** `.guma-panel-form` and `.guma-panel-preview`
  carry transform animations (`js/tailwind-config.js:148-157`), which create a
  containing block for fixed descendants.
- Editor writes to the source input and dispatches `input`/`change`, so all
  existing wiring fires unchanged.
- Checkboxes get no editor: a click toggles the source checkbox and redraws.
- Clipped values widen the editor up to the document edge (`growEditor()`),
  skipped for composite editors.
- Keys: `Enter`/`Tab` commit and advance in registry order (= document reading
  order), `Shift+Tab` back, `Escape` reverts, blur commits.
- Position first, **then** focus - focusing an off-screen element scrolls to it.

### 4. All edit chrome is DOM, never painted

Hover highlight, dashed outline on empty fields, +/- chips: absolutely
positioned overlay nodes driven by the registry. Empty-field outlines are a
single SVG with N `<rect>`s, not N divs.

**Consequence, now measured:** the export path needed zero changes, and a
byte-diff against the pre-change build with identical data came back
**identical** (see Verification).

No placeholder ghost text on the canvas. The documents already print `-` for
empty values; the dashed outline plus the editor's `placeholder` attribute
carry the affordance.

### 5. Zoom: CSS display size, not a bigger `SCALE`

`canvas.style.width = Math.round(canvas.width * zoom) + "px"` after each draw.
`displayScale()` and all hit-test math keep working unchanged.

- **Do not raise `SCALE` to 3.** It changes every exported PNG's dimensions and,
  on PCR, churns tens of MB of backing store per keystroke.
- **Do not touch `.guma-canvas-preview`** - shared with the card generators and
  bodycam. Report pages use `.guma-ce-canvas` inside `.guma-ce-frame` instead,
  and `.guma-ce-wrap` relaxes the shared wrap's `overflow-x: hidden`.
- Zoom UI: a segmented control (`- / % / + / Fit`) injected into `#ceToolbar`,
  plus Ctrl+wheel. **The wheel handler is gated on `ctrlKey`** so plain wheel
  still scrolls the page. Persisted as `guma:zoom:<key>`.
- **Default is 1.0, ceiling is Fit.** `clampZoom()` floors every request to
  `trueFit()`; there is no `ZOOM_MAX` constant. `Math.floor` rather than
  `Math.round`, so a rounded value can never creep back over the cap.
- `trueFit()` measures **with the canvas collapsed to 0x0 and restored before
  the next paint**, reserving whatever a vertical scrollbar currently occupies.
  Collapsing is what makes the reading independent of the current zoom; see
  Gotcha 11.
- A second `ResizeObserver` watches the **scroll box**, not the canvas: the
  canvas carries an explicit pixel width and therefore never reacts to the
  window resizing. It only ever shrinks the zoom, so a scrollbar appearing and
  disappearing cannot oscillate.
- When inactive, the inline width/height are cleared so the shared preview
  classes size the canvas again.

### 6. `<guma-preview-modal>` in `js/components.js`

Built on the `[data-gh-confirm]` shell pattern. `max-w-5xl`, `max-h-[94vh]`.
Opens with `canvas.toBlob(b => img.src = URL.createObjectURL(b))`, revoked on
close, which gives native right-click Save/Copy for free.

**It is the only export surface.** Its buttons carry the canonical ids
`#downloadBtn` and `#copyDiscordBtn`, so `initDownloadCounter(...)` and the
`copyDocToClipboard()` "Copied!" feedback bind to them with no changes. The
`Generated N times` row mirrors the page's `#downloadCount` through a
`MutationObserver`.

Each report JS gains one line so the modal can delegate:

```js
window.GumaExport = { download: downloadPng, copy: copyDocToClipboard,
                      canvas: () => document.getElementById("docCanvas") };
```

## Gotchas

Everything below cost real debugging time in Phase 1. Read it before Phase 2.

### 1. `line-height: 0` on the frame clips native date/time inputs

`.guma-ce-frame` sets `line-height: 0` so the inline-block wrapper shrink-wraps
the canvas without descender space. **WebKit lays out the internal segments of
`<input type="date">` and `type="time"` along the inherited line box**, so the
editor rendered the digits as unreadable slivers - it looked like a font or
colour bug, and computed styles all looked correct (16px, `rgb(0,0,0)`).

`.guma-ce-editor` now sets `line-height: normal` explicitly. **Any new element
mounted inside `#ceFrame` needs the same.**

### 2. Global `html.dark` form-control rules leak onto the white document

`js/guma-styles.js` base layer has:

```css
html.dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
```

The canvas editor sits on **white paper in both app themes**, so that rule
washed the picker icon out to near-invisible in dark mode. Overridden for
`.guma-ce-editor`.

**Generalise this:** any global `html.dark` rule targeting form controls is
probably wrong inside the editor. Grep the base layer before adding a new
control type. All editor chrome uses the navy accent (`#2d4787`) in both
themes deliberately, because gold has too little contrast on white.

### 3. Native date inputs cannot show the document's format

`<input type="date">` stores `yyyy-mm-dd` and renders in the **browser locale**
(`dd.mm.rrrr` on a Polish Chrome) while the document prints US `mm/dd/yyyy`.
There is no attribute or CSS to change that. Editing straight over the
document, the mismatch reads as the value having changed.

Solved generically in `canvas-edit.js`, so **Phases 2-4 get it for free** by
passing `kind: "date"`. `buildDateEditor()` produces:

- a `<input type="text">` in `mm/dd/yyyy` with a typing mask (8 bare digits
  auto-slash into `07/24/2026`),
- a zero-opacity `<input type="date">` that exists only to anchor the native
  calendar popup,
- a button that calls `showPicker()` on that anchor.

Converters are `dateToDisplay()` / `displayToDate()` / `maskDisplayDate()`.
Incomplete or invalid input writes `""` to the source, so the document shows
`-` until the date is complete. The source stays a real `<input type="date">`,
so serialize/hydrate are untouched.

Two sub-traps inside that:

- The picker button needs `mousedown` -> `preventDefault()`, otherwise it blurs
  the text field and commits the editor before the click lands.
- A `pickerOpen` flag suppresses the blur-commit while the native popup is up.

Time fields were left native: in pl-PL they already render `22:41`, exactly what
the canvas prints. On an en-US browser they would show `10:41 PM` against the
document's `22:41`. **Not yet addressed** - same treatment as dates would fix it
if it ever matters.

### 4. Auto-opening a native picker hides the row being edited

The original plan called for `showPicker()` on every date/select click. In
practice the calendar popup covers the exact row you are editing. **Only
`<select>` auto-opens now** (a focused select shows nothing otherwise).
`showPicker()` still has to be called synchronously inside the click handler or
Safari and Firefox reject it.

### 5. Product rule for repeatable rows

The plan assumed padding rows (`while (rows.length < 2) push({...})`). The user
wants the opposite: **a removed row disappears and the canvas shrinks.**
`drawOfficers()` now renders exactly the collected rows. Carry this to traffic
parties and firearm officer/civilian blocks.

Rows are identified by an id prefix carried on the collected object:

```js
return { _p: p, name: getVal(p + "_name"), ... };
```

Padding rows, if any survive elsewhere, must have no `_p` so they register
nothing.

### 6. Top-level `const` in page scripts is shared scope

`arrest-report.js` declares top-level `const f` and `const fd` helpers. Classic
scripts share one top-level scope per page, so **grep every script tag on the
target page before adding a short top-level name.** Checked and clear for
`random-character.js`, `ui-helpers.js`, `factions.js`, `streets.js`.

Related landmine already present: `arHydrateState()` has a local
`const f = payload.fields || {}` that shadows the `f()` cell helper. Harmless
today because that function never calls `f()`, but do not add a call there.

### 7. Script and element order for the modal

The counter binds on `DOMContentLoaded` and looks up `#downloadBtn`, which now
lives inside `<guma-preview-modal>`. That works because `components.js` runs
`customElements.define(...)` while the element is already in the DOM, so
`connectedCallback` fires synchronously before `DOMContentLoaded`.

**Do not** move `<guma-preview-modal>` after the scripts, and do not add
`defer` to `components.js`, or the counter silently stops binding.

### 8. `window.GumaExport` must be assigned before the modal is used

Set at the end of the report JS. The modal no-ops safely if it is missing
(optional chaining), which means a missing assignment shows up as a dead
Download button, not an error.

### 9. Instrumenting `cell()` is a net code reduction

Two helpers turn the call sites into less code than before and remove the
id-typed-twice hazard:

```js
const f  = (label, id, w, opts) => ({ label, value: getVal(id), w, opts: { ref: id, ...opts } });
const fd = (label, id, w, opts) => ({ label, value: fmtDate(arRawVal(id)), w,
                                      opts: { ref: id, kind: "date", ...opts } });
```
```js
y = row(ctx, [
  f("Location Booked", "location_booked", 0.4),
  f("Booking No.",     "booking_no",      0.2),
], y, 24);
```

`cell()` registers at the end, after painting:

```js
if (opts.ref && window.GumaCanvasEdit) {
  window.GumaCanvasEdit.field(opts.ref, x, y, w, h,
    { kind: opts.kind, label, align: center ? "center" : "left", minEditW: opts.minEditW });
}
```

Every `GumaCanvasEdit` call in page code is optional-chained
(`window.GumaCanvasEdit?.field(...)`), so a page that has not loaded
`canvas-edit.js` still works.

### 10. Wrapped labels are never editable

`wrapLabel()` (arrest/traffic) and `wrapText()` (firearm `drawOffHeader`) only
paint static column headers. Do not instrument them.

### 11. `min-width: 0` on the flex chain, or fit-to-width measures the zoom

Symptom reported: clicking `Fit` did nothing whenever the current zoom was
already above it.

Cause: a flex item defaults to `min-width: auto`, so it refuses to shrink below
its content. Zooming to 180% made `.guma-panel-preview` grow from 1502 to
2365 px, dragging `.guma-canvas-wrap` (`w-full`) along with it. So the wrap
reported `clientWidth` equal to the zoomed canvas, `trueFit()` computed
`2304 / 1280 = 1.8`, and Fit "moved" the zoom to exactly where it already was.
`overflow-x: auto` on the wrap was useless, because nothing ever constrained
the wrap's width in the first place.

Two fixes, both kept:

- `min-width: 0` on `.guma-ce-wrap` **and** `min-w-0` on the preview panel in
  the page markup. Now the wrap stays ~1454 px, the document scrolls inside it
  (`scrollWidth` 2306 vs `clientWidth` 1428) and the page itself never scrolls
  sideways.
- `trueFit()` measures with the canvas collapsed, so even a container that does
  track its content cannot feed the current zoom back. Defense in depth for the
  remaining pages.

**Every report page needs `min-w-0` on its preview panel.** It is easy to miss
because nothing looks wrong until someone zooms in.

## Remaining instrumentation notes

**Traffic Collision.** Same primitive family as arrest. The
`clip` / `wrapLabel` / `cell` / `row` block lives at
`traffic-collision-report.js:292-358`; before instrumentation it differed from
the arrest copy by **3 lines** (arrest added a `valFont` option and an
`if (label)` guard). The arrest copy now sits at `arrest-report.js:112-193`
and carries the registry call, so **diff against git HEAD, not against the
current arrest file**, if you want to confirm they are still twins. Do **not**
extract them into a shared `js/report-primitives.js` during this work - that is
a separate refactor with its own regression surface. One new interaction:
party-type checkboxes are painted from `d.type === t` but backed by a
`<select>`, so they register as `action()`, not `field()`.

**Firearm.** `gridRow()` is the funnel. `drawOffRow`/`drawCivBlock` receive
plain objects, so add the `_p` prefix in `collectOfficerRows(type)` and
`collectCivilianRows()`, then:

```js
if (d._p) GumaCanvasEdit.field(d._p + "_" + col.key, x, y, cw, H,
  { kind: col.yn ? "select" : "text", label: col.label });
```

Note `Array(3 - rows.length).fill({})` shares one object reference across
padding rows - harmless while read-only, but see Gotcha 5 about dropping
padding rows entirely.

**PCR.** `checkItem(ctx, x, baseline, id, label, maxW)` already takes the DOM
id, so 90 checkboxes become editable with one added line. `valueRow`, `combRow`
and `valueChecklistRow` follow the arrest pattern. The comb field wants a
whole-strip hitbox plus an uppercase-transformed input.

**Prerequisite already done:** `js/prehospital-care-report.js` used to allocate
a fresh 15.4 MB offscreen canvas on every draw. It is now cached at module
level, starts at `MAX_H = 1000` and grows only if the content outruns it.
`pcrPrepOffCtx()` resets the transform before re-scaling, because `ctx.scale()`
accumulates on a reused canvas.

**Randomize Character (Phase 5).** New branches in `js/random-character.js`:
arrest (arrestee + officers), traffic (parties), firearm (officers +
civilians). **Not PCR** - `PCR_TEXT_IDS` has no person fields at all. Note there
is currently no DOB generator: `randomizeCharacter` rolls `age` but never a date
of birth, and all three pages have `dob` inputs.

## Risks, with pilot outcomes

1. **DOM collectors return empty after a structural change.** *Mitigated:* no
   re-parenting anywhere, plus a dev-only `console.warn` in `end()` for any
   registered ref that does not resolve. No incidents in the pilot.
2. **Stale editor after hydrate or faction switch.** *Mitigated:*
   `GumaCanvasEdit.cancelEdit()` at the top of `arHydrateState`. **Do the same
   in every `*HydrateState` and every `switchFaction` in Phases 2-4.**
   `end()` also drops an editor whose ref vanished from the registry.
3. **Export contamination.** *Resolved and measured:* byte-identical export, see
   Verification. Keep the DOM-only-chrome invariant.
4. **Perf on PCR.** Still open, Phase 3. rAF coalescing, the cached offscreen
   canvas and the single-SVG chrome overlay are all in place already.
5. **Coordinate drift.** *Mitigated:* `ResizeObserver` on the canvas, which
   catches zoom, window resize and scrollbar appearance in one place.
6. **Date fields read differently than they display.** *Resolved,* see Gotcha 3.
7. **Discoverability.** *Mitigated:* dashed outline on empty fields, hover
   highlight, and a one-time hint in the toolbar dismissed on first edit
   (`guma:ce-hint-done`).
8. **Accessibility.** The canvas is opaque to screen readers. The host form
   stays visually-hidden-but-present and keyboard-reachable as the fallback.
9. **`document.querySelector(".guma-panel")` in `initPersonnelGenerator`** binds
   to whichever `.guma-panel` is first in the DOM. Only bites in Phase 6, but do
   not reorder the panels.

## Verification

No test suite exists. Phase 1 was verified with a throwaway headless-Chrome
harness adapted from the capture script in `.claude/commands/screenshot.md`
(static server + CDP over Node's global `WebSocket`/`fetch`, no npm deps).
Rebuilding it costs about ten minutes and is worth it for every phase.

Useful coordinate helper inside the page, for synthesising clicks on the canvas:

```js
const k = (canvas.clientWidth / canvas.width) * SCALE;   // CSS px per logical px
canvas.dispatchEvent(new PointerEvent("pointerdown", {
  clientX: rect.left + logicalX * k, clientY: rect.top + logicalY * k,
  bubbles: true, pointerId: 1, isPrimary: true }));
```

What was checked automatically in Phase 1, all passing:

1. **Export purity, byte level.** Rendered the same data on the current build
   and on a copy of the pre-change build served from a second port, compared
   `toDataURL()` output: **identical, 128926 bytes both**. This is the strongest
   guarantee that chrome never leaks; repeat it each phase.
2. **Breakpoint gate.** At >=1280px the form is hidden and the canvas is
   editable; below, the form is visible and the canvas inert, with the zoom
   width override cleared. `matchMedia` change handled mid-session.
3. **History round-trip.** serialize -> wipe -> hydrate -> serialize, identical.
4. **Editing.** Editor opens on click, writes through to the source input,
   survives the redraw it triggers, closes on commit.
5. **Repeatable rows.** Add chip appends, remove chip deletes and the canvas
   height shrinks.
6. **Checkboxes.** Click toggles the source checkbox.
7. **Date editor.** Displays `07/24/2026` for a source of `2026-07-24`; typing
   `07242026` auto-formats and writes back `2026-07-24`; Escape reverts to the
   previous date; Tab advances to the next field in reading order.
8. **Zoom.** 100% default, persisted per page. `setZoom(3)`, `setZoom(1.8)` and
   twelve `+` clicks all land on the Fit value and stop there. `Fit` returns the
   same number whether approached from above or below. Narrowing the panel to
   800px drops the zoom from 112% to 56% on its own. In every one of those
   states `wrap.scrollWidth === wrap.clientWidth` and the page has no horizontal
   scrollbar.
9. **Preview modal.** Opens with a blob image, carries both export buttons and
   the mirrored counter.
10. **Both themes** confirmed by screenshot; zero page errors throughout.

Still **manual and unverified**, worth doing once in a real browser:

- Native calendar popup in Safari and Firefox (`showPicker()` on the
  zero-opacity anchor input is the part most likely to differ).
- `assets/screenshots/arrest_report.png` was regenerated with Los Santos demo
  data. Per `CLAUDE.md`, regenerate the matching screenshot after each phase.

## Appendix: incidental findings

Not part of this plan, but worth logging:

- **Dead animation rules.** `js/tailwind-config.js` defines several classes
  twice and the later definitions win: `.guma-reveal` (line 158) is overridden
  at line 221 by `opacity:1 !important; transform:none !important`, so
  scroll-reveal is dead. `.guma-card:hover { transform: translateY(-6px) }`
  (line 197) is overridden at line 229 by `transform: none !important`, so the
  card hover lift is dead.
- **Dead script tags.** `traffic_collision_report.html` and `arrest_report.html`
  load `js/factions.js` + `js/ui-helpers.js` but have no `#factionSwitcher`.
- **Stale config.** `/tailwind.config.js` at repo root is a CommonJS file for a
  build step that does not exist. It still says `maxWidth: 1400px` and lacks the
  entire light palette.
- **Duplication inventory.** `clip()` exists in 4 copies, `wrapLabel`/`wrapText`
  in 3, `getVal`/`rv` in 4, `fmtDate` in 3, and the `downloadPng` /
  `copyDocToClipboard` pair in 7 files differing only by filename and counter
  key. A `js/guma-export.js` extraction is the natural companion refactor, and
  it got more attractive in the pilot: the WYSIWYG pages now also need
  `window.GumaExport` and the `<guma-preview-modal>` element, so the
  boilerplate per page grew rather than shrank. Still deliberately out of scope.
- **`window.GumaToast(...)`** is called in `js/history.js:88` and `:97` behind a
  `typeof` guard, but nothing in the repo defines it. A ready-made extension
  point.

## Appendix: if Phase 6 (Personnel File) is later approved

`personnel-app.js` is the odd one out: `generateDoc()` not `drawForm()`, no
`SCALE` (renders 1x at W=840), fields collected by **CSS class** inside `.pf-row`
rather than by id, `guma-input`/`guma-label` form family, camelCase ids, the only
`<textarea>` in the app (`#pfNotes`), and the only page with debounced input.

The registry key is already a **ref = bare id OR CSS selector**, with the default
resolver `document.getElementById(ref) || document.querySelector(ref)`. The four
in-scope pages pass bare ids and never notice. Personnel would pass selectors
built by a helper:

```js
const pfRef = (containerId, i, cls) => `#${containerId} > .pf-row:nth-child(${i + 1}) .${cls}`;
```

Hoist the row field tuples (`PF_TR_FIELDS`, `PF_CM_FIELDS`, ...) so `getDocData()`
and the draw path share one source of truth, then change `drawTable` to accept
`Array<Array<{v, ref}>>` instead of `string[][]`, and `drawInfoRow` to accept
`[label, value, ref]` triples. `#pfNotes` gets a single multiline hitbox over the
whole notes rectangle with a `<textarea>` editor; because `drawNotesSection` wraps
per word at `tableW - 28` in **Courier (monospace)**, DOM and canvas wrap at
essentially identical points. For `kind: "multiline"`, Enter inserts a newline and
Ctrl/Cmd+Enter commits. The `el` / `input` split described in Architecture 3 is
what makes that editor possible without touching the rest of the module.

Also: personnel renders at 1x, so it goes soft the moment anyone zooms. Giving it
an internal `SCALE = 2` doubles its export from 840px to 1680px wide - an explicit
product decision, not a rendering tweak.
