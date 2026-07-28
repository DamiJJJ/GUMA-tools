# WYSIWYG canvas editing for Report Generators

> Feasibility assessment, implementation plan and running log.
> **Phases 0-4 are done and verified. All four in-scope report pages are now
> WYSIWYG.** Next up is **4b**: firearm no longer ellipsizes anything it prints,
> and the other three reports still do. Phase 5 is not started.
> Picking this up in a new session? Go straight to **"Next session: start
> here"** below. Everything in "Gotchas" was paid for the hard way; none of it
> is theoretical.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| **0 - Foundation** | `js/canvas-edit.js`, `<guma-preview-modal>`, `guma-ce-*` styles, PCR offscreen-canvas fix | **Done** |
| **1 - Arrest Report (pilot)** | Instrumented `cell()`, officer chips, preview modal, zoom | **Done, reviewed with the user, UX revised twice** |
| **2 - Traffic Collision** | Same primitive family as arrest, plus select-backed pick-one boxes and 5 new inputs for cells that only ever printed `-` | **Done, 48/48 automated checks** |
| **3 - PCR** | 28 text fields + exactly 90 checkboxes, no repeatable rows | **Done, 58/58 automated checks + a 46-check arrest/traffic regression run** |
| **4 - Firearm** | `gridRow` funnel + `_p` prefix, three repeatable blocks, `datetime` editor, faction switcher replaced by an editable header | **Done, 107/107 automated checks + 46-check arrest/traffic and 58-check PCR regression runs** |
| **4b - No ellipsis on arrest / traffic / PCR** | Carry the firearm shrink + wrap + input-cap rule to the other three reports | **Next** |
| **5 - Randomize Character** | New branches in `js/random-character.js` | Not started |
| **6 - Personnel File Generator** | Deferred, separate decision | Not started |

Phases 0-1 shipped as commit `2a4a757` on `feat/wysiwyg-canvas-edit`;
Phase 2 as `28b7d36`; Phase 3 as `fd0ad2d`.

Phase 4 files: `js/firearm_discharge_investigation.js`, `firearm_discharge.html`,
`js/canvas-edit.js` (the `datetime` composite editor), `readme.md` (one stale
bullet), `assets/screenshots/firearm_discharge.png`. No `js/guma-styles.js`
change was needed - the datetime editor reuses the `guma-ce-editor-date`
classes. Uncommitted - the user commits, never the agent.

## Next session: start here

**Phase 4b: carry the no-ellipsis rule to arrest, traffic and PCR.** The user's
rule, stated plainly on firearm and meant for all of them: *this is a report, so
no printed value may end in an ellipsis.* Firearm is done and is the worked
example; the other three still clip. Nothing in `js/canvas-edit.js` changes for
this beyond what firearm already needed (it copies `maxLength` onto its editor).

Read in this order: this section, the **"Nothing is ellipsized"** block under
*Phase 4 - Firearm: what was built*, then **"Phase 4b"** under *Remaining
instrumentation notes* - it lists what clips on each page and the one design
decision to take first.

After 4b, **Phase 5 is Randomize Character**; its block is further down the same
section. The Gotchas are editor and instrumentation material - only relevant if
Phase 6 (Personnel File) is later approved.

Two open questions for the user before starting Phase 5:

- There is still **no DOB generator**: `randomizeCharacter` rolls `age` but
  never a date of birth, and all three person-bearing pages have `dob` inputs.
  Decide whether it should derive a DOB from the age it already rolls.
- Firearm has **three** repeatable blocks (involved officers, witnessing
  officers, civilians) and two of them hold people. Decide whether randomize
  fills every row or only the first.

Cosmetic calls the user may still want to make:

- **PCR**: the five run-time rows are `h = 20`, which clears the value/label
  collision threshold by 0.5px (Gotcha 14). Legible, verified at 5x, but
  visibly tight. Bumping them to 22 would relax it at the cost of changing every
  exported PNG's height.
- **Firearm**: nothing on this page is ellipsized any more - see the
  no-ellipsis note below. The caps in `FD_MAXLEN` are the lever if a field turns
  out to be too tight in practice; changing one means re-running the harness,
  which is what proves the cap still fits its column.

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
| Rollout | Pilot on **Arrest Report** only, then stop and review. Done; traffic followed and was reviewed the same way. |
| Completeness | **If we fill in the document, we fill in all of it.** A cell printing a hard-coded `-` gets a real input rather than staying dead. See Gotcha 13. |
| Default zoom | **100%**, not fit-to-container. Fit made the document too wide to read comfortably. `Fit` stays one click away in the zoom control. |
| Maximum zoom | **Fit is the ceiling.** There is no fixed upper bound any more. Past Fit the document would be wider than its box, and the page scrolled sideways instead. `+`, Ctrl+wheel and `setZoom()` all clamp, and narrowing the window pulls the current zoom down with the cap. |
| Export surface | The page carries **one** `Preview & Download` button. Download PNG, Copy and the counter live **inside** `<guma-preview-modal>`. There is no Download/Copy pair on the page any more. |
| Repeatable rows | A removed row **disappears** from the document. No empty padding rows to keep a minimum count. Default is 1 row. |
| Date editing | The editor shows the document's own **mm/dd/yyyy**, not the browser locale's format. See Gotcha 3. |
| Native pickers | **Only `<select>` auto-opens its picker on click.** Dates open the calendar from their own button. See Gotcha 4. |
| Faction on firearm | **Switcher removed in Phase 4.** The document's own header line is the control (`#agency_name`, default `LOS SANTOS POLICE DEPARTMENT`), edited in place from xl and through the form input below it. Reports saved under the old switcher still hydrate - see Gotcha 18. |

## Scope

In scope (4 pages):

