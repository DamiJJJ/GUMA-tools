"use strict";

// ── Field catalogs ────────────────────────────────────────────────────────────
// Text / date / time inputs (single source of truth for serialize + hydrate).
const PCR_TEXT_IDS = [
  "pcr_report_no", "ems_response_no",
  "incident_date", "ems_agcy", "unit_callsign", "unit_vehicle", "station_no",
  "complaint",
  "t_psap", "t_ems_notified", "t_unit_notified", "t_enroute",
  "t_arrived_scene", "t_arrived_patient", "t_transfer_care", "t_left_scene",
  "t_arrived_dest", "t_transfer_dest", "t_back_service",
  "intercept_agency", "location_type", "gps_lat", "gps_long",
  "odo_begin", "odo_arrive", "odo_dest", "odo_end", "incident_fac_id",
];

// Checkbox groups — reused by the canvas renderer AND the check-id catalog.
const EMD_ITEMS = [
  { id: "emd_no", label: "No" },
  { id: "emd_yes_with", label: "Yes, With Pre-Arrival Instructions" },
  { id: "emd_yes_without", label: "Yes, Without Pre-Arrival Instructions" },
  { id: "emd_yes_unknown", label: "Yes, Unknown if Pre-Arrival Given" },
];
const ROLE_ITEMS = [
  { id: "role_air_heli", label: "Air Trans.-Helicopter" },
  { id: "role_ground", label: "Ground Trans." },
  { id: "role_air_fixed", label: "Air Trans.-Fixed Wing" },
  { id: "role_nontrans_rescue", label: "Non-Trans.-Rescue" },
  { id: "role_nontrans_assist", label: "Non-Trans.-Assist" },
];
const LOC_ITEMS = [
  { id: "loc_bls_emr", label: "BLS-EMR" },
  { id: "loc_bls_emt", label: "BLS-EMT" },
  { id: "loc_als_int", label: "ALS-Intermediate" },
  { id: "loc_als_para", label: "ALS-Paramedic" },
  { id: "loc_als_aemt", label: "ALS-AEMT" },
  { id: "loc_als_nurse", label: "ALS-Nurse" },
  { id: "loc_als_phys", label: "ALS-Physician" },
  { id: "loc_spec_cc", label: "Specialty Critical Care" },
];
const SVC_ITEMS = [
  { id: "svc_911_scene", label: "911 Response (Scene)" },
  { id: "svc_911_interfac", label: "911 Response (Inter-Facility)" },
  { id: "svc_interfac_routine", label: "Inter-Facility Transport (Routine)" },
  { id: "svc_intercept", label: "Intercept" },
  { id: "svc_mutual", label: "Mutual Aid" },
  { id: "svc_public", label: "Public Assistance/Other Not Listed" },
  { id: "svc_medical", label: "Medical Transport" },
  { id: "svc_standby", label: "Standby" },
];
const RESP_TO_ITEMS = [
  { id: "rm_emergent", label: "Emergent" },
  { id: "rm_non_emergent", label: "Non-Emergent" },
  { id: "rm_downgraded", label: "Emergent Downgraded to Non-Emergent" },
  { id: "rm_upgraded", label: "Non-Emergent Upgraded to Emergent" },
];
const RESP_FROM_ITEMS = [
  { id: "fs_emergent", label: "Emergent" },
  { id: "fs_non_emergent", label: "Non-Emergent" },
  { id: "fs_downgraded", label: "Emergent Downgraded to Non-Emergent" },
  { id: "fs_upgraded", label: "Non-Emergent Upgraded to Emergent" },
];
const DELAY_DISPATCH_ITEMS = [
  { id: "dd_none", label: "None/No Delay" },
  { id: "dd_caller", label: "Caller (Uncooperative)" },
  { id: "dd_volume", label: "High Call Volume" },
  { id: "dd_language", label: "Language Barrier" },
  { id: "dd_location", label: "Location (Inability to obtain)" },
  { id: "dd_no_units", label: "No EMS Unit(s) Available" },
  { id: "dd_safety", label: "Safety Conditions" },
  { id: "dd_technical", label: "Technical Failure" },
  { id: "dd_other", label: "Other (Not Listed)" },
];
const DELAY_RESPONSE_ITEMS = [
  { id: "dr_none", label: "None/No Delay" },
  { id: "dr_mechanical", label: "Mechanical Issue" },
  { id: "dr_crowd", label: "Crowd" },
  { id: "dr_directions", label: "Directions/Unable To Locate" },
  { id: "dr_distance", label: "Distance" },
  { id: "dr_diversion", label: "Diversion" },
  { id: "dr_hazmat", label: "HazMat" },
  { id: "dr_scene_safety", label: "Scene Safety (Not Secure for EMS)" },
  { id: "dr_staff", label: "Staff Delay" },
  { id: "dr_traffic", label: "Traffic" },
  { id: "dr_veh_crash", label: "Vehicle Crash Involving This Unit" },
  { id: "dr_veh_failure", label: "Vehicle Failure of This Unit" },
  { id: "dr_weather", label: "Weather" },
  { id: "dr_rendezvous", label: "Rendezvous Transport Unavailable" },
  { id: "dr_route", label: "Route Obstruction (e.g., train)" },
  { id: "dr_flight", label: "Flight Planning" },
  { id: "dr_other", label: "Other (Not Listed)" },
];
const TRANSPORT_ITEMS = [
  { id: "tm_air_fixed", label: "Air Medical-Fixed Wing" },
  { id: "tm_air_rotor", label: "Air Medical-Rotor Wing" },
  { id: "tm_ground_amb", label: "Ground Ambulance" },
  { id: "tm_g2g", label: "Ground-to-Ground Transfer" },
  { id: "tm_ground_air", label: "Ground-Air Transfer" },
  { id: "tm_a2g", label: "Air-to-Ground Transfer" },
  { id: "tm_grv_air", label: "Ground-Rescue Vehicle-Air Transfer" },
  { id: "tm_grv_ground", label: "Ground-Rescue Vehicle-Ground Transfer" },
  { id: "tm_a2a", label: "Air-to-Air Transfer" },
  { id: "tm_no_transport", label: "No Transport" },
];
const DISPOSITION_ITEMS = [
  { id: "disp_assist", label: "Assist, Unit" },
  { id: "disp_cancelled_prior", label: "Cancelled (Prior to Arrival)" },
  { id: "disp_no_contact", label: "No Pt Contact (Cancelled on Scene)" },
  { id: "disp_dead_noresus_trans", label: "Pt Dead-No Resus (With Transport)" },
  { id: "disp_dead_noresus_notrans", label: "Pt Dead-No Resus (Without Transport)" },
  { id: "disp_dead_resus_notrans", label: "Pt Dead-Resus Attempted (Without Transport)" },
  { id: "disp_eval_no_treat", label: "Pt Evaluated, No Treatment/Transport" },
  { id: "disp_refused_eval", label: "Pt Refused Evaluation/Care" },
  { id: "disp_treated_ama", label: "Pt Treated, Released (AMA)" },
  { id: "disp_treated_this_unit", label: "Pt Treated, Transported by This Unit" },
  { id: "disp_treated_private", label: "Pt Treated, Transported by Private Veh." },
  { id: "disp_treated_le", label: "Pt Treated, Transported by Law Enforce." },
  { id: "disp_treated_transferred", label: "Pt Treated, Transferred to Another Unit" },
  { id: "disp_organs", label: "Transport of Body Parts/Organs Only" },
  { id: "disp_standby", label: "Standby" },
];
const PATIENTS_ITEMS = [
  { id: "pts_single", label: "Single" },
  { id: "pts_multiple", label: "Multiple" },
  { id: "pts_none", label: "None" },
];
const MCI_ITEMS = [
  { id: "mci_yes", label: "Yes" },
  { id: "mci_no", label: "No" },
  { id: "mci_na", label: "NA" },
];

