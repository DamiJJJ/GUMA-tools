"use strict";

let FACTION_KEY;
let faction;

// ── Switch faction ────────────────────────────────────────────────────────────
function switchFaction(key) {
  const panel = document.getElementById("customFactionPanel");
  if (key === "custom") {
    panel.style.display = "block";
    applyCustomFaction();
    return;
  }
  panel.style.display = "none";
  FACTION_KEY = key;
  faction = FACTIONS[key];
  document.querySelectorAll(".faction-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.faction === key));
  generateDoc();
}

function applyCustomFaction() {
  const name = document.getElementById("customAgencyName")?.value.trim() || "Custom Agency";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") || "CA";
  faction = {
    name,
    short: initials,
    cardBg: "#f0f0f0",
    cardBorder: "#6b7280",
    emailDomain: "agency.gov",
    ranks: ["Officer"],
    divisions: ["General"],
    seniorRanks: [],
    midRanks: [],
    icon: null,
  };
  generateDoc();
}

// ── Dynamic rows ──────────────────────────────────────────────────────────────
function addPfRow(containerId, labelPrefix, fields) {
  const container = document.getElementById(containerId);
  const idx = container.querySelectorAll(":scope > .pf-row").length + 1;
  const gridClass = fields.length === 4 ? "grid-cols-2" : "grid-cols-" + fields.length;
  const row = document.createElement("div");
  row.className = "pf-row rounded-xl border border-guma-l-border-2 bg-guma-l-dark dark:border-guma-border-2 dark:bg-guma-dark p-3";
  const fieldsHTML = fields
    .map(
      (f) => `
    <div class="flex flex-col">
      <label class="guma-label">${f.label}</label>
      ${
        f.type === "select"
          ? `<select class="guma-select mt-auto ${f.cls}" onchange="generateDoc()">${f.options.map((o) => `<option value="${o}">${o}</option>`).join("")}</select>`
          : `<input type="${f.type || "text"}" class="guma-input mt-auto ${f.cls}" placeholder="${f.placeholder || "N/A"}" oninput="generateDoc()" />`
      }
    </div>`,
    )
    .join("");
  row.innerHTML = `
    <div class="mb-2 flex items-center justify-between">
      <span class="text-[11px] font-bold uppercase tracking-wider text-guma-l-gold dark:text-guma-gold">${labelPrefix} #${idx}</span>
      <button type="button" onclick="removePfRow(this)" class="text-xs text-red-400 transition hover:text-red-300">✕ Remove</button>
    </div>
    <div class="grid ${gridClass} gap-2">${fieldsHTML}</div>`;
  container.appendChild(row);
  pfApplyCaps(row);
  generateDoc();
}

function removePfRow(btn) {
  const row = btn.closest(".pf-row");
  const container = row.parentElement;
  const labelPrefix = row.querySelector("span")?.textContent.replace(/ #\d+$/, "") || "";
  row.remove();
  container.querySelectorAll(":scope > .pf-row").forEach((r, i) => {
    const s = r.querySelector("span");
    if (s) s.textContent = `${labelPrefix} #${i + 1}`;
  });
  generateDoc();
}

function addEmergencyContact() {
  addPfRow("pfEcRows", "Contact", [
    { label: "Name", cls: "pf-ec-name", placeholder: "Jane Doe" },
    { label: "Relationship", cls: "pf-ec-rel", placeholder: "Spouse" },
    { label: "Phone", cls: "pf-ec-phone", placeholder: "(555) 000-0000" },
  ]);
}
function addTrainingRow() {
  addPfRow("pfTrRows", "Training", [
    { label: "Date", cls: "pf-tr-date", type: "date" },
    { label: "Course / Certification", cls: "pf-tr-course", placeholder: "Crisis Intervention Training" },
    { label: "Institution / Hours", cls: "pf-tr-inst", placeholder: "LAPD Training Div / 40h" },
  ]);
}
function addCommendationRow() {
  addPfRow("pfCmRows", "Entry", [
    { label: "Date", cls: "pf-cm-date", type: "date" },
    { label: "Award / Commendation", cls: "pf-cm-award", placeholder: "Medal of Valor" },
    { label: "Issued By", cls: "pf-cm-issued", placeholder: "Chief of Police" },
  ]);
}
function addDisciplinaryRow() {
  addPfRow("pfDiRows", "Record", [
    { label: "Date", cls: "pf-di-date", type: "date" },
    { label: "Violation / Complaint", cls: "pf-di-violation", placeholder: "Use of Force" },
    { label: "Penalty", cls: "pf-di-penalty", placeholder: "Written Reprimand" },
    { label: "Status", cls: "pf-di-status", type: "select", options: ["Sustained", "Not Sustained", "Unfounded", "Exonerated", "Pending"] },
  ]);
}
function addMedLeaveRow() {
  addPfRow("pfMlRows", "Leave", [
    { label: "From", cls: "pf-ml-from", type: "date" },
    { label: "To", cls: "pf-ml-to", type: "date" },
    { label: "Reason / Diagnosis", cls: "pf-ml-reason", placeholder: "Line-of-duty injury" },
  ]);
}
function addWorkersCompRow() {
  addPfRow("pfWcRows", "Claim", [
    { label: "Claim #", cls: "pf-wc-claim", placeholder: "WC-00000" },
    { label: "Date", cls: "pf-wc-date", type: "date" },
    { label: "Incident Description", cls: "pf-wc-incident", placeholder: "Back injury during patrol" },
    { label: "Status", cls: "pf-wc-status", type: "select", options: ["Open", "Closed", "Pending", "Denied", "Settled"] },
  ]);
}

// ── Data collection ───────────────────────────────────────────────────────────
function getDocData() {
  const collectRows = (containerId, fields) =>
    [...document.querySelectorAll(`#${containerId} > .pf-row`)].map((row) => {
      const obj = {};
      fields.forEach(([key, cls]) => {
        const el = row.querySelector("." + cls);
        obj[key] = el ? el.value.trim() : "";
      });
      return obj;
    });

  // TODO: loadOfficerFromHistory(officerId)
  // When localStorage history is implemented, this function will read the selected
  // officer record and pre-fill `subjectName` from the saved officer card data.

  return {
    subjectName: document.getElementById("subjectName")?.value.trim() || "",
    confidential: document.getElementById("confidentialStamp")?.checked || false,
    address: document.getElementById("pfAddress")?.value.trim() || "",
    emergencyContacts: collectRows("pfEcRows", [
      ["name", "pf-ec-name"],
      ["relationship", "pf-ec-rel"],
      ["phone", "pf-ec-phone"],
    ]),
    training: collectRows("pfTrRows", [
      ["date", "pf-tr-date"],
      ["course", "pf-tr-course"],
      ["institution", "pf-tr-inst"],
    ]),
    commendations: collectRows("pfCmRows", [
      ["date", "pf-cm-date"],
      ["award", "pf-cm-award"],
      ["issuedBy", "pf-cm-issued"],
    ]),
    disciplinary: collectRows("pfDiRows", [
      ["date", "pf-di-date"],
      ["violation", "pf-di-violation"],
      ["penalty", "pf-di-penalty"],
      ["status", "pf-di-status"],
    ]),
    attendance: {
      scheduled: document.getElementById("pfAttScheduled")?.value.trim() || "",
      present: document.getElementById("pfAttPresent")?.value.trim() || "",
      sick: document.getElementById("pfAttSick")?.value.trim() || "",
      late: document.getElementById("pfAttLate")?.value.trim() || "",
    },
    medLeave: collectRows("pfMlRows", [
      ["from", "pf-ml-from"],
      ["to", "pf-ml-to"],
      ["reason", "pf-ml-reason"],
    ]),
    workersComp: collectRows("pfWcRows", [
      ["claim", "pf-wc-claim"],
      ["date", "pf-wc-date"],
      ["incident", "pf-wc-incident"],
      ["status", "pf-wc-status"],
    ]),
    background: {
      status: document.getElementById("pfBgStatus")?.value || "N/A",
      clearance: document.getElementById("pfBgClearance")?.value || "N/A",
      date: document.getElementById("pfBgDate")?.value.trim() || "",
    },
    notes: document.getElementById("pfNotes")?.value.trim() || "",
  };
}

// ── Height calculation ────────────────────────────────────────────────────────
function calcDocHeight(data) {
  const HEADER_TOTAL = 144; // 6 accent + 80 header + 3 divider + 38 subject + 1 line + 16 gap
  const SEC_H = 28,
    TBL_H = 26,
    ROW_H = 28,
    SGL_H = 42,
    BOTTOM = 40;

  let h = HEADER_TOTAL;
  h += SEC_H + SGL_H; // Personal Info
  [data.emergencyContacts, data.training, data.commendations, data.disciplinary, data.medLeave, data.workersComp].forEach((arr) => {
    h += SEC_H + TBL_H + Math.max(1, arr.length) * ROW_H + 10;
  });
  h += SEC_H + SGL_H; // Attendance
  h += SEC_H + SGL_H; // Background
  if (data.notes && data.notes.trim()) {
    const lines = data.notes.split("\n").reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / 90)), 0);
    h += SEC_H + lines * 20 + 26;
  } else {
    h += SEC_H + SGL_H;
  }
  return h + BOTTOM;
}

