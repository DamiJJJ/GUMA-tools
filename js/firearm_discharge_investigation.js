"use strict";

// ── Agency name ───────────────────────────────────────────────────────────────
// This report has no faction switcher: the document's own header is the
// control. It is edited in place from xl and through the #agency_name input
// below that breakpoint.
const DEFAULT_AGENCY = "LOS SANTOS POLICE DEPARTMENT";

/**
 * Header text, in the caps the document prints. Blank falls back to the
 * default, so the source input can stay empty - and an empty source is what
 * raises the dashed empty-field outline over the header.
 */
function agencyName() {
  const el = document.getElementById("agency_name");
  return ((el ? el.value : "").trim() || DEFAULT_AGENCY).toUpperCase();
}

// ── Officer rows counters ─────────────────────────────────────────────────────
let involvedCount = 0,
  witnessingCount = 0,
  civilianCount = 0;

const YN_FIELDS = [
  { id: "in_uniform", label: "In Uniform" },
  { id: "vest", label: "Vest" },
  { id: "on_duty", label: "On Duty" },
  { id: "injured", label: "Injured" },
  { id: "iod", label: "IOD" },
  { id: "light_duty", label: "Light Duty" },
];

function makeYnSelects(prefix) {
  return (
    `<div class="flex flex-wrap gap-2 mt-3 items-end">` +
    YN_FIELDS.map(
      (f) => `
      <div class="form-group !mb-0" style="flex:1;min-width:68px;">
        <label>${f.label}</label>
        <select id="${prefix}_${f.id}">
          <option value="-">-</option>
          <option value="Y">Y</option>
          <option value="N">N</option>
        </select>
      </div>`,
    ).join("") +
    `</div>`
  );
}

function addOfficerRow(type) {
  const container = document.getElementById(type === "involved" ? "involved-officers-container" : "witnessing-officers-container");
  const idx = type === "involved" ? ++involvedCount : ++witnessingCount;
  const prefix = type + "_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.type = type;
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Officer #${idx}</div>
    <button class="btn-remove-row" type="button">✕</button>
    <div class="form-group"><label>Last, First, Middle Initial</label><input type="text" id="${prefix}_name" placeholder="Callahan, Michael R."></div>
    <div class="two-col">
      <div class="form-group"><label>Serial No.</label><input type="text" id="${prefix}_serial" placeholder="50286"></div>
      <div class="form-group"><label>Area/Division</label><input type="text" id="${prefix}_division" placeholder="Patrol Div." class="!text-xs !px-1.5"></div>
    </div>
    <div class="three-col">
      <div class="form-group">
        <label>Sex</label>
        <select id="${prefix}_sex"><option value="-">-</option><option value="M" selected>M</option><option value="F">F</option></select>
      </div>
      <div class="form-group"><label>Desc.</label><input type="text" id="${prefix}_desc" placeholder="-" class="!text-xs !px-1.5"></div>
      <div class="form-group"><label>Ht.</label><input type="text" id="${prefix}_ht" placeholder='5&#39;9"'></div>
    </div>
    <div class="two-col">
      <div class="form-group"><label>Wt.</label><input type="text" id="${prefix}_wt" placeholder="195lbs"></div>
      <div class="form-group"><label>Age</label><input type="text" id="${prefix}_age" placeholder="35"></div>
    </div>
    ${makeYnSelects(prefix)}
  `;
  div.querySelector(".btn-remove-row").addEventListener("click", () => {
    div.remove();
    refreshPreview();
  });
  container.appendChild(div);
  fdApplyCaps(div);
  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  refreshPreview();
}

function addCivilianRow() {
  const container = document.getElementById("civilians-container");
  const idx = ++civilianCount;
  const prefix = "civ_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.type = "civilian";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Civilian #${idx}</div>
    <button class="btn-remove-row" type="button">✕</button>
    <div class="form-group"><label>Last, First, Middle Initial</label><input type="text" id="${prefix}_name" placeholder="Doe, John F."></div>
    <div class="three-col">
      <div class="form-group">
        <label>Sex</label>
        <select id="${prefix}_sex"><option value="-">-</option><option value="M">M</option><option value="F">F</option></select>
      </div>
      <div class="form-group"><label>Desc.</label><input type="text" id="${prefix}_desc" placeholder="-" class="!text-xs !px-1.5"></div>
      <div class="form-group"><label>Ht.</label><input type="text" id="${prefix}_ht" placeholder='5&#39;9"'></div>
    </div>
    <div class="three-col">
      <div class="form-group"><label>Wt.</label><input type="text" id="${prefix}_wt" placeholder="195lbs"></div>
      <div class="form-group"><label>Age</label><input type="text" id="${prefix}_age" placeholder="27"></div>
      <div class="form-group"><label>DOB</label><input type="date" id="${prefix}_dob"></div>
    </div>
    <div class="form-group"><label>Driver Lic. No. / Other ID</label><input type="text" id="${prefix}_dl" placeholder="-"></div>
    <div class="form-group"><label>Occupation</label><input type="text" id="${prefix}_occupation" placeholder="-"></div>
    <div class="two-col">
      <div class="form-group"><label>Address R-</label><input type="text" id="${prefix}_addr_r" placeholder="-"></div>
      <div class="form-group"><label>Phone R-</label><input type="text" id="${prefix}_phone_r" placeholder="-"></div>
    </div>
    <div class="two-col">
      <div class="form-group"><label>E-Mail</label><input type="text" id="${prefix}_email" placeholder="-"></div>
      <div class="form-group"><label>Address B-</label><input type="text" id="${prefix}_addr_b" placeholder="-"></div>
    </div>
    <div class="two-col">
      <div class="form-group"><label>Phone B-</label><input type="text" id="${prefix}_phone_b" placeholder="-"></div>
      <div class="form-group"><label>Cell Phone</label><input type="text" id="${prefix}_cell" placeholder="-"></div>
    </div>
    <div class="form-group"><label>Foreign Language Spoken</label><input type="text" id="${prefix}_lang" placeholder="-"></div>
    <div class="form-group">
      <label>Name/Serial No. of Supervisor &amp; Date/Time/Location</label>
      <input type="text" id="${prefix}_supervisor" placeholder="-">
    </div>
  `;
  div.querySelector(".btn-remove-row").addEventListener("click", () => {
    div.remove();
    refreshPreview();
  });
  container.appendChild(div);
  fdApplyCaps(div);
  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  refreshPreview();
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() || "-" : "-";
}