// Flat catalog of every checkbox id (derived — no duplicated list to maintain).
const PCR_CHECK_IDS = [
  EMD_ITEMS, ROLE_ITEMS, LOC_ITEMS, SVC_ITEMS, RESP_TO_ITEMS, RESP_FROM_ITEMS,
  DELAY_DISPATCH_ITEMS, DELAY_RESPONSE_ITEMS, TRANSPORT_ITEMS, DISPOSITION_ITEMS,
  PATIENTS_ITEMS, MCI_ITEMS,
].flat().map((it) => it.id);

// ── Data helpers ──────────────────────────────────────────────────────────────
function rv(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
function isChecked(id) {
  return !!document.getElementById(id)?.checked;
}
function fmtDate(v) {
  if (!v) return "";
  const p = v.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : v;
}

// ── Canvas geometry ───────────────────────────────────────────────────────────
// DOC_W is tuned so the finished document lands on ~A4 portrait proportions
// (height ≈ DOC_W × √2). The canvas is padded to that A4 height in drawForm().
const MARGIN = 26;
const DOC_W = 600;
const BODY_W = DOC_W - MARGIN * 2;
const SCALE = 2; // internal super-sampling for crisp small text

// ── Canvas primitives ─────────────────────────────────────────────────────────
function clip(ctx, text, maxW) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1);
  return text + "…";
}

