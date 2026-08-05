"use strict";

// Spinning tire built from assets/tire.svg.
//
// The icon is a 3/4 perspective view, so rotating the whole graphic would make
// it tumble instead of roll. What actually reads as rotation is the tread
// grooves travelling around the circumference, so those are the only thing that
// moves: they are regenerated every frame from the tire's real geometry while
// the sidewall, its highlights and the circumferential rib stay put.
//
// Projection model, traced back from the paths in assets/tire.svg:
//   x = CX_LEFT + WIDTH * s + RX * cos(theta)      (s = axial position, 0..1)
//   y = CY + RY * sin(theta)
//   the tread faces the viewer while cos(theta) <= 0 (the left half)
// so theta = PI/2 is the bottom of the tire, PI the left silhouette and
// 3*PI/2 the top. Increasing theta spins it clockwise on screen.

(function () {
  // ── Geometry (viewBox units, 0 0 64 64) ─────────────────────────────
  const CX_LEFT = 24; // outer tread edge, circle centre
  const CX_RIGHT = 40; // inner tread edge, circle centre
  const CY = 32;
  const RX = 20; // foreshortened horizontal semi-axis
  const RY = 26; // true tire radius

  // 18 grooves around the tire matches the ~0.36 rad spacing of the six drawn
  // in the source asset.
  const GROOVE_COUNT = 18;

  // One groove as a chevron in (axial position, angular offset) space, measured
  // off the original paths. It is rigid in THIS space, not on screen - that is
  // exactly why it deforms correctly as it comes round.
  const CHEVRON = [
    { s: 0.035, d: 0 },
    { s: 0.42, d: -0.21 },
    { s: 0.95, d: -0.02 },
  ];

  const TREAD_BAND =
    "m20 32c0-14.359 8.954-26 20-26h-16c-11.046 0-20 11.641-20 26s8.954 26 20 26h16c-11.046 0-20-11.641-20-26z";

  // Everything except the six groove paths, in the source's own paint order.
  const ART_UNDER = `
    <path d="m40 6c-11.046 0-20 11.641-20 26s8.954 26 20 26 20-11.641 20-26-8.954-26-20-26zm0 42c-5.523 0-10-7.163-10-16s4.477-16 10-16 10 7.163 10 16-4.477 16-10 16z" fill="#6c696f"/>
    <path d="m40 58.5c-11.304 0-20.5-11.888-20.5-26.5s9.196-26.5 20.5-26.5 20.5 11.888 20.5 26.5-9.196 26.5-20.5 26.5zm0-52c-10.752 0-19.5 11.439-19.5 25.5s8.748 25.5 19.5 25.5 19.5-11.439 19.5-25.5-8.748-25.5-19.5-25.5zm0 42c-5.79 0-10.5-7.402-10.5-16.5s4.71-16.5 10.5-16.5 10.5 7.402 10.5 16.5-4.71 16.5-10.5 16.5zm0-32c-5.238 0-9.5 6.953-9.5 15.5s4.262 15.5 9.5 15.5 9.5-6.953 9.5-15.5-4.262-15.5-9.5-15.5z" fill="#212a41"/>
    <path d="m40 51.5c-7.444 0-13.5-8.748-13.5-19.5s6.056-19.5 13.5-19.5 13.5 8.748 13.5 19.5-6.056 19.5-13.5 19.5zm0-38c-6.893 0-12.5 8.299-12.5 18.5s5.607 18.5 12.5 18.5 12.5-8.299 12.5-18.5-5.607-18.5-12.5-18.5z" fill="#212a41"/>
    <path d="m37 47.265c.947.476 1.955.735 3 .735 5.523 0 10-7.163 10-16s-4.477-16-10-16c-1.045 0-2.053.259-3 .735 4.057 2.039 7 8.101 7 15.265s-2.943 13.226-7 15.265z" fill="#4e4b51"/>
    <path d="m40 48.5c-1.099 0-2.184-.265-3.225-.788-.169-.085-.275-.258-.275-.447s.106-.362.275-.447c3.96-1.99 6.725-8.083 6.725-14.818s-2.765-12.828-6.725-14.818c-.169-.085-.275-.258-.275-.447s.106-.362.275-.447c1.041-.523 2.126-.788 3.225-.788 5.79 0 10.5 7.402 10.5 16.5s-4.71 16.5-10.5 16.5zm-1.88-1.309c.618.205 1.247.309 1.88.309 5.238 0 9.5-6.953 9.5-15.5s-4.262-15.5-9.5-15.5c-.633 0-1.262.104-1.88.309 3.852 2.558 6.38 8.487 6.38 15.191s-2.528 12.633-6.38 15.191z" fill="#212a41"/>
    <path d="${TREAD_BAND}" fill="#4e4b51"/>
    <path d="m40 58.5h-16c-11.304 0-20.5-11.888-20.5-26.5s9.196-26.5 20.5-26.5h16c.276 0 .5.224.5.5s-.224.5-.5.5c-10.752 0-19.5 11.439-19.5 25.5s8.748 25.5 19.5 25.5c.276 0 .5.224.5.5s-.224.5-.5.5zm-16-52c-10.752 0-19.5 11.439-19.5 25.5s8.748 25.5 19.5 25.5h10.414c-8.598-3.152-14.914-13.391-14.914-25.5s6.316-22.348 14.914-25.5z" fill="#212a41"/>
    <path d="m31 58.5c-11.304 0-20.5-11.888-20.5-26.5s9.196-26.5 20.5-26.5c.276 0 .5.224.5.5s-.224.5-.5.5c-10.752 0-19.5 11.439-19.5 25.5s8.748 25.5 19.5 25.5c.276 0 .5.224.5.5s-.224.5-.5.5z" fill="#212a41"/>
  `;

  // Sidewall lighting sits on top of the tread and never rotates - it is a
  // highlight, not a feature of the tire.
  const ART_OVER = `
    <path d="m22 32.5c-.276 0-.5-.224-.5-.5 0-13.509 8.299-24.5 18.5-24.5.276 0 .5.224.5.5s-.224.5-.5.5c-9.649 0-17.5 10.542-17.5 23.5 0 .276-.224.5-.5.5z" fill="#8a878d"/>
    <path d="m40 56.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5c9.649 0 17.5-10.542 17.5-23.5 0-.276.224-.5.5-.5s.5.224.5.5c0 13.509-8.299 24.5-18.5 24.5z" fill="#4e4b51"/>
  `;

  // ── Motion tuning ───────────────────────────────────────────────────
  // Grooves pass at GROOVE_COUNT x speed per second. Past roughly 1.2 rev/s a
  // 60 Hz screen samples them below Nyquist and they appear to crawl backwards,
  // so above that the smear has to do the work: blur and fade grow with speed
  // until the tread reads as one moving band instead of strobing teeth.
  const BLUR_FROM = 0.8; // rev/s at which smearing starts
  const BLUR_SCALE = 0.42;
  const BLUR_MAX = 0.95; // stdDeviation, viewBox units
  const FADE_FROM = 1.2;
  const FADE_SCALE = 0.22;
  const FADE_MIN = 0.5;
  const RAMP = 3.2; // how briskly the current speed chases the target

  let seq = 0;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Projects one groove at wheel angle theta into screen space.
  function groovePoints(theta) {
    let points = "";
    for (let i = 0; i < CHEVRON.length; i++) {
      const t = theta + CHEVRON[i].d;
      // Points that have gone round the back are pinned to the silhouette
      // rather than reappearing on the far side; the tread clip finishes the job.
      const cos = Math.min(0, Math.cos(t));
      const x = CX_LEFT + (CX_RIGHT - CX_LEFT) * CHEVRON[i].s + RX * cos;
      const y = CY + RY * Math.sin(t);
      points += `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return points;
  }

  function isBehind(theta) {
    for (let i = 0; i < CHEVRON.length; i++) {
      if (Math.cos(theta + CHEVRON[i].d) <= 0) return false;
    }
    return true;
  }

  /**
   * Builds a tire that can spin.
   * @param {Object} [options]
   * @param {string} [options.className] classes for the root <svg>
   * @param {number} [options.speed] initial speed in revolutions per second
   * @param {number} [options.phase] starting wheel angle in radians
   * @returns {{el: SVGElement, setSpeed: Function, destroy: Function}}
   */
  function create(options) {
    const opts = options || {};
    const id = `gumaTire${++seq}`;
    const clipId = `${id}Clip`;
    const blurId = `${id}Blur`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (opts.className) svg.setAttribute("class", opts.className);

    let grooves = "";
    for (let i = 0; i < GROOVE_COUNT; i++) grooves += '<polyline points="" />';

    svg.innerHTML = `
      <defs>
        <clipPath id="${clipId}"><path d="${TREAD_BAND}"/></clipPath>
        <filter id="${blurId}" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="0"/>
        </filter>
      </defs>
      ${ART_UNDER}
      <g clip-path="url(#${clipId})" filter="url(#${blurId})"
         fill="none" stroke="#212a41" stroke-width="1"
         stroke-linecap="round" stroke-linejoin="round">${grooves}</g>
      ${ART_OVER}
    `;

    const lines = svg.querySelectorAll("polyline");
    const blur = svg.querySelector("feGaussianBlur");
    const treadGroup = lines.length ? lines[0].parentNode : null;

    let theta = typeof opts.phase === "number" ? opts.phase : 0;
    let speed = 0;
    let target = typeof opts.speed === "number" ? opts.speed : 0;
    let lastFrame = 0;
    let lastBlur = -1;
    let lastFade = -1;
    let raf = 0;
    const still = prefersReducedMotion();

    function draw() {
      const step = (Math.PI * 2) / GROOVE_COUNT;
      for (let i = 0; i < GROOVE_COUNT; i++) {
        const angle = theta + i * step;
        const line = lines[i];
        if (isBehind(angle)) {
          line.setAttribute("display", "none");
        } else {
          line.removeAttribute("display");
          line.setAttribute("points", groovePoints(angle));
        }
      }
    }

    function applySmear() {
      const blurValue = Math.min(BLUR_MAX, Math.max(0, (speed - BLUR_FROM) * BLUR_SCALE));
      if (Math.abs(blurValue - lastBlur) > 0.02) {
        blur.setAttribute("stdDeviation", blurValue.toFixed(2));
        lastBlur = blurValue;
      }
      const fade = Math.min(1, Math.max(FADE_MIN, 1 - (speed - FADE_FROM) * FADE_SCALE));
      if (treadGroup && Math.abs(fade - lastFade) > 0.02) {
        treadGroup.setAttribute("opacity", fade.toFixed(2));
        lastFade = fade;
      }
    }

    function frame(now) {
      const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
      lastFrame = now;

      speed += (target - speed) * Math.min(1, dt * RAMP);
      theta = (theta + speed * dt * Math.PI * 2) % (Math.PI * 2);

      draw();
      applySmear();
      raf = requestAnimationFrame(frame);
    }

    draw();
    applySmear();
    if (!still) raf = requestAnimationFrame(frame);

    return {
      el: svg,
      /** @param {number} rps target speed, revolutions per second */
      setSpeed(rps) {
        target = rps;
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
    };
  }

  window.GumaTireSpin = { create };
})();
