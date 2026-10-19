"use strict";

// ── Wanted Poster Generator ──────────────────────────────────────────────────
// One poster, two looks. "Modern Bulletin" is an agency band, a coloured status
// banner and a photo next to a descriptor grid; "Classic Flyer" is the paper
// community alert (red headline, MO paragraph, DATE / TIME / LOCATION table).
// Both read the same snapshot of the form, wpData(), so switching layouts never
// loses anything.
//
// Every section is optional: an empty field takes its section off the poster
// and the rest moves up, so a poster with a photo and a name still looks
// finished. The sheet hugs its content - text is never shrunk to unreadable
// or cut - but is never shorter than it is wide; a poster that short spends
// the spare height on its gaps.
//
// Layout code builds each section as { h, draw(y) }: the height is measured
// first, the canvas is sized from the sum, then everything is drawn top-down.

let FACTION_KEY;
let faction;

let wpType = "wanted";
let wpLayout = "modern";
let wpPhotoURL = null;
let wpPhoto2URL = null;
let wpLogoURL = null; // custom agency only

// One cropper per photo slot; both share the poster canvas.
const wpCrop = GumaPhotoCrop.create();
const wpCrop2 = GumaPhotoCrop.create();

// ── Sheet geometry ───────────────────────────────────────────────────────────
const WP_W = 1400;
const WP_MIN_H = WP_W; // never landscape, however little is filled in
const WP_M = 60; // page margin
const WP_GAP = 36; // between sections
const WP_GAP_EXTRA_MAX = 28; // a short poster may open each gap by this much
const WP_PHOTO_W = 470; // modern mugshot slot, 4:5
const WP_PHOTO_H = 588;
const WP_PHOTO2_W = 520; // additional photo, 4:3
const WP_FLYER_PHOTO_W = 460;
const WP_MAX_CHARGES = 6;

// ── Inks ─────────────────────────────────────────────────────────────────────
// The poster is a printed document, not UI: it looks the same in both themes.
const WP_FONT = "Arial, Helvetica, sans-serif";
const WP_FONT_IMPACT = "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif";
const WP_FONT_FLYER = "Calibri, Carlito, Arial, sans-serif";
const WP_INK = "#15171c";
const WP_MUTED = "#5d6371";
const WP_RULE = "#cfd2d8";
const WP_PAPER = "#f5f5f2";
const WP_NAVY = "#0e1a33";
const WP_NAVY_2 = "#1d3060";
const WP_BAND_SOFT = "#a9b8d8";
const WP_BAND_GOLD = "#e3c46a";
const WP_CAUTION = "#f5c219";
const WP_STAMP = "#c8102e";
const WP_FLYER_RED = "#c00000";
const WP_FLYER_BLUE = "#1f3fbf";
const WP_PLACEHOLDER_BG = "#d7dae0";
const WP_PLACEHOLDER_FG = "#b3b8c2";

const WP_HAS_LS = typeof CanvasRenderingContext2D !== "undefined" && "letterSpacing" in CanvasRenderingContext2D.prototype;

// ── Bulletin types ───────────────────────────────────────────────────────────
// `text` is the type colour darkened where needed so it still reads as text on
// white paper (amber does not).
const WP_TYPES = {
  wanted: {
    headlines: ["WANTED", "MOST WANTED", "FUGITIVE"],
    subjectTitle: "Suspect",
    subtitleLabel: "Wanted For",
    subtitlePlaceholder: "Armed Robbery",
    subtitlePrefix: "for",
    color: "#c1121f",
    onColor: "#ffffff",
    text: "#c1121f",
    caution: "Armed and dangerous - do not approach",
    unknownName: "Unknown Suspect",
    detailsTitle: "Details",
    flyerDetails: "MO:",
    flyerDescription: "SUSPECT DESCRIPTION:",
    contactAbout: "about this crime",
    stamp: "APPREHENDED",
    cta: "If you see this person, do not approach - call 911",
    charges: true,
  },
  poi: {
    headlines: ["PERSON OF INTEREST", "BE ON THE LOOKOUT", "SEEKING TO IDENTIFY", "BOLO"],
    subjectTitle: "Person of Interest",
    subtitleLabel: "In Connection With",
    subtitlePlaceholder: "A Homicide in Del Perro",
    subtitlePrefix: "in connection with",
    color: "#e5a00d",
    onColor: "#1c1300",
    text: "#a86f00",
    caution: "Use caution - may be armed",
    unknownName: "Unidentified Person",
    detailsTitle: "Details",
    flyerDetails: "DETAILS:",
    flyerDescription: "DESCRIPTION:",
    contactAbout: "about this person",
    stamp: "IDENTIFIED",
    cta: "If you recognize this person, please call 911",
    charges: true,
  },
  missing: {
    headlines: ["MISSING PERSON", "MISSING", "ENDANGERED MISSING", "MISSING CHILD"],
    subjectTitle: "Missing Person",
    subtitleLabel: "Subtitle",
    subtitlePlaceholder: "Since October 12, 2026",
    subtitlePrefix: "",
    color: "#1d4fbf",
    onColor: "#ffffff",
    text: "#1d4fbf",
    caution: "Endangered - may need medical attention",
    unknownName: "Name Unknown",
    detailsTitle: "Circumstances",
    flyerDetails: "CIRCUMSTANCES:",
    flyerDescription: "DESCRIPTION:",
    contactAbout: "about this person's whereabouts",
    stamp: "LOCATED",
    cta: "If you have seen this person, please call 911",
    charges: false,
  },
};

// ── Input caps ───────────────────────────────────────────────────────────────
// Every printed value already shrinks or wraps to its box; the caps keep a
// value inside what that box can carry at a readable size.
const WP_MAXLEN = {
  "#wpCustomAgency": 48,
  "#wpHeadlineCustom": 24,
  "#wpSubtitle": 48,
  "#wpDivisionCustom": 48,
  "#wpBulletinNo": 16,
  "#wpCaseNo": 18,
  "#wpName": 40,
  "#wpAka": 40,
  "#wpAge": 9,
  "#wpHeight": 10,
  "#wpWeight": 7,
  "#wpMarks": 90,
  "#wpWeapon": 60,
  "#wpCautionText": 48,
  ".wp-charge-code": 14,
  ".wp-charge-desc": 60,
  "#wpWarrant": 20,
  "#wpBail": 16,
  "#wpLocation": 80,
  "#wpClothing": 80,
  "#wpVehicle": 70,
  "#wpPhoto2Caption": 90,
  "#wpReward": 14,
  "#wpContactName": 40,
  "#wpContactPhone": 20,
  "#wpTipLine": 48,
};

// ── Small helpers ────────────────────────────────────────────────────────────
const wpVal = (id) => (document.getElementById(id)?.value ?? "").trim();
const wpChecked = (id) => !!document.getElementById(id)?.checked;
const wpCanvas = () => document.getElementById("posterCanvas");

function wpFont(px, weight, family) {
  return (weight ? weight + " " : "") + px + "px " + (family || WP_FONT);
}

/** "2026-10-17" -> "10/17/2026" */
function wpFmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
}