// ── Canvas drawing helpers ────────────────────────────────────────────────────
const DOC_PAPER = "#fbf6ea";
const DOC_PAPER_ALT = "#f6eed4";
const DOC_PAPER_LITE = "#fdfaf0";
const DOC_INK = "#1c1c1c";
const DOC_INK_SOFT = "#3f3a30";
const DOC_MUTED = "#7a7568";
const DOC_RULE_FAINT = "#cdc29a";
const DOC_SEC_BG = "#efe6c9";

// ── No printed value ends in an ellipsis, and none runs past its box ─────────
// drawTable used to chop a value and add "…"; drawInfoRow and drawAttendanceRow
// had no width guard at all and let a long value run off the paper, which is
// worse - nothing on the page says anything was lost. All three now shrink to
// fit, and every text input is capped at what its box carries at the floor.
//
// Courier is monospace, so a box's capacity is exactly floor(maxW / charW) and
// charW is 0.6 x the size. The numbers below are that arithmetic at the floor,
// not guesses. Column widths come from the drawTable call sites, against
// tableW = 840 - 48 = 792, with 14px of padding per cell.
const PF_FONT_FAMILY = "'Courier New', monospace";
const PF_TABLE_PX = 12.5;
// The caps below are sized so a full-length value still prints at PF_CAP_PX.
// The shrink floor sits under that on purpose: it is the net for values that
// arrive past the cap (a hydrated legacy record, a paste), never a normal size.
const PF_TABLE_MIN_PX = 9;
const PF_CAP_PX = 10;
const PF_INFO_PX = 12.5;
const PF_ATT_PX = 13;
const PF_SUBJECT_PX = 15; // the SUBJECT: line, sized to the rule it sits on
const pfFont = (px) => px + "px " + PF_FONT_FAMILY;

