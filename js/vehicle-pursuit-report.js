"use strict";

// ── Vehicle Pursuit Report ────────────────────────────────────────────────────
// One module for the whole pursuit packet: the two-page Vehicle Pursuit Report,
// a classification review page per pursuing unit (Primary / Second / Third and
// any number of Additional Units) and any number of Pursuit Findings Internal
// Process Receipts. Every page is optional; the included ones are stacked on
// the one page canvas (same scheme as the Investigative Report) and exported
// one sheet at a time through the preview modal.

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

// ── Agency name ───────────────────────────────────────────────────────────────
// No faction switcher, same as the other LSPD-style reports: the document
// header is the control, edited in place from xl and through #agency_name.
const DEFAULT_AGENCY = "LOS SANTOS POLICE DEPARTMENT";

function agencyName() {
  return (vpVal("agency_name") || DEFAULT_AGENCY).toUpperCase();
}

// ── Static tables ─────────────────────────────────────────────────────────────
// Each table drives both the form markup and the document, so the two can
// never disagree on wording, order or ids.

// Units with a crew block on page 1. Only the first three get a review page.
const VP_UNITS = [
  { key: "u1", side: "PRIMARY UNIT", review: "PRIMARY UNIT IN PURSUIT", tab: "Primary Unit" },
  { key: "u2", side: "SECOND UNIT", review: "SECONDARY UNIT IN PURSUIT", tab: "Second Unit" },
  { key: "u3", side: "THIRD UNIT", review: "THIRD UNIT IN PURSUIT", tab: "Third Unit" },
  { key: "usup", side: "SUPERVISOR UNIT", review: null, tab: "Supervisor Unit" },
];

const VP_ROLES = [
  { key: "drv", label: "Driver", side: "DRIVER" },
  { key: "pas", label: "Passenger", side: "PASSENGER" },
];

// Vehicle type boxes under every crew block. "\n" splits the printed label.
const VP_VEH_TYPES = [
  { code: "bw", label: "Black &\nWhite" },
  { code: "dual", label: "Dual\nPurpose" },
  { code: "hybrid", label: "Hybrid" },
  { code: "motor", label: "Motor\nCycle" },
  { code: "plain", label: "Plain" },
];

// Area/Division classification: parent box per branch, one child picked.
const VP_CLASS_INIT = [
  {
    code: "in",
    label: "In Policy - (Select One)",
    opts: [
      { code: "nfa", label: "No Further Action" },
      { code: "trn", label: "Training" },
    ],
  },
  {
    code: "out",
    label: "Administrative Disapproval - Out of Policy (Select One)",
    opts: [
      { code: "ft", label: "Formal Training" },
      { code: "ncd", label: "Notice to Correct Deficiencies" },
      { code: "pc", label: "Personnel Complaint" },
    ],
  },
];
const VP_CLASS_TAC = [
  {
    code: "ok",
    label: "Administrative Approval - (Select One)",
    opts: [
      { code: "nfa", label: "No Further Action" },
      { code: "trn", label: "Training" },
    ],
  },
  {
    code: "dis",
    label: "Administrative Disapproval - (Select One)",
    opts: [
      { code: "ft", label: "Formal Training" },
      { code: "ncd", label: "Notice to Correct Deficiencies" },
      { code: "pc", label: "Personnel Complaint" },
    ],
  },
];

// The three review tiers per crew member. "full" = the Area/Division branch
// pick, "concur" = agree / disagree with the tier above.
const VP_TIERS = [
  { key: "r", kind: "full", title: "RECOMMENDED CLASSIFICATION:", form: "Recommended (Area / Division)", sig: "area", signer: "Area/Division Commanding Officer" },
  { key: "b", kind: "concur", title: "RECOMMENDED CLASSIFICATION:", form: "Recommended (Bureau / Group)", against: "Area/Div", sig: "bureau", signer: "Bureau/Group Commanding Officer" },
  { key: "f", kind: "concur", title: "FINAL CLASSIFICATION:", form: "Final Classification", against: "Bureau/Group", sig: "dtc", signer: "DTC or designee staff officer" },
];
const VP_CONCUR = [
  { code: "c", verb: "I concur with" },
  { code: "d", verb: "I disagree with", note: "(See attached 15.02.00.)" },
];

// Page 2 injury grids
const VP_INJ_SETS = [
  { key: "c", q: "Injuries as a result of a collision?" },
  { key: "a", q: "Injuries occurring after vehicle pursuit?" },
];
const VP_INJ_ROWS = [
  { key: "fatal", label: "Fatal Injury" },
  { key: "serious", label: "Serious Injury" },
  { key: "visible", label: "Other Visible Injury" },
  { key: "complaint", label: "Complaint of Injury" },
];
const VP_INJ_COLS = [
  { key: "off", label: "Police\nOfficer(s)", form: "Officers" },
  { key: "susp", label: "Suspect(s)", form: "Suspects" },
  { key: "third", label: "3rd Parties", form: "3rd Parties" },
];

// Reason for initiation / booking charge
const VP_CHARGES = [
  { key: "reason", title: "REASON FOR INITIATION", form: "Reason for Initiation" },
  { key: "booking", title: "BOOKING CHARGE", form: "Booking Charge" },
];
const VP_CHARGE_TYPES = [
  { code: "felony", label: "Felony" },
  { code: "misd", label: "Misdemeanor" },
  { code: "other", label: "Other" },
];

const VP_DISPOSITIONS = [
  { code: "a", label: "Pursued driver voluntarily stopped." },
  { code: "b", label: "Driver abandoned stopped vehicle and fled on foot." },
  { code: "c", label: "Driver abandoned moving vehicle and fled on foot." },
  { code: "d", label: "Forcible stop (except for PIT and TDD)." },
  { code: "e", label: "Pursued or pursuing vehicle became disabled." },
  { code: "f", label: "Pursuit discontinued by the Department." },
  { code: "g", label: "Pursuit continued by other agency." },
  { code: "h", label: "Pursued vehicle and pursuing vehicle collided." },
  { code: "i", label: "Pursued vehicle collided with non-pursuing vehicle/object." },
  { code: "j", label: "Pursuing vehicle collided with non-pursuing vehicle/object." },
  { code: "k", label: "Pursued vehicle escaped pursuing vehicles." },
  { code: "l", label: "Tire Deflation Device." },
  { code: "m", label: "PIT Maneuver." },
  { code: "n", label: "Other: (Explain)" },
];

const VP_RELATED = [
  { key: "booking", label: "Booking Number(s)", ph: "BK-26-55102" },
  { key: "employee", label: "Employee's Report - 15.07.00", ph: "ER-26-0612" },
  { key: "incident", label: "Incident Number(s) Related", ph: "LS-26-104770" },
  { key: "property", label: "Property Report(s)", ph: "PR-26-3318" },
  { key: "collision", label: "Traffic Collision(s)", ph: "TC-26-0921" },
  { key: "uof", label: "UOF Case Number(s)", ph: "UOF-26-0147" },
  { key: "vehicle", label: "Vehicle Report(s)", ph: "VR-26-2240" },
  { key: "investigative", label: "Investigative Report(s)", ph: "IR-26-7781" },
];

// VIT statistics, PIT and TDD columns. `wide` = one value across both.
const VP_VIT_ROWS = [
  { key: "executed", label: "Number of VITs executed", form: "VITs executed" },
  { key: "stopped", label: "Did a VIT stop the pursuit?", form: "Did a VIT stop the pursuit?" },
  { key: "inj_off", label: "Number of Officers Injured (ABC)\nresulting from VITs", form: "Officers injured (ABC)" },
  { key: "inj_susp", label: "Number of Suspect(s) Injured (ABC)\nresulting from VITs", form: "Suspects injured (ABC)" },
  { key: "inj_third", label: "Number of 3rd Parties Injured (ABC)\nresulting from VITs", form: "3rd parties injured (ABC)" },
  { key: "death_off", label: "Number of Officer(s) deaths (K)\nresulting from VITs", form: "Officer deaths (K)" },
  { key: "death_susp", label: "Number of Suspect(s) deaths (K)\nresulting from VITs", form: "Suspect deaths (K)" },
  { key: "death_third", label: "Number of 3rd Party deaths (K)\nresulting from VITs", form: "3rd party deaths (K)" },
  { key: "collisions", label: "Number of Traffic Collisions resulting\nfrom VITs", form: "Traffic collisions from VITs" },
  { key: "synopsis", label: "Synopsis of property damage as a result\nof VITs (use additional paper, if needed)", wide: true },
  { key: "photos", label: "Number of photos", form: "Number of photos" },
  { key: "training", label: "Was additional Divisional Training or Directed\nTraining recommended as the result of VITs?", form: "Training recommended?" },
];

// Bottom signature blocks of page 2
const VP_SIGNERS = [
  { key: "ctrl", label: "Supvr Controlling/\nMonitoring Pursuit", form: "Supervisor Controlling / Monitoring Pursuit" },
  { key: "comp", label: "Supervisor\nCompleting Report", form: "Supervisor Completing Report" },
  { key: "wc", label: "Watch Cmdr/\nOIC Reviewing", form: "Watch Commander / OIC Reviewing" },
];

// Receipt: the two "Administrative Disapproval" pick-one blocks
const VP_RC_BLOCKS = [
  { key: "ii", title: "PURSUIT INITIATION - ADMINISTRATIVE DISAPPROVAL - OUT OF POLICY", form: "Pursuit Initiation - Out of Policy" },
  { key: "it", title: "INVOLVEMENT/PURSUIT TACTICS - ADMINISTRATIVE DISAPPROVAL", form: "Involvement / Pursuit Tactics - Disapproval" },
];
const VP_RC_ACTIONS = [
  { code: "ntc", label: "NOTICE TO CORRECT" },
  { code: "ft", label: "FORMAL TRAINING" },
  { code: "pc", label: "PERSONNEL COMPLAINT" },
];

const VP_FORM_NO = "01.14.00 (07/08/19)";
const VP_RC_FORM_NO = "01.14.03 (7/02/2019)";

// ── Page set ──────────────────────────────────────────────────────────────────
// Fixed pages are toggled by a pg_<key> checkbox in the strip; Additional Unit
// and Receipt pages exist (and print) for as long as they are in these lists.
const VP_FIXED_PAGES = [
  { key: "main", kind: "main", tab: "Pursuit Report", on: true },
  { key: "injuries", kind: "injuries", tab: "Injuries", on: true },
  ...VP_UNITS.filter((u) => u.review).map((u) => ({ key: u.key, kind: "review", tab: u.tab, unit: u, on: false })),
];

let vpAdditional = []; // instance numbers, e.g. [1, 3]
let vpReceipts = [];
let vpAddSeq = 0;
let vpRcSeq = 0;
let vpActiveTab = "main";

/** Unit descriptor for an Additional Unit instance. */
function vpAddUnit(n) {
  const no = vpVal(`ua${n}_no`);
  return {
    key: `ua${n}`,
    side: `ADDITIONAL UNIT #${no ? " " + no : ""}`,
    review: "ADDITIONAL UNIT IN PURSUIT",
    tab: `Add'l Unit${no ? " #" + no : " " + (vpAdditional.indexOf(n) + 1)}`,
    additional: n,
  };
}