/** "23:40" -> "11:40 PM" */
function wpFmtTime12(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** "23:40" -> "2340 hrs" (police style, the flyer table) */
function wpFmtTime24(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  return m ? `${m[1].padStart(2, "0")}${m[2]} hrs` : "";
}

function wpTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Drop a prefix the user typed themselves ("for murder" under "Wanted For"). */
function wpStripPrefix(text, prefix) {
  if (!prefix) return text;
  return text.toLowerCase().startsWith(prefix + " ") ? text.slice(prefix.length + 1).trim() : text;
}

/**
 * Fill text with letter spacing. Canvas adds the spacing after the last glyph
 * too, so centred / right-aligned text is nudged back by it.
 */
function wpSpacedText(ctx, text, x, y, ls) {
  ctx.save();
  if (WP_HAS_LS) ctx.letterSpacing = ls + "px";
  const shift = !WP_HAS_LS ? 0 : ctx.textAlign === "center" ? ls / 2 : ctx.textAlign === "right" ? ls : 0;
  ctx.fillText(text, x + shift, y);
  ctx.restore();
}

/** Largest size at which spaced text fits maxW; leaves ctx.font at that size. */
function wpFitSpaced(ctx, text, maxW, basePx, minPx, fontFn, ls) {
  ctx.save();
  if (WP_HAS_LS) ctx.letterSpacing = ls + "px";
  const px = GumaFit.fitFont(ctx, text, maxW, basePx, minPx, fontFn);
  ctx.restore();
  ctx.font = fontFn(px);
  return px;
}

/** Word-wrap every paragraph of a textarea value; blank lines are kept. */
function wpWrapParagraphs(ctx, text, maxW) {
  const out = [];
  String(text)
    .split(/\r?\n/)
    .forEach((p) => {
      if (!p.trim()) out.push("");
      else out.push(...GumaFit.wrapLines(ctx, p.trim(), maxW, 999));
    });
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

/** Image scaled to fit inside the box, centred. */
function wpDrawContain(ctx, img, x, y, w, h) {
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Logos are drawn from decoded images; a logo still loading simply repaints
// the poster once it lands.
const wpImgCache = {};
function wpImage(src) {
  if (!src) return null;
  let img = wpImgCache[src];
  if (!img) {
    img = new Image();
    img.onload = () => wpRender();
    img.src = src;
    wpImgCache[src] = img;
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** Head-and-shoulders placeholder for a slot without a photo. */
function wpDrawSilhouette(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = WP_PLACEHOLDER_BG;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = WP_PLACEHOLDER_FG;
  const cx = x + w / 2;
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.42, w * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 1.02, w * 0.42, h * 0.36, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = WP_MUTED;
  ctx.textAlign = "center";
  ctx.font = wpFont(Math.round(w * 0.048), "bold");
  wpSpacedText(ctx, "NO PHOTO AVAILABLE", cx, y + h * 0.14, 2);
  ctx.restore();
}

/** Small spaced caps label (modern layout). */
function wpLabel(ctx, text, x, y, color) {
  ctx.font = wpFont(17, "bold");
  ctx.fillStyle = color || WP_MUTED;
  ctx.textAlign = "left";
  wpSpacedText(ctx, text, x, y, 2.5);
}

/** Section title + hairline (modern layout). Content starts 52px below y. */
const WP_HEAD_H = 52;
function wpSectionHead(ctx, title, x, y, w, color) {
  ctx.font = wpFont(22, "bold");
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  wpSpacedText(ctx, title.toUpperCase(), x, y + 22, 3);
  ctx.fillStyle = WP_RULE;
  ctx.fillRect(x, y + 34, w, 2);
}

/** Total height of stacked items, each { h }. */
const wpSum = (items) => items.reduce((s, it) => s + it.h, 0);

/** Draw stacked items top-down from y. */
function wpStack(items, y) {
  items.forEach((it) => {
    it.draw(y);
    y += it.h;
  });
}

// ── Form snapshot ────────────────────────────────────────────────────────────
/** Everything the poster prints, resolved from the form in one place. */
function wpData() {
  const t = WP_TYPES[wpType];
  const isCustom = FACTION_KEY === "custom";

  const headSel = wpVal("wpHeadline");
  const headline = ((headSel === "__custom__" ? wpVal("wpHeadlineCustom") : headSel) || t.headlines[0]).toUpperCase();

  let division;
  if (isCustom) division = wpVal("wpDivisionCustom");
  else {
    const sel = wpVal("wpDivision");
    division = sel === "__custom__" ? wpVal("wpDivisionCustom") : sel;
  }

  const subtitleRaw = wpVal("wpSubtitle");
  const subtitleCore = wpStripPrefix(subtitleRaw, t.subtitlePrefix);
  const subtitle = subtitleRaw ? ((t.subtitlePrefix ? t.subtitlePrefix + " " : "") + subtitleCore).toUpperCase() : "";

  const weight = wpVal("wpWeight");
  const weightLbs = /^\d+$/.test(weight) ? weight + " lbs" : weight;

  const descriptors = [
    ["SEX", wpVal("wpSex")],
    ["RACE", wpVal("wpRace")],
    ["AGE", wpVal("wpAge")],
    ["DOB", wpFmtDate(wpVal("wpDob"))],
    ["HEIGHT", wpVal("wpHeight")],
    ["WEIGHT", weightLbs],
    ["HAIR", wpVal("wpHair")],
    ["EYES", wpVal("wpEyes")],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => ({ label, value }));

  const charges = !t.charges
    ? []
    : [...document.querySelectorAll("#wpChargeRows .wp-charge-row")]
        .map((row) => ({
          code: (row.querySelector(".wp-charge-code")?.value || "").trim(),
          desc: (row.querySelector(".wp-charge-desc")?.value || "").trim(),
        }))
        .filter((c) => c.code || c.desc);

  const logoSrc = isCustom ? wpLogoURL : faction.icon;
  const badgeSrc = isCustom ? wpLogoURL : faction.businessCard?.badge || faction.icon;

  return {
    typeKey: wpType,
    type: t,
    agency: faction.name,
    agencyShort: faction.short,
    logo: wpImage(logoSrc),
    badge: wpImage(badgeSrc),
    division,
    bulletinNo: wpVal("wpBulletinNo"),
    caseNo: wpVal("wpCaseNo"),
    issueDate: wpFmtDate(wpVal("wpIssueDate")),
    headline,
    subtitle,
    subtitleRaw: subtitleCore.toUpperCase(),
    name: wpVal("wpName"),
    aka: wpVal("wpAka"),
    descriptors,
    sex: wpVal("wpSex"),
    race: wpVal("wpRace"),
    age: wpVal("wpAge"),
    dob: wpFmtDate(wpVal("wpDob")),
    height: wpVal("wpHeight"),
    weightLbs,
    hair: wpVal("wpHair"),
    eyes: wpVal("wpEyes"),
    marks: wpVal("wpMarks"),
    weapon: wpType === "missing" ? "" : wpVal("wpWeapon"),
    caution: wpChecked("wpCaution") ? wpVal("wpCautionText") || t.caution : "",
    charges,
    warrant: t.charges ? wpVal("wpWarrant") : "",
    bail: t.charges ? wpVal("wpBail") : "",
    seen: {
      date: wpFmtDate(wpVal("wpSeenDate")),
      time12: wpFmtTime12(wpVal("wpSeenTime")),
      time24: wpFmtTime24(wpVal("wpSeenTime")),
      location: wpVal("wpLocation"),
      clothing: wpVal("wpClothing"),
      vehicle: wpVal("wpVehicle"),
    },
    photoDate: wpFmtDate(wpVal("wpPhotoDate")),
    photo2: !!wpPhoto2URL,
    photo2Caption: wpPhoto2URL ? wpVal("wpPhoto2Caption") : "",
    details: (document.getElementById("wpDetails")?.value || "").trim(),
    reward: wpVal("wpReward"),
    contactName: wpVal("wpContactName"),
    contactPhone: wpVal("wpContactPhone"),
    tipLine: wpVal("wpTipLine"),
    stamp: wpChecked("wpStamp") ? { text: wpVal("wpStampText") || t.stamp, date: wpFmtDate(wpVal("wpStampDate")) } : null,
  };
}

// ── Render ───────────────────────────────────────────────────────────────────
let wpRaf = 0;
function wpSchedule() {
  if (wpRaf) return;
  wpRaf = requestAnimationFrame(() => {
    wpRaf = 0;
    wpRender();
  });
}

function wpRender() {
  const canvas = wpCanvas();
  if (!canvas || !faction) return;
  const ctx = canvas.getContext("2d");
  const d = wpData();

  // The additional photo is only on the poster when one is loaded; clearing
  // its slot first keeps a stale slot from catching drags.
  wpCrop2.paint(ctx, null);

  const stampAt = wpLayout === "classic" ? wpDrawClassic(ctx, d) : wpDrawModern(ctx, d);
  if (d.stamp) wpDrawStamp(ctx, stampAt.x, stampAt.y, d.stamp);
}

/** Size the sheet; resets the context, so call it after measuring. */
function wpSize(ctx, h) {
  ctx.canvas.width = WP_W;
  ctx.canvas.height = Math.ceil(h);
}

/**
 * Vertical rhythm shared by both layouts: fixed head, stacked sections, fixed
 * foot. Returns the canvas height and the gap to use between sections.
 */
function wpFlow(headH, blocks, footH) {
  const n = blocks.length;
  const need = headH + wpSum(blocks) + WP_GAP * Math.max(0, n - 1) + footH;
  const h = Math.max(WP_MIN_H, need);
  // Spare height on a short poster first opens the gaps up a little; whatever
  // is left pools above the foot, which stays pinned to the bottom edge.
  const extra = n > 1 ? Math.min((h - need) / n, WP_GAP_EXTRA_MAX) : 0;
  return { h, gap: WP_GAP + extra };
}

// ── Modern Bulletin ──────────────────────────────────────────────────────────
const WP_BAND_H = 170;

function wpDrawModern(ctx, d) {
  const t = d.type;
  const banH = d.subtitle ? 220 : 170;
  const headH = WP_BAND_H + banH + 44;

  const subject = wpModernSubject(ctx, d);
  const blocks = [subject];
  if (d.caution) blocks.push(wpModernCaution(ctx, d));
  const info = wpModernInfo(ctx, d);
  if (info) blocks.push(info);
  const details = wpModernDetails(ctx, d);
  if (details) blocks.push(details);

  const contact = wpModernContact(ctx, d);
  const bottomH = 84;
  const footH = 48 + (contact ? contact.h + 40 : 0) + bottomH;

  const flow = wpFlow(headH, blocks, footH);
  wpSize(ctx, flow.h);
  const W = WP_W;
  const H = ctx.canvas.height;

  ctx.fillStyle = WP_PAPER;
  ctx.fillRect(0, 0, W, H);
  wpModernBand(ctx, d);
  wpModernBanner(ctx, d, WP_BAND_H, banH);

  let y = headH;
  let stampAt = null;
  blocks.forEach((b) => {
    b.draw(y);
    if (b === subject) stampAt = { x: W / 2, y: y + Math.min(b.h, WP_PHOTO_H) / 2 };
    y += b.h + flow.gap;
  });

  if (contact) contact.draw(H - bottomH - 40 - contact.h);

  // Bottom band: the one instruction everybody should leave with
  ctx.fillStyle = WP_NAVY;
  ctx.fillRect(0, H - bottomH, W, bottomH);
  ctx.fillStyle = t.color;
  ctx.fillRect(0, H - bottomH, W, 6);
  const cta = t.cta.toUpperCase();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  wpFitSpaced(ctx, cta, W - 2 * WP_M, 30, 18, (p) => wpFont(p, "bold"), 2);
  wpSpacedText(ctx, cta, W / 2, H - bottomH / 2 + 13, 2);

  return stampAt;
}

/** Navy agency band: logo, agency + division, bulletin meta on the right. */
function wpModernBand(ctx, d) {
  const W = WP_W;
  const M = WP_M;
  const g = ctx.createLinearGradient(0, 0, 0, WP_BAND_H);
  g.addColorStop(0, WP_NAVY_2);
  g.addColorStop(1, WP_NAVY);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, WP_BAND_H);

  let tx = M;
  if (d.logo) {
    wpDrawContain(ctx, d.logo, M, 20, 130, 130);
    tx = M + 130 + 30;
  }

  // Bulletin meta, right aligned, vertically centred as a group
  const meta = [
    ["BULLETIN NO.", d.bulletinNo],
    ["CASE NO.", d.caseNo],
    ["ISSUED", d.issueDate],
  ].filter(([, v]) => v);
  const metaLH = 36;
  let my = WP_BAND_H / 2 - (meta.length * metaLH) / 2 + 26;
  let metaW = 0;
  ctx.textAlign = "right";
  meta.forEach(([k, v]) => {
    ctx.font = wpFont(23, "bold");
    const vw = ctx.measureText(v).width;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(v, W - M, my);
    ctx.font = wpFont(15, "bold");
    ctx.fillStyle = WP_BAND_SOFT;
    wpSpacedText(ctx, k, W - M - vw - 12, my, 2);
    metaW = Math.max(metaW, vw + 12 + ctx.measureText(k).width + k.length * 2);
    my += metaLH;
  });

  // Agency name: one line if it fits at a good size, otherwise two
  const maxW = W - M - (metaW ? metaW + 40 : 0) - tx;
  const agency = d.agency.toUpperCase();
  ctx.textAlign = "left";
  let lines;
  let px = GumaFit.fitFont(ctx, agency, maxW, 42, 34, (p) => wpFont(p, "bold"));
  if (ctx.measureText(agency).width <= maxW) lines = [agency];
  else {
    const fb = GumaFit.fitBlock(ctx, agency, maxW, 2, 36, 22, (p) => wpFont(p, "bold"));
    px = fb.px;
    lines = fb.lines;
  }
  const lh = Math.round(px * 1.12);
  const divPx = d.division ? GumaFit.fitFont(ctx, d.division.toUpperCase(), maxW, 24, 15, (p) => wpFont(p, "bold")) : 0;
  const blockH = lines.length * lh + (d.division ? 14 + divPx : 0);
  let ty = WP_BAND_H / 2 - blockH / 2 + px * 0.8;
  ctx.font = wpFont(px, "bold");
  ctx.fillStyle = "#ffffff";
  lines.forEach((ln) => {
    ctx.fillText(ln, tx, ty);
    ty += lh;
  });
  if (d.division) {
    ctx.font = wpFont(divPx, "bold");
    ctx.fillStyle = WP_BAND_GOLD;
    wpSpacedText(ctx, d.division.toUpperCase(), tx, ty - lh + 14 + divPx, 2);
  }
}

/** Full-width status banner in the bulletin type's colour. */
function wpModernBanner(ctx, d, y, h) {
  const W = WP_W;
  const t = d.type;
  ctx.fillStyle = t.color;
  ctx.fillRect(0, y, W, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
  ctx.fillRect(0, y + h - 8, W, 8);

  ctx.fillStyle = t.onColor;
  ctx.textAlign = "center";
  const headArea = d.subtitle ? h - 66 : h;
  const px = wpFitSpaced(ctx, d.headline, W - 2 * WP_M, 150, 60, (p) => wpFont(p, "", WP_FONT_IMPACT), 10);
  // Impact caps are ~0.79 em tall; centre them in the headline area.
  wpSpacedText(ctx, d.headline, W / 2, y + headArea / 2 + px * 0.39 + (d.subtitle ? 8 : 0), 10);

  if (d.subtitle) {
    wpFitSpaced(ctx, d.subtitle, W - 2 * WP_M, 40, 22, (p) => wpFont(p, "bold"), 4);
    wpSpacedText(ctx, d.subtitle, W / 2, y + h - 34, 4);
  }
}

/** Photo + name + descriptor grid. */
function wpModernSubject(ctx, d) {
  const t = d.type;
  const M = WP_M;
  const pw = WP_PHOTO_W;
  const ph = WP_PHOTO_H;
  const rx = M + pw + 56;
  const rw = WP_W - M - rx;
  const items = [];

  const name = (d.name || t.unknownName).toUpperCase();
  const namePx = GumaFit.fitFont(ctx, name, rw, 60, 28, (p) => wpFont(p, "bold"));
  items.push({
    h: 66,
    draw: (y) => {
      ctx.font = wpFont(namePx, "bold");
      ctx.fillStyle = d.name ? WP_INK : WP_MUTED;
      ctx.textAlign = "left";
      ctx.fillText(name, rx, y + 48);
    },
  });

  if (d.aka) {
    const aka = "AKA " + d.aka;
    const akaPx = GumaFit.fitFont(ctx, aka, rw, 28, 18, (p) => wpFont(p, "italic"));
    items.push({
      h: 42,
      draw: (y) => {
        ctx.font = wpFont(akaPx, "italic");
        ctx.fillStyle = WP_MUTED;
        ctx.fillText(aka, rx, y + 28);
      },
    });
  }

  items.push({
    h: 44,
    draw: (y) => {
      ctx.fillStyle = t.color;
      ctx.fillRect(rx, y + 14, rw, 5);
    },
  });

  // Descriptors, two to a row, only the ones that were filled in
  const colW = rw / 2;
  for (let i = 0; i < d.descriptors.length; i += 2) {
    const row = d.descriptors.slice(i, i + 2);
    const sizes = row.map((c) => GumaFit.fitFont(ctx, c.value, colW - 24, 36, 20, (p) => wpFont(p, "bold")));
    items.push({
      h: 90,
      draw: (y) =>
        row.forEach((c, j) => {
          const x = rx + j * colW;
          wpLabel(ctx, c.label, x, y + 18);
          ctx.font = wpFont(sizes[j], "bold");
          ctx.fillStyle = WP_INK;
          ctx.fillText(c.value, x, y + 60);
        }),
    });
  }

  [
    ["SCARS / MARKS / TATTOOS", d.marks],
    ["WEAPON(S)", d.weapon],
  ].forEach(([label, value]) => {
    if (!value) return;
    const fb = GumaFit.fitBlock(ctx, value, rw, 2, 28, 18, (p) => wpFont(p, "bold"));
    const lh = Math.round(fb.px * 1.3);
    items.push({
      h: 34 + fb.lines.length * lh + 18,
      draw: (y) => {
        wpLabel(ctx, label, rx, y + 18);
        ctx.font = wpFont(fb.px, "bold");
        ctx.fillStyle = WP_INK;
        fb.lines.forEach((ln, i) => ctx.fillText(ln, rx, y + 34 + fb.px * 0.9 + i * lh));
      },
    });
  });

  const photoH = ph + (d.photoDate ? 44 : 10);
  return {
    h: Math.max(photoH, wpSum(items)),
    draw(y) {
      // White mat + hairline, like a print pinned to the board
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(M - 10, y - 10, pw + 20, ph + 20);
      ctx.strokeStyle = WP_RULE;
      ctx.lineWidth = 2;
      ctx.strokeRect(M - 10, y - 10, pw + 20, ph + 20);
      if (!wpCrop.paint(ctx, { x: M, y, w: pw, h: ph })) wpDrawSilhouette(ctx, M, y, pw, ph);
      if (d.photoDate) {
        ctx.textAlign = "left";
        wpLabel(ctx, "PHOTO DATE: " + d.photoDate, M - 8, y + ph + 40);
      }
      wpStack(items, y);
    },
  };
}

/** Yellow caution strip with hazard stripes at both ends. */
function wpModernCaution(ctx, d) {
  const h = 88;
  const M = WP_M;
  const W = WP_W;
  const stripeW = 110;
  const text = d.caution.toUpperCase();
  const px = wpFitSpaced(ctx, text, W - 2 * M - 2 * stripeW - 48, 46, 22, (p) => wpFont(p, "", WP_FONT_IMPACT), 3);
  return {
    h,
    draw(y) {
      ctx.fillStyle = WP_CAUTION;
      ctx.fillRect(M, y, W - 2 * M, h);
      [M, W - M - stripeW].forEach((sx) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, y, stripeW, h);
        ctx.clip();
        ctx.fillStyle = WP_INK;
        for (let i = -h; i < stripeW + h; i += 40) {
          ctx.beginPath();
          ctx.moveTo(sx + i, y + h);
          ctx.lineTo(sx + i + 20, y + h);
          ctx.lineTo(sx + i + 20 + h, y);
          ctx.lineTo(sx + i + h, y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
      ctx.font = wpFont(px, "", WP_FONT_IMPACT);
      ctx.fillStyle = WP_INK;
      ctx.textAlign = "center";
      wpSpacedText(ctx, text, W / 2, y + h / 2 + px * 0.39, 3);
    },
  };
}

/** Last-seen rows as [label, value]. */
function wpSeenRows(d) {
  const rows = [];
  const when = [d.seen.date, d.seen.time12].filter(Boolean).join(" at ");
  if (when) rows.push(["DATE", when]);
  if (d.seen.location) rows.push(["LOCATION", d.seen.location]);
  if (d.seen.clothing) rows.push(["WEARING", d.seen.clothing]);
  if (d.seen.vehicle) rows.push(["VEHICLE", d.seen.vehicle]);
  return rows;
}

/** Label / value rows under a section head; no head when `title` is null. */
function wpModernRows(ctx, d, title, rows, x, w) {
  const labelW = 150;
  const measured = rows.map(([label, value]) => {
    const fb = GumaFit.fitBlock(ctx, value, w - labelW, 2, 26, 18, (p) => wpFont(p, "bold"));
    return { label, fb, lh: Math.round(fb.px * 1.3) };
  });
  const headH = title ? WP_HEAD_H : 0;
  return {
    h: headH + measured.reduce((s, r) => s + r.fb.lines.length * r.lh + 16, 0),
    draw(y) {
      if (title) wpSectionHead(ctx, title, x, y, w, d.type.text);
      let cy = y + headH;
      measured.forEach((r) => {
        wpLabel(ctx, r.label, x, cy + 24);
        ctx.font = wpFont(r.fb.px, "bold");
        ctx.fillStyle = WP_INK;
        ctx.textAlign = "left";
        r.fb.lines.forEach((ln, i) => ctx.fillText(ln, x + labelW, cy + 26 + i * r.lh));
        cy += r.fb.lines.length * r.lh + 16;
      });
    },
  };
}

/** Charges list + warrant / bail line. */
function wpModernCharges(ctx, d, x, w) {
  const codeMaxW = 210;
  ctx.font = wpFont(26, "bold");
  const codeW = Math.min(codeMaxW, Math.max(0, ...d.charges.map((c) => (c.code ? ctx.measureText(c.code).width : 0))));
  const gap = codeW ? 24 : 0;
  const rows = d.charges.map((c) => {
    const codePx = c.code ? GumaFit.fitFont(ctx, c.code, codeMaxW, 26, 16, (p) => wpFont(p, "bold")) : 26;
    const fb = GumaFit.fitBlock(ctx, c.desc || "", w - codeW - gap, 2, 26, 18, (p) => wpFont(p));
    return { c, codePx, fb, lh: Math.round(fb.px * 1.3) };
  });
  const tail = [
    ["WARRANT NO.", d.warrant],
    ["BAIL", d.bail],
  ].filter(([, v]) => v);
  return {
    h: WP_HEAD_H + rows.reduce((s, r) => s + r.fb.lines.length * r.lh + 14, 0) + (tail.length ? 40 : 0),
    draw(y) {
      wpSectionHead(ctx, "Charges", x, y, w, d.type.text);
      let cy = y + WP_HEAD_H;
      ctx.textAlign = "left";
      rows.forEach((r) => {
        if (r.c.code) {
          ctx.font = wpFont(r.codePx, "bold");
          ctx.fillStyle = d.type.text;
          ctx.fillText(r.c.code, x, cy + 26);
        }
        ctx.font = wpFont(r.fb.px);
        ctx.fillStyle = WP_INK;
        r.fb.lines.forEach((ln, i) => ctx.fillText(ln, x + codeW + gap, cy + 26 + i * r.lh));
        cy += r.fb.lines.length * r.lh + 14;
      });
      if (tail.length) {
        let tx = x;
        tail.forEach(([k, v]) => {
          wpLabel(ctx, k, tx, cy + 28);
          tx += ctx.measureText(k).width + k.length * 2.5 + 12;
          ctx.font = wpFont(22, "bold");
          ctx.fillStyle = WP_INK;
          ctx.fillText(v, tx, cy + 28);
          tx += ctx.measureText(v).width + 44;
        });
      }
    },
  };
}

/** Additional photo + caption, `w` wide at 4:3. */
function wpModernPhoto2(ctx, d, x, w) {
  const ph = Math.round(w * 0.75);
  let cap = null;
  if (d.photo2Caption) {
    cap = GumaFit.fitBlock(ctx, d.photo2Caption, w, 3, 22, 16, (p) => wpFont(p, "bold italic"));
  }
  const capH = cap ? 16 + cap.lines.length * Math.round(cap.px * 1.3) : 0;
  return {
    h: ph + capH,
    draw(y) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 8, y - 8, w + 16, ph + 16);
      ctx.strokeStyle = WP_RULE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 8, y - 8, w + 16, ph + 16);
      if (!wpCrop2.paint(ctx, { x, y, w, h: ph })) wpDrawSilhouette(ctx, x, y, w, ph);
      if (cap) {
        ctx.font = wpFont(cap.px, "bold italic");
        ctx.fillStyle = WP_INK;
        ctx.textAlign = "left";
        const lh = Math.round(cap.px * 1.3);
        cap.lines.forEach((ln, i) => ctx.fillText(ln, x, y + ph + 16 + cap.px + i * lh));
      }
    },
  };
}

/**
 * Charges, last seen and the additional photo. Without the photo, charges and
 * last seen share a row; with it, they stack in a left column and the photo
 * takes the right one, so neither the text nor the photo is squeezed.
 */
function wpModernInfo(ctx, d) {
  const M = WP_M;
  const fullW = WP_W - 2 * M;
  const hasCharges = d.charges.length > 0 || !!d.warrant || !!d.bail;
  const seenRows = wpSeenRows(d);
  const hasSeen = seenRows.length > 0;

  if (!d.photo2) {
    if (!hasCharges && !hasSeen) return null;
    if (hasCharges && hasSeen) {
      const colW = (fullW - 56) / 2;
      const a = wpModernCharges(ctx, d, M, colW);
      const b = wpModernRows(ctx, d, "Last Seen", seenRows, M + colW + 56, colW);
      return {
        h: Math.max(a.h, b.h),
        draw(y) {
          a.draw(y);
          b.draw(y);
        },
      };
    }
    return hasCharges ? wpModernCharges(ctx, d, M, fullW) : wpModernRows(ctx, d, "Last Seen", seenRows, M, fullW);
  }

  const textW = fullW - WP_PHOTO2_W - 56;
  const left = [];
  if (hasCharges) left.push(wpModernCharges(ctx, d, M, textW));
  if (hasSeen) {
    if (left.length) left.push({ h: WP_GAP - 8, draw: () => {} });
    left.push(wpModernRows(ctx, d, "Last Seen", seenRows, M, textW));
  }
  // Alone, the photo stays on the left edge with its caption under it.
  const photoX = left.length ? WP_W - M - WP_PHOTO2_W : M;
  const photo = wpModernPhoto2(ctx, d, photoX, WP_PHOTO2_W);
  return {
    h: Math.max(wpSum(left), photo.h + 10),
    draw(y) {
      wpStack(left, y);
      photo.draw(y + 10);
    },
  };
}

/** Free-text narrative, full width, never shrunk. */
function wpModernDetails(ctx, d) {
  if (!d.details) return null;
  const M = WP_M;
  const w = WP_W - 2 * M;
  const px = 27;
  const lh = 39;
  ctx.font = wpFont(px);
  const lines = wpWrapParagraphs(ctx, d.details, w);
  return {
    h: WP_HEAD_H + lines.length * lh,
    draw(y) {
      wpSectionHead(ctx, d.type.detailsTitle, M, y, w, d.type.text);
      ctx.font = wpFont(px);
      ctx.fillStyle = WP_INK;
      ctx.textAlign = "left";
      lines.forEach((ln, i) => ctx.fillText(ln, M, y + WP_HEAD_H + px * 0.9 + i * lh));
    },
  };
}

/** Reward box + who to call. Null when there is nothing to print. */
function wpModernContact(ctx, d) {
  const t = d.type;
  const M = WP_M;
  const W = WP_W;
  if (!d.reward && !d.contactName && !d.contactPhone && !d.tipLine) return null;

  const rewardH = 190;
  const rewardW = d.reward ? 420 : 0;
  const cx = d.reward ? M + rewardW + 48 : M;
  const cw = W - M - cx;

  // Contact lines, measured now and centred in the block when drawn
  const lines = [];
  if (d.contactName || d.contactPhone) {
    lines.push({ h: 34, draw: (y) => wpLabel(ctx, "ANYONE WITH INFORMATION IS ASKED TO CONTACT", cx, y + 20) });
  }
  if (d.contactName) {
    const px = GumaFit.fitFont(ctx, d.contactName, cw, 40, 24, (p) => wpFont(p, "bold"));
    const sub = d.division ? `${d.division}, ${d.agencyShort}` : d.agency;
    const subPx = GumaFit.fitFont(ctx, sub, cw, 23, 16, (p) => wpFont(p));
    lines.push({
      h: 82,
      draw: (y) => {
        ctx.font = wpFont(px, "bold");
        ctx.fillStyle = WP_INK;
        ctx.textAlign = "left";
        ctx.fillText(d.contactName, cx, y + 40);
        ctx.font = wpFont(subPx);
        ctx.fillStyle = WP_MUTED;
        ctx.fillText(sub, cx, y + 72);
      },
    });
  }
  if (d.contactPhone) {
    const px = GumaFit.fitFont(ctx, d.contactPhone, cw, 44, 24, (p) => wpFont(p, "bold"));
    lines.push({
      h: 56,
      draw: (y) => {
        ctx.font = wpFont(px, "bold");
        ctx.fillStyle = t.text;
        ctx.fillText(d.contactPhone, cx, y + 44);
      },
    });
  }
  if (d.tipLine) {
    lines.push({
      h: 40,
      draw: (y) => {
        wpLabel(ctx, "ANONYMOUS TIPS", cx, y + 28);
        const lx = cx + ctx.measureText("ANONYMOUS TIPS").width + 14 * 2.5 + 14;
        GumaFit.fitFont(ctx, d.tipLine, W - M - lx, 24, 15, (p) => wpFont(p, "bold"));
        ctx.fillStyle = WP_INK;
        ctx.fillText(d.tipLine, lx, y + 28);
      },
    });
  }

  let rewardPx = 0;
  if (d.reward) rewardPx = wpFitSpaced(ctx, d.reward, rewardW - 40, 92, 36, (p) => wpFont(p, "", WP_FONT_IMPACT), 1);

  // The reward box sets the height when there is one; otherwise the block is
  // only as tall as its lines.
  const h = Math.max(d.reward ? rewardH : 0, wpSum(lines) + 16);
  return {
    h,
    draw(y) {
      ctx.fillStyle = WP_RULE;
      ctx.fillRect(M, y - 20, W - 2 * M, 2);
      if (d.reward) {
        const ry = y + (h - rewardH) / 2;
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.roundRect(M, ry + 10, rewardW, rewardH - 20, 14);
        ctx.fill();
        ctx.fillStyle = t.onColor;
        ctx.textAlign = "center";
        ctx.font = wpFont(28, "bold");
        wpSpacedText(ctx, "REWARD", M + rewardW / 2, ry + 62, 10);
        ctx.font = wpFont(rewardPx, "", WP_FONT_IMPACT);
        wpSpacedText(ctx, d.reward, M + rewardW / 2, ry + rewardH - 38, 1);
      }
      wpStack(lines, y + (h - wpSum(lines)) / 2);
    },
  };
}

// ── Classic Flyer ────────────────────────────────────────────────────────────
function wpDrawClassic(ctx, d) {
  const W = WP_W;
  const blocks = [wpFlyerMasthead(ctx, d)];
  if (d.subtitleRaw) blocks.push(wpFlyerSubtitle(ctx, d));
  if (d.details) blocks.push(wpFlyerDetails(ctx, d));
  const table = wpFlyerTable(ctx, d);
  if (table) blocks.push(table);
  const body = wpFlyerBody(ctx, d);
  blocks.push(body);
  blocks.push(wpFlyerContact(ctx, d));
  if (d.reward) blocks.push(wpFlyerReward(ctx, d));

  const headH = 40;
  const footH = 40 + 56;
  const flow = wpFlow(headH, blocks, footH);
  wpSize(ctx, flow.h);
  const H = ctx.canvas.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let y = headH;
  let stampAt = null;
  blocks.forEach((b) => {
    b.draw(y);
    if (b === body) stampAt = { x: W / 2, y: y + b.h / 2 };
    y += b.h + flow.gap;
  });

  // Small print along the bottom edge
  ctx.font = wpFont(18, "bold");
  ctx.fillStyle = WP_MUTED;
  if (d.issueDate) {
    ctx.textAlign = "left";
    wpSpacedText(ctx, "ISSUED " + d.issueDate, WP_M, H - 34, 1.5);
  }
  if (d.bulletinNo) {
    ctx.textAlign = "right";
    wpSpacedText(ctx, "BULLETIN NO. " + d.bulletinNo, W - WP_M, H - 34, 1.5);
  }
  return stampAt;
}

/** Logos at both corners, red headline, agency, division, black rule. */
function wpFlyerMasthead(ctx, d) {
  const W = WP_W;
  const M = WP_M;
  const logoS = 170;
  const hasLogo = !!(d.logo || d.badge);
  const ix = hasLogo ? M + logoS + 24 : M;
  const iw = W - 2 * ix;
  const flyer = (w) => (p) => wpFont(p, w, WP_FONT_FLYER);

  const hPx = GumaFit.fitFont(ctx, d.headline, iw, 100, 48, flyer("bold"));
  const agency = d.agency.toUpperCase();
  const aPx = GumaFit.fitFont(ctx, agency, iw, 32, 18, (p) => wpFont(p, "bold"));
  const div = d.division ? "OFFICIAL PUBLICATION OF THE " + d.division.toUpperCase() : "";
  const dPx = div ? GumaFit.fitFont(ctx, div, iw, 22, 13, (p) => wpFont(p, "bold")) : 0;

  // Text group, centred against the logo height
  const groupH = hPx * 0.68 + 30 + aPx * 0.72 + (div ? 18 + dPx * 0.72 : 0);
  const textTop = Math.max(0, (logoS - groupH) / 2);
  const ruleY = logoS + 22;
  return {
    h: ruleY + 3,
    draw(y) {
      if (d.logo) wpDrawContain(ctx, d.logo, M, y, logoS, logoS);
      if (d.badge) wpDrawContain(ctx, d.badge, W - M - logoS, y, logoS, logoS);
      ctx.textAlign = "center";
      let ty = y + textTop + hPx * 0.68;
      ctx.font = flyer("bold")(hPx);
      ctx.fillStyle = WP_FLYER_RED;
      ctx.fillText(d.headline, W / 2, ty);
      ty += 30 + aPx * 0.72;
      ctx.font = wpFont(aPx, "bold");
      ctx.fillStyle = WP_INK;
      ctx.fillText(agency, W / 2, ty);
      if (div) {
        ty += 18 + dPx * 0.72;
        ctx.font = wpFont(dPx, "bold");
        ctx.fillText(div, W / 2, ty);
      }
      ctx.fillStyle = WP_INK;
      ctx.fillRect(M, y + ruleY, W - 2 * M, 3);
    },
  };
}

/** Red offence line under the rule. */
function wpFlyerSubtitle(ctx, d) {
  const px = GumaFit.fitFont(ctx, d.subtitleRaw, WP_W - 2 * WP_M, 62, 30, (p) => wpFont(p, "bold", WP_FONT_FLYER));
  return {
    h: Math.round(px * 0.9),
    draw(y) {
      ctx.font = wpFont(px, "bold", WP_FONT_FLYER);
      ctx.fillStyle = WP_FLYER_RED;
      ctx.textAlign = "center";
      ctx.fillText(d.subtitleRaw, WP_W / 2, y + px * 0.72);
    },
  };
}

/** "MO:" paragraph; the first line starts after the label. */
function wpFlyerDetails(ctx, d) {
  const M = WP_M;
  const w = WP_W - 2 * M;
  const label = d.type.flyerDetails;
  const px = 27;
  const lh = 37;
  ctx.font = wpFont(21, "bold");
  const labelW = ctx.measureText(label).width + 12;
  ctx.font = wpFont(px, "bold");

  // Indent only the first line: wrap it alone against the shorter width.
  // Whitespace is collapsed so the first line can be found again in the
  // paragraph it was wrapped from.
  const paras = d.details.split(/\r?\n/).map((p) => p.replace(/\s+/g, " ").trim());
  const lines = [];
  paras.forEach((p, pi) => {
    if (!p) {
      lines.push({ text: "", x: M });
      return;
    }
    let rest = p;
    if (pi === 0) {
      const first = GumaFit.wrapLines(ctx, p, w - labelW, 999);
      lines.push({ text: first[0], x: M + labelW });
      rest = p.slice(p.indexOf(first[0]) + first[0].length).trim();
    }
    if (rest) GumaFit.wrapLines(ctx, rest, w, 999).forEach((ln) => lines.push({ text: ln, x: M }));
  });
  return {
    h: lines.length * lh,
    draw(y) {
      ctx.textAlign = "left";
      ctx.font = wpFont(21, "bold");
      ctx.fillStyle = WP_FLYER_BLUE;
      ctx.fillText(label, M, y + px * 0.78);
      ctx.font = wpFont(px, "bold");
      ctx.fillStyle = WP_INK;
      lines.forEach((ln, i) => ctx.fillText(ln.text, ln.x, y + px * 0.78 + i * lh));
    },
  };
}

/** DATE / TIME / LOCATION / CASE table; only the columns that have values. */
function wpFlyerTable(ctx, d) {
  const cols = [];
  if (d.seen.date) cols.push({ head: "DATE", value: d.seen.date, w: 210 });
  if (d.seen.time24) cols.push({ head: "TIME", value: d.seen.time24, w: 170 });
  if (d.seen.location) cols.push({ head: "LOCATION", value: d.seen.location, w: 0 });
  if (d.caseNo) cols.push({ head: "CASE NO.", value: d.caseNo, w: 250 });
  if (!cols.length) return null;

  const x0 = WP_M + 30;
  const tw = WP_W - 2 * WP_M - 60;
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  const flex = cols.filter((c) => !c.w).length;
  if (flex) cols.forEach((c) => (c.w = c.w || (tw - fixed) / flex));
  else cols.forEach((c) => (c.w = (c.w / fixed) * tw));
  cols.forEach((c) => (c.px = GumaFit.fitFont(ctx, c.value, c.w - 24, 25, 14, (p) => wpFont(p, "bold"))));

  const headH = 46;
  const rowH = 52;
  return {
    h: headH + rowH,
    draw(y) {
      ctx.strokeStyle = "#8a8a8a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y, tw, headH + rowH);
      ctx.beginPath();
      ctx.moveTo(x0, y + headH);
      ctx.lineTo(x0 + tw, y + headH);
      let cx = x0;
      cols.forEach((c, i) => {
        if (i) {
          ctx.moveTo(cx, y);
          ctx.lineTo(cx, y + headH + rowH);
        }
        cx += c.w;
      });
      ctx.stroke();

      ctx.textAlign = "center";
      cx = x0;
      cols.forEach((c) => {
        ctx.font = wpFont(23, "bold");
        ctx.fillStyle = WP_FLYER_BLUE;
        ctx.fillText(c.head, cx + c.w / 2, y + 31);
        ctx.font = wpFont(c.px, "bold");
        ctx.fillStyle = WP_INK;
        ctx.fillText(c.value, cx + c.w / 2, y + headH + 35);
        cx += c.w;
      });
    },
  };
}

/** Description column on the left, photo(s) on the right. */
function wpFlyerBody(ctx, d) {
  const t = d.type;
  const W = WP_W;
  const M = WP_M;
  const pw = WP_FLYER_PHOTO_W;
  const rx = W - M - pw;
  const lw = rx - 50 - M;

  // ── Left: description text ──
  const L = [];
  const gap = (h) => L.push({ h, draw: () => {} });
  const heading = (text) => {
    L.push({
      h: 44,
      draw: (y) => {
        ctx.font = wpFont(25, "bold");
        ctx.fillStyle = WP_FLYER_BLUE;
        ctx.textAlign = "left";
        ctx.fillText(text, M, y + 26);
        ctx.fillRect(M, y + 31, ctx.measureText(text).width, 2);
      },
    });
  };
  const para = (text, font, lh) => {
    ctx.font = font;
    const lines = GumaFit.wrapLines(ctx, text, lw, 999);
    L.push({
      h: lines.length * lh,
      draw: (y) => {
        ctx.font = font;
        ctx.fillStyle = WP_INK;
        ctx.textAlign = "left";
        lines.forEach((ln, i) => ctx.fillText(ln, M, y + lh * 0.76 + i * lh));
      },
    });
  };
  const body = (text) => para(text, wpFont(26), 35);

  heading(t.flyerDescription);
  gap(8);
  para(d.name || t.unknownName, wpFont(31, "bold"), 40);
  const looks = [d.sex, d.race, d.hair && d.hair + " Hair", d.eyes && d.eyes + " Eyes"].filter(Boolean).join(", ");
  if (looks) body(looks);
  const age = [d.age && (/^\d+$/.test(d.age) ? d.age + " Years old" : d.age), d.dob && "DOB " + d.dob].filter(Boolean).join(", ");
  if (age) body(age);
  const build = [d.height, d.weightLbs].filter(Boolean).join(", ");
  if (build) body(build);
  if (d.aka) body("AKA " + d.aka);
  if (d.marks) body("Scars/Marks/Tattoos: " + d.marks);
  // The flyer has no strip for the caution; it goes in red caps under the
  // description, where the LASD bulletin puts "CONSIDERED ARMED & DANGEROUS".
  if (d.caution) {
    gap(18);
    ctx.font = wpFont(30, "bold");
    const warn = GumaFit.wrapLines(ctx, d.caution.toUpperCase(), lw, 999);
    L.push({
      h: warn.length * 38,
      draw: (y) => {
        ctx.font = wpFont(30, "bold");
        ctx.fillStyle = WP_FLYER_RED;
        ctx.textAlign = "left";
        warn.forEach((ln, i) => ctx.fillText(ln, M, y + 30 + i * 38));
      },
    });
  }

  const group = (title, values) => {
    if (!values.length) return;
    gap(22);
    heading(title);
    gap(4);
    values.forEach(body);
  };
  group("WEAPON(S):", d.weapon ? [d.weapon] : []);
  group(
    "CHARGES:",
    [
      ...d.charges.map((c) => [c.code, c.desc].filter(Boolean).join(" - ")),
      d.warrant && "Warrant No. " + d.warrant,
      d.bail && "Bail: " + d.bail,
    ].filter(Boolean),
  );
  group("VEHICLE:", d.seen.vehicle ? [d.seen.vehicle] : []);
  group("LAST SEEN WEARING:", d.seen.clothing ? [d.seen.clothing] : []);

  // ── Right: photo, optional photo date, optional second photo ──
  const p1h = Math.round(pw * (d.photo2 ? 1.18 : 1.25));
  const p2h = Math.round(pw * 0.75);
  let cap = null;
  if (d.photo2 && d.photo2Caption) cap = GumaFit.fitBlock(ctx, d.photo2Caption, pw, 3, 23, 16, (p) => wpFont(p, "bold"));
  const capLH = cap ? Math.round(cap.px * 1.3) : 0;
  const rightH = p1h + (d.photoDate ? 34 : 0) + (d.photo2 ? 26 + p2h + (cap ? 12 + cap.lines.length * capLH : 0) : 0);

  return {
    h: Math.max(wpSum(L), rightH),
    draw(y) {
      wpStack(L, y);

      ctx.strokeStyle = WP_INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx - 1, y - 1, pw + 2, p1h + 2);
      if (!wpCrop.paint(ctx, { x: rx, y, w: pw, h: p1h })) wpDrawSilhouette(ctx, rx, y, pw, p1h);
      let ry = y + p1h;
      if (d.photoDate) {
        ctx.font = wpFont(19, "italic");
        ctx.fillStyle = WP_MUTED;
        ctx.textAlign = "left";
        ctx.fillText("Photo date: " + d.photoDate, rx, ry + 26);
        ry += 34;
      }
      if (d.photo2) {
        ry += 26;
        ctx.strokeStyle = WP_INK;
        ctx.strokeRect(rx - 1, ry - 1, pw + 2, p2h + 2);
        if (!wpCrop2.paint(ctx, { x: rx, y: ry, w: pw, h: p2h })) wpDrawSilhouette(ctx, rx, ry, pw, p2h);
        ry += p2h;
        if (cap) {
          ctx.font = wpFont(cap.px, "bold");
          ctx.fillStyle = WP_INK;
          ctx.textAlign = "left";
          cap.lines.forEach((ln, i) => ctx.fillText(ln, rx, ry + 12 + cap.px + i * capLH));
        }
      }
    },
  };
}

/** "Anyone with information..." paragraph, centred. Always present. */
function wpFlyerContact(ctx, d) {
  const t = d.type;
  let s = `Anyone with information ${t.contactAbout} is asked to call `;
  if (d.contactName && d.contactPhone) s += `${d.contactName} at ${d.contactPhone}`;
  else if (d.contactName) s += `${d.contactName}, ${d.division || d.agency}`;
  else if (d.contactPhone) s += `the ${d.division || d.agency} at ${d.contactPhone}`;
  else s += "911";
  s += ".";
  if (d.contactName || d.contactPhone) s += " During non-business hours or on weekends, calls should be directed to 911.";
  if (d.tipLine) s += ` Anyone wishing to remain anonymous should call ${d.tipLine}.`;

  const px = 24;
  const lh = 33;
  ctx.font = wpFont(px, "bold");
  const lines = GumaFit.wrapLines(ctx, s, WP_W - 2 * WP_M - 60, 999);
  return {
    h: lines.length * lh,
    draw(y) {
      ctx.font = wpFont(px, "bold");
      ctx.fillStyle = WP_INK;
      ctx.textAlign = "center";
      lines.forEach((ln, i) => ctx.fillText(ln, WP_W / 2, y + px * 0.8 + i * lh));
    },
  };
}

/** Black reward plate, Crime Stoppers style. */
function wpFlyerReward(ctx, d) {
  const h = 112;
  ctx.font = wpFont(60, "", WP_FONT_IMPACT);
  const label = "REWARD";
  const lw = ctx.measureText(label).width + label.length * 4;
  const aPx = GumaFit.fitFont(ctx, d.reward, 520, 66, 30, (p) => wpFont(p, "", WP_FONT_IMPACT));
  const aw = ctx.measureText(d.reward).width;
  const boxW = Math.min(WP_W - 2 * WP_M, lw + aw + 120);
  return {
    h,
    draw(y) {
      const bx = (WP_W - boxW) / 2;
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.roundRect(bx, y, boxW, h, 10);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.font = wpFont(60, "", WP_FONT_IMPACT);
      ctx.fillStyle = "#ffffff";
      wpSpacedText(ctx, label, bx + 44, y + h / 2 + 23, 4);
      ctx.font = wpFont(aPx, "", WP_FONT_IMPACT);
      ctx.fillStyle = "#e01e1e";
      ctx.fillText(d.reward, bx + 44 + lw + 32, y + h / 2 + aPx * 0.38);
    },
  };
}

// ── Resolved stamp ───────────────────────────────────────────────────────────
/** Deterministic PRNG, so the worn ink never shimmers between redraws. */
function wpRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wpHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Rubber stamp, rotated, centred on (cx, cy). */
function wpDrawStamp(ctx, cx, cy, stamp) {
  const off = document.createElement("canvas");
  const o = off.getContext("2d");
  const ls = 8;
  o.font = wpFont(150, "", WP_FONT_IMPACT);
  const tw = o.measureText(stamp.text).width + stamp.text.length * ls;
  const bw = Math.ceil(tw + 130);
  const bh = stamp.date ? 280 : 214;
  off.width = bw;
  off.height = bh;

  o.strokeStyle = WP_STAMP;
  o.fillStyle = WP_STAMP;
  o.lineWidth = 14;
  o.beginPath();
  o.roundRect(7, 7, bw - 14, bh - 14, 26);
  o.stroke();
  o.lineWidth = 4;
  o.beginPath();
  o.roundRect(27, 27, bw - 54, bh - 54, 14);
  o.stroke();

  o.textAlign = "center";
  o.font = wpFont(150, "", WP_FONT_IMPACT);
  wpSpacedText(o, stamp.text, bw / 2, stamp.date ? 172 : 166, ls);
  if (stamp.date) {
    o.font = wpFont(38, "bold");
    wpSpacedText(o, stamp.date, bw / 2, 232, 6);
  }

  // Worn ink: knock flecks and a few scuffs out of the impression
  const rnd = wpRng(wpHash(stamp.text + "|" + stamp.date));
  o.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 1500; i++) {
    o.globalAlpha = 0.3 + rnd() * 0.7;
    o.beginPath();
    o.arc(rnd() * bw, rnd() * bh, 0.6 + rnd() * 2.4, 0, Math.PI * 2);
    o.fill();
  }
  o.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    o.globalAlpha = 0.25 + rnd() * 0.4;
    o.lineWidth = 1 + rnd() * 3;
    const x = rnd() * bw;
    const y = rnd() * bh;
    o.beginPath();
    o.moveTo(x, y);
    o.lineTo(x + 40 + rnd() * 160, y + (rnd() - 0.5) * 30);
    o.stroke();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  ctx.globalAlpha = 0.9;
  ctx.drawImage(off, -bw / 2, -bh / 2);
  ctx.restore();
}

// ── Faction ──────────────────────────────────────────────────────────────────
function switchFaction(key) {
  const isCustom = key === "custom";
  FACTION_KEY = key;
  document.getElementById("customFactionPanel").style.display = isCustom ? "block" : "none";
  document.querySelectorAll("#factionSwitcher .faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === key);
  });

  if (isCustom) {
    applyCustomFaction();
  } else {
    faction = FACTIONS[key];
    wpPopulateDivisions();
  }
  wpSyncCustomInputs();
  wpRender();
}

function applyCustomFaction() {
  const name = wpVal("wpCustomAgency") || "Custom Agency";
  faction = { name, short: name, icon: null, divisions: [] };
}

/** Division select from the faction, preferring an investigative unit. */
function wpPopulateDivisions() {
  const sel = document.getElementById("wpDivision");
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = "";
  const add = (value, text) => {
    const o = document.createElement("option");
    o.value = value;
    o.text = text;
    sel.appendChild(o);
  };
  add("", "None");
  (faction.divisions || []).forEach((dv) => add(dv, dv));
  add("__custom__", "Custom…");

  const keep = Array.from(sel.options).some((o) => o.value === prev && prev);
  const pick = (faction.divisions || []).find((dv) => /robbery-homicide|major crimes|detective/i.test(dv));
  sel.value = keep ? prev : pick || faction.divisions?.[0] || "";
}

/** Show the free-text inputs that belong to the current selections. */
function wpSyncCustomInputs() {
  const isCustom = FACTION_KEY === "custom";
  const divSel = document.getElementById("wpDivision");
  divSel.classList.toggle("hidden", isCustom);
  document.getElementById("wpDivisionCustom").classList.toggle("hidden", !isCustom && divSel.value !== "__custom__");
  document.getElementById("wpHeadlineCustom").classList.toggle("hidden", wpVal("wpHeadline") !== "__custom__");
  document.getElementById("wpStampFields").classList.toggle("hidden", !wpChecked("wpStamp"));
}

function wpOnDivisionChange() {
  wpSyncCustomInputs();
  wpRender();
}

function wpOnHeadlineChange() {
  wpSyncCustomInputs();
  wpRender();
}

// ── Bulletin type & layout ───────────────────────────────────────────────────
/**
 * @param {"wanted"|"poi"|"missing"} type
 * @param {{render?: boolean}} [opts] pass `render: false` while hydrating
 */
function wpSelectType(type, opts = {}) {
  wpType = WP_TYPES[type] ? type : "wanted";
  const t = WP_TYPES[wpType];

  document.querySelectorAll("#wpTypeSwitcher .guma-seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === wpType);
  });

  // Headline presets of this type; a custom headline survives the switch
  const sel = document.getElementById("wpHeadline");
  const wasCustom = sel.value === "__custom__";
  sel.innerHTML = "";
  [...t.headlines, "__custom__"].forEach((h) => {
    const o = document.createElement("option");
    o.value = h;
    o.text = h === "__custom__" ? "Custom…" : h;
    sel.appendChild(o);
  });
  sel.value = wasCustom ? "__custom__" : t.headlines[0];

  document.getElementById("wpSubtitleLabel").textContent = t.subtitleLabel;
  document.getElementById("wpSubtitle").placeholder = t.subtitlePlaceholder;
  document.getElementById("wpSubjectTitle").textContent = t.subjectTitle;
  document.getElementById("wpDetailsTitle").textContent = t.detailsTitle;
  document.getElementById("wpCautionText").placeholder = t.caution;
  document.getElementById("wpChargesSection").classList.toggle("hidden", !t.charges);
  document.getElementById("wpWeaponRow").classList.toggle("hidden", wpType === "missing");
  // The stamp wording follows the type until somebody actually stamps it
  if (!wpChecked("wpStamp")) document.getElementById("wpStampText").value = t.stamp;

  wpSyncCustomInputs();
  if (opts.render !== false) wpRender();
}

