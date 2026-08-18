// js/character-description.js
// Character Description Generator (in-game FiveM tool).
// Parses FiveM ~code~ text formatting, renders the description over a store
// mannequin photo (assets/mannequin.png) on a canvas, and copies a
// game-ready string.
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

// Swatch order in the picker: 12 colours in a 4-wide grid. ~s~ has no button
// of its own - every colour click already closes its run with it.
const CD_SWATCH_ORDER = ["w", "r", "g", "b", "y", "o", "p", "q", "c", "m", "l", "d"];

// Style buttons. Icons are lucide paths (bold, italic, dot, corner-down-left,
// star). The last three insert plain characters, not ~codes~: a newline
// (copied as ~n~) and the two symbols players use as bullets.
const CD_STYLES = [
  {
    icon: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
    label: "Bold",
    title: "Bold (~h~)",
    open: "~h~",
    close: "~h~",
  },
  {
    icon: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
    label: "Italic",
    title: "Italic (~italic~)",
    open: "~italic~",
    close: "~italic~",
  },
  {
    icon: '<circle cx="12" cy="12" r="2" fill="currentColor"/>',
    label: "Cond.",
    title: "Separator dot (·)",
    open: "·",
    close: "",
  },
  {
    icon: '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    label: "Line",
    title: "New line (copied as ~n~)",
    open: "\n",
    close: "",
  },
  {
    icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    label: "Star",
    title: "Star symbol (★)",
    open: "★",
    close: "",
  },
];

// ── Preview backgrounds ───────────────────────────────────────────
// One list drives both the thumbnail picker and the canvas backdrop. To swap
// a background or add another one: drop the file in /assets and edit this
// array - nothing else in the page knows the file names. Keep the files
// modest (~1400px wide JPG): the picker previews the real image, so every
// entry is downloaded when the page opens.
// `src: null` means "no photo" - the built-in studio gradient is drawn.
const CD_SCENES = [
  { key: "studio", label: "Studio", src: null },
  { key: "day1", label: "Day 1", src: "assets/bg_day1.jpg" },
  { key: "day2", label: "Day 2", src: "assets/bg_day2.jpg" },
  { key: "day3", label: "Day 3", src: "assets/bg_day3.jpg" },
  { key: "night", label: "Night", src: "assets/bg_night.jpg" },
];
const CD_SCENE_DEFAULT = "studio";

// ── Mannequin ─────────────────────────────────────────────────────
// The preview figure is a 3D mesh (assets/mannequin.mesh) rendered by
// js/mannequin-3d.js and blitted into this canvas, so the character can be
// turned. Browsers without usable WebGL fall back to the cut-out photo.
const CD_MESH_SRC = "assets/mannequin.mesh";
const CD_MANNEQUIN_SRC = "assets/mannequin.png";
// Yaw that puts the figure in a three-quarter view facing the camera. The
// mesh comes out of the converter facing +z, away from the camera at yaw 0.
const CD_YAW_HOME = Math.PI + 0.55;
const CD_FIGURE_H = 0.94; // figure height as a fraction of the canvas
const CD_FIGURE_FEET = 0.97; // where the soles sit, as a fraction of the canvas
// Text anchor, as a fraction of the drawn figure box: centred on the belly.
const CD_TEXT_ANCHOR = { x: 0.5, y: 0.47 };
// Near-white studio backdrop. The description is mostly white, the way the
// game draws it, so at this brightness the dark outline stroked around every
// glyph is the only thing holding the text together - see cdDrawText.
const CD_BG_TOP = "#f5f6f8";
const CD_BG_BOTTOM = "#dcdfe6";

const cdImg = new Image();

// ── State ─────────────────────────────────────────────────────────
let cdDrawQueued = false;
let cdExampleIdx = 0;
let cd3d = null; // Mannequin3D once WebGL is up, null on the image fallback
let cdScene = CD_SCENE_DEFAULT;
// key -> the <img> the picker shows. The very same element is what gets
// drawn on the canvas, so a scene is fetched once and never twice.
const cdSceneImgs = new Map();
let cdYaw = CD_YAW_HOME;
let cdDragId = null;
let cdDragLastX = 0;