/** Every page in document order, included or not. */
function vpAllPages() {
  const fixed = VP_FIXED_PAGES.map((p) => ({ ...p, included: vpChecked("pg_" + p.key) }));
  const review = fixed.filter((p) => p.kind === "review");
  const adds = vpAdditional.map((n) => {
    const unit = vpAddUnit(n);
    return { key: unit.key, kind: "review", tab: unit.tab, unit, included: true, dynamic: true };
  });
  const rcs = vpReceipts.map((n, i) => {
    const emp = vpVal(`rc${n}_emp`);
    return { key: `rc${n}`, kind: "receipt", tab: "Receipt" + (emp ? " - " + emp.split(",")[0] : " " + (i + 1)), n, included: true, dynamic: true };
  });
  return [...fixed.filter((p) => p.kind !== "review"), ...review, ...adds, ...rcs];
}

/** Included pages, with the VPR page numbering filled in. */
function vpIncludedPages() {
  const pages = vpAllPages().filter((p) => p.included);
  const vpr = pages.filter((p) => p.kind !== "receipt");
  vpr.forEach((p, i) => {
    p.no = i + 1;
    p.of = vpr.length;
  });
  return pages;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function vpRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function vpVal(id) {
  return vpRawVal(id).trim();
}

function vpChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function fmtDate(raw) {
  if (!raw) return "-";
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

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ── Form markup builders ──────────────────────────────────────────────────────
const fgText = (label, id, ph, type) =>
  `<div class="form-group"><label>${label}</label><input type="${type || "text"}" id="${id}"${ph ? ` placeholder="${escAttr(ph)}"` : ""} /></div>`;
const fgDate = (label, id) => fgText(label, id, "", "date");
const fgNum = (label, id, ph) => `<div class="form-group"><label>${label}</label><input type="number" min="0" id="${id}" placeholder="${ph}" /></div>`;
const fgYesNo = (label, id) =>
  `<div class="form-group"><label>${label}</label><select id="${id}"><option value=""></option><option>Yes</option><option>No</option></select></div>`;
const radioItem = (name, id, label) => `<label class="checkbox-item"><input type="radio" name="${name}" id="${id}" /> ${label}</label>`;
const checkItem = (id, label) => `<label class="checkbox-item"><input type="checkbox" id="${id}" /> ${label}</label>`;

/** Driver / passenger / shop / DICVS / vehicle type inputs for one unit. */
function crewFieldsHtml(u) {
  const roles = VP_ROLES.map(
    (r) => `
      <div class="three-col">
        ${fgText(`${r.label} (Last, First, M.I.)`, `${u}_${r.key}`, r.key === "drv" ? "Callahan, Michael R." : "Ortega, Sofia L.")}
        ${fgText("Serial No.", `${u}_${r.key}_serial`, r.key === "drv" ? "41286" : "43907")}
        ${fgText("Div./Detail", `${u}_${r.key}_div`, "Mission Row")}
      </div>`,
  ).join("");
  const types = VP_VEH_TYPES.map((t) => radioItem(`${u}_type`, `${u}_type_${t.code}`, t.label.replace("\n", " "))).join("");
  return `${roles}
      <div class="three-col">
        ${fgText("Shop No.", `${u}_shop`, "81142")}
        ${fgYesNo("In-Car Video Used?", `${u}_dicvs_used`)}
        ${fgYesNo("In-Car Video Viewed?", `${u}_dicvs_viewed`)}
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5">${types}</div>`;
}

function buildCrewBlocks() {
  const host = document.getElementById("crewContainer");
  if (!host) return;
  host.innerHTML = VP_UNITS.map((u) => `<div class="dynamic-row"><div class="row-title">${u.tab}</div>${crewFieldsHtml(u.key)}</div>`).join("");
}

function buildInjuryGrids() {
  const host = document.getElementById("injuryContainer");
  if (!host) return;
  host.innerHTML = VP_INJ_SETS.map((s) => {
    const head = `<div class="grid grid-cols-4 gap-3"><span></span>${VP_INJ_COLS.map((c) => `<span class="guma-sub-label mt-0">${c.form}</span>`).join("")}</div>`;
    const rows = VP_INJ_ROWS.map(
      (r) => `
        <div class="grid grid-cols-4 items-center gap-3">
          <span class="text-[13px] text-guma-l-text dark:text-guma-text">${r.label}</span>
          ${VP_INJ_COLS.map((c) => `<div class="form-group !mb-1.5"><input type="number" min="0" id="inj_${s.key}_${r.key}_${c.key}" placeholder="0" /></div>`).join("")}
        </div>`,
    ).join("");
    return `
      <div class="dynamic-row">
        <div class="row-title">${s.q}</div>
        <div class="mb-2 flex gap-4">${radioItem(`inj_${s.key}`, `inj_${s.key}_yes`, "Yes")}${radioItem(`inj_${s.key}`, `inj_${s.key}_no`, "No")}</div>
        ${head}${rows}
      </div>`;
  }).join("");
}

function buildChargeBlocks() {
  const host = document.getElementById("chargeContainer");
  if (!host) return;
  host.innerHTML = `<div class="two-col">${VP_CHARGES.map(
    (c) => `
      <div class="dynamic-row">
        <div class="row-title">${c.form}</div>
        <div class="mb-2 flex flex-wrap gap-x-4 gap-y-1.5">${VP_CHARGE_TYPES.map((t) => radioItem(c.key, `${c.key}_${t.code}`, t.label)).join("")}</div>
        <div class="two-col">
          ${fgText("Section", `${c.key}_section`, c.key === "reason" ? "2800.2" : "2800.4")}
          ${fgText("Code", `${c.key}_code`, "VC")}
        </div>
      </div>`,
  ).join("")}</div>`;
}

function buildDispositions() {
  const host = document.getElementById("dispositionContainer");
  if (!host) return;
  host.innerHTML = VP_DISPOSITIONS.map((d) => radioItem("disp", `disp_${d.code}`, `<b>${d.code.toUpperCase()}.</b> ${d.label}`)).join("");
}

function buildRelated() {
  const host = document.getElementById("relatedContainer");
  if (!host) return;
  host.innerHTML = `<div class="two-col">${VP_RELATED.map((r) => fgText(r.label, `rel_${r.key}`, r.ph)).join("")}</div>`;
}

function buildVitRows() {
  const host = document.getElementById("vitContainer");
  if (!host) return;
  const head = `<div class="grid grid-cols-[1fr_5.5rem_5.5rem] gap-3"><span></span><span class="guma-sub-label mt-0">PIT</span><span class="guma-sub-label mt-0">TDD</span></div>`;
  host.innerHTML =
    head +
    VP_VIT_ROWS.filter((r) => !r.wide)
      .map(
        (r) => `
        <div class="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-3">
          <span class="text-[13px] text-guma-l-text dark:text-guma-text">${r.form}</span>
          ${["pit", "tdd"].map((c) => `<div class="form-group !mb-1.5"><input type="text" id="vit_${r.key}_${c}" placeholder="${r.key === "stopped" || r.key === "training" ? "No" : "0"}" /></div>`).join("")}
        </div>`,
      )
      .join("");
}

function sigFieldsHtml(prefix, ph) {
  return `
    <div class="three-col">
      ${fgText("Name / Signature", `${prefix}_name`, ph || "Sgt. R. Whitaker")}
      ${fgText("Serial No.", `${prefix}_serial`, "31845")}
      ${fgDate("Date", `${prefix}_date`)}
    </div>`;
}

function buildSignBlocks() {
  const host = document.getElementById("signContainer");
  if (!host) return;
  host.innerHTML = VP_SIGNERS.map((s) => `<div class="dynamic-row"><div class="row-title">${s.form}</div>${sigFieldsHtml("sig_" + s.key)}</div>`).join("");
}

/** Radio list for one Area/Division classification column. */
function classListHtml(name, branches) {
  return branches
    .map(
      (b) => `
        <p class="guma-sub-label">${b.label.replace(/ - \(Select One\)| \(Select One\)/, "")}</p>
        <div class="checkbox-group mb-1 pl-1">${b.opts.map((o) => radioItem(name, `${name}_${b.code}_${o.code}`, o.label)).join("")}</div>`,
    )
    .join("");
}

/** Review tiers for one crew member of one unit. */
function reviewRoleHtml(u, r) {
  const tiers = VP_TIERS.map((t) => {
    const base = `${u}_${r.key}_${t.key}`;
    let body;
    if (t.kind === "full") {
      body = `
        <div class="two-col">
          <div><p class="guma-sub-label mt-0 text-guma-l-gold dark:text-guma-gold">Pursuit Initiation</p>${classListHtml(base + "i", VP_CLASS_INIT)}</div>
          <div><p class="guma-sub-label mt-0 text-guma-l-gold dark:text-guma-gold">Involvement / Tactics</p>${classListHtml(base + "t", VP_CLASS_TAC)}</div>
        </div>`;
    } else {
      const pair = (name) => `<div class="checkbox-group mb-2">${VP_CONCUR.map((c) => radioItem(name, `${name}_${c.code}`, c.code === "c" ? "Concur" : "Disagree")).join("")}</div>`;
      body = `
        <div class="two-col">
          <div><p class="guma-sub-label mt-0">Pursuit Initiation</p>${pair(base + "i")}</div>
          <div><p class="guma-sub-label mt-0">Involvement / Tactics</p>${pair(base + "t")}</div>
        </div>`;
    }
    return `<p class="guma-form-section mb-2 mt-3">${t.form}</p>${body}${sigFieldsHtml(`${u}_${r.key}_${t.sig}`, "Capt. D. Harlan")}`;
  }).join("");
  return `<div class="dynamic-row"><div class="row-title">${r.label} - Classification</div>${tiers}</div>`;
}

/** Form panel for a unit review page (fixed or additional). */
function reviewPanelHtml(unit) {
  let crew;
  if (unit.additional) {
    crew = `
      <div class="dynamic-row">
        <div class="row-title">Additional Unit Crew</div>
        <div class="two-col">${fgText("Additional Unit #", `${unit.key}_no`, "4")}</div>
        ${crewFieldsHtml(unit.key)}
      </div>`;
  } else {
    crew = `<p class="guma-tab-note">Driver, passenger, shop no. and vehicle type come from the ${unit.tab} block on
      <button type="button" data-vp-goto="main">Pursuit Report &rsaquo; Units</button>.</p>`;
  }
  return crew + VP_ROLES.map((r) => reviewRoleHtml(unit.key, r)).join("");
}

/** Form panel for one Pursuit Findings receipt. */
function receiptPanelHtml(n) {
  const p = `rc${n}`;
  const blocks = VP_RC_BLOCKS.map(
    (b) => `
      <div class="dynamic-row">
        <div class="row-title">${b.form}</div>
        <div class="checkbox-group mb-2">${VP_RC_ACTIONS.map((a) => radioItem(`${p}_${b.key}`, `${p}_${b.key}_${a.code}`, a.label.charAt(0) + a.label.slice(1).toLowerCase())).join("")}</div>
        <div class="two-col">
          ${fgDate("Date Served", `${p}_${b.key}_served`)}
          ${fgText("CF#", `${p}_${b.key}_cf`, "CF-26-0388")}
        </div>
        <div class="two-col">
          ${fgDate("Date Scheduled", `${p}_${b.key}_sched`)}
          ${fgDate("Date Completed", `${p}_${b.key}_done`)}
        </div>
      </div>`,
  ).join("");
  return `
    <p class="guma-form-section">Employee</p>
    <div class="form-group">
      <label>Fill from a unit crew member</label>
      <select data-vp-crew-pick="${n}"></select>
    </div>
    <div class="two-col">
      ${fgText("Employee (Last, First, Middle)", `${p}_emp`, "Callahan, Michael R.")}
      ${fgText("Serial No.", `${p}_serial`, "41286")}
    </div>
    <div class="two-col">
      ${fgText("Current Division", `${p}_cur_div`, "Mission Row")}
      ${fgText("Pursuit Case No.", `${p}_case_no`, "PC-26-0612")}
    </div>
    <div class="two-col">
      ${fgText("Division of Occurrence", `${p}_div_occ`, "Vespucci")}
      ${fgDate("Date of Occurrence", `${p}_date_occ`)}
    </div>

    <p class="guma-form-section mt-2">Final Review and Adjudication</p>
    <div class="checkbox-group mb-3">${checkItem(`${p}_attached`, "See attached rationale")}</div>
    <div class="form-group">
      <label>Initiation</label>
      <textarea id="${p}_rat_init" rows="3" maxlength="420" placeholder="Initiation was within policy - the suspect fled a felony traffic stop."></textarea>
    </div>
    <div class="form-group mb-5">
      <label>Involvement / Pursuit Tactics</label>
      <textarea id="${p}_rat_tac" rows="3" maxlength="420" placeholder="Officer exceeded the number of authorized units without approval."></textarea>
    </div>

    <p class="guma-form-section">Commanding Officer</p>
    <div class="checkbox-group mb-3">${checkItem(`${p}_discussed`, "Discussed findings with employee")}</div>
    ${blocks}
    <div class="two-col">
      ${fgText("Commanding Officer (Print Name)", `${p}_co_name`, "Capt. D. Harlan")}
      ${fgDate("Date", `${p}_co_date`)}
    </div>

    <p class="guma-form-section mt-2">Employee Acknowledgement</p>
    <div class="two-col">${fgDate("Date Signed by Employee", `${p}_emp_date`)}</div>

    <p class="guma-form-section mt-2">Pursuit Review Division</p>
    <div class="two-col">${fgDate("Date of Receipt", `${p}_prd_date`)}</div>
    <div class="form-group">
      <label>Comments</label>
      <textarea id="${p}_prd_comments" rows="2" maxlength="240" placeholder="Receipt reviewed and filed."></textarea>
    </div>`;
}

// ── Tabs + page strip ─────────────────────────────────────────────────────────
function vpPanel(key) {
  return document.querySelector(`[data-vp-panel="${key}"]`);
}

/** Append a panel for a page that has none yet, then wire it like the rest. */
function vpEnsurePanel(page) {
  if (vpPanel(page.key)) return;
  const sec = document.createElement("section");
  sec.dataset.vpPanel = page.key;
  sec.hidden = true;
  sec.innerHTML = page.kind === "receipt" ? receiptPanelHtml(page.n) : reviewPanelHtml(page.unit);
  document.getElementById("vpPanels").appendChild(sec);
  vpWirePanel(sec);
}

function vpWirePanel(root) {
  GumaFit.applyCaps(root, VP_MAXLEN);
  GumaRadio.makeClearable(root);
}

function renderTabs() {
  const host = document.getElementById("vpTabs");
  if (!host) return;
  const pages = vpAllPages();
  if (!pages.some((p) => p.key === vpActiveTab)) vpActiveTab = "main";
  host.innerHTML = pages
    .map(
      (p) =>
        `<button type="button" role="tab" class="guma-tab${p.key === vpActiveTab ? " active" : ""}${p.included ? "" : " is-off"}"
          aria-selected="${p.key === vpActiveTab}" data-vp-tab="${p.key}">${escAttr(p.tab)}</button>`,
    )
    .join("");
  document.querySelectorAll("[data-vp-panel]").forEach((sec) => (sec.hidden = sec.dataset.vpPanel !== vpActiveTab));
}

function showTab(key) {
  vpActiveTab = key;
  renderTabs();
  scrollToPage(key);
}

const VP_X_SVG = "✕";

function renderStrip() {
  const host = document.getElementById("vpPages");
  if (!host) return;
  // Fixed toggles keep their DOM node (and checked state) across rebuilds.
  let fixed = host.querySelector("[data-vp-fixed]");
  if (!fixed) {
    fixed = document.createElement("div");
    fixed.dataset.vpFixed = "";
    fixed.className = "contents";
    fixed.innerHTML = VP_FIXED_PAGES.map(
      (p) => `<label class="guma-page-pill" title="Include this page"><input type="checkbox" id="pg_${p.key}"${p.on ? " checked" : ""} /> ${p.tab}</label>`,
    ).join("");
    host.appendChild(fixed);
  }
  host.querySelectorAll("[data-vp-dyn]").forEach((el) => el.remove());

  const dyn = document.createElement("div");
  dyn.dataset.vpDyn = "";
  dyn.className = "contents";
  const pages = vpAllPages().filter((p) => p.dynamic);
  dyn.innerHTML =
    pages
      .map(
        (p) =>
          `<span class="guma-page-pill is-on">${escAttr(p.tab)}<button type="button" class="guma-page-pill-rm" data-vp-remove="${p.key}" title="Remove this page" aria-label="Remove ${escAttr(p.tab)}">${VP_X_SVG}</button></span>`,
      )
      .join("") +
    `<button type="button" class="guma-page-add" data-vp-add-unit>+ Additional Unit</button>` +
    `<select class="guma-page-add" data-vp-add-receipt aria-label="Add a Pursuit Findings receipt"></select>`;
  host.appendChild(dyn);
  fillCrewSelect(dyn.querySelector("[data-vp-add-receipt]"), "+ Findings Receipt", true);
}

// ── Crew directory (receipt pre-fill) ─────────────────────────────────────────
function vpCrew() {
  const units = [...VP_UNITS, ...vpAdditional.map(vpAddUnit)];
  const out = [];
  units.forEach((u) =>
    VP_ROLES.forEach((r) => {
      const name = vpVal(`${u.key}_${r.key}`);
      if (!name) return;
      const unitName = u.additional ? u.tab.replace("Add'l", "Additional") : u.tab;
      out.push({
        id: `${u.key}_${r.key}`,
        label: `${name} (${unitName} ${r.label.toLowerCase()})`,
        name,
        serial: vpVal(`${u.key}_${r.key}_serial`),
        div: vpVal(`${u.key}_${r.key}_div`),
      });
    }),
  );
  return out;
}

/** Options of a crew picker: placeholder, optional "blank", then the crew. */
function fillCrewSelect(sel, placeholder, withBlank) {
  if (!sel) return;
  const crew = vpCrew();
  sel.innerHTML =
    `<option value="" selected disabled hidden>${placeholder}</option>` +
    (withBlank ? `<option value="__blank">Blank receipt</option>` : "") +
    crew.map((c) => `<option value="${c.id}">${escAttr(c.label)}</option>`).join("");
  sel.value = "";
}

function fillReceiptFromCrew(n, crewId) {
  const c = vpCrew().find((x) => x.id === crewId);
  if (!c) return;
  const set = (k, v) => {
    const el = document.getElementById(`rc${n}_${k}`);
    if (el) el.value = v;
  };
  set("emp", c.name);
  set("serial", c.serial);
  set("cur_div", c.div);
}

// ── Adding / removing pages ───────────────────────────────────────────────────
function addAdditionalUnit(n) {
  n = n || ++vpAddSeq;
  vpAddSeq = Math.max(vpAddSeq, n);
  vpAdditional.push(n);
  vpEnsurePanel({ key: `ua${n}`, kind: "review", unit: vpAddUnit(n) });
  return `ua${n}`;
}

function addReceipt(n) {
  n = n || ++vpRcSeq;
  vpRcSeq = Math.max(vpRcSeq, n);
  vpReceipts.push(n);
  vpEnsurePanel({ key: `rc${n}`, kind: "receipt", n });
  return `rc${n}`;
}

/** Fresh receipt: case no. and date of occurrence carried over from page 1. */
function addReceiptFor(crewId) {
  const key = addReceipt();
  const n = vpReceipts[vpReceipts.length - 1];
  if (crewId && crewId !== "__blank") fillReceiptFromCrew(n, crewId);
  const dr = vpVal("dr_no");
  const init = vpRawVal("init_dt");
  if (dr) document.getElementById(`rc${n}_case_no`).value = dr;
  if (init) document.getElementById(`rc${n}_date_occ`).value = init.split("T")[0];
  return key;
}

function removePage(key) {
  window.GumaCanvasEdit?.cancelEdit();
  vpPanel(key)?.remove();
  if (key.startsWith("ua")) vpAdditional = vpAdditional.filter((n) => `ua${n}` !== key);
  if (key.startsWith("rc")) vpReceipts = vpReceipts.filter((n) => `rc${n}` !== key);
  if (vpActiveTab === key) vpActiveTab = "main";
  if (!vpAllPages().some((p) => p.included)) document.getElementById("pg_main").checked = true;
  refreshAll();
}

function afterAdd(key) {
  vpActiveTab = key;
  refreshAll();
  scrollToPage(key);
}

// ── Input length caps ─────────────────────────────────────────────────────────
// Keyed by page-level id or by field suffix (longest suffix wins). Each figure
// is what the narrowest cell printing the field carries before the shrink
// floor; values still shrink-to-fit below that.
const VP_MAXLEN = {
  agency_name: 52,
  dr_no: 20,
  incident_no: 20,
  avg_speed: 8,
  day_of_week: 10,
  loc_init: 44,
  loc_term: 44,
  city_init: 22,
  city_term: 22,
  rd_init: 12,
  rd_term: 12,
  air_desig: 34,
  sv_year: 6,
  sv_make: 20,
  sv_model: 28,
  sv_plate: 14,
  sv_state: 12,
  disp_other: 32,
  vit_synopsis: 16,
  debrief_name: 30,
  pas_arrested_total: 4,
  // row suffixes
  drv: 34,
  pas: 34,
  serial: 10,
  div: 16,
  shop: 14,
  no: 4,
  section: 12,
  code: 12,
  name: 30,
  emp: 40,
  cur_div: 30,
  case_no: 20,
  div_occ: 34,
  cf: 12,
  co_name: 44,
  // related reports + VIT cells
  rel_booking: 30,
  rel_employee: 30,
  rel_incident: 30,
  rel_property: 30,
  rel_collision: 30,
  rel_uof: 30,
  rel_vehicle: 30,
  rel_investigative: 30,
  pit: 6,
  tdd: 6,
};

// ── Canvas layout constants (logical pixels - rendered xSCALE) ───────────────
const DOC_W = 612;
const PAGE_H = 792; // US Letter at 72 dpi
const MARGIN = 22;
const BODY_W = DOC_W - MARGIN * 2;
const X1 = MARGIN + BODY_W;
const LINE_W = 0.6;
const CELL_BG = "#fff";
const BAR_BG = "#d4d4d4";
const PAGE_GAP = 12;
const GAP_BG = "#c9ccd1";

const VAL_PX = 8;
const VAL_MIN_PX = 4.5;
const SIG_PX = 10;
const LABEL_PX = 5.8;
const BOX = 6.5; // tick box size

const sigFont = (px) => `italic ${px}px "Times New Roman", Times, serif`;
const arial = (px, bold) => `${bold ? "bold " : ""}${px}px Arial`;

// ── Hitbox registration (gated off during the measuring pass) ───────────────
let REG = true;
function regField(ref, x, y, w, h, opts) {
  if (REG) window.GumaCanvasEdit?.field(ref, x, y, w, h, opts);
}

// ── Primitives ────────────────────────────────────────────────────────────────
function box(ctx, x, y, w, h, bg, lw) {
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = "#000";
  ctx.lineWidth = lw || LINE_W;
  ctx.strokeRect(x, y, w, h);
}

function hline(ctx, x, y, w, lw) {
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, lw || 0.5);
}

/** Plain text; "\n" splits lines. Returns the baseline of the last line. */
function text(ctx, str, x, y, px, opts = {}) {
  ctx.fillStyle = opts.color || "#000";
  ctx.font = arial(px, opts.bold);
  ctx.textAlign = opts.align || "left";
  const lh = opts.lh || px + 1.4;
  const lines = String(str).split("\n");
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
  ctx.textAlign = "left";
  return y + (lines.length - 1) * lh;
}

/** Text width at a size, for laying out inline runs. */
function textW(ctx, str, px, bold) {
  ctx.font = arial(px, bold);
  return ctx.measureText(str).width;
}

/** Printed value of a field: formatted, "-" when empty. */
function shownVal(ref, kind) {
  const raw = vpRawVal(ref);
  if (kind === "date") return fmtDate(raw);
  if (kind === "datetime") return fmtDatetime(raw);
  return raw.trim() || "-";
}

/**
 * One value painted at a baseline, shrunk to fit maxW, registered for editing.
 * opts: kind, align ("left" | "center"), font builder, px, label, hit (box
 * override {x, y, w, h}).
 */
function value(ctx, ref, x, base, maxW, opts = {}) {
  const shown = shownVal(ref, opts.kind);
  ctx.fillStyle = "#000";
  GumaFit.fitFont(ctx, shown, maxW, opts.px || VAL_PX, VAL_MIN_PX, opts.font || ((px) => arial(px)));
  ctx.textAlign = opts.align || "left";
  ctx.fillText(shown, opts.align === "center" ? x + maxW / 2 : x, base);
  ctx.textAlign = "left";
  const hit = opts.hit || { x: x - 2, y: base - 10, w: maxW + 4, h: 13 };
  regField(ref, hit.x, hit.y, hit.w, hit.h, { kind: opts.kind, label: opts.label, align: opts.align });
}

/** Value on a short underline (the paper form's "____" blanks). */
function blank(ctx, ref, x, base, w, opts = {}) {
  hline(ctx, x, base + 2, w);
  value(ctx, ref, x + 1.5, base, w - 3, { align: "center", ...opts });
}

/** Labelled table cell: small label top-left, value along the bottom. */
function cell(ctx, x, y, w, h, label, ref, opts = {}) {
  box(ctx, x, y, w, h, CELL_BG);
  if (label) text(ctx, label, x + 2.5, y + 7, opts.labelPx || LABEL_PX, { bold: opts.labelBold, color: "#222" });
  if (ref) value(ctx, ref, x + 3, y + h - 4.5, w - 6, { ...opts, label: opts.editLabel || label.replace(/\n/g, " "), hit: { x, y, w, h } });
}

/** Lay a row of { label, ref, w, ... } cells across a width. */
function cellRow(ctx, spec, x0, y, totalW, h) {
  const widths = spec.map((s) => Math.round(totalW * s.w));
  widths[widths.length - 1] += totalW - widths.reduce((a, b) => a + b, 0);
  let x = x0;
  spec.forEach((s, i) => {
    cell(ctx, x, y, widths[i], h, s.label, s.ref, s);
    x += widths[i];
  });
  return y + h;
}

function tick(ctx, x, y, checked, size) {
  const s = size || BOX;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, s, s);
  if (!checked) return;
  ctx.fillStyle = "#000";
  ctx.font = arial(s + 1, true);
  ctx.textAlign = "center";
  ctx.fillText("X", x + s / 2, y + s - 0.5);
  ctx.textAlign = "left";
}

