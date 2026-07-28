"use strict";

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Party counter ─────────────────────────────────────────────────────────────
let partyCount = 0;

function addPartyRow() {
  const container = document.getElementById("parties-container");
  const idx = ++partyCount;
  const prefix = "party_" + idx;

  const div = document.createElement("div");
  div.className = "dynamic-row";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="row-title">Party ${idx}</div>
    <button class="btn-remove-row" onclick="this.parentElement.remove();refreshPreview()">&#10005;</button>

    <div class="four-col">
      <div class="form-group">
        <label>Party Type</label>
        <select id="${prefix}_type">
          <option value="DRIVER">Driver</option>
          <option value="PEDESTRIAN">Pedestrian</option>
          <option value="PARKED VEH.">Parked Vehicle</option>
          <option value="BICYCLIST">Bicyclist</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Driver's License No.</label>
        <input type="text" id="${prefix}_dl" placeholder="A1234567" />
      </div>
      <div class="form-group">
        <label>DL State</label>
        <input type="text" id="${prefix}_dl_state" placeholder="SA" maxlength="2" />
      </div>
      <div class="form-group">
        <label>DL Class</label>
        <input type="text" id="${prefix}_dl_class" placeholder="C" maxlength="3" />
      </div>
    </div>

    <div class="form-group">
      <label>Name (First, Middle, Last)</label>
      <input type="text" id="${prefix}_name" placeholder="John Michael Doe" />
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Street Address</label>
        <input type="text" id="${prefix}_address" placeholder="123 Main St" />
      </div>
      <div class="form-group">
        <label>City / State / ZIP</label>
        <input type="text" id="${prefix}_city" placeholder="Los Santos, SA 90001" />
      </div>
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
        <label>Race</label>
        <select id="${prefix}_race">
          <option value="-">-</option>
          <option value="W">W - White</option>
          <option value="B">B - Black</option>
          <option value="H">H - Hispanic</option>
          <option value="A">A - Asian</option>
          <option value="P">P - Pacific Islander</option>
          <option value="I">I - Indian/Alaska Native</option>
          <option value="O">O - Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Age</label>
        <input type="text" id="${prefix}_age" placeholder="30" />
      </div>
      <div class="form-group">
        <label>DOB</label>
        <input type="date" id="${prefix}_dob" />
      </div>
    </div>

    <div class="three-col">
      <div class="form-group">
        <label>Veh. Year</label>
        <input type="text" id="${prefix}_veh_year" placeholder="2022" />
      </div>
      <div class="form-group">
        <label>Make / Model / Color</label>
        <input type="text" id="${prefix}_veh_make" placeholder="Karin Sultan / Burgundy" />
      </div>
      <div class="form-group">
        <label>License Plate</label>
        <input type="text" id="${prefix}_veh_plate" placeholder="ABC1234" />
      </div>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Safety Equip.</label>
        <select id="${prefix}_safety">
          <option value="-">-</option>
          <option value="A">A - None in vehicle</option>
          <option value="B">B - Unknown</option>
          <option value="C">C - Lap belt used</option>
          <option value="D">D - Lap belt not used</option>
          <option value="E">E - Shoulder harness used</option>
          <option value="F">F - Shoulder harness not used</option>
          <option value="G">G - Lap/shoulder harness used</option>
          <option value="H">H - Lap/shoulder harness not used</option>
          <option value="M">M - Air bag deployed</option>
          <option value="N">N - Air bag not deployed</option>
          <option value="X">X - Not applicable</option>
        </select>
      </div>
      <div class="form-group">
        <label>Dir. of Travel</label>
        <select id="${prefix}_dir">
          <option value="-">-</option>
          <option value="N">North</option>
          <option value="S">South</option>
          <option value="E">East</option>
          <option value="W">West</option>
        </select>
      </div>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Owner's Name</label>
        <input type="text" id="${prefix}_owner_name" placeholder="Same as Driver" />
      </div>
      <div class="form-group">
        <label>Owner's Address</label>
        <input type="text" id="${prefix}_owner_addr" placeholder="Same as Driver" />
      </div>
    </div>

    <div class="three-col">
      <div class="form-group">
        <label>Insurance Carrier</label>
        <input type="text" id="${prefix}_insurance" placeholder="Weazel Insurance" />
      </div>
      <div class="form-group">
        <label>Policy Number</label>
        <input type="text" id="${prefix}_policy" placeholder="WZ-00000" />
      </div>
      <div class="form-group">
        <label>Speed Limit</label>
        <input type="text" id="${prefix}_speed" placeholder="35" />
      </div>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Vehicle Damage</label>
        <select id="${prefix}_damage">
          <option value="NONE">None</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="MAJOR">Major</option>
          <option value="TOTAL">Total (Loss)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Prior Mech. Defects</label>
        <select id="${prefix}_defects">
          <option value="NONE APPARENT">None Apparent</option>
          <option value="REFER TO NARRATIVE">Refer to Narrative</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>On Street / Hwy, Dir. of Travel, Speed Limit, PCF</label>
      <input type="text" id="${prefix}_street_info" placeholder="Vespucci Blvd, N/B, 35 MPH, VC 22350" />
    </div>

    <div class="two-col">
      <div class="form-group">
        <label>Home Phone</label>
        <input type="text" id="${prefix}_phone_h" placeholder="(555) 000-0000" />
      </div>
      <div class="form-group">
        <label>Business Phone</label>
        <input type="text" id="${prefix}_phone_b" placeholder="(555) 000-0001" />
      </div>
    </div>
  `;

  container.appendChild(div);

  // Auto-fill Age from DOB (registered before the generic refresh listeners
  // so the age is already set when the preview re-renders)
  const dobInput = div.querySelector(`#${prefix}_dob`);
  const ageInput = div.querySelector(`#${prefix}_age`);
  dobInput.addEventListener("input", () => {
    const age = calcAge(dobInput.value);
    if (age !== null) ageInput.value = String(age);
  });

  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  refreshPreview();
}

