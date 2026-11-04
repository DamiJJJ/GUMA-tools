"use strict";

// ── Body diagram (front + back figure) ──────────────────────────────────────
// Shared by report generators that mark injuries or points of contact on a
// person. The figure is built once from body zones (Path2D in a 100 x 220
// unit space) and the same paths serve three jobs: the outline, the per-zone
// shading and the hit test, so what the user taps is exactly what prints.
//
// State is a plain object the page keeps in its saved payload:
//   { marks: [{ t: "T"|"BB", v: "front"|"back", x: 0..1, y: 0..1 }],
//     zones: { "front:r_uarm": "CA", ... } }
// Mark numbers (T-1, T-2, BB-1 ...) are derived from array order per type,
// so removing one renumbers the rest without any bookkeeping.
//
// Two editors share one pointer controller: a widget with its own canvas for
// the form panel (below xl) and an overlay on the report's document canvas
// while in-canvas editing is on (xl+). Both write through the page's
// setState(), the module never owns the state.

(function () {
  const UNIT_W = 100;
  const UNIT_H = 220;
  const VIEWS = ["front", "back"];
  const MARK_TYPES = ["T", "BB"];
  const SHADE_TYPES = ["CA", "OTHER"];
  const MAX_MARKS = 40;
  // Grab radius around a mark, in diagram logical pixels.
  const MARK_SLOP = 6;
  const LABEL_H = 11;

  const TOOLS = [
    { key: "T", label: "T", title: "TASER dart - tap a point of contact" },
    { key: "BB", label: "BB", title: "Beanbag round - tap a point of contact" },
    { key: "CA", label: "CA", title: "Chemical agent - tap a body area to shade it" },
    { key: "OTHER", label: "Other", title: "Other device - tap a body area to shade it" },
    { key: "ERASE", label: "Erase", title: "Erase - tap a mark or a shaded area" },
  ];

  // ── Geometry ────────────────────────────────────────────────────
  /** Tapered capsule from a (radius ra) to b (radius rb). */
  function limb(p, ax, ay, bx, by, ra, rb) {
    const n = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
    p.moveTo(ax + Math.cos(n) * ra, ay + Math.sin(n) * ra);
    p.lineTo(bx + Math.cos(n) * rb, by + Math.sin(n) * rb);
    p.arc(bx, by, rb, n, n - Math.PI, true);
    p.lineTo(ax - Math.cos(n) * ra, ay - Math.sin(n) * ra);
    p.arc(ax, ay, ra, n + Math.PI, n, true);
    p.closePath();
  }

  // Paint order, bottom first. A later zone's white fill covers the joint arc
  // of the one under it, which leaves a single clean seam at every joint. Hit
  // tests walk the list backwards so the visible zone wins.
  // `m` mirrors x for the viewer-right copy of a paired zone.
  const SHAPES = [
    { key: "hand", pair: true, label: "Hand", build: (p, m) => limb(p, m(14), 115, m(11.5), 129, 3.7, 3.3) },
    { key: "farm", pair: true, label: "Forearm", build: (p, m) => limb(p, m(19), 82, m(14), 114, 4.9, 3.6) },
    { key: "uarm", pair: true, label: "Upper Arm", build: (p, m) => limb(p, m(30), 44, m(19), 82, 6.2, 4.9) },
    { key: "foot", pair: true, label: "Foot", build: (p, m) => limb(p, m(44), 204, m(41), 213, 3.8, 4.4) },
    { key: "shin", pair: true, label: "Lower Leg", build: (p, m) => limb(p, m(42.5), 160, m(44), 203, 6.3, 3.9) },
    { key: "thigh", pair: true, label: "Thigh", build: (p, m) => limb(p, m(40.5), 111, m(42.5), 160, 9.5, 6.3) },
    {
      key: "lower",
      label: { front: "Abdomen / Groin", back: "Lower Back / Buttocks" },
      build: (p) => {
        p.moveTo(33, 72);
        p.lineTo(67, 72);
        p.quadraticCurveTo(64.5, 88, 68.5, 104);
        p.lineTo(68, 113);
        p.lineTo(32, 113);
        p.lineTo(31.5, 104);
        p.quadraticCurveTo(35.5, 88, 33, 72);
        p.closePath();
      },
    },
    {
      key: "upper",
      label: { front: "Chest", back: "Upper Back" },
      build: (p) => {
        p.moveTo(37, 34.5);
        p.lineTo(63, 34.5);
        p.quadraticCurveTo(70.5, 35.5, 70.5, 43);
        p.lineTo(67, 72);
        p.lineTo(33, 72);
        p.lineTo(29.5, 43);
        p.quadraticCurveTo(29.5, 35.5, 37, 34.5);
        p.closePath();
      },
    },
    {
      key: "neck",
      label: "Neck",
      build: (p) => {
        p.moveTo(45, 25);
        p.lineTo(55, 25);
        p.lineTo(56.5, 36);
        p.lineTo(43.5, 36);
        p.closePath();
      },
    },
    { key: "head", label: "Head", build: (p) => p.ellipse(50, 15.5, 10, 12.5, 0, 0, Math.PI * 2) },
  ];

  // Expanded zone list, identical for both views except the anatomical side:
  // on the front view the viewer-left limb is the person's right.
  const ZONES = [];
  SHAPES.forEach((s) => {
    const copies = s.pair ? ["a", "b"] : [null];
    copies.forEach((pos) => {
      const path = new Path2D();
      const m = pos === "b" ? (x) => UNIT_W - x : (x) => x;
      s.build(path, m);
      ZONES.push({ key: s.key, pos, path, shape: s });
    });
  });

  function anatSide(view, pos) {
    if (!pos) return "";
    const right = view === "front" ? pos === "a" : pos === "b";
    return right ? "r" : "l";
  }

  function zoneId(view, z) {
    const side = anatSide(view, z.pos);
    return `${view}:${side ? side + "_" : ""}${z.key}`;
  }

  const ZONE_IDS = new Set();
  VIEWS.forEach((v) => ZONES.forEach((z) => ZONE_IDS.add(zoneId(v, z))));

  /** Human label for a zone id, e.g. "Front - Right Upper Arm". */
  function zoneLabel(id) {
    const [view, rest] = String(id).split(":");
    const m = /^(?:(r|l)_)?(\w+)$/.exec(rest || "");
    if (!m) return id;
    const shape = SHAPES.find((s) => s.key === m[2]);
    if (!shape) return id;
    const base = typeof shape.label === "string" ? shape.label : shape.label[view];
    const side = m[1] === "r" ? "Right " : m[1] === "l" ? "Left " : "";
    return `${view === "back" ? "Back" : "Front"} - ${side}${base}`;
  }

  // Hit tests run on a private identity-transform context, in unit space.
  const probe = document.createElement("canvas").getContext("2d");

  // ── State ───────────────────────────────────────────────────────
  function empty() {
    return { marks: [], zones: {} };
  }

  const clamp01 = (n) => Math.min(1, Math.max(0, n));

  /** Clean a restored state: unknown types, ids and NaNs are dropped. */
  function normalize(raw) {
    const out = empty();
    if (!raw || typeof raw !== "object") return out;
    (Array.isArray(raw.marks) ? raw.marks : []).forEach((mk) => {
      if (!mk || out.marks.length >= MAX_MARKS) return;
      if (!MARK_TYPES.includes(mk.t) || !VIEWS.includes(mk.v)) return;
      const x = Number(mk.x);
      const y = Number(mk.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      out.marks.push({ t: mk.t, v: mk.v, x: Math.round(clamp01(x) * 1000) / 1000, y: Math.round(clamp01(y) * 1000) / 1000 });
    });
    const zones = raw.zones && typeof raw.zones === "object" ? raw.zones : {};
    Object.keys(zones).forEach((id) => {
      if (ZONE_IDS.has(id) && SHADE_TYPES.includes(zones[id])) out.zones[id] = zones[id];
    });
    return out;
  }

  function isEmpty(state) {
    return !state || (!state.marks.length && !Object.keys(state.zones).length);
  }

  /** "T-1", "BB-2" ... for the mark at index i. */
  function markCode(state, i) {
    const mk = state.marks[i];
    let n = 0;
    for (let j = 0; j <= i; j++) if (state.marks[j].t === mk.t) n++;
    return `${mk.t}-${n}`;
  }

  // ── Layout ──────────────────────────────────────────────────────
  /** Two figure frames (front, back) side by side inside a box. */
  function layout(box) {
    const s = Math.min((box.w / 2 - 8) / UNIT_W, (box.h - LABEL_H - 4) / UNIT_H);
    const fw = UNIT_W * s;
    const fh = UNIT_H * s;
    const top = box.y + Math.max(2, (box.h - LABEL_H - fh) / 2);
    return VIEWS.map((v, i) => ({ view: v, s, w: fw, h: fh, x: box.x + box.w * (0.25 + 0.5 * i) - fw / 2, y: top }));
  }

  /** Which figure a point falls on, plus its unit-space coordinates. */
  function locate(box, lx, ly) {
    if (lx < box.x || lx > box.x + box.w || ly < box.y || ly > box.y + box.h) return null;
    const figs = layout(box);
    const f = lx < box.x + box.w / 2 ? figs[0] : figs[1];
    return { fig: f, view: f.view, ux: (lx - f.x) / f.s, uy: (ly - f.y) / f.s };
  }

  function zoneAt(view, ux, uy) {
    for (let i = ZONES.length - 1; i >= 0; i--) {
      if (probe.isPointInPath(ZONES[i].path, ux, uy)) return zoneId(view, ZONES[i]);
    }
    return null;
  }

  function markPos(figs, mk) {
    const f = figs[VIEWS.indexOf(mk.v)];
    return { x: f.x + mk.x * f.w, y: f.y + mk.y * f.h };
  }

  /** Topmost thing under a point: a mark beats the zone it sits on. */
  function hit(box, state, lx, ly) {
    const loc = locate(box, lx, ly);
    if (!loc) return null;
    const figs = layout(box);
    for (let i = state.marks.length - 1; i >= 0; i--) {
      const p = markPos(figs, state.marks[i]);
      if (Math.hypot(p.x - lx, p.y - ly) <= MARK_SLOP) return { kind: "mark", i };
    }
    const id = zoneAt(loc.view, loc.ux, loc.uy);
    return id ? { kind: "zone", id } : null;
  }

  /** Result of using a tool at a point, or null when nothing changes. */
  function apply(box, state, tool, lx, ly) {
    const h = hit(box, state, lx, ly);
    if (!h) return null;
    const next = { marks: state.marks.slice(), zones: { ...state.zones } };
    if (tool === "ERASE") {
      if (h.kind === "mark") next.marks.splice(h.i, 1);
      else if (next.zones[h.id]) delete next.zones[h.id];
      else return null;
      return next;
    }
    if (h.kind !== "zone") return null;
    if (MARK_TYPES.includes(tool)) {
      if (next.marks.length >= MAX_MARKS) return null;
      const loc = locate(box, lx, ly);
      next.marks.push({ t: tool, v: loc.view, x: clamp01(loc.ux / UNIT_W), y: clamp01(loc.uy / UNIT_H) });
      return next;
    }
    if (SHADE_TYPES.includes(tool)) {
      if (next.zones[h.id] === tool) delete next.zones[h.id];
      else next.zones[h.id] = tool;
      return next;
    }
    return null;
  }

  /** Copy of the state with mark i moved under a point (clamped to its figure). */
  function moveMark(box, state, i, lx, ly) {
    const cx = Math.min(box.x + box.w, Math.max(box.x, lx));
    const cy = Math.min(box.y + box.h, Math.max(box.y, ly));
    const loc = locate(box, cx, cy);
    if (!loc) return state;
    const marks = state.marks.slice();
    marks[i] = { ...marks[i], v: loc.view, x: clamp01(loc.ux / UNIT_W), y: clamp01(loc.uy / UNIT_H) };
    return { marks, zones: state.zones };
  }

  // ── Painting ────────────────────────────────────────────────────
  /** Hatch a region already set as the clip, in unit space. */
  function hatch(ctx, type, s) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.5 / s;
    const step = 3.2 / s;
    ctx.beginPath();
    for (let d = -UNIT_H; d < UNIT_W + UNIT_H; d += step) {
      ctx.moveTo(d, 0);
      ctx.lineTo(d - UNIT_H, UNIT_H);
      if (type === "OTHER") {
        ctx.moveTo(d - UNIT_H, 0);
        ctx.lineTo(d, UNIT_H);
      }
    }
    ctx.stroke();
  }

  function drawFigure(ctx, f, state) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.s, f.s);
    ctx.lineJoin = "round";

    // Outer outline: every zone stroked thick, then filled white on top, so
    // only the outside half of the stroke survives, around the union.
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.7 / f.s;
    ZONES.forEach((z) => ctx.stroke(z.path));

    ZONES.forEach((z) => {
      ctx.fillStyle = "#fff";
      ctx.fill(z.path);
      const shade = state.zones[zoneId(f.view, z)];
      if (shade) {
        ctx.save();
        ctx.clip(z.path);
        hatch(ctx, shade, f.s);
        ctx.restore();
      }
      ctx.strokeStyle = "#b9b9b9";
      ctx.lineWidth = 0.45 / f.s;
      ctx.stroke(z.path);
    });

    // Spine on the back view, so the two figures never read the same.
    if (f.view === "back") {
      ctx.strokeStyle = "#9a9a9a";
      ctx.lineWidth = 0.5 / f.s;
      ctx.setLineDash([2.2 / f.s, 1.6 / f.s]);
      ctx.beginPath();
      ctx.moveTo(50, 37);
      ctx.lineTo(50, 104);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Caption + side letters, outside the unit transform for crisp text.
    const px = Math.max(5, Math.min(7, f.s * 6.5));
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.font = `bold ${px}px Arial`;
    ctx.fillText(f.view === "front" ? "FRONT" : "BACK", f.x + f.w / 2, f.y + f.h + px + 2);
    ctx.font = `${px}px Arial`;
    const [left, right] = f.view === "front" ? ["R", "L"] : ["L", "R"];
    const sy = f.y + f.h * 0.6;
    ctx.fillText(left, f.x - 1, sy);
    ctx.fillText(right, f.x + f.w + 1, sy);
    ctx.textAlign = "left";
  }

  function drawMarks(ctx, box, state) {
    const figs = layout(box);
    const px = Math.max(5.5, Math.min(8, figs[0].s * 6.8));
    const r = Math.max(1.6, px * 0.3);
    state.marks.forEach((mk, i) => {
      const p = markPos(figs, mk);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 0.9, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      // Label on the outer side of the figure, haloed so it reads over the
      // outline and any hatching.
      const code = markCode(state, i);
      const f = figs[VIEWS.indexOf(mk.v)];
      const outward = mk.x < 0.5 ? -1 : 1;
      ctx.font = `bold ${px}px Arial`;
      ctx.textAlign = outward < 0 ? "right" : "left";
      const tx = p.x + outward * (r + 1.5);
      const ty = Math.max(f.y + px, p.y - r - 0.5);
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#fff";
      ctx.strokeText(code, tx, ty);
      ctx.fillStyle = "#000";
      ctx.fillText(code, tx, ty);
      ctx.textAlign = "left";
    });
  }

  /** Paint both figures, the shaded zones and the marks into a box. */
  function draw(ctx, box, state) {
    const st = state || empty();
    layout(box).forEach((f) => drawFigure(ctx, f, st));
    drawMarks(ctx, box, st);
  }

  /** Small legend square showing a shade pattern. */
  function swatch(ctx, x, y, size, type) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.translate(x, y);
    const s = UNIT_W / size;
    ctx.scale(1 / s, 1 / s);
    hatch(ctx, type, 1 / s);
    ctx.restore();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x, y, size, size);
  }

  // ── Pointer controller ──────────────────────────────────────────
  /**
   * Tap / drag handling shared by the widget and the document overlay.
   * cfg: el, toBox(e) -> {x, y} in diagram logical px, box() -> box | null,
   * getState, setState(state, { live }), getTool, enabled().
   */
  function bindPointer(cfg) {
    let drag = null; // { i, id, moved, state }

    function inside(b, p) {
      return b && p && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    }

    cfg.el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!cfg.enabled()) return;
      const b = cfg.box();
      const p = cfg.toBox(e);
      if (!inside(b, p)) return;
      e.preventDefault();
      const st = cfg.getState();
      const tool = cfg.getTool();
      const h = hit(b, st, p.x, p.y);
      if (h && h.kind === "mark" && tool !== "ERASE") {
        drag = { i: h.i, id: e.pointerId, moved: false, state: st };
        try {
          cfg.el.setPointerCapture(e.pointerId);
        } catch {
          // Synthetic or already-released pointer: the drag still works
          // while the pointer stays over the element.
        }
        cfg.el.style.cursor = "grabbing";
        return;
      }
      const next = apply(b, st, tool, p.x, p.y);
      if (next) cfg.setState(next, { live: false });
    });

    cfg.el.addEventListener("pointermove", (e) => {
      const b = cfg.box();
      if (drag && e.pointerId === drag.id) {
        const p = cfg.toBox(e);
        if (!p || !b) return;
        drag.state = moveMark(b, drag.state, drag.i, p.x, p.y);
        drag.moved = true;
        cfg.setState(drag.state, { live: true });
        return;
      }
      if (!cfg.enabled()) return;
      const p = cfg.toBox(e);
      if (!inside(b, p)) return;
      const h = hit(b, cfg.getState(), p.x, p.y);
      const tool = cfg.getTool();
      let cursor = "default";
      if (h && h.kind === "mark") cursor = tool === "ERASE" ? "pointer" : "grab";
      else if (h) cursor = tool === "ERASE" ? (cfg.getState().zones[h.id] ? "pointer" : "default") : "crosshair";
      cfg.el.style.cursor = cursor;
      cfg.el.title = h && h.kind === "zone" ? zoneLabel(h.id) : "";
    });

    const finish = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const st = drag.state;
      const moved = drag.moved;
      drag = null;
      if (cfg.el.hasPointerCapture?.(e.pointerId)) cfg.el.releasePointerCapture(e.pointerId);
      cfg.el.style.cursor = "";
      if (moved) cfg.setState(st, { live: false });
    };
    cfg.el.addEventListener("pointerup", finish);
    cfg.el.addEventListener("pointercancel", finish);
  }

  // ── Tool buttons ────────────────────────────────────────────────
  /**
   * Render the tool buttons (+ Clear) into a host. btnClass styles each one;
   * the active tool gets "active". Returns { set(tool) } to sync highlight.
   */
  function toolbar(host, opts) {
    host.innerHTML =
      TOOLS.map((t) => `<button type="button" class="${opts.btnClass}" data-bd-tool="${t.key}" title="${t.title}" aria-pressed="false">${t.label}</button>`).join("") +
      (opts.clearClass ? `<button type="button" class="${opts.clearClass}" data-bd-clear title="Remove every mark and shaded area">Clear</button>` : "");
    // Toolbar presses must not start a canvas drag or blur an open editor.
    host.addEventListener("pointerdown", (e) => e.preventDefault());
    host.addEventListener("click", (e) => {
      const t = e.target.closest("[data-bd-tool]");
      if (t) opts.onTool(t.dataset.bdTool);
      if (e.target.closest("[data-bd-clear]")) opts.onClear();
    });
    return {
      set(tool) {
        host.querySelectorAll("[data-bd-tool]").forEach((b) => {
          const on = b.dataset.bdTool === tool;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", String(on));
        });
      },
    };
  }

  // ── Form panel widget ───────────────────────────────────────────
  /**
   * Standalone diagram on its own canvas. cfg: canvas, width, height (logical
   * size of the drawing, same proportions as the document box), getState,
   * setState, getTool. Returns { paint() }.
   */
  function createWidget(cfg) {
    const W = cfg.width;
    const H = cfg.height;
    const box = { x: 0, y: 0, w: W, h: H };
    const dpr = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
    cfg.canvas.width = W * dpr;
    cfg.canvas.height = H * dpr;

    function paint() {
      const ctx = cfg.canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      draw(ctx, box, cfg.getState());
    }

    bindPointer({
      el: cfg.canvas,
      box: () => box,
      toBox: (e) => {
        const r = cfg.canvas.getBoundingClientRect();
        if (!r.width) return null;
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      },
      getState: cfg.getState,
      setState: cfg.setState,
      getTool: cfg.getTool,
      enabled: () => true,
    });
    paint();
    return { paint };
  }

  // ── Document canvas overlay ─────────────────────────────────────
  /**
   * Direct editing on the report canvas. The page reports where it painted
   * the diagram through getBox() (logical document px, null when absent) and
   * must register no canvas-edit field inside that box. A floating tool
   * column is mounted in `frame` as DOM chrome, so exports never see it.
   * cfg: canvas, frame, scale, getBox, getState, setState, getTool, onTool,
   * onClear, enabled. Returns { sync(), set(tool) }.
   */
  function attachOverlay(cfg) {
    const bar = document.createElement("div");
    bar.className = "guma-bd-float";
    bar.hidden = true;
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Body diagram tools");
    cfg.frame.appendChild(bar);
    const tools = toolbar(bar, { btnClass: "guma-bd-tool", clearClass: "guma-bd-tool guma-bd-tool-clear", onTool: cfg.onTool, onClear: cfg.onClear });

    function sync() {
      const b = cfg.getBox();
      const on = !!b && cfg.enabled();
      bar.hidden = !on;
      if (!on) return;
      const k = cfg.canvas.clientWidth / (cfg.canvas.width / cfg.scale) || 1;
      bar.style.left = cfg.canvas.offsetLeft + (b.x + 3) * k + "px";
      bar.style.top = cfg.canvas.offsetTop + (b.y + 3) * k + "px";
    }

    bindPointer({
      el: cfg.canvas,
      box: cfg.getBox,
      toBox: (e) => {
        const r = cfg.canvas.getBoundingClientRect();
        if (!r.width) return null;
        return {
          x: (e.clientX - r.left) * (cfg.canvas.width / r.width / cfg.scale),
          y: (e.clientY - r.top) * (cfg.canvas.height / r.height / cfg.scale),
        };
      },
      getState: cfg.getState,
      setState: cfg.setState,
      getTool: cfg.getTool,
      enabled: cfg.enabled,
    });

    // Zoom and window resizes change the canvas display size without a redraw.
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(sync).observe(cfg.canvas);
    else window.addEventListener("resize", sync);

    return { sync, set: tools.set };
  }

  window.GumaBodyDiagram = {
    TOOLS,
    empty,
    normalize,
    isEmpty,
    markCode,
    zoneLabel,
    layout,
    hit,
    apply,
    draw,
    swatch,
    toolbar,
    createWidget,
    attachOverlay,
  };
})();