/**
 * Tick box + label at a baseline, registered as a check field. `checked`
 * overrides the input state (derived parent boxes pass it with no id).
 * Returns the x right after the label.
 */
function checkOpt(ctx, id, label, x, base, px, opts = {}) {
  const p = px || 6.5;
  const on = opts.checked != null ? opts.checked : vpChecked(id);
  tick(ctx, x, base - BOX + 0.5, on, opts.size);
  const lines = String(label).split("\n");
  const lx = x + (opts.size || BOX) + 3;
  const ly = lines.length > 1 ? base - (lines.length - 1) * (p + 1) * 0.5 - 1 : base;
  text(ctx, label, lx, ly, p, { bold: opts.bold, lh: p + 1 });
  const w = Math.max(...lines.map((l) => textW(ctx, l, p, opts.bold)));
  const hitW = opts.hitW || w + (opts.size || BOX) + 7;
  if (id) regField(id, x - 2, base - 9, hitW, 12, { kind: "check", label: opts.editLabel || label.replace(/\n/g, " ") });
  return lx + w;
}

/** Vertical label up a side bar, centered in the bar. */
function sideText(ctx, str, x, y, w, h, px) {
  ctx.save();
  ctx.translate(x + w / 2 + px * 0.36, y + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#000";
  ctx.font = arial(px, true);
  ctx.textAlign = "center";
  GumaFit.fitFont(ctx, str, h - 6, px, 4.5, (p) => arial(p, true));
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

/** Grey bar with a bold centered caption (receipt section heads). */
function bar(ctx, x, y, w, h, caption) {
  box(ctx, x, y, w, h, BAR_BG, 0.9);
  text(ctx, caption, x + w / 2, y + h - 4, 7.5, { bold: true, align: "center" });
}

/** Wrapped multi-line value inside a box, shrinking until it fits. */
function multiline(ctx, ref, x, y, w, h, label) {
  const raw = vpRawVal(ref).trim();
  ctx.fillStyle = "#000";
  if (!raw) {
    ctx.font = arial(VAL_PX);
    ctx.fillText("-", x + 2, y + VAL_PX + 2);
  } else {
    let px = 7.5;
    let lines = [];
    for (;;) {
      ctx.font = arial(px);
      lines = [];
      raw.split("\n").forEach((par) => GumaFit.wrapLines(ctx, par, w - 4, 999).forEach((l) => lines.push(l)));
      if (lines.length * (px + 1.6) <= h - 2 || px <= 4.5) break;
      px -= 0.5;
    }
    const lh = px + 1.6;
    const max = Math.max(1, Math.floor((h - 2) / lh));
    lines.slice(0, max).forEach((l, i) => ctx.fillText(l, x + 2, y + px + 1 + i * lh));
  }
  regField(ref, x, y, w, h, { kind: "multiline", label, fontPx: 7.5 });
}

/** "Page _1_ of _3_" with the numbers on short rules. */
function pageMark(ctx, page, x, base) {
  let cx = x;
  const seg = (s) => {
    text(ctx, s, cx, base, 7);
    cx += textW(ctx, s, 7) + 3;
  };
  const num = (n, w) => {
    hline(ctx, cx, base + 1.5, w);
    text(ctx, n == null ? "" : String(n), cx + w / 2, base, 7, { align: "center" });
    cx += w + 3;
  };
  seg("Page");
  num(page.no, 18);
  seg("of");
  num(page.of, 18);
}

/** "DR NO.: ________" in the top-right corner of pages 2+. */
function drMark(ctx, base) {
  const w = 120;
  const lx = X1 - w - textW(ctx, "DR NO.:", 7.5, true) - 4;
  text(ctx, "DR NO.:", lx, base, 7.5, { bold: true });
  blank(ctx, "dr_no", X1 - w, base, w, { label: "DR No." });
}

function formNo(ctx, oy, str) {
  text(ctx, str, MARGIN, oy + PAGE_H - 12, 6);
}

// ── Page 1: Vehicle Pursuit Report ───────────────────────────────────────────
const P1 = {
  HDR_H: 58,
  RB_W: 120, // DR / incident box column
  A_STRIP: 14,
  A_H: 70,
  BC_LEFT_W: 306,
  B_H: 48,
  C_H: 50,
  DEF_LEFT_W: 378,
  D_H: 42,
  E_H: 42,
  UNIT_ROW: [40, 40, 40, 34],
  UNIT_SIDE: 18,
  SV_H: 44,
};

function drawPage1(ctx, oy, page) {
  let y = oy + MARGIN;
  const leftW = BODY_W - P1.RB_W;
  const rbX = X1 - P1.RB_W;

  // Header: agency + title centred over the left column, page mark under.
  const cx = MARGIN + leftW / 2;
  text(ctx, agencyName(), cx, y + 13, 9, { bold: true, align: "center" });
  const agencyW = Math.max(150, textW(ctx, agencyName(), 9, true) + 10);
  regField("agency_name", cx - agencyW / 2, y + 3, agencyW, 13, { label: "Agency Name", align: "center", fontPx: 9, transform: "upper" });
  text(ctx, "VEHICLE PURSUIT REPORT", cx, y + 33, 14, { bold: true, align: "center" });
  pageMark(ctx, page, MARGIN, y + 50);

  // DR NO. box
  box(ctx, rbX, y, P1.RB_W, P1.HDR_H, CELL_BG, 1);
  text(ctx, "DR NO.:", rbX + 5, y + 12, 8.5, { bold: true });
  text(ctx, "(Required on all pursuits)", rbX + 5, y + 21, 5.6);
  value(ctx, "dr_no", rbX + 5, y + P1.HDR_H - 9, P1.RB_W - 10, { label: "DR No.", hit: { x: rbX, y, w: P1.RB_W, h: P1.HDR_H } });
  y += P1.HDR_H;

  // Row A: duration | speed | use of force, incident no. on the right
  const aH = P1.A_STRIP + P1.A_H;
  const groups = [
    { title: "DURATION OF PURSUIT", w: 136 },
    { title: "SPEED OF PURSUIT", w: 178 },
    { title: "USE OF FORCE", w: leftW - 136 - 178 },
  ];
  let gx = MARGIN;
  groups.forEach((g) => {
    box(ctx, gx, y, g.w, P1.A_STRIP, CELL_BG);
    text(ctx, g.title, gx + g.w / 2, y + 10.5, 8, { bold: true, align: "center" });
    g.x = gx;
    gx += g.w;
  });
  const ay = y + P1.A_STRIP;
  const unitCell = (x, w, label, ref, suffix) => {
    box(ctx, x, ay, w, P1.A_H, CELL_BG);
    text(ctx, label, x + w / 2, ay + 11, 6.5, { align: "center", lh: 8 });
    const sw = textW(ctx, suffix, 6.5) + 4;
    const base = ay + P1.A_H - 9;
    text(ctx, suffix, x + w - sw - 2, base, 6.5);
    blank(ctx, ref, x + 8, base, w - sw - 14, { label: label.replace(/\n/g, " ") });
  };
  unitCell(groups[0].x, 68, "Estimated\nMinutes", "dur_min", "Min.");
  unitCell(groups[0].x + 68, 68, "Estimated\nMiles", "dur_miles", "Miles");
  unitCell(groups[1].x, 89, "Estimated Officer's\nHighest Speed:", "spd_officer", "MPH");
  unitCell(groups[1].x + 89, 89, "Estimated Suspect's\nHighest Speed:", "spd_suspect", "MPH");

  const uof = groups[2];
  box(ctx, uof.x, ay, uof.w, P1.A_H, CELL_BG);
  [
    { label: "Categorical", name: "uof_cat", ty: ay + 13 },
    { label: "Non-Categorical", name: "uof_noncat", ty: ay + 43 },
  ].forEach((r) => {
    text(ctx, r.label, uof.x + uof.w / 2, r.ty, 6.5, { align: "center" });
    checkOpt(ctx, `${r.name}_yes`, "Yes", uof.x + 14, r.ty + 14, 6.5, { editLabel: `${r.label} Yes` });
    checkOpt(ctx, `${r.name}_no`, "No", uof.x + uof.w / 2 + 14, r.ty + 14, 6.5, { editLabel: `${r.label} No` });
  });

  // Incident no. box
  box(ctx, rbX, y, P1.RB_W, aH, CELL_BG, 1);
  text(ctx, "INCIDENT NO.", rbX + 5, y + 14, 8.5, { bold: true });
  text(ctx, "(Attach printout)", rbX + 5, y + 23, 5.6);
  value(ctx, "incident_no", rbX + 5, y + aH - 10, P1.RB_W - 10, { label: "Incident No.", hit: { x: rbX, y, w: P1.RB_W, h: aH } });
  y += aH;

  // Row B/C: average speed + date/time row | collisions box
  const lW = P1.BC_LEFT_W;
  const rW = BODY_W - lW;
  box(ctx, MARGIN, y, lW, P1.B_H, CELL_BG);
  text(ctx, "PURSUIT AVERAGE SPEED", MARGIN + 5, y + 20, 8.5, { bold: true });
  text(ctx, "(Miles/Minutes X 60 = Average Speed)", MARGIN + 5, y + 31, 5.6);
  blank(ctx, "avg_speed", MARGIN + 150, y + 20, 60, { label: "Average Speed" });
  text(ctx, "MPH", MARGIN + 214, y + 20, 6.5);

  const cy = y + P1.B_H;
  cellRow(
    ctx,
    [
      { label: "Date and Time Pursuit\nInitiated:", ref: "init_dt", w: 0.38, kind: "datetime", labelPx: 6.2 },
      { label: "Day of\nWeek:", ref: "day_of_week", w: 0.24, labelPx: 6.2 },
      { label: "Date and Time Pursuit\nTerminated:", ref: "term_dt", w: 0.38, kind: "datetime", labelPx: 6.2 },
    ],
    MARGIN,
    cy,
    lW,
    P1.C_H,
  );

  const rx = MARGIN + lW;
  box(ctx, rx, y, rW, P1.B_H + P1.C_H, CELL_BG);
  text(ctx, "Number of Traffic Collisions?", rx + 5, y + 18, 6.8);
  blank(ctx, "coll_count", rx + 118, y + 18, 30, { label: "Number of Traffic Collisions" });
  text(ctx, "(If any, attach a copy of report.)", rx + 5, y + 29, 5.6);
  text(ctx, "Total Number of people involved in collision(s):", rx + 5, y + P1.B_H + 12, 6.8);
  const cols = [
    { label: "Officer(s)", ref: "coll_off" },
    { label: "Suspect(s)", ref: "coll_susp" },
    { label: "3rd Parties", ref: "coll_third" },
  ];
  let ccx = rx + 5;
  cols.forEach((c) => {
    text(ctx, c.label, ccx, y + P1.B_H + P1.C_H - 14, 6.8);
    const lw = textW(ctx, c.label, 6.8) + 4;
    blank(ctx, c.ref, ccx + lw, y + P1.B_H + P1.C_H - 14, 30, { label: "Collision " + c.label });
    ccx += lw + 46;
  });
  y += P1.B_H + P1.C_H;

  // Row D/E/F: VIT + locations | air unit box
  const dW = P1.DEF_LEFT_W;
  const airW = BODY_W - dW;
  box(ctx, MARGIN, y, dW, P1.D_H, CELL_BG);
  text(ctx, "Vehicle Intervention Technique (VIT) Utilized:", MARGIN + 5, y + 14, 6.8);
  let vx = checkOpt(ctx, "vit_pit_used", "Pursuit Intervention Technique (PIT)", MARGIN + 6, y + 32, 6.5) + 12;
  vx = checkOpt(ctx, "vit_tdd_used", "Tire Deflation Device (TDD)", vx, y + 32, 6.5) + 12;
  checkOpt(ctx, "vit_none", "None", vx, y + 32, 6.5);

  const locSpec = (kind, label) => [
    { label: `Location Pursuit ${label}`, ref: `loc_${kind}`, w: 0.56, labelPx: 6.2 },
    { label: "City", ref: `city_${kind}`, w: 0.26, labelPx: 6.2 },
    { label: "RD:", ref: `rd_${kind}`, w: 0.18, labelPx: 6.2 },
  ];
  let ly = cellRow(ctx, locSpec("init", "Initiated"), MARGIN, y + P1.D_H, dW, P1.E_H);
  cellRow(ctx, locSpec("term", "Terminated"), MARGIN, ly, dW, P1.E_H);

  const ax = MARGIN + dW;
  const airH = P1.D_H + P1.E_H * 2;
  box(ctx, ax, y, airW, airH, CELL_BG);
  text(ctx, "Air Unit Involved?", ax + 5, y + 16, 6.8);
  checkOpt(ctx, "air_yes", "Yes", ax + 88, y + 16, 6.5, { editLabel: "Air Unit Yes" });
  checkOpt(ctx, "air_no", "No", ax + 130, y + 16, 6.5, { editLabel: "Air Unit No" });
  text(ctx, "If yes, Unit's Designation:", ax + 5, y + 36, 6.8);
  blank(ctx, "air_desig", ax + 6, y + 58, airW - 14, { label: "Air Unit Designation" });
  text(ctx, "Time of Arrival", ax + 5, y + 88, 6.8);
  blank(ctx, "air_arrival", ax + 70, y + 88, 50, { kind: "time", label: "Time of Arrival" });
  text(ctx, "Tracking Mode Initiated?", ax + 5, y + airH - 14, 6.8);
  checkOpt(ctx, "track_yes", "Yes", ax + 100, y + airH - 14, 6.5, { editLabel: "Tracking Yes" });
  checkOpt(ctx, "track_no", "No", ax + 140, y + airH - 14, 6.5, { editLabel: "Tracking No" });
  y += airH;

  // Unit crew blocks, 2 x 2
  const blockW = BODY_W / 2;
  const blockH = P1.UNIT_ROW.reduce((a, b) => a + b, 0);
  VP_UNITS.forEach((u, i) => {
    const bx = MARGIN + (i % 2) * blockW;
    const by = y + Math.floor(i / 2) * blockH;
    drawCrewBlock(ctx, u, bx, by, blockW);
  });
  y += blockH * 2;

  // Suspect's vehicle
  box(ctx, MARGIN, y, BODY_W * 0.2, P1.SV_H, CELL_BG);
  text(ctx, "SUSPECT'S VEHICLE", MARGIN + 6, y + P1.SV_H / 2 + 3, 8, { bold: true });
  cellRow(
    ctx,
    [
      { label: "Year", ref: "sv_year", w: 0.1, labelPx: 6.2 },
      { label: "Make", ref: "sv_make", w: 0.2, labelPx: 6.2 },
      { label: "Model", ref: "sv_model", w: 0.3, labelPx: 6.2 },
      { label: "License No.", ref: "sv_plate", w: 0.24, labelPx: 6.2 },
      { label: "State", ref: "sv_state", w: 0.16, labelPx: 6.2 },
    ],
    MARGIN + BODY_W * 0.2,
    y,
    BODY_W * 0.8,
    P1.SV_H,
  );
  y += P1.SV_H;
  return y - oy;
}

/** One page-1 crew block: side bar, driver / passenger / shop / vehicle type. */
function drawCrewBlock(ctx, u, x, y, w) {
  const side = P1.UNIT_SIDE;
  const [rDrv, rPas, rShop, rType] = P1.UNIT_ROW;
  const h = rDrv + rPas + rShop + rType;
  box(ctx, x, y, side, h, CELL_BG);
  sideText(ctx, u.side, x, y, side, h, 8.5);
  const ix = x + side;
  const iw = w - side;
  VP_ROLES.forEach((r, i) => {
    cellRow(
      ctx,
      [
        { label: `${r.label} (Last Name, First, M.I.)`, ref: `${u.key}_${r.key}`, w: 0.52, labelPx: 6 },
        { label: "Serial No.", ref: `${u.key}_${r.key}_serial`, w: 0.21, labelPx: 6 },
        { label: "Div./Detail", ref: `${u.key}_${r.key}_div`, w: 0.27, labelPx: 6 },
      ],
      ix,
      y + i * rDrv,
      iw,
      i === 0 ? rDrv : rPas,
    );
  });
  const sy = y + rDrv + rPas;
  const shopW = Math.round(iw * 0.3);
  cell(ctx, ix, sy, shopW, rShop, "Shop No.", `${u.key}_shop`, { labelPx: 6 });
  box(ctx, ix + shopW, sy, iw - shopW, rShop, CELL_BG);
  const vx = ix + shopW + 4;
  const valX = ix + iw - 34;
  text(ctx, "Digital In-Car Video System Used?", vx, sy + 16, 6.3);
  blank(ctx, `${u.key}_dicvs_used`, valX, sy + 16, 30, { kind: "select", label: "In-Car Video Used" });
  text(ctx, "Digital In-Car Video Viewed?", vx, sy + 33, 6.3);
  blank(ctx, `${u.key}_dicvs_viewed`, valX, sy + 33, 30, { kind: "select", label: "In-Car Video Viewed" });

  const ty = sy + rShop;
  box(ctx, ix, ty, iw, rType, CELL_BG);
  drawVehicleTypes(ctx, u.key, ix + 5, ty + rType / 2 + 3, iw - 6, 6.3);
}

/** The five vehicle type boxes spread over a width. */
function drawVehicleTypes(ctx, u, x, base, w, px) {
  const colW = w / VP_VEH_TYPES.length;
  VP_VEH_TYPES.forEach((t, i) => {
    checkOpt(ctx, `${u}_type_${t.code}`, t.label, x + i * colW, base, px, { editLabel: t.label.replace("\n", " ") });
  });
}

// ── Page 2: Injuries / disposition / related reports / VITs ─────────────────
function drawPage2(ctx, oy, page) {
  let y = oy + MARGIN;
  pageMark(ctx, page, MARGIN, y + 26);
  text(ctx, agencyName(), DOC_W / 2, y + 8, 8, { bold: true, align: "center" });
  regField("agency_name", DOC_W / 2 - 90, y - 1, 180, 11, { label: "Agency Name", align: "center", fontPx: 8, transform: "upper" });
  text(ctx, "VEHICLE PURSUIT REPORT", DOC_W / 2, y + 26, 13, { bold: true, align: "center" });
  drMark(ctx, y + 26);
  y += 34;

  // INJURIES heading
  box(ctx, MARGIN, y, BODY_W, 22, CELL_BG, 1);
  text(ctx, "INJURIES", DOC_W / 2, y + 10, 9, { bold: true, align: "center" });
  text(ctx, '(Document in the narrative section of the Arrest Report, Investigative Report, or Employee\'s Report, under "Injuries/Medical Treatment")', DOC_W / 2, y + 18.5, 5.6, {
    align: "center",
  });
  y += 22;

  const half = BODY_W / 2;
  VP_INJ_SETS.forEach((s, i) => drawInjuryGrid(ctx, s, MARGIN + i * half, y, half));
  y += 112;

  // Middle band: reason / booking + arrestee | disposition
  const midH = 206;
  const lx = MARGIN;
  const rx = MARGIN + half;
  const rbH = 136;
  box(ctx, lx, y, half, rbH, CELL_BG);
  VP_CHARGES.forEach((c, i) => {
    const cx = lx + 8 + i * (half / 2);
    text(ctx, c.title, cx, y + 13, 7.5, { bold: true });
    if (c.key === "reason") text(ctx, "(Articulate Probable Cause/Reasonable\nSuspicion in narrative.)", cx, y + 21, 5.2, { lh: 6 });
    VP_CHARGE_TYPES.forEach((t, j) => checkOpt(ctx, `${c.key}_${t.code}`, t.label, cx + 4, y + 46 + j * 14, 6.8, { editLabel: `${c.form} ${t.label}` }));
    text(ctx, "Complete for box checked above:", cx, y + 96, 6.3);
    text(ctx, "Section:", cx, y + 112, 6.5);
    blank(ctx, `${c.key}_section`, cx + 52, y + 112, 64, { label: `${c.form} Section` });
    text(ctx, "Code:", cx, y + 127, 6.5);
    blank(ctx, `${c.key}_code`, cx + 52, y + 127, 64, { label: `${c.form} Code` });
  });

  const arY = y + rbH;
  box(ctx, lx, arY, half, midH - rbH, CELL_BG);
  text(ctx, "ARRESTEE INFORMATION", lx + half / 2, arY + 13, 7.5, { bold: true, align: "center" });
  [
    { label: "Driver Arrested?", name: "drv_arrested", ty: arY + 30 },
    { label: "Passenger(s) Arrested?", name: "pas_arrested", ty: arY + 45 },
  ].forEach((r) => {
    text(ctx, r.label, lx + 10, r.ty, 6.5);
    checkOpt(ctx, `${r.name}_yes`, "Yes", lx + 140, r.ty, 6.5, { editLabel: `${r.label} Yes` });
    checkOpt(ctx, `${r.name}_no`, "No", lx + 200, r.ty, 6.5, { editLabel: `${r.label} No` });
  });
  text(ctx, "How many passengers arrested?", lx + 10, arY + 62, 6.5);
  text(ctx, "Total No.", lx + 140, arY + 62, 6.5);
  blank(ctx, "pas_arrested_total", lx + 175, arY + 62, 56, { label: "Passengers Arrested" });

  box(ctx, rx, y, half, midH, CELL_BG);
  text(ctx, "PURSUIT DISPOSITION", rx + half / 2, y + 13, 7.5, { bold: true, align: "center" });
  text(ctx, "Choose (one) of the following actions that best describes the event\nterminating the pursuit:", rx + 8, y + 23, 5.6, { lh: 7 });
  VP_DISPOSITIONS.forEach((d, i) => {
    const base = y + 46 + i * 11.3;
    const letter = `${d.code.toUpperCase()}.`;
    const tx = rx + 8 + BOX + 3;
    const labelX = tx + textW(ctx, letter, 6.3, true) + 2;
    const labelEnd = labelX + textW(ctx, d.label, 6.3);
    // The whole printed line toggles the box; "Other" stops short of its blank.
    checkOpt(ctx, `disp_${d.code}`, "", rx + 8, base, 6.3, { editLabel: `Disposition ${letter} ${d.label}`, hitW: labelEnd - rx - 4 });
    text(ctx, letter, tx, base, 6.3, { bold: true });
    text(ctx, d.label, labelX, base, 6.3);
    if (d.code === "n") blank(ctx, "disp_other", labelEnd + 4, base, rx + half - 8 - labelEnd - 4, { label: "Other (Explain)" });
  });
  y += midH;

  // Lower band: related reports + debrief | VIT table
  const relH = 200;
  const debH = 58;
  box(ctx, lx, y, half, relH, CELL_BG);
  text(ctx, "All related Reports & Booking/DR No(s). (list and attach)", lx + 4, y + 9, 5.8);
  VP_RELATED.forEach((r, i) => {
    const base = y + 26 + i * 16;
    text(ctx, r.label, lx + 8, base, 7.3);
    blank(ctx, `rel_${r.key}`, lx + 140, base, half - 150, { label: r.label });
  });
  const comY = y + 26 + VP_RELATED.length * 16;
  text(ctx, "Supervisor Comments:", lx + 8, comY, 7.3);
  multiline(ctx, "rel_comments", lx + 6, comY + 3, half - 14, relH - (comY - y) - 6, "Supervisor Comments");

  const dbY = y + relH;
  box(ctx, lx, dbY, half, debH, CELL_BG);
  text(ctx, "PURSUIT DEBRIEF", lx + half / 2, dbY + 12, 7.5, { bold: true, align: "center" });
  text(ctx, "Name of Supervisor conducting debrief:", lx + 6, dbY + 27, 6.3);
  blank(ctx, "debrief_name", lx + 128, dbY + 27, half - 136, { label: "Debrief Supervisor" });
  text(ctx, "Serial No.:", lx + 6, dbY + 42, 6.3);
  blank(ctx, "debrief_serial", lx + 42, dbY + 42, 70, { label: "Debrief Serial No." });
  text(ctx, "Date Completed:", lx + 124, dbY + 42, 6.3);
  blank(ctx, "debrief_date", lx + 180, dbY + 42, half - 188, { kind: "date", label: "Debrief Date" });
  text(ctx, "(If debrief not completed or completed on differing dates, explain in narrative.)", lx + 6, dbY + 53, 5.2);

  drawVitTable(ctx, rx, y, half, relH + debH);
  y += relH + debH;

  // Signatures
  const sigH = 54;
  const sw = BODY_W / VP_SIGNERS.length;
  VP_SIGNERS.forEach((s, i) => {
    const sx = MARGIN + i * sw;
    box(ctx, sx, y, sw, sigH, CELL_BG);
    text(ctx, s.label, sx + 4, y + 9, 6.2, { lh: 7 });
    text(ctx, "Serial No.", sx + sw * 0.5, y + 9, 6.2);
    text(ctx, "Date", sx + sw * 0.76, y + 9, 6.2);
    blank(ctx, `sig_${s.key}_name`, sx + 4, y + 30, sw * 0.46 - 4, { label: s.form + " Name" });
    blank(ctx, `sig_${s.key}_serial`, sx + sw * 0.5, y + 30, sw * 0.23, { label: s.form + " Serial No." });
    blank(ctx, `sig_${s.key}_date`, sx + sw * 0.76, y + 30, sw * 0.22, { kind: "date", label: s.form + " Date" });
    text(ctx, "Signature", sx + 4, y + 48, 7);
    const sx0 = sx + 4 + textW(ctx, "Signature", 7) + 4;
    hline(ctx, sx0, y + 49.5, sx + sw - 6 - sx0);
    value(ctx, `sig_${s.key}_name`, sx0 + 2, y + 47.5, sx + sw - 10 - sx0, { font: sigFont, px: SIG_PX, label: s.form + " Signature" });
  });
  y += sigH;
  return y - oy;
}

function drawInjuryGrid(ctx, s, x, y, w) {
  box(ctx, x, y, w, 112, CELL_BG);
  box(ctx, x, y, w, 16, CELL_BG);
  text(ctx, s.q, x + 5, y + 11, 6.8);
  const qEnd = x + 8 + textW(ctx, s.q, 6.8);
  checkOpt(ctx, `inj_${s.key}_yes`, "Yes", qEnd + 6, y + 11.5, 6.8, { editLabel: s.q + " Yes" });
  checkOpt(ctx, `inj_${s.key}_no`, "No", qEnd + 46, y + 11.5, 6.8, { editLabel: s.q + " No" });

  const labW = w * 0.34;
  const colW = (w - labW - 6) / VP_INJ_COLS.length;
  text(ctx, "Indicate number\nof injuries:", x + 5, y + 27, 7, { lh: 8.5 });
  VP_INJ_COLS.forEach((c, i) => text(ctx, c.label, x + labW + i * colW + colW / 2, y + 27, 7, { align: "center", lh: 8.5 }));
  VP_INJ_ROWS.forEach((r, ri) => {
    const base = y + 52 + ri * 16;
    text(ctx, r.label, x + 7, base, 7);
    VP_INJ_COLS.forEach((c, ci) => {
      blank(ctx, `inj_${s.key}_${r.key}_${c.key}`, x + labW + ci * colW + 3, base, colW - 6, { label: `${r.label} - ${c.form}` });
    });
  });
}

function drawVitTable(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, CELL_BG);
  const pitX = x + w - 86;
  const tddX = x + w - 44;
  const colW = 38;
  text(ctx, "PIT", pitX + colW / 2, y + 13, 7.5, { bold: true, align: "center" });
  hline(ctx, pitX + 10, y + 14.5, colW - 20);
  text(ctx, "TDD", tddX + colW / 2, y + 13, 7.5, { bold: true, align: "center" });
  hline(ctx, tddX + 9, y + 14.5, colW - 18);
  let ry = y + 18;
  VP_VIT_ROWS.forEach((r) => {
    const lines = r.label.split("\n").length;
    const rh = lines > 1 ? 20.4 : 15;
    text(ctx, r.label, x + 7, ry + 9, 6.2, { bold: true, lh: 7.2 });
    const base = ry + (lines > 1 ? 16 : 10);
    if (r.wide) {
      blank(ctx, `vit_${r.key}`, pitX, base, tddX + colW - pitX, { label: "VIT Property Damage" });
    } else {
      blank(ctx, `vit_${r.key}_pit`, pitX, base, colW, { label: `${r.form || r.key} - PIT` });
      blank(ctx, `vit_${r.key}_tdd`, tddX, base, colW, { label: `${r.form || r.key} - TDD` });
    }
    ry += rh;
  });
}

// ── Unit review page (Primary / Second / Third / Additional) ─────────────────
const RV = {
  SIDE: 18,
  TITLE_H: 12,
  FULL_H: 104,
  CONCUR_H: 46,
  SIG_H: 28,
  CREW_H: 26,
  OPT_STEP: 13.4,
};

function drawReviewPage(ctx, oy, page) {
  const u = page.unit;
  let y = oy + MARGIN;
  pageMark(ctx, page, MARGIN, y + 8);
  drMark(ctx, y + 8);
  y += 14;
  text(ctx, u.review, MARGIN, y + 12, 10, { bold: true });
  y += 18;

  // Crew table, two rows. Fixed units print the page-1 inputs.
  const k = u.key;
  cellRow(
    ctx,
    [
      { label: "Driver (Last Name, First)", ref: `${k}_drv`, w: 0.33, labelPx: 6.2 },
      { label: "Serial No.", ref: `${k}_drv_serial`, w: 0.1, labelPx: 6.2 },
      { label: "Div./Detail", ref: `${k}_drv_div`, w: 0.17, labelPx: 6.2 },
      { label: "Shop No.", ref: `${k}_shop`, w: 0.4, labelPx: 6.2 },
    ],
    MARGIN,
    y,
    BODY_W,
    RV.CREW_H,
  );
  y += RV.CREW_H;
  const typesX = MARGIN + Math.round(BODY_W * 0.6);
  cellRow(
    ctx,
    [
      { label: "Passenger (Last Name, First)", ref: `${k}_pas`, w: 0.55, labelPx: 6.2 },
      { label: "Serial No.", ref: `${k}_pas_serial`, w: 0.167, labelPx: 6.2 },
      { label: "Div./Detail", ref: `${k}_pas_div`, w: 0.283, labelPx: 6.2 },
    ],
    MARGIN,
    y,
    typesX - MARGIN,
    RV.CREW_H,
  );
  box(ctx, typesX, y, X1 - typesX, RV.CREW_H, CELL_BG);
  drawVehicleTypes(ctx, k, typesX + 6, y + RV.CREW_H / 2 + 3, X1 - typesX - 8, 6.3);
  y += RV.CREW_H + 4;

  VP_ROLES.forEach((r) => {
    y = drawReviewRole(ctx, u, r, y);
  });
  return y - oy;
}

function drawReviewRole(ctx, u, r, y0) {
  const roleH = VP_TIERS.reduce((a, t) => a + RV.TITLE_H + (t.kind === "full" ? RV.FULL_H : RV.CONCUR_H) + RV.SIG_H, 0);
  box(ctx, MARGIN, y0, BODY_W, roleH, CELL_BG, 1.1);
  box(ctx, MARGIN, y0, RV.SIDE, roleH, CELL_BG, 1.1);
  sideText(ctx, `${u.side} - ${r.side}`, MARGIN, y0, RV.SIDE, roleH, 7.5);

  const ix = MARGIN + RV.SIDE;
  const iw = BODY_W - RV.SIDE;
  const half = iw / 2;
  let y = y0;
  VP_TIERS.forEach((t) => {
    const base = `${u.key}_${r.key}_${t.key}`;
    text(ctx, t.title, ix + iw / 2, y + 9.5, 7, { bold: true, align: "center" });
    y += RV.TITLE_H;
    const bodyH = t.kind === "full" ? RV.FULL_H : RV.CONCUR_H;
    ctx.fillStyle = "#000";
    ctx.fillRect(ix + half, y + 1, 0.8, bodyH - 2);
    [
      { name: base + "i", label: "Pursuit\nInitiation", branches: VP_CLASS_INIT, x: ix },
      { name: base + "t", label: "Involvement/\nPursuit\nTactics", branches: VP_CLASS_TAC, x: ix + half },
    ].forEach((col) => {
      const lines = col.label.split("\n").length;
      text(ctx, col.label, col.x + (col.x === ix ? 10 : 8), y + bodyH / 2 - (lines - 1) * 4, 7, { bold: true, lh: 8 });
      const ox = col.x + 66;
      if (t.kind === "full") {
        let oyy = y + 10;
        col.branches.forEach((b) => {
          const any = b.opts.some((o) => vpChecked(`${col.name}_${b.code}_${o.code}`));
          checkOpt(ctx, null, b.label, ox, oyy, 5.8, { checked: any });
          oyy += RV.OPT_STEP;
          b.opts.forEach((o) => {
            checkOpt(ctx, `${col.name}_${b.code}_${o.code}`, o.label, ox + 16, oyy, 5.8, { editLabel: `${b.label.split(" - ")[0]} - ${o.label}` });
            oyy += RV.OPT_STEP;
          });
        });
      } else {
        VP_CONCUR.forEach((c, i) => {
          const by = y + 12 + i * 17;
          checkOpt(ctx, `${col.name}_${c.code}`, `${c.verb} ${t.against} Recommendations.`, ox, by, 5.8);
          if (c.note) text(ctx, c.note, ox + BOX + 3, by + 7, 5.2);
        });
      }
    });
    y += bodyH;

    // Signer line
    const sp = `${u.key}_${r.key}_${t.sig}`;
    hline(ctx, ix, y, iw, 0.7);
    text(ctx, `${t.signer} (Name/Signature)`, ix + 4, y + 9, 6.6, { bold: true });
    text(ctx, "Serial No.", ix + iw * 0.72, y + 9, 6.4);
    text(ctx, "Date", ix + iw * 0.87, y + 9, 6.4);
    value(ctx, `${sp}_name`, ix + 8, y + RV.SIG_H - 4, iw * 0.62, { font: sigFont, px: SIG_PX, label: t.signer, hit: { x: ix, y: y + 10, w: iw * 0.7, h: RV.SIG_H - 10 } });
    value(ctx, `${sp}_serial`, ix + iw * 0.72, y + RV.SIG_H - 4, iw * 0.13, { label: t.signer + " Serial No.", hit: { x: ix + iw * 0.71, y: y + 10, w: iw * 0.15, h: RV.SIG_H - 10 } });
    value(ctx, `${sp}_date`, ix + iw * 0.87, y + RV.SIG_H - 4, iw * 0.12, { kind: "date", label: t.signer + " Date", hit: { x: ix + iw * 0.86, y: y + 10, w: iw * 0.14, h: RV.SIG_H - 10 } });
    y += RV.SIG_H;
    if (t !== VP_TIERS[VP_TIERS.length - 1]) hline(ctx, ix, y, iw, 0.9);
  });
  return y;
}

// ── Pursuit Findings Internal Process Receipt ────────────────────────────────
function drawReceipt(ctx, oy, page) {
  const p = `rc${page.n}`;
  let y = oy + MARGIN;
  text(ctx, "PURSUIT FINDINGS", DOC_W / 2, y + 12, 12, { bold: true, align: "center" });
  text(ctx, "INTERNAL PROCESS RECEIPT", DOC_W / 2, y + 27, 12, { bold: true, align: "center" });
  y += 36;
  const top = y;

  // Employee / serial / division / case no.
  const L = 6.4;
  const empW = Math.round(BODY_W * 0.38);
  cell(ctx, MARGIN, y, empW, 60, "EMPLOYEE (LAST NAME, FIRST, MIDDLE):", `${p}_emp`, { labelBold: true, labelPx: L, editLabel: "Employee" });
  cellRow(
    ctx,
    [
      { label: "SERIAL NO.:", ref: `${p}_serial`, w: 0.16, labelBold: true, labelPx: L },
      { label: "CURRENT DIVISION:", ref: `${p}_cur_div`, w: 0.49, labelBold: true, labelPx: L },
      { label: "PURSUIT CASE NO.:", ref: `${p}_case_no`, w: 0.35, labelBold: true, labelPx: L },
    ],
    MARGIN + empW,
    y,
    BODY_W - empW,
    30,
  );
  cellRow(
    ctx,
    [
      { label: "DIVISION OF OCCURENCE", ref: `${p}_div_occ`, w: 0.5, labelBold: true, labelPx: L },
      { label: "DATE OF OCCURENCE:", ref: `${p}_date_occ`, w: 0.5, labelBold: true, labelPx: L, kind: "date" },
    ],
    MARGIN + empW,
    y + 30,
    BODY_W - empW,
    30,
  );
  y += 60;

  bar(ctx, MARGIN, y, BODY_W, 15, "FINAL REVIEW AND ADJUDICATION");
  y += 15;
  box(ctx, MARGIN, y, BODY_W, 17, CELL_BG);
  checkOpt(ctx, `${p}_attached`, "SEE ATTACHED RATIONALE (OR PROVIDE BRIEF DESCRIPTION OF RATIONALE BELOW).", MARGIN + 50, y + 12, 6.6, {
    bold: true,
    size: 8,
    editLabel: "See Attached Rationale",
  });
  y += 17;
  const ratH = 118;
  box(ctx, MARGIN, y, BODY_W, ratH, CELL_BG);
  text(ctx, "INITIATION", MARGIN + 4, y + 9, 6.6, { bold: true });
  multiline(ctx, `${p}_rat_init`, MARGIN + 4, y + 12, BODY_W - 8, 44, "Initiation");
  text(ctx, "INVOLVEMENT/PURSUIT TACTICS", MARGIN + 4, y + 69, 6.6, { bold: true });
  multiline(ctx, `${p}_rat_tac`, MARGIN + 4, y + 72, BODY_W - 8, 44, "Involvement / Pursuit Tactics");
  y += ratH;

  bar(ctx, MARGIN, y, BODY_W, 15, "COMMANDING OFFICER");
  y += 15;
  box(ctx, MARGIN, y, BODY_W, 32, CELL_BG);
  text(ctx, "(Check all that apply)", MARGIN + 4, y + 11, 6.8);
  checkOpt(ctx, `${p}_discussed`, "DISCUSSED FINDINGS WITH EMPLOYEE", MARGIN + 4, y + 26, 6.6, { size: 8, editLabel: "Discussed Findings" });
  y += 32;

  VP_RC_BLOCKS.forEach((b) => {
    const bh = 70;
    box(ctx, MARGIN, y, BODY_W, bh, CELL_BG);
    const tw = textW(ctx, b.title, 6.4);
    text(ctx, b.title, MARGIN + 30, y + 11, 6.4);
    text(ctx, "(Select One)", MARGIN + 34 + tw, y + 11, 6);
    VP_RC_ACTIONS.forEach((a, i) => checkOpt(ctx, `${p}_${b.key}_${a.code}`, a.label, MARGIN + 4, y + 28 + i * 17, 6.6, { size: 8, editLabel: `${b.form}: ${a.label}` }));
    const lx = MARGIN + BODY_W * 0.53;
    const vx = MARGIN + BODY_W * 0.8;
    text(ctx, "DATE SERVED", lx, y + 28, 6.6);
    blank(ctx, `${p}_${b.key}_served`, vx, y + 28, 60, { kind: "date", label: "Date Served" });
    text(ctx, "DATES SCHEDULED/COMPLETED:", lx, y + 45, 6.6);
    blank(ctx, `${p}_${b.key}_sched`, vx, y + 45, 46, { kind: "date", label: "Date Scheduled" });
    text(ctx, "/", vx + 50, y + 45, 7);
    blank(ctx, `${p}_${b.key}_done`, vx + 58, y + 45, 46, { kind: "date", label: "Date Completed" });
    text(ctx, "CF#", lx, y + 62, 6.6);
    blank(ctx, `${p}_${b.key}_cf`, vx, y + 62, 60, { label: "CF#" });
    y += bh;
  });

  // Commanding officer + employee signature rows
  const sigRow = (prefix, nameRef, dateRef, label) => {
    const w1 = Math.round(BODY_W * 0.43);
    const w2 = Math.round(BODY_W * 0.43);
    cell(ctx, MARGIN, y, w1, 30, `${prefix} (PRINT NAME):`, nameRef, { labelBold: true, labelPx: L, editLabel: label });
    box(ctx, MARGIN + w1, y, w2, 30, CELL_BG);
    text(ctx, prefix === "EMPLOYEE" ? "SIGNATURE: *" : "SIGNATURE:", MARGIN + w1 + 2.5, y + 7, L, { bold: true, color: "#222" });
    value(ctx, nameRef, MARGIN + w1 + 6, y + 25, w2 - 12, { font: sigFont, px: SIG_PX, label: label + " Signature", hit: { x: MARGIN + w1, y, w: w2, h: 30 } });
    cell(ctx, MARGIN + w1 + w2, y, BODY_W - w1 - w2, 30, "DATE:", dateRef, { labelBold: true, labelPx: L, kind: "date", editLabel: label + " Date" });
    y += 30;
  };
  sigRow("COMMANDING OFFICER", `${p}_co_name`, `${p}_co_date`, "Commanding Officer");
  bar(ctx, MARGIN, y, BODY_W, 15, "EMPLOYEE");
  y += 15;
  sigRow("EMPLOYEE", `${p}_emp`, `${p}_emp_date`, "Employee");
  bar(ctx, MARGIN, y, BODY_W, 15, "PURSUIT REVIEW DIVISION");
  y += 15;
  const prdH = 62;
  box(ctx, MARGIN, y, BODY_W, prdH, CELL_BG);
  text(ctx, "DATE OF RECEIPT:", MARGIN + 4, y + 13, 6.8);
  blank(ctx, `${p}_prd_date`, MARGIN + 92, y + 13, 90, { kind: "date", label: "Date of Receipt" });
  text(ctx, "COMMENTS:", MARGIN + 4, y + 29, 6.8);
  multiline(ctx, `${p}_prd_comments`, MARGIN + 50, y + 21, BODY_W - 56, prdH - 24, "Comments");
  y += prdH;
  box(ctx, MARGIN, top, BODY_W, y - top, null, 1.4);

  // Footnote + distribution
  y += 12;
  ctx.font = arial(6.3);
  const note =
    "* A request to appeal a finding of Administrative Disapproval shall be filed within 20 calendar days after the employee was served by the " +
    "employee's commanding officer.  The request shall be filed on an Administrative Appeal, Form 01.84.00, with the Advocate Section, Internal " +
    "Affairs Group.  The original signed receipt shall be sent to Pursuit Review Division.";
  GumaFit.wrapLines(ctx, note, BODY_W - 8, 9).forEach((ln, i) => text(ctx, ln, MARGIN + 4, y + i * 8, 6.3));
  y += 34;
  text(ctx, VP_RC_FORM_NO, MARGIN + 4, y + 10, 6);
  ["1 - Original, Pursuit Review Unit", "1 - Copy, Division", "1 - Copy, Employee"].forEach((ln, i) => text(ctx, ln, MARGIN + 220, y + i * 10, 6));
  y += 24;
  return y - oy;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
const VP_DRAW = { main: drawPage1, injuries: drawPage2, review: drawReviewPage, receipt: drawReceipt };

let vpPageBounds = []; // [{ key, y, h }] in logical px, gap excluded
let vpDocH = 0;
const measureCanvas = document.createElement("canvas");
measureCanvas.width = 1;
measureCanvas.height = 1;

function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });
  const pages = vpIncludedPages();

  // Measuring pass: same code path, nothing registers, nothing visible lands.
  REG = false;
  const mctx = measureCanvas.getContext("2d");
  const heights = pages.map((pg) => Math.max(PAGE_H, Math.ceil(VP_DRAW[pg.kind](mctx, 0, pg) + MARGIN + 14)));
  REG = true;

  vpPageBounds = [];
  let acc = 0;
  pages.forEach((pg, i) => {
    vpPageBounds.push({ key: pg.key, y: acc, h: heights[i] });
    acc += heights[i] + (i < pages.length - 1 ? PAGE_GAP : 0);
  });
  vpDocH = Math.max(acc, 1);

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = vpDocH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = GAP_BG;
  ctx.fillRect(0, 0, DOC_W, vpDocH);

  pages.forEach((pg, i) => {
    const b = vpPageBounds[i];
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, b.y, DOC_W, b.h);
    VP_DRAW[pg.kind](ctx, b.y, pg);
    if (pg.kind !== "receipt") formNo(ctx, b.y + b.h - PAGE_H, VP_FORM_NO);
  });

  window.GumaCanvasEdit?.end();
}

