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

    <div class="three-col">
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
          <option value="W">W – White</option>
          <option value="B">B – Black</option>
          <option value="H">H – Hispanic</option>
          <option value="A">A – Asian</option>
          <option value="P">P – Pacific Islander</option>
          <option value="I">I – Indian/Alaska Native</option>
          <option value="O">O – Other</option>
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
          <option value="A">A – None in vehicle</option>
          <option value="B">B – Unknown</option>
          <option value="C">C – Lap belt used</option>
          <option value="D">D – Lap belt not used</option>
          <option value="E">E – Shoulder harness used</option>
          <option value="F">F – Shoulder harness not used</option>
          <option value="G">G – Lap/shoulder harness used</option>
          <option value="H">H – Lap/shoulder harness not used</option>
          <option value="M">M – Air bag deployed</option>
          <option value="N">N – Air bag not deployed</option>
          <option value="X">X – Not applicable</option>
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
  div.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", refreshPreview);
    el.addEventListener("change", refreshPreview);
  });
  refreshPreview();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return "-";
  // For select: return only the code part (before " – ")
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
      type: getVal(p + "_type"),
      dl: getVal(p + "_dl"),
      dl_state: getVal(p + "_dl_state"),
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
      phone_h: getVal(p + "_phone_h"),
      phone_b: getVal(p + "_phone_b"),
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

  // Value
  ctx.fillStyle = "#000";
  ctx.font = bold ? "bold 8px Arial" : "8px Arial";
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

  // Type checkboxes
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
    tx += ctx.measureText(t).width + 18;
  });

  y += hH;

  // Row 1: DL / state / class / safety / veh year / make+model / plate
  y = row(
    ctx,
    [
      { label: "Driver's License Number", value: d.dl, w: 0.23 },
      { label: "State", value: d.dl_state, w: 0.05 },
      { label: "Class", value: "-", w: 0.05 },
      { label: "Safety Equip.", value: d.safety, w: 0.07 },
      { label: "Veh. Year", value: d.veh_year, w: 0.07 },
      { label: "Make / Model / Color", value: d.veh_make, w: 0.33 },
      { label: "License Number", value: d.veh_plate, w: 0.2 },
    ],
    y,
    26,
  );

  // Row 2: Name / Owner name
  y = row(
    ctx,
    [
      { label: "Name (First, Middle, Last)", value: d.name, w: 0.55 },
      { label: "Owner's Name", value: d.owner_name, w: 0.45 },
    ],
    y,
    24,
  );

  // Row 3: Address / Owner address
  y = row(
    ctx,
    [
      { label: "Street Address", value: d.address, w: 0.55 },
      { label: "Owner's Address", value: d.owner_addr, w: 0.45 },
    ],
    y,
    22,
  );

  // Row 4: City / Insurance / Policy
  y = row(
    ctx,
    [
      { label: "City / State / ZIP", value: d.city, w: 0.55 },
      { label: "Insurance Carrier", value: d.insurance, w: 0.28 },
      { label: "Policy Number", value: d.policy, w: 0.17 },
    ],
    y,
    22,
  );

  // Row 5: Physical descriptors + phones + dir + speed + damage
  y = row(
    ctx,
    [
      { label: "Sex", value: d.sex, w: 0.05, opts: { center: true } },
      { label: "Race", value: d.race, w: 0.06, opts: { center: true } },
      { label: "Age", value: d.age, w: 0.05, opts: { center: true } },
      { label: "DOB (MO/DA/YR)", value: d.dob, w: 0.12 },
      { label: "Home Phone", value: d.phone_h, w: 0.18 },
      { label: "Business Phone", value: d.phone_b, w: 0.18 },
      { label: "Dir. of Travel", value: d.dir, w: 0.08, opts: { center: true } },
      { label: "Speed Limit", value: d.speed, w: 0.07, opts: { center: true } },
      { label: "Vehicle Damage", value: d.damage, w: 0.21 },
    ],
    y,
    26,
  );

  // Row 6: Prior defects / Street info
  y = row(
    ctx,
    [
      { label: "Prior Mechanical Defects", value: d.defects, w: 0.5 },
      { label: "On Street or Highway / Dir. of Travel / Speed Limit / PCF", value: "-", w: 0.5 },
    ],
    y,
    22,
  );

  return y + 3;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function drawForm() {
  const stateName = (document.getElementById("state_name")?.value.trim() || "San Andreas").toUpperCase();
  const parties = collectParties();
  const effCount = Math.max(3, parties.length);

  // Height estimation (logical px)
  const partyH = 30 + 26 + 24 + 22 + 22 + 26 + 22 + 3;
  const headerH = 60;
  const locationH = 20 + 17 + 6;
  const footerH = 18 + 20;
  const A4_H = Math.round(DOC_W * 1.4142);
  const contentH = MARGIN + headerH + locationH + effCount * partyH + footerH + MARGIN;
  const logicalH = Math.max(A4_H, contentH);

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = logicalH * SCALE;
  canvas.style.width = DOC_W + "px";
  canvas.style.height = logicalH + "px";

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
  ctx.fillText(`STATE OF ${stateName}`, MARGIN, y + 7);

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
    { label: "HIT & RUN (MISDEMEANOR)", checked: hitRunMisd },
    { label: "HIT & RUN (FELONY)", checked: hitRunFelony },
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
  });

  // Meta cells
  const metaX = MARGIN + cbBoxW;
  const metaW = BODY_W - cbBoxW;
  const mCols = [
    { label: "NUMBER INJURED", value: getVal("num_injured"), w: 0.2 },
    { label: "NUMBER KILLED", value: getVal("num_killed"), w: 0.2 },
    { label: "JUDICIAL DISTRICT", value: getVal("judicial_district"), w: 0.25 },
    { label: "LOCAL REPORT NO.", value: getVal("local_report_no"), w: 0.35 },
  ];
  const mWidths = mCols.map((c) => Math.round(metaW * c.w));
  mWidths[mWidths.length - 1] += metaW - mWidths.reduce((a, b) => a + b, 0);
  let mx = metaX;
  mCols.forEach((c, i) => {
    cell(ctx, mx, y, mWidths[i], metaH, c.label, c.value, { bg: CELL_BG });
    mx += mWidths[i];
  });
  y += metaH;

  // NCIC / Officer / Tow / HWY / District / Beat
  y = row(
    ctx,
    [
      { label: "NCIC #", value: getVal("ncic"), w: 0.13 },
      { label: "OFFICER I.D.", value: getVal("officer_id"), w: 0.13 },
      { label: "TOW AWAY", value: getVal("tow_away"), w: 0.1, opts: { center: true } },
      { label: "STATE HWY RELATED", value: getVal("state_hwy_rel"), w: 0.14, opts: { center: true } },
      { label: "REPORTING DISTRICT", value: "-", w: 0.25 },
      { label: "BEAT", value: "-", w: 0.25 },
    ],
    y,
    16,
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

  // ── Location Row 1 — fixed fractions summing to exactly 1.0 ──────────────
  const locR1H = 20;

  const r1spec = [
    { label: "Collision Occurred On", value: getVal("collision_street"), frac: 0.34 },
    { label: "MO / DAY / YEAR", value: fmtDate(rawDate), frac: 0.14 },
    { label: "TIME (24h)", value: rawTime || "-", frac: 0.09 },
    { label: "DAY OF WEEK", value: "__DOW__", frac: 0.2 },
    { label: "TOW AWAY", value: getVal("tow_away"), frac: 0.1, center: true },
    { label: "PHOTOGRAPHS BY", value: "-", frac: 0.13 },
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
        dx += 11;
      });
    } else {
      cell(ctx, lx, y, w, locR1H, s.label, s.value, { bg: CELL_BG, center: !!s.center });
    }
    lx += w;
  });

  y += locR1H;

  // ── Location Row 2 — intersection / distance ──────────────────────────────
  const locR2H = 17;
  const r2spec = [
    { label: "At Intersection With", value: getVal("intersection_with"), frac: 0.5 },
    { label: "OR: Distance / Direction from", value: getVal("distance_from"), frac: 0.5 },
  ];
  const r2widths = r2spec.map((s) => Math.floor(locW * s.frac));
  r2widths[r2widths.length - 1] += locW - r2widths.reduce((a, b) => a + b, 0);

  lx = locX;
  r2spec.forEach((s, i) => {
    cell(ctx, lx, y, r2widths[i], locR2H, s.label, s.value, { bg: CELL_BG });
    lx += r2widths[i];
  });
  y += locR2H;
  y += 6;

  // ── Parties ───────────────────────────────────────────────────────────────
  const emptyParty = {
    type: "DRIVER",
    dl: "-",
    dl_state: "-",
    safety: "-",
    veh_year: "-",
    veh_make: "-",
    veh_plate: "-",
    name: "-",
    owner_name: "-",
    owner_addr: "-",
    address: "-",
    city: "-",
    insurance: "-",
    policy: "-",
    sex: "-",
    race: "-",
    age: "-",
    dob: "-",
    phone_h: "-",
    phone_b: "-",
    dir: "-",
    speed: "-",
    damage: "NONE",
    defects: "NONE APPARENT",
  };

  const toRender = [...parties];
  while (toRender.length < 3) toRender.push(emptyParty);

  toRender.forEach((p, i) => {
    y = drawParty(ctx, p || emptyParty, i + 1, y);
  });

  // ── Footer row ────────────────────────────────────────────────────────────
  const dispMap = { YES: "YES", NO: "NO", NA: "N/A" };
  y = row(
    ctx,
    [
      { label: "Preparer's Name", value: getVal("preparer_name"), w: 0.3 },
      { label: "Dispatch Notified", value: dispMap[getVal("dispatch_notified")] || "-", w: 0.15, opts: { center: true } },
      { label: "Reviewer's Name", value: getVal("reviewer_name"), w: 0.35 },
      { label: "Date Reviewed", value: fmtDate(document.getElementById("date_reviewed")?.value || ""), w: 0.2 },
    ],
    y,
    18,
  );

  // ── PAGE 1 OF 1 — bottom right, plain text ───────────────────────────────
  y += 8;
  ctx.fillStyle = "#000";
  ctx.font = "7px Arial";
  ctx.textAlign = "right";
  ctx.fillText("PAGE 1 OF 1", DOC_W - MARGIN, y + 8);
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  drawForm();
}

function downloadPng() {
  drawForm();
  const a = document.createElement("a");
  a.download = "traffic-collision-report.png";
  a.href = document.getElementById("docCanvas").toDataURL("image/png");
  a.click();
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.querySelectorAll("input,select").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});

addPartyRow();