function chk(ctx, x, baseline, checked) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, baseline - 6, 7, 7);
  if (checked) {
    ctx.fillStyle = "#000";
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "left";
    ctx.fillText("X", x + 0.9, baseline);
  }
}

function checkItem(ctx, x, baseline, id, label, maxW) {
  chk(ctx, x, baseline, isChecked(id));
  ctx.fillStyle = "#000";
  ctx.font = "6px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, label, maxW - 11), x + 10, baseline);
}

// Bold arrow from x1 to x2 at height y with a solid filled head. `head` is
// "left" or "right" — which end carries the arrowhead. Matches the template's
// heavy directional arrows (not a thin hairline).
function blockArrow(ctx, x1, x2, y, head) {
  if (x2 <= x1 + 6) return; // not enough room
  const hl = 5;
  const hw = 3;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.beginPath();
  if (head === "right") {
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - hl, y - hw);
    ctx.lineTo(x2 - hl, y + hw);
  } else {
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + hl, y - hw);
    ctx.lineTo(x1 + hl, y + hw);
  }
  ctx.closePath();
  ctx.fill();
}

// Comb / segmented character-cell field (as on the template's report-number rows).
// Label sits top-left; the value's characters drop into individual boxes below.
function combRow(ctx, x, y, w, h, label, value, cells) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, label, w - 8), x + 4, y + 9);
  const cellW = 11;
  const cellH = 13;
  const maxCells = Math.max(1, Math.min(cells, Math.floor((w - 12) / cellW)));
  const cy = y + h - cellH - 3;
  const val = (value || "").toUpperCase();
  for (let i = 0; i < maxCells; i++) {
    const cx = x + 6 + i * cellW;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(cx, cy, cellW, cellH);
    if (val[i]) {
      ctx.fillStyle = "#000";
      ctx.font = "8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(val[i], cx + cellW / 2, cy + cellH - 3);
    }
  }
}

// ── Sections 13–17 band ───────────────────────────────────────────────────────
// One three-column band, exactly as on the template:
//   left column  : 13/14 Response Mode (top)  +  17 EMS Transport Mode (below)
//   middle column: 15 Type of Delay(s) - Dispatch
//   right column : 16 Type of Delay(s) - Response (tall, spans the whole band)
function delaysTransportBand(ctx, y) {
  const rightW = Math.round(BODY_W * 0.28); // 16
  const leftRegionW = BODY_W - rightW; // 13/14 + 15 on top, 17 below
  const respW = Math.round(leftRegionW * 0.58); // 13/14
  const midW = leftRegionW - respW; // 15
  const rightX = MARGIN + leftRegionW;

  const itemH = 11;
  const headH = 18; // title + "(select all)"
  const midH = headH + DELAY_DISPATCH_ITEMS.length * itemH + 4; // 15 height
  const respMinH = 16 + 4 * 12 + 6;
  const topH = Math.max(midH, respMinH); // 13/14 == 15 height

  const transCols = 3;
  const transRows = Math.ceil(TRANSPORT_ITEMS.length / transCols);
  const transMinH = 12 + transRows * itemH + 6;

  const rightRows = 1 + (DELAY_RESPONSE_ITEMS.length - 2); // None + Mechanical share row 1
  const rightMinH = headH + rightRows * itemH + 4;

  const bandH = Math.max(topH + transMinH, rightMinH);
  const bottomH = bandH - topH; // 17 region

  // Column borders
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, respW, topH); // 13/14
  ctx.strokeRect(MARGIN + respW, y, midW, topH); // 15
  ctx.strokeRect(MARGIN, y + topH, leftRegionW, bottomH); // 17
  ctx.strokeRect(rightX, y, rightW, bandH); // 16

  drawResponseMode(ctx, MARGIN, y, respW, topH);
  drawDelayList(ctx, MARGIN + respW, y, midW, "15. Type of Delay(s) - Dispatch", DELAY_DISPATCH_ITEMS);
  drawTransport(ctx, MARGIN, y + topH, leftRegionW, transCols);
  drawDelayResponse(ctx, rightX, y, rightW);

  return y + bandH;
}

