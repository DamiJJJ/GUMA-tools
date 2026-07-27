"use strict";

// ── Overlay layer model ──────────────────────────────────────────────────
// Every element burned into the frame is an independently placed and
// independently scaled layer. Geometry lives here; the renderer only asks
// where to put a box of a given size, and the stage only asks what sits
// under the pointer.
//
// `pos` stays null until the layer is dragged. An untouched layer keeps
// snapping to its anchor corner, so swapping a 1080p screenshot for a 4K one
// leaves the composition intact instead of stranding everything top-left.

const BC_LAYER_DEFS = [
  { id: "rec", label: "REC / battery", anchor: "tl" },
  { id: "badge", label: "Agency logo", anchor: "bl" },
  { id: "brand", label: "Camera logo", anchor: "tr" },
  { id: "stamp", label: "Date / officer", anchor: "tr" },
];

// Drawn back-to-front; hit-tested front-to-back so the topmost layer wins.
const BC_DRAW_ORDER = ["badge", "brand", "stamp", "rec"];

const BC_SCALE_MIN = 0.3;
const BC_SCALE_MAX = 3;

// Corner inset and the gap the timestamp keeps from the camera logo, both in
// 1080p-relative units.
const BC_MARGIN = 40;
const BC_STAMP_GAP = 26;

(function () {
  /** @type {Record<string, {visible: boolean, scale: number, pos: {x: number, y: number}|null}>} */
  const layers = {};
  /** Canvas-pixel box of each layer from the last render. */
  const bounds = {};
  let selected = null;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function reset() {
    BC_LAYER_DEFS.forEach((def) => {
      layers[def.id] = { visible: true, scale: 1, pos: null };
      bounds[def.id] = { x: 0, y: 0, w: 0, h: 0 };
    });
    selected = null;
  }

  /** Drop every manual position and scale, keeping visibility toggles. */
  function resetPlacement() {
    BC_LAYER_DEFS.forEach((def) => {
      layers[def.id].scale = 1;
      layers[def.id].pos = null;
    });
  }

  function get(id) {
    return layers[id];
  }

  function anchorOf(id) {
    return BC_LAYER_DEFS.find((d) => d.id === id)?.anchor || "tl";
  }

  /**
   * Resolve the top-left corner for a layer's box and record it for hit
   * testing. Called by the renderer once it knows the box size.
   * @param {string} id layer id
   * @param {number} w box width in canvas pixels
   * @param {number} h box height in canvas pixels
   * @param {{W: number, H: number, unit: number}} frame canvas size + 1080p unit
   */
  function place(id, w, h, frame) {
    const layer = layers[id];
    const m = Math.round(BC_MARGIN * frame.unit);
    let x;
    let y;

    if (layer.pos) {
      x = layer.pos.x * frame.W;
      y = layer.pos.y * frame.H;
    } else {
      const anchor = anchorOf(id);
      x = anchor === "tr" || anchor === "br" ? frame.W - m - w : m;
      y = anchor === "bl" || anchor === "br" ? frame.H - m - h : m;

      // The timestamp shares the top-right corner with the camera logo, so by
      // default it parks to the logo's left and centres against it.
      if (id === "stamp" && bounds.brand && bounds.brand.w > 0) {
        x = bounds.brand.x - Math.round(BC_STAMP_GAP * frame.unit) - w;
        y = bounds.brand.y + Math.max(0, (bounds.brand.h - h) / 2);
      }
    }

    x = clamp(x, 0, Math.max(0, frame.W - w));
    y = clamp(y, 0, Math.max(0, frame.H - h));
    bounds[id] = { x, y, w, h };
    return { x, y };
  }

  /** Mark a layer as drawing nothing this pass, so it cannot be grabbed. */
  function clearBounds(id) {
    bounds[id] = { x: 0, y: 0, w: 0, h: 0 };
  }

  function boundsOf(id) {
    return bounds[id] || { x: 0, y: 0, w: 0, h: 0 };
  }

  /**
   * Topmost visible layer under a canvas-space point.
   * @param {number} px canvas-space x
   * @param {number} py canvas-space y
   * @param {number} [tolerance] extra grab margin in canvas pixels
   */
  function hitTest(px, py, tolerance = 0) {
    for (let i = BC_DRAW_ORDER.length - 1; i >= 0; i--) {
      const id = BC_DRAW_ORDER[i];
      const b = bounds[id];
      if (!b || b.w <= 0 || b.h <= 0) continue;
      if (px >= b.x - tolerance && px <= b.x + b.w + tolerance && py >= b.y - tolerance && py <= b.y + b.h + tolerance) {
        return id;
      }
    }
    return null;
  }

  /** Move a layer so its box's top-left lands on (x, y) in canvas space. */
  function moveTo(id, x, y, frame) {
    const b = bounds[id];
    const nx = clamp(x, 0, Math.max(0, frame.W - b.w));
    const ny = clamp(y, 0, Math.max(0, frame.H - b.h));
    layers[id].pos = { x: nx / frame.W, y: ny / frame.H };
  }

  /**
   * Rescale a layer around the centre of its current box, so growing an
   * element pinned mid-frame does not walk it towards the bottom-right.
   */
  function setScale(id, value, frame) {
    const layer = layers[id];
    const next = clamp(value, BC_SCALE_MIN, BC_SCALE_MAX);
    const b = bounds[id];

    if (layer.pos && b.w > 0) {
      const ratio = next / layer.scale;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      layer.pos = {
        x: (cx - (b.w * ratio) / 2) / frame.W,
        y: (cy - (b.h * ratio) / 2) / frame.H,
      };
    }
    layer.scale = next;
    return next;
  }

  function nudgeScale(id, delta, frame) {
    return setScale(id, layers[id].scale + delta, frame);
  }

  function select(id) {
    selected = id && layers[id] ? id : null;
    return selected;
  }

  function getSelected() {
    return selected;
  }

  reset();

  window.BodycamLayers = {
    DEFS: BC_LAYER_DEFS,
    DRAW_ORDER: BC_DRAW_ORDER,
    SCALE_MIN: BC_SCALE_MIN,
    SCALE_MAX: BC_SCALE_MAX,
    MARGIN: BC_MARGIN,
    reset,
    resetPlacement,
    get,
    place,
    clearBounds,
    boundsOf,
    hitTest,
    moveTo,
    setScale,
    nudgeScale,
    select,
    getSelected,
  };
})();
