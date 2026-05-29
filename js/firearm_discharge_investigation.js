"use strict";
let REPORT_FACTION = "lspd";

function switchReportFaction(key) {
  const panel = document.getElementById("customFactionPanel");

  if (key === "custom") {
    panel.style.display = "block";
    applyCustomFaction();
    return;
  }

  panel.style.display = "none";
  REPORT_FACTION = key;

  document.querySelectorAll(".faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === key);
  });

  refreshPreview();
}

function applyCustomFaction() {
  const name = document.getElementById("customFactionName")?.value.trim() || "Custom Faction";

  window._customFactionData = {
    name: name,
    short: name,
    emailDomain: "faction.gov",
    cardBg: "#f0f0f0",
    cardBorder: "#888888",
    ranks: ["Officer"],
    divisions: ["General Division"],
    seniorRanks: [],
    midRanks: [],
    icon: null,
  };

  REPORT_FACTION = "custom";

  document.querySelectorAll(".faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === "custom");
  });

  refreshPreview();
}

function getActiveFaction() {
  if (REPORT_FACTION === "custom") {
    return (
      window._customFactionData || {
        name: "Custom Faction",
        emailDomain: "faction.gov",
        cardBg: "#f0f0f0",
        cardBorder: "#888888",
      }
    );
  }
  return FACTIONS[REPORT_FACTION];
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

function collectOfficerRows(type) {
  const cid = type === "involved" ? "involved-officers-container" : "witnessing-officers-container";
  return Array.from(document.getElementById(cid).querySelectorAll(".dynamic-row")).map((row) => {
    const p = type + "_" + row.dataset.idx;
    return {
      name: getVal(p + "_name"),
      serial: getVal(p + "_serial"),
      division: getVal(p + "_division"),
      sex: getVal(p + "_sex"),
      desc: getVal(p + "_desc"),
      ht: getVal(p + "_ht"),
      wt: getVal(p + "_wt"),
      age: getVal(p + "_age"),
      in_uniform: getVal(p + "_in_uniform"),
      vest: getVal(p + "_vest"),
      on_duty: getVal(p + "_on_duty"),
      injured: getVal(p + "_injured"),
      iod: getVal(p + "_iod"),
      light_duty: getVal(p + "_light_duty"),
    };
  });
}

function collectCivilianRows() {
  return Array.from(document.getElementById("civilians-container").querySelectorAll(".dynamic-row")).map((row) => {
    const p = "civ_" + row.dataset.idx;
    return {
      name: getVal(p + "_name"),
      sex: getVal(p + "_sex"),
      desc: getVal(p + "_desc"),
      ht: getVal(p + "_ht"),
      wt: getVal(p + "_wt"),
      age: getVal(p + "_age"),
      dob: getVal(p + "_dob"),
      dl: getVal(p + "_dl"),
      occupation: getVal(p + "_occupation"),
      addr_r: getVal(p + "_addr_r"),
      phone_r: getVal(p + "_phone_r"),
      email: getVal(p + "_email"),
      addr_b: getVal(p + "_addr_b"),
      phone_b: getVal(p + "_phone_b"),
      cell: getVal(p + "_cell"),
      lang: getVal(p + "_lang"),
      supervisor: getVal(p + "_supervisor"),
    };
  });
}

function fmtDatetime(raw) {
  if (!raw) return "-";
  const [d, t] = raw.split("T");
  return t ? `${d} ${t}` : d || "-";
}

// ── Canvas constants ──────────────────────────────────────────────────────────
const MARGIN = 30;
const DOC_W = 580;
const BODY_W = DOC_W - MARGIN * 2;

const OFF_COLS = [
  { label: "Last Name, First Name, Middle Initial", key: "name", w: 0.225, yn: false },
  { label: "Serial No.", key: "serial", w: 0.08, yn: false },
  { label: "Area/ Division/ Detail", key: "division", w: 0.09, yn: false },
  { label: "Sex", key: "sex", w: 0.04, yn: false },
  { label: "Desc.", key: "desc", w: 0.05, yn: false },
  { label: "Ht.", key: "ht", w: 0.05, yn: false },
  { label: "Wt.", key: "wt", w: 0.05, yn: false },
  { label: "Age", key: "age", w: 0.04, yn: false },
  { label: "In Uniform (Y/N)", key: "in_uniform", w: 0.08, yn: true },
  { label: "Vest (Y/N)", key: "vest", w: 0.065, yn: true },
  { label: "On Duty (Y/N)", key: "on_duty", w: 0.07, yn: true },
  { label: "Injured (Y/N)", key: "injured", w: 0.07, yn: true },
  { label: "IOD (Y/N)", key: "iod", w: 0.05, yn: true },
  { label: "Light Duty (Y/N)", key: "light_duty", w: 0.04, yn: true },
];

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawForm() {
  const faction = getActiveFaction();
  const involvedRows = collectOfficerRows("involved");
  const witnessingRows = collectOfficerRows("witnessing");
  const civilianRows = collectCivilianRows();

  const effInvolved = Math.max(3, involvedRows.length);
  const effWitnessing = Math.max(3, witnessingRows.length);
  const effCivilians = Math.max(2, civilianRows.length);

  const officerSectionH = (n) => 16 + 24 + n * 20 + 6;
  const civilianBlockH = 22 + 18 + 18 + 18 + 5;
  const A4_HEIGHT = Math.round(DOC_W * 1.4142);
  const contentH = 62 + 16 + 26 + 26 + 26 + officerSectionH(effInvolved) + officerSectionH(effWitnessing) + 16 + effCivilians * civilianBlockH + 30;

  const canvasH = Math.max(A4_HEIGHT, contentH);
  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, canvasH);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";

  let y = MARGIN;

  // ── Header — faction name from factions.js ────────────────────────────────
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 10px Arial";
  ctx.fillText(faction.name.toUpperCase(), DOC_W / 2, y);
  y += 14;
  ctx.font = "bold 13px Arial";
  ctx.fillText("OFFICER-INVOLVED FIREARM DISCHARGE INVESTIGATION", DOC_W / 2, y);
  y += 18;

  // ── Top checkboxes ────────────────────────────────────────────────────────
  ctx.font = "8.5px Arial";
  ctx.textAlign = "left";
  [
    { id: "cb_tactical", label: "TACTICAL UNINTENTIONAL DISCHARGE OF A FIREARM", col: 0 },
    { id: "cb_animal", label: "ANIMAL SHOOTING", col: 1 },
    { id: "cb_non_tactical", label: "NON-TACTICAL UNINTENTIONAL DISCHARGE OF A FIREARM", col: 0 },
    { id: "cb_warning", label: "WARNING SHOT", col: 1 },
  ].forEach((item, i) => {
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
  });
  y += 30;

  y = sectionHeader(ctx, "SECTION I. GENERAL INFORMATION", y);
  y = gridRow(
    ctx,
    [
      { label: "FID No.", value: getVal("fid_no"), w: 0.35 },
      { label: "DR No.", value: getVal("dr_no"), w: 0.65 },
    ],
    y,
    26,
  );

  y = gridRow(
    ctx,
    [
      { label: "Date of Incident", value: getVal("date_incident"), w: 0.22 },
      { label: "Day of Week", value: getVal("day_of_week"), w: 0.18 },
      { label: "Time", value: getVal("time_incident"), w: 0.13 },
      { label: "Location of Occurrence", value: getVal("location"), w: 0.35 },
      { label: "RD", value: getVal("rd"), w: 0.12 },
    ],
    y,
    26,
  );

  const dtRaw = document.getElementById("report_datetime")?.value || "";
  y = gridRow(
    ctx,
    [
      { label: "Date and Time of this Report", value: fmtDatetime(dtRaw), w: 0.32 },
      { label: "Officer's Area/Division of Assignment", value: getVal("officer_area"), w: 0.36 },
      { label: "Area/Division of Occurrence", value: getVal("area_occurrence"), w: 0.32 },
    ],
    y,
    26,
  );

  y = officerSection(ctx, "INVOLVED OFFICER(S)", involvedRows, y);
  y = officerSection(ctx, "WITNESSING OFFICER(S)", witnessingRows, y);
  y = civilianSection(ctx, civilianRows, y);

  ctx.fillStyle = "#000";
  ctx.font = "8px Arial";
  ctx.textAlign = "left";
  ctx.fillText("01.67.08 (09/19)", MARGIN, canvasH - 12);
  ctx.textAlign = "right";
  ctx.fillText("Page 1 of 1", DOC_W - MARGIN, canvasH - 12);
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
    ctx.fillStyle = "#000";
    ctx.font = "9px Arial";
    ctx.fillText(clip(ctx, c.value, cw - 4), x + 2, y + h - 5);
    x += cw;
  });
  return y + h;
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