/** Remove one officer row by container and index (the canvas ✕ chip). */
function removeOfficerRow(type, idx) {
  const cid = type === "involved" ? "involved-officers-container" : "witnessing-officers-container";
  document.querySelector(`#${cid} .dynamic-row[data-idx="${idx}"]`)?.remove();
  refreshPreview();
}

/** Remove one civilian witness block by index (the canvas ✕ chip). */
function removeCivilianRow(idx) {
  document.querySelector(`#civilians-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  refreshPreview();
}

function collectOfficerRows(type) {
  const cid = type === "involved" ? "involved-officers-container" : "witnessing-officers-container";
  return Array.from(document.getElementById(cid).querySelectorAll(".dynamic-row")).map((row) => {
    const p = type + "_" + row.dataset.idx;
    // _p is the input id prefix and doubles as the hitbox ref base.
    const o = { _p: p, _type: type, _idx: row.dataset.idx };
    FD_OFFICER_FIELDS.forEach((k) => (o[k] = getVal(p + "_" + k)));
    return o;
  });
}

function collectCivilianRows() {
  return Array.from(document.getElementById("civilians-container").querySelectorAll(".dynamic-row")).map((row) => {
    const p = "civ_" + row.dataset.idx;
    const o = { _p: p, _idx: row.dataset.idx };
    FD_CIVILIAN_FIELDS.forEach((k) => (o[k] = getVal(p + "_" + k)));
    o.dob = fmtDate(fdRawVal(p + "_dob")); // the document prints mm/dd/yyyy
    return o;
  });
}

/** ISO yyyy-mm-dd -> the document's own mm/dd/yyyy. */
function fmtDate(raw) {
  if (!raw || raw === "-") return "-";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

/** datetime-local yyyy-mm-ddThh:mm -> "mm/dd/yyyy hh:mm". */
function fmtDatetime(raw) {
  if (!raw) return "-";
  const [d, t] = raw.split("T");
  const date = fmtDate(d);
  return t ? `${date} ${t.slice(0, 5)}` : date;
}

// ── Canvas constants ──────────────────────────────────────────────────────────
const MARGIN = 30;
const DOC_W = 580;
const BODY_W = DOC_W - MARGIN * 2;
const SCALE = 2; // internal super-sampling for crisp small text
const OFF_ROW_H = 20;
// 20, not 18: the value baseline sits at y + h - 5 in 9px Arial (~6.5px cap
// height), so an 18px row drives the glyph tops through the 6.5px label.
const CIV_ROW_H = 20;
// Clear strip below a repeatable block that its "+ Add" chip is drawn into.
// Chips are DOM overlay and paint nothing, so the room has to be reserved.
const ADD_CHIP_H = 18;
// Editor floor for the narrow descriptor columns; a 21px cell would otherwise
// open a 21px editor.
const NARROW_EDIT_W = 44;
// Value type sizes. This is a report: an ellipsis silently drops information
// somebody typed, so no printed value is ever allowed to end in one. Two
// mechanisms together guarantee that - values shrink (and where the cell has
// room, wrap) down to a floor, and every input is capped at what its column can
// carry, so the floor is never actually reached. See FD_MAXLEN and js/guma-fit.js.
const OFF_FONT_PX = 8.5;
const OFF_WRAP_PX = 6.5; // starting size for the columns that wrap
const OFF_FONT_MIN_PX = 4.5; // safety net, unreachable with the caps in place
const OFF_WRAP_LINES = 2; // a 20px row fits two lines comfortably
const GRID_FONT_PX = 9;
const GRID_FONT_MIN_PX = 4.5;

// lines: 2 marks a column whose value may wrap inside the row - the two that
// carry free text. basePx starts a column smaller than the rest; Area/Division
// is the narrowest free-text column on the form and reads better small and
// wrapped than large and cut.
const OFF_COLS = [
  { label: "Last Name, First Name, Middle Initial", key: "name", w: 0.225, yn: false, lines: 2 },
  { label: "Serial No.", key: "serial", w: 0.08, yn: false },
  { label: "Area/ Division/ Detail", key: "division", w: 0.09, yn: false, lines: 2, basePx: OFF_WRAP_PX },
  { label: "Sex", key: "sex", w: 0.04, yn: false, kind: "select" },
  { label: "Desc.", key: "desc", w: 0.05, yn: false },
  { label: "Ht.", key: "ht", w: 0.05, yn: false },
  { label: "Wt.", key: "wt", w: 0.05, yn: false },
  { label: "Age", key: "age", w: 0.04, yn: false },
  // Y/N columns are free values backed by a 3-option <select>, not one-of-N
  // boxes the document paints - so they register as fields, not pick chips.
  { label: "In Uniform (Y/N)", key: "in_uniform", w: 0.08, yn: true, kind: "select" },
  { label: "Vest (Y/N)", key: "vest", w: 0.065, yn: true, kind: "select" },
  { label: "On Duty (Y/N)", key: "on_duty", w: 0.07, yn: true, kind: "select" },
  { label: "Injured (Y/N)", key: "injured", w: 0.07, yn: true, kind: "select" },
  { label: "IOD (Y/N)", key: "iod", w: 0.05, yn: true, kind: "select" },
  { label: "Light Duty (Y/N)", key: "light_duty", w: 0.04, yn: true, kind: "select" },
];

// One source of truth for the per-row id suffixes: the draw path, both
// collectors and the serializer all read these.
const FD_OFFICER_FIELDS = OFF_COLS.map((c) => c.key);
const FD_CIVILIAN_FIELDS = [
  "name",
  "sex",
  "desc",
  "ht",
  "wt",
  "age",
  "dob",
  "dl",
  "occupation",
  "addr_r",
  "phone_r",
  "email",
  "addr_b",
  "phone_b",
  "cell",
  "lang",
  "supervisor",
];

// Input length caps, keyed by page-level id or by row-field suffix. The form
// refuses text a column cannot print rather than letting the document swallow
// it: each number is what its cell carries at a readable size. The harness
// fills every one of these to the limit with the widest Latin capital and
// asserts nothing is clipped, so lowering a column's width means re-running it.
const FD_MAXLEN = {
  // page-level
  agency_name: 44,
  fid_no: 14,
  dr_no: 22,
  location: 40,
  rd: 8,
  officer_area: 34,
  area_occurrence: 30,
  // officer rows
  name: 40,
  serial: 8,
  division: 24,
  desc: 4,
  ht: 6,
  wt: 7,
  age: 3,
  // civilian rows
  dl: 22,
  occupation: 26,
  addr_r: 40,
  phone_r: 18,
  email: 34,
  addr_b: 40,
  phone_b: 18,
  cell: 18,
  lang: 22,
  supervisor: 80,
};

// Civilian overrides: the officer table wraps its name over two lines, while a
// civilian name is one line under a label and holds fewer characters.
const FD_MAXLEN_VARIANTS = [{ prefix: "civ_", table: { name: 28 } }];

/** Apply the caps to every text input under a root (page or a fresh row). */
function fdApplyCaps(root) {
  GumaFit.applyCaps(root, FD_MAXLEN, FD_MAXLEN_VARIANTS);
}

// Incident type: four independent checkboxes, each with its own source input.
const INCIDENT_TYPES = [
  { id: "cb_tactical", label: "TACTICAL UNINTENTIONAL DISCHARGE OF A FIREARM", col: 0 },
  { id: "cb_animal", label: "ANIMAL SHOOTING", col: 1 },
  { id: "cb_non_tactical", label: "NON-TACTICAL UNINTENTIONAL DISCHARGE OF A FIREARM", col: 0 },
  { id: "cb_warning", label: "WARNING SHOT", col: 1 },
];

// ── Cell specs bound to an input: value and hitbox ref declared once ──────────
// fdCell / fdDateCell read a page-level input by id; fdRowCell reads an
// already-collected officer or civilian object and derives the id from the row
// prefix carried on it.
const fdCell = (label, id, w, opts) => ({ label, value: getVal(id), w, opts: { ref: id, ...opts } });
const fdDateCell = (label, id, w, opts) => ({
  label,
  value: fmtDate(fdRawVal(id)),
  w,
  opts: { ref: id, kind: "date", ...opts },
});
const fdRowCell = (label, d, key, w, opts) => ({
  label,
  value: d[key] || "-",
  w,
  opts: { ref: d._p ? d._p + "_" + key : undefined, ...opts },
});

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });
  const involvedRows = collectOfficerRows("involved");
  const witnessingRows = collectOfficerRows("witnessing");
  const civilianRows = collectCivilianRows();

  // Height estimate (logical px). Rows are drawn exactly as collected - a
  // removed one disappears and the document shrinks - so every count here is
  // the real one. Each repeatable block also reserves its "+ Add" chip strip.
  const officerSectionH = (n) => 16 + 24 + n * OFF_ROW_H + ADD_CHIP_H;
  const civilianBlockH = 22 + CIV_ROW_H * 3 + 5;
  const headerH = 62; // top margin + faction line + title
  const checksH = 30; // incident-type checkbox block
  const sectionIH = 16 + 26 * 3; // section bar + three grid rows
  const civTitleH = 16;
  const footerH = 30; // form number / page number line + bottom margin
  const A4_HEIGHT = Math.round(DOC_W * 1.4142);
  const contentH =
    headerH +
    checksH +
    sectionIH +
    officerSectionH(involvedRows.length) +
    officerSectionH(witnessingRows.length) +
    civTitleH +
    civilianRows.length * civilianBlockH +
    ADD_CHIP_H +
    footerH;

  const canvasH = Math.max(A4_HEIGHT, contentH);
  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = canvasH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, canvasH);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";

  let y = MARGIN;

  // ── Header — the agency line is itself an editable field ──────────────────
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 10px Arial";
  const agency = agencyName();
  ctx.fillText(agency, DOC_W / 2, y);
  // Header text, not a table cell, so it registers its own hitbox - hugging the
  // line the way the traffic report's state name does, with a floor so a short
  // agency name is still an easy target.
  const agencyW = Math.max(140, ctx.measureText(agency).width + 10);
  window.GumaCanvasEdit?.field("agency_name", DOC_W / 2 - agencyW / 2, y - 9, agencyW, 12, {
    label: "Agency Name",
    align: "center",
    fontPx: 10,
    transform: "upper",
  });
  y += 14;
  ctx.font = "bold 13px Arial";
  ctx.fillText("OFFICER-INVOLVED FIREARM DISCHARGE INVESTIGATION", DOC_W / 2, y);
  y += 18;

  // ── Top checkboxes ────────────────────────────────────────────────────────
  ctx.font = "8.5px Arial";
  ctx.textAlign = "left";
  INCIDENT_TYPES.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const cx = item.col === 0 ? MARGIN : DOC_W / 2 + 5;
    const cy = y + row * 13;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy - 8, 9, 9);
    const el = document.getElementById(item.id);
    if (el && el.checked) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 9px Arial";
      ctx.fillText("X", cx + 1, cy);
      ctx.font = "8.5px Arial";
    }
    ctx.fillStyle = "#000";
    ctx.fillText(item.label, cx + 12, cy);
    // The whole box-plus-label strip toggles on click, clamped to its own
    // column so the left one can never swallow the right one's boxes.
    const colEnd = item.col === 0 ? DOC_W / 2 - 5 : DOC_W - MARGIN;
    const stripW = Math.min(14 + ctx.measureText(item.label).width, colEnd - cx + 2);
    window.GumaCanvasEdit?.field(item.id, cx - 2, cy - 9, stripW, 12, { kind: "check", label: item.label });
  });
  y += 30;

  y = sectionHeader(ctx, "SECTION I. GENERAL INFORMATION", y);
  y = gridRow(ctx, [fdCell("FID No.", "fid_no", 0.35), fdCell("DR No.", "dr_no", 0.65)], y, 26);

  y = gridRow(
    ctx,
    [
      fdDateCell("Date of Incident", "date_incident", 0.22),
      fdCell("Day of Week", "day_of_week", 0.18, { kind: "select" }),
      fdCell("Time", "time_incident", 0.13, { kind: "time" }),
      fdCell("Location of Occurrence", "location", 0.35),
      fdCell("RD", "rd", 0.12),
    ],
    y,
    26,
  );

  y = gridRow(
    ctx,
    [
      {
        label: "Date and Time of this Report",
        value: fmtDatetime(fdRawVal("report_datetime")),
        w: 0.32,
        opts: { ref: "report_datetime", kind: "datetime" },
      },
      fdCell("Officer's Area/Division of Assignment", "officer_area", 0.36),
      fdCell("Area/Division of Occurrence", "area_occurrence", 0.32),
    ],
    y,
    26,
  );

  // Measured across both blocks, so the same column reads at the same size on
  // every officer row in the document.
  const offFonts = offColFonts(ctx, involvedRows.concat(witnessingRows));
  y = officerSection(ctx, "INVOLVED OFFICER(S)", involvedRows, y, "involved", offFonts);
  y = officerSection(ctx, "WITNESSING OFFICER(S)", witnessingRows, y, "witnessing", offFonts);
  y = civilianSection(ctx, civilianRows, y);

  ctx.fillStyle = "#000";
  ctx.font = "8px Arial";
  ctx.textAlign = "left";
  ctx.fillText("01.67.08 (09/19)", MARGIN, canvasH - 12);
  ctx.textAlign = "right";
  ctx.fillText("Page 1 of 1", DOC_W - MARGIN, canvasH - 12);

  window.GumaCanvasEdit?.end();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sectionHeader(ctx, text, y) {
  ctx.fillStyle = "#ddd";
  ctx.fillRect(MARGIN, y, BODY_W, 16);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, BODY_W, 16);
  ctx.fillStyle = "#000";
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "left";
  ctx.fillText(text, MARGIN + 5, y + 11);
  return y + 16;
}

function gridRow(ctx, cells, y, h) {
  let x = MARGIN;
  const widths = cells.map((c) => Math.round(BODY_W * c.w));
  const sum = widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += BODY_W - sum;

  cells.forEach((c, i) => {
    const cw = widths[i];
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cw, h);
    ctx.fillStyle = "#555";
    ctx.font = "6.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(c.label, x + 2, y + 7);
    // The value baseline normally sits 5px off the bottom border, but in a
    // short cell that rides up into the label: 9px Arial has a ~6.5px cap
    // height, so anything above y+14 puts the glyph tops through the label.
    // Labelled cells are one line by construction (the label owns the top), so
    // the value shrinks rather than wraps - but it never ends in an ellipsis.
    const o = c.opts || {};
    ctx.fillStyle = "#000";
    GumaFit.fitFont(ctx, c.value, cw - 4, GRID_FONT_PX, GRID_FONT_MIN_PX);
    ctx.fillText(clip(ctx, c.value, cw - 4), x + 2, Math.max(y + h - 5, y + 14));

    // The cell already knows the exact box an editor needs - hand it over.
    if (o.ref) {
      window.GumaCanvasEdit?.field(o.ref, x, y, cw, h, {
        kind: o.kind,
        label: c.label,
        minEditW: o.minEditW,
      });
    }
    x += cw;
  });
  return y + h;
}

/**
 * One value size per officer column, measured across every officer row in the
 * document. Per row it would render two neighbouring cells of the same column
 * at different sizes, which reads as a bug rather than as a fitted table.
 */
function offColFonts(ctx, rows) {
  const widths = calcWidths(OFF_COLS.map((c) => c.w));
  return OFF_COLS.map((col, i) => {
    if (col.yn) return OFF_FONT_PX;
    const base = col.basePx || OFF_FONT_PX;
    return rows.reduce(
      (px, r) =>
        Math.min(
          px,
          GumaFit.fitBlock(ctx, r[col.key] || "-", widths[i] - 3, col.lines || 1, base, OFF_FONT_MIN_PX).px,
        ),
      base,
    );
  });
}

function clip(ctx, text, maxW) {
  if (!text) return "-";
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1);
  return text + "…";
}

function calcWidths(fractions) {
  const widths = fractions.map((f) => Math.round(BODY_W * f));
  const diff = BODY_W - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += diff;
  return widths;
}

function drawOffHeader(ctx, y) {
  const H = 24;
  let x = MARGIN;
  ctx.lineWidth = 1;
  const widths = calcWidths(OFF_COLS.map((c) => c.w));
  OFF_COLS.forEach((col, i) => {
    const cw = widths[i];
    ctx.strokeStyle = "#000";
    ctx.strokeRect(x, y, cw, H);
    ctx.fillStyle = "#555";
    ctx.font = "6px Arial";
    ctx.textAlign = "left";
    wrapText(ctx, col.label, x + 2, y + 7, cw - 3, 6.5);
    x += cw;
  });
  return y + H;
}

function drawOffRow(ctx, data, y, fonts) {
  const H = OFF_ROW_H;
  let x = MARGIN;
  ctx.lineWidth = 1;
  const widths = calcWidths(OFF_COLS.map((c) => c.w));
  OFF_COLS.forEach((col, i) => {
    const cw = widths[i];
    ctx.strokeStyle = "#000";
    ctx.strokeRect(x, y, cw, H);
    ctx.fillStyle = "#000";
    if (col.yn) {
      ctx.font = "9px Arial";
      ctx.textAlign = "center";
      ctx.fillText(data[col.key] || "-", x + cw / 2, y + 13);
    } else {
      const px = (fonts && fonts[i]) || col.basePx || OFF_FONT_PX;
      ctx.font = px + "px Arial";
      ctx.textAlign = "left";
      const block = GumaFit.fitBlock(ctx, data[col.key] || "-", cw - 3, col.lines || 1, px, px);
      // Vertically centred, so a one-line value in a wrapping column still sits
      // on the row's own baseline rather than riding high.
      const lh = px + 1;
      let ty = y + H / 2 - ((block.lines.length - 1) * lh) / 2 + px * 0.36;
      block.lines.forEach((l) => {
        ctx.fillText(clip(ctx, l, cw - 3), x + 2, ty);
        ty += lh;
      });
    }
    // The column labels live in drawOffHeader, so the label here is only the
    // editor's tooltip - the cell itself paints nothing but the value.
    if (data._p) {
      window.GumaCanvasEdit?.field(data._p + "_" + col.key, x, y, cw, H, {
        kind: col.kind,
        label: col.label,
        align: col.yn ? "center" : "left",
        minEditW: NARROW_EDIT_W,
      });
    }
    x += cw;
  });
  // ✕ chip in the right margin, clear of the table itself.
  if (data._p) {
    window.GumaCanvasEdit?.action("rm_" + data._p, DOC_W - MARGIN + 3, y + 3, 18, 14, () => removeOfficerRow(data._type, data._idx), {
      label: "✕",
      kind: "remove",
      title: "Remove this officer",
    });
  }
  return y + H;
}

function officerSection(ctx, title, rows, y, type, fonts) {
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(MARGIN, y, BODY_W, 16);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, BODY_W, 16);
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "left";
  ctx.fillText(title, MARGIN + 5, y + 11);
  y += 16;
  y = drawOffHeader(ctx, y);
  // Exactly the collected rows: a removed officer disappears and the document
  // shrinks, rather than lingering as an empty padding row.
  rows.forEach((r) => {
    y = drawOffRow(ctx, r, y, fonts);
  });
  window.GumaCanvasEdit?.action("add_" + type, MARGIN, y + 2, 120, 14, () => addOfficerRow(type), {
    label: "+ Add Officer",
    kind: "add",
    title: type === "involved" ? "Add another involved officer" : "Add another witnessing officer",
  });
  return y + ADD_CHIP_H;
}

function civilianSection(ctx, rows, y) {
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(MARGIN, y, BODY_W, 16);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, BODY_W, 16);
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "left";
  ctx.fillText("CIVILIAN WITNESSES", MARGIN + 5, y + 11);
  y += 16;
  rows.forEach((r) => {
    y = drawCivBlock(ctx, r, y);
  });
  window.GumaCanvasEdit?.action("add_civilian", MARGIN, y + 2, 120, 14, () => addCivilianRow(), {
    label: "+ Add Civilian",
    kind: "add",
    title: "Add another civilian witness",
  });
  return y + ADD_CHIP_H;
}

function drawCivBlock(ctx, d, y) {
  if (d._p) {
    window.GumaCanvasEdit?.action("rm_" + d._p, DOC_W - MARGIN + 3, y + 4, 18, 14, () => removeCivilianRow(d._idx), {
      label: "✕",
      kind: "remove",
      title: "Remove this civilian witness",
    });
  }

  y = gridRow(
    ctx,
    [
      fdRowCell("Last Name, First Name, Middle Initial", d, "name", 0.22),
      fdRowCell("Sex", d, "sex", 0.05, { kind: "select" }),
      fdRowCell("Desc.", d, "desc", 0.06, { minEditW: NARROW_EDIT_W }),
      fdRowCell("Ht.", d, "ht", 0.06, { minEditW: NARROW_EDIT_W }),
      fdRowCell("Wt.", d, "wt", 0.06, { minEditW: NARROW_EDIT_W }),
      fdRowCell("Age", d, "age", 0.05, { minEditW: NARROW_EDIT_W }),
      fdRowCell("DOB", d, "dob", 0.1, { kind: "date" }),
      fdRowCell("Driver Lic. No. / Other ID No.", d, "dl", 0.2),
      fdRowCell("Occupation", d, "occupation", 0.2),
    ],
    y,
    22,
  );

  y = gridRow(
    ctx,
    [
      fdRowCell("Address R-", d, "addr_r", 0.4),
      fdRowCell("Phone R-", d, "phone_r", 0.2),
      fdRowCell("E-Mail Address", d, "email", 0.4),
    ],
    y,
    CIV_ROW_H,
  );

  y = gridRow(
    ctx,
    [
      fdRowCell("Address B-", d, "addr_b", 0.4),
      fdRowCell("Phone B-", d, "phone_b", 0.2),
      fdRowCell("Cell Phone", d, "cell", 0.4),
    ],
    y,
    CIV_ROW_H,
  );

  y = gridRow(
    ctx,
    [
      fdRowCell("Foreign Language Spoken", d, "lang", 0.25),
      fdRowCell("Name/Serial No. of Supervisor Interviewing and Date/Time/Location of Interview", d, "supervisor", 0.75),
    ],
    y,
    CIV_ROW_H,
  );

  return y + 5;
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "",
    curY = y;
  words.forEach((w) => {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = w;
      curY += lineH;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, curY);
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  drawForm();
}

async function downloadPng() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const a = document.createElement("a");
  a.download = "firearm-discharge-investigation.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const btn = document.getElementById("copyDiscordBtn");
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const newCount = await window.GumaCounters?.trackDownload("firearm");
      const countEl = document.getElementById("downloadCount");
      if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
      await GumaHistoryWiring.save(canvas);
      if (btn) {
        const orig = btn.innerHTML;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.innerHTML = orig), 2000);
      }
    } catch (err) {
      alert("Could not copy to clipboard: " + err);
    }
  }, "image/png");
}

// ── Init ──────────────────────────────────────────────────────────────────────
(function initReport() {
  fdApplyCaps(document);
  // ?faction=lssd still works as a deep link: it just prefills the header.
  const key = new URLSearchParams(window.location.search).get("faction");
  const f = key && typeof FACTIONS !== "undefined" ? FACTIONS[key] : null;
  const el = document.getElementById("agency_name");
  if (f && f.name && el) el.value = f.name;
})();

document.querySelectorAll("input,select").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});

// One row per repeatable block by default; the canvas chips add and remove
// from here on.
addOfficerRow("involved");
addOfficerRow("witnessing");
addCivilianRow();

// ── Saved cards: serialize / hydrate / wiring ─────────────────

const FD_GENERAL_IDS = [
  "agency_name",
  "fid_no",
  "dr_no",
  "date_incident",
  "day_of_week",
  "time_incident",
  "location",
  "rd",
  "report_datetime",
  "officer_area",
  "area_occurrence",
];

function fdRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}
function fdChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function fdCollectOfficerRowsRaw(type) {
  const cid = type === "involved" ? "involved-officers-container" : "witnessing-officers-container";
  const c = document.getElementById(cid);
  if (!c) return [];
  return Array.from(c.querySelectorAll(".dynamic-row")).map((row) => {
    const p = type + "_" + row.dataset.idx;
    const o = {};
    FD_OFFICER_FIELDS.forEach((k) => (o[k] = fdRawVal(p + "_" + k)));
    return o;
  });
}

function fdCollectCivilianRowsRaw() {
  const c = document.getElementById("civilians-container");
  if (!c) return [];
  return Array.from(c.querySelectorAll(".dynamic-row")).map((row) => {
    const p = "civ_" + row.dataset.idx;
    const o = {};
    FD_CIVILIAN_FIELDS.forEach((k) => (o[k] = fdRawVal(p + "_" + k)));
    return o;
  });
}

function fdSerializeState() {
  const general = {};
  FD_GENERAL_IDS.forEach((id) => (general[id] = fdRawVal(id)));
  return {
    incidentType: {
      cb_tactical: fdChecked("cb_tactical"),
      cb_animal: fdChecked("cb_animal"),
      cb_non_tactical: fdChecked("cb_non_tactical"),
      cb_warning: fdChecked("cb_warning"),
    },
    general,
    involved: fdCollectOfficerRowsRaw("involved"),
    witnessing: fdCollectOfficerRowsRaw("witnessing"),
    civilians: fdCollectCivilianRowsRaw(),
  };
}

function fdFillRow(prefix, data) {
  Object.keys(data || {}).forEach((k) => GumaHistoryWiring.setVal(prefix + "_" + k, data[k]));
}

/**
 * Agency name for a report saved before the faction switcher was replaced by
 * the editable header: those payloads carry a FACTION_KEY instead.
 */
function fdLegacyAgency(payload) {
  const fk = payload.FACTION_KEY;
  if (!fk) return DEFAULT_AGENCY;
  if (fk === "custom") return (payload.custom?.customFactionName || "").trim().toUpperCase() || DEFAULT_AGENCY;
  const f = typeof FACTIONS !== "undefined" ? FACTIONS[fk] : null;
  return (f && f.name) || DEFAULT_AGENCY;
}

function fdHydrateState(payload) {
  if (!payload) return;
  // Every row container is rebuilt below; an open editor would write into a
  // detached node.
  window.GumaCanvasEdit?.cancelEdit();
  const setVal = GumaHistoryWiring.setVal;
  const setCheck = GumaHistoryWiring.setChecked;

  const it = payload.incidentType || {};
  setCheck("cb_tactical", it.cb_tactical);
  setCheck("cb_animal", it.cb_animal);
  setCheck("cb_non_tactical", it.cb_non_tactical);
  setCheck("cb_warning", it.cb_warning);

  const g = payload.general || {};
  FD_GENERAL_IDS.forEach((id) => setVal(id, g[id]));
  // Only for pre-header payloads: an empty agency_name on a current one means
  // "untouched", and writing the default into it would kill the outline.
  if (!g.agency_name && payload.FACTION_KEY) setVal("agency_name", fdLegacyAgency(payload));

  ["involved-officers-container", "witnessing-officers-container", "civilians-container"].forEach((cid) => {
    const c = document.getElementById(cid);
    if (c) c.innerHTML = "";
  });
  involvedCount = 0;
  witnessingCount = 0;
  civilianCount = 0;

  (payload.involved || []).forEach((r) => {
    addOfficerRow("involved");
    fdFillRow("involved_" + involvedCount, r);
  });
  (payload.witnessing || []).forEach((r) => {
    addOfficerRow("witnessing");
    fdFillRow("witnessing_" + witnessingCount, r);
  });
  (payload.civilians || []).forEach((r) => {
    addCivilianRow();
    fdFillRow("civ_" + civilianCount, r);
  });

  refreshPreview();
}

function fdBuildLabel(payload) {
  const off = (payload.involved && payload.involved[0]) || null;
  const name = ((off && off.name) || "").trim();
  const dr = (payload.general?.dr_no || "").trim();
  const date = (payload.general?.date_incident || "").trim();
  const who = name || dr || "Firearm Discharge";
  return date ? `${who} — ${date}` : who;
}

GumaHistoryWiring.register({
  key: "firearm",
  noun: "report",
  serialize: fdSerializeState,
  hydrate: fdHydrateState,
  buildLabel: fdBuildLabel,
  // no buildFaction - the agency is free text on this report, not a faction
});

// ── WYSIWYG editing wiring ────────────────────────────────────────────────────
// The preview modal delegates export here so counters and history keep firing.
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
};

window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "firearm",
});
