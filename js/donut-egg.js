"use strict";

// Hidden "donut" easter egg: typing "donut" into the command palette
// (<guma-search>, js/components.js) answers with a single result -
// "Donuts Everywhere!" - and a shower of donuts falls over the page.
// Picking that result (Enter or click) closes the palette and drops another
// shower. Works on every page with the palette. Collects the "donut"
// evidence for the Evidence Locker (js/guma-locker.js).
//
// The palette owns the UI; this file only answers onQuery() and runs the
// rain, so the tool index (js/search-index.js) stays free of jokes. Like the
// lightbar, the stage is a click-through layer over the viewport, so the
// page stays fully usable while it rains. Each shower falls to a handful of
// cartoon whistles.

window.GumaDonutEgg = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  // Compared against the whole trimmed query, so "donut shop" stays a
  // normal search.
  const TRIGGERS = ["donut", "donuts", "doughnut", "doughnuts"];
  const DONUT_COUNT = 70;
  const SPAWN_MS = 2600; // donuts keep coming for this long
  const SPAWN_JITTER_MS = 180;
  const FALL_MIN_MS = 2200; // the biggest (nearest) donuts
  const FALL_MAX_MS = 3800; // the smallest (farthest) ones
  const SIZE_MIN_PX = 36;
  const SIZE_MAX_PX = 92;
  const DRIFT_PX = 80; // max sideways drift on the way down
  const SPIN_MAX_DEG = 540;
  const FAR_OPACITY = 0.7; // the smallest donuts fade back a little
  // Roughly gravity: slow off the top edge, fast by the bottom.
  const FALL_EASING = "cubic-bezier(0.4, 0, 0.8, 0.6)";
  const COLLECT_DELAY_MS = 1200; // the toast lands once the shower is going
  // Reduced motion: fewer donuts and no falling - they fade in where they
  // are and fade out again.
  const STILL_COUNT = 24;
  const STILL_MS = 2600;
  const STILL_DELAY_MS = 600;
  // Sound: one falling whistle per this many donuts, spread like them.
  const WHISTLES = 6;
  const WHISTLE_GAIN = 0.1;

  // The palette row. Same shape as a js/search-index.js entry, plus
  // status "egg", which the palette renders as a selectable row without
  // a link.
  const ENTRY = {
    id: "donut",
    title: "Donuts Everywhere!",
    url: null,
    category: "Break Room",
    icon: "assets/donut.svg",
    status: "egg",
    summary: "Code 7 for every unit. The coffee is on us.",
  };

  let stage = null;
  let proto = null; // hidden template donut, cloned for every drop
  let spawningUntil = 0; // performance.now() until the last shower stops adding donuts
  let matched = false; // the last query was a trigger

  const rand = (min, max) => min + Math.random() * (max - min);

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function normalize(query) {
    const n = window.GumaSearch ? window.GumaSearch.normalize(query) : String(query || "").toLowerCase();
    return n.trim();
  }

  // ── Stage ───────────────────────────────────────────────────────────
  // Mounted on load with a hidden template donut, like the lightbar stage:
  // the Tailwind CDN compiles classes it finds in the DOM, so a donut
  // injected on demand would paint unstyled (and full size) for a frame.
  // It also fetches the SVG before the first shower.
  function mountStage() {
    if (stage || !document.body) return stage;
    stage = document.createElement("div");
    stage.className = "guma-donut-rain";
    stage.setAttribute("aria-hidden", "true");
    proto = document.createElement("img");
    proto.src = ENTRY.icon;
    proto.alt = "";
    proto.draggable = false;
    proto.className = "guma-donut hidden";
    stage.appendChild(proto);
    document.body.appendChild(stage);
    return stage;
  }

  function spawn(size) {
    const el = proto.cloneNode(false);
    el.classList.remove("hidden");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    stage.appendChild(el);
    return el;
  }

  // ── Drops ───────────────────────────────────────────────────────────
  // One donut from above the top edge to below the bottom one. Smaller
  // donuts fall slower and a touch fainter, which reads as depth.
  function fall(at) {
    const size = rand(SIZE_MIN_PX, SIZE_MAX_PX);
    const near = (size - SIZE_MIN_PX) / (SIZE_MAX_PX - SIZE_MIN_PX); // 0 far .. 1 near
    const el = spawn(size);
    el.style.opacity = String(FAR_OPACITY + near * (1 - FAR_OPACITY));

    const x = rand(-size / 2, window.innerWidth - size / 2);
    const drift = rand(-DRIFT_PX, DRIFT_PX);
    const spin = rand(0, 360);
    const turn = rand(-SPIN_MAX_DEG, SPIN_MAX_DEG);

    const anim = el.animate(
      [
        { transform: `translate(${x}px, ${-size * 1.2}px) rotate(${spin}deg)` },
        { transform: `translate(${x + drift}px, ${window.innerHeight + size * 0.2}px) rotate(${spin + turn}deg)` },
      ],
      {
        duration: FALL_MAX_MS - near * (FALL_MAX_MS - FALL_MIN_MS),
        delay: at * SPAWN_MS + rand(0, SPAWN_JITTER_MS),
        easing: FALL_EASING,
        fill: "backwards", // parked above the screen while it waits
      },
    );
    anim.onfinish = anim.oncancel = () => el.remove();
  }

  // Reduced motion: a donut fades in and out in place.
  function appear() {
    const size = rand(SIZE_MIN_PX, SIZE_MAX_PX);
    const el = spawn(size);
    const x = rand(0, window.innerWidth - size);
    const y = rand(0, window.innerHeight - size);
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rand(0, 360)}deg)`;

    const anim = el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: STILL_MS,
      delay: rand(0, STILL_DELAY_MS),
      fill: "backwards",
    });
    anim.onfinish = anim.oncancel = () => el.remove();
  }

  // ── Sound ───────────────────────────────────────────────────────────
  // Synthesised on the shared context of js/guma-audio.js, like every egg
  // sound. Falling: a sine gliding down from a high whistle, a little
  // vibrato on it, each one panned somewhere else across the screen. The
  // sound is not motion, so it plays under reduced motion too.
  function buildWhistles(ctx, out, t) {
    const master = ctx.createGain();
    master.gain.value = WHISTLE_GAIN;
    master.connect(out);

    for (let i = 0; i < WHISTLES; i++) {
      const at = t + (i / WHISTLES) * (SPAWN_MS / 1000) + rand(0, 0.15);
      const len = rand(0.9, 1.4);
      const from = rand(1500, 2300);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(from, at);
      osc.frequency.exponentialRampToValueAtTime(from * 0.35, at + len);
      const wobble = ctx.createOscillator();
      wobble.frequency.value = rand(5, 7);
      const wobbleDepth = ctx.createGain();
      wobbleDepth.gain.value = from * 0.012;
      wobble.connect(wobbleDepth);
      wobbleDepth.connect(osc.frequency);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(1, at + 0.08);
      env.gain.setValueAtTime(1, at + len * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, at + len);
      osc.connect(env);

      if (ctx.createStereoPanner) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = rand(-0.6, 0.6);
        env.connect(pan);
        pan.connect(master);
      } else {
        env.connect(master);
      }

      [osc, wobble].forEach((node) => {
        node.start(at);
        node.stop(at + len + 0.02);
      });
    }
  }

  // ── Public API ──────────────────────────────────────────────────────
  /**
   * Drops one shower of donuts. Ignored while the previous one is still
   * adding donuts, so mashing Enter does not stack them up; once it has
   * stopped, a new shower may fall over its tail.
   */
  function rain() {
    const now = performance.now();
    if (now < spawningUntil || !mountStage() || typeof proto.animate !== "function") return;

    const still = prefersReducedMotion();
    spawningUntil = now + (still ? STILL_DELAY_MS : SPAWN_MS + SPAWN_JITTER_MS);
    if (still) {
      for (let i = 0; i < STILL_COUNT; i++) appear();
    } else {
      for (let i = 0; i < DONUT_COUNT; i++) fall(i / DONUT_COUNT);
    }
    window.GumaAudio?.play(buildWhistles);
    setTimeout(() => window.GumaLocker?.collect("donut"), COLLECT_DELAY_MS);
  }

  /**
   * Called by the palette on every render. Starts the rain when the query
   * turns into a trigger (not on every keystroke while it stays one).
   * @param {string} query raw palette input
   * @returns {Object|null} the egg's result row, or null for a normal query
   */
  function onQuery(query) {
    const hit = TRIGGERS.includes(normalize(query));
    if (hit && !matched) rain();
    matched = hit;
    return hit ? ENTRY : null;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountStage, { once: true });
  } else {
    mountStage();
  }

  return { onQuery, rain };
})();
