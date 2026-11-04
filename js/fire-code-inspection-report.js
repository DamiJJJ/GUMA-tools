"use strict";

// ── Fire Code Inspection Report ───────────────────────────────────────────────
// The fire department's one-page Official Inspection Report: seal header,
// premises block, the red violation notice, twelve numbered fire code items
// with their inline sub-boxes and fill-in blanks, an "Other" line and the
// inspector's sign-off. One table (FI_ITEMS) drives the form, the document and
// the saved payload, so the three can never disagree.

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Agency ────────────────────────────────────────────────────────────────────
// LSCoFD / LSFD carry their document wording in FACTIONS[key].inspection.
// Custom has no seal: the typed name replaces the two header lines and the
// rest of the wording turns generic.
let FACTION_KEY = "lscofd";
const DEFAULT_CUSTOM_AGENCY = "FIRE DEPARTMENT";

function fiRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function fiChecked(id) {
  return !!document.getElementById(id)?.checked;
}

/** ISO yyyy-mm-dd -> the document's own mm/dd/yyyy. */
function fmtDate(raw) {
  if (!raw) return "";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

/** "LOS SANTOS COUNTY FIRE CODE" -> "Los Santos County Fire Code" for form copy. */
function fiTitleCase(s) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Custom agency header in print caps. Blank falls back to the default. */
function customAgencyName() {
  return (fiRawVal("agency_name").trim() || DEFAULT_CUSTOM_AGENCY).toUpperCase();
}

/** "BLAINE COUNTY FIRE DEPARTMENT" -> "BLAINE COUNTY FIRE CODE"; anything else is a local code. */
function customFireCode(name) {
  const base = name.replace(/\s+FIRE\s+(DEPARTMENT|DEPT\.?)$/, "").trim();
  return base && base !== name ? base + " FIRE CODE" : "LOCAL FIRE CODE";
}

/** Document wording for the active agency. */
function fiAgency() {
  const f = FACTION_KEY !== "custom" && typeof FACTIONS !== "undefined" ? FACTIONS[FACTION_KEY] : null;
  if (f && f.inspection) return { ...f.inspection, seal: f.icon, reg: f.short };
  const name = customAgencyName();
  return {
    header: [name],
    seal: null,
    address: "",
    fireCode: customFireCode(name),
    gov: "Department",
    reg: "Department",
    hotline: "(800) 555-0100",
    fraudWeb: "",
  };
}

/** Headquarters line under the title. Blank falls back to the agency's own. */
function fiAddress(a) {
  return (fiRawVal("hq_address").trim() || a.address).toUpperCase();
}

/** %NAME% placeholders the item and notice texts share. */
function fiTextVars(a) {
  return {
    REG: a.reg,
    GOV: a.gov,
    FIRECODE: a.fireCode,
    HOTLINE: a.hotline,
    FRAUDWEB: a.fraudWeb ? " or " + a.fraudWeb : "",
  };
}

const fiFill = (src, vars) => src.replace(/%(\w+)%/g, (_, k) => vars[k] ?? "");

// ── Seal images ───────────────────────────────────────────────────────────────
// Loaded once per path; a seal that arrives after the first paint redraws.
const fiSeals = {};

function fiSeal(src) {
  if (!src) return null;
  let img = fiSeals[src];
  if (!img) {
    img = fiSeals[src] = new Image();
    img.onload = () => refreshPreview();
    img.src = src;
  }
  return img.complete && img.naturalWidth ? img : null;
}

// ── Items ─────────────────────────────────────────────────────────────────────
// Item text markup, read by fiParse():
//   [id]  tick box bound to checkbox #id (its form label lives in `labels`)
//   {id}  fill-in blank bound to input #id (spec in `blanks`; w: 0 = rest of
//         the line, owner = the box it belongs to)
//   *..*  bold    ~..~  italic    \n  new line (item 8's system sub-list)
//   %REG% %GOV% %FIRECODE% %HOTLINE% %FRAUDWEB%  agency wording, see fiTextVars()
const FI_ITEMS = [
  {
    n: 1,
    title: "Building Address Numbers/Street Signs",
    text:
      "Buildings shall have approved address numbers, building numbers or approved building identification placed in a position that is " +
      "plainly legible and visible from the street or road fronting the property. Numbers shall contrast with their background. Numbers " +
      "shall be a minimum of 4 inches high with a minimum stroke width of 0.5 inch (F.C. 505.1). [v1_a] Private streets and roads shall be " +
      "provided with an approved weather resistant street sign at each street intersection to clearly indicate the name of the streets (F.C. 505.2).",
    labels: { v1_a: "Private street signs at each intersection" },
  },
  {
    n: 2,
    title: "Fire Apparatus Access Roads",
    text:
      "An approved fire apparatus access road shall be provided to within 150' of all first floor exterior walls of a building and to all " +
      "portions of a facility. Fire access roads dimensions and specifications shall be maintained as originally approved and kept clear of " +
      "obstructions (F.C. 503). [v2_a] Provide fire lane designation as per %REG% Regulation #15 (F.C. 503.3, %REG% Regulation #15). " +
      "[v2_b] Security gates across a fire access road shall have an approved means of emergency operation (F.C. 503.6, %REG% Regulation #5).",
    labels: { v2_a: "Provide fire lane designation", v2_b: "Emergency operation of security gates" },
  },
  {
    n: 3,
    title: "Limited Access Device",
    text:
      "Except for one and two family unit residential dwellings, when access to or within a structure or area is restricted because of " +
      "secured openings or where immediate access is necessary for life-saving or fire-fighting purposes the fire code official is authorized " +
      "to require a key box to be installed in an approved location. The key box shall be of an approved type and shall contain keys to gain " +
      "necessary access by the fire code official. The operator of the building or area shall immediately notify the fire code official and " +
      "provide a new key when a lock is re-keyed (F.C. 506, %REG% Regulation #5).",
  },
  {
    n: 4,
    title: "Obstructions to Water Supplies and Fire Protection Equipment",
    text:
      "Posts, fences, vehicles, growth, trash, storage or other material or objects shall not be located near fire hydrants, fire department " +
      "inlet connections, or fire protection system control valves in a manner that would prevent such equipment or fire hydrants from being " +
      "immediately discernible. A three foot clear space shall be maintained around the circumference of fire hydrants. (F.C. 508.5.4, 508.5.5).",
  },
  {
    n: 5,
    title: "Means of Egress for Buildings",
    text:
      "Required exit ways shall be continuously maintained free from obstruction or impediments to use in the case of fire or other emergency " +
      "when the areas served by such exits are occupied. [v5_a] Repair exit hardware. [v5_b] Remove any unapproved device such as locks, " +
      "latches, chains, bars, or bolts that prevents or hinders the unlatching of any exit door for exiting purposes or would require more " +
      "than one operation to unlatch or would require the use of a key or special knowledge to operate unless allowed by the fire code. " +
      "[v5_c] Remove obstructions from exit access, the exit, and the exit discharge. [v5_d] Test/Repair illuminated exit signs. " +
      "[v5_e] Test/Repair automatic emergency egress illumination system (~F.C. 1006, 1008, 1027, 1028~).",
    labels: {
      v5_a: "Repair exit hardware",
      v5_b: "Remove unapproved locking devices",
      v5_c: "Remove obstructions from exits",
      v5_d: "Test/repair illuminated exit signs",
      v5_e: "Test/repair emergency egress illumination",
    },
  },
  {
    n: 6,
    title: "Security Bars on Bedroom Windows/Emergency Escapes",
    text:
      "Emergency escape openings shall be maintained and operational from the inside of the room without the use of keys, tools, or special " +
      "effort. (~F.C. 1026.4, 1028.6~).",
  },
  {
    n: 7,
    title: "Smoke Alarms",
    text:
      "SA SFM approved and listed single and multi-station smoke alarms shall be installed as per F.C. 907.2.10. [v7_a] Smoke alarms shall " +
      "be inspected, tested, and maintained. (~F.C. 907.2.10~).",
    labels: { v7_a: "Inspect, test and maintain smoke alarms" },
  },
  {
    n: 8,
    title: "Fire Protection System Inspection, Testing, and Maintenance",
    text:
      "Fire detection, alarm, and extinguishing systems shall be maintained in an operative condition at all times and replaced or repaired " +
      "where defective. (F.C. 901.6, 904.1) [v8_a] Records of all system inspections, tests, and maintenance shall be maintained on the " +
      "premise for a minimum of three years and shall be copied to the fire code official upon request. All testing or maintenance " +
      "activities must be performed by a properly State licensed company. A SFM approved tag shall be affixed to extinguishing systems by a " +
      "properly State licensed company as proof of service. (~F.C. 901, San Andreas Code of Regulations (SACR) Title 19, Chapter 3~)\n" +
      "[v8_b] *Water-Based Fire Protection Systems* as per SACR Title 19 Chapter 5. Provide SA SFM NFPA 25 AES 1-9 forms for recording all " +
      "service activities.\n" +
      "[v8_c] *Fixed Fire Extinguishing Systems* every six months or after system activation. (F.C. 904.1, ~SACR Title 19 Chapter 5~).\n" +
      "[v8_d] *Fire Alarm Systems* as per F.C. 907.20.5 & SA SFM amended NFPA 72. Provide copies of service records as proof of required service.",
    labels: {
      v8_a: "Keep inspection and test records (3 years)",
      v8_b: "Water-based fire protection systems",
      v8_c: "Fixed fire extinguishing systems",
      v8_d: "Fire alarm systems",
    },
  },
  {
    n: 9,
    title: "Electrical",
    text:
      "Electrical hazards in permanent wiring systems shall be abated and referred to the electrical code official (~F.C. 605.1~). " +
      '[v9_a] Doors to electric control panel rooms shall be marked with a plainly visible sign stating "ELECTRICAL ROOM" (~F.C. 605.3.1~) ' +
      "[v9_b] Multiplug adapters used shall comply with the Electrical Code (~F.C. 605.4~) [v9_c] Power taps used shall be polarized or " +
      "grounded, have over-current protection and be UL 1363 listed (~F.C. 605.4.1~). [v9_d] Extension cords and flexible cords shall not be " +
      "a substitute for permanent wiring; not affixed to structures; not extended through walls, ceilings, floors, under doors, under floor " +
      "coverings, nor be subjected to environmental or physical damage; and use only with portable appliances. Extension cords shall be " +
      "plugged directly into an approved receptacle, power tap, or multiplug adaptor and, except for approved multiplug extension cords, shall " +
      "serve only one portable appliance. Extension cords shall be maintained in good condition (~F.C. 605.5~). [v9_e] Open junction boxes " +
      "and open wiring splices shall be prohibited. Approved covers shall be provided on all switch and electrical outlet boxes (~F.C. 605.6~).",
    labels: {
      v9_a: '"Electrical Room" door sign',
      v9_b: "Multiplug adapters",
      v9_c: "Power taps",
      v9_d: "Extension cords",
      v9_e: "Open junction boxes / wiring splices",
    },
  },
  {
    n: 10,
    title: "Storage",
    text:
      "Storage of combustible materials in buildings shall be orderly. Storage shall be separated from heaters or heating devices by distance " +
      "or shielding so that ignition can not occur (F.C. 315.2). [v10_a] Outside storage of combustible material shall comply with height " +
      "and property line separations. (F.C. 315.3).",
    labels: { v10_a: "Outside combustible storage" },
  },
  {
    n: 11,
    title: "Portable Fire Extinguishers",
    text:
      "Portable fire extinguishers shall be provided in new and existing Group A, B, E, H, I, M, R-1, R-2, R-4, and S occupancies; within " +
      "30' of commercial cooking equipment; in areas where flammable or combustible liquids are stored, used, or dispensed; on each floor of " +
      "structures under construction (except R-3); in special hazard areas; in large and small family daycare homes; and areas listed in Fire " +
      "Code Table 906.1. [v11_a] Provide {v11_rating} U.L. listed Class/Rated fire extinguisher(s) to be located {v11_location} as per Fire " +
      "Code Table 906.3(1) & (2) (~F.C. 906~). [v11_b] Portable fire extinguishers must be serviced annually or after use by a properly State " +
      "licensed company (~F.C. 906.2, SACR Title 19 Chapter 3~).",
    labels: { v11_a: "Provide fire extinguishers", v11_b: "Annual extinguisher service" },
    blanks: {
      v11_rating: { w: 84, label: "Extinguishers (Qty / Rating)", placeholder: "(3) 2-A:10-B:C", owner: "v11_a" },
      v11_location: { w: 120, label: "To Be Located", placeholder: "Loading dock and each exit", owner: "v11_a" },
    },
  },
  {
    n: 12,
    title: "Permits",
    text:
      "Prior to conducting regulated operations or establishing regulated conditions, a permit issued by the fire department is required for " +
      "{v12_permit} [v12_a] Issued permits shall be kept on the premise at all times and readily available for inspection. [v12_b] Correct " +
      "condition(s) in violation of existing permit requirements and limitations (F.C. 105 App. Ch 1).",
    labels: { v12_a: "Keep issued permits on the premises", v12_b: "Correct permit violations" },
    blanks: {
      v12_permit: { w: 0, label: "Permit Required For", placeholder: "Storage of compressed gases" },
    },
  },
];

const FI_NOTICE =
  "*THE ADDRESSED PROPERTY IS IN VIOLATION OF THE [code_local] %FIRECODE% [code_state] ~SAN ANDREAS FIRE CODE~ " +
  "[code_regs] ~SAN ANDREAS CODE OF REGULATIONS TITLE 19~. CHECKED ITEMS MUST BE CORRECTED IMMEDIATELY. A RE-INSPECTION IS " +
  "SCHEDULED TO BE CONDUCTED ON THE DATE OF {reinspection_date}, FAILURE TO COMPLY CAN RESULT IN LEGAL ACTION.*";
const FI_NOTICE_LABELS = {
  code_local: "Local Fire Code",
  code_state: "San Andreas Fire Code",
  code_regs: "San Andreas Code of Regulations Title 19",
};
const FI_NOTICE_BLANKS = { reinspection_date: { w: 64, kind: "date", label: "Re-Inspection Date" } };

const FI_DISCLAIMER =
  "It is improper and illegal for any %GOV% officer, employee or inspector to solicit bribes, gifts or gratuities in connection with " +
  "performing their official duties. Improper solicitations include requests for anything of value such as cash, discounts, and free " +
  "services paid travel or entertainment, or tangible items such as food or beverages. Any attempt by a %GOV% employee to solicit bribes, " +
  "gifts or gratuities for any reason should be reported immediately to either the %GOV% manager responsible for supervising the employee " +
  "or the Fraud Hotline at %HOTLINE%%FRAUDWEB%. *YOU MAY REMAIN ANONYMOUS.*";

// ── Markup parser ─────────────────────────────────────────────────────────────
/**
 * Item markup -> tokens. Each token records whether whitespace preceded it
 * (sp); a line may only break where sp is true, so "(F.C." never drifts away
 * from its bracket and "(s)" stays on its word.
 */
function fiParse(src, blanks) {
  const out = [];
  let b = false;
  let i = false;
  let sp = false;
  src.split(/(\[\w+\]|\{\w+\}|[*~\n])/).forEach((part) => {
    if (!part) return;
    if (part === "*") return void (b = !b);
    if (part === "~") return void (i = !i);
    if (part === "\n") {
      out.push({ t: "br" });
      sp = false;
      return;
    }
    const box = part.match(/^\[(\w+)\]$/);
    if (box) {
      out.push({ t: "box", id: box[1], sp });
      sp = false;
      return;
    }
    const blank = part.match(/^\{(\w+)\}$/);
    if (blank) {
      out.push({ ...((blanks || {})[blank[1]] || {}), t: "blank", id: blank[1], sp });
      sp = false;
      return;
    }
    if (/^\s/.test(part)) sp = true;
    part
      .split(/\s+/)
      .filter(Boolean)
      .forEach((text, k) => out.push({ t: "word", text, b, i, sp: k ? true : sp }));
    sp = /\s$/.test(part);
  });
  return out;
}

/** Every box and blank inside an item's text, in document order. */
function fiItemParts(it) {
  return fiParse(it.text, it.blanks).filter((t) => t.t === "box" || t.t === "blank");
}

// ── Field catalogs (derived from the tables above) ────────────────────────────
const FI_ITEM_PARTS = FI_ITEMS.map(fiItemParts);
const FI_CHECK_IDS = [
  "rp_owner",
  "rp_occupant",
  ...Object.keys(FI_NOTICE_LABELS),
  ...FI_ITEMS.map((it) => "v" + it.n),
  ...FI_ITEM_PARTS.flat()
    .filter((p) => p.t === "box")
    .map((p) => p.id),
  "v_other",
];
const FI_TEXT_IDS = [
  "agency_name",
  "hq_address",
  "jurisdiction",
  "inspection_date",
  "site_address",
  "business_name",
  "bus_phone",
  "responsible_party",
  "emg_phone",
  "occupancy_type",
  "construction_type",
  "bldg_sqft",
  "reinspection_date",
  ...FI_ITEM_PARTS.flat()
    .filter((p) => p.t === "blank")
    .map((p) => p.id),
  "other_text",
  "inspector_signature",
  "inspector_name",
  "info_phone",
];

// ── Canvas layout constants (logical pixels - rendered xSCALE) ────────────────
const DOC_W = 612; // US Letter at 72 dpi, like the paper form
const LETTER_H = Math.round((DOC_W * 11) / 8.5);
const MARGIN = 34;
const RIGHT = DOC_W - MARGIN;
const BODY_W = RIGHT - MARGIN;
const TEXT_X = MARGIN + 26; // numbered item text column
const HEAD_CX = 290; // header block centre, left of page centre to clear Jurisdiction/Shift
const RED = "#cf1f2d";

const LBL_PX = 6.8;
const ROW_H = 15; // premises row pitch
const FIELD_X = MARGIN + 82; // premises: left column values
const MID_X = 398; // premises: end of the left column
const R_LBL_X = 410; // premises: right column labels
const R_VAL_X = 462; // premises: right column values

const ITEM_PX = 6.5;
const ITEM_LH = 7.9;
const ITEM_GAP = 4.5;
const BLANK_PX = 7.5;
const FILL_MIN_W = 90; // a rest-of-line blank narrower than this starts a new line
const OTHER_PX = 9.5;
const OTHER_LH = 14;
const FOOTER_H = 30;

// ── No printed value ends in an ellipsis ─────────────────────────────────────
// Values shrink to fit (GumaFit) and every input is capped at what its line
// carries at a readable size, so the shrink floor below is never reached.
const VAL_PX = 9.5;
const VAL_MIN_PX = 4.5;
const SIG_PX = 12;
const sigFont = (px) => `italic ${px}px "Times New Roman", Times, serif`;

// Character caps, measured against an all-caps sample at roughly two thirds of
// each value's full size (6.5px for 9.5px lines, 6px for the 7.5px inline
// blanks, 8.5px for the signature). Narrowing a line means re-measuring.
// v12_permit is a rest-of-line blank: its width comes from item 12's own text.
// The Other textarea carries its cap (maxlength) in the markup.
const FI_MAXLEN = {
  agency_name: 70,
  hq_address: 100,
  jurisdiction: 17,
  site_address: 71,
  business_name: 71,
  bus_phone: 26,
  responsible_party: 56,
  emg_phone: 26,
  occupancy_type: 20,
  construction_type: 22,
  bldg_sqft: 26,
  v11_rating: 20,
  v11_location: 30,
  v12_permit: 29,
  inspector_signature: 37,
  inspector_name: 46,
  info_phone: 26,
};

function fiApplyCaps(root) {
  GumaFit.applyCaps(root, FI_MAXLEN);
}

// ── Hitbox registration (gated off during the measuring pass) ────────────────
let REG = true;
function regField(ref, x, y, w, h, opts) {
  if (REG) window.GumaCanvasEdit?.field(ref, x, y, w, h, opts);
}

// ── Primitives ────────────────────────────────────────────────────────────────
/** Tick box; a checked one carries a pen-style X. */
function tickBox(ctx, x, y, size, checked, color = "#000") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  if (!checked) return;
  const p = size * 0.18;
  ctx.lineWidth = Math.max(0.8, size * 0.13);
  ctx.beginPath();
  ctx.moveTo(x + p, y + p);
  ctx.lineTo(x + size - p, y + size - p);
  ctx.moveTo(x + size - p, y + p);
  ctx.lineTo(x + p, y + size - p);
  ctx.stroke();
}