function removePartyRow(prefix) {
  const idx = prefix.replace("party_", "");
  document.querySelector(`#parties-container .dynamic-row[data-idx="${idx}"]`)?.remove();
  refreshPreview();
}

/** Write through to a source <select> the way the canvas editor would. */
function setSelectVal(id, value) {
  const el = document.getElementById(id);
  if (!el || el.value === value) return;
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return "-";
  // For select: return only the code part (before " - ")
  const v = el.value.trim();
  return v || "-";
}

// For race/safety selects: show only the letter code on canvas
function getCode(id) {
  const el = document.getElementById(id);
  if (!el) return "-";
  const v = el.value.trim();
  if (!v || v === "-") return "-";
  return v.split(" ")[0];
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

function fmtDate(raw) {
  if (!raw || raw === "-") return "-";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

function collectParties() {
  return Array.from(document.getElementById("parties-container").querySelectorAll(".dynamic-row")).map((row) => {
    const p = "party_" + row.dataset.idx;
    const raceEl = document.getElementById(p + "_race");
    const safetyEl = document.getElementById(p + "_safety");
    return {
      _p: p, // input id prefix, doubles as the hitbox ref base
      type: getVal(p + "_type"),
      dl: getVal(p + "_dl"),
      dl_state: getVal(p + "_dl_state"),
      dl_class: getVal(p + "_dl_class"),
      name: getVal(p + "_name"),
      address: getVal(p + "_address"),
      city: getVal(p + "_city"),
      sex: getVal(p + "_sex"),
      // Show only the letter code on canvas
      race: raceEl ? raceEl.value.split(" ")[0] || "-" : "-",
      safety: safetyEl ? safetyEl.value.split(" ")[0] || "-" : "-",
      age: getVal(p + "_age"),
      dob: fmtDate(document.getElementById(p + "_dob")?.value || ""),
      veh_year: getVal(p + "_veh_year"),
      veh_make: getVal(p + "_veh_make"),
      veh_plate: getVal(p + "_veh_plate"),
      dir: getVal(p + "_dir"),
      owner_name: getVal(p + "_owner_name"),
      owner_addr: getVal(p + "_owner_addr"),
      insurance: getVal(p + "_insurance"),
      policy: getVal(p + "_policy"),
      speed: getVal(p + "_speed"),
      damage: getVal(p + "_damage"),
      defects: getVal(p + "_defects"),
      street_info: getVal(p + "_street_info"),
      phone_h: getVal(p + "_phone_h"),
      phone_b: getVal(p + "_phone_b"),
    };
  });
}

// ── Cell specs bound to an input: value and hitbox ref declared once ────────
// f/fd read a page-level input by id; pf reads an already-collected party
// object and derives the id from the row prefix carried on it.
const f = (label, id, w, opts) => ({ label, value: getVal(id), w, opts: { ref: id, ...opts } });
const fd = (label, id, w, opts) => ({
  label,
  value: fmtDate(tcRawVal(id)),
  w,
  opts: { ref: id, kind: "date", ...opts },
});
const pf = (label, d, key, w, opts) => ({
  label,
  value: d[key],
  w,
  opts: { ref: d._p ? d._p + "_" + key : undefined, ...opts },
});

// ── Canvas layout constants (logical pixels - rendered ×SCALE) ───────────────
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
  const { bold = false, center = false, bg = CELL_BG } = opts;

  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(x, y, w, h);

  // Label
  ctx.fillStyle = "#333";
  ctx.font = "5.8px Arial";
  ctx.textAlign = "left";
  wrapLabel(ctx, label, x + 2, y + 7, w - 4, 6.5);

  // Value. The baseline normally sits 4px off the bottom border, but in a
  // short cell that rides up into the label: 8px Arial has a ~5.8px cap
  // height, so anything above y+13 puts the glyph tops through the label
  // baseline at y+7. Clamp instead of letting the two overlap.
  const valBase = label ? Math.max(y + h - 4, y + 13) : y + h - 4;
  ctx.fillStyle = "#000";
  ctx.font = bold ? "bold 8px Arial" : "8px Arial";
  if (center) {
    ctx.textAlign = "center";
    ctx.fillText(clip(ctx, value, w - 4), x + w / 2, valBase);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, value, w - 4), x + 2, valBase);
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

// ── Party block ───────────────────────────────────────────────────────────────
function drawParty(ctx, d, num, y) {
  const PARTY_TAG_W = 32;

  // Header row
  const hH = 30;
  ctx.fillStyle = HEAD_BG;
  ctx.fillRect(MARGIN, y, BODY_W, hH);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, BODY_W, hH);

  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  ctx.fillText("PARTY", MARGIN + 3, y + 9);
  ctx.font = "bold 14px Arial";
  ctx.fillText(String(num), MARGIN + 3, y + 23);

  ctx.beginPath();
  ctx.moveTo(MARGIN + PARTY_TAG_W, y);
  ctx.lineTo(MARGIN + PARTY_TAG_W, y + hH);
  ctx.stroke();

  if (d._p) {
    const p = d._p;
    window.GumaCanvasEdit?.action("rm_" + p, DOC_W - MARGIN + 3, y + 8, 18, 14, () => removePartyRow(p), {
      label: "✕",
      kind: "remove",
      title: "Remove this party",
    });
  }

  // Type checkboxes. They are painted from d.type but backed by a <select>,
  // so each one registers as a pick-one action, not an editable value.
  const types = ["DRIVER", "PEDESTRIAN", "PARKED VEH.", "BICYCLIST", "OTHER"];
  let tx = MARGIN + PARTY_TAG_W + 4;
  const ty = y + 16;
  types.forEach((t) => {
    const checked = d.type === t;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(tx, ty - 7, 7, 7);
    if (checked) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 7px Arial";
      ctx.textAlign = "left";
      ctx.fillText("X", tx + 0.5, ty - 0.5);
    }
    ctx.fillStyle = "#000";
    ctx.font = "6.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(t, tx + 9, ty);
    const tw = ctx.measureText(t).width;
    if (d._p) {
      const p = d._p;
      window.GumaCanvasEdit?.action(p + "_type_" + t, tx - 2, ty - 9, tw + 13, 12, () => setSelectVal(p + "_type", t), {
        kind: "pick",
        title: "Party type: " + t,
      });
    }
    tx += tw + 18;
  });

  y += hH;

  // Row 1: DL / state / class / safety / veh year / make+model / plate
  y = row(
    ctx,
    [
      pf("Driver's License Number", d, "dl", 0.23),
      pf("State", d, "dl_state", 0.05),
      pf("Class", d, "dl_class", 0.05),
      pf("Safety Equip.", d, "safety", 0.07, { kind: "select" }),
      pf("Veh. Year", d, "veh_year", 0.07),
      pf("Make / Model / Color", d, "veh_make", 0.33),
      pf("License Number", d, "veh_plate", 0.2),
    ],
    y,
    26,
  );

  // Row 2: Name / Owner name
  y = row(
    ctx,
    [pf("Name (First, Middle, Last)", d, "name", 0.55), pf("Owner's Name", d, "owner_name", 0.45)],
    y,
    24,
  );

  // Row 3: Address / Owner address
  y = row(ctx, [pf("Street Address", d, "address", 0.55), pf("Owner's Address", d, "owner_addr", 0.45)], y, 22);

  // Row 4: City / Insurance / Policy
  y = row(
    ctx,
    [
      pf("City / State / ZIP", d, "city", 0.55),
      pf("Insurance Carrier", d, "insurance", 0.28),
      pf("Policy Number", d, "policy", 0.17),
    ],
    y,
    22,
  );

  // Row 5: Physical descriptors + phones + dir + speed + damage
  y = row(
    ctx,
    [
      pf("Sex", d, "sex", 0.05, { center: true, kind: "select" }),
      pf("Race", d, "race", 0.06, { center: true, kind: "select" }),
      pf("Age", d, "age", 0.05, { center: true }),
      pf("DOB (MO/DA/YR)", d, "dob", 0.12, { kind: "date" }),
      pf("Home Phone", d, "phone_h", 0.18),
      pf("Business Phone", d, "phone_b", 0.18),
      pf("Dir. of Travel", d, "dir", 0.08, { center: true, kind: "select" }),
      pf("Speed Limit", d, "speed", 0.07, { center: true }),
      pf("Vehicle Damage", d, "damage", 0.21, { kind: "select" }),
    ],
    y,
    26,
  );

  // Row 6: Prior defects / Street info
  y = row(
    ctx,
    [
      pf("Prior Mechanical Defects", d, "defects", 0.5, { kind: "select" }),
      pf("On Street or Highway / Dir. of Travel / Speed Limit / PCF", d, "street_info", 0.5),
    ],
    y,
    22,
  );

  return y + 3;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