function drawResponseMode(ctx, x, y, w, h) {
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText("13. Response Mode to Scene", x + 4, y + 9);
  ctx.textAlign = "right";
  ctx.fillText("14. From Scene", x + w - 4, y + 9);
  const modes = [
    { label: "Emergent", to: "rm_emergent", from: "fs_emergent" },
    { label: "Non-Emergent", to: "rm_non_emergent", from: "fs_non_emergent" },
    { label: "Emergent Downgraded to Non-Emergent", to: "rm_downgraded", from: "fs_downgraded" },
    { label: "Non-Emergent Upgraded to Emergent", to: "rm_upgraded", from: "fs_upgraded" },
  ];
  const lx = x + 7;
  const rx = x + w - 14;
  const cx = x + w / 2;
  const startY = y + 16;
  const rowH = (h - 18) / modes.length;
  modes.forEach((m, i) => {
    const by = startY + rowH * i + rowH / 2 + 2;
    chk(ctx, lx, by, isChecked(m.to));
    chk(ctx, rx, by, isChecked(m.from));
    ctx.fillStyle = "#000";
    ctx.font = "5.5px Arial";
    ctx.textAlign = "center";
    ctx.fillText(m.label, cx, by);
    const lw = ctx.measureText(m.label).width;
    blockArrow(ctx, lx + 11, cx - lw / 2 - 5, by - 2, "left");
    blockArrow(ctx, cx + lw / 2 + 5, rx - 3, by - 2, "right");
  });
}

function drawDelayList(ctx, x, y, w, title, items) {
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, title, w - 6), x + 4, y + 8);
  ctx.font = "italic 6px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText("(select all)", x + 4, y + 16);
  items.forEach((it, i) => {
    checkItem(ctx, x + 4, y + 18 + i * 11 + 8, it.id, it.label, w - 4);
  });
}

function drawDelayResponse(ctx, x, y, w) {
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, "16. Type of Delay(s) - Response", w - 6), x + 4, y + 8);
  ctx.font = "italic 6px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText("(select all)", x + 4, y + 16);
  const items = DELAY_RESPONSE_ITEMS;
  const half = w / 2;
  // Row 0: None/No Delay | Mechanical Issue (two columns), rest single column.
  checkItem(ctx, x + 4, y + 18 + 8, items[0].id, items[0].label, half - 4);
  checkItem(ctx, x + half + 2, y + 18 + 8, items[1].id, items[1].label, half - 4);
  for (let i = 2; i < items.length; i++) {
    checkItem(ctx, x + 4, y + 18 + (i - 1) * 11 + 8, items[i].id, items[i].label, w - 4);
  }
}

function drawTransport(ctx, x, y, w, cols) {
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText("17. EMS Transport Mode", x + 4, y + 9);
  const colW = w / cols;
  TRANSPORT_ITEMS.forEach((it, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    checkItem(ctx, x + c * colW + 4, y + 13 + r * 11 + 8, it.id, it.label, colW - 4);
  });
}