/** Small caps label, left-aligned at its baseline. Returns its width. */
function label(ctx, text, x, y, px = LBL_PX) {
  ctx.fillStyle = "#000";
  ctx.font = px + "px Arial";
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
  return ctx.measureText(text).width;
}

/**
 * A value typed onto a ruled line from x to x2 (baseline y), shrink-to-fit,
 * registered as the field's editor box. An empty value leaves the line bare,
 * as on paper.
 */
function lineValue(ctx, ref, x, x2, y, opts = {}) {
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y + 2, x2 - x, 0.6);
  const raw = fiRawVal(ref).trim();
  const shown = opts.date ? fmtDate(raw) : raw;
  const px = opts.px || VAL_PX;
  if (shown) {
    GumaFit.fitFont(ctx, shown, x2 - x - 6, px, VAL_MIN_PX, opts.font);
    const center = opts.align === "center";
    ctx.textAlign = center ? "center" : "left";
    ctx.fillText(shown, center ? (x + x2) / 2 : x + 3, y);
    ctx.textAlign = "left";
  }
  regField(ref, x, y - 10, x2 - x, 13, {
    kind: opts.date ? "date" : undefined,
    label: opts.label,
    align: opts.align,
    fontPx: Math.min(px, 10),
  });
}

// ── Inline flow: words, tick boxes and fill-in blanks in one paragraph ────────
/**
 * Lay a markup paragraph out from baseline `base` across maxW, justified like
 * the printed form, painting as it goes. Returns the last line's baseline.
 * o: { px, lineH, color, blanks, labels, blankBold }
 */
