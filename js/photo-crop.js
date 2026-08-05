"use strict";

// ── In-canvas photo cropping ─────────────────────────────────────────────────
// Pan / zoom / rotate the uploaded photo directly inside the slot the card
// paints it into. A generator hands the slot to paint() on every redraw and
// gets the framed photo back; everything else (hit testing, the tool bar, the
// guide grid) is handled here.
//
// State is resolution independent - zoom is a multiple of the scale that makes
// the photo exactly cover the slot, pan is a fraction of the image's own width
// and height. A photo restored from history at a smaller pixel size therefore
// keeps the same framing as the original upload.
//
// All chrome is DOM positioned over the canvas, never painted into it, so an
// export is identical to the preview (same rationale as js/canvas-edit.js and
// js/bodycam-stage.js). Chrome is anchored to the canvas' own offset box, so
// it follows the canvas wherever the preview panel centres or scrolls it.

(function () {
  // Zoom is a multiple of the cover-fit scale, so 1 is the tightest framing
  // that still fills the slot and there is no way to expose the backing box.
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 8;
  const ZOOM_STEP = 1.15; // multiplicative, per wheel notch / button press
  const GUIDE_LINGER_MS = 700;

  let cfg = null; // attach() config
  let img = null; // decoded photo, null until it loads
  let box = null; // slot in canvas pixels, refreshed by every paint()
  let st = defaults();

  let drag = null;
  let guides = false;
  let guideTimer = 0;
  let syncRaf = 0;
  let redrawRaf = 0;
  let loadToken = 0;

  let guidesEl = null;
  let toolsEl = null;
  let zoomEl = null;

  function defaults() {
    return { zoom: 1, panX: 0, panY: 0, rotation: 0 };
  }

  // ── Coordinate mapping ─────────────────────────────────────────────────
  /** Content box of the canvas, in client coordinates (border excluded). */
  function contentRect() {
    const r = cfg.canvas.getBoundingClientRect();
    return {
      left: r.left + cfg.canvas.clientLeft,
      top: r.top + cfg.canvas.clientTop,
      width: cfg.canvas.clientWidth,
      height: cfg.canvas.clientHeight,
    };
  }

  /** Displayed CSS pixels per canvas pixel. Uniform: the canvas keeps its ratio. */
  function displayScale() {
    if (!cfg || !cfg.canvas.width) return 1;
    return cfg.canvas.clientWidth / cfg.canvas.width || 1;
  }

  function toCanvasPoint(e) {
    const cr = contentRect();
    if (!cr.width || !cr.height) return { x: 0, y: 0 };
    return {
      x: (e.clientX - cr.left) * (cfg.canvas.width / cr.width),
      y: (e.clientY - cr.top) * (cfg.canvas.height / cr.height),
    };
  }

  function inBox(pt) {
    return !!box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  // ── Geometry ───────────────────────────────────────────────────────────
  const rad = (deg) => (deg * Math.PI) / 180;

  /** True when the rotation swaps the image's axes (90 / 270 degrees). */
  function swapped() {
    const r = ((st.rotation % 360) + 360) % 360;
    return r === 90 || r === 270;
  }

  /** Image size after rotation, in image pixels. */
  function rotatedSize() {
    return swapped() ? { w: img.height, h: img.width } : { w: img.width, h: img.height };
  }

  /** Canvas pixels per image pixel at the current zoom. */
  function scale() {
    const rs = rotatedSize();
    return Math.max(box.w / rs.w, box.h / rs.h) * st.zoom;
  }

  /** Pan in image pixels, along the image's own axes. */
  function panPx() {
    return { x: st.panX * img.width, y: st.panY * img.height };
  }

  /**
   * Pull the pan back to whatever still keeps the slot covered.
   *
   * The room the slot leaves is measured on the CANVAS axes, but pan is stored
   * on the IMAGE axes - under a 90/270 rotation the two are swapped, so the
   * horizontal room caps the vertical pan and the other way round.
   */
  function clampPan() {
    const s = scale();
    const rs = rotatedSize();
    const roomX = Math.max(0, (rs.w * s - box.w) / 2 / s);
    const roomY = Math.max(0, (rs.h * s - box.h) / 2 / s);
    const maxX = swapped() ? roomY : roomX;
    const maxY = swapped() ? roomX : roomY;
    const p = panPx();
    st.panX = Math.max(-maxX, Math.min(maxX, p.x)) / img.width;
    st.panY = Math.max(-maxY, Math.min(maxY, p.y)) / img.height;
  }

  // ── Painting ───────────────────────────────────────────────────────────
  /**
   * Draw the framed photo into `slot` (canvas pixels) and remember the slot for
   * hit testing and chrome placement.
   *
   * @returns {boolean} false when there is nothing to draw yet - the caller
   *   paints its own placeholder.
   */
  function paint(ctx, slot) {
    box = slot;
    scheduleSync();
    if (!img || !box || !box.w || !box.h) return false;

    clampPan();
    const s = scale();
    const p = panPx();

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    ctx.rotate(rad(st.rotation));
    ctx.scale(s, s);
    ctx.translate(p.x, p.y);
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    return true;
  }

  // ── Transform operations ───────────────────────────────────────────────
  /**
   * Zoom, keeping the image point under `anchor` (canvas pixels) where it is.
   * Without an anchor the slot centre holds still.
   */
  function zoomTo(next, anchor) {
    if (!img || !box) return;
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
    if (z === st.zoom) return;
    const before = scale();
    const p = panPx();
    st.zoom = z;
    const after = scale();

    if (anchor) {
      // Un-rotate the anchor into image space, then hold that point fixed
      // across the scale change: pan' = pan + a/after - a/before.
      const ax = anchor.x - (box.x + box.w / 2);
      const ay = anchor.y - (box.y + box.h / 2);
      const t = -rad(st.rotation);
      const rx = ax * Math.cos(t) - ay * Math.sin(t);
      const ry = ax * Math.sin(t) + ay * Math.cos(t);
      st.panX = (p.x + rx / after - rx / before) / img.width;
      st.panY = (p.y + ry / after - ry / before) / img.height;
    }
    clampPan();
    flashGuides();
    cfg.redraw();
  }

  function stepZoom(dir) {
    zoomTo(dir > 0 ? st.zoom * ZOOM_STEP : st.zoom / ZOOM_STEP, null);
  }

  function rotate() {
    if (!img || !box) return;
    st.rotation = (st.rotation + 90) % 360;
    clampPan();
    flashGuides();
    cfg.redraw();
  }

  function reset() {
    st = defaults();
    if (cfg) {
      flashGuides();
      cfg.redraw();
    }
  }

  // ── Pointer interaction on the canvas ──────────────────────────────────
  function onPointerDown(e) {
    if (!img || !box || !inBox(toCanvasPoint(e))) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try {
      cfg.canvas.setPointerCapture(e.pointerId);
    } catch {}
    cfg.canvas.style.cursor = "grabbing";
    showGuides(true);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!drag) {
      if (img && box) cfg.canvas.style.cursor = inBox(toCanvasPoint(e)) ? "grab" : "";
      return;
    }
    // CSS pixels per image pixel: the canvas is displayed scaled down, and the
    // image is drawn into it scaled again.
    const k = displayScale() * scale();
    if (!(k > 0)) return;
    const dx = (e.clientX - drag.x) / k;
    const dy = (e.clientY - drag.y) / k;
    drag.x = e.clientX;
    drag.y = e.clientY;

    // Pointer travel is on the canvas axes; pan lives on the image axes.
    const t = -rad(st.rotation);
    st.panX += (dx * Math.cos(t) - dy * Math.sin(t)) / img.width;
    st.panY += (dx * Math.sin(t) + dy * Math.cos(t)) / img.height;
    clampPan();
    // A mouse that reports faster than the display would otherwise repaint the
    // whole card several times for one frame.
    scheduleRedraw();
  }

  function scheduleRedraw() {
    if (redrawRaf || !cfg) return;
    redrawRaf = requestAnimationFrame(() => {
      redrawRaf = 0;
      cfg.redraw();
    });
  }

  function onPointerUp(e) {
    if (!drag) return;
    try {
      cfg.canvas.releasePointerCapture(drag.id);
    } catch {}
    drag = null;
    cfg.canvas.style.cursor = img && box && inBox(toCanvasPoint(e)) ? "grab" : "";
    showGuides(false);
  }

  // Only a wheel over the photo itself zooms; anywhere else on the card the
  // page must keep scrolling.
  function onWheel(e) {
    if (!img || !box) return;
    const pt = toCanvasPoint(e);
    if (!inBox(pt)) return;
    e.preventDefault();
    zoomTo(e.deltaY < 0 ? st.zoom * ZOOM_STEP : st.zoom / ZOOM_STEP, pt);
  }

  // ── Chrome ─────────────────────────────────────────────────────────────
  const ICONS = {
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    rotate: '<path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>',
  };

  /**
   * A bar button. `icon` names an entry in ICONS; passing `null` and a `label`
   * makes a text button instead - reset is a word rather than a glyph because
   * every icon for it is a curved arrow, and one of those already means rotate.
   */
  function toolBtn(icon, title, handler, label) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "guma-pc-btn" + (icon ? "" : " guma-pc-btn-text");
    b.title = title;
    b.setAttribute("aria-label", title);
    if (icon) {
      b.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        ICONS[icon] +
        "</svg>";
    } else {
      b.textContent = label;
    }
    // The bar overlaps the photo, so a press on a button must not also start a
    // drag - it does not, because the bar is a sibling of the canvas rather
    // than a child, and this keeps it from selecting text either way.
    b.addEventListener("pointerdown", (e) => e.preventDefault());
    b.addEventListener("click", handler);
    toolsEl.appendChild(b);
    return b;
  }

  function buildChrome() {
    guidesEl = document.createElement("div");
    guidesEl.className = "guma-pc-guides";
    ["v1", "v2", "h1", "h2"].forEach((pos) => {
      const line = document.createElement("span");
      line.className = "guma-pc-guide guma-pc-guide-" + pos;
      guidesEl.appendChild(line);
    });

    toolsEl = document.createElement("div");
    toolsEl.className = "guma-pc-tools";

    toolBtn("minus", "Zoom out", () => stepZoom(-1));
    zoomEl = document.createElement("span");
    zoomEl.className = "guma-pc-value";
    zoomEl.textContent = "100%";
    toolsEl.appendChild(zoomEl);
    toolBtn("plus", "Zoom in", () => stepZoom(1));
    const sep = document.createElement("span");
    sep.className = "guma-pc-sep";
    toolsEl.appendChild(sep);
    toolBtn("rotate", "Rotate 90°", rotate);
    toolBtn(null, "Reset framing", reset, "Reset");

    cfg.host.appendChild(guidesEl);
    cfg.host.appendChild(toolsEl);
  }

  function showGuides(on) {
    clearTimeout(guideTimer);
    guideTimer = 0;
    guides = on;
    syncChrome();
  }

  /** Guides during a zoom or rotate are a hint, not a mode: they fade out. */
  function flashGuides() {
    clearTimeout(guideTimer);
    guides = true;
    guideTimer = setTimeout(() => {
      guideTimer = 0;
      guides = false;
      syncChrome();
    }, GUIDE_LINGER_MS);
  }

  function syncChrome() {
    if (!cfg || !guidesEl) return;
    const on = !!(img && box && box.w > 0 && cfg.canvas.clientWidth > 0);
    cfg.canvas.classList.toggle("guma-pc-on", on);
    if (!on) {
      guidesEl.style.display = "none";
      toolsEl.style.display = "none";
      return;
    }

    // Anchored to the canvas' own position inside the host, so centring and
    // scrolling of the preview box are already accounted for.
    const s = displayScale();
    const ox = cfg.canvas.offsetLeft + cfg.canvas.clientLeft;
    const oy = cfg.canvas.offsetTop + cfg.canvas.clientTop;

    guidesEl.style.display = guides ? "block" : "none";
    guidesEl.style.left = ox + box.x * s + "px";
    guidesEl.style.top = oy + box.y * s + "px";
    guidesEl.style.width = box.w * s + "px";
    guidesEl.style.height = box.h * s + "px";

    toolsEl.style.display = "flex";
    toolsEl.style.left = ox + (box.x + box.w / 2) * s + "px";
    toolsEl.style.top = oy + (box.y + box.h) * s - 10 + "px";
    zoomEl.textContent = Math.round(st.zoom * 100) + "%";
  }

  function scheduleSync() {
    if (syncRaf || !cfg) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      syncChrome();
    });
  }

  // ── Source ─────────────────────────────────────────────────────────────
  /**
   * Point the cropper at a new photo.
   *
   * @param {string|null} dataURL
   * @param {Object} [state] framing to restore (history); omit to reframe.
   */
  function setSource(dataURL, state) {
    st = state ? normalize(state) : defaults();
    // A slow photo that lost the race to a newer upload must not win it back.
    const token = ++loadToken;
    img = null;
    if (!dataURL) {
      scheduleSync();
      return;
    }
    const next = new Image();
    next.onload = () => {
      if (token !== loadToken) return;
      img = next;
      if (cfg) cfg.redraw();
      scheduleSync();
    };
    next.onerror = () => {
      if (token === loadToken) scheduleSync();
    };
    next.src = dataURL;
    scheduleSync();
  }

  function normalize(s) {
    const d = defaults();
    if (!s || typeof s !== "object") return d;
    const num = (v, fallback) => (Number.isFinite(+v) ? +v : fallback);
    return {
      zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, num(s.zoom, d.zoom))),
      panX: num(s.panX, 0),
      panY: num(s.panY, 0),
      rotation: (((Math.round(num(s.rotation, 0) / 90) * 90) % 360) + 360) % 360,
    };
  }

  function hasImage() {
    return !!img;
  }

  function getState() {
    return { zoom: st.zoom, panX: st.panX, panY: st.panY, rotation: st.rotation };
  }

  function setState(state) {
    st = normalize(state);
    if (cfg) cfg.redraw();
  }

  // ── Wiring ─────────────────────────────────────────────────────────────
  /**
   * @param {{canvas: HTMLCanvasElement, host: HTMLElement, redraw: Function}} opts
   *   host is the positioned box the canvas lives in; all chrome mounts there.
   */
  function attach(opts) {
    // A page that lost the chrome host still gets a working card, just without
    // cropping - paint() falls back to the default framing on its own.
    if (!opts || !opts.canvas || !opts.host) return;
    cfg = opts;
    buildChrome();

    cfg.canvas.addEventListener("pointerdown", onPointerDown);
    cfg.canvas.addEventListener("pointermove", onPointerMove);
    cfg.canvas.addEventListener("pointerup", onPointerUp);
    cfg.canvas.addEventListener("pointercancel", onPointerUp);
    cfg.canvas.addEventListener("wheel", onWheel, { passive: false });

    // Zoom of the preview, window resizes and scrollbars appearing all move the
    // canvas under the chrome; watching its box catches every one of them.
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(scheduleSync).observe(cfg.canvas);
    } else {
      window.addEventListener("resize", scheduleSync);
    }
  }

  window.GumaPhotoCrop = {
    attach,
    setSource,
    paint,
    hasImage,
    getState,
    setState,
    reset,
  };
})();
