"use strict";

// Side-view tire for the burnout easter egg (about.html), drawn in code.
//
// Seen square-on, so turning the wheel group is a true roll. Brand touches:
// gold GUMA • TOOLS lettering on the sidewall, a five-spoke alloy that reads
// as the star from the logo, and a navy hub cap carrying the gold star.
//
// The renderer is passive: the scene owns the clock and calls draw(angle, rps)
// every frame. Past roughly 1 rev/s the lugs, spokes and lettering would strobe
// on a 60 Hz screen, so they cross-fade into blurred rings as speed grows -
// what a camera would show for a wheel spinning that fast.

(function () {
  // ── Geometry (viewBox -100 -100 200 200, tire radius 100) ───────────
  const LUG_COUNT = 30;
  const SPOKE_COUNT = 5;
  const LETTER_R = 66; // baseline radius of the sidewall lettering
  const LETTERING = "GUMA • TOOLS • GUMA • TOOLS • ";

  // ── Speed smear ─────────────────────────────────────────────────────
  const SMEAR_FROM = 0.7; // rev/s where the cross-fade starts
  const SMEAR_FULL = 2; // rev/s where it is complete

  const C = {
    rubber: "#18181f",
    lug: "#121218",
    sidewall: "#22222b",
    sidewallLine: "#30303b",
    gold: "#f0c040",
    rimLip: "#d9dce6",
    rimShade: "#8d93a6",
    rimWell: "#0b0c14",
    navy: "#04045e",
  };

  let seq = 0;

  // Five-point star path centred on 0,0 (outer radius r, inner r * 0.42).
  function starPath(r) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.42 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? "L" : "M"}${(rad * Math.cos(a)).toFixed(2)} ${(rad * Math.sin(a)).toFixed(2)} `;
    }
    return d + "Z";
  }

  function lugs() {
    let out = "";
    for (let i = 0; i < LUG_COUNT; i++) {
      const a = (360 / LUG_COUNT) * i;
      out += `<rect x="-5" y="-100" width="10" height="9" rx="1.5" transform="rotate(${a})"/>`;
    }
    return out;
  }

  // Each spoke tapers from the hub to the rim, so together they form a star.
  function spokes() {
    let out = "";
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const a = (360 / SPOKE_COUNT) * i;
      out += `<path d="M-7 -14 L-12 -54 L12 -54 L7 -14 Z" transform="rotate(${a})"/>`;
    }
    return out;
  }

  function lugNuts() {
    let out = "";
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / SPOKE_COUNT + Math.PI / SPOKE_COUNT;
      out += `<circle cx="${(19 * Math.cos(a)).toFixed(2)}" cy="${(19 * Math.sin(a)).toFixed(2)}" r="2.6"/>`;
    }
    return out;
  }

  /**
   * Builds a tire. Call draw() to pose it.
   * @param {Object} [options]
   * @param {string} [options.className] classes for the root <svg>
   * @returns {{el: SVGElement, draw: Function}}
   */
  function create(options) {
    const opts = options || {};
    const id = `gumaTire${++seq}`;
    const circumference = 2 * Math.PI * LETTER_R;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-100 -100 200 200");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (opts.className) svg.setAttribute("class", opts.className);

    svg.innerHTML = `
      <defs>
        <path id="${id}Arc" d="M ${-LETTER_R} 0 A ${LETTER_R} ${LETTER_R} 0 1 1 ${LETTER_R} 0 A ${LETTER_R} ${LETTER_R} 0 1 1 ${-LETTER_R} 0"/>
        <radialGradient id="${id}Rim" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stop-color="${C.rimShade}"/>
          <stop offset="100%" stop-color="${C.rimLip}"/>
        </radialGradient>
        <linearGradient id="${id}Spoke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${C.rimLip}"/>
          <stop offset="100%" stop-color="${C.rimShade}"/>
        </linearGradient>
      </defs>
      <g data-wheel>
        <g data-lugs fill="${C.lug}">${lugs()}</g>
        <circle r="94" fill="${C.rubber}"/>
        <circle r="84" fill="${C.sidewall}"/>
        <circle r="84" fill="none" stroke="${C.sidewallLine}" stroke-width="1.2"/>
        <circle r="62" fill="none" stroke="${C.sidewallLine}" stroke-width="1.2"/>
        <text data-letters fill="${C.gold}" font-family="Segoe UI, Arial, sans-serif" font-weight="900"
              font-size="13" textLength="${(circumference - 6).toFixed(1)}" lengthAdjust="spacing">
          <textPath href="#${id}Arc">${LETTERING}</textPath>
        </text>
        <circle r="58" fill="url(#${id}Rim)"/>
        <circle r="52" fill="${C.rimWell}"/>
        <g data-spokes fill="url(#${id}Spoke)">${spokes()}</g>
        <circle r="17" fill="${C.navy}" stroke="${C.rimLip}" stroke-width="2"/>
        <g fill="${C.rimShade}">${lugNuts()}</g>
        <path d="${starPath(9)}" fill="${C.gold}"/>
      </g>
      <g data-smear fill="none">
        <circle data-smear-lugs r="96" stroke="${C.lug}" stroke-width="8" opacity="0"/>
        <circle data-smear-letters r="70" stroke="${C.gold}" stroke-width="9" opacity="0"/>
        <circle data-smear-spokes r="35" stroke="${C.rimShade}" stroke-width="34" opacity="0"/>
      </g>
      <path d="M -74 -40 A 84 84 0 0 1 -30 -78" fill="none" stroke="#ffffff" stroke-width="3"
            stroke-linecap="round" opacity="0.14"/>
    `;

    const wheel = svg.querySelector("[data-wheel]");
    const parts = {
      lugs: svg.querySelector("[data-lugs]"),
      letters: svg.querySelector("[data-letters]"),
      spokes: svg.querySelector("[data-spokes]"),
      smearLugs: svg.querySelector("[data-smear-lugs]"),
      smearLetters: svg.querySelector("[data-smear-letters]"),
      smearSpokes: svg.querySelector("[data-smear-spokes]"),
    };
    let lastSmear = -1;

    function applySmear(rps) {
      const k = Math.min(1, Math.max(0, (Math.abs(rps) - SMEAR_FROM) / (SMEAR_FULL - SMEAR_FROM)));
      if (Math.abs(k - lastSmear) < 0.02) return;
      lastSmear = k;
      parts.lugs.setAttribute("opacity", (1 - 0.8 * k).toFixed(2));
      parts.letters.setAttribute("opacity", (1 - 0.85 * k).toFixed(2));
      parts.spokes.setAttribute("opacity", (1 - 0.65 * k).toFixed(2));
      parts.smearLugs.setAttribute("opacity", (0.85 * k).toFixed(2));
      parts.smearLetters.setAttribute("opacity", (0.45 * k).toFixed(2));
      parts.smearSpokes.setAttribute("opacity", (0.55 * k).toFixed(2));
    }

    function draw(angleRad, rps) {
      wheel.setAttribute("transform", `rotate(${((angleRad * 180) / Math.PI).toFixed(2)})`);
      applySmear(rps || 0);
    }

    draw(0, 0);
    return { el: svg, draw };
  }

  window.GumaTireSpin = { create };
})();
