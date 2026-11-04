"use strict";

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Agency name ───────────────────────────────────────────────────────────────
// No faction switcher, same as the firearm report: the document header is the
// control, edited in place from xl and through #agency_name below that.
const DEFAULT_AGENCY = "LOS SANTOS POLICE DEPARTMENT";

/** Header text in print caps. Blank falls back to the default agency. */
function agencyName() {
  const el = document.getElementById("agency_name");
  return ((el ? el.value : "").trim() || DEFAULT_AGENCY).toUpperCase();
}

/**
 * The agency as typed, for the acknowledgement sentence. Not derived from the
 * caps header, so acronyms like "LSPD" survive.
 */
function agencyTitle() {
  return peRawVal("agency_name").trim() || "Los Santos Police Department";
}

// ── Rating scale + rated items ────────────────────────────────────────────────
// One table drives the form rows, the document grid and the saved payload, so
// the three can never disagree on numbering or wording.
const PE_SCALE = [
  { code: "1", label: "1", name: "BELOW STANDARD", desc: "The behavior demonstrates an inability to accomplish required tasks." },
  {
    code: "2",
    label: "2",
    name: "IMPROVEMENT REQUIRED",
    desc: "Performance is progressing towards acceptable but does not yet meet the agency's standard.",
  },
  { code: "3", label: "3", name: "STANDARD", desc: "The behavior demonstrates an adequate ability to accomplish required tasks." },
  { code: "4", label: "4", name: "ABOVE STANDARD", desc: "The behavior demonstrates a more than adequate ability to accomplish required tasks." },
  { code: "no", label: "N/O", name: "NOT OBSERVED", desc: "The behavior was not observed." },
  { code: "nrt", label: "NRT", name: "NOT RESPONDING TO TRAINING", desc: "The probationary police officer fails to respond to training." },
];

const PE_SECTIONS = [
  { title: "APPEARANCE", items: ["General Appearance"] },
  { title: "ATTITUDE", items: ["Acceptance of Feedback", "Attitude towards the Job"] },
  {
    title: "KNOWLEDGE",
    items: [
      "Department Policies/Procedures",
      "Law, LSMC, Search and Seizure",
      "Vehicle Code",
      "Results of Verbal Tests",
      "Results of Field Performance Tests",
    ],
  },
  {
    title: "PERFORMANCE",
    items: [
      "Driving Skill:  Normal Patrol Conditions",
      "Driving Skill:  Moderate and Stress Conditions",
      "Driving Skill:  Response Time to Calls",
      "Reports/Forms:  Accuracy/Completeness/Selection",
      "Report Writing:  Organization/Skill",
      "Report Writing:  Level/Grammar/Spelling/Neatness",
      "Report Writing:  Appropriate Time Used",
      "Field Performance:  Non-Stress Conditions",
      "Field Performance:  Stress Conditions",
      "Self-Initiated Field Activities",
      "Officer Safety:  General",
      "Officer Safety:  Suspects/Prisoners",
      "Control of Conflict:  Voice Command",
      "Control of Conflict:  Physical Skill",
      "Use of Common Sense and Good Judgement",
      "Radio/MDC:  Appropriate Use of Communications Codes",
      "Radio/MDC:  Listens to and Comprehends Transmissions",
      "Radio:  Articulation of Transmissions",
    ],
  },
  {
    title: "RELATIONSHIPS",
    items: ["With Citizens in General", "With Ethnic Groups or Gender Other Than Own", "Other:  FTO/Field Sergeant/Watch Commander", "With Other Employees"],
  },
];

// Flattened, numbered once: [{ n, label, section }]
const PE_ITEMS = [];
PE_SECTIONS.forEach((s) => s.items.forEach((label) => PE_ITEMS.push({ n: PE_ITEMS.length + 1, label, section: s.title })));

/** Radio id for one item + scale code, e.g. rate_12_nrt. */
const rateId = (n, code) => `rate_${n}_${code}`;

