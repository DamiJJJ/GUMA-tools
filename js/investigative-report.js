"use strict";

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Dynamic row counters ──────────────────────────────────────────────────────
let employeeCount = 0;
let suspectCount = 0;
let involvedCount = 0;
let itemCount = 0;
const MAX_EMPLOYEES = 3;
const MAX_SUSPECTS = 4;
const MAX_INVOLVED = 4;
const MAX_ITEMS = 3;

function syncAddBtn(containerId, btnId, max) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(btnId);
  if (!container || !btn) return;
  const atMax = container.querySelectorAll(".dynamic-row").length >= max;
  btn.disabled = atMax;
  btn.classList.toggle("hidden", atMax);
}

function wireRow(div) {
  irApplyCaps(div);
  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
}

// ── Reporting employees ───────────────────────────────────────────────────────
function addEmployeeRow() {
  const container = document.getElementById("employees-container");
  if (container.querySelectorAll(".dynamic-row").length >= MAX_EMPLOYEES) return;
  const idx = ++employeeCount;
  const prefix = "emp_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Reporting Employee ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();syncAddBtn('employees-container','addEmployeeBtn',MAX_EMPLOYEES);refreshPreview()">&#10005;</button>

    <div class="three-col">
      <div class="form-group">
        <label>Initials, Last Name</label>
        <input type="text" id="${prefix}_name" placeholder="K. Brennan" />
      </div>
      <div class="form-group">
        <label>Serial No.</label>
        <input type="text" id="${prefix}_serial" placeholder="41186" />
      </div>
      <div class="form-group">
        <label>Div. / Detail</label>
        <input type="text" id="${prefix}_detail" placeholder="Central Patrol" />
      </div>
    </div>
  `;

  container.appendChild(div);
  wireRow(div);
  syncAddBtn("employees-container", "addEmployeeBtn", MAX_EMPLOYEES);
  refreshPreview();
}

function removeEmployeeRow(prefix) {
  const idx = prefix.replace("emp_", "");
  document.querySelector(`#employees-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  syncAddBtn("employees-container", "addEmployeeBtn", MAX_EMPLOYEES);
  refreshPreview();
}

// ── Suspects ──────────────────────────────────────────────────────────────────
function addSuspectRow() {
  const container = document.getElementById("suspects-container");
  if (container.querySelectorAll(".dynamic-row").length >= MAX_SUSPECTS) return;
  const idx = ++suspectCount;
  const prefix = "susp_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Suspect ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();syncAddBtn('suspects-container','addSuspectBtn',MAX_SUSPECTS);refreshPreview()">&#10005;</button>

    <div class="form-group">
      <label>Name, Address, DOB if Known; Name, Bkg. No., Charge if Arrested</label>
      <input type="text" id="${prefix}_info" placeholder="Reyes, Daniel Aaron - Bkg. 26-114208 - PC 459" />
    </div>

    <div class="four-col">
      <div class="form-group">
        <label>Sex</label>
        <select id="${prefix}_sex">
          <option value="-">-</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </div>
      <div class="form-group">
        <label>Desc.</label>
        <input type="text" id="${prefix}_desc" placeholder="H" />
      </div>
      <div class="form-group">
        <label>Hair</label>
        <input type="text" id="${prefix}_hair" placeholder="BLK" />
      </div>
      <div class="form-group">
        <label>Eyes</label>
        <input type="text" id="${prefix}_eyes" placeholder="BRO" />
      </div>
    </div>

    <div class="three-col">
      <div class="form-group">
        <label>Height</label>
        <input type="text" id="${prefix}_height" placeholder="5'11&quot;" />
      </div>
      <div class="form-group">
        <label>Weight</label>
        <input type="text" id="${prefix}_weight" placeholder="185" />
      </div>
      <div class="form-group">
        <label>Age</label>
        <input type="text" id="${prefix}_age" placeholder="29" />
      </div>
    </div>

    <div class="form-group">
      <label>Clothing</label>
      <input type="text" id="${prefix}_clothing" placeholder="Black hoodie, dark jeans, white sneakers" />
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Personal Oddities (Scars, Tattoos, etc.)</label>
        <input type="text" id="${prefix}_oddities" placeholder="Tattoo on right forearm" />
      </div>
      <div class="form-group">
        <label>Weapon (Verbal Threats, Bodily Force, etc.)</label>
        <input type="text" id="${prefix}_weapon" placeholder="Pry bar" />
      </div>
    </div>
  `;

  container.appendChild(div);
  wireRow(div);
  syncAddBtn("suspects-container", "addSuspectBtn", MAX_SUSPECTS);
  refreshPreview();
}

function removeSuspectRow(prefix) {
  const idx = prefix.replace("susp_", "");
  document.querySelector(`#suspects-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  syncAddBtn("suspects-container", "addSuspectBtn", MAX_SUSPECTS);
  refreshPreview();
}

// ── Involved persons ──────────────────────────────────────────────────────────
function addInvolvedRow() {
  const container = document.getElementById("involved-container");
  if (container.querySelectorAll(".dynamic-row").length >= MAX_INVOLVED) return;
  const idx = ++involvedCount;
  const prefix = "inv_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Involved Person ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();syncAddBtn('involved-container','addInvolvedBtn',MAX_INVOLVED);refreshPreview()">&#10005;</button>

    <div class="four-col">
      <div class="form-group">
        <label>Code</label>
        <select id="${prefix}_code">
          <option value="-">-</option>
          <option value="W">W - Witness</option>
          <option value="R">R - Person Rptg.</option>
          <option value="S">S - Person Securing</option>
          <option value="D">D - Person Discovering</option>
          <option value="P">P - Parent</option>
          <option value="CP">CP - Contact Person</option>
        </select>
      </div>
      <div class="form-group">
        <label>Sex</label>
        <select id="${prefix}_sex">
          <option value="-">-</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </div>
      <div class="form-group">
        <label>Desc.</label>
        <input type="text" id="${prefix}_desc" placeholder="W" />
      </div>
      <div class="form-group">
        <label>DOB</label>
        <input type="date" id="${prefix}_dob" />
      </div>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Name (Last, First, Middle)</label>
        <input type="text" id="${prefix}_name" placeholder="Hart, Melissa Anne" />
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="text" id="${prefix}_phone" placeholder="(555) 310-4472" />
      </div>
    </div>

    <div class="three-col">
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="${prefix}_address" placeholder="311 San Andreas Ave" />
      </div>
      <div class="form-group">
        <label>City</label>
        <input type="text" id="${prefix}_city" placeholder="Los Santos" />
      </div>
      <div class="form-group">
        <label>Zip</label>
        <input type="text" id="${prefix}_zip" placeholder="90015" />
      </div>
    </div>

    <div class="form-group">
      <label>E-mail Address</label>
      <input type="text" id="${prefix}_email" placeholder="m.hart@eyefind.info" />
    </div>
  `;

  container.appendChild(div);
  wireRow(div);
  syncAddBtn("involved-container", "addInvolvedBtn", MAX_INVOLVED);
  refreshPreview();
}

function removeInvolvedRow(prefix) {
  const idx = prefix.replace("inv_", "");
  document.querySelector(`#involved-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  syncAddBtn("involved-container", "addInvolvedBtn", MAX_INVOLVED);
  refreshPreview();
}