function fiFlow(ctx, src, x0, base, maxW, o) {
  const color = o.color || "#000";
  const fontOf = (t) => `${t.i ? "italic " : ""}${t.b ? "bold " : ""}${o.px}px Arial`;
  const box = Math.round(o.px * 0.9 * 10) / 10;
  ctx.font = o.px + "px Arial";
  const spaceW = ctx.measureText(" ").width;

  const toks = fiParse(src, o.blanks);
  toks.forEach((t) => {
    if (t.t === "word") {
      ctx.font = fontOf(t);
      t.w = ctx.measureText(t.text).width;
    } else if (t.t === "box") {
      t.w = box;
    } else if (t.t === "blank") {
      t.w = t.w || 0; // 0 = resolved below to the rest of its line
    }
  });

  // Greedy line breaking on units: a token plus everything glued to it.
  const lines = [];
  let line = { toks: [], w: 0, gapAbove: 0 };
  const flush = (justify, nextGap = 0) => {
    line.justify = justify;
    lines.push(line);
    line = { toks: [], w: 0, gapAbove: nextGap };
  };
  for (let k = 0; k < toks.length; ) {
    const t = toks[k];
    if (t.t === "br") {
      if (line.toks.length) flush(false, 2);
      else line.gapAbove = 2;
      k++;
      continue;
    }
    let j = k + 1;
    while (j < toks.length && toks[j].t !== "br" && !toks[j].sp) j++;
    const unit = toks.slice(k, j);
    k = j;
    const fill = unit.find((u) => u.t === "blank" && !u.w);
    let gap = line.toks.length && t.sp ? spaceW : 0;
    let uw = unit.reduce((s, u) => s + u.w, 0);
    if (fill) {
      if (line.toks.length && maxW - line.w - gap - uw < FILL_MIN_W) {
        flush(true);
        gap = 0;
      }
      fill.w = maxW - line.w - gap - uw;
      uw += fill.w;
    } else if (line.toks.length && line.w + gap + uw > maxW) {
      flush(true);
      gap = 0;
    }
    unit.forEach((u, n) => (u.gap = n ? 0 : gap));
    line.toks.push(...unit);
    line.w += gap + uw;
    if (fill) flush(false);
  }
  if (line.toks.length) flush(false);

  let y = base;
  lines.forEach((ln, li) => {
    if (li) y += o.lineH + ln.gapAbove;
    const gaps = ln.toks.filter((t) => t.gap).length;
    let extra = ln.justify && gaps ? (maxW - ln.w) / gaps : 0;
    // A line that would need very wide spaces reads better ragged.
    if (extra > spaceW * 2.5) extra = 0;
    let x = x0;
    ln.toks.forEach((t) => {
      if (t.gap) x += t.gap + extra;
      fiPaintToken(ctx, t, x, y, o, fontOf(t), color, box);
      x += t.w;
    });
  });
  return y;
}