// ── Signature blocks ──────────────────────────────────────────────────────────
// The five reviewer rows down the left column; the officer's own row (ppo) is
// printed separately in the acknowledgement box on the right.
const PE_SIGNERS = [
  { key: "fto", title: "Field Training Officer" },
  { key: "sgt", title: "Field Sergeant" },
  { key: "wc", title: "Watch Commander" },
  { key: "p1", title: "P-1 Coordinator" },
  { key: "capt", title: "Captain" },
];
const PE_SIGNER_PPO = { key: "ppo", title: "Probationary Police Officer" };
const PE_SIG_FIELDS = ["name", "serial", "date"];

// ── Form builders ─────────────────────────────────────────────────────────────
function buildRatingRows() {
  const host = document.getElementById("ratingsContainer");
  if (!host) return;
  const opts = (n) =>
    PE_SCALE.map(
      (s) => `
        <label class="guma-rate-opt" title="${s.name}">
          <input type="radio" name="rate_${n}" id="${rateId(n, s.code)}" value="${s.code}" />
          <span>${s.label}</span>
        </label>`,
    ).join("");

  host.innerHTML = PE_SECTIONS.map((s) => {
    const rows = PE_ITEMS.filter((it) => it.section === s.title)
      .map(
        (it) => `
        <div class="guma-rate-row">
          <span class="guma-rate-label">${it.n}. ${it.label.replace(/ {2}/g, " ")}</span>
          <div class="guma-rate-opts">${opts(it.n)}</div>
        </div>`,
      )
      .join("");
    return `<p class="guma-rate-section">${s.title}</p>${rows}`;
  }).join("");
}

