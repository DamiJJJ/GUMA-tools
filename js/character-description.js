// js/character-description.js
// Character Description Generator (in-game FiveM tool).
// Parses FiveM ~code~ text formatting, renders a rotatable gray 3D mannequin
// preview with scene backgrounds on a canvas, and copies a game-ready string.
// Formatting reference: https://docs.fivem.net/docs/game-references/text-formatting/
"use strict";

// ── FiveM formatting codes ────────────────────────────────────────
// GTA V HUD colour approximations for the standard ~x~ colour codes.
const CD_COLORS = {
  r: { hex: "#e03232", name: "Red" },
  g: { hex: "#72cc72", name: "Green" },
  b: { hex: "#5db6e5", name: "Blue" },
  y: { hex: "#f0c850", name: "Yellow" },
  o: { hex: "#ff8555", name: "Orange" },
  p: { hex: "#8466e2", name: "Purple" },
  q: { hex: "#cb3694", name: "Pink" },
  d: { hex: "#2d6eb9", name: "Dark Blue" },
  c: { hex: "#9a9a9a", name: "Grey" },
  m: { hex: "#646464", name: "Mid Grey" },
  l: { hex: "#1a1a1a", name: "Black" },
  w: { hex: "#f0f0f0", name: "White" },
};
// Codes that map onto another colour in-game.
const CD_COLOR_ALIASES = { t: "c", f: "b" };
const CD_DEFAULT_COLOR = "#f0f0f0";

// ── Preview scenes ────────────────────────────────────────────────
// Each scene owns its backdrop drawing plus the light the mannequin gets.
const CD_SCENES = {
  day: { label: "Day", tint: [1, 1, 1], shadow: 0.28 },
  sunset: { label: "Sunset", tint: [1.08, 0.86, 0.74], shadow: 0.34 },
  night: { label: "Night", tint: [0.62, 0.68, 0.92], shadow: 0.45 },
  interior: { label: "Interior", tint: [0.9, 0.91, 0.96], shadow: 0.38 },
};

// ── 3D mannequin model ────────────────────────────────────────────
// A 1.76 m store mannequin, feet at y = 0, facing -z (toward the camera at
// yaw 0). Every part is a chain of cross sections; the chains are smoothed,
// merged into ONE silhouette and shaded by ONE gradient, so no joint between
// an arm and the torso can ever show as a seam.
//
// Torso spine, top to bottom: [y, lateralHalfWidth, depthHalfWidth, z]. The
// two half widths make each section an ellipse, so the projected outline is
// wide from the front and slim from the side; the z drift bends the spine
// into a natural profile (chest forward, seat back).
const CD_TORSO = [
  [1.545, 0.05, 0.052, -0.004], // neck top, buried in the head
  [1.505, 0.056, 0.058, -0.004], // neck
  [1.475, 0.073, 0.07, -0.004], // neck root
  [1.448, 0.11, 0.086, -0.005], // trapezius
  [1.415, 0.168, 0.098, -0.006], // shoulder slope
  [1.395, 0.2, 0.105, -0.008], // shoulders
  [1.315, 0.184, 0.113, -0.013], // chest
  [1.22, 0.16, 0.105, -0.01], // ribs
  [1.13, 0.144, 0.098, -0.004], // waist
  [1.04, 0.146, 0.105, 0.006], // upper hip
  [0.97, 0.15, 0.109, 0.012], // seat
  [0.9, 0.142, 0.102, 0.01], // pelvis
  [0.85, 0.112, 0.093, 0.004], // crotch taper
];
// Limb chains: [x, y, z, radius], mirrored onto the other side. Arms sit a
// little forward of the chest so they read in front of it from any angle.
const CD_ARM = [
  [0.152, 1.44, -0.02, 0.056], // shoulder cap, buried in the torso
  [0.178, 1.36, -0.022, 0.053], // deltoid
  [0.188, 1.24, -0.024, 0.047], // biceps
  [0.192, 1.12, -0.026, 0.042], // elbow, resting against the ribs
  [0.194, 1.0, -0.024, 0.037], // forearm
  [0.196, 0.9, -0.022, 0.032], // wrist
  [0.199, 0.845, -0.026, 0.038], // hand on the hip
  [0.2, 0.775, -0.03, 0.018], // fingertips
];
// Thigh radius stays under the leg's own x so the two legs never merge:
// what is left between them below the crotch taper is the gap.
const CD_LEG = [
  [0.09, 0.95, 0.004, 0.084], // hip, buried in the pelvis
  [0.092, 0.84, 0, 0.08], // upper thigh
  [0.095, 0.68, -0.002, 0.072], // thigh
  [0.098, 0.53, -0.004, 0.058], // above the knee
  [0.1, 0.48, -0.002, 0.054], // knee
  [0.1, 0.4, 0.006, 0.058], // calf
  [0.099, 0.26, 0.004, 0.045], // shin
  [0.098, 0.14, 0, 0.035], // lower shin
  [0.098, 0.085, 0.008, 0.031], // ankle
];
const CD_FOOT = [
  [0.098, 0.075, 0.042, 0.034], // heel
  [0.101, 0.045, -0.03, 0.043], // mid foot
  [0.103, 0.032, -0.142, 0.026], // toes
];
// Head as its own chain, crown down to chin: an egg that tapers into the
// neck instead of a ball stuck on top of it.
const CD_HEAD = [
  [0, 1.748, -0.012, 0.056], // crown
  [0, 1.71, -0.014, 0.076], // upper skull
  [0, 1.66, -0.014, 0.082], // widest point
  [0, 1.605, -0.012, 0.078], // cheeks
  [0, 1.565, -0.008, 0.068], // jaw
  [0, 1.532, -0.004, 0.048], // chin
];