const PF_MAXLEN = {
  // floor(available / 6.001), where 6.001px is one Courier character at
  // PF_CAP_PX. Round DOWN - 31 chars in 186px is 186.03px, which is over by
  // three hundredths of a pixel and costs the whole column half a point.
  ".pf-ec-name": 37, // 226px available
  ".pf-ec-rel": 30, // 186px
  ".pf-ec-phone": 56, // 338px
  ".pf-tr-course": 59, // 356px
  ".pf-tr-inst": 49, // 298px
  ".pf-cm-award": 57, // 346px
  ".pf-cm-issued": 51, // 308px
  ".pf-di-violation": 37, // 226px
  ".pf-di-penalty": 30, // 186px
  ".pf-ml-reason": 92, // 558px
  ".pf-wc-claim": 19, // 116px
  ".pf-wc-incident": 54, // 326px
  // Header lines. These two are not monospace arithmetic - the agency name is
  // Georgia and the subject line's budget depends on the width of the "SUBJECT:"
  // label - so both were measured against the same all-caps sample.
  "#customAgencyName": 52, // centred across 792px at bold 22px Georgia
  "#subjectName": 80, // 721px of rule at PF_SUBJECT_PX
  // Page-level fields. The attendance cells are counts, so their caps are about
  // keeping a fat-fingered paste out of the neighbouring column.
  "#pfAddress": 60,
  "#pfAttScheduled": 10,
  "#pfAttPresent": 10,
  "#pfAttSick": 10,
  "#pfAttLate": 10,
  "#pfBgDate": 24,
};

/** Apply the caps to a fresh .pf-row, or to the whole page at init. */
function pfApplyCaps(root) {
  GumaFit.applyCapsBySelector(root, PF_MAXLEN);
}