// Clear strip below the last party that the "+ Add Party" chip is drawn into.
const ADD_CHIP_H = 18;

function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });
  const stateName = (document.getElementById("state_name")?.value.trim() || "San Andreas").toUpperCase();
  const parties = collectParties();

  // Height estimation (logical px). headerH covers everything from the top
  // margin down to the LOCATION block; it was 17px short of what the header
  // actually paints, which only mattered from the 4th party on, once the A4
  // floor stopped winning.
  const partyH = 30 + 26 + 24 + 22 + 22 + 26 + 22 + 3;
  const headerH = 77;
  const locationH = 20 + 20 + 6;
  const footerH = 18 + 20;
  const A4_H = Math.round(DOC_W * 1.4142);
  const contentH = MARGIN + headerH + locationH + parties.length * partyH + ADD_CHIP_H + footerH + MARGIN;
  const logicalH = Math.max(A4_H, contentH);

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = logicalH * SCALE;

  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, logicalH);

  let y = MARGIN;

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "left";
  const stateLine = `STATE OF ${stateName}`;
  ctx.fillText(stateLine, MARGIN, y + 7);
  // Header text, not a table cell, so it registers its own hitbox. The
  // document falls back to "San Andreas" when the input is blank.
  window.GumaCanvasEdit?.field("state_name", MARGIN - 2, y - 1, Math.max(96, ctx.measureText(stateLine).width + 6), 11, {
    label: "State Name",
    fontPx: 7,
  });

  ctx.font = "bold 14px Arial";
  ctx.fillText("TRAFFIC COLLISION REPORT", MARGIN, y + 20);

  // Separator
  y += 24;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(DOC_W - MARGIN, y);
  ctx.stroke();
  ctx.lineWidth = LINE_W;
  y += 5;

  // ── Special conditions + meta row ────────────────────────────────────────
  const hitRunMisd = document.getElementById("cb_hit_run_misdemeanor")?.checked;
  const hitRunFelony = document.getElementById("cb_hit_run_felony")?.checked;

  const cbBoxW = BODY_W * 0.3;
  const cbRowH = 12;
  const metaH = cbRowH * 2;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, cbBoxW, metaH);

  [
    { id: "cb_hit_run_misdemeanor", label: "HIT & RUN (MISDEMEANOR)", checked: hitRunMisd },
    { id: "cb_hit_run_felony", label: "HIT & RUN (FELONY)", checked: hitRunFelony },
  ].forEach((item, i) => {
    const cy = y + i * cbRowH + 9;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(MARGIN + 3, cy - 7, 7, 7);
    if (item.checked) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 7px Arial";
      ctx.textAlign = "left";
      ctx.fillText("X", MARGIN + 4, cy - 0.5);
    }
    ctx.fillStyle = "#000";
    ctx.font = "7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(item.label, MARGIN + 13, cy);
    // Whole box-plus-label strip toggles on click.
    window.GumaCanvasEdit?.field(item.id, MARGIN + 1, cy - 9, cbBoxW - 2, cbRowH, { kind: "check", label: item.label });
  });

  // Meta cells
  const metaX = MARGIN + cbBoxW;
  const metaW = BODY_W - cbBoxW;
  const mCols = [
    f("NUMBER INJURED", "num_injured", 0.2),
    f("NUMBER KILLED", "num_killed", 0.2),
    f("JUDICIAL DISTRICT", "judicial_district", 0.25),
    f("LOCAL REPORT NO.", "local_report_no", 0.35),
  ];
  const mWidths = mCols.map((c) => Math.round(metaW * c.w));
  mWidths[mWidths.length - 1] += metaW - mWidths.reduce((a, b) => a + b, 0);
  let mx = metaX;
  mCols.forEach((c, i) => {
    cell(ctx, mx, y, mWidths[i], metaH, c.label, c.value, { bg: CELL_BG, ...c.opts });
    mx += mWidths[i];
  });
  y += metaH;

  // NCIC / Officer / Tow / HWY / District / Beat
  y = row(
    ctx,
    [
      f("NCIC #", "ncic", 0.13),
      f("OFFICER I.D.", "officer_id", 0.13),
      f("TOW AWAY", "tow_away", 0.1, { center: true, kind: "select" }),
      f("STATE HWY RELATED", "state_hwy_rel", 0.14, { center: true, kind: "select" }),
      f("REPORTING DISTRICT", "reporting_district", 0.25),
      f("BEAT", "beat", 0.25),
    ],
    y,
    20,
  );

  y += 4;

  // ── LOCATION section ──────────────────────────────────────────────────────
  const locSectH = 20 + 17;
  const locLabelW = 14;

  ctx.fillStyle = SECT_BG;
  ctx.fillRect(MARGIN, y, locLabelW, locSectH);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(MARGIN, y, locLabelW, locSectH);

  ctx.save();
  ctx.translate(MARGIN + locLabelW / 2, y + locSectH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#000";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LOCATION", 0, 3);
  ctx.restore();

  const locX = MARGIN + locLabelW;
  const locW = BODY_W - locLabelW;
  const rawDate = document.getElementById("collision_date")?.value || "";
  const rawTime = document.getElementById("collision_time")?.value || "";
  const dowEl = document.getElementById("day_of_week");
  const selectedDay = dowEl ? dowEl.value : "-";
  let lx;

  // ── Location Row 1 - fixed fractions summing to exactly 1.0 ──────────────
  const locR1H = 20;

  const r1spec = [
    { label: "Collision Occurred On", value: getVal("collision_street"), frac: 0.34, opts: { ref: "collision_street" } },
    { label: "MO / DAY / YEAR", value: fmtDate(rawDate), frac: 0.14, opts: { ref: "collision_date", kind: "date" } },
    { label: "TIME (24h)", value: rawTime || "-", frac: 0.09, opts: { ref: "collision_time", kind: "time" } },
    { label: "DAY OF WEEK", value: "__DOW__", frac: 0.2 },
    // Second printing of tow_away; the registry keeps each occurrence
    // anchored to its own box.
    { label: "TOW AWAY", value: getVal("tow_away"), frac: 0.1, center: true, opts: { ref: "tow_away", kind: "select" } },
    { label: "PHOTOGRAPHS BY", value: getVal("photographs_by"), frac: 0.13, opts: { ref: "photographs_by" } },
  ];

  // Convert fractions → pixel widths, dump rounding remainder into last column
  const r1widths = r1spec.map((s) => Math.floor(locW * s.frac));
  r1widths[r1widths.length - 1] += locW - r1widths.reduce((a, b) => a + b, 0);

  lx = locX;
  r1spec.forEach((s, i) => {
    const w = r1widths[i];
    if (s.value === "__DOW__") {
      cell(ctx, lx, y, w, locR1H, "DAY OF WEEK", "", { bg: CELL_BG });
      const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
      const dayKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      let dx = lx + 3;
      dayLabels.forEach((dl, di) => {
        const isActive = dayKeys[di] === selectedDay;
        if (isActive) {
          ctx.fillStyle = "#000";
          ctx.fillRect(dx - 1, y + 8, 9, 9);
          ctx.fillStyle = "#fff";
        } else {
          ctx.fillStyle = "#000";
        }
        ctx.font = "bold 7px Arial";
        ctx.textAlign = "center";
        ctx.fillText(dl, dx + 3.5, y + locR1H - 4);
        // One-of-seven, backed by the day_of_week <select>.
        const key = dayKeys[di];
        window.GumaCanvasEdit?.action("dow_" + key, dx - 2, y + 7, 11, 11, () => setSelectVal("day_of_week", key), {
          kind: "pick",
          title: "Day of week: " + key,
        });
        dx += 11;
      });
    } else {
      cell(ctx, lx, y, w, locR1H, s.label, s.value, { bg: CELL_BG, center: !!s.center, ...s.opts });
    }
    lx += w;
  });

  y += locR1H;

  // ── Location Row 2 - intersection / distance ──────────────────────────────
  const locR2H = 20;
  const r2spec = [
    { label: "At Intersection With", value: getVal("intersection_with"), frac: 0.5, opts: { ref: "intersection_with" } },
    { label: "OR: Distance / Direction from", value: getVal("distance_from"), frac: 0.5, opts: { ref: "distance_from" } },
  ];
  const r2widths = r2spec.map((s) => Math.floor(locW * s.frac));
  r2widths[r2widths.length - 1] += locW - r2widths.reduce((a, b) => a + b, 0);

  lx = locX;
  r2spec.forEach((s, i) => {
    cell(ctx, lx, y, r2widths[i], locR2H, s.label, s.value, { bg: CELL_BG, ...s.opts });
    lx += r2widths[i];
  });
  y += locR2H;
  y += 6;

  // ── Parties ───────────────────────────────────────────────────────────────
  // Exactly the collected parties: a removed one disappears and the document
  // shrinks, rather than lingering as an empty padding block.
  parties.forEach((p, i) => {
    y = drawParty(ctx, p, i + 1, y);
  });

  window.GumaCanvasEdit?.action("add_party", MARGIN, y + 2, 100, 14, () => addPartyRow(), {
    label: "+ Add Party",
    kind: "add",
    title: "Add another involved party",
  });
  y += ADD_CHIP_H;

  // ── Footer row ────────────────────────────────────────────────────────────
  const dispMap = { YES: "YES", NO: "NO", NA: "N/A" };
  y = row(
    ctx,
    [
      f("Preparer's Name", "preparer_name", 0.3),
      {
        label: "Dispatch Notified",
        value: dispMap[getVal("dispatch_notified")] || "-",
        w: 0.15,
        opts: { center: true, ref: "dispatch_notified", kind: "select" },
      },
      f("Reviewer's Name", "reviewer_name", 0.35),
      fd("Date Reviewed", "date_reviewed", 0.2),
    ],
    y,
    18,
  );

  // ── PAGE 1 OF 1 - bottom right, plain text ───────────────────────────────
  y += 8;
  ctx.fillStyle = "#000";
  ctx.font = "7px Arial";
  ctx.textAlign = "right";
  ctx.fillText("PAGE 1 OF 1", DOC_W - MARGIN, y + 8);

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
  a.download = "traffic-collision-report.png";
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
      const newCount = await window.GumaCounters?.trackDownload("traffic");
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

addPartyRow();

// ── Saved reports: serialize / hydrate / wiring ───────────────

const TC_SCALAR_FIELDS = [
  "state_name",
  "num_injured",
  "num_killed",
  "judicial_district",
  "local_report_no",
  "ncic",
  "officer_id",
  "reporting_district",
  "beat",
  "tow_away",
  "state_hwy_rel",
  "collision_street",
  "collision_date",
  "collision_time",
  "day_of_week",
  "intersection_with",
  "distance_from",
  "photographs_by",
  "preparer_name",
  "dispatch_notified",
  "reviewer_name",
  "date_reviewed",
];
const TC_PARTY_FIELDS = [
  "type",
  "dl",
  "dl_state",
  "dl_class",
  "name",
  "address",
  "city",
  "sex",
  "race",
  "age",
  "dob",
  "veh_year",
  "veh_make",
  "veh_plate",
  "safety",
  "dir",
  "owner_name",
  "owner_addr",
  "insurance",
  "policy",
  "speed",
  "damage",
  "defects",
  "street_info",
  "phone_h",
  "phone_b",
];

function tcRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}
function tcChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function tcCollectPartiesRaw() {
  const c = document.getElementById("parties-container");
  if (!c) return [];
  return Array.from(c.querySelectorAll(".dynamic-row")).map((row) => {
    const p = "party_" + row.dataset.idx;
    const o = {};
    TC_PARTY_FIELDS.forEach((k) => (o[k] = tcRawVal(p + "_" + k)));
    return o;
  });
}