function fiPaintToken(ctx, t, x, y, o, font, color, box) {
  if (t.t === "word") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(t.text, x, y);
  } else if (t.t === "box") {
    tickBox(ctx, x, y - box + 0.6, box, fiChecked(t.id), color);
    regField(t.id, x - 2, y - box - 1.4, box + 4, box + 4, { kind: "check", label: (o.labels || {})[t.id] || t.id });
  } else if (t.t === "blank") {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y + 1.5, t.w, 0.5);
    const raw = fiRawVal(t.id).trim();
    const shown = t.kind === "date" ? fmtDate(raw) : raw;
    if (shown) {
      const weight = o.blankBold ? "bold " : "";
      GumaFit.fitFont(ctx, shown, t.w - 4, BLANK_PX, VAL_MIN_PX, (px) => weight + px + "px Arial");
      ctx.textAlign = "center";
      ctx.fillText(shown, x + t.w / 2, y);
      ctx.textAlign = "left";
    }
    regField(t.id, x, y - 8, t.w, 10.5, { kind: t.kind, label: t.label, align: "center", fontPx: BLANK_PX });
  }
}

/**
 * Greedy wrap onto ruled lines of differing widths (the first "Other" line is
 * shorter than the two under it). Newlines start a new ruled line; a word
 * wider than its line is broken by character. Measures with the current font.
 */