function drawOffRow(ctx, data, y) {
  const H = 20;
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
      ctx.font = "8.5px Arial";
      ctx.textAlign = "left";
      ctx.fillText(clip(ctx, data[col.key] || "-", cw - 3), x + 2, y + 13);
    }
    x += cw;
  });
  return y + H;
}

function officerSection(ctx, title, rows, y) {
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
  const offRows = rows.length >= 3 ? rows : [...rows, ...Array(3 - rows.length).fill({})];
  offRows.forEach((r) => {
    y = drawOffRow(ctx, r, y);
  });
  return y + 6;
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
  const civRows = rows.length >= 2 ? rows : [...rows, ...Array(2 - rows.length).fill({})];
  civRows.forEach((r) => {
    y = drawCivBlock(ctx, r, y);
  });
  return y;
}

function drawCivBlock(ctx, d, y) {
  const g = (k) => d[k] || "-";
  y = gridRow(
    ctx,
    [
      { label: "Last Name, First Name, Middle Initial", value: g("name"), w: 0.22 },
      { label: "Sex", value: g("sex"), w: 0.05 },
      { label: "Desc.", value: g("desc"), w: 0.06 },
      { label: "Ht.", value: g("ht"), w: 0.06 },
      { label: "Wt.", value: g("wt"), w: 0.06 },
      { label: "Age", value: g("age"), w: 0.05 },
      { label: "DOB", value: g("dob"), w: 0.1 },
      { label: "Driver Lic. No. / Other ID No.", value: g("dl"), w: 0.2 },
      { label: "Occupation", value: g("occupation"), w: 0.2 },
    ],
    y,
    22,
  );

  y = gridRow(
    ctx,
    [
      { label: "Address R-", value: g("addr_r"), w: 0.4 },
      { label: "Phone R-", value: g("phone_r"), w: 0.2 },
      { label: "E-Mail Address", value: g("email"), w: 0.4 },
    ],
    y,
    18,
  );

  y = gridRow(
    ctx,
    [
      { label: "Address B-", value: g("addr_b"), w: 0.4 },
      { label: "Phone B-", value: g("phone_b"), w: 0.2 },
      { label: "Cell Phone", value: g("cell"), w: 0.4 },
    ],
    y,
    18,
  );

  y = gridRow(
    ctx,
    [
      { label: "Foreign Language Spoken", value: g("lang"), w: 0.25 },
      { label: "Name/Serial No. of Supervisor Interviewing and Date/Time/Location of Interview", value: g("supervisor"), w: 0.75 },
    ],
    y,
    18,
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

function downloadPng() {
  drawForm();
  const a = document.createElement("a");
  a.download = "firearm-discharge-investigation.png";
  a.href = document.getElementById("docCanvas").toDataURL("image/png");
  a.click();
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
  const urlFaction = new URLSearchParams(window.location.search).get("faction");
  if (urlFaction && FACTIONS[urlFaction]) {
    REPORT_FACTION = urlFaction;
  }

  buildFactionSwitcher(switchReportFaction, REPORT_FACTION, FACTION_TYPE.POLICE);

  document.querySelectorAll(".faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === REPORT_FACTION);
  });
})();

document.querySelectorAll("input,select").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});

addOfficerRow("involved");
