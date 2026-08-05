"use strict";

// ── Preview stage ────────────────────────────────────────────────────────
// Everything the user does directly on the frame: picking up a layer,
// dragging it, resizing it from the handle at its bottom-left corner, and
// getting a screenshot into the canvas in the first place.
//
// The selection chrome is a DOM overlay sized against the canvas rather than
// something painted into it, so it stays a crisp 1 px at any screenshot
// resolution and never risks ending up in an export.

(function () {
  const L = window.BodycamLayers;

  const SCALE_STEP = 0.08;
  // Pixels of pointer travel that equal one full scale unit when dragging the
  // corner handle.
  const SCALE_DRAG_RANGE = 220;
  // Grab margin around a layer's box, in CSS pixels.
  const HIT_SLOP = 6;
  const NUDGE = 1;
  const NUDGE_FAST = 10;

  let canvas = null;
  let selection = null;
  let selectionLabel = null;
  let scaleHandle = null;
  let dropzone = null;
  let onImage = null;

  let drag = null;
  let scaleDrag = null;

  const labelOf = (id) => L.DEFS.find((d) => d.id === id)?.label || id;

  // ── Coordinate mapping ───────────────────────────────────────────────
  /** Displayed pixels per canvas pixel. Uniform: the canvas keeps its ratio. */
  function displayScale() {
    if (!canvas || !canvas.width) return 1;
    return canvas.getBoundingClientRect().width / canvas.width;
  }

  function toCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  // ── Selection chrome ─────────────────────────────────────────────────
  function sync() {
    if (!selection) return;
    const id = L.getSelected();
    const box = id ? L.boundsOf(id) : null;
    const active = !!(id && box && box.w > 0 && window.BodycamRender.hasImage());

    // The readout lives under the frame rather than floating off the marquee,
    // where a layer parked in the top corner would clip it.
    if (selectionLabel) {
      selectionLabel.textContent = active
        ? `${labelOf(id)} - ${Math.round(L.get(id).scale * 100)}%`
        : "Click an element on the frame to move or resize it";
    }

    if (!active) {
      selection.classList.add("hidden");
      return;
    }

    const s = displayScale();
    selection.style.left = `${box.x * s}px`;
    selection.style.top = `${box.y * s}px`;
    selection.style.width = `${box.w * s}px`;
    selection.style.height = `${box.h * s}px`;
    selection.classList.remove("hidden");
  }

  function render() {
    window.BodycamRender.renderHud();
    sync();
  }

  function select(id) {
    L.select(id);
    sync();
    document.dispatchEvent(new CustomEvent("bodycam:select", { detail: { id } }));
  }

  // ── Scaling ──────────────────────────────────────────────────────────
  function applyScale(id, value) {
    L.setScale(id, value, window.BodycamRender.frame());
    render();
  }

  function stepScale(delta) {
    const id = L.getSelected();
    if (!id) return;
    L.nudgeScale(id, delta, window.BodycamRender.frame());
    render();
  }

  // ── Pointer: drag a layer around the frame ───────────────────────────
  function onPointerDown(e) {
    if (!window.BodycamRender.hasImage()) return;

    const point = toCanvasPoint(e);
    const slop = HIT_SLOP / displayScale();
    const hit = L.hitTest(point.x, point.y, slop);

    if (!hit) {
      select(null);
      return;
    }

    select(hit);
    const box = L.boundsOf(hit);
    drag = { id: hit, dx: point.x - box.x, dy: point.y - box.y };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!window.BodycamRender.hasImage()) return;
    const point = toCanvasPoint(e);

    if (drag) {
      L.moveTo(drag.id, point.x - drag.dx, point.y - drag.dy, window.BodycamRender.frame());
      render();
      return;
    }

    const slop = HIT_SLOP / displayScale();
    canvas.style.cursor = L.hitTest(point.x, point.y, slop) ? "grab" : "default";
  }

  function onPointerUp(e) {
    if (!drag) return;
    drag = null;
    canvas.style.cursor = "grab";
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
  }

  // ── Pointer: the corner grip ─────────────────────────────────────────
  // Drag only. The grip hangs off the bottom-left corner, so dragging down
  // and to the left pulls away from the box and grows it; the other way
  // shrinks it.
  function onHandleDown(e) {
    const id = L.getSelected();
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();

    scaleDrag = { id, startX: e.clientX, startY: e.clientY, startScale: L.get(id).scale };
    scaleHandle.setPointerCapture(e.pointerId);
  }

  function onHandleMove(e) {
    if (!scaleDrag) return;
    const travel = (e.clientY - scaleDrag.startY - (e.clientX - scaleDrag.startX)) / 2;
    applyScale(scaleDrag.id, scaleDrag.startScale + travel / SCALE_DRAG_RANGE);
  }

  function onHandleUp(e) {
    if (!scaleDrag) return;
    try {
      scaleHandle.releasePointerCapture(e.pointerId);
    } catch {}
    scaleDrag = null;
  }

  // ── Wheel + keyboard ─────────────────────────────────────────────────
  function onWheel(e) {
    if (!L.getSelected() || !window.BodycamRender.hasImage()) return;
    e.preventDefault();
    stepScale(e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
  }

  function isTyping() {
    const el = document.activeElement;
    return !!el && (el.matches("input, select, textarea") || el.isContentEditable);
  }

  function onKeyDown(e) {
    const id = L.getSelected();
    if (!id || isTyping() || !window.BodycamRender.hasImage()) return;

    if (e.key === "Escape") {
      select(null);
      return;
    }

    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      stepScale(SCALE_STEP);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      stepScale(-SCALE_STEP);
      return;
    }

    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const dir = arrows[e.key];
    if (!dir) return;

    e.preventDefault();
    const amount = e.shiftKey ? NUDGE_FAST : NUDGE;
    const box = L.boundsOf(id);
    L.moveTo(id, box.x + dir[0] * amount, box.y + dir[1] * amount, window.BodycamRender.frame());
    render();
  }

  // ── Getting a screenshot in ──────────────────────────────────────────
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        window.BodycamRender.setImage(img);
        dropzone?.classList.add("hidden");
        select(null);
        onImage?.();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function bindDropTarget(el) {
    ["dragenter", "dragover"].forEach((type) =>
      el.addEventListener(type, (e) => {
        e.preventDefault();
        dropzone?.classList.remove("hidden");
        dropzone?.classList.add("is-hot");
      })
    );

    ["dragleave", "drop"].forEach((type) =>
      el.addEventListener(type, (e) => {
        e.preventDefault();
        if (type === "dragleave" && e.relatedTarget && el.contains(e.relatedTarget)) return;
        dropzone?.classList.remove("is-hot");
        if (window.BodycamRender.hasImage()) dropzone?.classList.add("hidden");
      })
    );

    el.addEventListener("drop", (e) => loadFile(e.dataTransfer?.files?.[0]));
  }

  // ── Wiring ───────────────────────────────────────────────────────────
  /**
   * @param {{canvas: HTMLCanvasElement, stage: HTMLElement, selection: HTMLElement,
   *          selectionLabel: HTMLElement, scaleHandle: HTMLElement,
   *          dropzone: HTMLElement, onImage?: Function}} refs
   */
  function init(refs) {
    canvas = refs.canvas;
    selection = refs.selection;
    selectionLabel = refs.selectionLabel;
    scaleHandle = refs.scaleHandle;
    dropzone = refs.dropzone;
    onImage = refs.onImage;

    window.BodycamRender.attach(canvas, sync);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    scaleHandle.addEventListener("pointerdown", onHandleDown);
    scaleHandle.addEventListener("pointermove", onHandleMove);
    scaleHandle.addEventListener("pointerup", onHandleUp);
    scaleHandle.addEventListener("pointercancel", onHandleUp);

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", sync);
    window.addEventListener("paste", (e) => {
      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith("image/")) {
          loadFile(item.getAsFile());
          break;
        }
      }
    });

    bindDropTarget(refs.stage);
  }

  window.BodycamStage = {
    init,
    sync,
    render,
    select,
    stepScale,
    loadFile,
  };
})();