| Page | JS | Repeatable rows | Checkboxes | State |
| --- | --- | --- | --- | --- |
| `arrest_report.html` | `js/arrest-report.js` | officers (max 4) | 2 | **Done** |
| `traffic_collision_report.html` | `js/traffic-collision-report.js` | parties (no max) | 2 | **Done** |
| `firearm_discharge.html` | `js/firearm_discharge_investigation.js` | involved + witnessing officers, civilians | 4 | **Done** |
| `prehospital_care_report.html` | `js/prehospital-care-report.js` | none | **90** | **Done** |

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
// opts = { kind, label, align, minEditW, fontPx, transform }
//   kind    text | check | select | date | datetime | time
//           (default: inferred from the source element by inferKind())
//   label   tooltip + aria-label
//   align   "left" | "center"                     (default "left")
//   minEditW  logical-px floor for the editor box
//   fontPx  logical font size, default 8
//   transform "upper" -> text-transform on the editor only; the source keeps
//             what was typed. Added in Phase 3 for PCR's comb rows, which
//             print an uppercased value. Purely visual, same class of fix as
//             the date editor (Gotcha 3).

/** Non-value affordance: the +/- row chips and pick-one boxes. */
action(id, x, y, w, h, handler, opts)
// opts = { label, kind, title }
//   kind "add" | "remove" | "pick"
//        -> .guma-ce-chip-add / -remove / -pick
//   "pick" is transparent and only tints on hover: use it when the document
//   already paints the control (see Gotcha 12). Each chip carries
//   data-ce-action="<id>".

/** Close the pass: re-anchor the open editor by (ref, occ), rebuild chrome. */
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
`host`; it is inert. Drop it when convenient. `traffic-collision-report.js`
does not pass it.

**Occurrence index (added in Phase 2).** One input can legitimately be printed
in more than one place - the traffic report prints `TOW AWAY` in both the NCIC
row and the LOCATION row. `field()` therefore stamps each registration with an
`occ` counter (0, 1, ... per ref within a pass), `editing` carries the `occ` it
was opened on, and `syncChrome()` / `advance()` re-find the box by the
`(ref, occ)` pair. Without it the editor snapped to the first printing on the
next redraw - i.e. it jumped away from the cell the user clicked. Nothing in
page code has to know about this; just register both boxes.

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
- `trueFit()` measures **with the canvas collapsed horizontally only, its height
  frozen, and both restored before the next paint**. Collapsing the width is
  what makes the reading independent of the current zoom (Gotcha 11); keeping
  the height is what keeps the measurement honest (Gotcha 15).
- `setZoom()` **applies, re-measures and re-clamps once.** Fitting makes the
  document taller, which can bring back a scrollbar that was not there while
  measuring. One extra pass converges, because clamping only ever shrinks. See
  Gotcha 15.
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

Everything below cost real debugging time. **1-11 came out of Phase 1, 12-14 out
of Phase 2, 15-16 out of Phase 3, 17-18 out of Phase 4.** Read 12-18 before any
further instrumentation; 1-11 matter mainly if you touch the editor itself.

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

Solved generically in `canvas-edit.js`, so **the remaining phases get it for
free** by passing `kind: "date"`. `buildDateEditor()` produces:

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
`drawOfficers()` now renders exactly the collected rows. Done for traffic
parties too (`while (toRender.length < 3) push(emptyParty)` and the whole
`emptyParty` literal are gone); carry it to the firearm officer/civilian
blocks.

Where the block is not the last thing on the page, the `+ Add` chip needs
vertical room reserved for it in the flow, because chips are DOM overlay and
paint nothing: traffic uses a named `ADD_CHIP_H = 18` between the last party and
the footer row, counted into `contentH`. That strip is blank on the passive
(sub-1280px) view too - it has to be, since both modes export the same canvas.

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

### 12. A pick-one control the canvas already paints needs a *transparent* chip

Party type (5 boxes) and day of week (7 letter boxes) are painted from a value
comparison but backed by a single `<select>`. Registering them as `field()` is
wrong - clicking "PEDESTRIAN" should *set* the type, not open a dropdown over
the row. They are `action()`s, per the original plan, but the default chip
paints a filled button, which would double-draw the box the canvas already
printed.

Hence `kind: "pick"`: `.guma-ce-chip-pick` is fully transparent and only tints
on hover, so it is a pure hit target. Handlers go through one helper:

```js
function setSelectVal(id, value) {
  const el = document.getElementById(id);
  if (!el || el.value === value) return;
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}
```

Chips sit above the canvas with `pointer-events: auto`, so a pick target always
wins over any `field()` hitbox underneath it. That is what you want here, but it
means a pick chip laid over an editable cell would make that cell unclickable.

**Firearm has four such blocks** (`Y/N` columns); check whether each is really
one-of-N (pick) or a free value (field) before instrumenting.

### 13. A cell printing a hard-coded `-` is a missing field, not a static cell

Traffic printed `Class`, `REPORTING DISTRICT`, `BEAT`, `PHOTOGRAPHS BY` and
`On Street or Highway / ... / PCF` as literal `-`, with no form input behind
them. Under WYSIWYG that reads as five dead cells in the middle of an otherwise
fully editable document. **Product rule from the user: if we are filling in the
document, we fill in all of it.** All five got real inputs in Phase 2:

| Cell | New id | Scope |
| --- | --- | --- |
| Class | `party_N_dl_class` | per party |
| On Street or Highway / ... / PCF | `party_N_street_info` | per party |
| REPORTING DISTRICT | `reporting_district` | page |
| BEAT | `beat` | page |
| PHOTOGRAPHS BY | `photographs_by` | page |

Because `getVal()` already returns `"-"` for an empty input, an untouched
document renders exactly as before - the change is invisible until someone
types. Adding ids to `TC_SCALAR_FIELDS` / `TC_PARTY_FIELDS` is safe for old
saved reports: `GumaHistoryWiring.setVal` no-ops on `v == null`, so the new
fields simply stay empty when an older payload is hydrated.

**Do the same sweep on PCR and firearm before declaring a phase done:** grep
the draw path for cell values that are string literals rather than a `getVal`
call. What genuinely has no source (a computed total, a printed constant) stays
unregistered - **never invent a ref**, or `devAssertRefs()` warns on every draw.

### 14. A cell shorter than 18px prints its value through its own label

`cell()` puts the label baseline at a fixed `y + 7` and the value baseline at
`y + h - 4`. 8px Arial has a ~5.8px cap height, so the value's glyph tops land
at `y + h - 9.8`, and anything below **h = 17** drives them through the label.
The NCIC row was `h = 16` and printed `NCIC #` straight over `1934`; location
row 2 was `h = 17` and the two lines touched.