// One row for sections 30–33 (patients | mass casualty | location type | GPS).
function sceneRow(ctx, y) {
  const h = 48;
  const ws = [0.2, 0.17, 0.29, 0.34].map((f) => Math.round(BODY_W * f));
  ws[3] += BODY_W - ws.reduce((a, b) => a + b, 0);
  let x = MARGIN;
  const title = (t, cx) => {
    ctx.fillStyle = "#000";
    ctx.font = "bold 6.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, t, ws[cx] - 5), x + 3, y + 8);
  };
  // 30 # of patients
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, ws[0], h);
  title("30. # of Patients at Scene", 0);
  PATIENTS_ITEMS.forEach((it, i) => checkItem(ctx, x + 4, y + 12 + i * 11 + 7, it.id, it.label, ws[0] - 4));
  x += ws[0];
  // 31 mass casualty
  ctx.strokeRect(x, y, ws[1], h);
  title("31. Mass Casualty", 1);
  MCI_ITEMS.forEach((it, i) => checkItem(ctx, x + 4, y + 12 + i * 11 + 7, it.id, it.label, ws[1] - 4));
  x += ws[1];
  // 32 location type
  ctx.strokeRect(x, y, ws[2], h);
  title("32. Incident Location Type", 2);
  ctx.font = "9px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, rv("location_type"), ws[2] - 8), x + 4, y + h - 8);
  x += ws[2];
  // 33 scene GPS location
  ctx.strokeRect(x, y, ws[3], h);
  title("33. Scene GPS Location", 3);
  const halfg = ws[3] / 2;
  ctx.fillStyle = "#444";
  ctx.font = "6px Arial";
  ctx.fillText("Latitude", x + 4, y + 18);
  ctx.fillText("Longitude", x + halfg + 2, y + 18);
  ctx.fillStyle = "#000";
  ctx.font = "9px Arial";
  ctx.fillText(clip(ctx, rv("gps_lat"), halfg - 6), x + 4, y + h - 8);
  ctx.fillText(clip(ctx, rv("gps_long"), halfg - 6), x + halfg + 2, y + h - 8);
  return y + h;
}

// Full-width bordered box holding a multi-column checklist. Returns next y.
function checklistCell(ctx, x, y, w, title, items, cols) {
  const rows = Math.ceil(items.length / cols);
  const h = 11 + rows * 11 + 4;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, title, w - 6), x + 4, y + 8);
  const colW = w / cols;
  items.forEach((it, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    checkItem(ctx, x + c * colW + 4, y + 11 + r * 11 + 8, it.id, it.label, colW - 4);
  });
  return { h };
}

function checklistBox(ctx, y, title, items, cols) {
  return y + checklistCell(ctx, MARGIN, y, BODY_W, title, items, cols).h;
}

// Two side-by-side checklist boxes of equal (max) height. Returns next y.
function checklistRow2(ctx, y, left, right) {
  const lr = Math.ceil(left.items.length / left.cols);
  const rr = Math.ceil(right.items.length / right.cols);
  const rows = Math.max(lr, rr);
  const h = 11 + rows * 11 + 4;
  const halfW = Math.round(BODY_W / 2);
  drawChecklistFixed(ctx, MARGIN, y, halfW, h, left.title, left.items, left.cols);
  drawChecklistFixed(ctx, MARGIN + halfW, y, BODY_W - halfW, h, right.title, right.items, right.cols);
  return y + h;
}

function drawChecklistFixed(ctx, x, y, w, h, title, items, cols) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, title, w - 6), x + 4, y + 8);
  const colW = w / cols;
  items.forEach((it, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    checkItem(ctx, x + c * colW + 4, y + 11 + r * 11 + 8, it.id, it.label, colW - 4);
  });
}

// Row of bordered value cells (small gray label on top, value below). Returns next y.
function valueRow(ctx, y, h, cells) {
  let x = MARGIN;
  const widths = cells.map((c) => Math.round(BODY_W * c.w));
  widths[widths.length - 1] += BODY_W - widths.reduce((a, b) => a + b, 0);
  cells.forEach((c, i) => {
    const cw = widths[i];
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cw, h);
    ctx.fillStyle = "#000";
    ctx.font = "bold 6px Arial";
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, c.label, cw - 4), x + 3, y + 8);
    ctx.fillStyle = "#000";
    ctx.font = "9px Arial";
    ctx.fillText(clip(ctx, c.value, cw - 5), x + 4, y + h - 5);
    x += cw;
  });
  return y + h;
}

// A value cell + two checklist cells sharing one row (sections 8–10). Returns next y.
function valueChecklistRow(ctx, y, valueCell, mid, right) {
  const rows = Math.max(Math.ceil(mid.items.length / mid.cols), Math.ceil(right.items.length / right.cols));
  const h = 11 + rows * 11 + 4;
  const w1 = Math.round(BODY_W * 0.32);
  const w2 = Math.round(BODY_W * 0.34);
  const w3 = BODY_W - w1 - w2;
  // value cell
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, w1, h);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, valueCell.title, w1 - 6), MARGIN + 4, y + 8);
  ctx.font = "9px Arial";
  ctx.fillText(clip(ctx, valueCell.value, w1 - 8), MARGIN + 5, y + 22);
  // checklists
  drawChecklistFixed(ctx, MARGIN + w1, y, w2, h, mid.title, mid.items, mid.cols);
  drawChecklistFixed(ctx, MARGIN + w1 + w2, y, w3, h, right.title, right.items, right.cols);
  return y + h;
}

