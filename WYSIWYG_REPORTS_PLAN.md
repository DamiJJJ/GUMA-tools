# WYSIWYG canvas editing for Report Generators

> Feasibility assessment, implementation plan and running log.
> **Phases 0-4b are done and verified. All four in-scope report pages are now
> WYSIWYG, and none of them ellipsizes a printed value.** **Phase 5 was
> cancelled** by the user; nothing is queued.
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
| **4b - No ellipsis anywhere** | `js/guma-fit.js` extracted; shrink + input-cap carried to arrest, traffic and PCR | **Done, 63/63 automated checks across all four pages** |
| **5 - Randomize Character** | New branches in `js/random-character.js` | **Cancelled - the user does not want it.** These are in-game documents filled with real characters' data; a randomizer has nothing to contribute. |
| **6 - Personnel File Generator** | WYSIWYG on `personnel_file_generator.html` | **Declined by the user after review - see "Phase 6: why not" below.** The no-ellipsis rule was carried there instead. |
| **4c - No ellipsis outside the reports** | Personnel file + officer / firefighter card generators, tables **and** document faces | **Done, 48/48 automated checks + a 55-check report regression** |
| **4d - Preview panel polish** | Preview box fits the viewport on all 8 pages; zoom control centred, enlarged and stripped of `Fit` | **Done, measured at 3 viewports x 8 pages, both themes** |

Phases 0-1 shipped as commit `2a4a757` on `feat/wysiwyg-canvas-edit`;
Phase 2 as `28b7d36`; Phase 3 as `fd0ad2d`; Phase 4 as `a46cc13`.

Phase 4b files: **new** `js/guma-fit.js`; `js/arrest-report.js`,
`js/traffic-collision-report.js`, `js/prehospital-care-report.js` (shrink at the
value funnels + a per-page cap table); `js/firearm_discharge_investigation.js`
(its four local helpers deleted in favour of the shared ones); one
`<script src="js/guma-fit.js">` tag added ahead of `canvas-edit.js` on all four
report pages. **No `js/canvas-edit.js` change** - it already copied `maxLength`
onto its editor, which is the one thing the rule needed from it. No screenshot
changed: none of the four carries a clipped value (verified by eye), and the
render is byte-identical for any value that already fitted (verified in the
harness).

One unrelated fix rode along, reported by the user: **traffic's rotated
`LOCATION` bar was 3px shorter than the rows it spans** (Gotcha 20). That one
*does* move the output, but only by closing a gap - no screenshot re-flows.

Phase 4d files: `js/canvas-edit.js` (`buildToolbar()` - `Fit` button removed,
`aria-label` on each button, an `extra`-class parameter for the `%` readout);
`js/guma-styles.js` (`.guma-ce-toolbar`, `.guma-ce-zoom-btn`,
`.guma-ce-zoom-value`, `.guma-ce-hint`, and the two wrap reserves); all 8
generator pages (panel padding and header margin trimmed);
`business_card_generator.html` (its own `26rem` reserve, Gotcha 23). `fitZoom()`
itself is untouched - it is still the zoom ceiling, it just has no button.

Uncommitted - the user commits, never the agent.

## Next session: start here

**Nothing is queued.** WYSIWYG is finished on all four in-scope report pages,
Phase 5 was cancelled and Phase 6 was declined (both by the user, reasons
below). The no-ellipsis rule now covers **every page in the app that prints a
form value** - four reports, the personnel file, and both card generators.
What is left is optional and each item is independent:

- **`readme.md` documents none of the WYSIWYG behaviour** on any of the four
  pages. `/readme` is user-invoked; run it when the branch is ready to merge.
- **`js/business-card.js` still has its own `bcFitFontToWidth`** - a sixth copy
  of the shrink helper. It already does the right thing (shrinks, never
  truncates), so it was deliberately left alone: folding it into
  `GumaFit.fitFont` would change every exported business card, because the
  shared helper steps in 0.5px and the local one in 1px. Worth doing as its own
  change, not as a rider on someone else's.
- The cosmetic calls listed just below.

### Phase 6: why not

The user asked whether WYSIWYG made sense on the personnel file. It does not,
for four reasons, in descending order of weight:

1. **It is a layout, not a form.** The four pages where WYSIWYG paid off are
   replicas of real LAPD forms: a grid of labelled cells, each mapping 1:1 to an
   input, where a cell visibly *looks* clickable. The personnel file is a
   designed document - faction accent, CONFIDENTIAL stamp, styled tables, a
   prose notes block. The dashed empty-field outline that reads as "type here"
   on a form would read as visual noise here.
