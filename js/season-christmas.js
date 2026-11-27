"use strict";

// Christmas season (SEASONS in js/guma-season.js, 5-27 December):
//
//   snow     falls through the header bar - a canvas behind the nav. Under
//            prefers-reduced-motion it is one still frame.
//   hat      the GUMA shield wears a Santa hat, in the header and in the
//            hero logos (<guma-logo>). It sits inside the shield's group,
//            so it rides along with the logo eggs.
//   present  now and then a present drops into the header and sits on its
//            bottom edge for a while. Catching it (click) unwraps it to a
//            jingle and collects the "christmas-gift" evidence for the
//            Evidence Locker (js/guma-locker.js, which also owns its art).
//            Reduced motion: it fades in and out where it lands.
//
// The document generators are left alone: their output is for serious RP.
// js/guma-season.js loads this file only while the season is on; about.html
// loads it all year, because the locker exhibit plays its jingle - the
// decorations themselves only go up in season (GumaSeason.register).
// Exposes window.GumaChristmas.

window.GumaChristmas = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  const SEASON_ID = "christmas";
  const EVIDENCE_ID = "christmas-gift";
  // Snow, in CSS px. Bigger flakes are nearer: they fall faster and
  // show stronger.
  const FLAKE_EVERY_PX = 26; // one flake per this much bar width
  const FLAKE_R_MIN = 0.7;
  const FLAKE_R_MAX = 2.1;
  const FALL_MIN_PX_S = 9;
  const FALL_MAX_PX_S = 24;
  const SWAY_PX = 6;
  const ALPHA_FAR = 0.45;
  // Flake colour per theme. Picked in JS rather than read from CSS: the
  // Tailwind CDN compiles a class only after it shows up in the DOM, so a
  // colour read right after mounting would still be the inherited one.
  const SNOW_DARK = "rgba(255, 255, 255, 0.85)";
  const SNOW_LIGHT = "rgba(110, 150, 210, 0.75)";
  // Present. Times in ms; [min, max] pairs are random ranges.
  const GIFT_PX = 26;
  const GIFT_EDGE_PX = 8; // kept clear of the header's left / right edge
  const GIFT_FIRST_MS = [12000, 30000];
  const GIFT_EVERY_MS = [45000, 90000];
  const GIFT_FALL_MS = 1100;
  const GIFT_STAY_MS = 8000;
  const GIFT_FADE_MS = 400;
  const GIFT_OPEN_MS = 900; // guma-gift-lid, js/tailwind-config.js
  const GIFT_TRIES = 12; // landing spots tried before a drop is skipped
  // Jingle.
  const JINGLE_GAIN = 0.45;
  const SHAKES = 7;
  const SHAKE_S = 0.055;
  const CHIME_HZ = [1568, 1976, 2349, 3136]; // G6 B6 D7 G7
  const CHIME_STEP_S = 0.085;

  const rand = (min, max) => min + Math.random() * (max - min);
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => !!motion?.matches;

  // ── Snow ────────────────────────────────────────────────────────────
  // Sized to the bar, not the whole header, so an open mobile menu stays
  // clear. The flake colour follows the theme (html.dark).
  function startSnow(header, bar) {
    // Mounted hidden and shown two frames later: the Tailwind CDN compiles
    // .guma-snow only once it is in the DOM, and until then the canvas
    // would sit in the header's flow and push the bar down.
    const canvas = document.createElement("canvas");
    canvas.className = "guma-snow hidden";
    canvas.setAttribute("aria-hidden", "true");
    header.prepend(canvas);
    requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.remove("hidden")));
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let color = "";
    let flakes = [];
    let raf = 0;
    let last = 0;

    function flake(anywhere) {
      const r = rand(FLAKE_R_MIN, FLAKE_R_MAX);
      const near = (r - FLAKE_R_MIN) / (FLAKE_R_MAX - FLAKE_R_MIN);
      return {
        x: rand(0, w),
        y: anywhere ? rand(0, h) : -r,
        r,
        vy: (FALL_MIN_PX_S + near * (FALL_MAX_PX_S - FALL_MIN_PX_S)) * rand(0.8, 1.2),
        phase: rand(0, Math.PI * 2),
        sway: rand(0.9, 2.4), // rad/s
        alpha: ALPHA_FAR + near * (1 - ALPHA_FAR),
      };
    }

    function draw(now) {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      flakes.forEach((f) => {
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x + Math.sin(f.phase + t * f.sway) * SWAY_PX, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function step(now) {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      flakes.forEach((f, i) => {
        f.y += f.vy * dt;
        if (f.y - f.r > h) flakes[i] = flake(false);
      });
      draw(now);
      raf = requestAnimationFrame(step);
    }

    function play() {
      cancelAnimationFrame(raf);
      last = 0;
      if (reducedMotion()) draw(0);
      else raf = requestAnimationFrame(step);
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = header.clientWidth;
      h = bar.offsetHeight;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(w / FLAKE_EVERY_PX);
      flakes = flakes.filter((f) => f.x <= w).slice(0, count);
      while (flakes.length < count) flakes.push(flake(true));
      if (reducedMotion()) draw(0);
    }

    function readColor() {
      color = document.documentElement.classList.contains("dark") ? SNOW_DARK : SNOW_LIGHT;
      if (reducedMotion()) draw(0);
    }

    new ResizeObserver(resize).observe(bar);
    new MutationObserver(readColor).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    motion?.addEventListener?.("change", play);
    resize();
    readColor();
    play();
  }

  // ── Santa hat ───────────────────────────────────────────────────────
  // Drawn in the shield's user space (x 32-224, y 12-246): the brim lies
  // along the shield's top-left edge and the tip flops over to the right,
  // reaching above the viewBox (the logo SVGs are overflow-visible). The
  // fur has a faint outline so it holds up on the light header too.
  const FUR = `fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.18" stroke-width="3"`;
  const HAT = `
    <g class="guma-santa-hat" transform="translate(95 20) rotate(-14)">
      <path fill="#c8102e" d="M-52-8C-48-50-20-88 18-90c32-2 52 16 58 40-10-12-24-12-30-6-8 8-6 26 10 48z"/>
      <path fill="#8f0a1f" d="M30-74c22-4 40 6 46 24-10-12-24-12-30-6-6-8-10-12-16-18z"/>
      <rect x="-60" y="-12" width="124" height="28" rx="14" ${FUR}/>
      <circle cx="78" cy="-46" r="14" ${FUR}/>
    </g>`;

  function putOnHats() {
    document.querySelectorAll("#gumaLogo .guma-logo-symbol, guma-logo .guma-logo-symbol").forEach((symbol) => {
      const art = symbol.firstElementChild; // the translate(-128 -129) group
      if (!art || art.querySelector(".guma-santa-hat")) return;
      art.insertAdjacentHTML("beforeend", HAT);
    });
  }

  // ── Present ─────────────────────────────────────────────────────────
  // One button, mounted hidden with the snow and reused for every drop:
  // the Tailwind CDN compiles classes it finds in the DOM, so a present
  // injected on demand would paint unstyled for a frame.
  let gift = null;
  let giftHeader = null;
  let giftBar = null;
  let giftTimer = 0;
  let giftBusy = false; // falling, waiting or being unwrapped
  let giftOpened = false;

  function mountGift(header, bar) {
    const art = window.GumaLocker?.icon(EVIDENCE_ID);
    if (!art) return;
    giftHeader = header;
    giftBar = bar;
    gift = document.createElement("button");
    gift.type = "button";
    gift.className = "guma-gift hidden";
    gift.setAttribute("aria-label", "Catch the present");
    gift.appendChild(art);
    gift.addEventListener("click", unwrap);
    header.appendChild(gift);
    scheduleGift(GIFT_FIRST_MS);
  }

  function scheduleGift([min, max]) {
    clearTimeout(giftTimer);
    giftTimer = setTimeout(dropGift, rand(min, max));
  }

  // Header x (px) of a landing spot that covers no link or button in the
  // bar, or null when none turned up.
  function landingX(landY) {
    const box = giftHeader.getBoundingClientRect();
    const blockers = Array.from(giftBar.querySelectorAll("a, button, input"))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    const top = box.top + landY;
    for (let i = 0; i < GIFT_TRIES; i++) {
      const x = rand(GIFT_EDGE_PX, box.width - GIFT_PX - GIFT_EDGE_PX);
      const left = box.left + x;
      const clear = blockers.every((r) => left + GIFT_PX <= r.left || left >= r.right || top + GIFT_PX <= r.top || top >= r.bottom);
      if (clear) return x;
    }
    return null;
  }

  /** Drops a present into the header now (also handy from the console). */
  function dropGift() {
    clearTimeout(giftTimer);
    if (!gift || giftBusy) return;
    const menu = giftHeader.querySelector("#gumaMobileMenu");
    const menuOpen = !!menu && !menu.classList.contains("hidden");
    const landY = giftBar.offsetHeight - GIFT_PX - 3;
    const x = document.hidden || menuOpen ? null : landingX(landY);
    if (x === null) {
      scheduleGift(GIFT_EVERY_MS);
      return;
    }

    giftBusy = true;
    giftOpened = false;
    gift.classList.remove("hidden", "is-opened");
    gift.getAnimations().forEach((a) => a.cancel());
    const rest = `translate(${x}px, ${landY}px)`;
    if (reducedMotion()) {
      gift.style.transform = rest;
      gift.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GIFT_FADE_MS });
    } else {
      // Falls in tumbling, lands with a small bounce.
      gift.style.transform = rest;
      gift.animate(
        [
          { transform: `translate(${x}px, ${-GIFT_PX * 1.5}px) rotate(-20deg)`, easing: "cubic-bezier(0.5, 0, 1, 1)" },
          { offset: 0.7, transform: `${rest} rotate(6deg)`, easing: "cubic-bezier(0, 0, 0.4, 1)" },
          { offset: 0.85, transform: `translate(${x}px, ${landY - 7}px) rotate(-3deg)`, easing: "cubic-bezier(0.6, 0, 1, 1)" },
          { transform: `${rest} rotate(0deg)` },
        ],
        { duration: GIFT_FALL_MS },
      );
    }
    giftTimer = setTimeout(hideGift, GIFT_FALL_MS + GIFT_STAY_MS);
  }

  function hideGift() {
    clearTimeout(giftTimer);
    const fade = gift.animate([{ opacity: 1 }, { opacity: 0 }], { duration: GIFT_FADE_MS, fill: "forwards" });
    fade.onfinish = () => {
      gift.classList.add("hidden");
      gift.classList.remove("is-opened");
      gift.getAnimations().forEach((a) => a.cancel());
      giftBusy = false;
      scheduleGift(GIFT_EVERY_MS);
    };
  }

  function unwrap() {
    if (!giftBusy || giftOpened) return;
    giftOpened = true;
    clearTimeout(giftTimer);
    gift.classList.add("is-opened");
    sound();
    window.GumaLocker?.collect(EVIDENCE_ID);
    giftTimer = setTimeout(hideGift, reducedMotion() ? 0 : GIFT_OPEN_MS);
  }

  // ── Sound ───────────────────────────────────────────────────────────
  // A shake of sleigh bells (short, bright, narrow noise bursts), then a
  // rising four-note chime as the lid pops. Each chime note is a sine with
  // two of a bell's inharmonic partials on top.
  function buildJingle(ctx, out, t) {
    const { tone, burst } = window.GumaAudio;
    const master = ctx.createGain();
    master.gain.value = JINGLE_GAIN;
    master.connect(out);

    for (let i = 0; i < SHAKES; i++) {
      const at = t + i * SHAKE_S + Math.random() * 0.012;
      burst(ctx, master, at, { type: "bandpass", freq: rand(7000, 9500), q: 6, peak: 0.4 * (1 - i / (SHAKES + 2)), release: 0.07 });
    }
    CHIME_HZ.forEach((hz, i) => {
      const at = t + 0.08 + i * CHIME_STEP_S;
      tone(ctx, master, at, { from: hz, peak: 0.26, release: 0.9 });
      tone(ctx, master, at, { from: hz * 2.76, peak: 0.07, release: 0.35 });
      tone(ctx, master, at, { from: hz * 5.4, peak: 0.03, release: 0.15 });
    });
  }

  /** @returns {{stop: Function} | null} GumaAudio.play() handle */
  function sound() {
    return window.GumaAudio?.play(buildJingle) || null;
  }

  // ── Init ────────────────────────────────────────────────────────────
  function start() {
    putOnHats();
    const header = document.querySelector("guma-header header");
    const bar = header?.querySelector("#gumaHeaderBar");
    if (!header || !bar) return;
    startSnow(header, bar);
    mountGift(header, bar);
  }

  window.GumaSeason?.register(SEASON_ID, start);

  return { sound, dropGift };
})();