// Matte-gray plastic: one gradient runs across the whole figure, so parts
// that overlap share the exact same colour and never show an edge.
const CD_BODY_LIGHT = [216, 219, 225];
const CD_BODY_MID = [180, 184, 193];
const CD_BODY_DARK = [126, 131, 144];

// Camera: fixed pitch and distance, only yaw is user-controlled.
const CD_CAM = { dist: 4.0, pitch: 0.14, lookY: 1.02, fovScale: 1.42 };

// ── State ─────────────────────────────────────────────────────────
let cdScene = "day";
let cdYaw = 0.55;
// Spinning by default, unless the OS asks for reduced motion - the rest of
// the app honours that media query too (js/tailwind-config.js).
let cdAuto = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let cdDirty = true;
let cdOnScreen = true;
let cdDragId = null;
let cdLastX = 0;
let cdStars = null;
let cdExampleIdx = 0;

// Example descriptions are Polish on purpose - that is the language players
// type /opis in. The showcase screenshot still uses American demo data.
const CD_EXAMPLES = [
  "Wysoki mężczyzna po trzydziestce. ~b~Odznaka LSPD~s~ przypięta do paska, służbowy pistolet w kaburze. Wyblakła blizna nad lewą brwią, ~h~tatuaże~h~ na obu przedramionach. Pachnie kawą i olejem do broni.",
  "Drobna kobieta pod trzydziestkę, ~y~włosy rozjaśnione słońcem~s~ związane gumką. Kombinezon mechanika poplamiony olejem, na piersi ~o~naszywka Benny's~s~. Z przyzwyczajenia wyciera dłonie w szmatę.",
  "Barczysty mężczyzna w znoszonej ~y~bandanie Vagos~s~. Tani złoty łańcuch, papieros zatknięty za ucho.~n~~italic~Co chwilę ogląda się przez ramię.~italic~",
];

// ── Formatting parser ─────────────────────────────────────────────
/**
 * Parses text with FiveM ~code~ tags into styled lines.
 * @param {string} text raw textarea content (real newlines allowed)
 * @returns {Array<Array<{text:string,color:?string,bold:boolean,italic:boolean}>>}
 */
function cdParse(text) {
  const lines = [[]];
  let color = null;
  let bold = false;
  let italic = false;

  const push = (t) => {
    if (t) lines[lines.length - 1].push({ text: t, color, bold, italic });
  };
  const newline = () => lines.push([]);

  const re = /~([a-zA-Z_]+)~|\n/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    last = re.lastIndex;
    if (m[0] === "\n") {
      newline();
      continue;
    }
    const code = m[1].toLowerCase();
    const colorKey = CD_COLOR_ALIASES[code] || code;
    if (CD_COLORS[colorKey]) {
      color = CD_COLORS[colorKey].hex;
    } else if (code === "s" || code === "w") {
      color = code === "w" ? CD_COLORS.w.hex : null;
    } else if (code === "h" || code === "bold") {
      bold = !bold;
    } else if (code === "italic") {
      italic = !italic;
    } else if (code === "n") {
      newline();
    } else if (code === "u" || code === "v") {
      // Script-variable HUD colours: no fixed value, ignore in the preview.
    } else {
      push(m[0]); // unknown code renders literally, like in-game chat
    }
  }
  push(text.slice(last));
  return lines;
}

// ── Output string ─────────────────────────────────────────────────
/** @returns {string} the game-ready string (prefix + text, newlines as ~n~) */
function cdBuildOutput() {
  const prefix = document.getElementById("cdPrefix").value.trim();
  const raw = document.getElementById("cdText").value.replace(/\r\n?/g, "\n").trim();
  const formatted = raw.replace(/\n/g, "~n~");
  if (!formatted) return "";
  return prefix ? prefix + " " + formatted : formatted;
}

function cdOnInput() {
  const out = cdBuildOutput();
  const box = document.getElementById("cdOutput");
  box.textContent = out || "The formatted command will appear here.";
  box.classList.toggle("is-empty", !out);
  document.getElementById("cdCount").textContent = out.length + " chars";
  cdDirty = true;
}

// ── Toolbar ───────────────────────────────────────────────────────
/**
 * Replaces a range of the textarea while keeping the browser's undo stack.
 * Assigning to .value would wipe it, so Ctrl+Z after a formatting click
 * would throw away everything the user typed before it.
 */
function cdReplaceRange(el, start, end, text) {
  el.focus();
  el.setSelectionRange(start, end);
  let inserted = false;
  try {
    inserted = document.execCommand("insertText", false, text);
  } catch {
    inserted = false;
  }
  if (!inserted) {
    const v = el.value;
    el.value = v.slice(0, start) + text + v.slice(end);
    el.setSelectionRange(start + text.length, start + text.length);
  }
}