2. **`SCALE = 1`.** It renders at `canvas.width = 840` with no `ctx.scale`,
   while zoom in the editor is CSS scaling of the backing store - so the
   document goes soft the moment anyone zooms past 100%, and zoom is half of
   what makes WYSIWYG worth having. Fixing it means `SCALE = 2`, which doubles
   every exported PNG from 840 to 1680px wide: a product decision, not a
   rendering tweak.
3. **Row fields have no ids.** They are collected by CSS class inside `.pf-row`,
   so a ref would have to be a *positional* selector
   (`#pfEcRows > .pf-row:nth-child(3) .pf-ec-name`). Remove row 2 and that ref
   silently points at a different person's data - worse than the `occ` problem
   from Phase 2, which was merely visible.
4. **The debounce and the textarea.** Every other page redraws per keystroke;
   this one debounces at 300ms, which feels wrong when you are typing *onto* the
   document. And `#pfNotes` would need a `multiline` editor kind that does not
   exist, i.e. new surface in `canvas-edit.js` and new risk to four pages that
   already work.

What the page actually needed was the no-ellipsis rule, which is independent of
WYSIWYG and far cheaper. That is what was built - see *Phase 4c* below.

The Gotchas are editor and instrumentation material - read them before touching
`js/canvas-edit.js` or instrumenting a fifth page.

Cosmetic calls the user may still want to make:

- **PCR**: the five run-time rows are `h = 20`, which clears the value/label
  collision threshold by 0.5px (Gotcha 14). Legible, verified at 5x, but
  visibly tight. Bumping them to 22 would relax it at the cost of changing every
  exported PNG's height.
- **The caps** (`AR_MAXLEN`, `TC_MAXLEN`, `PCR_MAXLEN`, `FD_MAXLEN`) are the
  lever if a field turns out to be too tight in practice. Each number is the
  character count its cell carries at that page's readable floor, so raising one
  means the value prints smaller; changing any of them means re-running the
  harness, which is what proves the cap still fits its column.

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
| Default zoom | **100%**, not fit-to-container. Fit made the document too wide to read comfortably. |
| Fit button | **Removed.** The user dropped it: three controls (`− / % / +`) read more clearly than four, and clicking the `%` readout resets to 100% anyway. `fitZoom()` itself stays - it is the ceiling, not a button. |
| Maximum zoom | **Fit is the ceiling.** There is no fixed upper bound any more. Past Fit the document would be wider than its box, and the page scrolled sideways instead. `+`, Ctrl+wheel and `setZoom()` all clamp, and narrowing the window pulls the current zoom down with the cap. |
| Zoom control legibility | The control went unnoticed because it was muted text at 11px. Now `h-9` buttons, `13px` bold, full-strength `guma-*-text` (accent gold only on the `%` readout), measured at **8.9:1 contrast in light and 9.3:1 in dark** - see Gotcha 23. |
| Vertical space above the document | The preview panel's own chrome was trimmed on all 8 pages (`p-6 gap-5` to `px-6 py-4 gap-3`, header `mb-4` to `mb-0`): **158px to 122px** on reports, **106px to 74px** on cards. The document gets the difference. |
| Export surface | The page carries **one** `Preview & Download` button. Download PNG, Copy and the counter live **inside** `<guma-preview-modal>`. There is no Download/Copy pair on the page any more. |
| Repeatable rows | A removed row **disappears** from the document. No empty padding rows to keep a minimum count. Default is 1 row. |
| Date editing | The editor shows the document's own **mm/dd/yyyy**, not the browser locale's format. See Gotcha 3. |
| Native pickers | **Only `<select>` auto-opens its picker on click.** Dates open the calendar from their own button. See Gotcha 4. |
| Values that do not fit | **No printed value may end in an ellipsis, on any of the four reports.** An ellipsis silently drops what somebody typed. The value shrinks (and wraps where the cell has room), and the input is capped at what the column carries at a readable size. Phase 4 on firearm, Phase 4b everywhere else. |
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
Untouched **by the WYSIWYG work**: all Card Generators, `bodycam_overlay.html`.
The Card Generators and the personnel file did receive the no-ellipsis rule in
Phase 4c - that is a print-correctness change, not an editing one.

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
- Zoom UI: a segmented control (`− / % / +`) injected into `#ceToolbar`, plus
  Ctrl+wheel. **The wheel handler is gated on `ctrlKey`** so plain wheel still
  scrolls the page. Persisted as `guma:zoom:<key>`. The `%` is a readout and a
  button both - clicking it resets to 100%. The `−` glyph is a real minus sign
  (U+2212), not a hyphen, so it optically matches the `+`.