function fiWrapRuled(ctx, text, widths) {
  const out = [];
  const maxW = () => widths[Math.min(out.length, widths.length - 1)];
  text.split("\n").forEach((par) => {
    let line = "";
    par
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width <= maxW()) {
          line = test;
          return;
        }
        if (line) out.push(line);
        let w = word;
        while (w.length > 1 && ctx.measureText(w).width > maxW()) {
          let n = w.length - 1;
          while (n > 1 && ctx.measureText(w.slice(0, n)).width > maxW()) n--;
          out.push(w.slice(0, n));
          w = w.slice(n);
        }
        line = w;
      });
    out.push(line);
  });
  return out;
}

// ── Header ────────────────────────────────────────────────────────────────────
function drawHeader(ctx, a) {
  const seal = fiSeal(a.seal);
  if (seal) {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(seal, MARGIN - 2, 9, 62, 62);
  }

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  if (FACTION_KEY === "custom") {
    // One typed line in place of the two-line agency block, and the header is
    // itself the agency_name field.
    const name = a.header[0];
    GumaFit.fitFont(ctx, name, 300, 9, VAL_MIN_PX, (px) => "bold " + px + "px Arial");
    ctx.fillText(name, HEAD_CX, 31);
    const w = Math.max(160, ctx.measureText(name).width + 10);
    regField("agency_name", HEAD_CX - w / 2, 22, w, 12, {
      label: "Agency Name",
      align: "center",
      fontPx: 9,
      transform: "upper",
    });
  } else {
    ctx.font = "8px Arial";
    a.header.forEach((ln, i) => ctx.fillText(ln, HEAD_CX, 25 + i * 9.5));
  }

  ctx.font = "bold 16px Arial";
  ctx.fillText("OFFICIAL INSPECTION REPORT", HEAD_CX, 52);

  const addr = fiAddress(a);
  GumaFit.fitFont(ctx, addr, 330, 6.6, VAL_MIN_PX);
  ctx.fillText(addr, HEAD_CX, 61);
  const aw = Math.max(200, ctx.measureText(addr).width + 10);
  regField("hq_address", HEAD_CX - aw / 2, 54, aw, 9.5, {
    label: "Headquarters Address",
    align: "center",
    fontPx: 6.6,
    transform: "upper",
  });
  ctx.textAlign = "left";

  label(ctx, "JURISDICTION/SHIFT", 436, 52, 6);
  lineValue(ctx, "jurisdiction", 500, RIGHT, 52, { align: "center", label: "Jurisdiction/Shift" });
  return 72;
}