/**
 * @param {"modern"|"classic"} layout
 * @param {{render?: boolean}} [opts]
 */
function wpSelectLayout(layout, opts = {}) {
  wpLayout = layout === "classic" ? "classic" : "modern";
  document.querySelectorAll("#wpLayoutSwitcher .guma-seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === wpLayout);
  });
  if (opts.render !== false) wpRender();
}

// ── Charges rows ─────────────────────────────────────────────────────────────
function wpAddCharge(code, desc) {
  const box = document.getElementById("wpChargeRows");
  if (box.children.length >= WP_MAX_CHARGES) return;
  const row = document.createElement("div");
  row.className = "wp-charge-row flex items-center gap-2";
  row.innerHTML = `
    <input type="text" class="guma-input wp-charge-code !w-28 shrink-0" placeholder="PC 211" aria-label="Code" />
    <input type="text" class="guma-input wp-charge-desc" placeholder="Robbery" aria-label="Charge" />
    <button type="button" onclick="wpRemoveCharge(this)" aria-label="Remove charge"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition
                   text-red-500 hover:bg-red-500/10 dark:text-red-400">✕</button>
  `;
  row.querySelector(".wp-charge-code").value = code || "";
  row.querySelector(".wp-charge-desc").value = desc || "";
  box.appendChild(row);
  GumaFit.applyCapsBySelector(row, WP_MAXLEN);
  wpSyncChargeButton();
  wpRender();
}

