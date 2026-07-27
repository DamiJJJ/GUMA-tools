"use strict";

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Officer counter ─────────────────────────────────────────────────────────
let officerCount = 0;
const MAX_OFFICERS = 4;

function syncAddOfficerBtn() {
  const container = document.getElementById("officers-container");
  const btn = document.getElementById("addOfficerBtn");
  if (!container || !btn) return;
  const atMax = container.querySelectorAll(".dynamic-row").length >= MAX_OFFICERS;
  btn.disabled = atMax;
  btn.classList.toggle("hidden", atMax);
}

function addOfficerRow() {
  const container = document.getElementById("officers-container");
  if (container.querySelectorAll(".dynamic-row").length >= MAX_OFFICERS) return;
  const idx = ++officerCount;
  const prefix = "officer_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Arresting Officer ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();syncAddOfficerBtn();refreshPreview()">&#10005;</button>

    <div class="two-col">
      <div class="form-group">
        <label>Officer (Last, First)</label>
        <input type="text" id="${prefix}_name" placeholder="Doe, John" />
      </div>
      <div class="form-group">
        <label>Serial No.</label>
        <input type="text" id="${prefix}_serial" placeholder="50286" />
      </div>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Division of Assignment</label>
        <input type="text" id="${prefix}_division" placeholder="Central" />
      </div>
      <div class="form-group">
        <label>Detail</label>
        <input type="text" id="${prefix}_detail" placeholder="Patrol" />
      </div>
    </div>
  `;

  container.appendChild(div);
  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  syncAddOfficerBtn();
  refreshPreview();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return "-";
  const v = el.value.trim();
  return v || "-";
}

function fmtDate(raw) {
  if (!raw || raw === "-") return "-";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

function collectOfficers() {
  return Array.from(document.getElementById("officers-container").querySelectorAll(".dynamic-row")).map((row) => {
    const p = "officer_" + row.dataset.idx;
    return {
      name: getVal(p + "_name"),
      serial: getVal(p + "_serial"),
      division: getVal(p + "_division"),
      detail: getVal(p + "_detail"),
    };
  });
}

// ── Canvas layout constants (logical pixels — rendered ×SCALE) ───────────────
const MARGIN = 24;
const DOC_W = 640;
const BODY_W = DOC_W - MARGIN * 2;
const LINE_W = 0.6;
const CELL_BG = "#f9f9f9";
const HEAD_BG = "#d8d8d8";
const SECT_BG = "#b0b0b0";

// ── Primitive: clipped text ───────────────────────────────────────────────────
function clip(ctx, text, maxW) {
  if (!text) return "-";
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

// ── Primitive: wrapped label text ────────────────────────────────────────────
function wrapLabel(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "",
    cy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// ── Primitive: one table cell ─────────────────────────────────────────────────
function cell(ctx, x, y, w, h, label, value, opts = {}) {
  const { bold = false, center = false, bg = CELL_BG, valFont } = opts;

  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(x, y, w, h);

  // Label
  if (label) {
    ctx.fillStyle = "#333";
    ctx.font = "5.8px Arial";
    ctx.textAlign = "left";
    wrapLabel(ctx, label, x + 2, y + 7, w - 4, 6.5);
  }

  // Value
  ctx.fillStyle = "#000";
  ctx.font = valFont || (bold ? "bold 8px Arial" : "8px Arial");
  if (center) {
    ctx.textAlign = "center";
    ctx.fillText(clip(ctx, value, w - 4), x + w / 2, y + h - 4);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, value, w - 4), x + 2, y + h - 4);
  }
}

// ── Row of cells from spec array ─────────────────────────────────────────────
function row(ctx, spec, y, h) {
  const widths = spec.map((s) => Math.round(BODY_W * s.w));
  widths[widths.length - 1] += BODY_W - widths.reduce((a, b) => a + b, 0);
  let x = MARGIN;
  spec.forEach((s, i) => {
    cell(ctx, x, y, widths[i], h, s.label, s.value, s.opts || {});
    x += widths[i];
  });
  return y + h;
}

// ── Section header bar ────────────────────────────────────────────────────────
function sectionBar(ctx, text, y) {
  const H = 13;
  ctx.fillStyle = SECT_BG;
  ctx.fillRect(MARGIN, y, BODY_W, H);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, BODY_W, H);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7.5px Arial";
  ctx.textAlign = "left";
  ctx.fillText(text, MARGIN + 4, y + 9);
  return y + H;
}

// ── Booking charge cell with Misdemeanor / Felony checkboxes ─────────────────
function drawChargeRow(ctx, y) {
  const H = 30;
  const cbW = BODY_W * 0.26;
  const chargeW = BODY_W - cbW;

  // Booking charge cell
  cell(ctx, MARGIN, y, chargeW, H, "Booking Charge", getVal("booking_charge"), { bg: CELL_BG });

  // Checkbox cell
  const cbX = MARGIN + chargeW;
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(cbX, y, cbW, H);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(cbX, y, cbW, H);

  const items = [
    { label: "MISDEMEANOR", checked: document.getElementById("cb_misdemeanor")?.checked },
    { label: "FELONY", checked: document.getElementById("cb_felony")?.checked },
  ];
  items.forEach((item, i) => {
    const cy = y + 11 + i * 13;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(cbX + 6, cy - 7, 8, 8);
    if (item.checked) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "left";
      ctx.fillText("X", cbX + 7, cy - 0.5);
    }
    ctx.fillStyle = "#000";
    ctx.font = "7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(item.label, cbX + 18, cy);
  });

  return y + H;
}

// ── Officers section ──────────────────────────────────────────────────────────
function drawOfficers(ctx, officers, y) {
  y = sectionBar(ctx, "ARRESTING OFFICER(S)", y);

  const spec = [
    { w: 0.4, label: "Arresting Officer(s): (Last, First)" },
    { w: 0.2, label: "Serial No.(s)" },
    { w: 0.25, label: "Division of Assignment" },
    { w: 0.15, label: "Detail" },
  ];

  // Column header row
  const hH = 14;
  const widths = spec.map((s) => Math.round(BODY_W * s.w));
  widths[widths.length - 1] += BODY_W - widths.reduce((a, b) => a + b, 0);
  let x = MARGIN;
  spec.forEach((s, i) => {
    ctx.fillStyle = HEAD_BG;
    ctx.fillRect(x, y, widths[i], hH);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = LINE_W;
    ctx.strokeRect(x, y, widths[i], hH);
    ctx.fillStyle = "#000";
    ctx.font = "5.8px Arial";
    ctx.textAlign = "left";
    wrapLabel(ctx, s.label, x + 2, y + 6, widths[i] - 4, 6);
    x += widths[i];
  });
  y += hH;

  // Data rows (min 2)
  const toRender = [...officers];
  while (toRender.length < 2) toRender.push({ name: "-", serial: "-", division: "-", detail: "-" });

  const rH = 18;
  toRender.forEach((o) => {
    let dx = MARGIN;
    [o.name, o.serial, o.division, o.detail].forEach((val, i) => {
      cell(ctx, dx, y, widths[i], rH, "", val, { bg: CELL_BG });
      dx += widths[i];
    });
    y += rH;
  });

  return y;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function drawForm() {
  const officers = collectOfficers();
  const effOfficers = Math.max(2, officers.length);

  // Height estimation (logical px)
  const titleH = 26;
  const metaRowsH = 24 + 24 + 24 + 22 + 24; // 5 stacked meta rows
  const chargeH = 30;
  const officersH = 13 + 14 + effOfficers * 18;
  const contentH = MARGIN + titleH + metaRowsH + chargeH + 6 + officersH + MARGIN;
  const logicalH = contentH;

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = logicalH * SCALE;

  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, logicalH);

  let y = MARGIN;

  // ── Title ───────────────────────────────────────────────────────────────
  ctx.fillStyle = "#000";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ARREST REPORT EXPEDITED PACKET INPUT FORM", DOC_W / 2, y + 12);
  y += 20;

  // ── Booking meta row ──────────────────────────────────────────────────────
  y = row(
    ctx,
    [
      { label: "Location Booked", value: getVal("location_booked"), w: 0.4 },
      { label: "Booking No.", value: getVal("booking_no"), w: 0.2 },
      { label: "DR No.", value: getVal("dr_no"), w: 0.2 },
      { label: "Inc. No.", value: getVal("inc_no"), w: 0.2 },
    ],
    y,
    24,
  );

  // ── Arrestee / Suspect ────────────────────────────────────────────────────
  y = row(
    ctx,
    [
      { label: "Arrestee/Suspect (Last, First, Middle)", value: getVal("arrestee_name"), w: 0.6 },
      { label: "Sex", value: getVal("sex"), w: 0.12, opts: { center: true } },
      { label: "Date of Birth", value: fmtDate(document.getElementById("dob")?.value || ""), w: 0.28 },
    ],
    y,
    24,
  );

  // ── Residential address ───────────────────────────────────────────────────
  y = row(
    ctx,
    [
      { label: "Arrestee/Suspect's Residential Address", value: getVal("residential_address"), w: 0.45 },
      { label: "City", value: getVal("city"), w: 0.2 },
      { label: "Zip", value: getVal("zip"), w: 0.13 },
      { label: "Phone No.", value: getVal("phone_no"), w: 0.22 },
    ],
    y,
    24,
  );

  // ── Location of occurrence ────────────────────────────────────────────────
  y = row(
    ctx,
    [
      { label: "Location of Occurrence", value: getVal("location_occurrence"), w: 0.82 },
      { label: "RD", value: getVal("rd"), w: 0.18, opts: { center: true } },
    ],
    y,
    22,
  );

  // ── Dates / times ─────────────────────────────────────────────────────────
  y = row(
    ctx,
    [
      { label: "Date of Arrest", value: fmtDate(document.getElementById("date_arrest")?.value || ""), w: 0.25 },
      { label: "Time of Arrest", value: getVal("time_arrest"), w: 0.25 },
      { label: "Date of this Report", value: fmtDate(document.getElementById("date_report")?.value || ""), w: 0.25 },
      { label: "Time of this Report", value: getVal("time_report"), w: 0.25 },
    ],
    y,
    24,
  );

  // ── Booking charge + Misdemeanor/Felony ───────────────────────────────────
  y = drawChargeRow(ctx, y);
  y += 6;

  // ── Arresting officers ────────────────────────────────────────────────────
  y = drawOfficers(ctx, officers, y);
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  drawForm();
}

async function downloadPng() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const a = document.createElement("a");
  a.download = "arrest-report.png";
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
      const newCount = await window.GumaCounters?.trackDownload("arrest");
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

// ── Init ─────────────────────────────────────────────────────────────────────
document.querySelectorAll("input,select").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});

addOfficerRow();

// ── Saved reports: serialize / hydrate / wiring ───────────────

const AR_SCALAR_FIELDS = [
  "location_booked",
  "booking_no",
  "dr_no",
  "inc_no",
  "arrestee_name",
  "sex",
  "dob",
  "residential_address",
  "city",
  "zip",
  "phone_no",
  "location_occurrence",
  "rd",
  "date_arrest",
  "time_arrest",
  "date_report",
  "time_report",
  "booking_charge",
];
const AR_OFFICER_FIELDS = ["name", "serial", "division", "detail"];

function arRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}
function arChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function arCollectOfficersRaw() {
  const c = document.getElementById("officers-container");
  if (!c) return [];
  return Array.from(c.querySelectorAll(".dynamic-row")).map((row) => {
    const p = "officer_" + row.dataset.idx;
    const o = {};
    AR_OFFICER_FIELDS.forEach((k) => (o[k] = arRawVal(p + "_" + k)));
    return o;
  });
}

function arSerializeState() {
  const fields = {};
  AR_SCALAR_FIELDS.forEach((id) => (fields[id] = arRawVal(id)));
  return {
    fields,
    checks: {
      cb_misdemeanor: arChecked("cb_misdemeanor"),
      cb_felony: arChecked("cb_felony"),
    },
    officers: arCollectOfficersRaw(),
  };
}

function arHydrateState(payload) {
  if (!payload) return;
  const setVal = GumaHistoryWiring.setVal;

  const f = payload.fields || {};
  AR_SCALAR_FIELDS.forEach((id) => setVal(id, f[id]));

  const ch = payload.checks || {};
  GumaHistoryWiring.setChecked("cb_misdemeanor", ch.cb_misdemeanor);
  GumaHistoryWiring.setChecked("cb_felony", ch.cb_felony);

  const c = document.getElementById("officers-container");
  if (c) c.innerHTML = "";
  officerCount = 0;
  (payload.officers || []).forEach((o) => {
    addOfficerRow();
    const prefix = "officer_" + officerCount;
    AR_OFFICER_FIELDS.forEach((k) => setVal(prefix + "_" + k, o[k]));
  });

  refreshPreview();
}

function arBuildLabel(payload) {
  const f = payload.fields || {};
  const booking = (f.booking_no || "").trim();
  const name = (f.arrestee_name || "").trim();
  const date = (f.date_arrest || "").trim();
  const head = booking ? "Booking " + booking : name || "Arrest Report";
  return date ? `${head} — ${date}` : head;
}

GumaHistoryWiring.register({
  key: "arrest",
  noun: "report",
  serialize: arSerializeState,
  hydrate: arHydrateState,
  buildLabel: arBuildLabel,
  // no buildFaction — arrest report has no faction
});