/** Bring a page into view inside the preview scroll box. */
function scrollToPage(key) {
  const b = vpPageBounds.find((x) => x.key === key);
  const wrap = document.getElementById("vpWrap");
  const canvas = document.getElementById("docCanvas");
  if (!b || !wrap || !canvas || !vpDocH) return;
  if (wrap.scrollHeight <= wrap.clientHeight) return;
  const k = canvas.clientHeight / vpDocH;
  wrap.scrollTo({ top: b.y * k, behavior: "smooth" });
}

// ── Per-page export ──────────────────────────────────────────────────────────
/** A fresh offscreen canvas holding just one sheet of the document. */
function vpPageCanvas(i) {
  const src = document.getElementById("docCanvas");
  const b = vpPageBounds[i];
  const c = document.createElement("canvas");
  c.width = DOC_W * SCALE;
  c.height = Math.round(b.h * SCALE);
  c.getContext("2d").drawImage(src, 0, Math.round(b.y * SCALE), c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

function vpPageLabel(i) {
  const pg = vpIncludedPages()[i];
  return `${i + 1}. ${pg ? pg.tab : "Page"}`;
}

// ── Preview & Download ────────────────────────────────────────────────────────
function refreshPreview() {
  drawForm();
}

/** Rebuild the page-dependent chrome (tabs, strip), then redraw. */
function refreshAll() {
  renderStrip();
  renderTabs();
  drawForm();
}

// A multi-sheet PNG pasted into Discord is unreadable, so each sheet ships on
// its own (the modal passes the visible page). History stores the full stack.
async function downloadPng(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && vpPageBounds[pageIndex];
  const a = document.createElement("a");
  a.download = perPage ? `vehicle-pursuit-report-page-${pageIndex + 1}.png` : "vehicle-pursuit-report.png";
  a.href = (perPage ? vpPageCanvas(pageIndex) : canvas).toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && vpPageBounds[pageIndex];
  if (!(await GumaClipboard.copyCanvas(perPage ? vpPageCanvas(pageIndex) : canvas))) return;

  const newCount = await window.GumaCounters?.trackDownload("pursuit");
  const countEl = document.getElementById("downloadCount");
  if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
  GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
}

// ── Auto-filled fields ────────────────────────────────────────────────────────
const VP_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Average speed = miles / minutes x 60, rounded to one decimal. */
function autoAvgSpeed() {
  const min = parseFloat(vpRawVal("dur_min"));
  const miles = parseFloat(vpRawVal("dur_miles"));
  if (!(min > 0) || !(miles >= 0)) return;
  const avg = Math.round((miles / min) * 600) / 10;
  document.getElementById("avg_speed").value = String(avg);
}

function autoDayOfWeek() {
  const d = vpRawVal("init_dt").split("T")[0];
  if (!d) return;
  const [yy, mm, dd] = d.split("-").map(Number);
  document.getElementById("day_of_week").value = VP_DAYS[new Date(yy, mm - 1, dd).getDay()];
}

// ── Init ─────────────────────────────────────────────────────────────────────
buildCrewBlocks();
buildInjuryGrids();
buildChargeBlocks();
buildDispositions();
buildRelated();
buildVitRows();
buildSignBlocks();
vpWirePanel(document.querySelector(".guma-panel-form"));
renderStrip();
VP_FIXED_PAGES.filter((p) => p.kind === "review").forEach((p) => vpEnsurePanel(p));
renderTabs();

// Auto-fills run before the generic redraw listener below, so the redraw
// already sees the new value.
const vpForm = document.querySelector(".guma-panel-form");
vpForm.addEventListener("input", (e) => {
  const id = e.target.id;
  if (id === "dur_min" || id === "dur_miles") autoAvgSpeed();
  if (id === "init_dt") autoDayOfWeek();
});
["input", "change"].forEach((type) =>
  vpForm.addEventListener(type, (e) => {
    // Names feed tab labels and the receipt crew picker; everything else
    // only needs the document redrawn.
    if (/_(drv|pas|emp|no)$/.test(e.target.id) && type === "change") refreshAll();
    else refreshPreview();
  }),
);

vpForm.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-vp-tab]");
  if (tab) showTab(tab.dataset.vpTab);
  const go = e.target.closest("[data-vp-goto]");
  if (go) showTab(go.dataset.vpGoto);
});
vpForm.addEventListener("change", (e) => {
  const pick = e.target.closest("[data-vp-crew-pick]");
  if (!pick) return;
  fillReceiptFromCrew(Number(pick.dataset.vpCrewPick), pick.value);
  refreshAll();
});
// The crew picker lists whoever is typed in right now.
vpForm.addEventListener("focusin", (e) => {
  const pick = e.target.closest("[data-vp-crew-pick]");
  if (pick) fillCrewSelect(pick, "Choose a crew member...", false);
});