// ── Premises ──────────────────────────────────────────────────────────────────
function drawPremises(ctx, top) {
  let y = top + 10;
  label(ctx, "ADDRESS", MARGIN, y);
  lineValue(ctx, "site_address", FIELD_X, MID_X, y, { label: "Address" });
  label(ctx, "DATE", R_LBL_X, y);
  lineValue(ctx, "inspection_date", R_VAL_X, RIGHT, y, { align: "center", date: true, label: "Date" });

  y += ROW_H;
  label(ctx, "BUSINESS NAME", MARGIN, y);
  lineValue(ctx, "business_name", FIELD_X, MID_X, y, { label: "Business Name" });
  label(ctx, "BUS PHONE", R_LBL_X, y);
  lineValue(ctx, "bus_phone", R_VAL_X, RIGHT, y, { align: "center", label: "Bus Phone" });

  // Owner / Occupant sit stacked between the party line and EMG PHONE.
  y += ROW_H;
  const boxX = MID_X - 54;
  label(ctx, "RESPONSIBLE PARTY", MARGIN, y);
  lineValue(ctx, "responsible_party", FIELD_X, boxX - 6, y, { label: "Responsible Party" });
  [
    { id: "rp_owner", text: "OWNER", by: y - 5.5 },
    { id: "rp_occupant", text: "OCCUPANT", by: y + 2 },
  ].forEach((o) => {
    tickBox(ctx, boxX, o.by - 5, 5.5, fiChecked(o.id));
    const w = label(ctx, o.text, boxX + 8, o.by, 5.6);
    regField(o.id, boxX - 1.5, o.by - 6.5, w + 11, 7.5, { kind: "check", label: fiTitleCase(o.text) });
  });
  label(ctx, "EMG PHONE", R_LBL_X, y);
  lineValue(ctx, "emg_phone", R_VAL_X, RIGHT, y, { align: "center", label: "EMG Phone" });

  y += ROW_H;
  const occEnd = FIELD_X + 86;
  label(ctx, "TYPE OF OCCUPANCY", MARGIN, y);
  lineValue(ctx, "occupancy_type", FIELD_X, occEnd, y, { align: "center", label: "Type of Occupancy" });
  const consW = label(ctx, "TYPE OF CONSTRUCTION", occEnd + 10, y);
  lineValue(ctx, "construction_type", occEnd + 14 + consW, MID_X, y, { align: "center", label: "Type of Construction" });
  label(ctx, "#BLDG/SQ FT", R_LBL_X, y);
  lineValue(ctx, "bldg_sqft", R_VAL_X, RIGHT, y, { align: "center", label: "#Bldg/Sq Ft" });
  return y + 6;
}

// ── Violation notice + numbered items ─────────────────────────────────────────
function drawNotice(ctx, top, vars) {
  const last = fiFlow(ctx, fiFill(FI_NOTICE, vars), MARGIN, top + 13, BODY_W, {
    px: 6.8,
    lineH: 8.4,
    color: RED,
    blanks: FI_NOTICE_BLANKS,
    labels: FI_NOTICE_LABELS,
    blankBold: true,
  });
  return last + 4;
}

function drawItems(ctx, top, vars) {
  let y = top + 13;
  FI_ITEMS.forEach((it, i) => {
    if (i) y += ITEM_LH + ITEM_GAP;
    const id = "v" + it.n;
    tickBox(ctx, MARGIN + 1, y - 6.6, 7.4, fiChecked(id));
    ctx.fillStyle = "#000";
    ctx.font = `bold ${ITEM_PX}px Arial`;
    ctx.textAlign = "right";
    ctx.fillText(it.n + ".", TEXT_X - 5, y);
    ctx.textAlign = "left";
    const titleW = ctx.measureText(it.title + ":").width;
    const first = y;
    y = fiFlow(ctx, `*${it.title}:* ` + fiFill(it.text, vars), TEXT_X, y, RIGHT - TEXT_X, {
      px: ITEM_PX,
      lineH: ITEM_LH,
      blanks: it.blanks,
      labels: it.labels,
    });
    // Box, number and bold title are one hit strip. Registered after the
    // paragraph: the strip's lower edge grazes a sub-box on the line below,
    // and the first match wins, so the small box has to come first.
    regField(id, MARGIN - 1, first - 8.6, TEXT_X - MARGIN + titleW + 3, 11, { kind: "check", label: `${it.n}. ${it.title}` });
  });
  return y + 4;
}

