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

function removeOfficerRow(prefix) {
  const idx = prefix.replace("officer_", "");
  document.querySelector(`#officers-container .dynamic-row[data-idx="${idx}"]`)?.remove();
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
      _p: p, // input id prefix, doubles as the hitbox ref base
      name: getVal(p + "_name"),
      serial: getVal(p + "_serial"),
      division: getVal(p + "_division"),
      detail: getVal(p + "_detail"),
    };
  });
}

// ── Cell spec bound to an input id: value and hitbox ref declared once ───────
const f = (label, id, w, opts) => ({ label, value: getVal(id), w, opts: { ref: id, ...opts } });
const fd = (label, id, w, opts) => ({ label, value: fmtDate(arRawVal(id)), w, opts: { ref: id, kind: "date", ...opts } });

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

  // The cell already knows the exact box an editor needs - hand it over.
  if (opts.ref && window.GumaCanvasEdit) {
    window.GumaCanvasEdit.field(opts.ref, x, y, w, h, {
      kind: opts.kind,
      label,
      align: center ? "center" : "left",
      minEditW: opts.minEditW,
    });
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
  cell(ctx, MARGIN, y, chargeW, H, "Booking Charge", getVal("booking_charge"), { bg: CELL_BG, ref: "booking_charge" });

  // Checkbox cell
  const cbX = MARGIN + chargeW;
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(cbX, y, cbW, H);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(cbX, y, cbW, H);

  const items = [
    { id: "cb_misdemeanor", label: "MISDEMEANOR", checked: document.getElementById("cb_misdemeanor")?.checked },
    { id: "cb_felony", label: "FELONY", checked: document.getElementById("cb_felony")?.checked },
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
    // Whole box-plus-label strip toggles on click.
    window.GumaCanvasEdit?.field(item.id, cbX + 4, cy - 9, cbW - 8, 12, { kind: "check", label: item.label });
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

  // Data rows: exactly the collected officers - a removed row disappears
  // instead of lingering as an empty padding row.
  const rH = 18;
  const colKeys = ["name", "serial", "division", "detail"];
  officers.forEach((o) => {
    let dx = MARGIN;
    colKeys.forEach((key, i) => {
      cell(ctx, dx, y, widths[i], rH, "", o[key], { bg: CELL_BG, ref: o._p ? o._p + "_" + key : undefined });
      dx += widths[i];
    });
    if (o._p) {
      const p = o._p;
      window.GumaCanvasEdit?.action("rm_" + p, DOC_W - MARGIN + 3, y + 2, 18, 14, () => removeOfficerRow(p), {
        label: "✕",
        kind: "remove",
        title: "Remove this officer",
      });
    }
    y += rH;
  });

  if (officers.length < MAX_OFFICERS) {
    window.GumaCanvasEdit?.action("add_officer", MARGIN, y + 4, 110, 14, () => addOfficerRow(), {
      label: "+ Add Officer",
      kind: "add",
      title: "Add another arresting officer",
    });
  }

  return y;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });
  const officers = collectOfficers();

  // Height estimation (logical px)
  const titleH = 26;
  const metaRowsH = 24 + 24 + 24 + 22 + 24; // 5 stacked meta rows
  const chargeH = 30;
  const officersH = 13 + 14 + officers.length * 18;
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
      f("Location Booked", "location_booked", 0.4),
      f("Booking No.", "booking_no", 0.2),
      f("DR No.", "dr_no", 0.2),
      f("Inc. No.", "inc_no", 0.2),
    ],
    y,
    24,
  );

  // ── Arrestee / Suspect ────────────────────────────────────────────────────
  y = row(
    ctx,
    [
      f("Arrestee/Suspect (Last, First, Middle)", "arrestee_name", 0.6),
      f("Sex", "sex", 0.12, { center: true, kind: "select" }),
      fd("Date of Birth", "dob", 0.28),
    ],
    y,
    24,
  );

  // ── Residential address ───────────────────────────────────────────────────
  y = row(
    ctx,
    [
      f("Arrestee/Suspect's Residential Address", "residential_address", 0.45),
      f("City", "city", 0.2),
      f("Zip", "zip", 0.13),
      f("Phone No.", "phone_no", 0.22),
    ],
    y,
    24,
  );

  // ── Location of occurrence ────────────────────────────────────────────────
  y = row(
    ctx,
    [f("Location of Occurrence", "location_occurrence", 0.82), f("RD", "rd", 0.18, { center: true })],
    y,
    22,
  );

  // ── Dates / times ─────────────────────────────────────────────────────────
  y = row(
    ctx,
    [
      fd("Date of Arrest", "date_arrest", 0.25),
      f("Time of Arrest", "time_arrest", 0.25, { kind: "time" }),
      fd("Date of this Report", "date_report", 0.25),
      f("Time of this Report", "time_report", 0.25, { kind: "time" }),
    ],
    y,
    24,
  );

  // ── Booking charge + Misdemeanor/Felony ───────────────────────────────────
  y = drawChargeRow(ctx, y);
  y += 6;

  // ── Arresting officers ────────────────────────────────────────────────────
  y = drawOfficers(ctx, officers, y);

  window.GumaCanvasEdit?.end();
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
  // The container is rebuilt below; an open editor would write into a
  // detached node.
  window.GumaCanvasEdit?.cancelEdit();
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
  return date ? `${head} - ${date}` : head;
}

GumaHistoryWiring.register({
  key: "arrest",
  noun: "report",
  serialize: arSerializeState,
  hydrate: arHydrateState,
  buildLabel: arBuildLabel,
  // no buildFaction — arrest report has no faction
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
  host: document.querySelector(".guma-panel-form"),
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "arrest",
});