function drawDocHeader(ctx, W, data, accent) {
  const margin = 24;
  let y = 0;

  // Top double rule
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, 10);
  ctx.lineTo(W - margin, 10);
  ctx.stroke();
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(margin, 14);
  ctx.lineTo(W - margin, 14);
  ctx.stroke();
  y = 20;

  // Form / Date metadata row
  const formCode = ((faction?.short || "PD") + "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const _now = new Date();
  const revStr = String(_now.getMonth() + 1).padStart(2, "0") + "/" + _now.getFullYear();
  ctx.font = "9.5px 'Courier New', monospace";
  ctx.fillStyle = DOC_MUTED;
  ctx.textAlign = "left";
  ctx.fillText("FORM " + formCode + "-101 (REV. " + revStr + ")", margin, y + 9);
  ctx.textAlign = "right";
  ctx.fillText("DATE PREPARED: " + _now.toLocaleDateString("en-US"), W - margin, y + 9);
  y += 14;

  // Agency name (serif title)
  // Agency name: centred on the page, so an over-long one used to run off BOTH
  // edges. Georgia is proportional, so this one is measured rather than counted.
  GumaFit.fitFont(ctx, (faction?.name || "AGENCY").toUpperCase(), W - margin * 2, 22, 12,
    (p) => "bold " + p + "px 'Georgia', 'Times New Roman', serif");
  ctx.fillStyle = DOC_INK;
  ctx.textAlign = "center";
  ctx.fillText((faction?.name || "AGENCY").toUpperCase(), W / 2, y + 22);
  y += 28;

  // Italic subtitle
  ctx.font = "italic 11px 'Georgia', serif";
  ctx.fillStyle = DOC_INK_SOFT;
  ctx.fillText("Office of the Personnel Division — Confidential Internal Records", W / 2, y + 10);
  y += 14;

  // Short decorative double rule
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin + 40, y + 6);
  ctx.lineTo(W - margin - 40, y + 6);
  ctx.stroke();
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(margin + 40, y + 9);
  ctx.lineTo(W - margin - 40, y + 9);
  ctx.stroke();
  y += 12;

  // Document type
  ctx.font = "bold 14px 'Courier New', monospace";
  ctx.fillStyle = DOC_INK;
  ctx.textAlign = "center";
  ctx.fillText("EMPLOYEE PERSONNEL FILE", W / 2, y + 13);
  y += 18;

  // Subject row
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = DOC_INK_SOFT;
  ctx.textAlign = "left";
  ctx.fillText("SUBJECT:", margin + 4, y + 22);
  const lw = ctx.measureText("SUBJECT:").width;
  ctx.fillStyle = DOC_INK;
  const nameTxt = (data.subjectName || "—").toUpperCase();
  // The name sits on a rule that runs to the right margin, so that rule is its
  // budget. It used to be painted at a fixed 15px and simply crossed the edge.
  const nameX = margin + 4 + lw + 10;
  GumaFit.fitFont(ctx, nameTxt, W - margin - 4 - nameX, PF_SUBJECT_PX, PF_TABLE_MIN_PX,
    (p) => "bold " + p + "px " + PF_FONT_FAMILY);
  ctx.fillText(nameTxt, nameX, y + 22);
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(margin + 4 + lw + 10, y + 26);
  ctx.lineTo(W - margin - 4, y + 26);
  ctx.stroke();
  y += 34;

  return y;
}

function drawSectionHeader(ctx, W, y, title, accent) {
  const margin = 24,
    tableW = W - 48;
  ctx.fillStyle = DOC_SEC_BG;
  ctx.fillRect(margin, y, tableW, 24);
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, 23);

  ctx.font = "bold 12px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = DOC_INK;
  ctx.textAlign = "left";
  ctx.fillText(title, margin + 12, y + 17);

  ctx.font = "9.5px 'Courier New', monospace";
  ctx.fillStyle = DOC_MUTED;
  ctx.textAlign = "right";
  ctx.fillText("§", W - margin - 12, y + 17);
  return y + 28;
}