- **The hint is absolutely positioned** at the toolbar's right edge. In flow it
  centred the *group*, which pushed the buttons 112px left of the document they
  drive. The toolbar only renders from `xl`, where it is never narrower than
  ~1150px, so the hint cannot reach the buttons.
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

### 6. `js/guma-fit.js` - shrink-to-fit and input caps (Phase 4b)

One global, `window.GumaFit`, loaded immediately before `canvas-edit.js` on all
four report pages. Same no-bare-top-level-names discipline as the registry
(Gotcha 6) - four page scripts share one scope, and `fitFont` is exactly the
sort of name that would collide.

```js
fitFont(ctx, text, maxW, basePx, minPx, font?)   -> px      // one line, shrink only
fitBlock(ctx, text, maxW, lines, basePx, minPx, font?)      // -> { px, lines }
wrapLines(ctx, text, maxW, maxLines)             -> string[] // measures at ctx.font
capFor(id, table, variants?)                     -> number|null
applyCaps(root, table, variants?)                            // sets maxLength
// font = (px) => "bold 8px Arial"; defaults to px + "px Arial". Needed because
// arrest and traffic paint some cells bold and fitFont owns ctx.font.
```

`capFor` matches an **exact page-level id first, then the longest field-suffix**,
so `owner_name` wins over `name` on a traffic party row. `variants` is how one
suffix means two things in different row families: firearm passes
`[{ prefix: "civ_", table: { name: 28 } }]` because a civilian name is one line
under a label while an officer name wraps over two.

**The cap tables stay per page.** They encode one document's column widths and
mean nothing on another; only the lookup and the applier are shared. Each page
keeps a one-line `xxApplyCaps(root)` wrapper so the call sites (init, and every
dynamic row builder) read the same on all four.

### 7. `<guma-preview-modal>` in `js/components.js`

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
of Phase 2, 15-16 out of Phase 3, 17-18 out of Phase 4, 19-20 out of Phase 4b,
21 / 21b / 21c / 21d / 22 out of Phase 4c.** Read 12-22 before any further
instrumentation; 1-11 matter mainly if you touch the editor itself. **22 is not
about this app at all - it is about the harness, and it froze a laptop.**

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

### 19. `maxLength` caps typing, not code - so shrinking is still load-bearing

`el.maxLength` is ignored by `el.value = "..."`. Every path that writes a value
programmatically therefore walks straight past the caps:

- **hydrating an older saved report**, stored before the cap existed or before it
  was tightened,
- the demo fill in a screenshot capture,
- any future bulk-fill or import.

That is *by design* - a cap must never rewrite data somebody already saved
(the harness asserts an over-long comb value round-trips byte for byte). But it
means **the cap alone never guarantees the no-ellipsis rule**; the shrink is
what actually holds when a value arrives from anywhere other than the keyboard.
Which is why the shrink floor is 4.5px on every page: deliberately below
anything readable, so an over-cap value from a legacy payload prints small and
complete rather than truncated.

The corollary for anything that writes values: **generate within the cap.** Read
`el.maxLength` and trim rather than assuming a length.

### 20. A section bar's height must be derived from the rows it spans

Traffic's rotated `LOCATION` bar was written out as `20 + 17` and drew 3px short
of the two rows beside it, ever since Gotcha 14 raised location row 2 from 17 to
20. Nothing broke, nothing warned, and the mismatch is small enough to read as
kerning rather than as a bug until somebody looks at the right-hand edge.

`locSectH` is now `locR1H + locR2H`, with both declared above the bar rather
than beside their own rows. **Any spanning element - a rotated label, a merged
cell, a bracket - computes its extent from the constants the spanned rows use.**
Restating the number is what guarantees it goes stale on the next height change,
and this file already has one row-height change per phase.

The registry is what makes this checkable after the fact: the spanned rows
register hitboxes, so a harness can assert the span against
`lastRow.y + lastRow.h - firstRow.y` rather than against a number copied out of
the same source it is checking.

### 21d. A canvas capped on one axis overflows on the other