// Example descriptions are Polish on purpose - that is the language players
// type /opis in. The showcase screenshot still uses American demo data.
const CD_EXAMPLES = [
  "Wysoki mężczyzna po trzydziestce. ~b~Odznaka LSPD~s~ przypięta do paska, służbowy pistolet w kaburze. Wyblakła blizna nad lewą brwią, ~h~tatuaże~h~ na obu przedramionach. Pachnie kawą i olejem do broni.",
  "Drobna kobieta pod trzydziestkę, ~y~włosy rozjaśnione słońcem~s~ związane gumką. Kombinezon mechanika poplamiony olejem, na piersi ~o~naszywka Benny's~s~. Z przyzwyczajenia wyciera dłonie w szmatę.",
  "Barczysty mężczyzna w znoszonej ~y~bandanie Vagos~s~. Tani złoty łańcuch, papieros zatknięty za ucho.\n~italic~Co chwilę ogląda się przez ramię.~italic~",
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
  cdRequestDraw();
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

/**
 * Wraps the textarea selection in open/close codes. With nothing selected
 * both codes go in at the caret and the caret lands between them, so whatever
 * gets typed next is already closed - there is no dangling colour to reset by
 * hand.
 */
function cdWrapSelection(open, close) {
  const el = document.getElementById("cdText");
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const added = open.length + close.length;

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
    cdReplaceRange(el, start, end, open + close);
    el.setSelectionRange(start + open.length, start + open.length);
  } else {
    cdReplaceRange(el, start, end, open + el.value.slice(start, end) + close);
    el.setSelectionRange(start, end + added);
  }
  cdOnInput();
}

/**
 * Builds one formatting button: swatch or icon in front of the label.
 * @param {{cls?:string, title:string, aria:string}} opts
 */
function cdMakeChip(mark, label, opts, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "guma-fmt-btn is-wide";
  btn.title = opts.title;
  btn.setAttribute("aria-label", opts.aria);
  btn.appendChild(mark);
  const text = document.createElement("span");
  text.className = opts.cls || "";
  text.textContent = label;
  btn.appendChild(text);
  btn.addEventListener("click", onClick);
  return btn;
}

/** 14x14 lucide-style icon, matching the SVGs used elsewhere on the page. */
function cdMakeIcon(path) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "flex-none");
  svg.innerHTML = path;
  return svg;
}

/** Builds the colour swatches. Colours live only in CD_COLORS. */
function cdBuildColors() {
  const wrap = document.getElementById("cdColors");
  if (!wrap) return;

  for (const code of CD_SWATCH_ORDER) {
    const c = CD_COLORS[code];
    if (!c) continue;
    const swatch = document.createElement("span");
    swatch.className = "guma-fmt-swatch";
    swatch.style.background = c.hex;
    wrap.appendChild(
      cdMakeChip(swatch, `~${code}~`, { cls: "font-mono", title: `${c.name} (~${code}~)`, aria: c.name }, () =>
        cdWrapSelection(`~${code}~`, "~s~"),
      ),
    );
  }
}

/** Builds the style + symbol buttons. */
function cdBuildStyles() {
  const wrap = document.getElementById("cdStyles");
  if (!wrap) return;

  for (const s of CD_STYLES) {
    wrap.appendChild(
      cdMakeChip(cdMakeIcon(s.icon), s.label, { cls: "uppercase tracking-wide", title: s.title, aria: s.label }, () =>
        cdWrapSelection(s.open, s.close),
      ),
    );
  }
}

function cdLoadExample() {
  document.getElementById("cdText").value = CD_EXAMPLES[cdExampleIdx];
  cdExampleIdx = (cdExampleIdx + 1) % CD_EXAMPLES.length;
  cdOnInput();
}

/** Empties the description. The command prefix is left alone: it is a
 *  per-server setting the player types once. */
function cdClear() {
  const el = document.getElementById("cdText");
  el.value = "";
  el.focus();
  cdOnInput();
}

// ── Background picker ─────────────────────────────────────────────
/** @returns {?object} the scene entry for a key, or null if it is gone. */
function cdSceneByKey(key) {
  return CD_SCENES.find((s) => s.key === key) || null;
}