function drawTable(ctx, W, y, accent, headers, colWidths, rows) {
  const margin = 24,
    tableW = W - 48;
  const HDR_H = 24,
    ROW_H = 26;

  // Header row
  ctx.fillStyle = DOC_PAPER_ALT;
  ctx.fillRect(margin, y, tableW, HDR_H);
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, HDR_H - 1);

  ctx.font = "bold 10.5px 'Courier New', monospace";
  ctx.fillStyle = DOC_INK;
  ctx.textAlign = "left";
  let cx = margin + 12;
  headers.forEach((h, i) => {
    ctx.fillText(h, cx, y + 16);
    cx += colWidths[i];
  });
  y += HDR_H;

  // Value sizes, one per column across every row. This is a personnel record:
  // an ellipsis silently drops what somebody typed, and on this document that
  // could be a disciplinary finding or a claim number. Values shrink instead,
  // and PF_MAXLEN keeps the inputs inside what each column carries at the
  // floor. See js/guma-fit.js.
  const valueW = colWidths.map((w) => w - 14);
  const colFonts = GumaFit.colFonts(ctx, rows, valueW, PF_TABLE_PX, PF_TABLE_MIN_PX, pfFont);

  const display = rows.length > 0 ? rows : [null];
  display.forEach((row, ri) => {
    ctx.fillStyle = ri % 2 === 0 ? DOC_PAPER_LITE : DOC_PAPER_ALT;
    ctx.fillRect(margin, y, tableW, ROW_H);

    // bottom faint rule
    ctx.strokeStyle = DOC_RULE_FAINT;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(margin, y + ROW_H - 0.5);
    ctx.lineTo(margin + tableW, y + ROW_H - 0.5);
    ctx.stroke();

    // outer side rules
    ctx.strokeStyle = DOC_INK;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(margin + 0.5, y);
    ctx.lineTo(margin + 0.5, y + ROW_H);
    ctx.moveTo(margin + tableW - 0.5, y);
    ctx.lineTo(margin + tableW - 0.5, y + ROW_H);
    ctx.stroke();

    cx = margin + 12;
    if (row === null) {
      ctx.font = "italic 12px 'Courier New', monospace";
      ctx.fillStyle = DOC_MUTED;
      ctx.textAlign = "left";
      ctx.fillText("— No records on file —", cx, y + 18);
    } else {
      row.forEach((val, vi) => {
        ctx.font = pfFont(colFonts[vi]);
        ctx.fillStyle = val ? DOC_INK : DOC_MUTED;
        ctx.textAlign = "left";
        ctx.fillText(val || "—", cx, y + 18);
        cx += colWidths[vi];
      });
    }
    y += ROW_H;
  });

  // closing bottom rule
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(margin, y + 0.5);
  ctx.lineTo(margin + tableW, y + 0.5);
  ctx.stroke();
  return y + 10;
}

function drawInfoRow(ctx, W, y, pairs) {
  const margin = 24,
    tableW = W - 48;
  ctx.fillStyle = DOC_PAPER_LITE;
  ctx.fillRect(margin, y, tableW, 30);
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, 29);

  // The row lays its pairs out left to right with no fixed columns, so each
  // value's budget is what is left of the box after the labels and the pairs
  // already placed - measured as we go rather than assumed.
  const rightEdge = margin + tableW - 14;
  let cx = margin + 14;
  pairs.forEach(([label, val], i) => {
    ctx.font = "bold 10.5px " + PF_FONT_FAMILY;
    ctx.fillStyle = DOC_INK_SOFT;
    ctx.textAlign = "left";
    const lbl = label.toUpperCase() + ":";
    ctx.fillText(lbl, cx, y + 20);
    cx += ctx.measureText(lbl).width + 8;

    const display = val || "—";
    // Reserve room for the labels of the pairs still to come, so an early long
    // value cannot squeeze a later one out of the box entirely.
    let reserved = 0;
    for (let j = i + 1; j < pairs.length; j++) {
      ctx.font = "bold 10.5px " + PF_FONT_FAMILY;
      reserved += ctx.measureText(pairs[j][0].toUpperCase() + ":").width + 8 + 28;
    }
    const budget = Math.max(40, rightEdge - cx - reserved);
    GumaFit.fitFont(ctx, display, budget, PF_INFO_PX, PF_TABLE_MIN_PX, pfFont);
    ctx.fillStyle = val ? DOC_INK : DOC_MUTED;
    ctx.fillText(display, cx, y + 20);
    cx += ctx.measureText(display).width + 28;
  });
  return y + 42;
}