// Section divider spanning the body: bordered white cell, centered bold title
// (matches the template's "Run Times" / "Odometer Readings" banners). Returns next y.
function sectionBar(ctx, text, y) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, BODY_W, 14);
  ctx.fillStyle = "#000";
  ctx.font = "bold 8px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, DOC_W / 2, y + 10);
  return y + 14;
}

// ── Body layout ───────────────────────────────────────────────────────────────
function renderBody(ctx) {
  let y = 30;

  // Title (title case, per template)
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Pre-Hospital Care Report", DOC_W / 2, y);
  y += 13;

  // 1–2 Report numbers (comb / character cells, per template)
  const halfW = Math.round(BODY_W / 2);
  combRow(ctx, MARGIN, y, halfW, 30, "1. Patient Care Report #", rv("pcr_report_no"), 22);
  combRow(ctx, MARGIN + halfW, y, BODY_W - halfW, 30, "2. EMS Response #", rv("ems_response_no"), 22);
  y += 30;

  // 3–7 Incident & unit
  y = valueRow(ctx, y, 26, [
    { label: "3. Incident Date", value: fmtDate(rv("incident_date")), w: 0.24 },
    { label: "4. EMS Agcy #", value: rv("ems_agcy"), w: 0.18 },
    { label: "5. EMS Unit Call Sign", value: rv("unit_callsign"), w: 0.22 },
    { label: "6. EMS Unit (Vehicle) #", value: rv("unit_vehicle"), w: 0.21 },
    { label: "7. Station #", value: rv("station_no"), w: 0.15 },
  ]);

  // 8–10 Complaint / EMD / Primary role
  y = valueChecklistRow(
    ctx,
    y,
    { title: "8. Complaint Reported By Dispatch", value: rv("complaint") },
    { title: "9. Emergency Medical Dispatch Performed", items: EMD_ITEMS, cols: 1 },
    { title: "10. Primary Role of the Unit", items: ROLE_ITEMS, cols: 2 },
  );

  // 11 Level of care | 12 Type of service (side by side)
  y = checklistRow2(
    ctx,
    y,
    { title: "11. Level of Care of This Unit", items: LOC_ITEMS, cols: 3 },
    { title: "12. Type of Service Requested", items: SVC_ITEMS, cols: 2 },
  );

  // 13/14 Response Mode + 15 Delay Dispatch + 16 Delay Response + 17 Transport
  // as one three-column band (13/14 over 17 on the left, 15 middle, 16 right).
  y = delaysTransportBand(ctx, y);

  // Run times (18–27)
  y = sectionBar(ctx, "Run Times  —  Use Military Time", y);
  const times = [
    ["18. PSAP Call", "t_psap", "22. Unit Arrived at Scene", "t_arrived_scene"],
    ["19. EMS Dispatch Notified", "t_ems_notified", "23. Arrived at Patient", "t_arrived_patient"],
    ["20. Unit Notified by Dispatch", "t_unit_notified", "24. Transfer of EMS Patient Care", "t_transfer_care"],
    ["21. Unit En-route", "t_enroute", "25. Unit Left Scene", "t_left_scene"],
    ["26. Patient Arrived at Destination", "t_arrived_dest", "27. Transfer of Care to Destination", "t_transfer_dest"],
  ];
  times.forEach((r) => {
    y = valueRow(ctx, y, 20, [
      { label: r[0], value: rv(r[1]), w: 0.5 },
      { label: r[2], value: rv(r[3]), w: 0.5 },
    ]);
  });
  y = valueRow(ctx, y, 20, [{ label: "Unit Back In Service", value: rv("t_back_service"), w: 1 }]);

  // 28 Disposition
  y = checklistBox(ctx, y, "28. Incident/Patient Disposition", DISPOSITION_ITEMS, 2);

  // 29 Intercept recipient agency
  y = valueRow(ctx, y, 20, [{ label: "29. Intercept Recipient Agency", value: rv("intercept_agency"), w: 1 }]);

  // 30–33 patients / mass casualty / location type / GPS — one row
  y = sceneRow(ctx, y);

  // Odometer + 34 FAC ID
  y = sectionBar(ctx, "Odometer Readings", y);
  y = valueRow(ctx, y, 22, [
    { label: "Begin", value: rv("odo_begin"), w: 0.25 },
    { label: "Arrive", value: rv("odo_arrive"), w: 0.25 },
    { label: "Destination", value: rv("odo_dest"), w: 0.25 },
    { label: "End", value: rv("odo_end"), w: 0.25 },
  ]);
  combRow(ctx, MARGIN, y, BODY_W, 30, "34. Incident FAC ID", rv("incident_fac_id"), 14);
  y += 30;

  // Footer — page marker only (no logo / institution names, per template opt-out)
  y += 4;
  ctx.fillStyle = "#000";
  ctx.font = "8px Arial";
  ctx.textAlign = "center";
  ctx.fillText("1", DOC_W / 2, y + 8);
  return y + 12;
}

