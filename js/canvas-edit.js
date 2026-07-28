"use strict";

// ── WYSIWYG canvas editing for report generators ─────────────────────────────
// Hitbox registry + a single floating editor + DOM-only chrome. A report's
// drawForm() opens a pass with begin(), registers every editable cell while it
// paints via field()/action(), and closes with end(). All edit chrome (hover
// highlight, empty-field outlines, +/- chips, the editor itself) is DOM
// positioned over the canvas, never painted into it, so exports stay identical
// to the passive preview (same rationale as js/bodycam-stage.js).
//
// The page's form inputs stay in the DOM as the state store: the editor writes
// into the source input and dispatches input/change, so history wiring,
// collectors and randomize keep working unchanged. Desktop-only: below
// cfg.media the form panel is visible and the canvas stays a passive preview.
//
// Coordinates: field()/action() take LOGICAL document pixels (the same units
// drawForm paints in); the canvas backing store is logical * SCALE and the
// displayed size is backing store * zoom.

(function () {
  // Grab margin around a field box, in CSS pixels.
  const HIT_SLOP = 3;
  const ZOOM_MIN = 0.5;
  const ZOOM_STEP = 0.1;
  // There is no fixed upper bound: Fit is the ceiling. See clampZoom().
  // CSS px floors for editors whose native chrome needs more room than the
  // cell gives them. Date/time render a segmented mask plus a picker icon and
  // clip badly below these widths (worst on macOS).
  const SELECT_MIN_W = 120;
  const DATE_MIN_W = 170;
  const TIME_MIN_W = 130;
  const HINT_KEY = "guma:ce-hint-done";
  const SVG_NS = "http://www.w3.org/2000/svg";

  let cfg = null; // attach() config
  let scale = 2; // page SCALE, refreshed by begin()
  let zoom = 1;
  let zoomReady = false;
  let active = false;
  let mq = null;

  let fields = [];
  let actions = [];
  let passFields = null;
  let passActions = null;

  let editing = null; // { ref, field, kind, el, input, original }
  let pickerOpen = false; // a native calendar popup is up; blur is not an exit
  let syncRaf = 0;
  let redrawRaf = 0;
  const warnedRefs = {};

  // Chrome nodes, created on attach()
  let hoverEl = null;
  let svgEl = null;
  let chipsEl = null;
  let hintEl = null;
  let zoomLabel = null;

  // ── Coordinate mapping ───────────────────────────────────────────────
  /** Displayed CSS pixels per canvas (backing store) pixel. */
  function displayScale() {
    if (!cfg || !cfg.canvas.width) return 1;
    return cfg.canvas.clientWidth / cfg.canvas.width || 1;
  }

  /** CSS pixels per logical document pixel. */
  function cssPerLogical() {
    return displayScale() * scale;
  }

  /** Pointer event -> logical document coordinates. */
  function toLogical(e) {
    const rect = cfg.canvas.getBoundingClientRect();
    const sx = cfg.canvas.width / rect.width / scale;
    const sy = cfg.canvas.height / rect.height / scale;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function defaultResolve(ref) {
    const byId = document.getElementById(ref);
    if (byId) return byId;
    try {
      return document.querySelector(ref);
    } catch {
      return null;
    }
  }

  // ── Registry pass ────────────────────────────────────────────────────
  /** Open a hitbox pass. Must be the first statement of drawForm(). */
  function begin(opts) {
    scale = (opts && opts.scale) || scale;
    passFields = [];
    passActions = [];
  }

  /**
   * Register an editable value box, in logical coordinates.
   * ref = DOM id (or CSS selector). opts: kind (text|check|select|date|time),
   * label, minEditW, align ("left"|"center"), fontPx.
   */
  function field(ref, x, y, w, h, opts) {
    if (passFields) passFields.push({ ref, x, y, w, h, opts: opts || {} });
  }

  /** Register a non-value affordance (e.g. a +/- row chip). */
  function action(id, x, y, w, h, handler, opts) {
    if (passActions) passActions.push({ id, x, y, w, h, handler, opts: opts || {} });
  }

  /** Close the pass: swap registries, re-anchor the open editor, sync chrome. */
  function end() {
    if (!passFields) return;
    fields = passFields;
    actions = passActions;
    passFields = null;
    passActions = null;
    if (!cfg) return;
    devAssertRefs();
    if (!active) return;
    applyZoom();
    syncChrome();
  }

  // Dev-only guard: a registered ref that resolves to nothing means a silent
  // dead field. Warn once per ref.
  function devAssertRefs() {
    for (const f of fields) {
      if (!warnedRefs[f.ref] && !cfg.resolve(f.ref)) {
        warnedRefs[f.ref] = true;
        console.warn("[GumaCanvasEdit] field ref does not resolve:", f.ref);
      }
    }
  }

  // ── Hit testing ──────────────────────────────────────────────────────
  function hitTest(pt) {
    const slop = HIT_SLOP / cssPerLogical();
    for (const f of fields) {
      if (pt.x >= f.x - slop && pt.x <= f.x + f.w + slop && pt.y >= f.y - slop && pt.y <= f.y + f.h + slop) {
        return f;
      }
    }
    return null;
  }

  // ── Chrome sync (all DOM, all frame-relative) ────────────────────────
  function syncChrome() {
    hideHover();
    renderEmptyOutlines();
    renderChips();
    if (editing) {
      const f = fields.find((x) => x.ref === editing.ref);
      if (!f) {
        // The field vanished mid-edit (row removed, faction switched).
        cancelEdit();
      } else {
        editing.field = f;
        positionEditor();
      }
    }
  }

  function scheduleSync() {
    if (syncRaf) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      if (active && cfg) syncChrome();
    });
  }

  function hideHover() {
    if (hoverEl) hoverEl.style.display = "none";
  }

  function isEmptyValue(f) {
    const src = cfg.resolve(f.ref);
    if (!src) return false;
    if (src.type === "checkbox") return false;
    const v = (src.value || "").trim();
    return v === "" || v === "-";
  }

  // Empty-field outlines are one SVG with N rects, not N divs, so a report
  // with hundreds of fields costs a single layer.
  function renderEmptyOutlines() {
    if (!svgEl) return;
    const w = cfg.canvas.clientWidth;
    const h = cfg.canvas.clientHeight;
    svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svgEl.setAttribute("width", w);
    svgEl.setAttribute("height", h);
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    const k = cssPerLogical();
    for (const f of fields) {
      if ((f.opts.kind || "text") === "check") continue;
      if (!isEmptyValue(f)) continue;
      const r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", (f.x * k + 1).toFixed(1));
      r.setAttribute("y", (f.y * k + 1).toFixed(1));
      r.setAttribute("width", Math.max(0, f.w * k - 2).toFixed(1));
      r.setAttribute("height", Math.max(0, f.h * k - 2).toFixed(1));
      svgEl.appendChild(r);
    }
  }

  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = "";
    const k = cssPerLogical();
    for (const a of actions) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "guma-ce-chip" + (a.opts.kind ? " guma-ce-chip-" + a.opts.kind : "");
      b.textContent = a.opts.label || "";
      if (a.opts.title) b.title = a.opts.title;
      b.style.left = a.x * k + "px";
      b.style.top = a.y * k + "px";
      b.style.width = a.w * k + "px";
      b.style.height = a.h * k + "px";
      b.style.fontSize = Math.max(10, Math.round(a.h * k * 0.5)) + "px";
      b.addEventListener("click", () => {
        if (active) a.handler();
      });
      chipsEl.appendChild(b);
    }
  }

  // ── Floating editor ──────────────────────────────────────────────────
  function dispatchOn(src, type) {
    src.dispatchEvent(new Event(type, { bubbles: true }));
  }

  // ── Date: printed format in, ISO out ─────────────────────────────────
  // The document prints US mm/dd/yyyy, while <input type="date"> stores
  // yyyy-mm-dd and renders in whatever format the browser's locale dictates
  // (dd.mm.rrrr on a Polish Chrome). Editing straight over the document, that
  // mismatch reads as the value having changed. So the date editor is a plain
  // text field in the printed format, and these three convert.

  function dateToDisplay(v) {
    const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
  }

  /** "7/4/2026" -> "2026-07-04". Anything incomplete returns "" (= blank). */
  function displayToDate(s) {
    const m = String(s || "").match(/^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{4})\s*$/);
    if (!m) return "";
    const mm = +m[1];
    const dd = +m[2];
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
    return `${m[3]}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  /** Slash in the separators so typing 8 digits is enough. */
  function maskDisplayDate(raw) {
    const d = raw.replace(/\D/g, "").slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length > 2) out += "/" + d.slice(2, 4);
    if (d.length > 4) out += "/" + d.slice(4);
    // Keep a separator the user typed themselves, so it does not vanish
    // under the caret on the way to the next digit.
    if (/\D$/.test(raw) && (d.length === 2 || d.length === 4)) out += "/";
    return out;
  }

  const CAL_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>' +
    '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function buildDateEditor(src) {
    const wrap = document.createElement("span");
    wrap.className = "guma-ce-editor guma-ce-editor-date";

    const text = document.createElement("input");
    text.type = "text";
    text.className = "guma-ce-date-text";
    text.placeholder = "mm/dd/yyyy";
    text.inputMode = "numeric";
    text.value = dateToDisplay(src.value);

    // Rendered but invisible: it exists only so the native calendar popup has
    // something to anchor to, right under the button that opens it.
    const native = document.createElement("input");
    native.type = "date";
    native.className = "guma-ce-date-native";
    native.tabIndex = -1;
    native.setAttribute("aria-hidden", "true");
    native.value = src.value;

    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "guma-ce-date-pick";
    pick.tabIndex = -1;
    pick.title = "Open calendar";
    pick.setAttribute("aria-label", "Open calendar");
    pick.innerHTML = CAL_ICON;

    text.addEventListener("input", () => {
      if (text.selectionStart === text.value.length) {
        const masked = maskDisplayDate(text.value);
        if (masked !== text.value) text.value = masked;
      }
      src.value = displayToDate(text.value);
      dispatchOn(src, "input");
    });

    // The default mousedown would blur the text field and commit the editor
    // before the click ever lands on the button.
    pick.addEventListener("mousedown", (e) => e.preventDefault());
    pick.addEventListener("click", () => {
      native.value = src.value;
      pickerOpen = true;
      try {
        if (native.showPicker) native.showPicker();
      } catch {}
    });
    native.addEventListener("change", () => {
      pickerOpen = false;
      src.value = native.value;
      dispatchOn(src, "input");
      text.value = dateToDisplay(native.value);
      text.focus({ preventScroll: true });
    });

    wrap.append(text, native, pick);
    return { el: wrap, input: text };
  }

  function openEditor(f, viaPointer) {
    const src = cfg.resolve(f.ref);
    if (!src) return;
    markHintSeen();

    const kind = f.opts.kind || (src.tagName === "SELECT" ? "select" : src.type === "date" || src.type === "time" ? src.type : "text");

    // Checkboxes get no editor: a click toggles the source and redraws.
    if (kind === "check") {
      src.checked = !src.checked;
      dispatchOn(src, "change");
      return;
    }

    if (editing) commitEdit();

    // el = the positioned box, input = what takes focus and keys. Same node
    // for everything except the composite date editor.
    let el;
    let input;
    if (kind === "date") {
      const built = buildDateEditor(src);
      el = built.el;
      input = built.input;
    } else if (kind === "select") {
      el = input = document.createElement("select");
      for (const o of src.options) {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.textContent;
        el.appendChild(opt);
      }
      el.value = src.value;
      el.className = "guma-ce-editor";
    } else {
      el = input = document.createElement("input");
      el.type = kind === "time" ? "time" : "text";
      el.value = src.value;
      if (src.placeholder) el.placeholder = src.placeholder;
      el.className = "guma-ce-editor";
    }
    if (f.opts.label) {
      el.title = f.opts.label;
      input.setAttribute("aria-label", f.opts.label);
    }

    editing = { ref: f.ref, field: f, kind, el, input, original: src.value };
    pickerOpen = false;

    if (kind === "select") {
      input.addEventListener("change", () => {
        src.value = input.value;
        dispatchOn(src, "change");
        commitEdit();
      });
    } else if (kind !== "date") {
      input.addEventListener("input", () => {
        src.value = input.value;
        dispatchOn(src, "input");
        growEditor();
      });
    }
    input.addEventListener("keydown", onEditorKey);
    input.addEventListener("blur", () => {
      // A native calendar popup is not the user leaving the field.
      if (pickerOpen) return;
      if (editing && editing.input === input) commitEdit();
    });

    cfg.frame.appendChild(el);
    positionEditor();
    growEditor();
    // Position first, then focus: focusing an off-screen element scrolls to it.
    input.focus({ preventScroll: true });
    if (input.select && input.type === "text") input.select();
    // Only selects auto-open their picker (a focused select shows nothing on
    // its own). Date carries its own calendar button, and popping a full
    // calendar over the document hides the very row being edited.
    // showPicker() must stay synchronous inside the click handler or
    // Safari/Firefox reject it.
    if (viaPointer && kind === "select") {
      try {
        if (input.showPicker) input.showPicker();
      } catch {}
    }
  }

  function positionEditor() {
    const f = editing.field;
    const el = editing.el;
    const k = cssPerLogical();
    let w = Math.max(f.w, f.opts.minEditW || 0) * k;
    if (editing.kind === "select") w = Math.max(w, SELECT_MIN_W);
    else if (editing.kind === "date") w = Math.max(w, DATE_MIN_W);
    else if (editing.kind === "time") w = Math.max(w, TIME_MIN_W);
    // Never run past the right edge of the document.
    w = Math.min(w, Math.max(24, cfg.canvas.clientWidth - f.x * k - 2));
    el.style.left = f.x * k + "px";
    el.style.top = f.y * k + "px";
    el.style.width = w + "px";
    el.style.height = f.h * k + "px";
    el.style.fontSize = (f.opts.fontPx || 8) * k + "px";
    el.style.textAlign = f.opts.align === "center" ? "center" : "left";
  }

  // clip() may have painted an ellipsis while the real value is longer; the
  // editor widens (up to the document edge) so the full value stays visible.
  function growEditor() {
    if (!editing) return;
    const el = editing.el;
    // Composite editors (date) hold a fixed-width value; their box is sized
    // by positionEditor and measuring the wrapper would be meaningless.
    if (editing.input !== el) return;
    if (el.scrollWidth <= el.clientWidth) return;
    const k = cssPerLogical();
    const maxW = Math.max(24, cfg.canvas.clientWidth - editing.field.x * k - 2);
    el.style.width = Math.min(el.scrollWidth + 12, maxW) + "px";
  }

  function onEditorKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      revertEdit();
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      advance(e.shiftKey ? -1 : 1);
    }
  }

  /** Commit and move to the next/previous editable field in registry order. */
  function advance(dir) {
    if (!editing) return;
    const list = fields.filter((f) => (f.opts.kind || "text") !== "check");
    const i = list.findIndex((f) => f.ref === editing.ref);
    commitEdit();
    const next = list[i + dir];
    if (next) openEditor(next, false);
  }

  /** Close the editor keeping the value (it is already in the source input). */
  function commitEdit() {
    if (!editing) return;
    const el = editing.el;
    editing = null;
    pickerOpen = false;
    el.remove();
  }

  /** Escape: restore the value the field had when the editor opened. */
  function revertEdit() {
    if (!editing) return;
    const src = cfg.resolve(editing.ref);
    const original = editing.original;
    const isSelect = editing.kind === "select";
    commitEdit();
    if (src && src.value !== original) {
      src.value = original;
      dispatchOn(src, isSelect ? "change" : "input");
    }
  }

  /** Drop the editor without touching the source (hydrate/faction switch). */
  function cancelEdit() {
    if (!editing) return;
    const el = editing.el;
    editing = null;
    pickerOpen = false;
    el.remove();
  }

  function isEditing() {
    return !!editing;
  }

  // ── Pointer interaction on the canvas ────────────────────────────────
  function onPointerDown(e) {
    if (!active) return;
    const f = hitTest(toLogical(e));
    if (!f) return;
    // Keep the old editor's blur/commit orderly and stop text selection.
    e.preventDefault();
    openEditor(f, true);
  }

  function onPointerMove(e) {
    if (!active) return;
    const f = hitTest(toLogical(e));
    if (!f || (editing && editing.ref === f.ref)) {
      hideHover();
      cfg.canvas.style.cursor = "";
      return;
    }
    const kind = f.opts.kind || "text";
    cfg.canvas.style.cursor = kind === "check" || kind === "select" ? "pointer" : "text";
    const k = cssPerLogical();
    hoverEl.style.left = f.x * k + "px";
    hoverEl.style.top = f.y * k + "px";
    hoverEl.style.width = f.w * k + "px";
    hoverEl.style.height = f.h * k + "px";
    hoverEl.style.display = "block";
  }

  function onPointerLeave() {
    hideHover();
    if (cfg) cfg.canvas.style.cursor = "";
  }

  // ── Zoom: CSS display size, never a bigger SCALE ─────────────────────
  function applyZoom() {
    cfg.canvas.style.width = Math.round(cfg.canvas.width * zoom) + "px";
    cfg.canvas.style.height = "auto";
  }

  /**
   * Zoom that makes the document exactly fill its scroll box.
   *
   * Measured with the canvas collapsed, then restored before the next paint.
   * A container that sizes itself to its content would otherwise report the
   * current zoom straight back, making Fit a no-op whenever the document is
   * already wider than the box. Collapsing also keeps scrollbars out of the
   * reading, so Fit does not oscillate by a scrollbar's width.
   */
  function trueFit() {
    const wrap = cfg.frame.parentElement;
    if (!wrap || !cfg.canvas.width) return 1;
    // Room a vertical scrollbar takes right now. Measured before collapsing,
    // because collapsing removes the scrollbar and we still have to leave
    // space for the one the fitted document will bring back.
    const scrollbar = Math.max(0, wrap.offsetWidth - wrap.clientWidth);
    const prevW = cfg.canvas.style.width;
    const prevH = cfg.canvas.style.height;
    cfg.canvas.style.width = "0px";
    cfg.canvas.style.height = "0px";
    const avail = wrap.clientWidth - scrollbar - 2; // scrollbar + frame border
    cfg.canvas.style.width = prevW;
    cfg.canvas.style.height = prevH;
    return avail > 0 ? avail / cfg.canvas.width : 1;
  }

  /**
   * Fit is the ceiling. Zooming past it would make the document wider than its
   * box, which is what produced a sideways-scrolling page. Floor rather than
   * round, so a rounded value can never creep back over the cap.
   */
  function clampZoom(z) {
    const max = trueFit();
    if (!(max > 0)) return z;
    const lo = Math.min(ZOOM_MIN, max); // a box narrower than 50% still gets Fit
    return Math.floor(Math.min(Math.max(z, lo), max) * 100) / 100;
  }

  function setZoom(z) {
    z = clampZoom(z);
    zoom = z;
    try {
      localStorage.setItem("guma:zoom:" + cfg.key, String(z));
    } catch {}
    if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + "%";
    if (active) {
      applyZoom();
      syncChrome();
    }
  }

  function fitZoom() {
    setZoom(trueFit());
  }

  function initZoom() {
    let z = NaN;
    try {
      z = parseFloat(localStorage.getItem("guma:zoom:" + cfg.key));
    } catch {}
    if (!Number.isFinite(z)) z = 1; // default 1:1, Fit stays one click away
    zoom = clampZoom(z);
    if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + "%";
    zoomReady = true;
  }

  function onWheel(e) {
    if (!active || !e.ctrlKey) return; // plain wheel must keep scrolling the page
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }

  // ── Toolbar: zoom segmented control + one-time hint ──────────────────
  function buildToolbar(toolbar) {
    const seg = document.createElement("div");
    seg.className = "guma-ce-zoom";
    const mk = (label, title, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "guma-ce-zoom-btn";
      b.textContent = label;
      b.title = title;
      b.addEventListener("click", fn);
      seg.appendChild(b);
      return b;
    };
    mk("-", "Zoom out", () => setZoom(zoom - ZOOM_STEP));
    zoomLabel = mk("100%", "Reset zoom to 100%", () => setZoom(1));
    mk("+", "Zoom in", () => setZoom(zoom + ZOOM_STEP));
    mk("Fit", "Fit document to panel width", fitZoom);
    toolbar.insertBefore(seg, toolbar.firstChild);

    hintEl = document.createElement("span");
    hintEl.className = "guma-ce-hint";
    hintEl.textContent = "Click any field on the document to edit it";
    toolbar.insertBefore(hintEl, seg.nextSibling);
    updateHint();
  }

  function hintSeen() {
    try {
      return !!localStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  }

  function markHintSeen() {
    if (hintSeen()) return;
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {}
    updateHint();
  }

  function updateHint() {
    if (hintEl) hintEl.style.display = active && !hintSeen() ? "" : "none";
  }

  // ── Activation (media gate) ──────────────────────────────────────────
  function setActive(on) {
    active = on;
    cfg.frame.classList.toggle("guma-ce-active", on);
    if (!on) {
      cancelEdit();
      hideHover();
      cfg.canvas.style.cursor = "";
      // Drop the zoom override so the shared preview classes size the canvas.
      cfg.canvas.style.width = "";
      cfg.canvas.style.height = "";
    } else if (!zoomReady) {
      initZoom();
    }
    updateHint();
    // Redraw restores the page's own passive sizing (inactive) or applies
    // zoom + chrome via end() (active).
    cfg.redraw();
  }

  /** rAF-coalesced redraw for high-frequency callers. */
  function schedule() {
    if (redrawRaf || !cfg) return;
    redrawRaf = requestAnimationFrame(() => {
      redrawRaf = 0;
      cfg.redraw();
    });
  }

  // ── Wiring ───────────────────────────────────────────────────────────
  /**
   * @param {{canvas: HTMLCanvasElement, frame: HTMLElement, host?: HTMLElement,
   *          toolbar?: HTMLElement, redraw: Function, key: string,
   *          resolve?: (ref: string) => Element|null, media?: string}} opts
   */
  function attach(opts) {
    cfg = Object.assign({ resolve: defaultResolve, media: "(min-width: 1280px)" }, opts);

    hoverEl = document.createElement("div");
    hoverEl.className = "guma-ce-hover";
    hoverEl.style.display = "none";
    svgEl = document.createElementNS(SVG_NS, "svg");
    svgEl.setAttribute("class", "guma-ce-svg guma-ce-layer");
    svgEl.setAttribute("aria-hidden", "true");
    chipsEl = document.createElement("div");
    chipsEl.className = "guma-ce-chips guma-ce-layer";
    cfg.frame.appendChild(svgEl);
    cfg.frame.appendChild(hoverEl);
    cfg.frame.appendChild(chipsEl);

    cfg.canvas.addEventListener("pointerdown", onPointerDown);
    cfg.canvas.addEventListener("pointermove", onPointerMove);
    cfg.canvas.addEventListener("pointerleave", onPointerLeave);
    cfg.frame.addEventListener("wheel", onWheel, { passive: false });

    if (cfg.toolbar) buildToolbar(cfg.toolbar);

    // Zoom, window resize and scrollbar appearance all shift displayScale();
    // observing the canvas box catches every one of them.
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        if (active) scheduleSync();
      }).observe(cfg.canvas);
      // The canvas carries an explicit pixel width, so it does not react to the
      // window resizing at all. Watch the box it has to fit inside instead and
      // pull the zoom back down whenever Fit just got smaller. Only ever
      // shrinks, so a scrollbar appearing and disappearing cannot oscillate.
      const wrap = cfg.frame.parentElement;
      if (wrap) {
        new ResizeObserver(() => {
          if (!active) return;
          const capped = clampZoom(zoom);
          if (zoom - capped > 0.005) setZoom(capped);
          else scheduleSync();
        }).observe(wrap);
      }
    } else {
      window.addEventListener("resize", scheduleSync);
    }

    mq = window.matchMedia(cfg.media);
    const onMedia = (e) => setActive(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onMedia);
    else mq.addListener(onMedia);
    setActive(mq.matches);
  }

  window.GumaCanvasEdit = {
    begin,
    field,
    action,
    end,
    attach,
    schedule,
    cancelEdit,
    commitEdit,
    isEditing,
    setZoom,
    fitZoom,
  };
})();
