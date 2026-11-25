"use strict";

// ── Canvas pipeline ──────────────────────────────────────────────────────
// Two canvases so cheap edits never re-run expensive pixel work:
//
//   fx    screenshot + colour grade + aberration + vignette + grain + scanlines
//   view  fx + the HUD - what the user sees, drags on and exports
//
// Typing in the form only repaints view; touching an effect slider is the
// only thing that rebuilds fx.
//
// Easter egg: five quick taps on the battery and the camera "accidentally"
// dies - the battery drains to 0% in a second, the screen collapses like an
// old CRT, FOOTAGE UNAVAILABLE DUE TO TECHNICAL DIFFICULTIES sits on black,
// then the picture comes back through a burst of static. It only ever
// plays on view: exports taken meanwhile get the clean frame. Its sound is
// in js/bodycam-sound.js. Collected as "bodycam-off" in the Evidence Locker
// (js/guma-locker.js).

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

  // Outage easter egg: taps on the battery, each no further apart than the
  // gap, and the length of each phase in ms. The power-off collapse and the
  // static are skipped for reduced motion.
  const OUTAGE_TAPS = 5;
  const OUTAGE_TAP_GAP_MS = 800;
  const OUTAGE_DRAIN_MS = 1000;
  const OUTAGE_HOLD_MS = 250;
  const OUTAGE_DIE_MS = 400;
  const OUTAGE_DARK_MS = 2600;
  const OUTAGE_WAKE_MS = 700;
  // The dead battery on the black screen is on this long, then off as long.
  const OUTAGE_BLINK_MS = 500;
  const OUTAGE_MAIN = "FOOTAGE UNAVAILABLE";
  const OUTAGE_SUB = "DUE TO TECHNICAL DIFFICULTIES";
  // Static resolution; scaled up without smoothing into chunky TV snow.
  const SNOW_W = 192;
  const SNOW_H = 108;

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

  // Battery level the HUD pass draws - state.battery, unless the outage is
  // draining it.
  let hudBattery = 0;
  // Box of the battery icon from the last HUD pass, or null.
  let batteryBox = null;
  // Outage easter egg: the running sequence, the tap streak, and two
  // offscreen frames - one the outage animates, one for clean exports.
  let outage = null;
  let taps = 0;
  let lastTap = 0;
  const still = document.createElement("canvas");
  const clean = document.createElement("canvas");
  const snowCanvas = document.createElement("canvas");
  snowCanvas.width = SNOW_W;
  snowCanvas.height = SNOW_H;

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
      batteryBox = null;
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
    batteryBox = { x, y: p.y + (h - battH) / 2, w: battW, h: battH };
    drawBattery(ctx, batteryBox.x, batteryBox.y, battW, battH, hudBattery, u);
  }

  const DRAWERS = {
    badge: (ctx, f) => drawLogoLayer(ctx, "badge", factionLogoSrc(), BADGE_HEIGHT, f),
    brand: (ctx, f) => drawLogoLayer(ctx, "brand", brandLogoSrc(), BRAND_HEIGHT, f),
    stamp: drawStamp,
    rec: drawRec,
  };

  // ── Easter egg: the camera dies ────────────────────────────────────────
  function reducedMotion() {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  /** The current outage phase with its progress (0..1), or null once over. */
  function outagePhase() {
    let t = performance.now() - outage.start;
    for (const [name, ms] of outage.phases) {
      if (t < ms) return { name, t, p: t / ms };
      t -= ms;
    }
    return null;
  }

  /** A full frame (fx + HUD) on an offscreen canvas, sized to the shot. */
  function snapshot(target, level) {
    if (target.width !== state.W || target.height !== state.H) {
      target.width = state.W;
      target.height = state.H;
    }
    paint(target.getContext("2d"), level);
    return target;
  }

  /** Fresh TV snow, scaled up by the caller. */
  function snow() {
    const sctx2 = snowCanvas.getContext("2d");
    const data = sctx2.createImageData(SNOW_W, SNOW_H);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.random() * 255;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    sctx2.putImageData(data, 0, 0);
    return snowCanvas;
  }

  /** Mono font at `size`, shrunk until `text` fits `maxW`. */
  function fitMono(ctx, text, maxW, size, weight) {
    ctx.font = monoFont(size, weight);
    const w = ctx.measureText(text).width;
    if (w > maxW) ctx.font = monoFont(Math.floor((size * maxW) / w), weight);
  }

  function blank(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, state.W, state.H);
  }

  /** Old-CRT power-off: the frame squashes into a white line, then a dot. */
  function drawPowerOff(ctx, p) {
    const { W, H, unit } = frame();
    const line = Math.max(2, Math.round(4 * unit));
    blank(ctx);
    ctx.save();
    if (p < 0.55) {
      const k = p / 0.55;
      const h = Math.max(line, H * (1 - k) ** 3);
      const y = (H - h) / 2;
      ctx.drawImage(snapshot(still, 0), 0, y, W, h);
      ctx.globalAlpha = k;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, y, W, h);
    } else {
      const k = (p - 0.55) / 0.45;
      const w = Math.max(line, W * (1 - k) ** 2);
      ctx.globalAlpha = 1 - k * 0.7;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 24 * unit;
      ctx.fillStyle = "#fff";
      ctx.fillRect((W - w) / 2, (H - line) / 2, w, line);
    }
    ctx.restore();
  }

  /** Black screen, a dead battery blinking over the official excuse. */
  function drawNoSignal(ctx, t) {
    const { W, H, unit } = frame();
    blank(ctx);
    ctx.save();
    ctx.globalAlpha = Math.min(1, t / 300);

    const bw = Math.round(BATTERY_W * 1.6 * unit);
    const bh = Math.round(BATTERY_H * 1.6 * unit);
    if (Math.floor(t / OUTAGE_BLINK_MS) % 2 === 0) drawBattery(ctx, (W - bw) / 2, H / 2 - 150 * unit, bw, bh, 0, unit);

    const maxW = W * 0.86;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    fitMono(ctx, OUTAGE_MAIN, maxW, Math.round(72 * unit), 700);
    ctx.fillText(OUTAGE_MAIN, W / 2, H / 2 - 20 * unit);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    fitMono(ctx, OUTAGE_SUB, maxW, Math.round(36 * unit), 500);
    ctx.fillText(OUTAGE_SUB, W / 2, H / 2 + 50 * unit);
    ctx.restore();
  }

  /** The camera comes back: full static that clears off the picture. */
  function drawWakeUp(ctx, p) {
    const { W, H } = frame();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(snapshot(still, state.battery), 0, 0);
    ctx.save();
    ctx.globalAlpha = p < 0.4 ? 1 : 1 - (p - 0.4) / 0.6;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(snow(), 0, 0, W, H);
    ctx.restore();
  }

  function outageTick() {
    if (!outage) return;
    if (outagePhase()) {
      renderHud();
      requestAnimationFrame(outageTick);
      return;
    }
    outage = null;
    renderHud();
    onChange?.();
    // Collected once the picture is back, so the toast lands on a live frame.
    window.GumaLocker?.collect("bodycam-off");
  }

  function startOutage() {
    const reduce = reducedMotion();
    outage = {
      start: performance.now(),
      phases: [
        ["drain", OUTAGE_DRAIN_MS],
        ["hold", OUTAGE_HOLD_MS],
        ["die", reduce ? 0 : OUTAGE_DIE_MS],
        ["dark", OUTAGE_DARK_MS],
        ["wake", reduce ? 0 : OUTAGE_WAKE_MS],
      ],
    };
    window.BodycamSound?.outage(outage.phases, OUTAGE_BLINK_MS, outage.start);
    requestAnimationFrame(outageTick);
  }

  /**
   * A tap at a canvas-space point. Counts quick taps on the battery and
   * kills the camera on the fifth.
   * @param {number} x canvas-space x
   * @param {number} y canvas-space y
   * @param {number} [slop] extra hit margin in canvas pixels
   * @returns {boolean} true when this tap started the outage
   */
  function tapBattery(x, y, slop = 0) {
    if (outage || !batteryBox) return false;
    const b = batteryBox;
    if (x < b.x - slop || x > b.x + b.w + slop || y < b.y - slop || y > b.y + b.h + slop) return false;

    // Bring the audio device up now, so the outage is not heard late.
    window.BodycamSound?.warm();

    const now = performance.now();
    if (now - lastTap > OUTAGE_TAP_GAP_MS) taps = 0;
    lastTap = now;
    if (++taps < OUTAGE_TAPS) return false;

    taps = 0;
    startOutage();
    return true;
  }

  /** True while the outage plays; the stage ignores the pointer meanwhile. */
  function isOff() {
    return !!outage;
  }

  // ── Render passes ──────────────────────────────────────────────────────
  /** fx + the HUD onto ctx, with the battery reading `level`. */
  function paint(ctx, level) {
    const f = frame();
    hudBattery = level;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, state.W, state.H);
    ctx.drawImage(fx, 0, 0);

    // Order matters: the timestamp parks itself against the camera logo, so
    // the logo has to have claimed its box first.
    L.DRAW_ORDER.forEach((id) => DRAWERS[id]?.(ctx, f));
  }

  /**
   * fx + HUD onto the visible canvas. Cheap enough to run on every keystroke.
   * While the outage plays, its current frame instead - so edits made
   * meanwhile never flash the live picture through the blackout.
   */
  function renderHud() {
    if (!state.img || !vctx) return;
    const phase = outage && outagePhase();
    switch (phase?.name) {
      case "drain":
        // Eased in: it slips, then plummets.
        paint(vctx, Math.round(state.battery * (1 - phase.p ** 2)));
        break;
      case "hold":
        paint(vctx, 0);
        break;
      case "die":
        drawPowerOff(vctx, phase.p);
        break;
      case "dark":
        drawNoSignal(vctx, phase.t);
        break;
      case "wake":
        drawWakeUp(vctx, phase.p);
        break;
      default:
        paint(vctx, state.battery);
    }
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

  /** The finished frame, ready to export - never the outage. */
  function canvas() {
    return outage ? snapshot(clean, state.battery) : view;
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
    tapBattery,
    isOff,
  };
})();