// ── Other ─────────────────────────────────────────────────────────────────────
function drawOther(ctx, top) {
  const base = top + 13;
  tickBox(ctx, MARGIN + 1, base - 6.6, 7.4, fiChecked("v_other"));
  ctx.fillStyle = "#000";
  ctx.font = "bold 7.5px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Other:", TEXT_X - 8, base);
  const lw = ctx.measureText("Other:").width;
  regField("v_other", MARGIN - 1, base - 8.6, TEXT_X - 8 - MARGIN + lw + 3, 11, { kind: "check", label: "Other" });

  // First ruled line runs on from the label, the two under it span the body.
  const x1 = TEXT_X - 8 + lw + 6;
  const rows = [x1, MARGIN, MARGIN].map((x, i) => ({ x, y: base + i * OTHER_LH }));
  ctx.fillStyle = "#000";
  rows.forEach((r) => ctx.fillRect(r.x, r.y + 2, RIGHT - r.x, 0.6));

  const raw = fiRawVal("other_text").trim();
  if (raw) {
    // Newline-aware shrink until every line lands on a rule; the textarea
    // maxlength keeps the floor out of reach.
    const widths = rows.map((r) => RIGHT - r.x - 6);
    let px = OTHER_PX;
    let lines = [];
    for (;;) {
      ctx.font = px + "px Arial";
      lines = fiWrapRuled(ctx, raw, widths);
      if (lines.length <= rows.length || px <= VAL_MIN_PX) break;
      px -= 0.5;
    }
    lines.slice(0, rows.length).forEach((l, i) => ctx.fillText(l, rows[i].x + 3, rows[i].y));
  }
  // Starts right of the label so the Other box keeps its own hit strip.
  regField("other_text", x1 - 2, base - 10, RIGHT - x1 + 2, 2 * OTHER_LH + 13, {
    kind: "multiline",
    label: "Other",
    fontPx: OTHER_PX,
  });
  return base + 2 * OTHER_LH + 4;
}

// ── Disclaimer, inspector sign-off, footer ───────────────────────────────────
function drawDisclaimer(ctx, top, vars) {
  return fiFlow(ctx, fiFill(FI_DISCLAIMER, vars), MARGIN, top + 10, BODY_W, { px: 5.5, lineH: 6.6, color: RED }) + 2;
}

function drawInspector(ctx, top) {
  let y = top + 18;
  label(ctx, "FOR INFORMATION CALL:", MARGIN, y);
  lineValue(ctx, "info_phone", MARGIN + 88, MARGIN + 196, y, { align: "center", label: "For Information Call" });
  label(ctx, "INSPECTOR'S SIGNATURE", 296, y);
  lineValue(ctx, "inspector_signature", 392, RIGHT, y, { font: sigFont, px: SIG_PX, label: "Inspector's Signature" });
  y += 17;
  label(ctx, "INSPECTOR (PRINT NAME)", 296, y);
  lineValue(ctx, "inspector_name", 392, RIGHT, y, { label: "Inspector (Print Name)" });
  return y + 6;
}

function drawFooter(ctx, y) {
  label(ctx, "Form 410 Rev. 05/08", MARGIN, y, 5.6);
  [
    ["WHITE", " - Occupant Initial Inspection"],
    ["CANARY", " - Follow-up/Referral"],
    ["PINK", " - Station Prevention File"],
  ].forEach(([tag, rest], i) => {
    const x = MARGIN + 128 + i * 138;
    ctx.font = "bold 6.4px Arial";
    ctx.fillText(tag, x, y);
    const tw = ctx.measureText(tag).width;
    label(ctx, rest, x + tw, y, 6.4);
  });
}

// ── Main draw ─────────────────────────────────────────────────────────────────
/** Paint the whole document onto ctx and return where its content ends. */
function paintDoc(ctx, pageH) {
  const a = fiAgency();
  const vars = fiTextVars(a);
  let y = drawHeader(ctx, a);
  y = drawPremises(ctx, y);
  y = drawNotice(ctx, y, vars);
  y = drawItems(ctx, y, vars);
  y = drawOther(ctx, y);
  y = drawDisclaimer(ctx, y, vars);
  y = drawInspector(ctx, y);
  drawFooter(ctx, pageH - 16);
  return y;
}

// The page is a letter sheet unless the content runs past it. The content
// height is measured rather than hand-summed: one silent pass against a
// scratch canvas with hitbox registration off.
let fiScratch = null;
function measureDocH() {
  fiScratch = fiScratch || document.createElement("canvas").getContext("2d");
  REG = false;
  try {
    return Math.ceil(paintDoc(fiScratch, 0));
  } finally {
    REG = true;
  }
}

function drawForm() {
  const pageH = Math.max(LETTER_H, measureDocH() + FOOTER_H);
  window.GumaCanvasEdit?.begin({ scale: SCALE });

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = pageH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, pageH);

  paintDoc(ctx, pageH);
  window.GumaCanvasEdit?.end();
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  fiSyncFormLabels();
  drawForm();
}