Both are now 20. `cell()` also clamps the value baseline to
`Math.max(y + h - 4, y + 13)` when a label is present, so a short row degrades
to "cramped" rather than "illegible" if anyone reintroduces one.

**Minimum for a labelled cell is h = 18; use 20.** Worth checking on PCR, where
`valueRow` and `valueChecklistRow` pack many short rows. The harness asserts it
directly: no registered field with a label may have `h < 18`.

Related, found while fixing it: `drawForm()`'s `headerH` estimate was 17px short
of what the header actually paints. Harmless while the A4 floor won, but it
governs from the 4th party on, and would have eaten into the bottom margin. The
harness now checks that the footer plus `PAGE 1 OF 1` fits for 1-6 parties.
**Re-run that check after changing any row height.**

### 15. Fit measured the panel *without* the scrollbar the fit itself brings back

Two bugs in one, both in `trueFit()`, both surfaced by PCR and both **also
present on arrest** the whole time - the Phase 1/2 harnesses never approached
Fit from an unzoomed page, so neither showed up.

1. **Collapsing the canvas to 0x0 removed the window's scrollbar.** Taking a
   ~1600px document out of the flow drops the whole page below the fold, the
   browser's own scrollbar disappears, and every panel measures ~15px wider than
   it will be once the document comes back. On PCR that made Fit exactly 2px too
   wide - the frame's 1px borders - so `Fit` left the document permanently
   scrolling sideways inside its box.
   *Fix:* freeze the height (`style.height = getBoundingClientRect().height`)
   and collapse the **width** only. Collapsing the width is all Gotcha 11 ever
   needed; the height was collateral. Keeping the height also keeps the wrap's
   own vertical scrollbar up, so `clientWidth` already excludes it and the
   separate `scrollbar` reservation is gone.
2. **Fitting changes the thing being measured.** On arrest the page fits the
   viewport at 100% but not at Fit, so applying Fit *creates* the window
   scrollbar and narrows the panel by 15px under the freshly-applied zoom. No
   single measurement can see that.
   *Fix:* `setZoom()` applies, re-clamps against the box as it now is, and
   applies again if that shrank. **One pass is enough and it cannot loop**,
   because `clampZoom` only ever shrinks.

Symptom to recognise: `Fit` lands 1% high and the document scrolls sideways by a
few px, but only when you click it from the default 100% - clicking it a second
time "fixes" it. **Assert `wrap.scrollWidth <= wrap.clientWidth` immediately
after the first `fitZoom()` from 100%,** not just after a round trip through a
zoomed state. That is the assertion both earlier harnesses were missing.

### 16. PCR-specific: three funnels that do not look like funnels

- **`begin()` belongs in `renderBody()`, not `drawForm()`.** The page renders to
  a cached offscreen canvas and crops it; if the content outgrows the buffer,
  `drawForm()` resizes and calls `renderBody(octx)` **again**. A second
  `begin()` discards the first pass, which is exactly what you want.
  `end()` stays at the very end of `drawForm()`. Put `begin()` in `drawForm()`
  instead and every ref registers twice, and the occurrence index would happily
  believe it. The crop is `drawImage(off, 0, 0, ...) -> (0, 0)`, so logical
  coordinates map 1:1 onto the visible canvas - no offset math.
- **Not every checkbox goes through `checkItem()`.** `drawResponseMode()` calls
  the lower-level `chk()` directly for the 8 `rm_*` / `fs_*` boxes, because the
  label sits *between* the two boxes and belongs to both. Instrumenting only
  `checkItem` leaves 8 of the 90 dead, and the coverage assertion is what
  catches it. Those 8 get a box-sized hitbox (`x-2, baseline-8, 11, 11`) rather
  than the box-plus-label strip the other 82 use.
- **`combRow` is one value, not N cells.** It paints an uppercased value into
  per-character boxes. Register a single strip over the boxes (not the whole
  cell - the top belongs to the label) and pass `transform: "upper"` so the
  editor reads the same as the print.