function wpRemoveCharge(btn) {
  btn.closest(".wp-charge-row")?.remove();
  wpSyncChargeButton();
  wpRender();
}

function wpSyncChargeButton() {
  const btn = document.getElementById("wpAddChargeBtn");
  const full = document.getElementById("wpChargeRows").children.length >= WP_MAX_CHARGES;
  btn.disabled = full;
  btn.classList.toggle("opacity-40", full);
}

// ── Images ───────────────────────────────────────────────────────────────────
const WP_IMAGES = {
  photo: { text: "wpPhotoText", preview: "wpPhotoPreview", clear: "wpPhotoClear", idle: "Click to upload photo" },
  photo2: { text: "wpPhoto2Text", preview: "wpPhoto2Preview", clear: "wpPhoto2Clear", idle: "Click to upload photo" },
  logo: { text: "wpLogoText", preview: "wpLogoPreview", clear: "wpLogoClear", idle: "Click to upload logo" },
};

/** Point one image slot at a data URL (or null), keeping its dropzone in step. */
function wpSetImage(kind, url, crop) {
  if (kind === "photo") {
    wpPhotoURL = url;
    wpCrop.setSource(url, crop);
  } else if (kind === "photo2") {
    wpPhoto2URL = url;
    wpCrop2.setSource(url, crop);
  } else {
    if (wpLogoURL) delete wpImgCache[wpLogoURL];
    wpLogoURL = url;
  }
  const ui = WP_IMAGES[kind];
  const prev = document.getElementById(ui.preview);
  if (prev) {
    if (url) {
      prev.src = url;
      prev.classList.remove("hidden");
      prev.style.display = "";
    } else {
      prev.removeAttribute("src");
      prev.classList.add("hidden");
    }
  }
  document.getElementById(ui.text).textContent = url ? "Click to change image" : ui.idle;
  document.getElementById(ui.clear).classList.toggle("hidden", !url);
}