// ── Draw ──────────────────────────────────────────────────────────────────────
// Offscreen canvas is cached at module level: allocating ~15 MB of backing
// store on every keystroke was pure GC churn. It starts slightly above the
// sheet height and grows only if the content ever runs past it.
let pcrOffCanvas = null;

function pcrPrepOffCtx(off) {
  const octx = off.getContext("2d");
  octx.setTransform(1, 0, 0, 1, 0, 0); // scale() accumulates on a reused canvas
  octx.scale(SCALE, SCALE);
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, DOC_W, off.height / SCALE);
  octx.textBaseline = "alphabetic";
  return octx;
}

function drawForm() {
  // Render to the cached offscreen canvas, then crop to the used height so the
  // visible canvas fits the content regardless of how many boxes were drawn.
  const MAX_H = 1000;
  if (!pcrOffCanvas) {
    pcrOffCanvas = document.createElement("canvas");
    pcrOffCanvas.width = DOC_W * SCALE;
    pcrOffCanvas.height = MAX_H * SCALE;
  }
  const off = pcrOffCanvas;
  let octx = pcrPrepOffCtx(off);
  let endY = renderBody(octx);
  if ((endY + 8) * SCALE > off.height) {
    // Content outgrew the buffer: grow with headroom and render again
    // (resizing wipes the canvas).
    off.height = Math.ceil(endY + 40) * SCALE;
    octx = pcrPrepOffCtx(off);
    endY = renderBody(octx);
  }
  // Pad to the source template's sheet proportions (519 x 690 ≈ 1.33:1).
  const SHEET_H = Math.round((DOC_W * 690) / 519);
  const totalH = Math.min(off.height / SCALE, Math.max(endY + 8, SHEET_H));

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(off, 0, 0, DOC_W * SCALE, totalH * SCALE, 0, 0, DOC_W * SCALE, totalH * SCALE);
}

function refreshPreview() {
  drawForm();
}

// ── Preview & download ────────────────────────────────────────────────────────
async function downloadPng() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const a = document.createElement("a");
  a.download = "pre-hospital-care-report.png";
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
      const newCount = await window.GumaCounters?.trackDownload("pcr");
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

// ── Saved reports: serialize / hydrate / wiring ───────────────────────────────
function pcrSerializeState() {
  const text = {};
  PCR_TEXT_IDS.forEach((id) => (text[id] = rv(id)));
  const checks = {};
  PCR_CHECK_IDS.forEach((id) => (checks[id] = isChecked(id)));
  return { text, checks };
}

function pcrHydrateState(payload) {
  if (!payload) return;
  const text = payload.text || {};
  PCR_TEXT_IDS.forEach((id) => {
    if (id in text) GumaHistoryWiring.setVal(id, text[id]);
  });
  const checks = payload.checks || {};
  PCR_CHECK_IDS.forEach((id) => GumaHistoryWiring.setChecked(id, !!checks[id]));
  refreshPreview();
}

function pcrBuildLabel(payload) {
  const t = payload.text || {};
  const no = (t.pcr_report_no || t.ems_response_no || "").trim();
  const date = (t.incident_date || "").trim();
  const who = no || "PCR Report";
  return date ? `${who} ${fmtDate(date)}` : who;
}

GumaHistoryWiring.register({
  key: "pcr",
  noun: "report",
  serialize: pcrSerializeState,
  hydrate: pcrHydrateState,
  buildLabel: pcrBuildLabel,
});

// ── Init ──────────────────────────────────────────────────────────────────────
(function initReport() {
  document.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  refreshPreview();
})();