Cells whose value strip is smaller than the drawn cell (`combRow`,
`valueChecklistRow`, `sceneRow`'s location/GPS) register **just the strip**, so
the empty-field dashed outline hugs the value instead of boxing a 48px-tall
cell. The harness asserts no two hitboxes overlap, which is what keeps those
hand-written strips honest.

### 17. A text editor over `<input type="datetime-local">` silently blanks it

Firearm's `report_datetime` is the app's only `datetime-local`. `openEditor()`
inferred `"text"` for it (the old inference only knew `date` and `time`), so the
editor wrote `"07/24/2026 09:30"` straight into the source - which the input
rejects, storing `""`. The document then printed `-` while the editor still
showed the typed value. **A silently-rejected write is worse than a crash**;
nothing warned.

Fixed generically, so nothing else has to think about it:

- `inferKind(src)` now maps `datetime-local` to `kind: "datetime"`.
- `buildDateEditor(src, kind)` is driven by a `DATE_KINDS` table -
  `{ toDisplay, fromDisplay, mask, placeholder, native }` per kind. The three
  nodes (masked text field, invisible native anchor, picker button) and the
  whole blur/`pickerOpen` dance are shared with `date`; only the converters and
  the anchor's `type` differ. `.guma-ce-editor-date` styling is reused as is, so
  `js/guma-styles.js` needed no change.
- Typing 12 bare digits masks to `07/24/2026 09:30`; anything incomplete writes
  `""`, exactly like the date editor.

**If a new input type ever appears, check `inferKind()` first.** The fallback is
a text editor, and a text editor is only safe over inputs that accept arbitrary
strings.

### 18. Removing a faction switcher is a serialization change

Phase 4 dropped firearm's faction switcher for an editable header line
(`#agency_name`). Three things had to move together, and missing any one of them
is silent:

1. **The payload.** `FACTION_KEY` / `custom` left `fdSerializeState()`, and
   `agency_name` joined `FD_GENERAL_IDS`, so the generic
   `FD_GENERAL_IDS.forEach(setVal)` hydrate loop carries it for free.
2. **Old saves.** Reports already in `localStorage` carry a `FACTION_KEY` and no
   `agency_name`. `fdLegacyAgency(payload)` maps the key (or the custom name)
   back to an agency name, and `js/factions.js` stays loaded **only** for that
   lookup. `js/ui-helpers.js` was dropped - `buildFactionSwitcher` was its only
   caller here.
3. **`buildFaction`** was removed from the `GumaHistoryWiring.register` call.
   It is evaluated at *save* time, so old records keep the badge they were
   stored with; only new ones have none.

The header registers like traffic's `STATE OF ...` line: its own `field()` with
an explicit box, `fontPx: 10`, `align: "center"` and `transform: "upper"` - the
input keeps whatever case was typed while the document prints caps. **It is not
a table cell, so the h >= 18 rule (Gotcha 14) does not apply to it** - the
harness excludes it from that assertion by ref rather than weakening the rule.

**The source input ships empty, and that is load-bearing.** The dashed
empty-field outline is drawn per *empty* source (`isEmptyValue`), so an input
carrying `value="LOS SANTOS POLICE DEPARTMENT"` printed the same header but with
no outline - the line did not read as editable. Traffic solves this by leaving
`state_name` empty and painting a fallback, and firearm now does the same:
`agencyName()` returns `DEFAULT_AGENCY` when the input is blank, the input
carries only a `placeholder`, and the box hugs the printed line
(`measureText(...) + 10`, floor 140) instead of spanning the body width, so the
outline wraps the text rather than boxing empty paper.

One consequence to keep in mind: an untouched report serializes
`agency_name: ""`. The hydrate fallback is therefore gated on
`payload.FACTION_KEY` - writing the default into the input for a *current*
payload would silently kill the outline on every load.

## Remaining instrumentation notes

Ordered by phase, so the next one to do is first.

### Phase 3 - PCR: what was built (done)

**Inventory as instrumented.** 28 value fields (`PCR_TEXT_IDS`) + exactly 90
checkbox fields (`PCR_CHECK_IDS`) = **118 registrations per pass, zero action
chips** (no repeatable rows, no faction switcher, no pick-one boxes). Both
catalogs are derived arrays already in the file, so the harness asserts coverage
against them rather than a hand-written list.

`SCALE` is 2 as everywhere, but `DOC_W = 600` and `MARGIN = 26`, not the 640/24
of arrest and traffic.

**Per-funnel, as it landed.**

- `checkItem()` registers `(x - 1, baseline - 8, maxW, 11)`, the box-plus-label
  strip. Items are 11px apart, so the strips tile edge to edge and never
  overlap. 82 of the 90 checkboxes come through here; see Gotcha 16 for the
  other 8.
- `valueRow()` takes `opts.ref` on the cell spec and registers the whole cell.
  Cell specs now come from three helpers - `vcell` / `vdate` / `vtime` - so the
  printed value and the hitbox ref are declared once (the arrest `f`/`fd`
  pattern; the names are longer because PCR shares its top-level scope with
  `counters.js` and `components.js`). `valueRow` also got the Gotcha 14 clamp,
  `Math.max(y + h - 5, y + 15)`, matching the one in traffic's `cell()`. PCR's
  metrics put its threshold at **h >= 19.5**; the six call sites are 26, 22, 20,
  20, 20, 20, so the clamp is defence only.
- `combRow()` takes an optional trailing `ref` and registers one strip over the
  character boxes with `transform: "upper"`.
- `valueChecklistRow()` takes `valueCell.ref` and registers an 18px strip over
  the value; `drawChecklistFixed`/`checklistCell` need nothing, `checkItem`
  covers them.
- `sceneRow()` registers `location_type`, `gps_lat` and `gps_long` as 20px
  strips at `y + h - 26` - the cell is 48px tall and its top belongs to the
  section title.

**Gotcha 13 sweep: clean.** Every value PCR prints already reads from an input.
No new form fields were added, and the form markup is unchanged apart from
`guma-ce-host`.

**Perf (Risk 4): closed.** A full `drawForm()` - offscreen render, crop, 118
registrations, chrome rebuild - measures **~0.8 ms** averaged over 20 redraws in
headless Chrome. `GumaCanvasEdit.schedule()` was not needed and is still unused
by any page.

### Phase 4 - Firearm: what was built (done)

**Inventory as instrumented,** with one row per repeatable block: **11 page
fields + 4 checkboxes + 14 x 2 officer columns + 17 civilian fields = 56
registrations, plus 6 chips** (3 `+ Add`, 3 `✕`). `DOC_W = 580`, `MARGIN = 30`,
`SCALE = 2`.

The coverage assertion is derived, not written out: `FD_OFFICER_FIELDS` (now
`OFF_COLS.map(c => c.key)`) and `FD_CIVILIAN_FIELDS` were extracted so the draw
path, both collectors and the serializer read one list. That refactor removed
four hand-maintained copies of the same key set.

**Per-funnel, as it landed.**

- `gridRow()` takes `opts` on the cell spec (`ref`, `kind`, `minEditW`) and
  registers the whole cell. Specs come from `fdCell` / `fdDateCell` /
  `fdRowCell` - the arrest `f`/`fd`/`pf` pattern, renamed because this page
  shares its top-level scope with `factions.js`, `counters.js` and
  `components.js` (Gotcha 6).
- `drawOffRow()` registers all 14 columns of a row. The column labels live in
  `drawOffHeader` (`wrapText`, never instrumented - Gotcha 10), so `label` here
  is only the editor's tooltip. `minEditW: 44` keeps the 21px `Age` / `IOD`
  cells from opening 21px editors.
- **The `Y/N` columns are `field`s, not pick chips.** Gotcha 12 asked the
  question; the answer here is that the document prints a *value* (`Y`/`N`/`-`)
  from a 3-option `<select>`, rather than painting one-of-N boxes. The same goes
  for `Sex`. Only a control the canvas already draws needs `kind: "pick"`, and
  this page has none.
- **The four incident-type boxes are ordinary checkboxes**, each with its own
  source input, registered as a box-plus-label strip clamped to its own column
  so the left one cannot swallow the right one's boxes.
- `drawCivBlock()` uses `fdRowCell` throughout and hangs a `✕` chip off the
  block's top-right.
- The three 18px civilian rows became **20px** (`CIV_ROW_H`). `gridRow` prints
  its value in 9px Arial at `y + h - 5`, so the Gotcha 14 threshold on this page
  is h >= 19.5, not 18: at 18 the value's glyph tops ran into the label's
  descenders on `Foreign Language Spoken`. `gridRow` also got the clamp
  (`Math.max(y + h - 5, y + 14)`) as defence.

**Nothing is ellipsized. This is the page's rule now** (the user's, stated
plainly: it is a report, and an ellipsis silently drops what somebody typed).
`Wt.` is 26 logical px and `195lbs` measures ~25px at the 8.5px body size, so a
perfectly ordinary value printed as `195…`. Three mechanisms together, and all
three are needed - none of them is sufficient alone:

- **Shrink.** `fitFont()` steps the size down in 0.5px increments until the
  value fits. The size is computed **per column across every officer row in the
  document** (`offColFonts`, fed `involvedRows.concat(witnessingRows)`), never
  per cell: per cell, two adjacent rows would print the same column at different
  sizes, which reads as a rendering bug rather than as a fitted table.
- **Wrap.** The two free-text officer columns carry `lines: 2` and go through
  `fitBlock()` / `wrapLines()`, which greedily word-wraps and hard-breaks a word
  too long to stand alone. `Area/ Division/ Detail` also starts smaller
  (`basePx: OFF_WRAP_PX`): it is the narrowest free-text column on the form and
  reads better small and wrapped than large and cut. Labelled `gridRow` cells
  stay single-line - the label owns the top of the cell - so they only shrink.
- **Cap the input.** Shrinking has a floor (4.5px, deliberately below anything
  readable so it is never actually reached), so the form refuses text a column
  cannot print: `FD_MAXLEN` maps page ids and row-field suffixes to a
  `maxLength`, applied by `fdApplyCaps()` at init and on every new dynamic row.
  `FD_MAXLEN_CIV` overrides where the same suffix means a different cell - a
  civilian `name` is one line under a label, an officer `name` is two.
  **`canvas-edit.js` copies `maxLength` onto its editor**, or typing over the
  document would quietly bypass the whole rule.

The harness fills every text input to its cap at once with all-caps words and
asserts `clip()` never fires. It is patched, not inspected: `clip` is a page
global, so the test replaces it and records any truncation. Note the sample is
*words*, not a single repeated capital - an unbroken run of `W`s is harsher than
anything a report receives and would force caps far below what these fields are
for (it is what first flagged `wt: 8` and the civilian `name`).