function wpClearImage(kind) {
  wpSetImage(kind, null);
  wpRender();
}

// ── Export ───────────────────────────────────────────────────────────────────
function wpFileName() {
  const slug = (wpVal("wpName") || wpType).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `wanted_poster_${slug || "poster"}.png`;
}

async function wpDownload() {
  const canvas = wpCanvas();
  const a = document.createElement("a");
  a.download = wpFileName();
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function wpCopy() {
  const canvas = wpCanvas();
  if (!(await GumaClipboard.copyCanvas(canvas))) return;
  const newCount = await window.GumaCounters?.trackDownload("wanted");
  const countEl = document.getElementById("downloadCount");
  if (newCount != null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
  // The button lives in the export preview modal.
  GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
}

// ── Saved posters: serialize / hydrate / wiring ──────────────────────────────
/** Every id'd control in the form, so a new field is saved without a list to keep. */
function wpFormControls() {
  return [...document.querySelectorAll("#wpForm input[id], #wpForm select[id], #wpForm textarea[id]")].filter((el) => el.type !== "file");
}

async function wpSerializeState() {
  const fields = {};
  wpFormControls().forEach((el) => {
    fields[el.id] = el.type === "checkbox" ? el.checked : el.value;
  });
  const charges = [...document.querySelectorAll("#wpChargeRows .wp-charge-row")].map((row) => ({
    code: row.querySelector(".wp-charge-code")?.value ?? "",
    desc: row.querySelector(".wp-charge-desc")?.value ?? "",
  }));

  // Fitted inside the slot rather than cropped to it: the framing is stored
  // alongside and re-applied on restore (same reasoning as js/app.js). Two
  // photos per entry would eat the storage quota as PNG, so they go as JPEG;
  // the logo keeps PNG for its transparency.
  const down = (url, w, h, format) => (url ? GumaHistory._downscaleAvatar(url, w, h, "contain", format) : null);
  return {
    FACTION_KEY,
    type: wpType,
    layout: wpLayout,
    fields,
    charges,
    photoDataUrl: await down(wpPhotoURL, WP_PHOTO_W, WP_PHOTO_H, "jpeg"),
    photoCrop: wpCrop.getState(),
    photo2DataUrl: await down(wpPhoto2URL, WP_PHOTO2_W, Math.round(WP_PHOTO2_W * 0.75), "jpeg"),
    photo2Crop: wpCrop2.getState(),
    logoDataUrl: FACTION_KEY === "custom" ? await down(wpLogoURL, 256, 256) : null,
  };
}

function wpHydrateState(p) {
  if (!p) return;
  const fk = p.FACTION_KEY === "custom" || FACTIONS[p.FACTION_KEY] ? p.FACTION_KEY : "lspd";
  const f = p.fields || {};

  // Faction and type first: they rebuild the division and headline options
  // the saved values are then picked from.
  GumaHistoryWiring.setVal("wpCustomAgency", f.wpCustomAgency);
  switchFaction(fk);
  wpSelectType(p.type || "wanted", { render: false });
  wpSelectLayout(p.layout || "modern", { render: false });

  wpFormControls().forEach((el) => {
    if (!(el.id in f)) return;
    if (el.type === "checkbox") el.checked = !!f[el.id];
    else GumaHistoryWiring.setVal(el.id, f[el.id]);
  });
  if (fk === "custom") applyCustomFaction();

  const box = document.getElementById("wpChargeRows");
  box.innerHTML = "";
  (p.charges || []).slice(0, WP_MAX_CHARGES).forEach((c) => wpAddCharge(c.code, c.desc));
  wpSyncChargeButton();

  wpSetImage("photo", p.photoDataUrl || null, p.photoCrop);
  wpSetImage("photo2", p.photo2DataUrl || null, p.photo2Crop);
  wpSetImage("logo", fk === "custom" ? p.logoDataUrl || null : null);

  wpSyncCustomInputs();
  wpRender();
}

function wpBuildLabel(p) {
  const f = p.fields || {};
  const t = WP_TYPES[p.type] || WP_TYPES.wanted;
  const name = (f.wpName || "").trim() || t.unknownName;
  const head = f.wpHeadline === "__custom__" ? (f.wpHeadlineCustom || "").trim() : f.wpHeadline;
  return `${name} - ${(head || t.headlines[0]).toUpperCase()}`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
function initWantedPoster({ defaultFaction = "lspd" } = {}) {
  const urlFaction = new URLSearchParams(window.location.search).get("faction");
  FACTION_KEY = urlFaction && FACTIONS[urlFaction]?.type === FACTION_TYPE.POLICE ? urlFaction : defaultFaction;
  faction = FACTIONS[FACTION_KEY];

  buildFactionSwitcher(switchFaction, FACTION_KEY, FACTION_TYPE.POLICE);
  wpPopulateDivisions();
  document.getElementById("wpIssueDate").value = wpTodayIso();
  wpSelectType("wanted", { render: false });
  wpSelectLayout("modern", { render: false });
  GumaFit.applyCapsBySelector(document, WP_MAXLEN);
  wpAddCharge();

  const host = document.querySelector(".guma-pc-wrap");
  const canvas = wpCanvas();
  wpCrop.attach({ canvas, host, redraw: wpRender });
  wpCrop2.attach({ canvas, host, redraw: wpRender });

  [
    ["photo", "wpPhotoDrop", "wpPhotoInput"],
    ["photo2", "wpPhoto2Drop", "wpPhoto2Input"],
    ["logo", "wpLogoDrop", "wpLogoInput"],
  ].forEach(([kind, zone, input]) => {
    window.GumaUpload.init({
      zone,
      input,
      onLoad: (dataURL) => {
        // A new photo always starts from the default framing.
        wpSetImage(kind, dataURL);
        wpRender();
      },
    });
  });

  const form = document.getElementById("wpForm");
  form.addEventListener("input", wpSchedule);
  form.addEventListener("change", (e) => {
    if (e.target.id === "wpCustomAgency" && FACTION_KEY === "custom") applyCustomFaction();
    if (e.target.id === "wpStamp" && e.target.checked && !wpVal("wpStampDate")) {
      document.getElementById("wpStampDate").value = wpTodayIso();
    }
    wpSyncCustomInputs();
    wpSchedule();
  });
  // The custom agency name is printed live, not only once the field blurs
  document.getElementById("wpCustomAgency").addEventListener("input", () => {
    if (FACTION_KEY === "custom") applyCustomFaction();
  });

  wpRender();

  // The preview modal delegates export here so counters and history keep firing.
  window.GumaExport = {
    download: wpDownload,
    copy: wpCopy,
    canvas: wpCanvas,
  };

  GumaHistoryWiring.register({
    key: "wanted",
    noun: "poster",
    serialize: wpSerializeState,
    hydrate: wpHydrateState,
    buildLabel: wpBuildLabel,
    buildFaction: (p) =>
      GumaHistoryWiring.buildFaction(p, {
        customShort: (pp) => (pp.fields?.wpCustomAgency || "").trim(),
      }),
  });
}
