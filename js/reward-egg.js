"use strict";

// Hidden "absurd reward" easter eggs on the Wanted Poster
// (wanted_poster.html): a reward of $10,000,000 or more slams a red
// PUBLIC ENEMY No. 1 rubber stamp onto the poster, and a reward of exactly
// $0 a NOBODY IS LOOKING FOR HIM (or HER) one - unless the poster already
// carries its resolved stamp (APPREHENDED etc.). The stamp is drawn into the
// poster canvas, so it goes out with the PNG export, the clipboard copy and
// the saved poster. Each stamp is its own piece of evidence for the
// Evidence Locker (js/guma-locker.js): "public-enemy" and "nobody".
//
// js/wanted-poster.js asks check() on every draw and calls drawStamp()
// last, over everything else. Loaded before it, because the page draws
// its first frame while the scripts are still loading.

window.GumaRewardEgg = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  const ENEMY_MIN = 10000000; // $10,000,000 and up
  const INK = "#c8102e";
  const INK_ALPHA = 0.86;
  const TILT_RAD = 0.1; // the other way from the resolved stamp
  const FONT_IMPACT = "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif";
  // Stamp face in logical px (the caller's canvas units).
  const STAMP_W = 560;
  const STAMP_H = 184;
  const PAD = 12; // room for the outer border once the stamp is tilted
  // Worn rubber: specks where the ink did not take. Seeded per text, so
  // the stamp looks exactly the same on every redraw instead of flickering.
  const WEAR_SPECKS = 900;
  const WEAR_STREAKS = 12;

  // ── Reward parsing ──────────────────────────────────────────────────
  // The reward is free text. The first number in it is the amount, with
  // thousands separators ("10,000,000", "10 000 000", "10.000.000") and a
  // scale word or suffix ("$10M", "1.5 billion", "250k") understood.
  // Text with no number in it ("Undisclosed") is no amount at all.
  const SCALE = { k: 1e3, thousand: 1e3, m: 1e6, mm: 1e6, mil: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };

  function parseAmount(text) {
    const s = String(text || "")
      .toLowerCase()
      .replace(/(\d)[\s,](?=\d{3}\b)/g, "$1");
    const m = s.match(/(\d+(?:\.\d+)*)\s*([a-z]+)?/);
    if (!m) return null;
    // More than one dot can only be thousands separators.
    const digits = (m[1].match(/\./g) || []).length > 1 ? m[1].replace(/\./g, "") : m[1];
    const n = parseFloat(digits) * (SCALE[m[2]] || 1);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * The stamp a reward earns, or null. Collects its evidence the first
   * time it does.
   * @param {string} reward raw reward text
   * @param {string} sex "Male" / "Female" / "" - picks HIM or HER
   * @returns {{id: string, main: string, sub: string} | null}
   */
  function check(reward, sex) {
    const amount = parseAmount(reward);
    let stamp = null;
    if (amount === 0) stamp = { id: "nobody", main: "NOBODY IS LOOKING", sub: sex === "Female" ? "FOR HER" : "FOR HIM" };
    else if (amount >= ENEMY_MIN) stamp = { id: "public-enemy", main: "PUBLIC ENEMY", sub: "No. 1" };
    if (stamp) window.GumaLocker?.collect(stamp.id);
    return stamp;
  }

  // ── Stamp ───────────────────────────────────────────────────────────
  // Rendered once per text and device scale into an offscreen canvas and
  // reused: the poster redraws on every keystroke.
  const _cache = new Map(); // "<scale>|<main>|<sub>" -> canvas

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

  // FNV-1a, to seed the wear from the stamp text.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function setSpacing(ctx, px) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px";
  }

  // Largest font size (down from maxPx) at which text fits maxW.
  function fitFont(ctx, text, maxW, maxPx) {
    let px = maxPx;
    do {
      ctx.font = `${px}px ${FONT_IMPACT}`;
    } while (ctx.measureText(text).width > maxW && (px -= 1) > 12);
    return px;
  }

  function renderFace(scale, stamp) {
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
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(0, 0, STAMP_W, STAMP_H, 18);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(16, 16, STAMP_W - 32, STAMP_H - 32, 9);
    ctx.stroke();

    // Main line, as wide as the inner frame allows.
    const cx = STAMP_W / 2;
    setSpacing(ctx, 3);
    fitFont(ctx, stamp.main, STAMP_W - 80, 88);
    ctx.fillText(stamp.main, cx + 1.5, 108);

    // Sub line between two rules. Measured without the spacing and laid
    // out from the left, so the gap to each rule is the same.
    const SUB_LS = 6;
    setSpacing(ctx, 0);
    ctx.font = `44px ${FONT_IMPACT}`;
    const subW = ctx.measureText(stamp.sub).width + (stamp.sub.length - 1) * SUB_LS;
    setSpacing(ctx, SUB_LS);
    ctx.textAlign = "left";
    ctx.fillText(stamp.sub, cx - subW / 2, 155);
    const half = subW / 2 + 22;
    setSpacing(ctx, 0);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 139);
    ctx.lineTo(cx - half, 139);
    ctx.moveTo(cx + half, 139);
    ctx.lineTo(STAMP_W - 40, 139);
    ctx.stroke();

    // Wear: punch specks and a few dry streaks out of the ink.
    const rnd = seeded(hash(stamp.main + "|" + stamp.sub));
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < WEAR_SPECKS; i++) {
      ctx.globalAlpha = 0.35 + rnd() * 0.65;
      ctx.beginPath();
      ctx.arc(rnd() * STAMP_W, rnd() * STAMP_H, 0.5 + rnd() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = "round";
    for (let i = 0; i < WEAR_STREAKS; i++) {
      const x = rnd() * STAMP_W;
      const y = rnd() * STAMP_H;
      ctx.globalAlpha = 0.25 + rnd() * 0.35;
      ctx.lineWidth = 1 + rnd() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40 + rnd() * 110, y + (rnd() - 0.5) * 10);
      ctx.stroke();
    }
    return c;
  }

  /**
   * Presses the stamp from check() onto ctx, centred on (cx, cy) in the
   * caller's logical units. Ink multiplies with the print, so the text
   * under the stamp still reads through it.
   */
  function drawStamp(ctx, cx, cy, stamp) {
    const scale = ctx.getTransform().a || 1;
    const key = `${scale}|${stamp.main}|${stamp.sub}`;
    if (!_cache.has(key)) _cache.set(key, renderFace(scale, stamp));

    ctx.save();
    ctx.globalAlpha = INK_ALPHA;
    ctx.globalCompositeOperation = "multiply";
    ctx.translate(cx, cy);
    ctx.rotate(TILT_RAD);
    const w = STAMP_W + PAD * 2;
    const h = STAMP_H + PAD * 2;
    ctx.drawImage(_cache.get(key), -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  return { check, drawStamp, parseAmount };
})();