function drawAttendanceRow(ctx, W, y, att) {
  const margin = 24,
    tableW = W - 48,
    colW = tableW / 4;
  ctx.fillStyle = DOC_PAPER_LITE;
  ctx.fillRect(margin, y, tableW, 32);
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, 31);

  for (let i = 1; i < 4; i++) {
    ctx.strokeStyle = DOC_RULE_FAINT;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(margin + colW * i, y + 4);
    ctx.lineTo(margin + colW * i, y + 28);
    ctx.stroke();
  }

  [
    ["Scheduled", att.scheduled],
    ["Days Present", att.present],
    ["Sick Days", att.sick],
    ["Late", att.late],
  ].forEach(([label, val], i) => {
    const ax = margin + 12 + i * colW;
    ctx.font = "bold 10px " + PF_FONT_FAMILY;
    ctx.fillStyle = DOC_INK_SOFT;
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase() + ":", ax, y + 13);
    // Stay inside this quarter of the row: the cell has a visible divider on
    // its right, so an over-long count used to cross it.
    GumaFit.fitFont(ctx, val || "—", colW - 24, PF_ATT_PX, PF_TABLE_MIN_PX, pfFont);
    ctx.fillStyle = val ? DOC_INK : DOC_MUTED;
    ctx.fillText(val || "—", ax, y + 26);
  });
  return y + 42;
}

function drawNotesSection(ctx, W, y, notes) {
  const margin = 24,
    tableW = W - 48,
    maxLineW = tableW - 28;
  if (notes && notes.trim()) {
    ctx.font = "13px 'Courier New', monospace";
    const lines = [];
    notes.split("\n").forEach((para) => {
      if (!para.trim()) {
        lines.push("");
        return;
      }
      let line = "";
      para.split(" ").forEach((word) => {
        const test = line + (line ? " " : "") + word;
        if (ctx.measureText(test).width > maxLineW && line) {
          lines.push(line);
          line = word;
        } else line = test;
      });
      if (line) lines.push(line);
    });
    const noteH = lines.length * 20 + 16;
    ctx.fillStyle = DOC_PAPER_LITE;
    ctx.fillRect(margin, y, tableW, noteH);
    ctx.strokeStyle = DOC_INK;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, noteH - 1);

    // notepad rules
    ctx.strokeStyle = DOC_RULE_FAINT;
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= lines.length; i++) {
      ctx.beginPath();
      ctx.moveTo(margin + 14, y + 6 + i * 20);
      ctx.lineTo(margin + tableW - 14, y + 6 + i * 20);
      ctx.stroke();
    }
    lines.forEach((l, i) => {
      ctx.font = "13px 'Courier New', monospace";
      ctx.fillStyle = DOC_INK;
      ctx.textAlign = "left";
      ctx.fillText(l, margin + 14, y + 20 + i * 20);
    });
  } else {
    ctx.fillStyle = DOC_PAPER_LITE;
    ctx.fillRect(margin, y, tableW, 32);
    ctx.strokeStyle = DOC_INK;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(margin + 0.5, y + 0.5, tableW - 1, 31);
    ctx.font = "italic 13px 'Courier New', monospace";
    ctx.fillStyle = DOC_MUTED;
    ctx.textAlign = "left";
    ctx.fillText("— No additional notes on file —", margin + 14, y + 21);
  }
}

function drawDocFooter(ctx, W, H) {
  const margin = 24;
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(margin, H - 30);
  ctx.lineTo(W - margin, H - 30);
  ctx.stroke();
  ctx.font = "9px 'Courier New', monospace";
  ctx.fillStyle = DOC_MUTED;
  ctx.textAlign = "left";
  ctx.fillText("PAGE 1 OF 1", margin, H - 18);
  ctx.textAlign = "center";
  ctx.fillText("— END OF FILE —", W / 2, H - 18);
  ctx.textAlign = "right";
  ctx.fillText("INTERNAL USE ONLY", W - margin, H - 18);
}

function drawConfidentialStamp(ctx, W, H) {
  // Faint diagonal watermark
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 9);
  ctx.font = "bold 78px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "#a40000";
  ctx.textAlign = "center";
  ctx.fillText("CONFIDENTIAL", 0, 26);
  ctx.restore();

  // Rubber stamp box top-right
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.translate(W - 210, 34);
  ctx.rotate(-0.07);
  ctx.strokeStyle = "#a40000";
  ctx.lineWidth = 2.2;
  ctx.strokeRect(0, 0, 180, 44);
  ctx.lineWidth = 0.9;
  ctx.strokeRect(4, 4, 172, 36);
  ctx.font = "bold 16px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "#a40000";
  ctx.textAlign = "center";
  ctx.fillText("CONFIDENTIAL", 90, 22);
  ctx.font = "8.5px 'Courier New', monospace";
  ctx.fillText("PERSONNEL DIVISION", 90, 34);
  ctx.restore();
}

