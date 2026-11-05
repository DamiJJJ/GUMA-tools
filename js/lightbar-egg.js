"use strict";

// Hidden "lightbar" easter egg: flipping the header theme toggle about ten
// times in five seconds lights the page up like a patrol car - both side
// edges of the screen turn into stacked lamps (blue on top, red in the
// middle, white at the bottom) while a synthesised siren goes "whoop". The
// lamps run the fast flash patterns of a US LED lightbar (quad flash, double
// flash, wig-wag...), switching to another one at random every few seconds,
// until the page is reloaded. Works on every page with <guma-header>.
// Collects the "lightbar" evidence for the Evidence Locker
// (js/guma-locker.js).
//
// The stage never blocks the page: it is a click-through layer over the
// viewport, so the page stays fully usable under the flashing.

(function () {
  // ── Config ──────────────────────────────────────────────────────────
  const TOGGLES_REQUIRED = 10;
  const TOGGLE_WINDOW_MS = 5000; // all of them within this window
  // Lamps from the top of each side edge to the bottom.
  const COLORS = ["blue", "red", "white"];
  const SIDES = ["left", "right"];

  // Flash patterns: how long one pattern runs before the next one is drawn.
  const PATTERN_MIN_MS = 1800;
  const PATTERN_MAX_MS = 3200;
  const JITTER = 0.12; // +-12% on every step, so no two cycles match exactly
  const TOGGLE_SELECTOR = "#gumaThemeToggle";

  // Siren: two "whoops" - a slow climb that is cut off and dropped.
  const WHOOP_GAP_S = 0.78; // start-to-start
  const WHOOP_COUNT = 2;
  const WHOOP_LOW_HZ = 520;
  const WHOOP_HIGH_HZ = 1480;
  const WHOOP_RISE_S = 0.5;
  const WHOOP_FALL_S = 0.2;

  let toggles = []; // timestamps of recent toggles
  let active = false; // once lit, stays lit until reload
  let stage = null;
  let lamps = {}; // "left-blue" -> element

  // ── Sound ───────────────────────────────────────────────────────────
  // Synthesised like the burnout screech (js/easter-egg.js), so no audio
  // asset ships with the repo. Unlike a tire, a siren IS a tone: a pair of
  // detuned oscillators, roughened by a soft clipper the way a horn speaker
  // overdrives, then rounded off with a low-pass.
  function playWhoop() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    let ctx;
    try {
      ctx = new Ctx();
    } catch (err) {
      return null;
    }

    const t0 = ctx.currentTime + 0.02;
    const end = t0 + sirenSeconds();

    const master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);

    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 3200;
    tone.Q.value = 0.7;
    tone.connect(master);

    // Soft clipper: tanh curve, the "horn" grit.
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(2.4 * x);
    }
    shaper.curve = curve;
    shaper.connect(tone);

    // Per-whoop loudness: swells with the climb, gone on the drop.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.connect(shaper);

    const oscs = [
      { type: "sawtooth", detune: 0, gain: 0.5 },
      { type: "square", detune: 9, gain: 0.32 },
    ].map((spec) => {
      const osc = ctx.createOscillator();
      osc.type = spec.type;
      osc.detune.value = spec.detune;
      const g = ctx.createGain();
      g.gain.value = spec.gain;
      osc.connect(g);
      g.connect(env);
      return osc;
    });

    for (let i = 0; i < WHOOP_COUNT; i++) {
      const s = t0 + i * WHOOP_GAP_S;
      const top = s + WHOOP_RISE_S;
      const done = top + WHOOP_FALL_S;
      oscs.forEach((osc) => {
        osc.frequency.setValueAtTime(WHOOP_LOW_HZ, s);
        // Exponential = even in pitch, so the climb sounds steady to the ear.
        osc.frequency.exponentialRampToValueAtTime(WHOOP_HIGH_HZ, top);
        osc.frequency.exponentialRampToValueAtTime(WHOOP_LOW_HZ * 1.15, done);
      });
      env.gain.setValueAtTime(0.0001, s);
      env.gain.exponentialRampToValueAtTime(1, s + 0.06);
      env.gain.setValueAtTime(1, top);
      env.gain.exponentialRampToValueAtTime(0.0001, done);
    }

    oscs.forEach((osc) => {
      osc.start(t0);
      osc.stop(end + 0.05);
    });

    return ctx;
  }

  // ── Stage ───────────────────────────────────────────────────────────
  // Mounted hidden on load, like the evidence toast: the Tailwind CDN
  // compiles classes it finds in the DOM, so a stage injected on demand
  // would miss its fade-in.
  function mountStage() {
    if (stage || !document.body) return stage;
    stage = document.createElement("div");
    stage.className = "guma-lightbar";
    stage.setAttribute("aria-hidden", "true");
    SIDES.forEach((side) => {
      COLORS.forEach((color) => {
        const lamp = document.createElement("div");
        lamp.className = `guma-lightbar-lamp is-${side} guma-lightbar-${color}`;
        lamps[`${side}-${color}`] = lamp;
        stage.appendChild(lamp);
      });
    });
    document.body.appendChild(stage);
    return stage;
  }

  // ── Flash patterns ──────────────────────────────────────────────────
  // A pattern is one cycle of steps: [lamps lit, ms]. An empty list is a
  // dark gap. LED lamps snap on and off, so there is no fading in between.
  const L = ["left-blue", "left-red"];
  const R = ["right-blue", "right-red"];
  const BLUE = ["left-blue", "right-blue"];
  const RED = ["left-red", "right-red"];
  const WHITE = ["left-white", "right-white"];
  const CROSS_A = ["left-blue", "right-red"];
  const CROSS_B = ["left-red", "right-blue"];

  // `count` quick flashes of `on`, then a slightly longer gap.
  function burst(on, count, onMs, offMs, gapMs) {
    const steps = [];
    for (let i = 0; i < count; i++) {
      steps.push([on, onMs]);
      steps.push([[], i === count - 1 ? gapMs : offMs]);
    }
    return steps;
  }

  // Every pattern uses the white lamps too, so none leaves them dark.
  const PATTERNS = [
    // Quad flash, side to side, closed by a double white pop.
    () => [...burst(L, 4, 45, 40, 70), ...burst(R, 4, 45, 40, 70), ...burst(WHITE, 2, 40, 40, 80)],
    // Quad flash, crossed: left blue + right red, then the other pair, each
    // followed by a white flick from side to side.
    () => [
      ...burst(CROSS_A, 4, 45, 40, 50),
      ...burst(["left-white"], 1, 45, 0, 30),
      ...burst(["right-white"], 1, 45, 0, 60),
      ...burst(CROSS_B, 4, 45, 40, 50),
      ...burst(["right-white"], 1, 45, 0, 30),
      ...burst(["left-white"], 1, 45, 0, 60),
    ],
    // Double flash per colour, with a white takedown pop.
    () => [...burst(BLUE, 2, 60, 50, 80), ...burst(RED, 2, 60, 50, 80), ...burst(WHITE, 1, 50, 0, 90)],
    // Wig-wag: whole sides swap, chopped by a white strobe.
    () => [
      [[...L, "left-white"], 130],
      [[], 30],
      [WHITE, 40],
      [[], 30],
      [[...R, "right-white"], 130],
      [[], 30],
      [WHITE, 40],
      [[], 30],
    ],
    // Scatter: a fresh random set of lamps every step, white included.
    () => {
      const all = [...L, ...R, ...WHITE];
      const steps = [];
      for (let i = 0; i < 10; i++) {
        const lit = all.filter(() => Math.random() < 0.45);
        steps.push([lit, 55], [[], 25]);
      }
      return steps;
    },
  ];

  // Runs the patterns until reload. Returns nothing: there is no off switch.
  function runPatterns() {
    let lastPattern = -1;
    let steps = [];
    let stepIndex = 0;
    let patternEndsAt = 0;
    let lit = new Set();

    function show(on) {
      const next = new Set(on);
      Object.keys(lamps).forEach((id) => {
        if (next.has(id) !== lit.has(id)) lamps[id].style.opacity = next.has(id) ? "1" : "0";
      });
      lit = next;
    }

    function pickPattern(now) {
      let i;
      do i = Math.floor(Math.random() * PATTERNS.length);
      while (i === lastPattern);
      lastPattern = i;
      patternEndsAt = now + PATTERN_MIN_MS + Math.random() * (PATTERN_MAX_MS - PATTERN_MIN_MS);
      steps = PATTERNS[i]();
      stepIndex = 0;
    }

    function tick() {
      const now = performance.now();
      // Patterns only change at the end of a cycle, like a real controller.
      if (stepIndex >= steps.length) {
        if (now >= patternEndsAt) pickPattern(now);
        else steps = PATTERNS[lastPattern]();
        stepIndex = 0;
      }
      const [on, ms] = steps[stepIndex++];
      show(on);
      setTimeout(tick, ms * (1 - JITTER + Math.random() * JITTER * 2));
    }

    pickPattern(performance.now());
    tick();
  }

  // Reduced motion: no flashing at all - every lamp holds a steady glow.
  function holdSteady() {
    Object.values(lamps).forEach((lamp) => (lamp.style.opacity = "0.6"));
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Seconds of siren, so the toast lands after it and the context can close.
  function sirenSeconds() {
    return WHOOP_GAP_S * (WHOOP_COUNT - 1) + WHOOP_RISE_S + WHOOP_FALL_S;
  }

  function launch() {
    if (active || !mountStage()) return;
    active = true;

    // The siren is sound, not motion, so it plays under reduced motion too.
    if (prefersReducedMotion()) holdSteady();
    else runPatterns();
    // Next frame, so the opacity transition has a start value to leave.
    requestAnimationFrame(() => stage.classList.add("is-on"));

    const audio = playWhoop();
    setTimeout(() => {
      if (audio) {
        try {
          audio.close();
        } catch (err) {
          /* already closed */
        }
      }
      window.GumaLocker?.collect("lightbar");
    }, sirenSeconds() * 1000 + 200);
  }

  // ── Trigger ─────────────────────────────────────────────────────────
  // Delegated, so it does not matter when <guma-header> renders its button.
  function onClick(e) {
    if (!e.target.closest || !e.target.closest(TOGGLE_SELECTOR)) return;
    const now = Date.now();
    toggles = toggles.filter((t) => now - t < TOGGLE_WINDOW_MS);
    toggles.push(now);
    if (active || toggles.length < TOGGLES_REQUIRED) return;
    toggles = [];
    launch();
  }

  document.addEventListener("click", onClick);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountStage, { once: true });
  } else {
    mountStage();
  }
})();