/** Builds the thumbnail picker. File names live only in CD_SCENES. */
function cdBuildScenes() {
  const wrap = document.getElementById("cdScenes");
  if (!wrap) return;

  for (const scene of CD_SCENES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "guma-cd-thumb";
    btn.dataset.scene = scene.key;
    btn.title = scene.label;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Background: ${scene.label}`);

    if (scene.src) {
      const img = new Image();
      // Both jobs at once: the tile the user clicks and the bitmap the canvas
      // draws. Repaint on load so a slow scene appears as soon as it lands.
      img.addEventListener("load", cdRequestDraw);
      img.className = "guma-cd-thumb-img";
      img.alt = "";
      img.src = scene.src;
      cdSceneImgs.set(scene.key, img);
      btn.appendChild(img);
    } else {
      // Same gradient the canvas paints, so the tile is not a lie.
      const blank = document.createElement("span");
      blank.className = "guma-cd-thumb-img";
      blank.style.background = `linear-gradient(180deg, ${CD_BG_TOP}, ${CD_BG_BOTTOM})`;
      btn.appendChild(blank);
    }

    const label = document.createElement("span");
    label.className = "guma-cd-thumb-label";
    label.textContent = scene.label;
    btn.appendChild(label);

    btn.addEventListener("click", () => cdSetScene(scene.key));
    wrap.appendChild(btn);
  }
}

/** Picks the backdrop. Unknown keys are ignored, so a scene dropped from
 *  CD_SCENES cannot strand the preview on a missing file. */
function cdSetScene(key) {
  if (!cdSceneByKey(key)) return;
  cdScene = key;
  document.querySelectorAll("#cdScenes .guma-cd-thumb").forEach((b) => {
    const on = b.dataset.scene === key;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  cdRequestDraw();
}

// ── Backdrop + mannequin ──────────────────────────────────────────
/** Scales the screenshot to cover the canvas and centres the overflow. */
function cdDrawScenePhoto(ctx, W, H, img) {
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

function cdDrawBackdrop(ctx, W, H) {
  const scene = cdSceneByKey(cdScene);
  const img = scene && scene.src ? cdSceneImgs.get(scene.key) : null;
  // A scene still in flight (or one that failed to load) falls back to the
  // studio gradient rather than a blank frame.
  const photo = !!(img && img.complete && img.naturalWidth);

  if (photo) {
    cdDrawScenePhoto(ctx, W, H, img);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, CD_BG_TOP);
    bg.addColorStop(1, CD_BG_BOTTOM);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Corners pulled down a touch, so the figure sits in a lit spot rather than
  // on a flat sheet of white. Over a screenshot it does double duty: it darkens
  // the busy edges the nameplate has to be read against.
  const vig = ctx.createRadialGradient(W / 2, H * 0.52, H * 0.30, W / 2, H * 0.52, H * 0.95);
  vig.addColorStop(0, photo ? "rgba(0,0,0,0)" : "rgba(70,76,92,0)");
  vig.addColorStop(1, photo ? "rgba(0,0,0,0.42)" : "rgba(70,76,92,0.16)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Contact shadow under the soles, squashed into an ellipse. */
function cdDrawContactShadow(ctx, W, H, radius) {
  ctx.save();
  ctx.translate(W / 2, H * CD_FIGURE_FEET);
  ctx.scale(1, 0.14);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  sg.addColorStop(0, "rgba(0,0,0,0.68)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the mannequin standing on the floor line, centred.
 * @returns {{x:number,y:number}} text anchor at the mannequin's belly
 */
function cdDrawMannequin(ctx, W, H) {
  const top = H * (CD_FIGURE_FEET - CD_FIGURE_H);
  const h = H * CD_FIGURE_H;
  const anchor = { x: W / 2, y: top + h * CD_TEXT_ANCHOR.y };

  if (cd3d && cd3d.ready) {
    cdDrawContactShadow(ctx, W, H, h * 0.17);
    // The 3D canvas matches this one pixel for pixel, so the blit is 1:1.
    if (cd3d.render({ yaw: cdYaw, heightFrac: CD_FIGURE_H, feetFrac: CD_FIGURE_FEET })) {
      ctx.drawImage(cd3d.canvas, 0, 0);
      return anchor;
    }
  }

  if (!cdImg.complete || !cdImg.naturalWidth) return anchor; // fallback still loading
  const w = (cdImg.naturalWidth * h) / cdImg.naturalHeight;
  cdDrawContactShadow(ctx, W, H, w * 0.75);
  ctx.drawImage(cdImg, (W - w) / 2, top, w, h);
  return anchor;
}

// ── Rotation ──────────────────────────────────────────────────────
/** Keeps the yaw inside one turn, so a long drag cannot drift it. */
function cdSetYaw(value) {
  const turn = Math.PI * 2;
  cdYaw = ((value % turn) + turn) % turn;
  cdRequestDraw();
}

function cdResetView() {
  cdSetYaw(CD_YAW_HOME);
}

function cdWirePointer(canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    // One drag at a time, primary button only: a second finger or a
    // right-click would otherwise hijack the gesture and strand the first.
    if (!cd3d || cdDragId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    cdDragId = e.pointerId;
    cdDragLastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== cdDragId) return;
    cdSetYaw(cdYaw + (e.clientX - cdDragLastX) * 0.011);
    cdDragLastX = e.clientX;
  });
  const release = (e) => {
    if (e.pointerId !== cdDragId) return;
    cdDragId = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
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
    : [[{ text: "Type your description on the left...", color: "rgba(255,255,255,0.75)", bold: false, italic: true }]];

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

  // Centred on the belly anchor, shrink-to-fit instead of running off an edge.
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

    // Pass 1: drop shadow plus a dark outline, exactly what carries the
    // mostly white in-game text over a light backdrop. Drawing it as its own
    // pass means a neighbouring word's outline can never land on top of an
    // already-drawn glyph.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = size * 0.4;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    let x = startX;
    for (const piece of line) {
      ctx.font = cdFont(size, piece.seg);
      ctx.fillText(piece.text, x + drop, y + drop);
      x += piece.w;
    }
    ctx.restore();

    ctx.save();
    ctx.lineWidth = Math.max(2, size * 0.17);
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = "rgba(6,8,12,0.98)";
    x = startX;
    for (const piece of line) {
      ctx.font = cdFont(size, piece.seg);
      ctx.strokeText(piece.text, x, y);
      x += piece.w;
    }
    ctx.restore();

    // Pass 2: the coloured text itself, over its own outline.
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

// ── Main draw ─────────────────────────────────────────────────────
function cdDraw() {
  const canvas = document.getElementById("cdCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  cdDrawBackdrop(ctx, W, H);
  const anchor = cdDrawMannequin(ctx, W, H);
  cdDrawText(ctx, W, H, anchor);
}

/** Coalesces any number of same-frame updates into one repaint. */
function cdRequestDraw() {
  if (cdDrawQueued) return;
  cdDrawQueued = true;
  requestAnimationFrame(() => {
    cdDrawQueued = false;
    cdDraw();
  });
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
 * Bumps the shared "Copied N times" counter and refreshes the label. Copying
 * is the only action on this page, so every bump comes through here.
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

// No PNG export here: the preview is a mock-up of the in-game nameplate, not
// a document, so the only output worth taking away is the copied string. The
// canvas is still rendered - it is the thumbnail saved entries are listed
// under, written by cdCopy().

// ── Saved descriptions: serialize / hydrate / wiring ──────────────
function cdSerializeState() {
  return {
    text: document.getElementById("cdText").value,
    prefix: document.getElementById("cdPrefix").value,
    // The backdrop belongs to the shot for the same reason the pose does.
    scene: cdScene,
    // The pose belongs to the shot: without it a reloaded entry cannot
    // reproduce the thumbnail it is listed under. Rounded so two saves of the
    // same pose still dedupe.
    yaw: Math.round(cdYaw * 1000) / 1000,
  };
}

function cdHydrateState(payload) {
  if (!payload) return;
  window.GumaHistoryWiring?.setVal("cdText", payload.text ?? "");
  window.GumaHistoryWiring?.setVal("cdPrefix", payload.prefix ?? "");
  // Older saves carry no scene, and a save may name one that has since been
  // swapped out - both land back on the default rather than on nothing.
  cdSetScene(cdSceneByKey(payload.scene) ? payload.scene : CD_SCENE_DEFAULT);
  // Saves from the flat-image build carry no yaw: leave the current pose.
  if (typeof payload.yaw === "number" && isFinite(payload.yaw)) cdSetYaw(payload.yaw);
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

  cdBuildColors();
  cdBuildStyles();
  cdBuildScenes();
  cdSetScene(cdScene);
  cdWirePointer(canvas);
  cdOnInput();

  // The flat cut-out is loaded either way: it is what shows while the mesh is
  // still in flight, and what stays on browsers with no usable WebGL.
  cdImg.addEventListener("load", cdRequestDraw);
  cdImg.src = CD_MANNEQUIN_SRC;

  cd3d = window.GumaMannequin3D?.create(canvas.width, canvas.height) ?? null;
  if (cd3d) {
    canvas.classList.add("is-rotatable");
    cd3d.load(CD_MESH_SRC).then((ok) => {
      if (!ok) {
        cd3d = null;
        canvas.classList.remove("is-rotatable");
      }
      cdRequestDraw();
    });
  }

  // The text size has a floor tied to the canvas' displayed width, so a
  // resize (or a phone rotating) has to repaint.
  window.addEventListener("resize", cdRequestDraw);
}