// ── Evidence items ────────────────────────────────────────────────────────────
function addItemRow() {
  const container = document.getElementById("items-container");
  if (container.querySelectorAll(".dynamic-row").length >= MAX_ITEMS) return;
  const idx = ++itemCount;
  const prefix = "item_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Evidence Item ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();syncAddBtn('items-container','addItemBtn',MAX_ITEMS);refreshPreview()">&#10005;</button>

    <div class="two-col">
      <div class="form-group">
        <label>Quantity</label>
        <input type="text" id="${prefix}_quan" placeholder="1" />
      </div>
      <div class="form-group">
        <label>Article</label>
        <input type="text" id="${prefix}_article" placeholder="Pry bar, red handle" />
      </div>
    </div>
    <div class="three-col">
      <div class="form-group">
        <label>Serial No.</label>
        <input type="text" id="${prefix}_serial" placeholder="None" />
      </div>
      <div class="form-group">
        <label>Brand / Model</label>
        <input type="text" id="${prefix}_brand" placeholder="ProLift 18&quot;" />
      </div>
      <div class="form-group">
        <label>Misc.</label>
        <input type="text" id="${prefix}_misc" placeholder="Recovered at scene" />
      </div>
    </div>
  `;

  container.appendChild(div);
  wireRow(div);
  syncAddBtn("items-container", "addItemBtn", MAX_ITEMS);
  refreshPreview();
}

function removeItemRow(prefix) {
  const idx = prefix.replace("item_", "");
  document.querySelector(`#items-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  syncAddBtn("items-container", "addItemBtn", MAX_ITEMS);
  refreshPreview();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return "-";
  const v = el.value.trim();
  return v || "-";
}

function irRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function irChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function fmtDate(raw) {
  if (!raw || raw === "-") return "-";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

// "2026-03-14T09:15" -> "03/14/2026 09:15"
function fmtDatetime(raw) {
  const m = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]} ${m[4]}:${m[5]}` : "-";
}

// Age in full years as of today; null for empty / invalid / future dates
function calcAge(isoDate) {
  if (!isoDate) return null;
  const dob = new Date(isoDate + "T00:00:00");
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age <= 150 ? age : null;
}

/** Write through to a source <select> the way the canvas editor would. */
function setSelectVal(id, value) {
  const el = document.getElementById(id);
  if (!el || el.value === value) return;
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ── Cell specs bound to an input: value and hitbox ref declared once ─────────
const f = (label, id, w, opts) => ({ label, value: getVal(id), w, opts: { ref: id, ...opts } });
const fd = (label, id, w, opts) => ({ label, value: fmtDate(irRawVal(id)), w, opts: { ref: id, kind: "date", ...opts } });
const fdt = (label, id, w, opts) => ({
  label,
  value: fmtDatetime(irRawVal(id)),
  w,
  opts: { ref: id, kind: "datetime", ...opts },
});

// ── Canvas layout constants (logical pixels - rendered ×SCALE) ───────────────
const MARGIN = 24;
const DOC_W = 640;
const BODY_W = DOC_W - MARGIN * 2;
const LINE_W = 0.6;
const CELL_BG = "#f9f9f9";
const HEAD_BG = "#d8d8d8";
const SECT_BG = "#b0b0b0";
const PAGE_GAP = 12;
const GAP_BG = "#c9ccd1";
const A4_H = Math.round(DOC_W * 1.4142);

// Block heights shared by the draw code and nothing else - both pages return
// their real bottom from a measuring pass, so there is no height formula to
// keep in sync (the other reports' Gotcha 14).
const ADD_CHIP_H = 18;
const EMP_ROW_H = 16;
const ITEM_ROW_H = 16;
const FOOTER_H = 16;

// ── No printed value ends in an ellipsis ─────────────────────────────────────
// This is a report: an ellipsis silently drops information somebody typed. Two
// mechanisms together (see js/guma-fit.js) - the value shrinks down to a floor,
// and every input is capped at what its column carries, so the floor is never
// actually reached. Cells here are labelled and one line by construction (the
// label owns the top of the cell), so they shrink and never wrap. The MO and
// narrative boxes are the exception: they wrap into a fixed box, and their
// textareas carry a maxlength in the markup instead.
const IR_VAL_PX = 8;
const IR_VAL_MIN_PX = 4.5; // safety net, unreachable with the caps in place

// Input length caps, keyed by page-level id or by row-field suffix (the
// longest matching suffix wins). Each number is roughly the character count
// its cell carries at 6px Arial, measured against a realistic all-caps sample.
const IR_MAXLEN = {
  // page 1 - header
  agency_name: 60,
  report_of: 64,
  ucr_code: 16,
  cc_no: 12,
  invest_div: 36,
  inc_no: 20,
  dr_no: 28,
  premises: 44,
  // page 1 - victim
  v_name: 66,
  v_desc: 6,
  v_age: 6,
  v_ht: 10,
  v_wt: 10,
  v_address: 56,
  v_city: 26,
  v_zip: 10,
  v_phone: 26,
  v_dl: 50,
  v_language: 44,
  v_email: 74,
  v_cell: 44,
  v_occupation: 100,
  // page 1 - occurrence & entry
  point_exit: 28,
  loc_occurrence: 76,
  rd: 12,
  method: 76,
  instrument: 54,
  prop_type: 62,
  prop_stolen: 20,
  prop_recovered: 20,
  prop_damage: 20,
  vict_veh: 76,
  notifications: 64,
  connected_reports: 48,
  // page 1 - employees / suspects / involved / items (row suffixes)
  person_reporting: 78,
  name: 60,
  serial: 22,
  detail: 60,
  info: 116,
  desc: 6,
  hair: 10,
  eyes: 10,
  height: 10,
  weight: 10,
  age: 6,
  clothing: 76,
  oddities: 88,
  weapon: 88,
  phone: 26,
  address: 66,
  city: 30,
  zip: 10,
  email: 60,
  quan: 12,
  article: 62,
  brand: 36,
  misc: 24,
  // page 1 - suspect vehicle
  sv_year: 8,
  sv_make: 28,
  sv_model: 28,
  sv_type: 20,
  sv_color: 24,
  sv_lic: 20,
  sv_state: 6,
  sv_features: 110,
  // page 1 - evidence / approval
  evid_loc: 64,
  sup_approving: 60,
  sup_serial: 18,
  sup_division: 50,
  category: 40,
  det_reviewing: 60,
  det_serial: 18,
  clerk: 40,
  // page 2 - booking / arrestee
  ar_bkg_no: 24,
  ar_loc_bkd: 52,
  ar_dl_no: 22,
  ar_dl_state: 4,
  ar_last_name: 38,
  ar_first_name: 28,
  ar_middle_name: 24,
  ar_aka: 30,
  ar_address: 64,
  ar_apt: 6,
  ar_city: 40,
  ar_state: 4,
  ar_res_phone: 26,
  ar_descent: 8,
  ar_hair: 8,
  ar_eyes: 8,
  ar_height: 8,
  ar_weight: 8,
  ar_age: 6,
  ar_birthplace: 38,
  ar_veh_lic: 18,
  ar_veh_state: 4,
  ar_rd: 10,
  ar_employer: 58,
  ar_occupation: 56,
  ar_clothing: 70,
  ar_phy_odd: 54,
  ar_hold_for: 48,
  // page 2 - arrest details
  ar_division: 28,
  ar_detail: 36,
  ar_bail: 14,
  ar_total_bail: 14,
  ar_loc_arrest: 96,
  ar_veh_disposition: 78,
  ar_veh_used: 88,
  ar_connecting_rpts: 88,
  ar_loc_crime: 70,
  ar_court: 58,
  ar_complaints: 130,
  // page 2 - charges / admonition
  ar_charge_code: 46,
  ar_definition: 66,
  ar_warrant_no: 42,
  ar_addl_charges: 130,
  ar_admon_name: 90,
  ar_admon_serial: 30,
  // page 2 - combined crime report
  cr_type_offense: 50,
  cr_vict_occupation: 46,
  cr_type_property: 56,
  cr_total: 16,
  cr_damage: 16,
  cr_premises: 74,
  cr_entry_method: 88,
  cr_weapon: 88,
  // page 2 - approval / juvenile
  ar_sup_approving: 52,
  ar_sup_serial: 18,
  ar_officers: 66,
  ar_off_serial: 18,
  ar_off_div: 46,
  ar_clerk: 32,
  juv_invest_ofcr: 52,
  juv_serial: 18,
  juv_div: 52,
  juv_final_charge: 88,
  juv_referral: 88,
  juv_sup_approving: 56,
  juv_sup_serial: 18,
  juv_div_clerk: 56,
};

/** Apply the caps to every text input under a root (page or a fresh row). */
function irApplyCaps(root) {
  GumaFit.applyCaps(root, IR_MAXLEN);
}

// ── Registration guard ────────────────────────────────────────────────────────
// drawForm runs each page once against a 1×1 measuring canvas to learn its real
// height, then once for real. Only the real pass may register hitboxes, or
// every field and chip would exist twice.
let REG = false;
const measureCanvas = document.createElement("canvas");
measureCanvas.width = 1;
measureCanvas.height = 1;

function regField(ref, x, y, w, h, opts) {
  if (REG) window.GumaCanvasEdit?.field(ref, x, y, w, h, opts);
}

function regAction(id, x, y, w, h, handler, opts) {
  if (REG) window.GumaCanvasEdit?.action(id, x, y, w, h, handler, opts);
}

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
  const { bold = false, center = false, bg = CELL_BG } = opts;

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

  // Value. The baseline normally sits 4px off the bottom border, but in a
  // short cell that rides up into the label: 8px Arial has a ~5.8px cap
  // height, so anything above y+13 puts the glyph tops through the label
  // baseline at y+7. Clamp instead of letting the two overlap.
  const valBase = label ? Math.max(y + h - 4, y + 13) : y + h - 4;
  const shown = value || "-";
  ctx.fillStyle = "#000";
  // Shrunk to fit rather than clipped - see IR_MAXLEN above.
  const mkFont = bold ? (px) => "bold " + px + "px Arial" : (px) => px + "px Arial";
  GumaFit.fitFont(ctx, shown, w - 4, IR_VAL_PX, IR_VAL_MIN_PX, mkFont);
  if (center) {
    ctx.textAlign = "center";
    ctx.fillText(clip(ctx, shown, w - 4), x + w / 2, valBase);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, shown, w - 4), x + 2, valBase);
  }

  // The cell already knows the exact box an editor needs - hand it over.
  if (opts.ref) {
    regField(opts.ref, x, y, w, h, {
      kind: opts.kind,
      label,
      align: center ? "center" : "left",
      minEditW: opts.minEditW,
    });
  }
}

// ── Row of cells from spec array, at an arbitrary x origin / width ───────────
function rowAt(ctx, spec, y, h, x0 = MARGIN, w = BODY_W) {
  const widths = spec.map((s) => Math.round(w * s.w));
  widths[widths.length - 1] += w - widths.reduce((a, b) => a + b, 0);
  let x = x0;
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

// ── One checkbox with label; registers a toggle strip ─────────────────────────
function checkItem(ctx, id, label, x, y, labelPx = 5.8, stripW) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x, y - 6, 6.5, 6.5);
  if (irChecked(id)) {
    ctx.fillStyle = "#000";
    ctx.font = "bold 6.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText("X", x + 0.8, y);
  }
  ctx.fillStyle = "#000";
  ctx.font = labelPx + "px Arial";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 9, y);
  const w = stripW || ctx.measureText(label).width + 13;
  regField(id, x - 2, y - 8, w, 11, { kind: "check", label });
}

// ── Bordered strip of independent checkboxes, laid out in equal columns ──────
function checkStrip(ctx, items, y, perRow) {
  const rows = Math.ceil(items.length / perRow);
  const H = rows * 13 + 3;
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(MARGIN, y, BODY_W, H);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, BODY_W, H);
  const colW = BODY_W / perRow;
  items.forEach((item, i) => {
    const cx = MARGIN + (i % perRow) * colW + 4;
    const cy = y + Math.floor(i / perRow) * 13 + 10;
    checkItem(ctx, item.id, item.label, cx, cy, 5.5, colW - 6);
  });
  return y + H;
}

// ── Multiline text box (MO / narrative) ──────────────────────────────────────
function multiBox(ctx, x, y, w, h, label, id) {
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#333";
  ctx.font = "5.8px Arial";
  ctx.textAlign = "left";
  ctx.fillText(clip(ctx, label, w - 4), x + 2, y + 7);

  const raw = irRawVal(id).trim();
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  if (!raw) {
    ctx.font = "8px Arial";
    ctx.fillText("-", x + 3, y + 18);
  } else {
    // Newline-aware fit: shrink until every paragraph's wrapped lines fit the
    // box. The textarea's maxlength keeps the floor unreachable in practice.
    const innerW = w - 6;
    const availH = h - 12;
    let px = 7;
    let lines = [];
    for (;;) {
      ctx.font = px + "px Arial";
      lines = [];
      raw.split("\n").forEach((par) => {
        GumaFit.wrapLines(ctx, par, innerW, 999).forEach((l) => lines.push(l));
      });
      if (lines.length * (px + 1.5) <= availH || px <= 4.5) break;
      px -= 0.5;
    }
    const lineH = px + 1.5;
    const maxLines = Math.max(1, Math.floor(availH / lineH));
    let ty = y + 10 + px;
    lines.slice(0, maxLines).forEach((l) => {
      ctx.fillText(l, x + 3, ty);
      ty += lineH;
    });
  }

  regField(id, x, y, w, h, { kind: "multiline", label, fontPx: 7 });
}

// ── Page footer: form number left, page marker right ─────────────────────────
function pageFooter(ctx, oy, pageH, formNo, pageLabel) {
  ctx.fillStyle = "#000";
  ctx.font = "7px Arial";
  ctx.textAlign = "left";
  ctx.fillText(formNo, MARGIN, oy + pageH - 10);
  ctx.textAlign = "right";
  ctx.fillText(pageLabel, DOC_W - MARGIN, oy + pageH - 10);
}

// ── Page 1: Investigative Report face sheet ──────────────────────────────────
// Returns the content bottom (relative y within the page, incl. bottom room
// for the footer). Painting off the 1×1 measuring canvas is a harmless no-op.
function drawPage1(ctx, oy) {
  let y = oy + MARGIN;

  // Header: editable agency line + title
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 10px Arial";
  const agency = (irRawVal("agency_name").trim() || "Los Santos Police Department").toUpperCase();
  ctx.fillText(agency, DOC_W / 2, y + 8);
  const agencyW = Math.max(150, ctx.measureText(agency).width + 10);
  regField("agency_name", DOC_W / 2 - agencyW / 2, y - 1, agencyW, 12, {
    label: "Agency Name",
    align: "center",
    fontPx: 10,
    transform: "upper",
  });
  ctx.font = "bold 14px Arial";
  ctx.fillText("INVESTIGATIVE REPORT", DOC_W / 2, y + 24);
  y += 30;

  // Meta row
  y = rowAt(
    ctx,
    [
      f("Report Of (Type of Crime)", "report_of", 0.34),
      f("UCR Code", "ucr_code", 0.1),
      f("CC", "cc_no", 0.08),
      f("Invest. Div.", "invest_div", 0.2),
      f("Inc. #", "inc_no", 0.12),
      f("DR #", "dr_no", 0.16, { bold: true }),
    ],
    y,
    22,
  );

  // Combined-evidence flags
  y = checkStrip(
    ctx,
    [
      { id: "cb_combined_evid", label: "COMBINED EVID. REPORT" },
      { id: "cb_multiple_drs", label: "MULTIPLE DRS ON THIS REPORT" },
    ],
    y,
    2,
  );
  y += 4;

  // ── Case screening factors (left) + victim (right) ───────────────────────
  const blockH = 100;
  const LW = 202;
  const RW = BODY_W - LW;

  // Left: screening factors
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(MARGIN, y, LW, blockH);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, LW, blockH);
  ctx.fillStyle = "#000";
  ctx.font = "bold 6.5px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CASE SCREENING FACTOR(S)", MARGIN + LW / 2, y + 9);
  const csf = [
    { id: "cb_csf_suspect", label: "SUSPECT/VEHICLE NOT SEEN" },
    { id: "cb_csf_prints", label: "PRINTS OR OTHER EVIDENCE NOT PRESENT" },
    { id: "cb_csf_mo", label: "MO NOT DISTINCT" },
    { id: "cb_csf_loss", label: "PROPERTY LOSS LESS THAN $5,000" },
    { id: "cb_csf_injury", label: "NO SERIOUS INJURY TO VICTIM" },
    { id: "cb_csf_victim", label: "ONLY ONE VICTIM INVOLVED" },
  ];
  csf.forEach((item, i) => {
    checkItem(ctx, item.id, item.label, MARGIN + 5, y + 20 + i * 10, 5.2, LW - 10);
  });
  // Premises + ATM at the bottom of the left box
  const premY = y + blockH - 22;
  cell(ctx, MARGIN, premY, Math.round(LW * 0.72), 22, "Premises (Specific Type)", getVal("premises"), {
    ref: "premises",
  });
  const atmX = MARGIN + Math.round(LW * 0.72);
  const atmW = LW - Math.round(LW * 0.72);
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(atmX, premY, atmW, 22);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(atmX, premY, atmW, 22);
  checkItem(ctx, "cb_atm", "ATM", atmX + 5, premY + 14, 5.8, atmW - 8);

  // Right: victim block with a rotated tag
  const vx = MARGIN + LW;
  const tagW = 14;
  ctx.fillStyle = SECT_BG;
  ctx.fillRect(vx, y, tagW, blockH);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(vx, y, tagW, blockH);
  ctx.save();
  ctx.translate(vx + tagW / 2, y + blockH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "center";
  ctx.fillText("VICTIM", 0, 3);
  ctx.restore();

  const vx0 = vx + tagW;
  const vw = RW - tagW;
  let vy = y;
  vy = rowAt(
    ctx,
    [
      f("Last Name, First, Middle (or Name of Business)", "v_name", 0.54),
      f("Sex", "v_sex", 0.08, { center: true, kind: "select" }),
      f("Desc.", "v_desc", 0.1, { center: true }),
      f("Age", "v_age", 0.08, { center: true }),
      fd("DOB", "v_dob", 0.2),
    ],
    vy,
    20,
    vx0,
    vw,
  );
  vy = rowAt(
    ctx,
    [f("Residential Address", "v_address", 0.46), f("City", "v_city", 0.22), f("Zip", "v_zip", 0.1), f("Phone", "v_phone", 0.22)],
    vy,
    20,
    vx0,
    vw,
  );
  vy = rowAt(
    ctx,
    [
      f("Ht.", "v_ht", 0.1, { center: true }),
      f("Wt.", "v_wt", 0.1, { center: true }),
      f("Dr. Lic. No. (If None, Other ID & No.)", "v_dl", 0.42),
      f("Foreign Language Spoken", "v_language", 0.38),
    ],
    vy,
    20,
    vx0,
    vw,
  );
  vy = rowAt(ctx, [f("E-mail Address", "v_email", 0.62), f("Cell Phone", "v_cell", 0.38)], vy, 20, vx0, vw);
  vy = rowAt(ctx, [f("Occupation", "v_occupation", 1)], vy, 20, vx0, vw);
  y += blockH;
  y += 4;

  // ── Occurrence & entry ───────────────────────────────────────────────────
  y = rowAt(
    ctx,
    [
      f("Point of Entry", "point_entry", 0.14, { center: true, kind: "select" }),
      f("Point of Exit", "point_exit", 0.16),
      f("Location of Occurrence", "loc_occurrence", 0.4),
      f("Res. / Bus.", "res_bus", 0.12, { center: true, kind: "select" }),
      f("RD", "rd", 0.18, { center: true }),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Method", "method", 0.4),
      fdt("Date & Time of Occurrence", "dt_occurrence", 0.3),
      fdt("Date & Time Reported to PD", "dt_reported", 0.3),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Instrument / Tool Used", "instrument", 0.3),
      f("Type Property Stolen/Lost/Damaged", "prop_type", 0.34),
      f("$ Stolen/Lost", "prop_stolen", 0.12, { center: true }),
      f("$ Recovered", "prop_recovered", 0.12, { center: true }),
      f("$ Est. Damage", "prop_damage", 0.12, { center: true }),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Vict's Veh. (Year, Make, Type, Color, Lic. No.)", "vict_veh", 0.4),
      f("Notification(s) (Person & Division)", "notifications", 0.34),
      f("Connected Report(s) (Type & DR #)", "connected_reports", 0.26),
    ],
    y,
    20,
  );

  // ── MO ───────────────────────────────────────────────────────────────────
  multiBox(
    ctx,
    MARGIN,
    y,
    BODY_W,
    48,
    "MO: LIST UNIQUE ACTIONS. IF SHORT FORM, DESCRIBE SUSPECT'S ACTIONS IN BRIEF PHRASES, INCLUDING ANY WEAPON USED.",
    "mo",
  );
  y += 48;

  // ── Incident flags ───────────────────────────────────────────────────────
  y = checkStrip(
    ctx,
    [
      { id: "cb_school", label: "THREAT OF SCHOOL VIOLENCE" },
      { id: "cb_transit", label: "TRANSIT-RELATED INCIDENT" },
      { id: "cb_marsys", label: "MARSY'S RIGHTS CARD PROVIDED" },
      { id: "cb_hatred", label: "MOTIVATED BY HATRED/PREJUDICE" },
      { id: "cb_domestic", label: "DOMESTIC VIOLENCE" },
    ],
    y,
    3,
  );
  y += 4;

  // ── Reporting employees ──────────────────────────────────────────────────
  y = sectionBar(ctx, "REPORTING EMPLOYEE(S)", y);
  const empCols = [
    { label: "Initials, Last Name", w: 0.4 },
    { label: "Serial No.", w: 0.2 },
    { label: "Div. / Detail", w: 0.4 },
  ];
  const empWidths = empCols.map((c) => Math.round(BODY_W * c.w));
  empWidths[empWidths.length - 1] += BODY_W - empWidths.reduce((a, b) => a + b, 0);
  let ex = MARGIN;
  empCols.forEach((c, i) => {
    ctx.fillStyle = HEAD_BG;
    ctx.fillRect(ex, y, empWidths[i], 12);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = LINE_W;
    ctx.strokeRect(ex, y, empWidths[i], 12);
    ctx.fillStyle = "#000";
    ctx.font = "5.8px Arial";
    ctx.textAlign = "left";
    ctx.fillText(c.label, ex + 2, y + 8);
    ex += empWidths[i];
  });
  y += 12;
  const employees = collectRows("employees-container", "emp_", ["name", "serial", "detail"]);
  employees.forEach((e) => {
    let dx = MARGIN;
    ["name", "serial", "detail"].forEach((key, i) => {
      cell(ctx, dx, y, empWidths[i], EMP_ROW_H, "", e[key], { ref: e._p + "_" + key });
      dx += empWidths[i];
    });
    regAction("rm_" + e._p, DOC_W - MARGIN + 3, y + 1, 18, 14, () => removeEmployeeRow(e._p), {
      label: "✕",
      kind: "remove",
      title: "Remove this employee",
    });
    y += EMP_ROW_H;
  });
  // Person reporting + received-by-phone
  cell(ctx, MARGIN, y, Math.round(BODY_W * 0.6), 20, "Person Reporting (Name)", getVal("person_reporting"), {
    ref: "person_reporting",
  });
  const prX = MARGIN + Math.round(BODY_W * 0.6);
  const prW = BODY_W - Math.round(BODY_W * 0.6);
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(prX, y, prW, 20);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(prX, y, prW, 20);
  checkItem(ctx, "cb_phone_report", "OR RECEIVED BY PHONE", prX + 5, y + 13, 5.8, prW - 8);
  y += 20;
  if (employees.length < MAX_EMPLOYEES) {
    regAction("add_employee", MARGIN, y + 2, 110, 14, () => addEmployeeRow(), {
      label: "+ Add Employee",
      kind: "add",
      title: "Add another reporting employee",
    });
  }
  y += ADD_CHIP_H;

  // Instruction line
  ctx.fillStyle = "#000";
  ctx.font = "italic 6px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Complete below sections if any CASE SCREENING FACTOR(S) boxes are not checked.", MARGIN, y + 6);
  y += 12;

  // ── Suspect's vehicle ────────────────────────────────────────────────────
  y = sectionBar(ctx, "SUSP'S VEHICLE", y);
  y = rowAt(
    ctx,
    [
      f("Year", "sv_year", 0.08, { center: true }),
      f("Make", "sv_make", 0.16),
      f("Model", "sv_model", 0.16),
      f("Type", "sv_type", 0.12),
      f("Color(s)", "sv_color", 0.14),
      f("Veh. Lic. No.", "sv_lic", 0.2),
      f("State", "sv_state", 0.14, { center: true }),
    ],
    y,
    20,
  );
  y = rowAt(ctx, [f("Body Damage / Unique Features (Wheels, Paint, Decals, Windows)", "sv_features", 1)], y, 20);

  // ── Suspects ─────────────────────────────────────────────────────────────
  y = sectionBar(ctx, "SUSPECT(S)", y);
  const suspects = collectRows("suspects-container", "susp_", [
    "info",
    "sex",
    "desc",
    "hair",
    "eyes",
    "height",
    "weight",
    "age",
    "clothing",
    "oddities",
    "weapon",
  ]);
  suspects.forEach((s, i) => {
    // Header strip: S-n tag + known-info field
    const tagBoxW = 24;
    ctx.fillStyle = HEAD_BG;
    ctx.fillRect(MARGIN, y, tagBoxW, 20);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = LINE_W;
    ctx.strokeRect(MARGIN, y, tagBoxW, 20);
    ctx.fillStyle = "#000";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText("S-" + (i + 1), MARGIN + tagBoxW / 2, y + 13);
    cell(
      ctx,
      MARGIN + tagBoxW,
      y,
      BODY_W - tagBoxW,
      20,
      "Name, Address, DOB if Known; Name, Bkg. No., Charge if Arrested",
      s.info,
      { ref: s._p + "_info" },
    );
    regAction("rm_" + s._p, DOC_W - MARGIN + 3, y + 3, 18, 14, () => removeSuspectRow(s._p), {
      label: "✕",
      kind: "remove",
      title: "Remove this suspect",
    });
    y += 20;

    y = rowAt(
      ctx,
      [
        { label: "Sex", value: s.sex, w: 0.07, opts: { ref: s._p + "_sex", center: true, kind: "select" } },
        { label: "Desc.", value: s.desc, w: 0.07, opts: { ref: s._p + "_desc", center: true } },
        { label: "Hair", value: s.hair, w: 0.09, opts: { ref: s._p + "_hair", center: true } },
        { label: "Eyes", value: s.eyes, w: 0.09, opts: { ref: s._p + "_eyes", center: true } },
        { label: "Height", value: s.height, w: 0.1, opts: { ref: s._p + "_height", center: true } },
        { label: "Weight", value: s.weight, w: 0.1, opts: { ref: s._p + "_weight", center: true } },
        { label: "Age", value: s.age, w: 0.07, opts: { ref: s._p + "_age", center: true } },
        { label: "Clothing", value: s.clothing, w: 0.41, opts: { ref: s._p + "_clothing" } },
      ],
      y,
      20,
    );
    y = rowAt(
      ctx,
      [
        {
          label: "Personal Oddities (Unusual Features, Scars, Tattoos, etc.)",
          value: s.oddities,
          w: 0.5,
          opts: { ref: s._p + "_oddities" },
        },
        {
          label: "Weapon (Verbal Threats, Bodily Force, Simulated Gun, etc. - If Knife or Gun, Describe Fully)",
          value: s.weapon,
          w: 0.5,
          opts: { ref: s._p + "_weapon" },
        },
      ],
      y,
      24,
    );
  });
  if (suspects.length < MAX_SUSPECTS) {
    regAction("add_suspect", MARGIN, y + 2, 110, 14, () => addSuspectRow(), {
      label: "+ Add Suspect",
      kind: "add",
      title: "Add another suspect",
    });
  }
  y += ADD_CHIP_H;

  // ── Involved persons ─────────────────────────────────────────────────────
  y = sectionBar(ctx, "INVOLVED PERSON(S)", y);
  ctx.fillStyle = "#000";
  ctx.font = "5.2px Arial";
  ctx.textAlign = "left";
  ctx.fillText(
    "W - WITNESS;  R - PERSON RPTG.;  S - PERSON SECURING (459);  D - PERSON DISCOVERING (459);  P - PARENT;  CP - CONTACT PERSON (DOMESTIC VIOLENCE)",
    MARGIN + 1,
    y + 7,
  );
  y += 10;
  const involved = collectRows("involved-container", "inv_", [
    "code",
    "name",
    "sex",
    "desc",
    "dob",
    "phone",
    "address",
    "city",
    "zip",
    "email",
  ]);
  involved.forEach((p) => {
    y = rowAt(
      ctx,
      [
        { label: "Code", value: p.code, w: 0.08, opts: { ref: p._p + "_code", center: true, kind: "select" } },
        { label: "Name (Last, First, Middle)", value: p.name, w: 0.38, opts: { ref: p._p + "_name" } },
        { label: "Sex", value: p.sex, w: 0.07, opts: { ref: p._p + "_sex", center: true, kind: "select" } },
        { label: "Desc.", value: p.desc, w: 0.08, opts: { ref: p._p + "_desc", center: true } },
        { label: "DOB", value: fmtDate(p.dob), w: 0.15, opts: { ref: p._p + "_dob", kind: "date" } },
        { label: "Phone", value: p.phone, w: 0.24, opts: { ref: p._p + "_phone" } },
      ],
      y,
      20,
    );
    regAction("rm_" + p._p, DOC_W - MARGIN + 3, y - 17, 18, 14, () => removeInvolvedRow(p._p), {
      label: "✕",
      kind: "remove",
      title: "Remove this person",
    });
    y = rowAt(
      ctx,
      [
        { label: "Address", value: p.address, w: 0.38, opts: { ref: p._p + "_address" } },
        { label: "City", value: p.city, w: 0.18, opts: { ref: p._p + "_city" } },
        { label: "Zip", value: p.zip, w: 0.1, opts: { ref: p._p + "_zip" } },
        { label: "E-mail Address", value: p.email, w: 0.34, opts: { ref: p._p + "_email" } },
      ],
      y,
      20,
    );
  });
  if (involved.length < MAX_INVOLVED) {
    regAction("add_involved", MARGIN, y + 2, 110, 14, () => addInvolvedRow(), {
      label: "+ Add Person",
      kind: "add",
      title: "Add another involved person",
    });
  }
  y += ADD_CHIP_H;

  // ── Combined evidence report ─────────────────────────────────────────────
  y = sectionBar(ctx, "COMBINED EVID. RPT.", y);
  // Instruction cell is print-only; the two on the right are editable.
  const noteW = Math.round(BODY_W * 0.45);
  ctx.fillStyle = CELL_BG;
  ctx.fillRect(MARGIN, y, noteW, 20);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, noteW, 20);
  ctx.fillStyle = "#333";
  ctx.font = "5.2px Arial";
  ctx.textAlign = "left";
  wrapLabel(ctx, "USE THIS SECTION IN LIEU OF PROPERTY REPORT IF NO GUN AND NO MORE THAN THREE ITEMS OF EVIDENCE.", MARGIN + 2, y + 7, noteW - 4, 6);
  rowAt(
    ctx,
    [f("Loc. Evid. Bkd.", "evid_loc", 0.64), f("10.10.00 Given?", "evid_given", 0.36, { center: true, kind: "select" })],
    y,
    20,
    MARGIN + noteW,
    BODY_W - noteW,
  );
  y += 20;
  const itemCols = [
    { label: "Item", w: 0.07 },
    { label: "Quan.", w: 0.08 },
    { label: "Article", w: 0.33 },
    { label: "Serial No.", w: 0.18 },
    { label: "Brand / Model", w: 0.2 },
    { label: "Misc.", w: 0.14 },
  ];
  const itemWidths = itemCols.map((c) => Math.round(BODY_W * c.w));
  itemWidths[itemWidths.length - 1] += BODY_W - itemWidths.reduce((a, b) => a + b, 0);
  let ix = MARGIN;
  itemCols.forEach((c, i) => {
    ctx.fillStyle = HEAD_BG;
    ctx.fillRect(ix, y, itemWidths[i], 12);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = LINE_W;
    ctx.strokeRect(ix, y, itemWidths[i], 12);
    ctx.fillStyle = "#000";
    ctx.font = "5.8px Arial";
    ctx.textAlign = "left";
    ctx.fillText(c.label, ix + 2, y + 8);
    ix += itemWidths[i];
  });
  y += 12;
  const items = collectRows("items-container", "item_", ["quan", "article", "serial", "brand", "misc"]);
  items.forEach((it, n) => {
    let dx = MARGIN;
    // Item number is derived from position, not typed.
    cell(ctx, dx, y, itemWidths[0], ITEM_ROW_H, "", String(n + 1), { center: true });
    dx += itemWidths[0];
    ["quan", "article", "serial", "brand", "misc"].forEach((key, i) => {
      cell(ctx, dx, y, itemWidths[i + 1], ITEM_ROW_H, "", it[key], { ref: it._p + "_" + key });
      dx += itemWidths[i + 1];
    });
    regAction("rm_" + it._p, DOC_W - MARGIN + 3, y + 1, 18, 14, () => removeItemRow(it._p), {
      label: "✕",
      kind: "remove",
      title: "Remove this item",
    });
    y += ITEM_ROW_H;
  });
  if (items.length < MAX_ITEMS) {
    regAction("add_item", MARGIN, y + 2, 110, 14, () => addItemRow(), {
      label: "+ Add Item",
      kind: "add",
      title: "Add another evidence item",
    });
  }
  y += ADD_CHIP_H;

  // ── Narrative ────────────────────────────────────────────────────────────
  y = sectionBar(ctx, "NARRATIVE", y);
  multiBox(
    ctx,
    MARGIN,
    y,
    BODY_W,
    96,
    "USE HEADINGS: SOURCE OF ACTIVITY, INVESTIGATION, ARREST, INJURIES, PHOTOGRAPHS, EVIDENCE, PROPERTY, COURT INFORMATION, OTHER.",
    "narrative",
  );
  y += 96;
  y = rowAt(
    ctx,
    [
      f(
        "Is any of the Victim's property marked with an owner-applied identification number? (If Yes, explain in narrative)",
        "prop_marked",
        1,
        { center: true, kind: "select" },
      ),
    ],
    y,
    20,
  );

  // ── Approval and review ──────────────────────────────────────────────────
  y = sectionBar(ctx, "APPROVAL AND REVIEW", y);
  y = rowAt(
    ctx,
    [
      f("Supervisor Approving", "sup_approving", 0.34),
      f("Serial No.", "sup_serial", 0.14),
      f("Division", "sup_division", 0.28),
      f("Category", "category", 0.24),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Detective Supervisor Reviewing", "det_reviewing", 0.34),
      f("Serial No.", "det_serial", 0.14),
      fdt("Date & Time Reproduced", "dt_reproduced", 0.28),
      f("Clerk", "clerk", 0.24),
    ],
    y,
    20,
  );

  return y - oy + FOOTER_H + MARGIN;
}

// ── Page 2: Arrest Report ────────────────────────────────────────────────────
function drawPage2(ctx, oy) {
  let y = oy + MARGIN;

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 14px Arial";
  ctx.fillText("ARREST REPORT", DOC_W / 2, y + 12);
  y += 20;

  // Booking row - UCR/CC reuse the page-1 inputs; the registry anchors each
  // printed occurrence to its own box.
  y = rowAt(
    ctx,
    [
      f("Bkg. No.", "ar_bkg_no", 0.14, { bold: true }),
      f("Loc. Bkd.", "ar_loc_bkd", 0.28),
      f("Driver's Lic. No.", "ar_dl_no", 0.2),
      f("State", "ar_dl_state", 0.08, { center: true }),
      f("UCR Code", "ucr_code", 0.16),
      f("CC", "cc_no", 0.14),
    ],
    y,
    20,
  );

  // ── Arrestee ─────────────────────────────────────────────────────────────
  y = sectionBar(ctx, "ARRESTEE", y);
  y = rowAt(
    ctx,
    [
      f("Arrestee's Last Name", "ar_last_name", 0.34),
      f("First", "ar_first_name", 0.26),
      f("Middle", "ar_middle_name", 0.22),
      f("AKA / Nickname", "ar_aka", 0.18),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Address", "ar_address", 0.4),
      f("Apt. No.", "ar_apt", 0.08, { center: true }),
      f("City", "ar_city", 0.24),
      f("State", "ar_state", 0.08, { center: true }),
      f("Residence Phone No.", "ar_res_phone", 0.2),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Sex", "ar_sex", 0.07, { center: true, kind: "select" }),
      f("Descent", "ar_descent", 0.1, { center: true }),
      f("Hair", "ar_hair", 0.09, { center: true }),
      f("Eyes", "ar_eyes", 0.09, { center: true }),
      f("Height", "ar_height", 0.1, { center: true }),
      f("Weight", "ar_weight", 0.1, { center: true }),
      fd("Birthdate", "ar_birthdate", 0.17),
      f("Age", "ar_age", 0.07, { center: true }),
      f("Birthplace (City/State/Country)", "ar_birthplace", 0.21),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Veh. Lic. No.", "ar_veh_lic", 0.16),
      f("State", "ar_veh_state", 0.08, { center: true }),
      f("R.D.", "ar_rd", 0.1, { center: true }),
      f("Employer / School", "ar_employer", 0.34),
      f("Occupation / Grade", "ar_occupation", 0.32),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [f("Clothing Worn", "ar_clothing", 0.4), f("Phy. Odd.", "ar_phy_odd", 0.32), f("Hold For", "ar_hold_for", 0.28)],
    y,
    20,
  );

  // ── Arrest ───────────────────────────────────────────────────────────────
  y = sectionBar(ctx, "ARREST", y);
  y = rowAt(
    ctx,
    [
      f("Division", "ar_division", 0.18),
      f("Detail Arresting", "ar_detail", 0.22),
      fd("Date Arrested", "ar_date_arrested", 0.16),
      f("Time Arr.", "ar_time_arr", 0.12, { center: true, kind: "time" }),
      f("Time Bkd.", "ar_time_bkd", 0.12, { center: true, kind: "time" }),
      f("Bail $", "ar_bail", 0.1, { center: true }),
      f("Total Bail $", "ar_total_bail", 0.1, { center: true }),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Location of Arrest", "ar_loc_arrest", 0.55),
      f("Exact Location / Disposition Arrestee's Vehicle", "ar_veh_disposition", 0.45),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Vehicle Used (Year, Make, Model, Type, Colors, Lic. No., ID Marks)", "ar_veh_used", 0.5),
      f("List Connecting Rpts. by Type & Identifying Nos.", "ar_connecting_rpts", 0.5),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Location Crime Committed", "ar_loc_crime", 0.4),
      fd("Arraign. Date", "ar_arraign_date", 0.14),
      f("Time", "ar_arraign_time", 0.12, { center: true, kind: "time" }),
      f("Court", "ar_court", 0.34),
    ],
    y,
    20,
  );
  y = rowAt(ctx, [f("Complaints / Evid. of Illness or Injury & by Whom Treated", "ar_complaints", 1)], y, 20);

  // ── Charges ──────────────────────────────────────────────────────────────
  y = sectionBar(ctx, "CHARGES", y);
  y = rowAt(
    ctx,
    [
      f("Typ", "ar_charge_type", 0.08, { center: true, kind: "select" }),
      f("Charge & Code", "ar_charge_code", 0.28),
      f("Definition", "ar_definition", 0.38),
      f("Warrant No.", "ar_warrant_no", 0.26),
    ],
    y,
    20,
  );
  y = rowAt(ctx, [f("Additional Charges (Code, Court and Bail)", "ar_addl_charges", 1)], y, 20);

  // ── Admonition of rights ─────────────────────────────────────────────────
  y = sectionBar(ctx, "ADMONITION OF RIGHTS (WHEN APPLICABLE)", y);
  ctx.fillStyle = "#000";
  ctx.font = "bold 6.5px Arial";
  ctx.textAlign = "left";
  ctx.fillText("THE ADMONITION OF RIGHTS WAS READ VERBATIM PER FORM 15.03.00 BY:", MARGIN + 2, y + 9);
  y += 12;
  y = rowAt(ctx, [f("Name", "ar_admon_name", 0.6), f("Serial No.", "ar_admon_serial", 0.4)], y, 20);
  y = rowAt(
    ctx,
    [
      f("Understood Rights?", "ar_understood", 0.34, { center: true, kind: "select" }),
      f("Rights Invoked?", "ar_invoked", 0.33, { center: true, kind: "select" }),
      f("Statement Made?", "ar_statement", 0.33, { center: true, kind: "select" }),
    ],
    y,
    20,
  );

  // ── Combined crime report ────────────────────────────────────────────────
  y = sectionBar(ctx, "COMBINED CRIME REPORT", y);
  y = rowAt(
    ctx,
    [
      f("Type Offense", "cr_type_offense", 0.3),
      f("Vict's Occupation", "cr_vict_occupation", 0.28),
      fdt("Date and Time Crime Occurred", "cr_dt_crime", 0.42),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Type Property", "cr_type_property", 0.34),
      f("Total $", "cr_total", 0.12, { center: true }),
      f("Est. Damage $", "cr_damage", 0.12, { center: true }),
      f("Type of Premises", "cr_premises", 0.42),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("459 / BFV Only: Point and Method of Entry", "cr_entry_method", 0.5),
      f("Weapon / Force / Instrument Used", "cr_weapon", 0.5),
    ],
    y,
    20,
  );
  multiBox(ctx, MARGIN, y, BODY_W, 34, "MO (UNIQUE ACTIONS)", "cr_mo");
  y += 34;
  y = checkStrip(
    ctx,
    [
      { id: "cb_cr_gang", label: "GANG RELATED" },
      { id: "cb_cr_school", label: "THREAT OF SCHOOL VIOLENCE" },
      { id: "cb_cr_transit", label: "TRANSIT-RELATED INCIDENT" },
      { id: "cb_cr_hatred", label: "MOTIVATED BY HATRED/PREJUDICE" },
      { id: "cb_cr_domestic", label: "DOMESTIC VIOLENCE" },
      { id: "cb_cr_marsys", label: "MARSY'S RIGHTS CARD PROVIDED" },
    ],
    y,
    3,
  );

  // ── Approval / reporting officers ────────────────────────────────────────
  y = sectionBar(ctx, "APPROVAL / REPORTING OFFICERS", y);
  y = rowAt(
    ctx,
    [
      f("Supervisor Approving Report", "ar_sup_approving", 0.32),
      f("Serial No.", "ar_sup_serial", 0.14),
      f("Rap Sheet Attached?", "ar_rap_sheet", 0.18, { center: true, kind: "select" }),
      fdt("Date & Time Reproduced", "ar_dt_reproduced", 0.36),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Reporting Officer(s)", "ar_officers", 0.38),
      f("Serial No.", "ar_off_serial", 0.14),
      f("Div. & Detail", "ar_off_div", 0.28),
      f("Clerk", "ar_clerk", 0.2),
    ],
    y,
    20,
  );

  // ── Juvenile disposition ─────────────────────────────────────────────────
  y = sectionBar(ctx, "JUVENILE DISPO.", y);
  y = rowAt(
    ctx,
    [
      f("Petition Request", "juv_petition", 0.22, { center: true, kind: "select" }),
      f("Invest. Ofcr.", "juv_invest_ofcr", 0.32),
      f("Serial No.", "juv_serial", 0.14),
      f("Div.", "juv_div", 0.32),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Final Charge, if Different from Original", "juv_final_charge", 0.5),
      f("If Referred, Agency & Person Accepting Referral", "juv_referral", 0.5),
    ],
    y,
    20,
  );
  y = rowAt(
    ctx,
    [
      f("Property Booked?", "juv_prop_booked", 0.18, { center: true, kind: "select" }),
      f("Supervisor Approving", "juv_sup_approving", 0.34),
      f("Serial No.", "juv_sup_serial", 0.14),
      f("Div. / Clerk", "juv_div_clerk", 0.34),
    ],
    y,
    20,
  );

  return y - oy + FOOTER_H + MARGIN;
}

// ── Collect dynamic rows from a container ────────────────────────────────────
function collectRows(containerId, prefix, keys) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll(".dynamic-row")).map((row) => {
    const p = prefix + row.dataset.idx;
    const o = { _p: p };
    keys.forEach((k) => {
      const el = document.getElementById(p + "_" + k);
      o[k] = el ? el.value.trim() || "-" : "-";
      if (k === "dob") o[k] = el ? el.value : "";
    });
    return o;
  });
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });

  // Measuring pass: same code path as the real one, but nothing registers and
  // nothing visible is painted (the canvas is 1×1).
  REG = false;
  const mctx = measureCanvas.getContext("2d");
  const p1H = Math.max(A4_H, drawPage1(mctx, 0));
  const p2H = Math.max(A4_H, drawPage2(mctx, 0));
  const totalH = p1H + PAGE_GAP + p2H;

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Gap strip between the two sheets, white paper on each
  ctx.fillStyle = GAP_BG;
  ctx.fillRect(0, 0, DOC_W, totalH);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, p1H);
  ctx.fillRect(0, p1H + PAGE_GAP, DOC_W, p2H);

  REG = true;
  drawPage1(ctx, 0);
  pageFooter(ctx, 0, p1H, "03.01.00 (09/16/2022)", "PAGE 1 OF 2");
  drawPage2(ctx, p1H + PAGE_GAP);
  pageFooter(ctx, p1H + PAGE_GAP, p2H, "05.02.00 (09/19/2022)", "PAGE 2 OF 2");

  // Page bounds for per-page export (logical px, gap excluded).
  irPageBounds = [
    { y: 0, h: p1H },
    { y: p1H + PAGE_GAP, h: p2H },
  ];

  window.GumaCanvasEdit?.end();
}

// ── Per-page export ──────────────────────────────────────────────────────────
let irPageBounds = [];

/** A fresh offscreen canvas holding just one sheet of the document. */
function irPageCanvas(i) {
  const src = document.getElementById("docCanvas");
  const b = irPageBounds[i];
  const c = document.createElement("canvas");
  c.width = DOC_W * SCALE;
  c.height = Math.round(b.h * SCALE);
  c.getContext("2d").drawImage(src, 0, Math.round(b.y * SCALE), c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  drawForm();
}

// Both exporters take the modal's current page index: a two-page PNG pasted
// into Discord is unreadable, so each sheet ships on its own. History still
// stores the full document once.
async function downloadPng(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && irPageBounds[pageIndex];
  const a = document.createElement("a");
  a.download = perPage ? `investigative-report-page-${pageIndex + 1}.png` : "investigative-report.png";
  a.href = (perPage ? irPageCanvas(pageIndex) : canvas).toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && irPageBounds[pageIndex];
  if (!(await GumaClipboard.copyCanvas(perPage ? irPageCanvas(pageIndex) : canvas))) return;

  const newCount = await window.GumaCounters?.trackDownload("investigative");
  const countEl = document.getElementById("downloadCount");
  if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
  GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
}

// ── Init ─────────────────────────────────────────────────────────────────────
irApplyCaps(document);
document.querySelectorAll("input,select,textarea").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});

// Auto-fill ages from the date-of-birth inputs. Registered after the generic
// refresh listeners, so the age is written before the next redraw reads it
// (same-event listeners run in registration order on the same element, and
// the redraw itself is triggered by the input event these also receive).
[
  ["v_dob", "v_age"],
  ["ar_birthdate", "ar_age"],
].forEach(([dobId, ageId]) => {
  document.getElementById(dobId)?.addEventListener("input", () => {
    const age = calcAge(irRawVal(dobId));
    if (age !== null) {
      const ageEl = document.getElementById(ageId);
      if (ageEl) ageEl.value = String(age);
    }
  });
});

addEmployeeRow();
addSuspectRow();
addInvolvedRow();
addItemRow();

// ── Saved reports: serialize / hydrate / wiring ───────────────

const IR_SCALAR_FIELDS = [
  // page 1
  "agency_name",
  "report_of",
  "ucr_code",
  "cc_no",
  "invest_div",
  "inc_no",
  "dr_no",
  "premises",
  "v_name",
  "v_sex",
  "v_desc",
  "v_age",
  "v_dob",
  "v_ht",
  "v_wt",
  "v_address",
  "v_city",
  "v_zip",
  "v_phone",
  "v_dl",
  "v_language",
  "v_email",
  "v_cell",
  "v_occupation",
  "point_entry",
  "point_exit",
  "res_bus",
  "loc_occurrence",
  "rd",
  "method",
  "dt_occurrence",
  "dt_reported",
  "instrument",
  "prop_type",
  "prop_stolen",
  "prop_recovered",
  "prop_damage",
  "vict_veh",
  "notifications",
  "connected_reports",
  "mo",
  "person_reporting",
  "sv_year",
  "sv_make",
  "sv_model",
  "sv_type",
  "sv_color",
  "sv_lic",
  "sv_state",
  "sv_features",
  "evid_loc",
  "evid_given",
  "narrative",
  "prop_marked",
  "sup_approving",
  "sup_serial",
  "sup_division",
  "category",
  "det_reviewing",
  "det_serial",
  "dt_reproduced",
  "clerk",
  // page 2
  "ar_bkg_no",
  "ar_loc_bkd",
  "ar_dl_no",
  "ar_dl_state",
  "ar_last_name",
  "ar_first_name",
  "ar_middle_name",
  "ar_aka",
  "ar_address",
  "ar_apt",
  "ar_city",
  "ar_state",
  "ar_res_phone",
  "ar_sex",
  "ar_descent",
  "ar_hair",
  "ar_eyes",
  "ar_height",
  "ar_weight",
  "ar_birthdate",
  "ar_age",
  "ar_birthplace",
  "ar_veh_lic",
  "ar_veh_state",
  "ar_rd",
  "ar_employer",
  "ar_occupation",
  "ar_clothing",
  "ar_phy_odd",
  "ar_hold_for",
  "ar_division",
  "ar_detail",
  "ar_date_arrested",
  "ar_time_arr",
  "ar_time_bkd",
  "ar_loc_arrest",
  "ar_bail",
  "ar_total_bail",
  "ar_veh_disposition",
  "ar_veh_used",
  "ar_connecting_rpts",
  "ar_loc_crime",
  "ar_arraign_date",
  "ar_arraign_time",
  "ar_court",
  "ar_complaints",
  "ar_charge_type",
  "ar_charge_code",
  "ar_definition",
  "ar_warrant_no",
  "ar_addl_charges",
  "ar_admon_name",
  "ar_admon_serial",
  "ar_understood",
  "ar_invoked",
  "ar_statement",
  "cr_type_offense",
  "cr_vict_occupation",
  "cr_dt_crime",
  "cr_type_property",
  "cr_total",
  "cr_damage",
  "cr_premises",
  "cr_entry_method",
  "cr_weapon",
  "cr_mo",
  "ar_sup_approving",
  "ar_sup_serial",
  "ar_rap_sheet",
  "ar_dt_reproduced",
  "ar_officers",
  "ar_off_serial",
  "ar_off_div",
  "ar_clerk",
  "juv_petition",
  "juv_invest_ofcr",
  "juv_serial",
  "juv_div",
  "juv_final_charge",
  "juv_referral",
  "juv_prop_booked",
  "juv_sup_approving",
  "juv_sup_serial",
  "juv_div_clerk",
];

const IR_CHECK_FIELDS = [
  "cb_combined_evid",
  "cb_multiple_drs",
  "cb_csf_suspect",
  "cb_csf_prints",
  "cb_csf_mo",
  "cb_csf_loss",
  "cb_csf_injury",
  "cb_csf_victim",
  "cb_atm",
  "cb_school",
  "cb_transit",
  "cb_marsys",
  "cb_hatred",
  "cb_domestic",
  "cb_phone_report",
  "cb_cr_gang",
  "cb_cr_school",
  "cb_cr_transit",
  "cb_cr_hatred",
  "cb_cr_domestic",
  "cb_cr_marsys",
];

const IR_EMP_FIELDS = ["name", "serial", "detail"];
const IR_SUSP_FIELDS = ["info", "sex", "desc", "hair", "eyes", "height", "weight", "age", "clothing", "oddities", "weapon"];
const IR_INV_FIELDS = ["code", "name", "sex", "desc", "dob", "phone", "address", "city", "zip", "email"];
const IR_ITEM_FIELDS = ["quan", "article", "serial", "brand", "misc"];

function irCollectRaw(containerId, prefix, keys) {
  const c = document.getElementById(containerId);
  if (!c) return [];
  return Array.from(c.querySelectorAll(".dynamic-row")).map((row) => {
    const p = prefix + row.dataset.idx;
    const o = {};
    keys.forEach((k) => (o[k] = irRawVal(p + "_" + k)));
    return o;
  });
}

function irSerializeState() {
  const fields = {};
  IR_SCALAR_FIELDS.forEach((id) => (fields[id] = irRawVal(id)));
  const checks = {};
  IR_CHECK_FIELDS.forEach((id) => (checks[id] = irChecked(id)));
  return {
    fields,
    checks,
    employees: irCollectRaw("employees-container", "emp_", IR_EMP_FIELDS),
    suspects: irCollectRaw("suspects-container", "susp_", IR_SUSP_FIELDS),
    involved: irCollectRaw("involved-container", "inv_", IR_INV_FIELDS),
    items: irCollectRaw("items-container", "item_", IR_ITEM_FIELDS),
  };
}

function irHydrateState(payload) {
  if (!payload) return;
  // The containers are rebuilt below; an open editor would write into a
  // detached node.
  window.GumaCanvasEdit?.cancelEdit();
  const setVal = GumaHistoryWiring.setVal;

  const flds = payload.fields || {};
  IR_SCALAR_FIELDS.forEach((id) => setVal(id, flds[id]));

  const ch = payload.checks || {};
  IR_CHECK_FIELDS.forEach((id) => GumaHistoryWiring.setChecked(id, ch[id]));

  const rebuild = (containerId, addFn, rows, prefixOf, keys) => {
    const c = document.getElementById(containerId);
    if (c) c.innerHTML = "";
    (rows || []).forEach((r) => {
      addFn();
      const prefix = prefixOf();
      keys.forEach((k) => setVal(prefix + "_" + k, r[k]));
    });
  };

  employeeCount = 0;
  rebuild("employees-container", addEmployeeRow, payload.employees, () => "emp_" + employeeCount, IR_EMP_FIELDS);
  suspectCount = 0;
  rebuild("suspects-container", addSuspectRow, payload.suspects, () => "susp_" + suspectCount, IR_SUSP_FIELDS);
  involvedCount = 0;
  rebuild("involved-container", addInvolvedRow, payload.involved, () => "inv_" + involvedCount, IR_INV_FIELDS);
  itemCount = 0;
  rebuild("items-container", addItemRow, payload.items, () => "item_" + itemCount, IR_ITEM_FIELDS);

  refreshPreview();
}

function irBuildLabel(payload) {
  const flds = payload.fields || {};
  const dr = (flds.dr_no || "").trim();
  const crime = (flds.report_of || "").trim();
  const victim = (flds.v_name || "").trim();
  const head = dr ? "DR " + dr : victim || "Investigative Report";
  return crime ? `${head} - ${crime}` : head;
}

GumaHistoryWiring.register({
  key: "investigative",
  noun: "report",
  serialize: irSerializeState,
  hydrate: irHydrateState,
  buildLabel: irBuildLabel,
  // no buildFaction - the report has no faction switcher
});

// ── WYSIWYG editing wiring ────────────────────────────────────────────────────
// The preview modal delegates export here so counters and history keep firing.
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
  // The preview modal shows one sheet at a time and passes the visible page's
  // index back into download/copy.
  pages: () => {
    drawForm();
    return irPageBounds.map((b, i) => ({ label: "Page " + (i + 1), canvas: irPageCanvas(i) }));
  },
};

window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  host: document.querySelector(".guma-panel-form"),
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "investigative",
});
