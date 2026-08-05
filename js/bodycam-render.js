"use strict";

// ── Canvas pipeline ──────────────────────────────────────────────────────
// Two canvases so cheap edits never re-run expensive pixel work:
//
//   fx    screenshot + colour grade + aberration + vignette + grain + scanlines
//   view  fx + the HUD - what the user sees, drags on and exports
//
// Typing in the form only repaints view; touching an effect slider is the
// only thing that rebuilds fx.

(function () {
  const L = window.BodycamLayers;

  // Monospace is what body-worn cameras actually burn in, and it keeps the
  // timestamp columns from twitching as the seconds tick over.
  const MONO = 'Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Courier New", monospace';

  // Base metrics are authored against a 1080p frame and multiplied by the
  // frame unit, so the overlay keeps its proportions on any screenshot size.
  const STAMP_BIG = 38;
  const STAMP_SMALL = 27;
  const BRAND_HEIGHT = 110;
  const BADGE_HEIGHT = 150;
  const REC_FONT = 34;
  const BATTERY_W = 74;
  const BATTERY_H = 32;
  // Text rows reserve a little more than the em size so descenders stay
  // inside the box the selection outline is drawn around.
  const LINE_RATIO = 1.18;

  const state = {
    img: null,
    W: 0,
    H: 0,

    // Burned-in data
    date: "",
    time: "",
    tz: "-0700",
    device: "Coil Body 3",
    serial: "X1234567890",
    timer: "00:14:23",
    battery: 78,

    // Corner marks
    brand: "coil",
    brandCustomLogo: null,
    faction: "lspd",
    factionCustomLogo: null,

    // Image effects
    sensorGrade: true,
    aberrationOn: true,
    aberration: 35,
    vignetteOn: true,
    vignette: 45,
    grain: 16,
    scanlinesOn: true,
    scanlines: 22,
  };

  const imgCache = {};

  let view = null;
  let vctx = null;
  const fx = document.createElement("canvas");
  const fctx = fx.getContext("2d");
  const scratch = document.createElement("canvas");
  const sctx = scratch.getContext("2d");

  let noisePattern = null;
  let onChange = null;

  // ── Assets ─────────────────────────────────────────────────────────────
  /**
   * Cached image lookup that stays synchronous: returns null the first time a
   * source is seen and repaints the HUD once the file has decoded.
   */
  function image(src) {
    if (!src) return null;
    if (src in imgCache) return imgCache[src];

    imgCache[src] = null;
    const img = new Image();
    img.onload = () => {
      imgCache[src] = img;
      renderHud();
      onChange?.();
    };
    img.onerror = () => {};
    img.src = src;
    return null;
  }

  function brandLogoSrc() {
    if (state.brand === "custom") return state.brandCustomLogo;
    return window.BodycamCameras?.BRANDS[state.brand]?.logo || null;
  }

  function factionLogoSrc() {
    if (state.faction === "custom") return state.factionCustomLogo;
    if (state.faction === "none") return null;
    return (typeof FACTIONS !== "undefined" && FACTIONS[state.faction]?.icon) || null;
  }

  function buildNoise() {
    const size = 256;
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext("2d");
    const data = tctx.createImageData(size, size);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 180;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    tctx.putImageData(data, 0, 0);
    noisePattern = fctx.createPattern(tile, "repeat");
  }

  // ── Frame geometry ─────────────────────────────────────────────────────
  function frame() {
    return { W: state.W, H: state.H, unit: state.H / 1080 };
  }

  // ── Image effects (fx canvas) ──────────────────────────────────────────
  function grade() {
    return state.sensorGrade ? "saturate(0.86) contrast(1.06) brightness(0.97)" : "none";
  }

  /** Split the frame into RGB passes and offset them: cheap-lens fringing. */
  function drawAberration(amount) {
    const tints = [
      ["#ff0000", amount],
      ["#00ff00", 0],
      ["#0000ff", -amount],
    ];
    fctx.save();
    fctx.globalCompositeOperation = "lighter";
    for (const [tint, offset] of tints) {
      sctx.globalCompositeOperation = "source-over";
      sctx.filter = grade();
      sctx.clearRect(0, 0, state.W, state.H);
      sctx.drawImage(state.img, 0, 0, state.W, state.H);
      sctx.filter = "none";
      sctx.globalCompositeOperation = "multiply";
      sctx.fillStyle = tint;
      sctx.fillRect(0, 0, state.W, state.H);
      sctx.globalCompositeOperation = "source-over";
      fctx.drawImage(scratch, offset, 0);
    }
    fctx.restore();
  }

  function renderFx() {
    if (!state.img) return;
    const { W, H } = state;

    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.globalCompositeOperation = "source-over";
    fctx.globalAlpha = 1;
    fctx.filter = "none";
    fctx.clearRect(0, 0, W, H);

    if (state.aberrationOn && state.aberration > 0) {
      drawAberration((state.aberration / 100) * Math.max(2, Math.min(W, H) * 0.006));
    } else {
      fctx.filter = grade();
      fctx.drawImage(state.img, 0, 0, W, H);
      fctx.filter = "none";
    }

    if (state.vignetteOn && state.vignette > 0) {
      const g = fctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.72);
      const a = (state.vignette / 100) * 0.95;
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.6, `rgba(0,0,0,${(a * 0.25).toFixed(3)})`);
      g.addColorStop(1, `rgba(0,0,0,${a.toFixed(3)})`);
      fctx.fillStyle = g;
      fctx.fillRect(0, 0, W, H);
    }

    if (state.grain > 0 && noisePattern) {
      fctx.save();
      fctx.globalCompositeOperation = "overlay";
      fctx.globalAlpha = (state.grain / 100) * 0.55;
      fctx.fillStyle = noisePattern;
      fctx.fillRect(0, 0, W, H);
      fctx.restore();
    }

    if (state.scanlinesOn && state.scanlines > 0) {
      fctx.save();
      fctx.globalAlpha = (state.scanlines / 100) * 0.5;
      fctx.fillStyle = "#000";
      const step = Math.max(2, Math.round(H / 720));
      for (let y = 0; y < H; y += step * 2) fctx.fillRect(0, y, W, step);
      fctx.restore();

      // Slight CRT falloff at the top and bottom edges
      fctx.save();
      fctx.globalAlpha = (state.scanlines / 100) * 0.18;
      const cg = fctx.createLinearGradient(0, 0, 0, H);
      cg.addColorStop(0, "rgba(0,0,0,1)");
      cg.addColorStop(0.12, "rgba(0,0,0,0)");
      cg.addColorStop(0.88, "rgba(0,0,0,0)");
      cg.addColorStop(1, "rgba(0,0,0,1)");
      fctx.fillStyle = cg;
      fctx.fillRect(0, 0, W, H);
      fctx.restore();
    }
  }

  // ── HUD primitives ─────────────────────────────────────────────────────
  function monoFont(size, weight) {
    return `${weight} ${size}px ${MONO}`;
  }

  /** White text with a dark outline, so it survives a bright frame. */
  function textOut(ctx, text, x, y, unit, align) {
    ctx.textAlign = align || "left";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, unit * 4);
    ctx.strokeStyle = "rgba(0,0,0,0.82)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBattery(ctx, x, y, w, h, level, unit) {
    const r = Math.max(2, unit * 3);
    const cap = Math.round(w * 0.08);
    const shellW = w - cap;
    const value = Math.max(0, Math.min(100, level));

    ctx.save();
    ctx.lineWidth = Math.max(2, unit * 3);
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    roundRect(ctx, x, y, shellW, h, r);
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    roundRect(ctx, x, y, shellW, h, r);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillRect(x + shellW + Math.round(unit * 2), y + h * 0.28, cap, h * 0.44);

    const pad = Math.max(2, unit * 3);
    const fillW = (shellW - pad * 2) * (value / 100);
    ctx.fillStyle = value <= 20 ? "#e5484d" : value <= 40 ? "#f5b301" : "#3ecf5a";
    if (fillW > 0) {
      roundRect(ctx, x + pad, y + pad, fillW, h - pad * 2, Math.max(1, r - 2));
      ctx.fill();
    }

    ctx.font = monoFont(Math.round(h * 0.6), 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(2, unit * 3);
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(`${value}%`, x + shellW / 2, y + h / 2 + unit);
    ctx.fillStyle = "#fff";
    ctx.fillText(`${value}%`, x + shellW / 2, y + h / 2 + unit);
    ctx.restore();
  }

  /** Logo layers share everything but their source and base height. */
  function drawLogoLayer(ctx, id, src, baseHeight, f) {
    const layer = L.get(id);
    const img = layer.visible ? image(src) : null;
    if (!img) {
      L.clearBounds(id);
      return;
    }
    const u = f.unit * layer.scale;
    const h = Math.round(baseHeight * u);
    const w = Math.round(h * (img.width / img.height));
    const p = L.place(id, w, h, f);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = u * 10;
    ctx.shadowOffsetY = u * 2;
    ctx.drawImage(img, p.x, p.y, w, h);
    ctx.restore();
  }

  // ── HUD layers ─────────────────────────────────────────────────────────
  function drawStamp(ctx, f) {
    const layer = L.get("stamp");
    if (!layer.visible) {
      L.clearBounds("stamp");
      return;
    }

    const u = f.unit * layer.scale;
    const big = Math.round(STAMP_BIG * u);
    const small = Math.round(STAMP_SMALL * u);
    const rowH1 = Math.round(big * LINE_RATIO);
    const rowH2 = Math.round(small * LINE_RATIO);
    const rowGap = Math.round(10 * u);
    const colGap = Math.round(30 * u);

    // Two columns, so the serial stays lined up under the clock instead of
    // drifting with the device name's length.
    const topLeft = state.date;
    const topRight = [state.time, state.tz].filter(Boolean).join(" ");
    const botLeft = state.device;
    const botRight = state.serial;

    ctx.font = monoFont(big, 700);
    const wTL = topLeft ? ctx.measureText(topLeft).width : 0;
    const wTR = topRight ? ctx.measureText(topRight).width : 0;
    ctx.font = monoFont(small, 500);
    const wBL = botLeft ? ctx.measureText(botLeft).width : 0;
    const wBR = botRight ? ctx.measureText(botRight).width : 0;

    const hasTop = wTL > 0 || wTR > 0;
    const hasBottom = wBL > 0 || wBR > 0;
    if (!hasTop && !hasBottom) {
      L.clearBounds("stamp");
      return;
    }

    const col1 = Math.max(wTL, wBL);
    const col2 = Math.max(wTR, wBR);
    const w = Math.round(col1 + (col1 > 0 && col2 > 0 ? colGap : 0) + col2);
    const h = (hasTop ? rowH1 : 0) + (hasTop && hasBottom ? rowGap : 0) + (hasBottom ? rowH2 : 0);

    const p = L.place("stamp", w, h, f);
    const col2X = p.x + col1 + (col1 > 0 && col2 > 0 ? colGap : 0);
    let y = p.y;

    if (hasTop) {
      ctx.font = monoFont(big, 700);
      if (topLeft) textOut(ctx, topLeft, p.x, y, u);
      if (topRight) textOut(ctx, topRight, col2X, y, u);
      y += rowH1 + rowGap;
    }
    if (hasBottom) {
      ctx.font = monoFont(small, 500);
      if (botLeft) textOut(ctx, botLeft, p.x, y, u);
      if (botRight) textOut(ctx, botRight, col2X, y, u);
    }
  }

  function drawRec(ctx, f) {
    const layer = L.get("rec");
    if (!layer.visible) {
      L.clearBounds("rec");
      return;
    }

    const u = f.unit * layer.scale;
    const fs = Math.round(REC_FONT * u);
    const rowH = Math.round(fs * LINE_RATIO);
    const dot = Math.round(fs * 0.62);
    const gap = Math.round(12 * u);
    const wide = Math.round(gap * 1.6);
    const battW = Math.round(BATTERY_W * u);
    const battH = Math.round(BATTERY_H * u);

    ctx.font = monoFont(fs, 700);
    const recW = ctx.measureText("REC").width;
    const timerW = state.timer ? ctx.measureText(state.timer).width : 0;

    const w = Math.round(dot + gap + recW + (timerW ? wide + timerW : 0) + wide + battW);
    const h = Math.max(dot, rowH, battH);
    const p = L.place("rec", w, h, f);

    let x = p.x;
    const textY = p.y + (h - rowH) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + dot / 2, p.y + h / 2, dot / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ff2b2b";
    ctx.shadowColor = "rgba(255,0,0,0.8)";
    ctx.shadowBlur = dot * 0.6;
    ctx.fill();
    ctx.restore();
    x += dot + gap;

    ctx.font = monoFont(fs, 700);
    textOut(ctx, "REC", x, textY, u);
    x += recW;

    if (timerW) {
      x += wide;
      textOut(ctx, state.timer, x, textY, u);
      x += timerW;
    }

    x += wide;
    drawBattery(ctx, x, p.y + (h - battH) / 2, battW, battH, state.battery, u);
  }

  const DRAWERS = {
    badge: (ctx, f) => drawLogoLayer(ctx, "badge", factionLogoSrc(), BADGE_HEIGHT, f),
    brand: (ctx, f) => drawLogoLayer(ctx, "brand", brandLogoSrc(), BRAND_HEIGHT, f),
    stamp: drawStamp,
    rec: drawRec,
  };

  // ── Render passes ──────────────────────────────────────────────────────
  /** fx + HUD onto the visible canvas. Cheap enough to run on every keystroke. */
  function renderHud() {
    if (!state.img || !vctx) return;
    const f = frame();

    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.clearRect(0, 0, state.W, state.H);
    vctx.drawImage(fx, 0, 0);

    // Order matters: the timestamp parks itself against the camera logo, so
    // the logo has to have claimed its box first.
    L.DRAW_ORDER.forEach((id) => DRAWERS[id]?.(vctx, f));
  }

  /** Full rebuild, including the expensive pixel effects. */
  function renderAll() {
    renderFx();
    renderHud();
  }

  // ── Public API ─────────────────────────────────────────────────────────
  function attach(canvas, changeHandler) {
    view = canvas;
    vctx = canvas.getContext("2d");
    onChange = changeHandler || null;
    if (!noisePattern) buildNoise();
  }

  function setImage(img) {
    state.img = img;
    state.W = img.naturalWidth || img.width;
    state.H = img.naturalHeight || img.height;

    [view, fx, scratch].forEach((c) => {
      if (!c) return;
      c.width = state.W;
      c.height = state.H;
    });

    // A pattern is bound to the context that made it, and resizing the canvas
    // resets that context.
    buildNoise();
    renderAll();
  }

  function hasImage() {
    return !!state.img;
  }

  /** The finished frame, ready to export. */
  function canvas() {
    return view;
  }

  window.BodycamRender = {
    state,
    frame,
    attach,
    setImage,
    hasImage,
    canvas,
    renderAll,
    renderHud,
  };
})();