const vpStrip = document.getElementById("vpPages");
vpStrip.addEventListener("change", (e) => {
  if (e.target.matches("[data-vp-add-receipt]")) {
    const crewId = e.target.value;
    if (crewId) afterAdd(addReceiptFor(crewId));
    return;
  }
  if (e.target.id && e.target.id.startsWith("pg_")) {
    // A document needs at least one sheet.
    if (!vpAllPages().some((p) => p.included)) e.target.checked = true;
    refreshAll();
  }
});
vpStrip.addEventListener("click", (e) => {
  if (e.target.closest("[data-vp-add-unit]")) afterAdd(addAdditionalUnit());
  const rm = e.target.closest("[data-vp-remove]");
  if (rm) removePage(rm.dataset.vpRemove);
});

drawForm();

// ── Saved reports: serialize / hydrate / wiring ───────────────
// The form is mostly generated from tables and grows with added pages, so the
// state is every id'd control under the form panel and the page strip.
function vpControls() {
  return document.querySelectorAll(".guma-panel-form input[id], .guma-panel-form select[id], .guma-panel-form textarea[id], #vpPages input[id]");
}

function vpSerializeState() {
  const values = {};
  vpControls().forEach((el) => {
    values[el.id] = el.type === "checkbox" || el.type === "radio" ? el.checked : el.value;
  });
  return { additional: vpAdditional.slice(), receipts: vpReceipts.slice(), values };
}