function buildSignatureRows() {
  const host = document.getElementById("signaturesContainer");
  if (!host) return;
  host.innerHTML = [...PE_SIGNERS, PE_SIGNER_PPO]
    .map(
      (s) => `
      <div class="dynamic-row">
        <div class="row-title">${s.title}</div>
        <div class="three-col">
          <div class="form-group !mb-0">
            <label>Signature (Name)</label>
            <input type="text" id="sig_${s.key}_name" placeholder="J. Smith" />
          </div>
          <div class="form-group !mb-0">
            <label>Serial No.</label>
            <input type="text" id="sig_${s.key}_serial" placeholder="38512" />
          </div>
          <div class="form-group !mb-0">
            <label>Date</label>
            <input type="date" id="sig_${s.key}_date" />
          </div>
        </div>
      </div>`,
    )
    .join("");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function peRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function getVal(id) {
  return peRawVal(id).trim() || "-";
}

function peChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function fmtDate(raw) {
  if (!raw) return "-";
  const p = raw.split("-");
  return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : raw;
}

/** Selected scale code for an item, or "" when none. */
function ratingOf(n) {
  const hit = PE_SCALE.find((s) => peChecked(rateId(n, s.code)));
  return hit ? hit.code : "";
}

// ── Canvas layout constants (logical pixels - rendered xSCALE) ───────────────
const MARGIN = 20;
const DOC_W = 612;
const BODY_W = DOC_W - MARGIN * 2;
const LINE_W = 0.6;
const CELL_BG = "#fff";
const SECT_BG = "#d4d4d4";

const OPT_W = 46; // one rating column (box + code)
const LBL_W = BODY_W - OPT_W * PE_SCALE.length;
const ROW_H = 10.5;
const SECT_H = 10;

const LEFT_W = Math.round(BODY_W * 0.56); // remediation + reviewer signatures
const RIGHT_W = BODY_W - LEFT_W; // weekly performance + acknowledgement
const REM_H = 44;
const SIG_H = 20;

// ── No printed value ends in an ellipsis ─────────────────────────────────────
// Values shrink to fit (GumaFit) and every input is capped at what its cell
// carries, so the shrink floor is never reached in practice.
const PE_VAL_PX = 8;
const PE_VAL_MIN_PX = 4.5;
const PE_SIG_PX = 10;

// Character caps, keyed by page-level id or by signature field suffix. Each
// number is what the cell carries at roughly 6px against an all-caps sample.
const PE_MAXLEN = {
  agency_name: 60,
  ppo_name: 52,
  ppo_serial: 13,
  fto_name: 50,
  division: 27,
  watch: 19,
  assignment: 36,
  report_no: 19,
  // signature rows (reviewer cells are the narrowest, ppo shares the cap)
  name: 40,
  serial: 14,
};

function peApplyCaps(root) {
  GumaFit.applyCaps(root, PE_MAXLEN);
}

const sigFont = (px) => `italic ${px}px "Times New Roman", Times, serif`;

// ── Hitbox registration (gated off during the measuring pass) ───────────────
let REG = true;
function regField(ref, x, y, w, h, opts) {
  if (REG) window.GumaCanvasEdit?.field(ref, x, y, w, h, opts);
}

// ── Primitive: rectangle with the document stroke ────────────────────────────
function box(ctx, x, y, w, h, bg) {
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = "#000";
  ctx.lineWidth = LINE_W;
  ctx.strokeRect(x, y, w, h);
}

// ── Primitive: tick box ──────────────────────────────────────────────────────
function tickBox(ctx, x, y, size, checked) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.6;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  if (!checked) return;
  ctx.fillStyle = "#000";
  ctx.font = `bold ${size + 1}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("X", x + size / 2, y + size - 0.4);
  ctx.textAlign = "left";
}

// ── Primitive: one labelled table cell ───────────────────────────────────────
function cell(ctx, x, y, w, h, label, value, opts = {}) {
  box(ctx, x, y, w, h, CELL_BG);

  if (label) {
    ctx.fillStyle = "#333";
    ctx.font = "5.6px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 2, y + 6.5);
  }

  const shown = value || "-";
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  const mk = opts.font || ((px) => px + "px Arial");
  GumaFit.fitFont(ctx, shown, w - 4, opts.px || PE_VAL_PX, PE_VAL_MIN_PX, mk);
  ctx.fillText(shown, x + 2, y + h - 3.5);

  if (opts.ref) regField(opts.ref, x, y, w, h, { kind: opts.kind, label, minEditW: opts.minEditW });
}

/** Lay a row of { label, ref, w, kind?, date? } cells across a width. */
function row(ctx, spec, x0, y, totalW, h) {
  const widths = spec.map((s) => Math.round(totalW * s.w));
  widths[widths.length - 1] += totalW - widths.reduce((a, b) => a + b, 0);
  let x = x0;
  spec.forEach((s, i) => {
    const raw = peRawVal(s.ref).trim();
    const value = s.date ? fmtDate(raw) : raw || "-";
    cell(ctx, x, y, widths[i], h, s.label, value, { ref: s.ref, kind: s.date ? "date" : s.kind, font: s.font, px: s.px });
    x += widths[i];
  });
  return y + h;
}

/**
 * Word-wrap a sequence of styled runs ({ text, bold, underline }) into maxW,
 * painting as it goes. Returns the baseline y after the last line.
 */
function richText(ctx, runs, x, y, maxW, px, lineH, paint = true) {
  const words = [];
  runs.forEach((r) =>
    r.text
      .split(" ")
      .filter(Boolean)
      .forEach((t) => words.push({ t, bold: !!r.bold, underline: !!r.underline })),
  );
  const fontOf = (w) => (w.bold ? "bold " : "") + px + "px Arial";
  ctx.font = px + "px Arial";
  const spaceW = ctx.measureText(" ").width;
  let cx = x;
  let cy = y;
  ctx.textAlign = "left";
  ctx.fillStyle = "#000";
  words.forEach((w, i) => {
    ctx.font = fontOf(w);
    const ww = ctx.measureText(w.t).width;
    if (cx > x && cx + ww > x + maxW) {
      cx = x;
      cy += lineH;
    }
    if (paint) {
      ctx.fillText(w.t, cx, cy);
      // An underlined phrase stays one rule: bridge the gap to the next word.
      const bridge = words[i + 1] && words[i + 1].underline ? spaceW : 0;
      if (w.underline) ctx.fillRect(cx, cy + 1, ww + bridge, 0.5);
    }
    cx += ww + spaceW;
  });
  return cy;
}

// ── Header + officer rows ────────────────────────────────────────────────────
function drawHeader(ctx, y) {
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 9px Arial";
  const agency = agencyName();
  ctx.fillText(agency, DOC_W / 2, y + 7);
  const agencyW = Math.max(140, ctx.measureText(agency).width + 10);
  regField("agency_name", DOC_W / 2 - agencyW / 2, y - 1, agencyW, 11, {
    label: "Agency Name",
    align: "center",
    fontPx: 9,
    transform: "upper",
  });
  y += 11;

  ctx.font = "bold 13px Arial";
  ctx.fillText("PROBATIONARY POLICE OFFICER WEEKLY EVALUATION REPORT", DOC_W / 2, y + 11);
  y += 16;

  y = row(
    ctx,
    [
      { label: "PROBATIONARY POLICE OFFICER'S NAME", ref: "ppo_name", w: 0.38 },
      { label: "SERIAL NO.", ref: "ppo_serial", w: 0.1 },
      { label: "FIELD TRAINING OFFICER", ref: "fto_name", w: 0.36 },
      { label: "DATE", ref: "report_date", w: 0.16, date: true },
    ],
    MARGIN,
    y,
    BODY_W,
    20,
  );

  // Division .. Report No. as a normal row, then the two-part rating period.
  const periodW = Math.round(BODY_W * 0.26);
  row(
    ctx,
    [
      { label: "DIVISION", ref: "division", w: 0.27 },
      { label: "WATCH", ref: "watch", w: 0.19 },
      { label: "ASSIGNMENT", ref: "assignment", w: 0.35 },
      { label: "REPORT NO.", ref: "report_no", w: 0.19 },
    ],
    MARGIN,
    y,
    BODY_W - periodW,
    20,
  );
  drawRatingPeriod(ctx, MARGIN + BODY_W - periodW, y, periodW, 20);
  return y + 20;
}

/** RATING PERIOD cell: one label, FROM / TO halves, each its own date field. */
function drawRatingPeriod(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, CELL_BG);
  ctx.fillStyle = "#333";
  ctx.font = "5.6px Arial";
  ctx.textAlign = "left";
  ctx.fillText("RATING PERIOD", x + 2, y + 6.5);

  const half = w / 2;
  [
    { id: "period_from", tag: "FROM:", hx: x },
    { id: "period_to", tag: "TO:", hx: x + half },
  ].forEach((p) => {
    ctx.fillStyle = "#333";
    ctx.font = "5.6px Arial";
    ctx.fillText(p.tag, p.hx + 2, y + h - 3.5);
    const tagW = ctx.measureText(p.tag).width + 4;
    ctx.fillStyle = "#000";
    ctx.font = PE_VAL_PX + "px Arial";
    ctx.fillText(fmtDate(peRawVal(p.id)), p.hx + tagW, y + h - 3.5);
    regField(p.id, p.hx + tagW - 2, y + 8, half - tagW, h - 8, { kind: "date", label: "Rating Period " + p.tag.replace(":", "") });
  });
}

// ── Rating instructions + scale legend ───────────────────────────────────────
function drawInstructions(ctx, y) {
  y += 10;
  y = richText(
    ctx,
    [
      { text: "RATING INSTRUCTIONS:", bold: true },
      {
        text:
          "Use the following scale to rate the probationary police officer. However, a SPECIFIC comment MUST be made on the " +
          "Probationary Police Officer Daily Observation Report if a rating of (1) BELOW STANDARD, (2) IMPROVEMENT REQUIRED, or " +
          "(3) NOT RESPONDING TO TRAINING is given. Check NOT OBSERVED (N/O) if behavior is not observed. If the probationary " +
          "police officer fails to respond to training, mark NOT RESPONDING TO TRAINING (NRT).",
      },
    ],
    MARGIN,
    y,
    BODY_W,
    6.3,
    7.6,
  );

  y += 8.5;
  PE_SCALE.forEach((s) => {
    const tag = `(${s.label}) ${s.name}:`;
    ctx.font = "bold 6.3px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#000";
    ctx.fillText(tag, MARGIN + 30, y);
    // The code stays plain, only the name is underlined (as on the paper form).
    const codeW = ctx.measureText(`(${s.label}) `).width;
    const nameW = ctx.measureText(s.name + ":").width;
    ctx.fillRect(MARGIN + 30 + codeW, y + 1, nameW, 0.5);
    ctx.font = "6.3px Arial";
    ctx.fillText(s.desc, MARGIN + 170, y);
    y += 7.6;
  });
  return y - 3;
}

// ── Ratings grid ──────────────────────────────────────────────────────────────
function drawRatings(ctx, y) {
  const optX = MARGIN + LBL_W;

  PE_SECTIONS.forEach((s) => {
    // Section bar spans the whole grid, rating columns included.
    box(ctx, MARGIN, y, BODY_W, SECT_H, SECT_BG);
    ctx.fillStyle = "#000";
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(s.title, MARGIN + 3, y + 7.5);
    y += SECT_H;

    PE_ITEMS.filter((it) => it.section === s.title).forEach((it) => {
      box(ctx, MARGIN, y, LBL_W, ROW_H, CELL_BG);
      box(ctx, optX, y, BODY_W - LBL_W, ROW_H, CELL_BG);

      ctx.fillStyle = "#000";
      ctx.font = "6.8px Arial";
      ctx.textAlign = "right";
      ctx.fillText(it.n + ".", MARGIN + 15, y + 7.6);
      ctx.textAlign = "left";
      ctx.fillText(it.label, MARGIN + 30, y + 7.6);

      const picked = ratingOf(it.n);
      PE_SCALE.forEach((sc, i) => {
        const cx = optX + i * OPT_W;
        tickBox(ctx, cx + 8, y + 2.25, 6, picked === sc.code);
        ctx.fillStyle = "#000";
        ctx.font = "6.5px Arial";
        ctx.textAlign = "left";
        ctx.fillText(sc.label, cx + 19, y + 7.6);
        regField(rateId(it.n, sc.code), cx + 2, y + 0.5, OPT_W - 4, ROW_H - 1, {
          kind: "check",
          label: `${it.n}. ${sc.label}`,
        });
      });
      y += ROW_H;
    });
  });
  return y;
}

// ── Remediation (multiline) ──────────────────────────────────────────────────
function drawRemediation(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, CELL_BG);
  ctx.fillStyle = "#333";
  ctx.font = "5.6px Arial";
  ctx.textAlign = "left";
  ctx.fillText("MINUTES OF REMEDIATION", x + 2, y + 6.5);

  const raw = peRawVal("remediation").trim();
  ctx.fillStyle = "#000";
  if (!raw) {
    ctx.font = PE_VAL_PX + "px Arial";
    ctx.fillText("-", x + 3, y + 17);
  } else {
    // Newline-aware shrink until every paragraph fits; the textarea maxlength
    // keeps the floor out of reach.
    const innerW = w - 6;
    const availH = h - 10;
    let px = 7;
    let lines = [];
    for (;;) {
      ctx.font = px + "px Arial";
      lines = [];
      raw.split("\n").forEach((par) => GumaFit.wrapLines(ctx, par, innerW, 999).forEach((l) => lines.push(l)));
      if (lines.length * (px + 1.5) <= availH || px <= 4.5) break;
      px -= 0.5;
    }
    const lineH = px + 1.5;
    const maxLines = Math.max(1, Math.floor(availH / lineH));
    let ty = y + 8.5 + px;
    lines.slice(0, maxLines).forEach((l) => {
      ctx.fillText(l, x + 3, ty);
      ty += lineH;
    });
  }
  regField("remediation", x, y, w, h, { kind: "multiline", label: "Minutes of Remediation", fontPx: 7 });
}

// ── Left column: remediation + reviewer signatures ───────────────────────────
function drawReviewerSignatures(ctx, y) {
  drawRemediation(ctx, MARGIN, y, LEFT_W, REM_H);
  y += REM_H;
  PE_SIGNERS.forEach((s) => {
    y = row(
      ctx,
      [
        { label: "SIGNATURE OF " + s.title.toUpperCase(), ref: `sig_${s.key}_name`, w: 0.58, font: sigFont, px: PE_SIG_PX },
        { label: "SERIAL NO.", ref: `sig_${s.key}_serial`, w: 0.2 },
        { label: "DATE", ref: `sig_${s.key}_date`, w: 0.22, date: true },
      ],
      MARGIN,
      y,
      LEFT_W,
      SIG_H,
    );
  });
  return y;
}

// ── Right column: weekly performance + officer acknowledgement ───────────────
function drawAcknowledgement(ctx, y, h) {
  const x = MARGIN + LEFT_W;
  const w = RIGHT_W;
  box(ctx, x, y, w, h, CELL_BG);

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "9px Arial";
  ctx.fillText("Weekly Performance", x + w / 2, y + 11);

  // Satisfactory / Unsatisfactory - a radio pair, toggled like checkboxes.
  [
    { id: "weekly_sat", label: "Satisfactory", bx: x + 34 },
    { id: "weekly_unsat", label: "Unsatisfactory", bx: x + w / 2 + 14 },
  ].forEach((o) => {
    tickBox(ctx, o.bx, y + 16, 7, peChecked(o.id));
    ctx.fillStyle = "#000";
    ctx.font = "7.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(o.label, o.bx + 11, y + 22.5);
    regField(o.id, o.bx - 2, y + 14, ctx.measureText(o.label).width + 16, 11, { kind: "check", label: o.label });
  });

  // Acknowledgement sentence follows the agency in the header.
  richText(
    ctx,
    [
      {
        text:
          "I understand that a continuation of a weekly unsatisfactory duty performance evaluation may lead to the " +
          `termination of my employment with the ${agencyTitle()}.`,
      },
    ],
    x + 6,
    y + 38,
    w - 12,
    6.8,
    8.4,
  );

  // Officer signature over a rule, captions under it.
  const lineY = y + h - 36;
  const nameW = w * 0.56;
  const serialW = w * 0.2;
  const cols = [
    { ref: "sig_ppo_name", cx: x + 6, cw: nameW - 8, cap: "SIGNATURE OF\nPROBATIONARY POLICE OFFICER", font: sigFont, px: PE_SIG_PX },
    { ref: "sig_ppo_serial", cx: x + nameW, cw: serialW, cap: "SERIAL NO." },
    { ref: "sig_ppo_date", cx: x + nameW + serialW + 4, cw: w - nameW - serialW - 10, cap: "DATE", date: true },
  ];
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 6, lineY, w - 12, 0.6);
  cols.forEach((c) => {
    const raw = peRawVal(c.ref).trim();
    const shown = c.date ? fmtDate(raw) : raw || "-";
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    GumaFit.fitFont(ctx, shown, c.cw - 2, c.px || PE_VAL_PX, PE_VAL_MIN_PX, c.font || ((px) => px + "px Arial"));
    ctx.fillText(shown, c.cx, lineY - 2.5);
    ctx.fillStyle = "#333";
    ctx.font = "5.6px Arial";
    ctx.textAlign = c.ref === "sig_ppo_name" ? "center" : "left";
    c.cap.split("\n").forEach((ln, i) => ctx.fillText(ln, c.ref === "sig_ppo_name" ? c.cx + c.cw / 2 : c.cx, lineY + 7 + i * 6.5));
    regField(c.ref, c.cx - 2, lineY - 12, c.cw, 12, { kind: c.date ? "date" : undefined, label: c.cap.replace("\n", " ") });
  });

  // Response attached checkbox
  const cbY = y + h - 14;
  tickBox(ctx, x + 6, cbY, 7, peChecked("cb_response"));
  ctx.fillStyle = "#000";
  ctx.font = "7.5px Arial";
  ctx.textAlign = "left";
  const respLabel = "Probationary Police Officer's Response Attached.";
  ctx.fillText(respLabel, x + 17, cbY + 6.5);
  regField("cb_response", x + 4, cbY - 2, ctx.measureText(respLabel).width + 16, 11, { kind: "check", label: "Response Attached" });
}

// ── Footer: form number + forwarding note ────────────────────────────────────
function drawFooter(ctx, y) {
  y += 9;
  ctx.fillStyle = "#000";
  ctx.font = "5.6px Arial";
  ctx.textAlign = "left";
  ctx.fillText("01.78.01 (06/15)", MARGIN, y);
  richText(
    ctx,
    [
      { text: "* Immediately after service,", bold: true },
      { text: "Unsatisfactory Ratings", bold: true, underline: true },
      { text: "are to be forwarded to the Field Training Officers Unit, Training Division.", bold: true },
    ],
    MARGIN + 70,
    y,
    BODY_W - 70,
    6,
    7,
  );
  return y;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
/** Paint the whole document onto ctx and return its logical height. */
function paintDoc(ctx) {
  let y = MARGIN;
  y = drawHeader(ctx, y);
  y = drawInstructions(ctx, y);
  y = drawRatings(ctx, y);

  const bottomH = REM_H + PE_SIGNERS.length * SIG_H;
  drawReviewerSignatures(ctx, y);
  drawAcknowledgement(ctx, y, bottomH);
  y += bottomH;

  y = drawFooter(ctx, y);
  return y + MARGIN - 6;
}

// The height is fixed by the layout, but measured rather than hand-summed: one
// silent pass against a scratch canvas with hitbox registration off.
let peDocH = 0;
function measureDocH() {
  const scratch = document.createElement("canvas").getContext("2d");
  REG = false;
  try {
    return Math.ceil(paintDoc(scratch));
  } finally {
    REG = true;
  }
}

function drawForm() {
  if (!peDocH) peDocH = measureDocH();
  window.GumaCanvasEdit?.begin({ scale: SCALE });

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = peDocH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DOC_W, peDocH);

  paintDoc(ctx);
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
  a.download = "probationary-evaluation.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard() {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  if (!(await GumaClipboard.copyCanvas(canvas))) return;

  const newCount = await window.GumaCounters?.trackDownload("evaluation");
  const countEl = document.getElementById("downloadCount");
  if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
}

// ── Init ─────────────────────────────────────────────────────────────────────
buildRatingRows();
buildSignatureRows();
peApplyCaps(document);
GumaRadio.makeClearable(document);
document.querySelectorAll("input,select,textarea").forEach((el) => {
  el.addEventListener("input", refreshPreview);
  el.addEventListener("change", refreshPreview);
});
drawForm();

// ── Saved reports: serialize / hydrate / wiring ───────────────
const PE_SCALAR_FIELDS = [
  "agency_name",
  "ppo_name",
  "ppo_serial",
  "fto_name",
  "report_date",
  "division",
  "watch",
  "assignment",
  "report_no",
  "period_from",
  "period_to",
  "remediation",
];

function peSerializeState() {
  const fields = {};
  PE_SCALAR_FIELDS.forEach((id) => (fields[id] = peRawVal(id)));

  const ratings = {};
  PE_ITEMS.forEach((it) => (ratings[it.n] = ratingOf(it.n)));

  const signatures = {};
  [...PE_SIGNERS, PE_SIGNER_PPO].forEach((s) => {
    signatures[s.key] = {};
    PE_SIG_FIELDS.forEach((f) => (signatures[s.key][f] = peRawVal(`sig_${s.key}_${f}`)));
  });

  return {
    fields,
    ratings,
    weekly: peChecked("weekly_sat") ? "sat" : peChecked("weekly_unsat") ? "unsat" : "",
    response: peChecked("cb_response"),
    signatures,
  };
}

function peHydrateState(payload) {
  if (!payload) return;
  window.GumaCanvasEdit?.cancelEdit();
  const setVal = GumaHistoryWiring.setVal;
  const setChecked = GumaHistoryWiring.setChecked;

  const f = payload.fields || {};
  PE_SCALAR_FIELDS.forEach((id) => setVal(id, f[id]));

  const r = payload.ratings || {};
  PE_ITEMS.forEach((it) => PE_SCALE.forEach((sc) => setChecked(rateId(it.n, sc.code), r[it.n] === sc.code)));

  setChecked("weekly_sat", payload.weekly === "sat");
  setChecked("weekly_unsat", payload.weekly === "unsat");
  setChecked("cb_response", payload.response);

  const sig = payload.signatures || {};
  [...PE_SIGNERS, PE_SIGNER_PPO].forEach((s) => PE_SIG_FIELDS.forEach((k) => setVal(`sig_${s.key}_${k}`, (sig[s.key] || {})[k])));

  refreshPreview();
}

function peBuildLabel(payload) {
  const f = payload.fields || {};
  const name = (f.ppo_name || "").trim();
  const no = (f.report_no || "").trim();
  const head = name ? (no ? `${name} #${no}` : name) : "Evaluation Report";
  const date = (f.report_date || "").trim();
  return date ? `${head} - ${date}` : head;
}

GumaHistoryWiring.register({
  key: "evaluation",
  noun: "report",
  serialize: peSerializeState,
  hydrate: peHydrateState,
  buildLabel: peBuildLabel,
  // no buildFaction - the agency is free text on this report, not a faction
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
  key: "evaluation",
});