function tcSerializeState() {
  const fields = {};
  TC_SCALAR_FIELDS.forEach((id) => (fields[id] = tcRawVal(id)));
  return {
    fields,
    checks: {
      cb_hit_run_misdemeanor: tcChecked("cb_hit_run_misdemeanor"),
      cb_hit_run_felony: tcChecked("cb_hit_run_felony"),
    },
    parties: tcCollectPartiesRaw(),
  };
}

function tcHydrateState(payload) {
  if (!payload) return;
  // The container is rebuilt below; an open editor would write into a
  // detached node.
  window.GumaCanvasEdit?.cancelEdit();
  const setVal = GumaHistoryWiring.setVal;

  const f = payload.fields || {};
  TC_SCALAR_FIELDS.forEach((id) => setVal(id, f[id]));

  const ch = payload.checks || {};
  GumaHistoryWiring.setChecked("cb_hit_run_misdemeanor", ch.cb_hit_run_misdemeanor);
  GumaHistoryWiring.setChecked("cb_hit_run_felony", ch.cb_hit_run_felony);

  const c = document.getElementById("parties-container");
  if (c) c.innerHTML = "";
  partyCount = 0;
  (payload.parties || []).forEach((p) => {
    addPartyRow();
    const prefix = "party_" + partyCount;
    TC_PARTY_FIELDS.forEach((k) => setVal(prefix + "_" + k, p[k]));
  });

  refreshPreview();
}

function tcBuildLabel(payload) {
  const f = payload.fields || {};
  const rep = (f.local_report_no || "").trim();
  const date = (f.collision_date || "").trim();
  const party = ((payload.parties && payload.parties[0] && payload.parties[0].name) || "").trim();
  const head = rep ? "Report " + rep : party || "Traffic Collision";
  return date ? `${head} - ${date}` : head;
}

GumaHistoryWiring.register({
  key: "traffic",
  noun: "report",
  serialize: tcSerializeState,
  hydrate: tcHydrateState,
  buildLabel: tcBuildLabel,
  // no buildFaction - traffic report has no faction
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
  key: "traffic",
});
