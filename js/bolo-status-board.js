"use strict";

// ── BOLO Status Board ────────────────────────────────────────────────────────
// The roll call slide: agency seal + name (and an optional division patch) on
// top, a red "BE ON THE LOOKOUT STATUS FOR <date>" headline, then a row of
// subject cards - mugshot, optional red tag above it, Name / Surname / SSN /
// DOB / What For under it - and a quote to close the briefing.
//
// The number of subjects is picked in the form (1 - BB_MAX). Up to
// BB_PER_ROW cards sit on one row; more wrap onto a second, balanced row. A
// subject in custody keeps its card but gets a red line struck across it.
//
// Each subject owns a cropper from a fixed pool (all attached to the board
// canvas once), so removing a subject from the middle never shuffles photos
// between cards.

let FACTION_KEY;
let faction;

let bbLogoURL = null; // custom agency only
let bbPatchURL = null; // optional division patch, right of the agency name

/** @type {{crop: Object, url: string|null, el: HTMLElement}[]} */
let bbSubjects = [];

const BB_MAX = 14;
const BB_PER_ROW = 7;

// One cropper per possible subject; a free one is handed to each new subject.
const bbCropPool = Array.from({ length: BB_MAX }, () => GumaPhotoCrop.create());
const bbZoom = GumaCanvasZoom.create();

// ── Sheet geometry ───────────────────────────────────────────────────────────
const BB_W = 1920;
const BB_MIN_H = 1080; // a 16:9 slide, however few subjects there are
const BB_M = 90; // side margin
const BB_CARD_GAP = 30;
const BB_CARD_MAX_W = 300; // a short row gets bigger cards, up to this
const BB_PHOTO_RATIO = 1.32; // mugshot height / width
const BB_LOGO = 190; // seal / patch box
const BB_ROW_GAP = 56;

// ── Inks ─────────────────────────────────────────────────────────────────────
// The board is a printed slide, not UI: it looks the same in both themes.
const BB_FONT = "Arial, Helvetica, sans-serif";
const BB_FONT_HEAVY = "'Arial Black', 'Arial Bold', Arial, sans-serif";
const BB_INK = "#111111";
const BB_MUTED = "#5d6371";
const BB_PAPER = "#ffffff";
const BB_RED = "#e3121b";
const BB_PLACEHOLDER_BG = "#d7dae0";
const BB_PLACEHOLDER_FG = "#b3b8c2";

const BB_TAGS = ["ARMED AND DANGEROUS", "DO NOT APPROACH", "FLIGHT RISK", "GANG AFFILIATED", "ESCAPED INMATE", "PAROLE VIOLATION"];
const BB_DEFAULT_HEADLINE = "BE ON THE LOOKOUT STATUS FOR";

// ── Input caps ───────────────────────────────────────────────────────────────
const BB_MAXLEN = {
  "#bbCustomAgency": 48,
  "#bbHeadline": 40,
  "#bbQuoteAuthor": 40,
  ".bb-first": 20,
  ".bb-last": 20,
  ".bb-ssn": 11,
  ".bb-reason": 40,
  ".bb-tag-custom": 24,
};

// ── Small helpers ────────────────────────────────────────────────────────────
const bbVal = (id) => (document.getElementById(id)?.value ?? "").trim();
const bbCanvas = () => document.getElementById("boardCanvas");

function bbFont(px, weight, family) {
  return (weight ? weight + " " : "") + px + "px " + (family || BB_FONT);
}

/** "2026-10-14" -> "10/14/2026" (or "10/14/26" with `short`) */
function bbFmtDate(iso, short) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return "";
  return `${m[2]}/${m[3]}/${short ? m[1].slice(2) : m[1]}`;
}

function bbTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Image scaled to fit inside the box, centred. */
function bbDrawContain(ctx, img, x, y, w, h) {
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Logos are drawn from decoded images; one still loading repaints the board
// once it lands.
const bbImgCache = {};
function bbImage(src) {
  if (!src) return null;
  let img = bbImgCache[src];
  if (!img) {
    img = new Image();
    img.onload = () => bbRender();
    img.src = src;
    bbImgCache[src] = img;
  }
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * Agency name split the way the seal header prints it: the place name big,
 * the agency kind under it ("LOS SANTOS" / "POLICE DEPARTMENT",
 * "BLAINE COUNTY" / "SHERIFF'S OFFICE"). "County" belongs to the place.
 */
function bbSplitAgency(name) {
  const m = /^(.*?)\s+(police department|sheriff's department|sheriff's office|highway patrol|of corrections and rehabilitation|fire department|police|sheriff|department|patrol)$/i.exec(
    (name || "").trim(),
  );
  return m ? { top: m[1].toUpperCase(), bottom: m[2].toUpperCase() } : { top: (name || "").toUpperCase(), bottom: "" };
}

/**
 * One line when the text fits at no less than ~80% of the base size,
 * otherwise wrapped (GumaFit.fitBlock). Avoids a one-word orphan line where
 * a slightly smaller font would have kept the text whole.
 */
function bbFitLines(ctx, text, maxW, maxLines, basePx, minPx, fontFn) {
  const px = GumaFit.fitFont(ctx, text, maxW, basePx, Math.round(basePx * 0.8), fontFn);
  if (ctx.measureText(text).width <= maxW) return { px, lines: [text] };
  return GumaFit.fitBlock(ctx, text, maxW, maxLines, basePx, minPx, fontFn);
}

/** Mugshot backdrop with height lines and a silhouette, for a card without a photo. */
function bbDrawPlaceholder(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = BB_PLACEHOLDER_BG;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = BB_PLACEHOLDER_FG;
  ctx.lineWidth = 2;
  for (let ly = y + h * 0.12; ly < y + h; ly += h * 0.12) {
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w * 0.14, ly);
    ctx.moveTo(x + w * 0.86, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.fillStyle = BB_PLACEHOLDER_FG;
  const cx = x + w / 2;
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.42, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 1.02, w * 0.44, h * 0.36, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = BB_MUTED;
  ctx.textAlign = "center";
  ctx.font = bbFont(Math.round(w * 0.065), "bold");
  ctx.fillText("NO PHOTO", cx, y + h * 0.15);
  ctx.restore();
}

// ── Form snapshot ────────────────────────────────────────────────────────────
/** One subject's printed values, read from its form block. */
function bbSubjectData(s) {
  const q = (cls) => (s.el.querySelector(cls)?.value ?? "").trim();
  const tagSel = q(".bb-tag");
  return {
    s,
    first: q(".bb-first"),
    last: q(".bb-last"),
    ssn: q(".bb-ssn"),
    dob: bbFmtDate(q(".bb-dob")),
    reason: q(".bb-reason"),
    tag: (tagSel === "__custom__" ? q(".bb-tag-custom") : tagSel).toUpperCase(),
    custody: !!s.el.querySelector(".bb-custody")?.checked,
  };
}

function bbData() {
  const isCustom = FACTION_KEY === "custom";
  const headline = (bbVal("bbHeadline") || BB_DEFAULT_HEADLINE).toUpperCase();
  const date = bbFmtDate(bbVal("bbDate"), true);
  return {
    agency: bbSplitAgency(faction.name),
    seal: bbImage(isCustom ? bbLogoURL : faction.icon),
    patch: bbImage(bbPatchURL),
    title: date ? `${headline} ${date}` : headline,
    subjects: bbSubjects.map(bbSubjectData),
    quote: bbVal("bbQuote"),
    quoteAuthor: bbVal("bbQuoteAuthor"),
  };
}

// ── Render ───────────────────────────────────────────────────────────────────
let bbRaf = 0;
function bbSchedule() {
  if (bbRaf) return;
  bbRaf = requestAnimationFrame(() => {
    bbRaf = 0;
    bbRender();
  });
}

/** Rows of subjects: one row up to BB_PER_ROW, then balanced rows. */
function bbRows(n) {
  if (!n) return [];
  const rows = Math.ceil(n / BB_PER_ROW);
  const cols = Math.ceil(n / rows);
  const out = [];
  for (let i = 0; i < n; i += cols) out.push(Math.min(cols, n - i));
  return out;
}

function bbRender() {
  const canvas = bbCanvas();
  if (!canvas || !faction) return;
  const ctx = canvas.getContext("2d");
  const d = bbData();

  // ── Measure ──
  const rows = bbRows(d.subjects.length);
  const cols = Math.max(1, ...rows);
  const cw = Math.min(BB_CARD_MAX_W, Math.floor((BB_W - 2 * BB_M - (cols - 1) * BB_CARD_GAP) / cols));
  const ph = Math.round(cw * BB_PHOTO_RATIO);
  const fpx = Math.max(17, Math.min(25, Math.round(cw * 0.085)));
  const lh = Math.round(fpx * 1.42);
  const tagH = Math.round(fpx * 1.5);
  const cardH = tagH + ph + 14 + 5 * lh + lh; // + one spare line for a wrapped "What For"

  const headTop = 50;
  const headH = BB_LOGO;
  const titleY = headTop + headH + 110;
  const rowsTop = titleY + 90;
  const rowsH = rows.length ? rows.length * cardH + (rows.length - 1) * BB_ROW_GAP : 0;

  const quote = d.quote ? bbFitLines(ctx, `"${d.quote.replace(/^"+|"+$/g, "")}"`, BB_W - 2 * BB_M - 80, 3, 42, 26, (p) => bbFont(p, "bold")) : null;
  const quoteLines = quote ? quote.lines : [];
  const quoteLH = quote ? Math.round(quote.px * 1.3) : 0;
  const quoteH = quoteLines.length ? quoteLines.length * quoteLH + (d.quoteAuthor ? 64 : 0) : 0;

  const need = rowsTop + rowsH + (quoteH ? 80 + quoteH : 0) + 70;
  canvas.width = BB_W;
  canvas.height = Math.max(BB_MIN_H, need);
  const H = canvas.height;
  // A short board spends its spare height around the cards, not under the quote.
  const spare = H - need;

  ctx.fillStyle = BB_PAPER;
  ctx.fillRect(0, 0, BB_W, H);

  bbDrawHeader(ctx, d, headTop);

  // ── Title ──
  ctx.textAlign = "center";
  ctx.fillStyle = BB_RED;
  GumaFit.fitFont(ctx, d.title, BB_W - 2 * BB_M, 62, 34, (p) => bbFont(p, "", BB_FONT_HEAVY));
  ctx.fillText(d.title, BB_W / 2, titleY + spare * 0.25);

  // ── Subject cards ──
  // Croppers of subjects no longer on the board must stop catching drags.
  bbCropPool.forEach((c) => {
    if (!bbSubjects.some((s) => s.crop === c)) c.paint(ctx, null);
  });
  let y = rowsTop + spare * 0.5;
  let i = 0;
  rows.forEach((count) => {
    const rowW = count * cw + (count - 1) * BB_CARD_GAP;
    let x = (BB_W - rowW) / 2;
    for (let k = 0; k < count; k++, i++) {
      bbDrawCard(ctx, d.subjects[i], x, y, cw, ph, fpx, lh, tagH);
      x += cw + BB_CARD_GAP;
    }
    y += cardH + BB_ROW_GAP;
  });

  // ── Quote ──
  if (quoteLines.length) {
    let qy = H - 70 - quoteH;
    ctx.fillStyle = BB_INK;
    ctx.textAlign = "center";
    ctx.font = bbFont(quote.px, "bold");
    quoteLines.forEach((ln) => {
      ctx.fillText(ln, BB_W / 2, qy + quote.px);
      qy += quoteLH;
    });
    if (d.quoteAuthor) {
      ctx.textAlign = "right";
      ctx.font = bbFont(34, "bold");
      ctx.fillText("- " + d.quoteAuthor, BB_W - BB_M - 60, qy + 46);
    }
  }

  bbZoom.refresh();
}

/** Seal, agency name in two weights and the optional patch, centred as a group. */
function bbDrawHeader(ctx, d, top) {
  const a = d.agency;
  const topPx = GumaFit.fitFont(ctx, a.top, 900, 92, 44, (p) => bbFont(p, "", BB_FONT_HEAVY));
  const topW = ctx.measureText(a.top).width;
  const botPx = a.bottom ? GumaFit.fitFont(ctx, a.bottom, Math.max(topW, 420), 50, 26, (p) => bbFont(p, "bold")) : 0;
  const botW = a.bottom ? ctx.measureText(a.bottom).width : 0;
  const textW = Math.max(topW, botW);
  const gap = 34;

  const groupW = (d.seal ? BB_LOGO + gap : 0) + textW + (d.patch ? gap + BB_LOGO : 0);
  let x = (BB_W - groupW) / 2;
  if (d.seal) {
    bbDrawContain(ctx, d.seal, x, top, BB_LOGO, BB_LOGO);
    x += BB_LOGO + gap;
  }

  // Text block centred on the logo line: cap height ~0.72 em
  const blockH = topPx * 0.72 + (a.bottom ? 18 + botPx * 0.72 : 0);
  const ty = top + BB_LOGO / 2 - blockH / 2 + topPx * 0.72;
  ctx.fillStyle = BB_INK;
  ctx.textAlign = "left";
  ctx.font = bbFont(topPx, "", BB_FONT_HEAVY);
  ctx.fillText(a.top, x + (textW - topW) / 2, ty);
  if (a.bottom) {
    ctx.font = bbFont(botPx, "bold");
    ctx.fillText(a.bottom, x + (textW - botW) / 2, ty + 18 + botPx * 0.72);
  }
  x += textW + gap;
  if (d.patch) bbDrawContain(ctx, d.patch, x, top, BB_LOGO, BB_LOGO);
}

/** Tag, mugshot and the five info lines of one subject. */
function bbDrawCard(ctx, sd, x, y, cw, ph, fpx, lh, tagH) {
  // Tag above the photo, red caps, shrunk to the card width
  if (sd.tag) {
    ctx.fillStyle = BB_RED;
    ctx.textAlign = "center";
    GumaFit.fitFont(ctx, sd.tag, cw + BB_CARD_GAP - 6, fpx, 10, (p) => bbFont(p, "bold"));
    ctx.fillText(sd.tag, x + cw / 2, y + tagH - 8);
  }

  const py = y + tagH;
  if (!sd.s.crop.paint(ctx, { x, y: py, w: cw, h: ph })) bbDrawPlaceholder(ctx, x, py, cw, ph);

  // Info lines: bold label + value, each shrunk to the card width
  const lines = [
    ["Name:", sd.first],
    ["Surname:", sd.last],
    ["SSN:", sd.ssn],
    ["DOB:", sd.dob],
  ];
  let ly = py + ph + 14 + fpx;
  ctx.fillStyle = BB_INK;
  ctx.textAlign = "left";
  lines.forEach(([label, value]) => {
    const text = value ? `${label} ${value}` : label;
    GumaFit.fitFont(ctx, text, cw, fpx, 11, (p) => bbFont(p, "bold"));
    ctx.fillText(text, x, ly);
    ly += lh;
  });
  // "What For" is the one free-text line; it may take two lines
  const reason = "WHAT FOR:" + (sd.reason ? " " + sd.reason.toUpperCase() : "");
  const fb = bbFitLines(ctx, reason, cw, 2, fpx, 12, (p) => bbFont(p, "bold"));
  ctx.font = bbFont(fb.px, "bold");
  fb.lines.forEach((ln, i) => ctx.fillText(ln, x, ly + i * lh));

  // In custody: one red stroke across the card, corner to corner of the photo
  if (sd.custody) {
    ctx.save();
    ctx.strokeStyle = BB_RED;
    ctx.lineWidth = Math.max(5, Math.round(cw * 0.025));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 4, py + 4);
    ctx.lineTo(x + cw - 4, py + ph - 4);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Faction ──────────────────────────────────────────────────────────────────
function switchFaction(key) {
  const isCustom = key === "custom";
  FACTION_KEY = key;
  document.getElementById("customFactionPanel").style.display = isCustom ? "block" : "none";
  document.querySelectorAll("#factionSwitcher .faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === key);
  });
  if (isCustom) applyCustomFaction();
  else faction = FACTIONS[key];
  bbRender();
}

function applyCustomFaction() {
  const name = bbVal("bbCustomAgency") || "Custom Agency";
  faction = { name, short: name, icon: null };
}

// ── Subjects ─────────────────────────────────────────────────────────────────
const BB_SUBJECT_HTML = `
  <div class="mb-3 flex items-center justify-between gap-3">
    <p class="bb-subject-title text-[11px] font-bold uppercase tracking-[0.16em] text-guma-l-gold dark:text-guma-gold"></p>
    <button type="button" class="bb-remove guma-link-remove !mt-0" aria-label="Remove subject">✕ Remove</button>
  </div>
  <div class="flex gap-3">
    <div class="w-[92px] shrink-0">
      <div class="bb-drop guma-drop h-[120px] !px-1 !py-1 overflow-hidden" role="button" tabindex="0" aria-label="Upload mugshot">
        <input type="file" accept="image/*" class="bb-input hidden" />
        <span class="bb-drop-text text-[11px] leading-4">Mugshot</span>
        <img class="bb-preview hidden h-full w-full rounded object-cover" alt="mugshot preview" />
      </div>
      <button type="button" class="bb-photo-clear guma-link-remove hidden">✕ Photo</button>
    </div>
    <div class="grid min-w-0 flex-1 grid-cols-2 gap-2">
      <div>
        <label class="guma-label">Name</label>
        <input class="guma-input bb-first" type="text" placeholder="Mateo" />
      </div>
      <div>
        <label class="guma-label">Surname</label>
        <input class="guma-input bb-last" type="text" placeholder="Cruz" />
      </div>
      <div>
        <label class="guma-label">SSN</label>
        <input class="guma-input bb-ssn" type="text" placeholder="431474370" />
      </div>
      <div>
        <label class="guma-label">DOB</label>
        <input class="guma-input bb-dob" type="date" />
      </div>
    </div>
  </div>
  <div class="mt-2">
    <label class="guma-label">What For</label>
    <input class="guma-input bb-reason" type="text" placeholder="Report #672" />
  </div>
  <div class="mt-2 grid grid-cols-2 items-end gap-2">
    <div>
      <label class="guma-label">Tag</label>
      <select class="guma-select bb-tag"></select>
      <input class="guma-input bb-tag-custom mt-2 hidden" type="text" placeholder="Custom tag" />
    </div>
    <label class="flex h-10 cursor-pointer select-none items-center gap-2.5">
      <input type="checkbox" class="bb-custody" />
      <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-red-500 dark:text-red-400">In Custody</span>
    </label>
  </div>
`;

/**
 * Append one subject block to the form.
 * @param {Object} [v] saved values: first, last, ssn, dob, reason, tag, tagCustom, custody, photo, crop
 * @param {{render?: boolean}} [opts]
 */
function bbAddSubject(v = {}, opts = {}) {
  if (bbSubjects.length >= BB_MAX) return;
  const crop = bbCropPool.find((c) => !bbSubjects.some((s) => s.crop === c));
  const el = document.createElement("div");
  el.className = "bb-subject rounded-xl border p-3 border-guma-l-border-2 dark:border-guma-border-2";
  el.innerHTML = BB_SUBJECT_HTML;

  const tagSel = el.querySelector(".bb-tag");
  [["", "None"], ...BB_TAGS.map((t) => [t, t]), ["__custom__", "Custom…"]].forEach(([value, text]) => {
    const o = document.createElement("option");
    o.value = value;
    o.text = text;
    tagSel.appendChild(o);
  });

  const set = (cls, val) => {
    const input = el.querySelector(cls);
    if (input && val != null) input.value = val;
  };
  set(".bb-first", v.first);
  set(".bb-last", v.last);
  set(".bb-ssn", v.ssn);
  set(".bb-dob", v.dob);
  set(".bb-reason", v.reason);
  set(".bb-tag", v.tag ?? "");
  set(".bb-tag-custom", v.tagCustom);
  el.querySelector(".bb-custody").checked = !!v.custody;

  const s = { crop, url: null, el };
  bbSubjects.push(s);
  document.getElementById("bbSubjectRows").appendChild(el);

  // Unique ids so GumaUpload can wire the dropzone
  const uid = "bbSubj" + Math.random().toString(36).slice(2, 9);
  el.querySelector(".bb-drop").id = uid + "Drop";
  el.querySelector(".bb-input").id = uid + "Input";
  window.GumaUpload.init({
    zone: uid + "Drop",
    input: uid + "Input",
    onLoad: (dataURL) => {
      bbSetSubjectPhoto(s, dataURL);
      bbRender();
    },
  });
  el.querySelector(".bb-photo-clear").addEventListener("click", () => {
    bbSetSubjectPhoto(s, null);
    bbRender();
  });
  el.querySelector(".bb-remove").addEventListener("click", () => bbRemoveSubject(s));

  GumaFit.applyCapsBySelector(el, BB_MAXLEN);
  bbSetSubjectPhoto(s, v.photo || null, v.crop);
  bbSyncSubjects();
  if (opts.render !== false) bbRender();
}

function bbRemoveSubject(s) {
  if (bbSubjects.length <= 1) return;
  bbSetSubjectPhoto(s, null);
  s.el.remove();
  bbSubjects = bbSubjects.filter((x) => x !== s);
  bbSyncSubjects();
  bbRender();
}

/** Grow or shrink the list to `n` subjects (the count stepper). */
function bbSetCount(n) {
  const target = Math.max(1, Math.min(BB_MAX, n | 0));
  while (bbSubjects.length < target) bbAddSubject({}, { render: false });
  while (bbSubjects.length > target) bbRemoveSubject(bbSubjects[bbSubjects.length - 1]);
  bbSyncSubjects();
  bbRender();
}

function bbStepCount(delta) {
  bbSetCount(bbSubjects.length + delta);
}

function bbSetSubjectPhoto(s, url, crop) {
  s.url = url;
  s.crop.setSource(url, crop);
  const prev = s.el.querySelector(".bb-preview");
  if (url) prev.src = url;
  else prev.removeAttribute("src");
  prev.classList.toggle("hidden", !url);
  s.el.querySelector(".bb-drop-text").classList.toggle("hidden", !!url);
  s.el.querySelector(".bb-photo-clear").classList.toggle("hidden", !url);
}

/** Numbering, count display, stepper limits and custom tag inputs. */
function bbSyncSubjects() {
  const n = bbSubjects.length;
  bbSubjects.forEach((s, i) => {
    s.el.querySelector(".bb-subject-title").textContent = `Subject ${i + 1}`;
    s.el.querySelector(".bb-remove").classList.toggle("hidden", n <= 1);
    s.el.querySelector(".bb-tag-custom").classList.toggle("hidden", s.el.querySelector(".bb-tag").value !== "__custom__");
  });
  document.getElementById("bbCount").textContent = String(n);
  const dec = document.getElementById("bbCountDec");
  const inc = document.getElementById("bbCountInc");
  dec.disabled = n <= 1;
  inc.disabled = n >= BB_MAX;
  dec.classList.toggle("opacity-40", dec.disabled);
  inc.classList.toggle("opacity-40", inc.disabled);
}

// ── Images ───────────────────────────────────────────────────────────────────
const BB_IMAGES = {
  logo: { text: "bbLogoText", preview: "bbLogoPreview", clear: "bbLogoClear", idle: "Click to upload logo" },
  patch: { text: "bbPatchText", preview: "bbPatchPreview", clear: "bbPatchClear", idle: "Click to upload patch" },
};

/** Point the logo or patch slot at a data URL (or null), keeping its dropzone in step. */
function bbSetImage(kind, url) {
  if (kind === "logo") {
    if (bbLogoURL) delete bbImgCache[bbLogoURL];
    bbLogoURL = url;
  } else {
    if (bbPatchURL) delete bbImgCache[bbPatchURL];
    bbPatchURL = url;
  }
  const ui = BB_IMAGES[kind];
  const prev = document.getElementById(ui.preview);
  if (url) prev.src = url;
  else prev.removeAttribute("src");
  prev.classList.toggle("hidden", !url);
  document.getElementById(ui.text).textContent = url ? "Click to change image" : ui.idle;
  document.getElementById(ui.clear).classList.toggle("hidden", !url);
}

function bbClearImage(kind) {
  bbSetImage(kind, null);
  bbRender();
}

// ── Random quote ─────────────────────────────────────────────────────────────
/** Fill the quote and author from ROLL_CALL_QUOTES, never repeating the current one. */
function bbRandomQuote() {
  if (typeof ROLL_CALL_QUOTES === "undefined" || !ROLL_CALL_QUOTES.length) return;
  const current = bbVal("bbQuote");
  const pool = ROLL_CALL_QUOTES.filter((q) => q.text !== current);
  const pick = pool[Math.floor(Math.random() * pool.length)] || ROLL_CALL_QUOTES[0];
  document.getElementById("bbQuote").value = pick.text;
  document.getElementById("bbQuoteAuthor").value = pick.author;
  bbRender();
}

// ── Export ───────────────────────────────────────────────────────────────────
function bbFileName() {
  const date = bbVal("bbDate") || bbTodayIso();
  return `bolo_status_${date}.png`;
}

async function bbDownload() {
  const canvas = bbCanvas();
  const a = document.createElement("a");
  a.download = bbFileName();
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function bbCopy() {
  const canvas = bbCanvas();
  if (!(await GumaClipboard.copyCanvas(canvas))) return;
  const newCount = await window.GumaCounters?.trackDownload("bolo");
  const countEl = document.getElementById("downloadCount");
  if (newCount != null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
  // The button lives in the export preview modal.
  GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
}

// ── Saved boards: serialize / hydrate / wiring ───────────────────────────────
/** Board-level controls (subject blocks carry no ids and are saved apart). */
function bbFormControls() {
  return [...document.querySelectorAll("#bbForm input[id], #bbForm select[id], #bbForm textarea[id]")].filter((el) => el.type !== "file");
}

async function bbSerializeState() {
  const fields = {};
  bbFormControls().forEach((el) => {
    fields[el.id] = el.type === "checkbox" ? el.checked : el.value;
  });
  // Up to BB_MAX photos per entry: small JPEGs, framing stored alongside
  // (same reasoning as js/wanted-poster.js).
  const down = (url, w, h, format) => (url ? GumaHistory._downscaleAvatar(url, w, h, "contain", format) : null);
  const subjects = await Promise.all(
    bbSubjects.map(async (s) => {
      const q = (cls) => s.el.querySelector(cls)?.value ?? "";
      return {
        first: q(".bb-first"),
        last: q(".bb-last"),
        ssn: q(".bb-ssn"),
        dob: q(".bb-dob"),
        reason: q(".bb-reason"),
        tag: q(".bb-tag"),
        tagCustom: q(".bb-tag-custom"),
        custody: !!s.el.querySelector(".bb-custody")?.checked,
        photo: await down(s.url, 240, Math.round(240 * BB_PHOTO_RATIO), "jpeg"),
        crop: s.crop.getState(),
      };
    }),
  );
  return {
    FACTION_KEY,
    fields,
    subjects,
    logoDataUrl: FACTION_KEY === "custom" ? await down(bbLogoURL, 256, 256) : null,
    patchDataUrl: await down(bbPatchURL, 256, 256),
  };
}

function bbHydrateState(p) {
  if (!p) return;
  const fk = p.FACTION_KEY === "custom" || FACTIONS[p.FACTION_KEY] ? p.FACTION_KEY : "lspd";
  const f = p.fields || {};

  GumaHistoryWiring.setVal("bbCustomAgency", f.bbCustomAgency);
  switchFaction(fk);
  bbFormControls().forEach((el) => {
    if (!(el.id in f)) return;
    if (el.type === "checkbox") el.checked = !!f[el.id];
    else GumaHistoryWiring.setVal(el.id, f[el.id]);
  });
  if (fk === "custom") applyCustomFaction();

  // Rebuild the subject list from scratch
  bbSubjects.forEach((s) => {
    bbSetSubjectPhoto(s, null);
    s.el.remove();
  });
  bbSubjects = [];
  const saved = (p.subjects || []).slice(0, BB_MAX);
  (saved.length ? saved : [{}]).forEach((v) => bbAddSubject(v, { render: false }));

  bbSetImage("logo", fk === "custom" ? p.logoDataUrl || null : null);
  bbSetImage("patch", p.patchDataUrl || null);
  bbSyncSubjects();
  bbRender();
}

function bbBuildLabel(p) {
  const date = bbFmtDate(p.fields?.bbDate || "") || "Undated";
  const n = (p.subjects || []).length;
  return `BOLO ${date} - ${n} subject${n === 1 ? "" : "s"}`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
function initBoloBoard({ defaultFaction = "lspd" } = {}) {
  const urlFaction = new URLSearchParams(window.location.search).get("faction");
  FACTION_KEY = urlFaction && FACTIONS[urlFaction]?.type === FACTION_TYPE.POLICE ? urlFaction : defaultFaction;
  faction = FACTIONS[FACTION_KEY];

  buildFactionSwitcher(switchFaction, FACTION_KEY, FACTION_TYPE.POLICE);
  document.getElementById("bbDate").value = bbTodayIso();
  GumaFit.applyCapsBySelector(document, BB_MAXLEN);

  const host = document.querySelector(".guma-pc-wrap");
  const canvas = bbCanvas();
  // Up to 14 slots side by side: one tool bar at a time, over the hovered photo.
  bbCropPool.forEach((c) => c.attach({ canvas, host, redraw: bbRender, toolsOnHover: true }));
  bbZoom.attach({ canvas, wrap: host, control: document.getElementById("bbZoom") });

  for (let i = 0; i < 3; i++) bbAddSubject({}, { render: false });

  [
    ["logo", "bbLogoDrop", "bbLogoInput"],
    ["patch", "bbPatchDrop", "bbPatchInput"],
  ].forEach(([kind, zone, input]) => {
    window.GumaUpload.init({
      zone,
      input,
      onLoad: (dataURL) => {
        bbSetImage(kind, dataURL);
        bbRender();
      },
    });
  });

  const form = document.getElementById("bbForm");
  form.addEventListener("input", (e) => {
    if (e.target.id === "bbCustomAgency" && FACTION_KEY === "custom") applyCustomFaction();
    bbSchedule();
  });
  form.addEventListener("change", () => {
    bbSyncSubjects();
    bbSchedule();
  });

  bbRender();

  // The preview modal delegates export here so counters and history keep firing.
  window.GumaExport = {
    download: bbDownload,
    copy: bbCopy,
    canvas: bbCanvas,
  };

  GumaHistoryWiring.register({
    key: "bolo",
    noun: "board",
    serialize: bbSerializeState,
    hydrate: bbHydrateState,
    buildLabel: bbBuildLabel,
    buildFaction: (p) =>
      GumaHistoryWiring.buildFaction(p, {
        customShort: (pp) => (pp.fields?.bbCustomAgency || "").trim(),
      }),
  });
}