**Padding rows are gone** (Gotcha 5). `Math.max(3, rows.length)` and the
`Array(n).fill({})` shared-reference hazard went with them; the document now
renders exactly the collected rows and **starts with one row per block** (the
user's call - `addOfficerRow` twice plus `addCivilianRow` at init). Each block
reserves an `ADD_CHIP_H = 18` strip for its `+ Add` chip.

**Dates now print `mm/dd/yyyy`** (the user's call). The page used to print raw
ISO, which no other report does and which the date editor cannot honestly show.
`fmtDate` was added and `fmtDatetime` reworked; `report_datetime` prints
`mm/dd/yyyy hh:mm` and edits through the new `datetime` composite (Gotcha 17).

**The faction switcher was replaced by an editable header** (Gotcha 18).

**Gotcha 13 sweep: clean.** Every value the firearm draw path prints already
reads from an input; the only string literals are the form number, `Page 1 of 1`
and the section titles, none of which has a source. No new form fields.

**Height estimate fixed.** `contentH` was 30px short - it never counted the
incident-type checkbox strip - and the old `+6` inter-section gap became the
chip strip. Invisible while the A4 floor won, which is why it survived; the
harness now asserts the footer still fits for 1-6 rows in every block.

**Perf:** ~0.4-1.8 ms per full redraw over 20 redraws in headless Chrome.

### Phase 4b - No ellipsis on arrest, traffic and PCR (next)

Firearm's rule applies to all four reports: a value that does not fit is a
**form** problem, not a print problem. Shrink it, wrap it where the cell has
room, and cap the input so the floor is never reached. The mechanism, the
reasoning and the harness assertion are written up in **"Nothing is ellipsized"**
under *Phase 4 - Firearm*; this block is only what differs per page.

**Take this decision first.** The four helpers (`fitFont`, `fitBlock`,
`wrapLines`, plus `FD_MAXLEN` / `fdApplyCaps`) currently live in
`js/firearm_discharge_investigation.js`. Copying them into three more page
scripts would make a fifth copy of the same family as `clip()` (see the
duplication inventory in the appendix). **Extract them to `js/guma-fit.js`
first** - a classic global script like every other file here, loaded before the
page script. Two constraints:

- **No ES modules**, so it exposes one global (`window.GumaFit = { fitFont,
  fitBlock, wrapLines, applyCaps }`) rather than bare top-level names. Bare
  names would collide across page scripts - Gotcha 6, and `clip`/`getVal`
  already came close.
- The cap **table** stays per page: `FD_MAXLEN` encodes one document's column
  widths and has no meaning on another. Only the applier is shared.

**What clips today, per page.**

| Page | Funnel | Call sites |
| --- | --- | --- |
| `js/arrest-report.js` | `cell()` | 2 (centred + left value) |
| `js/traffic-collision-report.js` | `cell()` | 2 (centred + left value) |
| `js/prehospital-care-report.js` | `valueRow` / `valueChecklistRow` / `sceneRow` | 5 value sites |

Arrest and traffic are the easy ones: a single `cell()` each, the same shape
firearm's `gridRow` had, so the change is one `fitFont()` call plus a cap table.
**Their cells are labelled and single-line** (the label owns the top of the
cell, Gotcha 14), so they shrink and never wrap.

PCR needs more care, in three ways:

1. **Separate values from labels.** Most of PCR's `clip()` calls truncate
   *static* labels and section titles, not user data (`checkItem`, the checklist
   headers, `drawChecklistFixed`). The no-ellipsis rule is about data - but a
   clipped static label is a layout bug in its own right, so log any you find
   rather than shrinking them silently.
2. **`combRow` does something worse than an ellipsis.** It prints `val[i]` for
   `i < maxCells` and simply **drops every character past the last box, with no
   visual sign at all**. There is nothing to shrink - the comb's geometry is the
   limit - so this is purely a cap: `maxLength` = the number of boxes the row
   draws (`Math.min(cells, Math.floor((w - 12) / 11))`, i.e. compute it, do not
   hand-count it).
3. **`sceneRow`'s location / GPS** clip against hand-written widths rather than
   a funnel; they need the same treatment inline.

**Verification.** Copy the two Phase 4 assertions verbatim - they are cheap and
they are what found the three bad caps on firearm:

- Patch the page's global `clip` in the harness, fill **every** text input to
  its cap at once with all-caps *words*, redraw, and assert `clip` never fired.
  Words, not a run of `W` - see the note under Phase 4 for why.
- Assert every text input actually carries a cap, so a field added later cannot
  quietly opt out.

For PCR add one more: fill each comb row past its box count and assert the
source value still round-trips through serialize/hydrate unchanged (the cap must
prevent the input, not silently truncate what is already stored).

Re-run all four page harnesses afterwards, and regenerate every showcase
screenshot whose columns visibly re-flow.

### Phase 5 - Randomize Character

New branches in `js/random-character.js`:
arrest (arrestee + officers), traffic (parties), firearm (officers +
civilians). **Not PCR** - `PCR_TEXT_IDS` has no person fields at all. Note there
is currently no DOB generator: `randomizeCharacter` rolls `age` but never a date
of birth, and all three pages have `dob` inputs.

## Risks, with pilot outcomes

1. **DOM collectors return empty after a structural change.** *Mitigated:* no
   re-parenting anywhere, plus a dev-only `console.warn` in `end()` for any
   registered ref that does not resolve. No incidents in the pilot.
2. **Stale editor after hydrate.** *Closed:* `GumaCanvasEdit.cancelEdit()` at
   the top of `arHydrateState`, `tcHydrateState`, `pcrHydrateState` and
   `fdHydrateState`. `end()` also drops an editor whose ref vanished from the
   registry. No page has a faction switcher any more, so the second trigger is
   gone.
3. **Export contamination.** *Resolved and measured:* byte-identical export, see
   Verification. Keep the DOM-only-chrome invariant. Re-confirmed on traffic in
   Phase 2.
4. **Perf on PCR.** *Closed in Phase 3:* ~0.8 ms per full redraw with all 118
   hitboxes registered. The cached offscreen canvas and the single-SVG chrome
   overlay carried it; rAF coalescing was never needed.
5. **Coordinate drift.** *Mitigated:* `ResizeObserver` on the canvas, which
   catches zoom, window resize and scrollbar appearance in one place. Note the
   scrollbar the *zoom itself* creates is a separate problem, fixed in
   `setZoom()` - Gotcha 15.
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

No test suite exists, and adding one would mean build tooling the project has
deliberately avoided. Each phase is instead verified with a **throwaway
headless-Chrome harness** in the scratchpad, adapted from the capture script in
`.claude/commands/screenshot.md` (static server + CDP over Node's global
`WebSocket`/`fetch`, no npm deps). Phase 2 took it from ~10 assertions to 48;
rebuilding it costs maybe fifteen minutes and has paid for itself twice.

**If you keep one thing from this section, keep the recorder.** The registry is
not exposed on `window`, so instead monkey-patch the entry points before
drawing. Everything else in the harness is built on the boxes it returns.
**Patch `begin` as well as `field`/`action`** - resetting on `begin` makes the
recorder mirror the registry's own "last pass wins" semantics, which is what
makes a page whose body renders twice (PCR) countable at all:

```js
window.__rec = { passes: 0, fields: [], actions: [] };
const CE = window.GumaCanvasEdit, ob = CE.begin, of_ = CE.field, oa = CE.action;
CE.begin  = function () {
  window.__rec.passes++; window.__rec.fields = []; window.__rec.actions = [];
  return ob.apply(this, arguments);
};
CE.field  = function (ref, x, y, w, h, opts) {
  window.__rec.fields.push({ ref, x, y, w, h, opts: opts || {} });
  return of_.apply(this, arguments);
};
CE.action = function (id, x, y, w, h, handler, opts) {
  window.__rec.actions.push({ id, x, y, w, h, opts: opts || {} });
  return oa.apply(this, arguments);
};
window.__draw = function () { window.__rec.passes = 0; drawForm(); return window.__rec; };
```

Page code calls `window.GumaCanvasEdit.field(...)` by property lookup at call
time, so the patch takes effect immediately. It records **call arguments**, so
`occ` is absent - filter by ref and index instead of reading `occ` back
(a Phase 2 test failed on exactly that mistake).

Two assertions worth copying verbatim from Phase 3, both cheap and both caught
real mistakes:

- **No two hitboxes overlap** (all pairs, epsilon 0.05 logical px). Adjacent
  cells and tiled checkbox strips touch at exactly 0, so anything above the
  epsilon is a mis-sized box stealing another field's clicks.
- **Every hitbox lies inside the cropped canvas.** On a page that renders
  offscreen and crops, this is what proves the coordinate mapping is 1:1.

Clicking a registered box, given the recorder:

```js
const k = (canvas.clientWidth / canvas.width) * SCALE;   // CSS px per logical px
const r = canvas.getBoundingClientRect();
canvas.dispatchEvent(new PointerEvent("pointerdown", {
  clientX: r.left + (box.x + box.w / 2) * k, clientY: r.top + (box.y + box.h / 2) * k,
  bubbles: true, cancelable: true, pointerId: 1, isPrimary: true }));
```

Three harness mistakes worth not repeating, all from Phase 2:

- **`Enter` does not close the editor**, it commits *and advances*. Assert that
  the next field's editor opened at the next box, not that the editor is gone.
- **An export-purity check must not change a value.** Open the editor, raise the
  hover, capture - then edit. Typing first makes the two captures differ for a
  legitimate reason and the test "fails" on nothing.
- **Assert the chrome was actually up** during the purity capture, or the test
  passes vacuously when the overlay silently stopped rendering.

Useful CDP calls beyond `Runtime.evaluate`: `Emulation.setDeviceMetricsOverride`
/ `clearDeviceMetricsOverride` for the breakpoint gate (the `matchMedia`
listener fires on override, so both directions are testable in one session), and
`Page.captureScreenshot` for the two-theme visual pass.

**Prefer the chrome-up/chrome-down form of the purity check from Phase 2 on.**
Phase 1 compared against a copy of the pre-change build on a second port, which
only works while the document layout is unchanged - Phase 2 deliberately changed
it (padding parties dropped, add-chip strip added). The replacement is stronger
anyway and needs no second build: capture `toDataURL()`, open an editor, move
the pointer to raise the hover highlight, confirm outlines and chips are in the
DOM, capture again, and require the two strings to be identical. Assert that
the chrome really was up, or the test passes vacuously.

What was checked automatically in Phase 1, all passing:

1. **Export purity, byte level.** Rendered the same data on the current build
   and on a copy of the pre-change build served from a second port, compared
   `toDataURL()` output: **identical, 128926 bytes both**.
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

What was checked automatically in Phase 2 - **48 assertions, all passing** -
plus a **9-assertion regression run against the arrest report**, because
`canvas-edit.js` changed under it:

1. **Registry coverage, derived rather than eyeballed.** The harness monkey-
   patches `GumaCanvasEdit.field/action` to record every registration, then
   asserts that all 21 `TC_SCALAR_FIELDS` and all 25 party fields x 3 parties
   are reachable, that every registered ref resolves to a real input, and that
   the pick/add/remove chip counts are 7 + 15 + 1 + 3. This is the check worth
   copying verbatim to Phases 3-4; on PCR it is the only sane way to confirm
   90 checkboxes. It is also what catches a cell you forgot to wire when you
   add fields (Gotcha 13) - drive the assertion off the serialization arrays,
   not off a hand-written list.
2. **Export purity** in the chrome-up/chrome-down form described above.
3. **Editing**: write-through, editor survives its own redraw, `Enter` commits
   *and advances* (it does not just close - Phase 1's note is easy to misread),
   `Shift+Tab` steps back, `cancelEdit()` removes.
4. **Date editor**: shows `03/14/2026` for a source of `2026-03-14`, `07242026`
   masks to `07/24/2026` and writes `2026-07-24`, `Escape` reverts.
5. **Duplicate ref**: `tow_away` registers twice; the editor opens on the
   clicked occurrence and stays there across a redraw.
6. **Pick-one**: clicking a party-type box sets `party_N_type`, clicking a
   day letter sets `day_of_week`, and the chips are computed-transparent.
7. **Repeatable rows**: add appends, remove deletes exactly that row, the
   canvas shrinks.
8. **History round-trip**: serialize -> wipe -> hydrate -> serialize, identical.
9. **Zoom**: 100% default, `setZoom(3)` and 12 `+` clicks both land on Fit, Fit
   is the same from above and below, `wrap.scrollWidth === clientWidth` and the
   page never scrolls sideways, persisted under `guma:zoom:traffic`.
10. **Breakpoint gate** via `Emulation.setDeviceMetricsOverride` to 1000px:
    editing off, zoom override cleared, form panel back, chrome layers zero-
    height, **and the exported PNG identical to the wide-mode one**; widening
    again re-activates through the `matchMedia` listener.
11. **Preview modal** opens with both export buttons; no Download/Copy pair
    left on the page.
12. **Both themes** by screenshot; zero page errors and zero dead-ref warnings.

What was checked automatically in Phase 3 - **58 assertions on PCR, all
passing** - plus a **46-assertion regression run across arrest and traffic**,
because `canvas-edit.js` changed under them (and that run is what found
Gotcha 15):

1. **Registry coverage**, driven off `PCR_TEXT_IDS` and `PCR_CHECK_IDS`: all 28
   value fields and all 90 checkboxes reachable, nothing registered twice,
   nothing registered that is not in either catalog, every ref resolving to a
   real input, every value field carrying a label, exactly 0 action chips.
2. **Geometry**: no two of the 118 hitboxes overlap, every hitbox lies inside
   the cropped canvas, no value box below 17 logical px, every checkbox strip
   exactly 11.
3. **Export purity** in the chrome-up/chrome-down form, with the chrome-was-up
   assertion. Note the demo fill leaves no empty field, so **blank one field
   before the capture** or the outline layer is legitimately empty and the
   chrome-was-up check fails on nothing.
4. **Editing**: write-through, editor survives its own redraw, `Enter` commits
   *and advances*, `Shift+Tab` steps back, `Escape` reverts, `cancelEdit()`
   removes.
5. **Date editor**: `03/14/2026` shown for `2026-03-14`, `07242026` masks and
   writes back `2026-07-24`, `Escape` restores.
6. **Time cell** opens a native `type="time"` editor prefilled from the source.
7. **Comb rows**: editor computed-uppercase, source keeps what was typed.
8. **Checkboxes**: click toggles the source and opens no editor.
9. **History round-trip**: serialize -> wipe -> hydrate -> serialize identical,
   with the wipe itself asserted to have changed something.
10. **Zoom**: 100% default, `setZoom(3)` lands on Fit, Fit identical from above
    and below, `wrap.scrollWidth <= clientWidth` **immediately after the first
    Fit from 100%**, page never scrolls sideways, persisted under
    `guma:zoom:pcr`.
11. **Breakpoint gate** via `Emulation.setDeviceMetricsOverride` to 1000px:
    editing off, zoom override cleared, form panel back, chrome layers
    zero-height, **exported PNG identical to the wide-mode one**; widening
    re-activates through the `matchMedia` listener.
12. **Preview modal**: present, opens with a blob image, both export buttons
    inside it and exactly one of each on the page, counter mirrored,
    `window.GumaExport` wired.
13. **Perf**: ~0.8 ms per redraw, asserted under 60.
14. **Both themes** by screenshot with an editor open and the hover raised; zero
    page errors and zero dead-ref warnings throughout.

The regression run re-checked, on arrest and traffic: zoom (including a
panel narrowed to 800px), export purity with chips up, editing, the date editor,
and the breakpoint gate in both directions.

What was checked automatically in Phase 4 - **107 assertions on firearm, all
passing** - plus the **46-assertion arrest/traffic** and **58-assertion PCR**
runs re-executed unchanged, because `canvas-edit.js` changed under them again:

1. **Registry coverage**, derived from `FD_GENERAL_IDS`, `INCIDENT_TYPES`,
   `FD_OFFICER_FIELDS` and `FD_CIVILIAN_FIELDS` crossed with the live rows: all
   56 value fields and 4 checkboxes reachable, nothing registered twice, nothing
   registered outside the catalogs, every ref resolving, every value field
   labelled, and the `date`/`datetime`/`time`/`select` kinds landing where
   intended (2/1/1/16).
2. **Chips**: exactly `add_involved`, `add_witnessing`, `add_civilian` plus one
   `rm_*` per row, three `add` and three `remove`, no `pick`.
3. **Geometry**: no two of the 62 hitboxes *or chips* overlap, everything lies
   inside the canvas, no value box below 18 logical px (the agency header is
   excluded by ref - see Gotcha 18).
4. **Height estimate**: for 1-6 rows in every block, the drawn content still
   clears the footer line. This is the check the old 30px-short estimate would
   have failed.
5. **Nothing is ellipsized**: with two officer rows carrying `195lbs` and
   `210lbs` no narrow column clips, the `Wt.` column really did drop below the
   base size while a column that already fits keeps it, every text input carries
   a cap, **filling all of them to their cap at once truncates nothing**, and
   `Area/ Division/ Detail` wraps a real division name over two lines at a
   smaller size with every word intact.
6. **Export purity** in the chrome-up/chrome-down form, asserting the editor,
   the outlines *and* all six chips were really up during the capture.
7. **Editing**: write-through, editor survives its own redraw, `Enter` commits
   and advances to the next *column*, `Shift+Tab` steps back, `Escape` reverts,
   `cancelEdit()` removes.
8. **Date**: `03/14/2026` shown for `2026-03-14`, `07242026` masks and writes
   back, `Escape` restores.
9. **Datetime**: the document prints `03/15/2026 01:20`, the editor shows the
   same, the anchor is a `datetime-local`, `072420260930` masks to
   `07/24/2026 09:30` and writes `2026-07-24T09:30`, **incomplete input blanks
   the source rather than writing garbage**, `Escape` restores.
10. **Time** opens a native `type="time"` prefilled from the source.
11. **Y/N column** opens a `<select>` mirroring the source's options and writes
    through.
12. **Checkboxes**: click toggles the source and opens no editor.
13. **Repeatable rows**: the add chip appends and the document grows by exactly
    one row height; the remove chip deletes *that* row while the sibling keeps
    its hitboxes; past the A4 floor the canvas backing store itself grows
    monotonically and shrinks back. **Assert content bottom, not canvas height,
    at small row counts** - the A4 floor otherwise makes both directions
    vacuously true.
14. **History round-trip**: serialize -> wipe -> hydrate -> serialize identical,
    with the wipe asserted to have changed something.
15. **Agency header**: no switcher or custom panel left in the DOM, the source
    ships empty with a placeholder while the document falls back to
    `LOS SANTOS POLICE DEPARTMENT`, the input sits in the collapsed form host,
    the hitbox hugs the printed line, **the untouched header carries the dashed
    outline, the outline disappears once a name is typed and comes back on
    Escape**, the editor is computed-uppercase and carries the source
    placeholder, the source keeps what was typed.
16. **Legacy vs current payloads**: a saved `FACTION_KEY` (or custom faction
    name) hydrates into the agency input, while an untouched current payload
    stays empty so the outline survives a round trip.
17. **Zoom**: 100% default, `setZoom(3)` lands on Fit, Fit identical from above
    and below, `wrap.scrollWidth <= clientWidth` immediately after the first Fit
    from 100% (Gotcha 15), page never scrolls sideways, persisted under
    `guma:zoom:firearm`.
18. **Breakpoint gate** at 1000px: editing off, zoom override cleared, form
    panel back, chrome layers zero-height, **exported PNG identical to the
    wide-mode one**; widening re-activates through the `matchMedia` listener.
19. **Preview modal**: present, both export buttons inside it and exactly one of
    each on the page, `window.GumaExport` wired.
20. **Perf**, and zero page errors / zero dead-ref warnings throughout.
21. **Both themes** by screenshot: the untouched header outline, and the editor
    open with the hover raised.

Two harness mistakes worth not repeating, both from Phase 4:

- **Row indices keep counting up.** `involvedCount` never resets, so a test that
  adds a row after any earlier row churn cannot assume `involved_2`. Read the
  surviving `data-idx` values out of the DOM instead.
- **A4 floor hides height changes.** On a document whose content sits under the
  A4 minimum, `canvas.height` does not move when a row is added. Assert the
  registry's content bottom for the small cases and add rows past the floor for
  the backing-store case.

Still **manual and unverified**, worth doing once in a real browser:

- Native calendar popup in Safari and Firefox (`showPicker()` on the
  zero-opacity anchor input is the part most likely to differ).
- `assets/screenshots/arrest_report.png`, `traffic_collision_report.png`,
  `prehospital_care_report.png` and `firearm_discharge.png` were regenerated
  with Los Santos demo data. Per `CLAUDE.md`, regenerate the matching screenshot
  after each phase.
- `readme.md` still documents none of the WYSIWYG behaviour on any of the four
  pages (only the now-false firearm faction bullet was corrected in Phase 4).
  `/readme` is user-invoked; run it when the branch is ready to merge.

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
  Firearm dropped `ui-helpers.js` in Phase 4 and keeps `factions.js` only for
  legacy payload hydration (Gotcha 18), so those two pages are now the only
  ones carrying both for nothing.
- **Dead code in `traffic-collision-report.js`.** `sectionBar()` is defined and
  never called (the LOCATION bar is drawn inline, rotated), and `getCode()` is
  unused - `collectParties()` inlines the same `split(" ")[0]`. Left alone in
  Phase 2 to keep the diff to the WYSIWYG work.
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
  Phase 4b adds a fifth member to that family (`fitFont` / `fitBlock` /
  `wrapLines` / the cap applier, currently firearm-only) - which is why 4b
  starts by extracting them to `js/guma-fit.js` rather than copying them three
  more times.
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
