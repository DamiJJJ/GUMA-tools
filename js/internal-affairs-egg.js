"use strict";

// Hidden "Internal Affairs" easter egg on the Arrest Report
// (arrest_report.html): when the arrestee carries the same name as one of
// the arresting officers, a red REFERRED TO INTERNAL AFFAIRS rubber stamp
// lands across the report. The stamp is drawn into the document canvas, so
// it goes out with the PNG export, the clipboard copy and the saved report.
// Collects the "internal-affairs" evidence for the Evidence Locker
// (js/guma-locker.js).
//
// js/arrest-report.js asks check() on every draw and calls drawStamp()
// last, over everything else; a hand presses the stamp on when it first
// appears (js/stamp-press.js). Loaded before it, because the page draws
// its first frame while the scripts are still loading.

window.GumaIaEgg = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  const EVIDENCE_ID = "internal-affairs";
  const INK = "#c8102e";
  const INK_ALPHA = 0.82;
  const TILT_RAD = -0.13;
  // Stamp face in logical px (the caller's canvas units).
  const STAMP_W = 270;
  const STAMP_H = 74;
  const PAD = 6; // room for the outer border once the stamp is tilted
  // Worn rubber: specks where the ink did not take. Seeded, so the stamp
  // looks exactly the same on every redraw instead of flickering.
  const WEAR_SEED = 1031;
  const WEAR_SPECKS = 340;
  const WEAR_STREAKS = 7;

  // ── Name matching ───────────────────────────────────────────────────
  // "Doe, John", "John Doe" and "DOE, John M." are the same person: case,
  // accents, punctuation, word order and single-letter initials are
  // ignored. The shorter name must be fully contained in the longer one
  // and carry at least two words, so a bare "Doe" never matches.

  function words(name) {
    return String(name || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1);
  }

  function sameName(a, b) {
    const wa = new Set(words(a));
    const wb = new Set(words(b));
    const [short, long] = wa.size <= wb.size ? [wa, wb] : [wb, wa];
    if (short.size < 2) return false;
    for (const w of short) if (!long.has(w)) return false;
    return true;
  }

  /**
   * True when the arrestee is one of the arresting officers. Collects the
   * evidence the first time it is.
   * @param {string} arrestee raw arrestee name
   * @param {string[]} officers raw officer names
   */
  function check(arrestee, officers) {
    const hit = officers.some((o) => sameName(arrestee, o));
    if (hit) window.GumaLocker?.collect(EVIDENCE_ID);
    return hit;
  }

  // ── Stamp ───────────────────────────────────────────────────────────
  // Rendered once per device scale into an offscreen canvas and reused:
  // the report redraws on every keystroke.
  let _cache = null; // { scale, canvas }

  // mulberry32 - tiny seeded PRNG.
  function seeded(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Largest font size (down from maxPx) at which text fits maxW.
  function fitFont(ctx, text, maxW, maxPx, weight) {
    let px = maxPx;
    do {
      ctx.font = `${weight} ${px}px Arial, Helvetica, sans-serif`;
    } while (ctx.measureText(text).width > maxW && (px -= 0.5) > 6);
  }

  function renderFace(scale) {
    const c = document.createElement("canvas");
    c.width = Math.ceil((STAMP_W + PAD * 2) * scale);
    c.height = Math.ceil((STAMP_H + PAD * 2) * scale);
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);
    ctx.translate(PAD, PAD);

    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Double border: a heavy outer frame, a hairline inside it.
    ctx.lineWidth = 3.4;
    roundRect(ctx, 0, 0, STAMP_W, STAMP_H, 7);
    ctx.stroke();
    ctx.lineWidth = 1.1;
    roundRect(ctx, 6, 6, STAMP_W - 12, STAMP_H - 12, 4);
    ctx.stroke();

    // "REFERRED TO" between two short rules.
    const cx = STAMP_W / 2;
    ctx.font = "bold 11px Arial, Helvetica, sans-serif";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillText("REFERRED TO", cx + 1.5, 24);
    const half = ctx.measureText("REFERRED TO").width / 2 + 8;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(18, 20);
    ctx.lineTo(cx - half, 20);
    ctx.moveTo(cx + half, 20);
    ctx.lineTo(STAMP_W - 18, 20);
    ctx.stroke();

    // "INTERNAL AFFAIRS", as wide as the inner frame allows.
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    fitFont(ctx, "INTERNAL AFFAIRS", STAMP_W - 30, 30, 900);
    ctx.fillText("INTERNAL AFFAIRS", cx, 56);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    // Wear: punch specks and a few dry streaks out of the ink.
    const rnd = seeded(WEAR_SEED);
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < WEAR_SPECKS; i++) {
      ctx.globalAlpha = 0.35 + rnd() * 0.65;
      ctx.beginPath();
      ctx.arc(rnd() * STAMP_W, rnd() * STAMP_H, 0.3 + rnd() * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = "round";
    for (let i = 0; i < WEAR_STREAKS; i++) {
      const x = rnd() * STAMP_W;
      const y = rnd() * STAMP_H;
      ctx.globalAlpha = 0.25 + rnd() * 0.35;
      ctx.lineWidth = 0.6 + rnd() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + rnd() * 40, y + (rnd() - 0.5) * 4);
      ctx.stroke();
    }
    return c;
  }

  /**
   * Presses the stamp onto ctx, centred on (cx, cy) in the caller's
   * logical units. Ink multiplies with the print, so the text under the
   * stamp still reads through it.
   */
  function drawStamp(ctx, cx, cy) {
    const scale = ctx.getTransform().a || 1;
    if (!_cache || _cache.scale !== scale) _cache = { scale, canvas: renderFace(scale) };

    ctx.save();
    ctx.globalAlpha = INK_ALPHA;
    ctx.globalCompositeOperation = "multiply";
    ctx.translate(cx, cy);
    ctx.rotate(TILT_RAD);
    const w = STAMP_W + PAD * 2;
    const h = STAMP_H + PAD * 2;
    ctx.drawImage(_cache.canvas, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // Imprint size and tilt, for the hand that presses it on
  // (js/stamp-press.js).
  const face = { w: STAMP_W, h: STAMP_H, angle: TILT_RAD };

  return { check, drawStamp, face };
})();