function vpHydrateState(payload) {
  if (!payload) return;
  window.GumaCanvasEdit?.cancelEdit();

  // Rebuild the dynamic pages with their saved numbers so the ids line up.
  document.querySelectorAll("[data-vp-panel^='ua'], [data-vp-panel^='rc']").forEach((el) => el.remove());
  vpAdditional = [];
  vpReceipts = [];
  vpAddSeq = 0;
  vpRcSeq = 0;
  (payload.additional || []).forEach((n) => addAdditionalUnit(n));
  (payload.receipts || []).forEach((n) => addReceipt(n));

  const v = payload.values || {};
  vpControls().forEach((el) => {
    const saved = v[el.id];
    if (el.type === "checkbox" || el.type === "radio") el.checked = !!saved;
    else el.value = saved == null ? "" : saved;
  });
  vpActiveTab = "main";
  refreshAll();
}

function vpBuildLabel(payload) {
  const v = payload.values || {};
  const dr = (v.dr_no || "").trim();
  const veh = [v.sv_make, v.sv_model].map((s) => (s || "").trim()).filter(Boolean).join(" ");
  const head = dr ? "DR " + dr : "Vehicle Pursuit";
  const date = (v.init_dt || "").split("T")[0];
  return [head, veh, date].filter(Boolean).join(" - ");
}

GumaHistoryWiring.register({
  key: "pursuit",
  noun: "report",
  serialize: vpSerializeState,
  hydrate: vpHydrateState,
  buildLabel: vpBuildLabel,
  // no buildFaction - the agency is free text on this report, not a faction
});

// ── Export + WYSIWYG editing wiring ───────────────────────────────────────────
// The preview modal delegates export here so counters and history keep firing.
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
  // One sheet at a time in the modal; the visible index comes back into
  // download/copy.
  pages: () => {
    drawForm();
    return vpPageBounds.map((b, i) => ({ label: vpPageLabel(i), canvas: vpPageCanvas(i) }));
  },
};

window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  host: vpForm,
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: "pursuit",
});