/** Wraps the textarea selection in open/close codes (or inserts at the caret). */
function cdWrapSelection(open, close) {
  const el = document.getElementById("cdText");
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const added = open.length + (start === end ? 0 : close.length);

  // The codes count against the same budget as the prose: without this the
  // toolbar could push the value past the cap the textarea enforces on typing.
  const cap = el.maxLength > 0 ? el.maxLength : Infinity;
  if (el.value.length + added > cap) {
    const counter = document.getElementById("cdCount");
    if (counter) {
      counter.textContent = "character limit reached";
      setTimeout(cdOnInput, 1600);
    }
    return;
  }

  if (start === end) {
    cdReplaceRange(el, start, end, open);
  } else {
    cdReplaceRange(el, start, end, open + el.value.slice(start, end) + close);
    el.setSelectionRange(start, end + added);
  }
  cdOnInput();
}

/** Builds the colour swatches + style buttons. Colours live only in CD_COLORS. */
function cdBuildToolbar() {
  const wrap = document.getElementById("cdToolbar");
  if (!wrap) return;

  for (const [code, c] of Object.entries(CD_COLORS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "guma-fmt-btn";
    btn.title = `${c.name} (~${code}~)`;
    btn.setAttribute("aria-label", `Colour ${c.name}`);
    const swatch = document.createElement("span");
    swatch.className = "guma-fmt-swatch";
    swatch.style.background = c.hex;
    btn.appendChild(swatch);
    btn.addEventListener("click", () => cdWrapSelection(`~${code}~`, "~s~"));
    wrap.appendChild(btn);
  }

  const styles = [
    { label: "B", title: "Bold (~h~)", cls: "font-black", open: "~h~", close: "~h~" },
    { label: "I", title: "Italic (~italic~)", cls: "italic", open: "~italic~", close: "~italic~" },
    { label: "~s~", title: "Reset colour (~s~)", cls: "font-mono text-[10px]", open: "~s~", close: "" },
    { label: "~n~", title: "Line break (~n~)", cls: "font-mono text-[10px]", open: "~n~", close: "" },
  ];
  for (const s of styles) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "guma-fmt-btn " + s.cls;
    btn.title = s.title;
    btn.textContent = s.label;
    btn.addEventListener("click", () => cdWrapSelection(s.open, s.close));
    wrap.appendChild(btn);
  }
}

function cdLoadExample() {
  document.getElementById("cdText").value = CD_EXAMPLES[cdExampleIdx];
  cdExampleIdx = (cdExampleIdx + 1) % CD_EXAMPLES.length;
  cdOnInput();
}

// ── Scene backdrops ───────────────────────────────────────────────
function cdStarField() {
  if (!cdStars) {
    // Seeded LCG so the sky is identical every frame and every visit.
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    cdStars = [];
    for (let i = 0; i < 80; i++) {
      cdStars.push({ x: rnd(), y: rnd() * 0.5, r: 0.5 + rnd() * 1.2, a: 0.3 + rnd() * 0.6 });
    }
  }
  return cdStars;
}

// ── Los Santos backdrop props ─────────────────────────────────────
/** Palm tree silhouette rooted at (x, baseY), trunk height h, leaning by lean. */
function cdPalm(ctx, x, baseY, h, lean, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const topX = x + lean * h;
  const topY = baseY - h;
  ctx.lineWidth = Math.max(3, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * h * 0.25, baseY - h * 0.55, topX, topY);
  ctx.stroke();
  // fronds: curved slivers fanned around the crown
  const count = 7;
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI * 0.95 + (Math.PI * 0.9 * i) / (count - 1);
    const len = h * (0.3 + 0.05 * ((i * 37) % 3));
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.sin(ang) * len * 0.55 + len * 0.35;
    const mx = topX + Math.cos(ang) * len * 0.55;
    const my = topY + Math.sin(ang) * len * 0.3 - len * 0.12;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.quadraticCurveTo(mx, my + len * 0.16, topX, topY + h * 0.02);
    ctx.closePath();
    ctx.fill();
  }
}

// Downtown strip above the horizon: [xFrac, wFrac, hFrac]. The centre stays
// low so the skyline never fights with the character. Index 8 is the
// Maze-Bank-style tower and gets a tapered crown.
const CD_SKYLINE = [
  [0.0, 0.055, 0.09], [0.05, 0.045, 0.15], [0.09, 0.06, 0.07],
  [0.15, 0.04, 0.2], [0.19, 0.055, 0.11], [0.25, 0.05, 0.06],
  [0.62, 0.05, 0.08], [0.67, 0.055, 0.16],
  [0.76, 0.065, 0.23],
  [0.83, 0.05, 0.12], [0.88, 0.055, 0.17], [0.94, 0.06, 0.08],
];

function cdSkyline(ctx, W, H, horizon, color, withWindows) {
  for (let i = 0; i < CD_SKYLINE.length; i++) {
    const x = CD_SKYLINE[i][0] * W;
    const w = CD_SKYLINE[i][1] * W;
    const h = CD_SKYLINE[i][2] * H;
    ctx.fillStyle = color;
    if (i === 8) {
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x, horizon - h * 0.85);
      ctx.lineTo(x + w * 0.5, horizon - h);
      ctx.lineTo(x + w, horizon - h * 0.85);
      ctx.lineTo(x + w, horizon);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, horizon - h, w, h);
    }
    if (withWindows) {
      // seeded per building, so the lit windows never flicker between frames
      let seed = 97 + i * 131;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
      ctx.fillStyle = "rgba(242,212,120,0.55)";
      // The tapered tower's crown is narrower than its bounding box, so its
      // windows start below the slope - otherwise they float in the sky.
      const top = i === 8 ? horizon - h * 0.85 + 8 : horizon - h + 8;
      for (let wy = top; wy < horizon - 6; wy += 10) {
        for (let wx = x + 4; wx < x + w - 5; wx += 8) {
          if (rnd() < 0.35) ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }
  }
}