// ── Main generator ────────────────────────────────────────────────────────────
function generateDoc() {
  const canvas = document.getElementById("docCanvas");
  const ctx = canvas.getContext("2d");
  const W = 840;

  const data = getDocData();
  const H = calcDocHeight(data);
  canvas.width = W;
  canvas.height = H;

  const accent = (typeof faction !== "undefined" && faction.cardBorder) || "#c8b97a";
  const tableW = W - 48;

  // Paper background
  ctx.fillStyle = DOC_PAPER;
  ctx.fillRect(0, 0, W, H);
  // Double inked border
  ctx.strokeStyle = DOC_INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  let y = drawDocHeader(ctx, W, data, accent);

  y = drawSectionHeader(ctx, W, y, "PERSONAL INFORMATION", accent);
  y = drawInfoRow(ctx, W, y, [["Residence Address", data.address]]);

  y = drawSectionHeader(ctx, W, y, "EMERGENCY CONTACTS", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["NAME", "RELATIONSHIP", "PHONE"],
    [240, 200, tableW - 440],
    data.emergencyContacts.map((r) => [r.name, r.relationship, r.phone]),
  );

  y = drawSectionHeader(ctx, W, y, "TRAINING RECORDS", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["DATE", "COURSE / CERTIFICATION", "INSTITUTION / HOURS"],
    [110, 370, tableW - 480],
    data.training.map((r) => [r.date, r.course, r.institution]),
  );

  y = drawSectionHeader(ctx, W, y, "COMMENDATIONS", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["DATE", "AWARD / COMMENDATION", "ISSUED BY"],
    [110, 360, tableW - 470],
    data.commendations.map((r) => [r.date, r.award, r.issuedBy]),
  );

  y = drawSectionHeader(ctx, W, y, "DISCIPLINARY RECORD", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["DATE", "VIOLATION / COMPLAINT", "PENALTY", "STATUS"],
    [110, 240, 200, tableW - 550],
    data.disciplinary.map((r) => [r.date, r.violation, r.penalty, r.status]),
  );

  y = drawSectionHeader(ctx, W, y, "ATTENDANCE SUMMARY", accent);
  y = drawAttendanceRow(ctx, W, y, data.attendance);

  y = drawSectionHeader(ctx, W, y, "MEDICAL LEAVE", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["FROM", "TO", "REASON / DIAGNOSIS"],
    [110, 110, tableW - 220],
    data.medLeave.map((r) => [r.from, r.to, r.reason]),
  );

  y = drawSectionHeader(ctx, W, y, "WORKERS' COMPENSATION", accent);
  y = drawTable(
    ctx,
    W,
    y,
    accent,
    ["CLAIM #", "DATE", "INCIDENT DESCRIPTION", "STATUS"],
    [130, 110, 340, tableW - 580],
    data.workersComp.map((r) => [r.claim, r.date, r.incident, r.status]),
  );

  y = drawSectionHeader(ctx, W, y, "BACKGROUND INVESTIGATION", accent);
  y = drawInfoRow(ctx, W, y, [
    ["Status", data.background.status],
    ["Clearance", data.background.clearance],
    ["Completed", data.background.date],
  ]);

  y = drawSectionHeader(ctx, W, y, "NOTES / PERSONAL FACTS", accent);
  drawNotesSection(ctx, W, y, data.notes);

  if (data.confidential) drawConfidentialStamp(ctx, W, H);
  drawDocFooter(ctx, W, H);
}