async function downloadPng() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const a = document.createElement("a");
  a.download = "fire-code-inspection-report.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  if (!(await GumaClipboard.copyCanvas(canvas))) return;

  const newCount = await window.GumaCounters?.trackDownload("fire_inspection");
  const countEl = document.getElementById("downloadCount");
  if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
}

// ── Form ──────────────────────────────────────────────────────────────────────
/** One block per item: its box, then its sub-boxes and blanks in document order. */
function buildViolationRows() {
  const host = document.getElementById("violationsContainer");
  if (!host) return;
  host.innerHTML = FI_ITEMS.map((it, i) => {
    const parent = "v" + it.n;
    const parts = FI_ITEM_PARTS[i]
      .map((p) =>
        p.t === "box"
          ? `<label class="checkbox-item text-[13px]"><input type="checkbox" id="${p.id}" data-fi-parent="${parent}" /> ${it.labels[p.id]}</label>`
          : `<div class="form-group !mb-0">
               <label>${p.label}</label>
               <input type="text" id="${p.id}" data-fi-parent="${parent}" data-fi-owner="${p.owner || ""}" placeholder="${p.placeholder}" />
             </div>`,
      )
      .join("");
    const subs = parts ? `<div class="ml-6 mt-2 flex flex-col gap-2">${parts}</div>` : "";
    return `
      <div class="mb-4">
        <label class="checkbox-item font-semibold"><input type="checkbox" id="${parent}" /> ${it.n}. ${it.title}</label>
        ${subs}
      </div>`;
  }).join("");
}

/**
 * Ticking a sub-box or filling a blank also ticks its numbered item (and a
 * blank's own box). One way only: unticking the item later is allowed. Must
 * be wired before the redraw listeners, so the redraw already sees the parent.
 */
function linkParents() {
  document.querySelectorAll("[data-fi-parent]").forEach((el) => {
    const isBox = el.type === "checkbox";
    el.addEventListener(isBox ? "change" : "input", () => {
      if (!(isBox ? el.checked : el.value.trim())) return;
      [el.dataset.fiOwner, el.dataset.fiParent].forEach((id) => {
        const box = id && document.getElementById(id);
        if (box) box.checked = true;
      });
    });
  });
}

/** Form copy that follows the agency: the local fire code and the HQ placeholder. */
function fiSyncFormLabels() {
  const a = fiAgency();
  const code = document.getElementById("codeLocalLabel");
  if (code) code.textContent = fiTitleCase(a.fireCode);
  const addr = document.getElementById("hq_address");
  if (addr) addr.placeholder = a.address ? fiTitleCase(a.address) : "Station address";
}

// ── Switch agency ─────────────────────────────────────────────────────────────
function switchAgency(key) {
  const known = typeof FACTIONS !== "undefined" && FACTIONS[key] && FACTIONS[key].inspection;
  FACTION_KEY = key === "custom" || known ? key : "lscofd";
  document.querySelectorAll("#factionSwitcher .faction-btn").forEach((b) => b.classList.toggle("active", b.dataset.faction === FACTION_KEY));
  document.getElementById("customAgencyRow")?.classList.toggle("hidden", FACTION_KEY !== "custom");
  refreshPreview();
}

// ── Init ──────────────────────────────────────────────────────────────────────
buildViolationRows();
linkParents();
fiApplyCaps(document);
document.querySelectorAll("input,select,textarea").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});
buildFactionSwitcher(switchAgency, FACTION_KEY, FACTION_TYPE.FIRE);
switchAgency(FACTION_KEY);

// ── Saved reports: serialize / hydrate / wiring ───────────────
function fiSerializeState() {
  const text = {};
  FI_TEXT_IDS.forEach((id) => (text[id] = fiRawVal(id)));
  const checks = {};
  FI_CHECK_IDS.forEach((id) => (checks[id] = fiChecked(id)));
  return { FACTION_KEY, text, checks };
}

function fiHydrateState(payload) {
  if (!payload) return;
  // Every field is about to be overwritten; an open editor would keep showing
  // the value it was opened on and write it back on commit.
  window.GumaCanvasEdit?.cancelEdit();
  const text = payload.text || {};
  FI_TEXT_IDS.forEach((id) => {
    if (id in text) GumaHistoryWiring.setVal(id, text[id]);
  });
  const checks = payload.checks || {};
  FI_CHECK_IDS.forEach((id) => GumaHistoryWiring.setChecked(id, !!checks[id]));
  switchAgency(payload.FACTION_KEY || "lscofd"); // redraws
}

function fiBuildLabel(payload) {
  const t = payload.text || {};
  const who = (t.business_name || t.site_address || "").trim() || "Inspection Report";
  const date = (t.inspection_date || "").trim();
  return date ? `${who} - ${fmtDate(date)}` : who;
}

GumaHistoryWiring.register({
  key: "fire_inspection",
  noun: "report",
  serialize: fiSerializeState,
  hydrate: fiHydrateState,
  buildLabel: fiBuildLabel,
  buildFaction: (p) => GumaHistoryWiring.buildFaction(p, { customShort: (pp) => (pp.text?.agency_name || "").trim() }),
});

// ── Export + WYSIWYG editing wiring ───────────────────────────────────────────
// The preview modal delegates export here so counters and history keep firing.
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
};

window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  host: document.querySelector(".guma-panel-form"),
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "fire_inspection",
});