function cdDrawBackdrop(ctx, W, H) {
  const horizon = H * 0.68;

  if (cdScene === "day") {
    // downtown LS around noon: skyline haze + palms on a plaza
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#4f9de0");
    sky.addColorStop(0.7, "#a8d4f5");
    sky.addColorStop(1, "#ddeefb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);
    const sun = ctx.createRadialGradient(W * 0.82, H * 0.14, 10, W * 0.82, H * 0.14, H * 0.3);
    sun.addColorStop(0, "rgba(255,248,220,0.95)");
    sun.addColorStop(0.25, "rgba(255,244,200,0.35)");
    sun.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, horizon);
    cdSkyline(ctx, W, H, horizon, "rgba(122,145,170,0.5)", false);
    cdPalm(ctx, W * 0.07, horizon + H * 0.01, H * 0.3, 0.12, "rgba(40,66,52,0.85)");
    cdPalm(ctx, W * 0.93, horizon + H * 0.01, H * 0.26, -0.1, "rgba(40,66,52,0.85)");
    const ground = ctx.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, "#a8a293");
    ground.addColorStop(1, "#7d7869");
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, W, H - horizon);
  } else if (cdScene === "sunset") {
    // Vespucci Beach: ocean strip, sand, palms against the sun
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#2c2a56");
    sky.addColorStop(0.45, "#8c4a56");
    sky.addColorStop(0.8, "#d4744c");
    sky.addColorStop(1, "#f2a35c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);
    const sunX = W * 0.3;
    const sun = ctx.createRadialGradient(sunX, horizon - H * 0.06, 6, sunX, horizon - H * 0.06, H * 0.22);
    sun.addColorStop(0, "rgba(255,224,170,0.95)");
    sun.addColorStop(0.3, "rgba(255,190,120,0.4)");
    sun.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, horizon);
    // ocean with the sun's reflection
    const seaBottom = H * 0.73;
    const sea = ctx.createLinearGradient(0, horizon, 0, seaBottom);
    sea.addColorStop(0, "#7a4a58");
    sea.addColorStop(1, "#3a3350");
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizon, W, seaBottom - horizon);
    const glint = ctx.createLinearGradient(sunX - W * 0.06, 0, sunX + W * 0.06, 0);
    glint.addColorStop(0, "rgba(255,200,140,0)");
    glint.addColorStop(0.5, "rgba(255,200,140,0.35)");
    glint.addColorStop(1, "rgba(255,200,140,0)");
    ctx.fillStyle = glint;
    ctx.fillRect(sunX - W * 0.06, horizon, W * 0.12, seaBottom - horizon);
    // sand
    const sand = ctx.createLinearGradient(0, seaBottom, 0, H);
    sand.addColorStop(0, "#8f7a62");
    sand.addColorStop(1, "#5f5244");
    ctx.fillStyle = sand;
    ctx.fillRect(0, seaBottom, W, H - seaBottom);
    cdPalm(ctx, W * 0.1, seaBottom + H * 0.02, H * 0.34, 0.16, "rgba(24,17,32,0.95)");
    cdPalm(ctx, W * 0.87, seaBottom + H * 0.01, H * 0.3, -0.14, "rgba(24,17,32,0.95)");
    cdPalm(ctx, W * 0.96, seaBottom + H * 0.03, H * 0.22, -0.08, "rgba(24,17,32,0.9)");
  } else if (cdScene === "night") {
    // downtown at night: lit skyline, stars, moon, asphalt
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#040714");
    sky.addColorStop(1, "#131c3c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);
    for (const s of cdStarField()) {
      ctx.fillStyle = `rgba(235,240,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    const moon = ctx.createRadialGradient(W * 0.18, H * 0.14, 4, W * 0.18, H * 0.14, H * 0.16);
    moon.addColorStop(0, "rgba(232,236,242,0.9)");
    moon.addColorStop(0.12, "rgba(220,228,240,0.55)");
    moon.addColorStop(1, "rgba(220,228,240,0)");
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = "#e8ecf2";
    ctx.beginPath();
    ctx.arc(W * 0.18, H * 0.14, H * 0.035, 0, Math.PI * 2);
    ctx.fill();
    // city glow hugging the rooftops
    const glow = ctx.createLinearGradient(0, horizon - H * 0.26, 0, horizon);
    glow.addColorStop(0, "rgba(96,116,168,0)");
    glow.addColorStop(1, "rgba(96,116,168,0.2)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - H * 0.26, W, H * 0.26);
    cdSkyline(ctx, W, H, horizon, "#0b1122", true);
    const ground = ctx.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, "#181c28");
    ground.addColorStop(1, "#0c0f18");
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, W, H - horizon);
  } else {
    // interior: LS Customs-style garage with a soft overhead light pool
    const wall = ctx.createLinearGradient(0, 0, 0, horizon);
    wall.addColorStop(0, "#414754");
    wall.addColorStop(1, "#2e333d");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, horizon);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((W / 6) * i, 0);
      ctx.lineTo((W / 6) * i, horizon);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, horizon * 0.55);
    ctx.lineTo(W, horizon * 0.55);
    ctx.stroke();
    const floor = ctx.createLinearGradient(0, horizon, 0, H);
    floor.addColorStop(0, "#262a33");
    floor.addColorStop(1, "#1b1e26");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, W, H - horizon);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(W, horizon);
    ctx.stroke();
    const pool = ctx.createRadialGradient(W / 2, H * 0.74, 10, W / 2, H * 0.74, H * 0.4);
    pool.addColorStop(0, "rgba(255,255,255,0.09)");
    pool.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = pool;
    ctx.fillRect(0, 0, W, H);
  }

  // soft vignette keeps the focus on the character in every scene
  const vig = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.35, W / 2, H * 0.5, H * 0.85);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// ── 3D mannequin rendering ────────────────────────────────────────
function cdView(x, y, z, sinY, cosY, sinP, cosP) {
  const rx = x * cosY + z * sinY;
  const rz = -x * sinY + z * cosY;
  const ry = y - CD_CAM.lookY;
  return { x: rx, y: ry * cosP - rz * sinP, z: ry * sinP + rz * cosP };
}

/** rgb() string of a body colour multiplied by the scene tint. */
function cdTint(rgb, tint) {
  const r = Math.min(255, rgb[0] * tint[0]) | 0;
  const g = Math.min(255, rgb[1] * tint[1]) | 0;
  const b = Math.min(255, rgb[2] * tint[2]) | 0;
  return `rgb(${r},${g},${b})`;
}

// ── Smooth silhouette geometry ────────────────────────────────────
/** Catmull-Rom interpolation of one scalar. */
function cdCR(a, b, c, d, t) {
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
}

/** Densely resamples {x, y, r} control points along a Catmull-Rom spline. */
function cdSampleChain(pts, per) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      out.push({
        x: cdCR(p0.x, p1.x, p2.x, p3.x, t),
        y: cdCR(p0.y, p1.y, p2.y, p3.y, t),
        r: Math.max(0.5, cdCR(p0.r, p1.r, p2.r, p3.r, t)),
      });
    }
  }
  out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, r: pts[pts.length - 1].r });
  return out;
}

// Points per rounded end cap of a chain.
const CD_CAP_STEPS = 10;

/**
 * Closed outline polygon of one smoothed chain, with round end caps.
 * Walks the left side down, caps, walks the right side back, caps again.
 * @param {Array<{x:number,y:number,r:number}>} pts control points
 * @returns {Array<[number, number]>}
 */
function cdChainPolygon(pts) {
  const s = cdSampleChain(pts, 7);
  const left = [];
  const right = [];
  let firstN = null;
  let lastN = null;

  for (let i = 0; i < s.length; i++) {
    const prev = s[Math.max(0, i - 1)];
    const next = s[Math.min(s.length - 1, i + 1)];
    const len = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
    // normal = tangent rotated by +90 degrees
    const nx = -(next.y - prev.y) / len;
    const ny = (next.x - prev.x) / len;
    if (i === 0) firstN = Math.atan2(ny, nx);
    if (i === s.length - 1) lastN = Math.atan2(ny, nx);
    left.push([s[i].x + nx * s[i].r, s[i].y + ny * s[i].r]);
    right.push([s[i].x - nx * s[i].r, s[i].y - ny * s[i].r]);
  }

  // Both caps sweep half a turn in the same rotational direction as the
  // walk, which keeps the polygon simple (no self-crossing at the ends).
  const arc = (c, from) => {
    const out = [];
    for (let k = 1; k < CD_CAP_STEPS; k++) {
      const a = from - (Math.PI * k) / CD_CAP_STEPS;
      out.push([c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r]);
    }
    return out;
  };

  const poly = left.slice();
  poly.push(...arc(s[s.length - 1], lastN));
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  poly.push(...arc(s[0], firstN + Math.PI));
  return poly;
}

/**
 * Adds a polygon to a Path2D as its own subpath, normalising the winding
 * first. Canvas fills with the nonzero rule, so two overlapping subpaths
 * wound the opposite way would cancel out and punch a hole in the body.
 * @returns {Path2D} the subpath on its own, for the self-shadow pass
 */
function cdAddPolygon(union, poly) {
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  }
  const pts = area < 0 ? poly.slice().reverse() : poly;
  const sub = new Path2D();
  sub.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) sub.lineTo(pts[i][0], pts[i][1]);
  sub.closePath();
  union.addPath(sub);
  return sub;
}

function cdDrawMannequin(ctx, W, H) {
  const scene = CD_SCENES[cdScene];
  const f = H * CD_CAM.fovScale;
  const cx = W / 2;
  const cy = H * 0.42;
  const sinY = Math.sin(cdYaw);
  const cosY = Math.cos(cdYaw);
  const sinP = Math.sin(CD_CAM.pitch);
  const cosP = Math.cos(CD_CAM.pitch);
  const px = f / CD_CAM.dist; // pixels per metre at the body's depth

  const project = (p) => {
    const zz = p.z + CD_CAM.dist;
    return { x: cx + (p.x * f) / zz, y: cy - (p.y * f) / zz, s: f / zz, zz };
  };

  // ── Ground shadow ──
  const feet = project(cdView(0, 0, 0, sinY, cosY, sinP, cosP));
  ctx.save();
  ctx.translate(feet.x, feet.y);
  ctx.scale(1, 0.24);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.34 * feet.s);
  sg.addColorStop(0, `rgba(0,0,0,${scene.shadow})`);
  sg.addColorStop(0.55, `rgba(0,0,0,${scene.shadow * 0.5})`);
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, 0.34 * feet.s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Geometry: world chains -> screen chains ──
  const chain = (nodes, side) =>
    nodes.map((n) => {
      const p = project(cdView(side * n[0], n[1], n[2], sinY, cosY, sinP, cosP));
      return { x: p.x, y: p.y, r: n[3] * p.s, zz: p.zz };
    });
  // Elliptical cross sections: the visible half width follows the yaw.
  const torso = CD_TORSO.map((n) => {
    const p = project(cdView(0, n[0], n[3], sinY, cosY, sinP, cosP));
    return { x: p.x, y: p.y, r: Math.hypot(n[1] * cosY, n[2] * sinY) * p.s, zz: p.zz };
  });

  const parts = [
    { pts: torso },
    { pts: chain(CD_LEG, 1) },
    { pts: chain(CD_LEG, -1) },
    { pts: chain(CD_FOOT, 1) },
    { pts: chain(CD_FOOT, -1) },
    { pts: chain(CD_HEAD, 1) },
    { pts: chain(CD_ARM, 1) },
    { pts: chain(CD_ARM, -1) },
  ];
  for (const part of parts) {
    part.poly = cdChainPolygon(part.pts);
    part.depth = part.pts.reduce((sum, p) => sum + p.zz, 0) / part.pts.length;
  }

  // Merge every part into ONE silhouette. Filling the union instead of the
  // parts is what removes the seams: an arm crossing the torso adds nothing
  // to the outline it has to blend into.
  const union = new Path2D();
  for (const part of parts) part.path = cdAddPolygon(union, part.poly);

  // ── Shading ──
  const tint = scene.tint;
  const bw = 0.26 * px;
  const grad = ctx.createLinearGradient(cx - bw, 0, cx + bw * 1.3, 0);
  grad.addColorStop(0, cdTint(CD_BODY_LIGHT, tint));
  grad.addColorStop(0.45, cdTint(CD_BODY_MID, tint));
  grad.addColorStop(1, cdTint(CD_BODY_DARK, tint));

  // A dark body drawn first, then covered by the gradient: what survives is
  // the soft halo plus a hairline rim on the antialiased edge, so the figure
  // reads on a bright sky and on night asphalt alike.
  ctx.save();
  ctx.shadowColor = "rgba(10,14,26,0.5)";
  ctx.shadowBlur = Math.max(4, 0.04 * px);
  ctx.fillStyle = "rgb(38,42,54)";
  ctx.fill(union);
  ctx.restore();
  ctx.fillStyle = grad;
  ctx.fill(union);

  // Self-shadowing: each part re-fills itself with the same gradient (so it
  // stays invisible) while casting a blurred shadow on whatever sits behind
  // it. That is what separates an arm from the chest - a soft contact
  // shadow, never an outline. Sorting by true depth keeps the order
  // continuous, so nothing pops as the body turns.
  parts.sort((a, b) => b.depth - a.depth);
  ctx.save();
  ctx.clip(union);
  ctx.shadowColor = "rgba(20,24,38,0.5)";
  ctx.shadowBlur = Math.max(3, 0.028 * px);
  ctx.fillStyle = grad;
  for (const part of parts) ctx.fill(part.path);
  ctx.restore();

  // anchor for the description text: centre of the chest, like in-game /opis
  const chest = project(cdView(0, 1.24, 0, sinY, cosY, sinP, cosP));
  return { x: chest.x, y: chest.y };
}

// ── Description text rendering ────────────────────────────────────
function cdFont(size, seg) {
  return `${seg.italic ? "italic " : ""}${seg.bold ? "700" : "400"} ${size}px "Segoe UI", Arial, sans-serif`;
}

/**
 * Word-wraps parsed lines to maxW, keeping each piece's style.
 *
 * A colour code can land mid-word (`~o~Benny's~s~.`), which splits one word
 * into several styled pieces. Those pieces are grouped into a single word so
 * a line can never break between a word and the punctuation glued to it.
 */
function cdWrapLines(ctx, lines, size, maxW) {
  const out = [];
  for (const line of lines) {
    // Build words: each is a run of pieces with no whitespace between them.
    const words = [];
    let word = null;
    for (const seg of line) {
      ctx.font = cdFont(size, seg);
      for (const part of seg.text.split(/(\s+)/)) {
        if (!part) continue;
        const piece = { text: part, seg, w: ctx.measureText(part).width, space: /^\s+$/.test(part) };
        if (piece.space) {
          words.push({ pieces: [piece], w: piece.w, space: true });
          word = null;
        } else if (word) {
          word.pieces.push(piece);
          word.w += piece.w;
        } else {
          word = { pieces: [piece], w: piece.w, space: false };
          words.push(word);
        }
      }
    }

    let cur = [];
    let curW = 0;
    for (const w of words) {
      if (w.space && cur.length === 0) continue;
      if (!w.space && cur.length && curW + w.w > maxW) {
        out.push(cur);
        cur = [];
        curW = 0;
      }
      cur.push(...w.pieces);
      curW += w.w;
    }
    out.push(cur);
  }
  // drop trailing whitespace-only tails so centering is exact
  return out.map((l) => {
    while (l.length && l[l.length - 1].space) l.pop();
    return l;
  });
}

function cdDrawText(ctx, W, H, anchor) {
  // Parse exactly what gets copied: trimmed, so a stray trailing Enter does
  // not draw a blank line the game would never show.
  const raw = document.getElementById("cdText").value.replace(/\r\n?/g, "\n").trim();
  const lines = raw
    ? cdParse(raw)
    : [[{ text: "Type your description on the left...", color: "rgba(255,255,255,0.6)", bold: false, italic: true }]];

  // Sized like an in-game nameplate: the block sits ON the character rather
  // than spanning the scene, so it stays small and wraps narrow.
  //
  // The canvas is a fixed 1100x700 backing store scaled to the panel by CSS,
  // so on a phone one canvas pixel is a third of a CSS pixel. Without a floor
  // tied to the displayed size the description turns into an unreadable smear
  // exactly where reading it is the whole point.
  const canvas = ctx.canvas;
  const cssScale = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
  const maxW = W * 0.42;
  let size = Math.max(12, Math.round(H * 0.0215), Math.round(11 * cssScale));
  let wrapped = cdWrapLines(ctx, lines, size, maxW);
  let lineH = Math.round(size * 1.28);

  // Centred on the chest anchor, shrink-to-fit instead of running off an edge.
  const room = 2 * Math.min(anchor.y - 12, H - 12 - anchor.y);
  if (wrapped.length * lineH > room && room > 0) {
    const k = Math.max(0.5, room / (wrapped.length * lineH));
    size = Math.max(9, Math.floor(size * k));
    wrapped = cdWrapLines(ctx, lines, size, maxW);
    lineH = Math.round(size * 1.28);
  }

  ctx.textBaseline = "alphabetic";
  // Push the block back inside the frame when it is taller than the shrink
  // floor could fix, so the first lines are never lost above the top edge.
  const blockH = (wrapped.length - 1) * lineH;
  let y = Math.max(size, anchor.y - blockH / 2 + size * 0.34);
  if (y + blockH > H - 6) y = Math.max(size, H - 6 - blockH);
  const drop = Math.max(1, size * 0.08);

  for (const line of wrapped) {
    let total = 0;
    for (const piece of line) {
      ctx.font = cdFont(size, piece.seg);
      piece.w = ctx.measureText(piece.text).width;
      total += piece.w;
    }
    const startX = anchor.x - total / 2;

    // Pass 1: the whole line's drop shadow, so a neighbouring word's shadow
    // can never land on top of an already-drawn glyph.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = size * 0.4;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    let x = startX;
    for (const piece of line) {
      ctx.font = cdFont(size, piece.seg);
      ctx.fillText(piece.text, x + drop, y + drop);
      x += piece.w;
    }
    ctx.restore();

    // Pass 2: the coloured text itself.
    x = startX;
    for (const piece of line) {
      ctx.font = cdFont(size, piece.seg);
      ctx.fillStyle = piece.seg.color || CD_DEFAULT_COLOR;
      ctx.fillText(piece.text, x, y);
      x += piece.w;
    }
    y += lineH;
  }
}

// ── Main draw + loop ──────────────────────────────────────────────
function cdDraw() {
  const canvas = document.getElementById("cdCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  cdDrawBackdrop(ctx, W, H);
  const anchor = cdDrawMannequin(ctx, W, H);
  cdDrawText(ctx, W, H, anchor);
}

/** Keeps the yaw inside one turn, so hours of auto-rotation cannot drift it. */
function cdSetYaw(value) {
  const turn = Math.PI * 2;
  cdYaw = ((value % turn) + turn) % turn;
  cdDirty = true;
}

/**
 * True while the export modal is showing. It snapshots the canvas on open,
 * so letting the mannequin keep turning underneath would hand the user a
 * PNG in a different pose than the one they approved.
 */
function cdExportOpen() {
  const root = document.querySelector("guma-preview-modal [data-pm-root]");
  return !!root && !root.classList.contains("hidden");
}

function cdLoop() {
  // Nothing to animate for a hidden tab, an off-screen canvas (the preview
  // sits below the form on phones) or a frozen export preview.
  const idle = document.hidden || !cdOnScreen || cdExportOpen();
  if (cdAuto && cdDragId === null && !idle) {
    cdSetYaw(cdYaw + 0.006);
  }
  if (cdDirty && !document.hidden) {
    cdDraw();
    cdDirty = false;
  }
  requestAnimationFrame(cdLoop);
}

// ── Scene + rotation controls ─────────────────────────────────────
function cdSetScene(key) {
  if (!CD_SCENES[key]) return;
  cdScene = key;
  document.querySelectorAll("#cdScenes .guma-seg-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.scene === key);
  });
  cdDirty = true;
}

function cdSetAutoRotate(on) {
  cdAuto = on;
  cdDirty = true;
}

function cdWirePointer(canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    // One drag at a time, primary button only: a second finger or a
    // right-click used to hijack the gesture and strand the first pointer.
    if (cdDragId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    cdDragId = e.pointerId;
    cdLastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== cdDragId) return;
    cdSetYaw(cdYaw + (e.clientX - cdLastX) * 0.011);
    cdLastX = e.clientX;
  });
  const release = (e) => {
    if (e.pointerId !== cdDragId) return;
    cdDragId = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
}

// ── Copy for game ─────────────────────────────────────────────────
/** Copies plain text with a legacy fallback for non-secure contexts. */
async function cdCopyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  const tmp = document.createElement("textarea");
  tmp.value = text;
  tmp.setAttribute("readonly", "");
  tmp.style.position = "fixed";
  tmp.style.opacity = "0";
  document.body.appendChild(tmp);
  tmp.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  tmp.remove();
  return ok;
}

/**
 * Bumps the shared "Generated N times" counter and refreshes the label.
 * The modal's own Download button is wired straight to the counter by
 * initDownloadCounter, so only the copy paths come through here.
 */
async function cdCountGenerated() {
  const next = await window.GumaCounters?.trackDownload("chardesc");
  const el = document.getElementById("downloadCount");
  if (el && next !== null && next !== undefined) el.textContent = window.GumaCounters.fmt(next);
}

async function cdCopy() {
  const out = cdBuildOutput();
  if (!out) {
    window.GumaClipboard?.flash(document.getElementById("cdCopyBtn"), "Nothing to copy");
    return;
  }
  const ok = await cdCopyText(out);
  if (!ok) {
    alert("Could not copy to the clipboard in this browser. Select the output text and copy it manually.");
    return;
  }
  window.GumaClipboard?.flash(document.getElementById("cdCopyBtn"), "Copied!");
  await cdCountGenerated();
  await window.GumaHistoryWiring?.save(document.getElementById("cdCanvas"));
}

// ── PNG export (preview modal) ────────────────────────────────────
async function cdDownloadPng() {
  const canvas = document.getElementById("cdCanvas");
  const a = document.createElement("a");
  a.download = "character_description.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  await window.GumaHistoryWiring?.save(canvas);
}

async function cdCopyPng() {
  const canvas = document.getElementById("cdCanvas");
  const ok = await window.GumaClipboard?.copyCanvas(canvas);
  if (ok) {
    window.GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
    await cdCountGenerated();
    await window.GumaHistoryWiring?.save(canvas);
  }
  return ok;
}

window.GumaExport = {
  download: cdDownloadPng,
  copy: cdCopyPng,
  canvas: () => document.getElementById("cdCanvas"),
};

// ── Saved descriptions: serialize / hydrate / wiring ──────────────
function cdSerializeState() {
  return {
    text: document.getElementById("cdText").value,
    prefix: document.getElementById("cdPrefix").value,
    scene: cdScene,
    // The pose is part of the saved shot: without it a reloaded entry cannot
    // reproduce the thumbnail it is listed under. Rounded so an auto-rotating
    // preview does not defeat the dedup of two otherwise identical saves.
    yaw: Math.round(cdYaw * 1000) / 1000,
    auto: cdAuto,
  };
}

function cdHydrateState(payload) {
  if (!payload) return;
  window.GumaHistoryWiring?.setVal("cdText", payload.text ?? "");
  window.GumaHistoryWiring?.setVal("cdPrefix", payload.prefix ?? "");
  cdSetScene(CD_SCENES[payload.scene] ? payload.scene : "day");
  if (typeof payload.yaw === "number" && isFinite(payload.yaw)) cdSetYaw(payload.yaw);
  // Older saves predate the pose fields: leave the toggle alone rather than
  // silently switching the preview to a state the user never chose.
  if (typeof payload.auto === "boolean") {
    cdSetAutoRotate(payload.auto);
    window.GumaHistoryWiring?.setChecked("cdAutoRotate", payload.auto);
  }
  cdOnInput();
}

function cdBuildLabel(payload) {
  const plain = String(payload.text || "")
    .replace(/~[a-zA-Z_]+~/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain ? plain.slice(0, 44) : "Empty description";
}

// Registered at load time, before components.js connects the drawer.
window.GumaHistoryWiring?.register({
  key: "chardesc",
  noun: "description",
  serialize: cdSerializeState,
  hydrate: cdHydrateState,
  buildLabel: cdBuildLabel,
  // no buildFaction - descriptions are not tied to an agency
});

// ── Init ──────────────────────────────────────────────────────────
function cdInit() {
  const canvas = document.getElementById("cdCanvas");

  cdBuildToolbar();
  cdWirePointer(canvas);
  cdSetScene(cdScene);
  // The toggle ships checked; reduced-motion users get it unchecked instead.
  const autoBox = document.getElementById("cdAutoRotate");
  if (autoBox) autoBox.checked = cdAuto;
  cdOnInput();

  // The text size has a floor tied to the canvas' displayed width, so a
  // resize (or a phone rotating) has to repaint.
  window.addEventListener("resize", () => {
    cdDirty = true;
  });
  // Stop animating while the preview is scrolled out of view.
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver((entries) => {
      cdOnScreen = entries.some((e) => e.isIntersecting);
    }).observe(canvas);
  }
  // A tab coming back to the foreground repaints once, since the loop skipped
  // every frame while it was hidden.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) cdDirty = true;
  });

  requestAnimationFrame(cdLoop);
}