The card generators scrolled inside their preview panel. `.guma-canvas-preview`
carried `h-auto w-auto max-w-full` - constrained by **width only** - while
`.guma-canvas-wrap` capped its own height at `xl:max-h-[calc(100vh-19rem)]`. So
a tall document (an officer card carrying employment history is 840x1050) scaled
down to the panel's width, still exceeded the wrap's height, and the wrap
scrolled.

The fix is to give the canvas the *same* height cap as its wrap. A replaced
element constrained on both axes scales down to fit inside both while keeping
its aspect ratio, which is exactly the wanted behaviour - and it is one line,
not JS.

Verified at 1600x1000, 1440x900 and 1366x768 on all four card pages:
`wrap.scrollHeight === wrap.clientHeight`, aspect ratio preserved to within
0.02, never upscaled past native pixels. **Allow 2px of slack on the upscale
check** - `getBoundingClientRect()` is border-box and the class draws a 1px
hairline, so a business card reads 686 against a 684px backing store.

Note the trade-off the user accepted: fitting without scrolling means a short
viewport shows a small card. At 1366x768 the officer card renders 390px wide
against 840 native.

This class is used by the **card generators only** - the four report pages carry
`.guma-ce-canvas` instead - so the change cannot reach the WYSIWYG zoom work.
That is worth re-checking rather than assuming: the earlier warning in this file
against touching `.guma-canvas-preview` was written when the sharing was wider.

### 21c. `maxLength` does nothing on `<input type="number">`

`#age` on both card generators carried `type="number" min="21" max="75"` and was
still completely unlimited: **`maxLength` is inert on number inputs** - the
browser accepts the attribute and ignores it - and `min`/`max` are only checked
at form validation, which none of these pages ever run. Setting a cap on it
therefore *looked* done and did nothing.

`GumaFit.applyCaps` / `applyCapsBySelector` now detect the types that ignore
`maxLength` (`number`, `range`, `color`) and install a live input clamp instead,
marking the element with `data-guma-cap`. A cap now means the same thing on
every input a document prints, which is what the cap tables assume.

Two assertions came out of it, both worth keeping:

- **No `input[type=number]` is left without a cap** - this is the check that
  would have caught `#age`, and it also caught `num_injured` / `num_killed` on
  the traffic report.
- **Every installed clamp actually truncates**, driven by dispatching a real
  `input` event rather than trusting the attribute.

The general lesson: **an attribute that the platform silently ignores is worse
than a missing one**, because the code reads as correct. When a cap mechanism
grows to a new field type, assert the *effect*, not the attribute.

### 21b. A shrink with a floor but no cap only delays the overflow

Every value on the card generators already shrank before Phase 4c - `lv()` down
to 11px, the name headline down to 18px. None of them was capped, so the floor
was **reachable**, and past the floor the text just left its box with nothing to
show for it. The pay lines and the agency header were worse still: fixed size,
no guard at all.

The pair is what works, and only the pair:

- **shrink** so ordinary values stay inside their box at full size,
- **cap** so the floor is never reached, which is the only thing that makes the
  floor a guarantee rather than a last stop before silent overflow.

When auditing a draw path, `measureText` in a `while` loop is not evidence the
value is safe. Ask what happens at the floor.

### 21. Round a character cap DOWN, and assert it prints at the size you sized it for

Three personnel caps were computed as `186 / 6.001 = 30.99` and written as
**31**. Thirty-one Courier characters at 10px measure 186.03px against 186px of
box - over by three hundredths of a pixel, which costs the whole column half a
point of font size. Nothing looked wrong; the column just quietly rendered at
9.5px instead of 10px.

Two habits fix it for good:

- **`Math.floor`, never round.** The cap is a promise that a full-length value
  fits; a rounded-up cap breaks it by a hair, and a hair is enough.
- **Assert the size, not just the absence of an ellipsis.** "Nothing was
  truncated" and "no value hit the floor" both passed while three caps were
  wrong. The assertion that caught it is *"a value at its cap still prints at
  the cap size"* - i.e. check the caps against the thing they were derived from,
  not against the failure they were meant to prevent.

### 22. A CDP harness must kill Chrome's process GROUP, or it will freeze the machine

`proc.kill()` on the pid returned by `spawn()` kills the browser process and
leaves its helpers - gpu, renderer, crashpad - running. At roughly four orphans
per run that is invisible for the first few runs and fatal by the twentieth:
this cost a load average of 18-20 and a hard reboot mid-phase.

The runner in the scratchpad now:

- spawns Chrome **`detached: true`**, making it a process-group leader,
- tears down with **`process.kill(-proc.pid, "SIGKILL")`** - the negative pid is
  the whole group,
- routes every exit path (normal, thrown, `SIGINT`, `uncaughtException`) through
  one idempotent `cleanup()`,
- arms a **watchdog timer** so a hung page still tears down,
- passes `--renderer-process-limit=1 --no-crashpad --disable-dev-shm-usage` to
  keep the group small in the first place.

**Check `pgrep -f 'Google Chrome' | wc -l` before and after a run** while
developing a harness. It should return to its starting value; if it climbs,
stop and fix teardown before running the suite.

Two smaller things from the same session, both environment rather than product:

- `http://127.0.0.1:<port>/json/version` stopped answering under load, while the
  `DevTools listening on ws://...` banner Chrome prints to stderr was always
  reliable. The runner now reads the banner and drives the browser socket with
  `Target.createTarget` + flat `attachToTarget`.
- **Heredocs (`python3 - <<'PY'`) hang** in this tool environment. Write the
  script to a file and run the file.

### 23. A viewport reserve is per-panel, not per-app

`.guma-canvas-wrap` and `.guma-ce-wrap` cap the preview box at
`calc(100vh - <reserve>)` so a tall document scrolls inside its box instead of
stretching the page. The reserve has to cover everything above the box: the site
header, the panel's own header row, the zoom toolbar. Those differ per page, so
**one shared number cannot serve all of them**:

| Wrap | Reserve | Pages |
| --- | --- | --- |
| `.guma-ce-wrap` | `18.5rem` | the 4 WYSIWYG reports (extra toolbar row above the canvas) |
| `.guma-canvas-wrap` | `21rem` | officer, firefighter, personnel |
| `.guma-canvas-wrap` + inline override | `26rem` | business card only |

A single `17rem` was tried first and left `firearm` 7px and `personnel` 46px
below the fold. The business card needs a third value because its **Card Layout
picker costs ~77px** the other generators do not pay; the override is an inline
`xl:max-h-[calc(100vh_-_26rem)]` utility on both the wrap and the canvas, which
beats the `@layer components` rule without a new class. It only binds below
~810px of viewport height, so nothing changes on a normal desktop.

**Both** the wrap and the canvas need the cap. Constraining width only lets a
tall document scale to the panel's width and then overflow its height, which is
what made the cards scroll. Constraining both axes makes a replaced element
scale down to fit inside both while keeping its aspect ratio.

Measured at 1600x1000, 1440x900 and 1366x768 on all 8 pages: the box bottom sits
above the fold everywhere, and no card scrolls inside its box.

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

### Phase 4b - No ellipsis on arrest, traffic and PCR (done)

Firearm's rule now applies to all four reports: a value that does not fit is a
**form** problem, not a print problem. Shrink it, wrap it where the cell has
room, and cap the input so the floor is never reached. The mechanism and the
reasoning are written up in **"Nothing is ellipsized"** under *Phase 4 -
Firearm*; this block is what differs per page and what the numbers mean.

**The extraction came first.** `fitFont`, `fitBlock` and `wrapLines` left
`js/firearm_discharge_investigation.js` for `js/guma-fit.js` (see Architecture 6)
rather than being copied into three more page scripts - which would have made a
fifth member of the `clip()` duplication family in the appendix. `fdCapFor` was
generalised into `GumaFit.capFor` on the way out; firearm's `FD_MAXLEN_CIV` is
now the `variants` argument.

**How a cap is arrived at, and why it is a hardcoded number.** Each page fixes a
*readable floor* - the size at which a full-length value is still worth printing
(`AR_READ_PX` / `TC_READ_PX` = 6, `PCR_READ_PX` = 6.5, against base sizes of 8, 8
and 9). The cap is then the number of characters of a realistic all-caps sample
that fits that cell at the floor, measured once in headless Chrome off the
registered hitboxes. Shrinking has a much lower hard floor (4.5px on every page,
as on firearm) that the caps are supposed to make unreachable - and the harness
asserts it is never reached.

Do **not** derive the caps at runtime from the geometry. A cap is a form-level
promise about what the user may type; recomputing it during a draw would change
what the form accepts as a side effect of a layout tweak, silently.

**Per page, as it landed.**