// ── Download / Copy ───────────────────────────────────────────────────────────
async function downloadDoc() {
  const canvas = document.getElementById("docCanvas");
  const safeName = (document.getElementById("subjectName")?.value.trim() || "personnel_file").toLowerCase().replace(/\s+/g, "_");
  const a = document.createElement("a");
  a.download = safeName + "_personnel_file.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard() {
  const canvas = document.getElementById("docCanvas");
  const btn = document.getElementById("copyBtn");
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const newCount = await window.GumaCounters?.trackDownload(window.GUMA_GENERATOR_KEY ?? "personnel");
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

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initPersonnelGenerator({ defaultFaction = "lspd" } = {}) {
  const urlFaction = new URLSearchParams(window.location.search).get("faction");
  FACTION_KEY = urlFaction && FACTIONS[urlFaction] ? urlFaction : defaultFaction;
  faction = FACTIONS[FACTION_KEY];
  buildFactionSwitcher(switchFaction, FACTION_KEY, null);
  pfApplyCaps(document);
  generateDoc();
  document.querySelector(".guma-panel")?.addEventListener("input", debounce(generateDoc));
}

// ── Saved reports: serialize / hydrate / wiring ───────────────

function pfSerializeState() {
  const data = getDocData(); // already JSON-friendly
  return Object.assign(
    {
      FACTION_KEY,
      custom: { customAgencyName: document.getElementById("customAgencyName")?.value.trim() || "" },
    },
    data,
  );
}

function pfHydrateState(payload) {
  if (!payload) return;
  const setVal = GumaHistoryWiring.setVal;

  const fk = payload.FACTION_KEY || "lspd";
  if (fk === "custom") {
    setVal("customAgencyName", payload.custom?.customAgencyName);
    switchFaction("custom");
  } else {
    switchFaction(fk);
  }

  setVal("subjectName", payload.subjectName);
  const conf = document.getElementById("confidentialStamp");
  if (conf) conf.checked = !!payload.confidential;
  setVal("pfAddress", payload.address);
  setVal("pfAttScheduled", payload.attendance?.scheduled);
  setVal("pfAttPresent", payload.attendance?.present);
  setVal("pfAttSick", payload.attendance?.sick);
  setVal("pfAttLate", payload.attendance?.late);
  setVal("pfBgStatus", payload.background?.status);
  setVal("pfBgClearance", payload.background?.clearance);
  setVal("pfBgDate", payload.background?.date);
  setVal("pfNotes", payload.notes);

  const rebuild = (containerId, addFn, rows, classMap) => {
    const c = document.getElementById(containerId);
    if (c) c.innerHTML = "";
    (rows || []).forEach((r) => {
      addFn();
      const row = c && c.lastElementChild;
      if (!row) return;
      Object.entries(classMap).forEach(([key, cls]) => {
        const el = row.querySelector("." + cls);
        if (!el || r[key] == null) return;
        if (el.tagName === "SELECT") {
          if (Array.from(el.options).some((o) => o.value === String(r[key]))) el.value = String(r[key]);
        } else {
          el.value = r[key];
        }
      });
    });
  };

  rebuild("pfEcRows", addEmergencyContact, payload.emergencyContacts, { name: "pf-ec-name", relationship: "pf-ec-rel", phone: "pf-ec-phone" });
  rebuild("pfTrRows", addTrainingRow, payload.training, { date: "pf-tr-date", course: "pf-tr-course", institution: "pf-tr-inst" });
  rebuild("pfCmRows", addCommendationRow, payload.commendations, { date: "pf-cm-date", award: "pf-cm-award", issuedBy: "pf-cm-issued" });
  rebuild("pfDiRows", addDisciplinaryRow, payload.disciplinary, {
    date: "pf-di-date",
    violation: "pf-di-violation",
    penalty: "pf-di-penalty",
    status: "pf-di-status",
  });
  rebuild("pfMlRows", addMedLeaveRow, payload.medLeave, { from: "pf-ml-from", to: "pf-ml-to", reason: "pf-ml-reason" });
  rebuild("pfWcRows", addWorkersCompRow, payload.workersComp, { claim: "pf-wc-claim", date: "pf-wc-date", incident: "pf-wc-incident", status: "pf-wc-status" });

  generateDoc();
}

// Label: subject name only (faction shows as the corner badge).
function pfBuildLabel(payload) {
  return (payload.subjectName || "").trim() || "Unnamed";
}

GumaHistoryWiring.register({
  key: "personnel",
  noun: "report",
  serialize: pfSerializeState,
  hydrate: pfHydrateState,
  buildLabel: pfBuildLabel,
  buildFaction: (p) => GumaHistoryWiring.buildFaction(p, { customShort: (pp) => (pp.custom?.customAgencyName || "").trim() }),
});
