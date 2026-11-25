"use strict";

// Rubber stamp press: whenever a rubber stamp appears on a document preview
// (Internal Affairs on the arrest report, the resolved and the absurd reward
// stamps on the wanted poster, CONFIDENTIAL on the personnel file), a hand
// reaches in with a wooden rubber stamp, winds up, slams it down with a low
// thud and pulls back out, leaving the imprint behind.
//
// Purely a preview flourish: the imprint is still drawn by the page into
// its canvas, so the PNG export, the clipboard copy and saved reports are
// untouched. The page asks gate() on every draw whether to paint a stamp.
// While the hand is on its way the answer is "not yet"; at the moment of
// impact the page is asked to redraw, and from then on the answer is "yes".
//
// A stamp lands at once, silently, when it was already on the first draw
// (nobody watched it arrive) or when it appears out of sight (preview
// scrolled away, a dialog over it). Reduced motion: at once, with the thud.
//
// The hand and the stamp are drawn in code (SVG, coloured by the
// .guma-press-* rules in js/guma-styles.js) and posed frame by frame from
// one clock, like the burnout (js/easter-egg.js).
//
// Classic global script, no ES modules: window.GumaStampPress.

window.GumaStampPress = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  // Timeline, in ms: reach in, wind up, slam, hold the press a beat, lift,
  // pull back out the way it came.
  const ENTER_MS = 320;
  const WINDUP_MS = 150;
  const SLAM_MS = 70;
  const HOLD_MS = 200;
  const LIFT_MS = 120;
  const EXIT_MS = 280;
  const IMPACT_MS = ENTER_MS + WINDUP_MS + SLAM_MS;
  const LIFT_AT_MS = IMPACT_MS + HOLD_MS;
  const EXIT_AT_MS = LIFT_AT_MS + LIFT_MS;
  const END_MS = EXIT_AT_MS + EXIT_MS;

  // The arm reaches in from the right, a little from below: steeper, the
  // sleeve would cover the imprint as the stamp lifts off it.
  const ARM_DEG = 12;
  const SWING_DEG = 10; // carried in at a slant, levelled out on arrival
  // Hand size (px per 100 design units of the handle and hand art),
  // grown with the stamp but kept readable on a small one.
  const HAND_MIN_PX = 66;
  const HAND_MAX_PX = 150;
  // Hover and wind-up heights above the paper, in hand units.
  const HOVER = 0.5;
  const WINDUP = 0.95;
  // Raised stamps are nearer the viewer: this much bigger per hand unit.
  const LIFT_GROW = 0.14;

  const SHAKE_MS = 220;
  const BURST_MS = 320;

  const SVG_NS = "http://www.w3.org/2000/svg";

  // ── Easing ──────────────────────────────────────────────────────────
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);
  const easeInCubic = (v) => v * v * v;
  const easeOutQuad = (v) => 1 - (1 - v) * (1 - v);
  const easeOutBack = (v) => 1 + 2.70158 * Math.pow(v - 1, 3) + 1.70158 * Math.pow(v - 1, 2);
  const f1 = (v) => (Math.round(v * 10) / 10).toString();

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // ── Sound ───────────────────────────────────────────────────────────
  // A low wooden thud, synthesised on the shared context of
  // js/guma-audio.js like every egg sound, so the repo ships no audio
  // files. A sine that drops from a knock to a sub in a blink (the boom),
  // a softly clipped copy of it (harmonics a laptop speaker can actually
  // play), and two short bursts of filtered noise: the knock of wood on
  // the desk and the slap of rubber on paper.
  const THUD_GAIN = 1.5;
  // A context still waking up (Safari, first press) drops a thud that
  // would land this much later than the stamp.
  const THUD_LATE_MS = 150;

  /**
   * Plays one thud, `delay` seconds from now. Also used without the hand:
   * the About logo egg and the stamp exhibits in the Evidence Locker.
   * @returns {{stop: Function} | null} GumaAudio.play() handle
   */
  function thud(delay = 0) {
    const audio = window.GumaAudio;
    if (!audio) return null;
    return audio.play((ctx, out, t) => playThud(ctx, out, t + delay), { late: THUD_LATE_MS });
  }

  /** Builds and starts one thud at t, into `out` (live or offline). */
  function playThud(ctx, out, t) {
    const { envelope, filter, noise, softClip } = window.GumaAudio;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.001;
    comp.release.value = 0.2;
    const master = ctx.createGain();
    master.gain.value = THUD_GAIN;
    master.connect(comp);
    comp.connect(out);

    // Boom.
    const boom = ctx.createOscillator();
    boom.type = "sine";
    boom.frequency.setValueAtTime(170, t);
    boom.frequency.exponentialRampToValueAtTime(55, t + 0.09);
    boom.frequency.exponentialRampToValueAtTime(38, t + 0.45);
    const boomEnv = envelope(ctx, t, 1, 0.003, 0.42);
    boom.connect(boomEnv);
    boomEnv.connect(master);

    // Grit: the boom through a soft clipper, low-passed so it stays a thud.
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClip(4);
    const gritTone = filter(ctx, "lowpass", 900);
    const grit = ctx.createGain();
    grit.gain.value = 0.45;
    boomEnv.connect(shaper);
    shaper.connect(gritTone);
    gritTone.connect(grit);
    grit.connect(master);

    // One short burst of noise feeds the two contact layers.
    const src = noise(ctx);

    // Knock: wood on the desk, its brightness falling as fast as it fades.
    const knockTone = filter(ctx, "lowpass", 3000, 0.9);
    knockTone.frequency.setValueAtTime(3000, t);
    knockTone.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    const knockEnv = envelope(ctx, t, 1.6, 0.001, 0.07);
    src.connect(knockTone);
    knockTone.connect(knockEnv);
    knockEnv.connect(master);

    // Slap: the rubber meeting the paper - a crisp click small speakers
    // play even when the boom is below what they can reach.
    const slapTone = filter(ctx, "bandpass", 1400, 0.9);
    const slapEnv = envelope(ctx, t, 0.5, 0.001, 0.03);
    src.connect(slapTone);
    slapTone.connect(slapEnv);
    slapEnv.connect(master);

    boom.start(t);
    boom.stop(t + 0.5);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.12);
  }

  // ── Art ─────────────────────────────────────────────────────────────
  // Everything is laid out around the centre of the imprint, in CSS px.
  // The wooden block covers the imprint (turned with it); the handle and
  // the hand stay upright on the centre of the block's top face; the arm
  // runs off up and to the right, long enough to leave the viewport.
  // The handle and hand are drawn in design units (100 = one hand size)
  // with the handle's foot at 0,0.

  /**
   * Geometry of one rig, from the imprint size on screen. The hand size
   * follows the imprint unless `hand` gives it.
   */
  function measure(w, h, angle, armDeg, reach, hand) {
    const s = hand || Math.min(HAND_MAX_PX, Math.max(HAND_MIN_PX, 0.7 * h + 0.2 * w));
    const u = s / 100;
    const m = Math.max(3, 0.05 * h); // block overhang around the imprint
    const front = Math.min(22, Math.max(5, 0.18 * h)); // front face of the block
    const rubber = Math.min(7, Math.max(2.5, 0.06 * h)); // inked rubber under it
    const r = Math.min(10, 0.14 * (h + 2 * m)); // block corner radius
    const lw = Math.min(2.4, Math.max(1.3, s * 0.022)); // outline width, px
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Handle foot: centre of the top face, turned with the block.
    const topC = -(front + rubber) / 2;
    const hx = -topC * sin;
    const hy = topC * cos;
    // Block extents once turned.
    const bx = w / 2 + m;
    const by = h / 2 + m;
    const halfX = bx * Math.abs(cos) + by * Math.abs(sin);
    const halfY = bx * Math.abs(sin) + by * Math.abs(cos);
    // Arm: from the wrist (16, -36 design units) along armDeg.
    const armLen = reach / u; // design units
    const a = (armDeg * Math.PI) / 180;
    const endX = hx + u * (16 + armLen * Math.cos(a));
    const endY = hy + u * (-36 + armLen * Math.sin(a));
    const pad = 4 + 30 * u;
    return {
      w, h, s, u, m, front, rubber, r, lw, angle, armDeg, hx, hy, armLen, halfX, halfY,
      box: {
        x: Math.min(-halfX, hx - 30 * u) - pad,
        y: Math.min(-halfY, hy - 96 * u, endY) - pad,
        r: Math.max(halfX, endX) + pad,
        b: Math.max(halfY, endY) + pad,
      },
    };
  }

  function blockMarkup(g) {
    const { w, h, m, front, rubber, r } = g;
    const x0 = -w / 2 - m;
    const bw = w + 2 * m;
    const y0 = -h / 2 - m;
    const yBottom = h / 2 + m;
    const topH = yBottom - rubber - front - y0;
    const frontTop = y0 + topH - r;
    const frontH = yBottom - rubber - frontTop;
    // Paper label on the top face, ruled in red like the imprint.
    const li = Math.min(0.2 * topH, 12, 0.08 * bw);
    const lr = Math.max(1.5, r * 0.4);
    return `
      <g transform="rotate(${f1((g.angle * 180) / Math.PI)})">
        <rect class="guma-press-ink guma-press-line" x="${f1(x0 + 2)}" y="${f1(yBottom - rubber - 2)}" width="${f1(bw - 4)}" height="${f1(rubber + 2)}" rx="${f1(rubber / 2)}"/>
        <rect class="guma-press-wood-side guma-press-line" x="${f1(x0)}" y="${f1(frontTop)}" width="${f1(bw)}" height="${f1(frontH)}" rx="${f1(r)}"/>
        <rect class="guma-press-wood guma-press-line" x="${f1(x0)}" y="${f1(y0)}" width="${f1(bw)}" height="${f1(topH)}" rx="${f1(r)}"/>
        <rect class="guma-press-label" x="${f1(x0 + li)}" y="${f1(y0 + li)}" width="${f1(bw - 2 * li)}" height="${f1(topH - 2 * li)}" rx="${f1(lr)}"/>
        <rect class="guma-press-label-rule" x="${f1(x0 + li * 1.6)}" y="${f1(y0 + li * 1.6)}" width="${f1(bw - 3.2 * li)}" height="${f1(topH - 3.2 * li)}" rx="${f1(lr * 0.7)}" stroke-width="${f1(Math.max(1, g.lw * 0.6))}"/>
      </g>`;
  }

  function handMarkup(g) {
    const L = f1(g.armLen);
    return `
      <g transform="translate(${f1(g.hx)} ${f1(g.hy)}) scale(${g.u.toFixed(4)})" stroke-width="${(g.lw / g.u).toFixed(2)}">
        <g transform="translate(16 -36) rotate(${g.armDeg})">
          <path class="guma-press-skin guma-press-line" d="M -8 -15 L 64 -18 L 64 18 L -8 15 Z"/>
          <path class="guma-press-sleeve guma-press-line" d="M 46 -24 L ${L} -29 L ${L} 29 L 46 24 Z"/>
          <path class="guma-press-sleeve-hi" d="M 64 -14 L ${L} -18" stroke-width="5"/>
          <rect class="guma-press-cuff guma-press-line" x="44" y="-25" width="15" height="50" rx="4"/>
          <circle class="guma-press-button guma-press-line" cx="51.5" cy="15" r="3.4"/>
        </g>
        <ellipse class="guma-press-wood-side guma-press-line" cx="0" cy="0" rx="22" ry="7"/>
        <rect class="guma-press-wood guma-press-line" x="-9" y="-66" width="18" height="66" rx="3"/>
        <ellipse class="guma-press-wood guma-press-line" cx="0" cy="-77" rx="21" ry="14"/>
        <ellipse class="guma-press-wood-hi" cx="-8" cy="-82" rx="7" ry="3.5"/>
        <rect class="guma-press-skin guma-press-line" x="-21" y="-60" width="45" height="48" rx="14"/>
        <rect class="guma-press-skin guma-press-line" x="-27" y="-60" width="35" height="12.5" rx="6.25"/>
        <rect class="guma-press-skin guma-press-line" x="-27" y="-47.5" width="35" height="12.5" rx="6.25"/>
        <rect class="guma-press-skin guma-press-line" x="-26" y="-35" width="33" height="12" rx="6"/>
        <rect class="guma-press-skin guma-press-line" x="-24" y="-23" width="30" height="11" rx="5.5"/>
        <path class="guma-press-skin guma-press-line" d="M 23 -40 C 21 -56 6 -65 -10 -65 C -19 -65 -19 -55 -11 -54 C 0 -53 9 -48 13 -38 Z"/>
      </g>`;
  }

  // Comic impact lines out of both short sides of the block.
  function burstMarkup(g) {
    const { w, h, m } = g;
    const gap = 6 + g.lw;
    const len = Math.min(44, Math.max(12, 0.3 * h + 8));
    const lines = [];
    [-1, 1].forEach((side) => {
      [-1, 0, 1].forEach((i) => {
        const a = (i * 24 * Math.PI) / 180;
        const x = side * (w / 2 + m + gap);
        const y = i * (h / 2 + m) * 0.55;
        const dx = side * Math.cos(a);
        const dy = Math.sin(a);
        const l = i === 0 ? len : len * 0.8;
        lines.push(`<path d="M ${f1(x)} ${f1(y)} l ${f1(dx * l)} ${f1(dy * l)}"/>`);
      });
    });
    const sx = w / 2 + m + gap + len + 6;
    const sy = h / 2 + m + len + 6;
    return `
      <svg class="guma-press-burst" xmlns="${SVG_NS}" viewBox="${f1(-sx)} ${f1(-sy)} ${f1(2 * sx)} ${f1(2 * sy)}"
           style="left:${f1(-sx)}px;top:${f1(-sy)}px;width:${f1(2 * sx)}px;height:${f1(2 * sy)}px">
        <g class="guma-press-burst-line" stroke-width="${f1(g.lw * 1.9)}" transform="rotate(${f1((g.angle * 180) / Math.PI)})">${lines.join("")}</g>
      </svg>`;
  }

  function rigMarkup(g) {
    const { box } = g;
    const bw = box.r - box.x;
    const bh = box.b - box.y;
    const sw = g.w + 2 * g.m;
    const sh = g.h + 2 * g.m;
    return `
      <div class="guma-press-shadow" style="left:${f1(-sw / 2)}px;top:${f1(-sh / 2)}px;width:${f1(sw)}px;height:${f1(sh)}px;border-radius:${f1(g.r)}px;filter:blur(${f1(2 + g.s * 0.06)}px)"></div>
      ${burstMarkup(g)}
      <div class="guma-press-tool">
        <svg class="guma-press-art" xmlns="${SVG_NS}" viewBox="${f1(box.x)} ${f1(box.y)} ${f1(bw)} ${f1(bh)}"
             style="left:${f1(box.x)}px;top:${f1(box.y)}px;width:${f1(bw)}px;height:${f1(bh)}px">
          ${blockMarkup(g)}
          ${handMarkup(g)}
        </svg>
      </div>`;
  }

  // ── Stage ───────────────────────────────────────────────────────────
  // Mounted on load with a hidden template rig, like the donut rain: the
  // Tailwind CDN compiles classes it finds in the DOM, so a rig injected
  // on demand would paint unstyled for a frame.
  let stage = null;

  function mountStage() {
    if (stage || !document.body) return stage;
    stage = document.createElement("div");
    stage.className = "guma-press-stage";
    stage.setAttribute("aria-hidden", "true");
    const template = document.createElement("div");
    template.className = "guma-press-rig hidden";
    template.innerHTML = rigMarkup(measure(120, 40, 0, ARM_DEG, 100));
    stage.appendChild(template);
    document.body.appendChild(stage);
    return stage;
  }

  // ── Placement ───────────────────────────────────────────────────────
  /**
   * Where the imprint centre is on screen right now, and how many CSS px
   * one logical canvas unit spans. Null once the canvas is gone.
   */
  function locate(place) {
    const c = place.canvas;
    if (!c || !c.isConnected || !c.width) return null;
    const r = c.getBoundingClientRect();
    const k = (c.clientWidth / c.width) * place.scale;
    if (!(k > 0)) return null;
    return { x: r.left + c.clientLeft + place.x * k, y: r.top + c.clientTop + place.y * k, k };
  }

  /**
   * True when the reader can see the spot the stamp lands on: inside the
   * viewport, and the topmost thing there belongs to the preview (not a
   * dialog, the sticky header or a scrolled-away part of the sheet).
   */
  function inSight(canvas, x, y) {
    if (document.visibilityState === "hidden") return false;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    let host = canvas.parentElement;
    for (let el = host; el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.overflowY !== "visible" || cs.overflowX !== "visible") {
        host = el;
        break;
      }
    }
    const hit = document.elementFromPoint(x, y);
    return !!hit && (hit === canvas || !!host?.contains(hit));
  }

  /** How far from (x, y) along armDeg the screen edge is. */
  function reachToEdge(x, y, armDeg) {
    const a = (armDeg * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const toX = dx > 0 ? (window.innerWidth - x) / dx : dx < 0 ? -x / dx : Infinity;
    const toY = dy > 0 ? (window.innerHeight - y) / dy : dy < 0 ? -y / dy : Infinity;
    return Math.max(0, Math.min(toX, toY));
  }

  // ── Press ───────────────────────────────────────────────────────────
  const slots = new Map(); // slot name -> { id, run }

  function shake(canvas, amp) {
    if (typeof canvas.animate !== "function") return;
    canvas.animate(
      [
        { translate: "0 0" },
        { translate: `0 ${f1(amp)}px` },
        { translate: `0 ${f1(-amp * 0.4)}px` },
        { translate: `0 ${f1(amp * 0.15)}px` },
        { translate: "0 0" },
      ],
      { duration: SHAKE_MS, easing: "ease-out" },
    );
  }

  function land(state, loud) {
    const run = state.run;
    if (!run || run.landed) return;
    run.landed = true;
    if (loud) {
      thud();
      shake(run.place.canvas, Math.min(3.5, Math.max(1.5, run.g.s * 0.03)));
      run.burst.animate(
        [
          { opacity: 1, transform: "scale(0.8)" },
          { opacity: 0, transform: "scale(1.3)" },
        ],
        { duration: BURST_MS, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
      );
    }
    run.place.redraw();
  }

  function stop(state) {
    const run = state.run;
    if (!run) return;
    cancelAnimationFrame(run.raf);
    run.el.remove();
    state.run = null;
  }

  /** Poses the rig at t ms. False when the canvas has gone away. */
  function pose(run, t) {
    const at = locate(run.place);
    if (!at) return false;
    const { g, el, tool, shadow } = run;
    const hover = HOVER * g.s;
    const high = WINDUP * g.s;
    let travel = 0;
    let lift = hover;
    let swing = 0;
    let sx = 1;
    let sy = 1;

    if (t < ENTER_MS) {
      const k = t / ENTER_MS;
      travel = run.dist * (1 - easeOutCubic(k));
      swing = SWING_DEG * (1 - easeOutBack(k));
    } else if (t < ENTER_MS + WINDUP_MS) {
      const k = (t - ENTER_MS) / WINDUP_MS;
      lift = hover + (high - hover) * easeOutQuad(k);
      swing = -2.5 * Math.sin(Math.PI * k);
    } else if (t < IMPACT_MS) {
      const k = (t - ENTER_MS - WINDUP_MS) / SLAM_MS;
      lift = high * (1 - easeInCubic(k));
      sx = 1 - 0.04 * k;
      sy = 1 + 0.08 * k;
    } else if (t < LIFT_AT_MS) {
      // Squash on contact, wobbling back to shape while it presses.
      const k = (t - IMPACT_MS) / HOLD_MS;
      const wob = Math.exp(-5 * k) * Math.cos(k * Math.PI * 3);
      lift = 0;
      sx = 1 + 0.03 * wob;
      sy = 1 - 0.07 * wob;
    } else if (t < EXIT_AT_MS) {
      lift = hover * easeOutCubic((t - LIFT_AT_MS) / LIFT_MS);
    } else {
      const k = easeInCubic(clamp01((t - EXIT_AT_MS) / EXIT_MS));
      travel = run.dist * k;
      swing = SWING_DEG * 0.7 * k;
    }

    const a = (g.armDeg * Math.PI) / 180;
    const x = at.x + travel * Math.cos(a);
    const y = at.y + travel * Math.sin(a);
    const grow = 1 + (LIFT_GROW * lift) / g.s;
    // The rig was sized for the preview zoom at the start; follow it if it
    // changes mid-press (the wanted poster re-fits after every draw).
    const zoom = at.k / run.k;
    el.style.transform = `translate(${f1(x)}px, ${f1(y)}px) scale(${zoom.toFixed(4)})`;
    tool.style.transform = `translate(0, ${f1(-lift)}px) rotate(${swing.toFixed(2)}deg) scale(${(grow * sx).toFixed(3)}, ${(grow * sy).toFixed(3)})`;
    // The shadow stays on the paper: it spreads, fades and slides away
    // from the light (top left) as the stamp rises.
    const rise = clamp01(lift / high);
    shadow.style.transform = `translate(${f1(lift * 0.14)}px, ${f1(lift * 0.26)}px) rotate(${((g.angle * 180) / Math.PI + swing).toFixed(2)}deg) scale(${(1 + 0.08 * rise).toFixed(3)})`;
    shadow.style.opacity = (0.36 - 0.26 * rise).toFixed(2);
    return true;
  }

  function start(state, place) {
    const at = locate(place);
    if (!at || !inSight(place.canvas, at.x, at.y)) return false;
    if (prefersReducedMotion()) {
      thud();
      return false;
    }
    if (!mountStage() || typeof stage.animate !== "function") return false;
    window.GumaAudio?.warm(); // wake the audio up now, so it is running by the impact

    const reach = reachToEdge(at.x, at.y, ARM_DEG);
    const g = measure(place.w * at.k, place.h * at.k, place.angle || 0, ARM_DEG, reach + 260);
    const el = document.createElement("div");
    el.className = "guma-press-rig";
    el.innerHTML = rigMarkup(g);
    stage.appendChild(el);

    const run = {
      place,
      g,
      k: at.k,
      el,
      tool: el.querySelector(".guma-press-tool"),
      shadow: el.querySelector(".guma-press-shadow"),
      burst: el.querySelector(".guma-press-burst"),
      // Far enough back along the arm that the whole rig starts off-screen.
      dist: reach + (g.halfX + g.halfY) * 1.25 + g.s * (1 + WINDUP),
      landed: false,
      raf: 0,
    };
    state.run = run;

    let t0 = 0;
    const frame = (now) => {
      if (state.run !== run) return;
      if (!t0) t0 = now;
      const t = now - t0;
      if (t >= IMPACT_MS) land(state, true);
      if (state.run !== run) return; // the redraw took the stamp off again
      if (t >= END_MS || !pose(run, t)) {
        land(state, false);
        stop(state);
        return;
      }
      run.raf = requestAnimationFrame(frame);
    };
    pose(run, 0);
    run.raf = requestAnimationFrame(frame);
    return true;
  }

  // ── Public API ──────────────────────────────────────────────────────
  /**
   * Asked on every draw: should this stamp be painted now? Starts the
   * press when a stamp appears in the slot (or changes to another one).
   * @param {string} slot one place on one document, e.g. "ia"
   * @param {string|null} id the stamp that belongs there now, or null
   * @param {{ctx: CanvasRenderingContext2D, x: number, y: number,
   *   w: number, h: number, angle?: number, redraw: Function}} [place]
   *   imprint centre and size in the caller's logical canvas units (the
   *   ctx transform at call time maps them to the backing store), its
   *   tilt in radians, and how to redraw the document at impact
   * @returns {boolean} true to paint the stamp on this draw
   */
  function gate(slot, id, place) {
    let state = slots.get(slot);
    const first = !state;
    if (!state) slots.set(slot, (state = { id: null, run: null }));
    if (!id) {
      stop(state);
      state.id = null;
      return false;
    }
    const where = place && {
      canvas: place.ctx.canvas,
      scale: place.ctx.getTransform().a || 1,
      x: place.x,
      y: place.y,
      w: place.w,
      h: place.h,
      angle: place.angle,
      redraw: place.redraw,
    };
    if (state.id === id) {
      if (!state.run) return true;
      if (where) state.run.place = where;
      return state.run.landed;
    }
    stop(state);
    state.id = id;
    if (first || !where) return true;
    return !start(state, where);
  }

  /**
   * The stamp in hand as still SVG markup (no shadow, no motion), laid out
   * around the imprint centre in the caller's units, the arm running off
   * to the right. For small art: the Evidence Locker exhibits
   * (js/guma-locker.js) animate it with CSS.
   * @param {number} w imprint width
   * @param {number} h imprint height
   * @param {number} angle imprint tilt, radians
   * @param {{hand: number, reach: number}} opts hand size (units per hand)
   *   and how far the arm reaches past the handle
   * @returns {string}
   */
  function art(w, h, angle, opts) {
    const g = measure(w, h, angle, ARM_DEG, opts.reach, opts.hand);
    return blockMarkup(g) + handMarkup(g);
  }

  /**
   * Lands every stamp still in the air at once, quietly, and clears the
   * hands away. Called before the document is exported.
   */
  function settle() {
    slots.forEach((state) => {
      land(state, false);
      stop(state);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountStage, { once: true });
  } else {
    mountStage();
  }

  return { gate, settle, art, thud };
})();