- **Arrest** (`AR_MAXLEN`, 16 keys, 12 page-level + 4 officer-row suffixes) and
  **traffic** (`TC_MAXLEN`, 31 keys, 13 + 18) each needed one `fitFont()` inside
  their single `cell()`. Both paint some cells bold, which is why `fitFont` takes
  a font builder. **Their cells are labelled and single-line** (the label owns
  the top of the cell, Gotcha 14), so they shrink and never wrap.
- Traffic's `state_name` is the one value on either page not painted by `cell()`:
  the `STATE OF ...` header line has no `maxW` at all and would simply have run
  off the paper. It is capped (120) at what the line fits across `BODY_W` at its
  fixed bold 7px, and is **not** shrunk - same treatment as firearm's agency
  header, which is capped at 44 against a measured ceiling of 84.
- **PCR** got a `pcrValue()` helper covering all five value sites (`valueRow`,
  `valueChecklistRow`, `sceneRow`'s location type and both GPS halves), since
  every one of them prints left-aligned 9px Arial.
- **PCR's comb rows are the exception to everything above.** A comb drops every
  character past its last box with **no visual sign at all** - worse than an
  ellipsis, because nothing on the page says anything was lost. There is nothing
  to shrink: the geometry *is* the limit. So the cap is the box count, and it is
  computed rather than hand-counted - `combCells(w, cells)` is now a named
  function used both by `combRow` when it draws and by `PCR_MAXLEN` when it caps,
  so the two cannot drift.

**Static labels: clean.** Most of PCR's `clip()` calls truncate *labels*, not
user data, and a clipped static label is a layout bug in its own right rather
than something to shrink silently. The harness separates the two (a truncation
whose text is a substring of a filled value is a value clip; anything else is a
label) and **reported zero label truncations on all four pages**, so there was
nothing to fix.

**Nothing about the rendering changed for data that already fitted.** Proven, not
assumed: fill every page with values short enough that no cell needs to shrink,
export, then neuter `GumaFit.fitFont` back to "always paint at the base size" -
which is exactly what the pre-4b code did - re-export, and compare. Byte-
identical on arrest, traffic and PCR. Firearm differs, and has to: `fitFont`
already governed its rendering before this phase. That is also why no showcase
screenshot was regenerated - none of the four carries a clipped value.

### Phase 5 - Randomize Character (cancelled)

The plan was new branches in `js/random-character.js` for arrest, traffic and
firearm. **The user cancelled it, and the reasoning generalises: these are
documents used in-game, and what goes into them is a real character's data.**
Rolling a random name is useful for a *card* someone is designing; on a report
it produces a document that says something untrue. Do not revive this for the
report pages.

`window.randomizeCharacter(key)` still works on the card generators and was
never touched by any phase here (see Architecture 2). The two questions this
block used to hold - whether to derive a DOB from the rolled age, and whether to
fill every repeatable row or only the first - are moot for reports and would
only come back if a *card* generator ever needed them.

### Phase 4c - No ellipsis outside the reports (done)

Once the four reports stopped ellipsizing, the user asked for the same on the
card generators. The surface turned out to be much smaller than the file count
suggests - three findings, one of them good news:

| File | Was | Now |
| --- | --- | --- |
| `js/business-card.js` | **Already correct** - `bcFitFontToWidth` shrinks | Untouched, see the follow-up note at the top |
| `js/app.js` | `drawEmploymentHistory` chopped and appended `…` | Per-column shrink + `EMP_MAXLEN` |
| `js/personnel-app.js` | `drawTable` chopped and appended `…` | Per-column shrink + `PF_MAXLEN` |
| `js/personnel-app.js` | `drawInfoRow` / `drawAttendanceRow` had **no width guard at all** | Shrink against a measured budget |

That third row is the one worth remembering: those two funnels never truncated
because they never checked. A long address just ran past its border and off the
paper. **An unguarded `fillText` is worse than an ellipsis** - an ellipsis at
least says something was dropped.

**The first pass only fixed the tables, and that was not enough.** The user
pointed out that Subject Name on the personnel file, and the card faces on both
generators, still had no limits. The second pass covered the documents
themselves:

| Site | Was | Now |
| --- | --- | --- |
| `app.js` `lv()` - Rank / Division / Email / Serial / Badge / Height / Weight | Shrank to an 11px floor, **no cap**, so the floor was reachable | `GumaFit.fitFont` + `CARD_MAXLEN` |
| `app.js` name headline | Shrank to an 18px floor, no cap | Same, cap sized at `CARD_NAME_CAP_PX` |
| `app.js` `pl()` - the five pay lines | Fixed 22px, **no guard at all** | Shrinks like `lv()`, capped |
| `app.js` `year TOTAL` line | Fixed 23px, no guard | Shrinks (it is derived from the pay values, so it grows with them) |
| `app.js` `POST ID / POST Name` line | Fixed 13px, no guard, carries the full name | Shrinks |
| `personnel-app.js` `SUBJECT:` line | Fixed 15px, no guard, crossed the right margin | Shrinks against the rule it sits on, capped at 80 |
| `personnel-app.js` agency header | Fixed 22px Georgia, **centred**, so it ran off BOTH edges | Shrinks, capped at 52 |
| `app.js` `#age` | `type="number"`, where `maxLength` is **inert** - unlimited despite `min`/`max` | Live clamp via `GumaFit`, 3 digits (Gotcha 21c) |
| `traffic-collision-report.js` `#num_injured` / `#num_killed` | Same, found by the assertion written for `#age` | Live clamp, 3 digits |

`#height` (8) and `#weight` (5) are the user's numbers rather than the column
capacity - the boxes hold roughly twice that. A cap does not have to be the
maximum the layout survives; it can just be what the field means.

**A shrink with a floor but no cap is not a guarantee, it is a delay.** Every one
of these already shrank; what they lacked was the cap that makes the floor
unreachable. Past the floor the text simply left its box, silently. Reaching a
floor is the same failure as an ellipsis, minus the ellipsis.

The two header lines are the only caps here **not** derived by monospace
arithmetic: the agency name is Georgia (proportional) and the subject line's
budget depends on how wide the `SUBJECT:` label renders. Both were measured
against the same all-caps sample the reports use.

`drawInfoRow` lays its pairs out left to right with no fixed columns, so there
is no column width to fit against. Each value's budget is computed as it goes:
what is left of the box after the labels already drawn, **minus the width of the
labels still to come** - otherwise an early long value squeezes a later pair out
of the box entirely.

Two shared helpers came out of it, both in `js/guma-fit.js`:

- `colFonts(ctx, rows, widths, basePx, minPx, font)` - one size per column
  across every row, the generalisation of firearm's `offColFonts`. The reduce
  seeds each step with the size the column has survived so far, since `fitFont`
  can only shrink.
- `applyCapsBySelector(root, map)` - caps keyed by CSS selector rather than by
  id, because these pages collect row fields by class inside `.pf-row` /
  `.employment-row` and there is no id to key on.

**Courier makes the caps exact rather than measured.** It is monospace, so a
column holds precisely `floor(maxW / charW)` characters and `charW` is `0.6 x`
the size. No sampling needed - unlike the reports, where the caps come from a
representative all-caps string because Arial is proportional.

**Round that division DOWN.** See Gotcha 21.

The floors sit one step below the size the caps are computed at (9px vs 10px):
the cap size is what a full-length value prints at, and the floor is the net for
values that arrive past the cap - a hydrated legacy record, a paste. Same
reasoning as Gotcha 19, different numbers.

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

What was checked automatically in Phase 4b - **63 assertions, all passing**:
arrest 15, traffic 17, PCR 16, firearm 15. One generic harness drives all four
pages (it adds a second dynamic row wherever the page has them, so the cap
applier is exercised on freshly-built rows and not only at init):

1. **Every text input carries a cap** - `maxLength > 0` and not the 524288
   default - so a field added later cannot quietly opt out. 20 on arrest, 49 on
   traffic, 16 on PCR, 65 on firearm.
2. **Nothing is ellipsized with every input at its cap at once.** The page's
   global `clip` is replaced and every *truncating* return recorded, then
   classified: a truncation whose text is a substring of a filled value is a
   value clip (fail), anything else is a static label (logged). Zero of both, on
   all four pages.
3. **Values shrink rather than clip, and never reach the floor.** `fitFont` is
   patched to record what size it returned; the minimum across a fully-capped
   document is exactly the page's readable floor (6, 6, 6.5, 6) and never the
   4.5px hard floor. That the minimum lands *on* the readable floor rather than
   above it is what says the caps are tight rather than merely safe.
4. **The in-canvas editor carries the source cap**, or typing over the document
   would bypass the whole rule.
5. **Comb rows** (PCR): every cap equals the box count its row actually draws,
   derived from the registered strip width rather than from the table it is
   checking. And an over-long value written *programmatically* still round-trips
   through serialize/hydrate byte for byte - `maxLength` stops typing, not
   hydrate, and nothing may silently rewrite a stored value.
6. **History round-trip at cap length**: serialize -> wipe -> hydrate ->
   serialize identical, with the wipe asserted to have changed something.
7. **Export purity** in the chrome-up/chrome-down form, with the chrome-was-up
   assertion - the draw path changed, so this is re-earned rather than inherited.
8. **Fit from 100%** still leaves `wrap.scrollWidth <= clientWidth` and the page
   never scrolls sideways (Gotcha 15).
9. **The LOCATION bar spans exactly its two rows** (traffic only, Gotcha 20):
   the rows are contiguous, and their combined extent is measured off the
   *registered hitboxes* rather than off the constants the bar itself uses.
10. **Zero page errors and zero dead-ref warnings** on all four pages.

Plus the no-visual-change comparison described under *Phase 4b*, run separately.

What was checked automatically in Phase 4c - **48 assertions, all passing**:
16 per page, plus a **55-assertion report regression** re-run because
`js/guma-fit.js` changed under the four report pages. These pages have no `clip()` global - the truncation was inline -
so the harness checks **what actually reaches the canvas**:
`CanvasRenderingContext2D.prototype.fillText` is patched to record every painted
string with its computed left/right edge (honouring `textAlign`).

1. **Every capped selector resolves and carries a cap**, and the rows built
   during the run are capped too - a cap applied only at init would miss them.
2. **A capped value actually reached the canvas.** Without this the whole run
   passes vacuously if the employment table never rendered - same class of
   mistake as the chrome-was-up check in Phase 2.
3. **No painted string contains an ellipsis.**
4. **No painted string runs off the canvas** - the check that would have caught
   `drawInfoRow` before this phase.
5. **Values shrank**, none reached the floor, and **a value at its cap still
   prints at the cap size** (Gotcha 21).
6. **A second pass with the custom faction active.** `#customRank`,
   `#customDivision`, `#customEmailDomain` and `#customAgencyName` live in
   panels the UI only shows for a custom faction, so the first pass cannot
   reach them. The pass switches faction, refills, and re-checks the ellipsis
   and off-canvas guarantees. It also reports which selectors the first pass
   skipped, so a field cannot fall out of coverage quietly.
7. **History round-trip at cap length**, with the wipe asserted to have changed
   something. `serializeCardState` is **async** on the card generators - without
   an `await` this stringifies a Promise as `{}` and every comparison passes.
8. **Zero page errors and zero warnings** on all three.

**Fill only inputs that are currently active.** `#divisionCustom` is cleared by
design whenever the Division select is not on "custom", so a harness that fills
it unconditionally builds a state the UI cannot produce - and the round-trip
then "fails" by correctly normalising it away. That looked exactly like a
regression caused by the new caps and was not one. The fill now skips anything
with `offsetParent === null`, and the custom-faction pass covers what that
skips.

The four report harnesses were re-run unchanged afterwards, because
`js/guma-fit.js` changed under them: **47/47, still passing.**

Three harness mistakes worth not repeating, from Phase 4b:

- **`maxLength` does not constrain a scripted write.** `el.value = "..."` ignores
  it entirely; only typing and paste are capped. An assertion of the form "set a
  long value, expect it to be truncated" fails against correct code. Assert the
  cap *number* against the geometry, and assert the stored value round-trips.
- **Detect the page by an id that exists.** The generic harness branched on
  `#involved-container`, which is really `#involved-officers-container`, so on
  firearm it fell through to `addOfficerRow()` with no argument - building a row
  of `undefined_2_*` inputs in the witnessing container. That surfaced as a
  failing history round-trip and 14 dead-ref warnings, none of which had anything
  to do with the product.
- **Fill with values that fit before asserting nothing changed.** A "the render
  is unchanged" check fed values long enough to need shrinking fails for the
  right reason and tells you nothing.

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
  `prehospital_care_report.png` and `firearm_discharge.png` carry Los Santos demo
  data. Phase 4b left all four untouched on purpose: none of them shows a clipped
  value, and the render is byte-identical for anything that already fitted. Per
  `CLAUDE.md`, regenerate the matching screenshot after each phase that does move
  the output.
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
  Phase 4b would have added a fifth member to that family (`fitFont` /
  `fitBlock` / `wrapLines` / the cap applier, firearm-only at the time) and
  instead extracted them to `js/guma-fit.js` - the first of the five to be
  shared. `clip()` itself is the obvious next one, and the four copies are now
  the only thing standing between the pages and a shared value-painting funnel.
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
