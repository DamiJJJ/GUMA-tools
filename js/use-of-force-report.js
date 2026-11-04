"use strict";

// ── Non-Categorical Use of Force Report ──────────────────────────────────────
// Three fixed sheets after form 01.67.05: incident / suspect / employees /
// witnesses (1), control of subject, type of force and the body diagram (2),
// canvass, narrative and the Level I / II criteria (3). The sheets are
// stacked on one canvas (same scheme as the Vehicle Pursuit Report) and
// exported one at a time through the preview modal. The body diagram state
// lives in uofDiagram and is edited through js/body-diagram.js.

// ── Scale factor for HiDPI / high-res export ──────────────────────────────────
const SCALE = 2;

const DEFAULT_AGENCY = "LOS SANTOS POLICE DEPARTMENT";
const UOF_FORM_NO = "01.67.05 (03/2021)";
const UOF_KEY = "uof";

function agencyName() {
  return (uofVal("agency_name") || DEFAULT_AGENCY).toUpperCase();
}

// ── Static tables ─────────────────────────────────────────────────────────────
// Each table drives both the form markup and the document, so the two can
// never disagree on wording, order or ids. `text: true` adds a free-text
// blank after the box, id `<prefix>_<code>_text`.

const UOF_PAGES = [
  { key: "p1", tab: "Incident & Suspect" },
  { key: "p2", tab: "Force & Diagram" },
  { key: "p3", tab: "Narrative" },
];

const UOF_INJ_CODES = [
  { code: "c", label: "C - Complained of" },
  { code: "d", label: "D - Dislocation" },
  { code: "f", label: "F - Fractures" },
  { code: "v", label: "V - Visible" },
  { code: "o", label: "O - Other" },
  { code: "n", label: "N - None" },
  { code: "u", label: "U - Unknown" },
];

const UOF_INJ_SOURCE = [
  { code: "verified", label: "Verified" },
  { code: "observed", label: "Observed" },
  { code: "reported", label: "Reported by Suspect" },
];

// Employees using force: one table row per employee. `yn` = Y/N select.
const UOF_EMP_ROWS = 4;
const UOF_EMP_COLS = [
  { key: "name", label: "Name (Last, First, M.I.)", w: 0.24, ph: "Turner, Michael J." },
  { key: "serial", label: "Serial No.", w: 0.07, ph: "41286" },
  { key: "div", label: "Area/Div Detail", w: 0.1, ph: "Mission Row" },
  { key: "sex", label: "Sex", w: 0.04, ph: "M" },
  { key: "desc", label: "Desc", w: 0.05, ph: "W" },
  { key: "ht", label: "Ht", w: 0.05, ph: "6-01" },
  { key: "wt", label: "Wt", w: 0.05, ph: "195" },
  { key: "age", label: "Age", w: 0.04, ph: "34" },
  { key: "uniform", label: "In\nUniform", w: 0.07, yn: true, form: "In Uniform" },
  { key: "vest", label: "Vest", w: 0.06, yn: true },
  { key: "duty", label: "On\nDuty", w: 0.06, yn: true, form: "On Duty" },
  { key: "injured", label: "Injured\n(Y/N)", w: 0.06, yn: true, form: "Injured" },
  { key: "iod", label: "IOD\n(Y/N)", w: 0.05, yn: true, form: "IOD" },
  { key: "light", label: "Light Duty\n(Y/N)", w: 0.06, yn: true, form: "Light Duty" },
];

const UOF_WIT_ROWS = 4;

const UOF_ATTEST = [
  { id: "att_reviewed", label: "I have reviewed all reports related to this use of force." },
  { id: "att_not_involved", label: "I was not involved in this use of force." },
  { id: "att_interviewed", label: "I have interviewed all involved Department employees separately." },
];

const UOF_RESTRAINT_PARTS = [
  { code: "ankles", label: "Ankles" },
  { code: "knees", label: "Knees" },
  { code: "elbows", label: "Elbows" },
  { code: "other", label: "Other", text: true },
];

const UOF_SOURCE = [
  { code: "observed", label: "Observed" },
  { code: "radio", label: "Radio Call" },
  { code: "citizen", label: "Citizen Call" },
  { code: "station", label: "Station Call" },
  { code: "other", label: "Other", text: true },
];

// Two columns, read row by row like the paper form.
const UOF_ACTIVITY = [
  { code: "suicidal", label: "Suicidal" },
  { code: "415", label: "415" },
  { code: "crime", label: "Crime in Progress" },
  { code: "dui", label: "DUI" },
  { code: "handling", label: "Handling Suspect" },
  { code: "pcp", label: "PCP" },
  { code: "grappling", label: "Ground Grappling" },
  { code: "drugs", label: "Other Drugs" },
  { code: "gang", label: "Gang" },
  { code: "mental", label: "Mental Illness" },
  { code: "family", label: "Family Dispute" },
  { code: "alcohol", label: "Alcohol" },
  { code: "assault_cit", label: "Assault on Citizen" },
  { code: "ambush", label: "Ambush" },
  { code: "assault_off", label: "Assault on Officer" },
  { code: "foot", label: "Foot Pursuit" },
  { code: "neighbor", label: "Neighbor Dispute" },
  { code: "k9", label: "K-9 Search" },
  { code: "business", label: "Business Dispute" },
  { code: "traffic", label: "Traffic Violation" },
  { code: "other", label: "Other", text: true },
  { code: "vehicle", label: "Vehicle Pursuit" },
];

const UOF_JOINT_LOCKS = [
  { code: "wrist", label: "Wrist Lock" },
  { code: "twist", label: "Twist Lock" },
  { code: "other", label: "Other", text: true },
];

// `wrap` = the free text sits inside "( )" on the paper form.
const UOF_MOTION = [
  { code: "grip", label: "Firm Grip or C/Grip" },
  { code: "misc", label: "Miscellaneous Physical Force" },
  { code: "block", label: "Block" },
  { code: "kick", label: "Kick" },
  { code: "punch", label: "Punch" },
  { code: "sweep", label: "Leg Sweep" },
  { code: "distraction", label: "Distraction Strike" },
  { code: "takedown", label: "Takedown", text: true, wrap: true },
  { code: "lhd", label: "Lateral Head Displacement\n(during handcuffing technique)", sub: true },
  { code: "bodyweight", label: "Bodyweight" },
  { code: "baton", label: "Baton Technique" },
  { code: "other", label: "Other", text: true, wrap: true },
];

const UOF_DEVICE = [
  { code: "side", label: "Side-Handle Baton" },
  { code: "exp", label: "Expandable\nSide-Handle Baton" },
  { code: "coll", label: "Collapsible\nStraight Baton" },
  { code: "straight", label: "Straight Baton" },
  { code: "other", label: "Other", text: true },
  { code: "k9", label: "K-9 Bite/Contact" },
];

const UOF_BODY_AREA = [
  { code: "arms", label: "Arms/Hands" },
  { code: "torso", label: "Torso/Neck" },
  { code: "chest", label: "Chest/Back" },
  { code: "legs", label: "Legs/Feet" },
  { code: "head", label: "Head" },
  { code: "other", label: "Other", text: true },
];

const UOF_ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

// Page 3 investigation headings. Level I and II share the last four.
const UOF_L1_CRITERIA = [
  "Unauthorized force is alleged; or,",
  "The force used results in serious injury (broken bone, dislocation, sutures, etc); or,",
  "The suspect's injuries are inconsistent with the amount or type of force indicated by the involved Department employee(s); or,",
  "Accounts of the incident provided by witnesses and/or the suspect substantially conflict with the involved employee(s) account.",
];
const UOF_L2_CRITERIA = [
  "All other reportable Non-Categorical use of force incidents that do not meet Level I criteria, to include the use of an impact device or less lethal munitions with hits.",
];
const UOF_ATTACH_NOTE = (lvl) => `On an attached piece of paper (page 4 of report), document a Level ${lvl} investigation using the following headings:`;
const UOF_ADDENDA_NOTE = "List all related reports, photos, Medical Release Form, etc., and attach items to NCUOF Report.";

const UOF_L1_HEADINGS = [
  {
    code: "witness",
    title: "WITNESS STATEMENTS",
    body: [
      "* Tape record suspect and witnesses (excluding all Department employees). If not practical, explain.",
      "* A brief written summary of the suspect and/or witness statement is only required under this heading if:",
      "  > The statement was not tape-recorded (excluding all Department employees); or,",
      "  > The person's account of the use of force is in substantial conflict with the involved employee(s) account.",
    ],
  },
  { code: "injury", title: "INJURY/MEDICAL TREATMENT" },
  { code: "evidence", title: "EVIDENCE/PHOTOGRAPHS", note: "(Use of force-related only)" },
  { code: "notes", title: "INVESTIGATING SUPERVISOR'S NOTES", body: ["Identify/address substantial conflicts and discrepancies between statements."] },
  { code: "addenda", title: "ADDENDA", body: [UOF_ADDENDA_NOTE] },
];
const UOF_L2_HEADINGS = [
  { code: "injury", title: "INJURY/MEDICAL TREATMENT" },
  { code: "evidence", title: "EVIDENCE/PHOTOGRAPHS", note: "(Use of force-related only)" },
  {
    code: "notes",
    title: "INVESTIGATING SUPERVISOR'S NOTES",
    body: [
      "Verify witness statements are consistent with the arrest report or related reports. Identify/address discrepancies between witness statements, if any.",
      "NOTE: Discrepancies that constitute a substantial conflict between witness or suspect accounts and involved employee(s) accounts shall be reported as a Level I incident.",
    ],
  },
  { code: "addenda", title: "ADDENDA", body: [UOF_ADDENDA_NOTE] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function uofRawVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function uofVal(id) {
  return uofRawVal(id).trim();
}

function uofChecked(id) {
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
const fgTime = (label, id) => fgText(label, id, "", "time");
const fgYN = (label, id) => `<div class="form-group"><label>${label}</label><select id="${id}"><option value=""></option><option>Y</option><option>N</option></select></div>`;
const fgArea = (label, id, rows, max, ph) =>
  `<div class="form-group"><label>${label}</label><textarea id="${id}" rows="${rows}" maxlength="${max}" placeholder="${escAttr(ph)}"></textarea></div>`;
const radioItem = (name, id, label) => `<label class="checkbox-item"><input type="radio" name="${name}" id="${id}" /> ${label}</label>`;
const checkItem = (id, label) => `<label class="checkbox-item"><input type="checkbox" id="${id}" /> ${label}</label>`;

/** Yes / No radio pair, ids <name>_yes / <name>_no. */
const yesNoHtml = (label, name) => `
  <div class="mb-3">
    <p class="guma-sub-label mt-0">${label}</p>
    <div class="flex gap-4">${radioItem(name, `${name}_yes`, "Yes")}${radioItem(name, `${name}_no`, "No")}</div>
  </div>`;

// Literal class names, so the Tailwind runtime sees every one of them.
const UOF_GRID_COLS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

/** Checkbox grid from a table, plus a text input under every `text` item. */
function checkGridHtml(prefix, items, cols) {
  const boxes = items.map((it) => checkItem(`${prefix}_${it.code}`, it.label.replace("\n", " "))).join("");
  const texts = items
    .filter((it) => it.text)
    .map((it) => fgText(`${it.label} (specify)`, `${prefix}_${it.code}_text`, ""))
    .join("");
  return `<div class="mb-3 grid ${UOF_GRID_COLS[cols]} gap-x-4 gap-y-1.5">${boxes}</div>${texts ? `<div class="two-col">${texts}</div>` : ""}`;
}

function radioRowHtml(name, items) {
  return `<div class="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">${items.map((it) => radioItem(name, `${name}_${it.code}`, it.label)).join("")}</div>`;
}

function page1Html() {
  const emp = Array.from({ length: UOF_EMP_ROWS }, (_, i) => {
    const p = `emp${i + 1}`;
    const f = (k) => UOF_EMP_COLS.find((c) => c.key === k);
    const text = (k, label) => fgText(label || f(k).label, `${p}_${k}`, i === 0 ? f(k).ph : "");
    const yn = UOF_EMP_COLS.filter((c) => c.yn)
      .map((c) => fgYN(c.form || c.label, `${p}_${c.key}`))
      .join("");
    return `
      <div class="dynamic-row">
        <div class="row-title">Employee ${i + 1}</div>
        <div class="three-col">${text("name")}${text("serial")}${text("div")}</div>
        <div class="grid grid-cols-5 gap-3">${text("sex")}${text("desc")}${text("ht")}${text("wt")}${text("age")}</div>
        <div class="three-col">${yn}</div>
      </div>`;
  }).join("");

  const wit = Array.from({ length: UOF_WIT_ROWS }, (_, i) => {
    const p = `wit${i + 1}`;
    const ph = (s) => (i === 0 ? s : "");
    return `
      <div class="dynamic-row">
        <div class="row-title">Witness ${i + 1}</div>
        <div class="three-col">
          ${fgText("Last, First, M.I.", `${p}_name`, ph("Alvarez, Rosa M."))}
          ${fgDate("DOB", `${p}_dob`)}
          ${fgText("Phone No.", `${p}_phone`, ph("(213) 555-0148"))}
        </div>
        ${fgText("Address and ZIP / Area and Unit of Assignment", `${p}_addr`, ph("1142 Vespucci Blvd, Los Santos 90401"))}
        <div class="two-col">
          ${fgText("D.L. No. or Serial No.", `${p}_dl`, ph("D4471829"))}
          ${fgText("Tape No.", `${p}_tape`, ph("T-0412"))}
        </div>
        <div class="checkbox-group mb-2">${checkItem(`${p}_sep`, "Interviewed separately")}</div>
        ${fgText("Supervisor Interviewing - Name/Serial No./Date/Time/Location", `${p}_sep_info`, ph("Sgt. R. Whitaker #31845, 06/14/2026 0215, scene"))}
      </div>`;
  }).join("");

  return `
    <p class="guma-tab-note">Fills page 1 of the report.</p>
    <p class="guma-form-section">Report</p>
    ${fgText("Agency Name (document header)", "agency_name", "Los Santos Police Department")}
    <div class="two-col">
      ${fgText("DR No.", "dr_no", "26-0614-0291")}
      <div class="mb-3">
        <p class="guma-sub-label mt-0">Level</p>
        <div class="flex gap-4">${radioItem("level", "level_1", "Level I")}${radioItem("level", "level_2", "Level II")}</div>
      </div>
    </div>

    <p class="guma-form-section mt-2">Incident</p>
    <div class="three-col">
      ${fgDate("Date of Incident", "date_inc")}
      ${fgText("Day of Week", "dow", "Sunday")}
      ${fgTime("Time", "time_inc")}
    </div>
    <div class="two-col">
      ${fgText("Location of Occurrence", "location", "Vespucci Blvd / Palomino Ave")}
      ${fgText("RD", "rd", "0145")}
    </div>
    <div class="three-col">
      ${fgText("Date & Time of this Report", "report_dt", "", "datetime-local")}
      ${fgText("Officer's Area/Division", "off_div", "Mission Row")}
      ${fgText("Area/Division of Occurrence", "occ_div", "Vespucci")}
    </div>

    <p class="guma-form-section mt-2">Suspect</p>
    ${fgText("Last Name, First, M.I.", "s_name", "Brooks, Tyler A.")}
    <div class="four-col">
      ${fgText("Sex", "s_sex", "M")}
      ${fgText("Desc", "s_desc", "W")}
      ${fgText("Ht", "s_ht", "5-11")}
      ${fgText("Wt", "s_wt", "180")}
    </div>
    <div class="three-col">
      ${fgDate("DOB", "s_dob")}
      ${fgText("Age", "s_age", "29")}
      ${fgText("Bkg. No.", "s_bkg", "BK-26-55107")}
    </div>
    <div class="two-col">
      ${fgText("Arrest Charge", "s_charge", "PC 243(b)")}
      ${fgText("Connected Reports", "s_connected", "Arrest Report")}
    </div>
    <div class="three-col">
      ${fgText("Tape No.", "s_tape", "T-0411")}
      ${fgText("Interviewer Name", "s_interviewer", "Sgt. R. Whitaker")}
      ${fgText("Interviewer Serial No.", "s_int_serial", "31845")}
    </div>
    <div class="three-col">
      ${fgDate("Interview Date", "s_int_date")}
      ${fgTime("Interview Time", "s_int_time")}
      ${fgText("Location of Interview", "s_int_loc", "Mission Row Station")}
    </div>
    <div class="checkbox-group mb-3">${checkItem("s_sep", "Suspect interviewed separately")}</div>

    <p class="guma-form-section mt-2">Injuries Related to UOF</p>
    ${checkGridHtml("inj", UOF_INJ_CODES, 3)}
    <p class="guma-sub-label mt-0">Medical Release Form</p>
    ${radioRowHtml("med_rel", [
      { code: "signed", label: "Signed/Attached" },
      { code: "refused", label: "Refused" },
    ])}
    ${fgArea("Injuries, medical treatment, by whom, name of medical provider", "inj_desc", 3, 320, "Two TASER probe punctures to the left upper back, removed by LSFD RA 15. Treated at Pillbox Hill Medical Center.")}
    ${radioRowHtml("inj_src", UOF_INJ_SOURCE)}

    <p class="guma-form-section mt-2">Injuries Unrelated to UOF</p>
    ${fgArea("Unrelated injuries (e.g. traffic collision)", "uinj_desc", 2, 200, "Abrasion to the right knee from a fall before police contact.")}
    ${radioRowHtml("uinj_src", UOF_INJ_SOURCE)}
    ${yesNoHtml("Hospitalized (unrelated to the UOF)", "hosp")}

    <p class="guma-form-section mt-2">Employees Using Force</p>
    ${emp}

    <p class="guma-form-section mt-2">Witnesses / Non-Involved Employee Witnesses</p>
    ${wit}

    <p class="guma-form-section mt-2">Supervisor Review</p>
    <div class="checkbox-group mb-3">${UOF_ATTEST.map((a) => checkItem(a.id, a.label)).join("")}</div>
    <div class="three-col">
      ${fgText("Investigating Supervisor", "sup_name", "Sgt. Robert Whitaker")}
      ${fgText("Serial No.", "sup_serial", "31845")}
      ${fgDate("Date", "sup_date")}
    </div>
    <div class="three-col">
      ${fgText("Watch Commander/OIC", "wc_name", "Lt. Dana Harlan")}
      ${fgText("Serial No.", "wc_serial", "27719")}
      ${fgDate("Date", "wc_date")}
    </div>
    <div class="checkbox-group mb-3">${checkItem("wc_reviewed", "Watch Commander: I have reviewed all reports related to this use of force.")}</div>`;
}

function page2Html() {
  const dists = (prefix, n, unit) =>
    `<div class="four-col">${UOF_ORD.slice(0, n)
      .map((o, i) => fgText(`${o} (${unit})`, `${prefix}${i + 1}`, ""))
      .join("")}</div>`;
  return `
    <p class="guma-tab-note">Fills page 2 of the report.</p>
    <p class="guma-form-section">Control of Subject</p>
    ${fgText("Last UOF that controlled the suspect", "last_uof", "TASER activation, then firm grip and handcuffing")}
    <div class="two-col">
      ${yesNoHtml("Secondary Restraint Device Used?", "srd")}
      ${fgText("If yes, device used", "srd_device", "Hobble restraint")}
    </div>
    <p class="guma-sub-label mt-0">Part of body restrained</p>
    ${checkGridHtml("srd_part", UOF_RESTRAINT_PARTS, 4)}
    <div class="two-col">
      ${yesNoHtml("Placed in upright seated position?", "upright")}
      ${fgText("Time restrained with SRD", "srd_time", "4 min")}
    </div>
    <div class="two-col">
      ${yesNoHtml("Warning required? (TASER, impact device, less lethal)", "warn_req")}
      ${yesNoHtml("If required, was a warning given?", "warn_given")}
    </div>

    <p class="guma-form-section mt-2">Source of Activity</p>
    ${checkGridHtml("src", UOF_SOURCE, 3)}

    <p class="guma-form-section mt-2">Type of Activity</p>
    ${checkGridHtml("act", UOF_ACTIVITY, 2)}

    <p class="guma-form-section mt-2">Type of Force Used</p>
    <p class="guma-sub-label mt-0">Joint Locks</p>
    ${checkGridHtml("jl", UOF_JOINT_LOCKS, 3)}
    <p class="guma-sub-label">Motion</p>
    ${checkGridHtml("mo", UOF_MOTION, 2)}
    <p class="guma-sub-label">Device</p>
    ${checkGridHtml("dev", UOF_DEVICE, 2)}
    <p class="guma-sub-label">Body Area Affected</p>
    ${checkGridHtml("ba", UOF_BODY_AREA, 3)}

    <p class="guma-form-section mt-2">Chemical Agent</p>
    <div class="two-col">
      ${fgText("Brand of Spray", "ca_brand", "")}
      ${fgText("Model", "ca_model", "")}
    </div>
    <div class="three-col">
      ${fgText("Manufacture date", "ca_mfg", "")}
      ${fgText("OR Expiration date", "ca_exp", "")}
      ${fgText("Number of times sprayed", "ca_times", "")}
    </div>
    <div class="three-col">
      ${[1, 2, 3].map((n) => fgText(`${UOF_ORD[n - 1]} distance (ft)`, `ca_d${n}`, "")).join("")}
    </div>
    <div class="three-col">
      ${[1, 2, 3].map((n) => fgText(`${UOF_ORD[n - 1]} duration (sec)`, `ca_t${n}`, "")).join("")}
    </div>
    ${yesNoHtml("Was spray effective?", "ca_eff")}
    ${fgText("If no, why not?", "ca_why", "")}
    ${fgText("Residual effects on officers", "ca_residual", "")}

    <p class="guma-form-section mt-2">TASER</p>
    <div class="two-col">
      ${fgText("Number of cartridges fired", "tz_cart", "1")}
      ${fgText("Time for TASER to arrive (min)", "tz_arrive", "0")}
    </div>
    <p class="guma-sub-label mt-0">Distance to suspect (feet)</p>
    ${dists("tz_d", 4, "ft")}
    <div class="two-col">
      ${yesNoHtml("Skin penetrated?", "tz_skin")}
      ${yesNoHtml("Was TASER effective?", "tz_eff")}
    </div>
    ${fgArea("If no, why not?", "tz_why", 2, 220, "")}
    <div class="three-col">
      ${fgText("TASER No.", "tz_no", "X26-84112")}
      ${fgText("Brand", "tz_brand", "Axon")}
      ${fgText("Type", "tz_type", "TASER 7")}
    </div>

    <p class="guma-form-section mt-2">Beanbag Shotgun / Other Less Lethal</p>
    <div class="checkbox-group mb-3">${checkItem("ll_beanbag", "Beanbag Shotgun")}${checkItem("ll_other", "Other Less Lethal Device(s)")}</div>
    <div class="two-col">
      ${fgText("Other device(s)", "ll_other_text", "40mm LLL")}
      ${fgText("Number of rounds fired", "ll_rounds", "")}
    </div>
    <p class="guma-sub-label mt-0">Distance to suspect (feet)</p>
    ${dists("ll_d", 7, "ft")}
    <div class="two-col">
      ${yesNoHtml("Skin penetrated?", "ll_skin")}
      ${fgText("Time to arrive at scene (min)", "ll_arrive", "")}
    </div>
    ${yesNoHtml("Was it effective?", "ll_eff")}
    ${fgArea("If no, why not?", "ll_why", 2, 220, "")}

    <p class="guma-form-section mt-2">Body Diagram</p>
    <p class="guma-tab-note">Pick a tool, then tap the figure. <b>T</b> and <b>BB</b> place numbered points of contact (drag a point to move it), <b>CA</b> and <b>Other</b> shade the tapped body area, <b>Erase</b> removes either.</p>
    <div id="bdTools" class="guma-seg guma-bd-seg mb-3"></div>
    <div class="guma-bd-widget"><canvas id="bdCanvas" aria-label="Body diagram, front and back"></canvas></div>
    <button type="button" id="bdClear" class="guma-link-remove">&#10005; Clear diagram</button>`;
}

function page3Html() {
  const heads = (prefix, list) => `<div class="checkbox-group mb-3">${list.map((h) => checkItem(`${prefix}_${h.code}`, h.title.charAt(0) + h.title.slice(1).toLowerCase())).join("")}</div>`;
  return `
    <p class="guma-tab-note">Fills page 3 of the report.</p>
    <p class="guma-form-section">Area Canvassed for Witnesses and Evidence</p>
    ${fgArea("Scope of search and evidence located (if unable to locate witnesses, explain)", "canvass", 5, 1400, "Canvassed both sides of Vespucci Blvd between Palomino Ave and Ginger St...")}
    <p class="guma-form-section mt-2">Witnesses Not Interviewed Separately</p>
    ${fgArea("Employees / witnesses / suspects not interviewed separately, and why", "not_interviewed", 4, 1200, "Officers Turner and Ortega were interviewed together at the scene because...")}
    <p class="guma-form-section mt-2">Incident Overview (Level I only)</p>
    ${fgArea("Brief summary, without opinion or conclusions", "overview", 6, 1400, "On June 14, 2026 at approximately 0140 hours, Officers Turner and Ortega...")}
    <p class="guma-form-section mt-2">Level I Headings Attached</p>
    ${heads("l1", UOF_L1_HEADINGS)}
    <p class="guma-form-section mt-2">Level II Headings Attached</p>
    ${heads("l2", UOF_L2_HEADINGS)}`;
}

function buildPanels() {
  const host = document.getElementById("uofPanels");
  const html = { p1: page1Html(), p2: page2Html(), p3: page3Html() };
  host.innerHTML = UOF_PAGES.map((p) => `<section data-uof-panel="${p.key}"${p.key === "p1" ? "" : " hidden"}>${html[p.key]}</section>`).join("");
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
let uofActiveTab = "p1";

function renderTabs() {
  const host = document.getElementById("uofTabs");
  if (!host) return;
  host.innerHTML = UOF_PAGES.map(
    (p, i) =>
      `<button type="button" role="tab" class="guma-tab${p.key === uofActiveTab ? " active" : ""}" aria-selected="${p.key === uofActiveTab}" data-uof-tab="${p.key}">${i + 1}. ${p.tab}</button>`,
  ).join("");
  document.querySelectorAll("[data-uof-panel]").forEach((sec) => (sec.hidden = sec.dataset.uofPanel !== uofActiveTab));
}

function showTab(key) {
  uofActiveTab = key;
  renderTabs();
  scrollToPage(key);
  // The widget canvas had no layout while its tab was hidden.
  if (key === "p2") uofWidget?.paint();
}

// ── Input length caps ─────────────────────────────────────────────────────────
// Keyed by page-level id or by field suffix (longest suffix wins). Values
// still shrink-to-fit below these.
const UOF_MAXLEN = {
  agency_name: 52,
  dr_no: 20,
  dow: 10,
  location: 70,
  rd: 8,
  off_div: 60,
  occ_div: 40,
  s_name: 36,
  s_sex: 3,
  s_desc: 4,
  s_ht: 6,
  s_wt: 5,
  s_age: 3,
  s_bkg: 18,
  s_charge: 22,
  s_connected: 22,
  s_tape: 12,
  s_interviewer: 44,
  s_int_serial: 10,
  s_int_loc: 50,
  last_uof: 52,
  srd_device: 30,
  srd_time: 44,
  ca_brand: 24,
  ca_model: 24,
  ca_mfg: 12,
  ca_exp: 12,
  ca_times: 8,
  ca_why: 30,
  ca_residual: 30,
  tz_cart: 4,
  tz_arrive: 4,
  tz_no: 14,
  tz_brand: 16,
  tz_type: 36,
  ll_other_text: 18,
  ll_rounds: 6,
  ll_arrive: 6,
  sup_name: 60,
  sup_serial: 10,
  wc_name: 40,
  wc_serial: 10,
  // row / table suffixes
  name: 34,
  serial: 8,
  div: 14,
  sex: 3,
  desc: 4,
  ht: 6,
  wt: 5,
  age: 3,
  dl: 22,
  phone: 18,
  addr: 64,
  tape: 14,
  sep_info: 80,
  text: 18,
  d1: 4,
  d2: 4,
  d3: 4,
  d4: 4,
  d5: 4,
  d6: 4,
  d7: 4,
  t1: 4,
  t2: 4,
  t3: 4,
};

// ── Canvas layout constants (logical pixels - rendered xSCALE) ───────────────
const DOC_W = 612;
const PAGE_H = 792; // US Letter at 72 dpi
const MARGIN = 22;
const BODY_W = DOC_W - MARGIN * 2;
const X1 = MARGIN + BODY_W;
const LINE_W = 0.6;
const CELL_BG = "#fff";
const BAR_BG = "#e2e2e2";
const PAGE_GAP = 12;
const GAP_BG = "#c9ccd1";

const VAL_PX = 8;
const VAL_MIN_PX = 4.5;
const LABEL_PX = 6;
const OPT_PX = 6.5;
const BOX = 6.5; // tick box size

const arial = (px, bold, italic) => `${italic ? "italic " : ""}${bold ? "bold " : ""}${px}px Arial`;

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
  ctx.font = arial(px, opts.bold, opts.italic);
  ctx.textAlign = opts.align || "left";
  const lh = opts.lh || px + 1.4;
  const lines = String(str).split("\n");
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
  ctx.textAlign = "left";
  return y + (lines.length - 1) * lh;
}

function textW(ctx, str, px, bold, italic) {
  ctx.font = arial(px, bold, italic);
  return ctx.measureText(str).width;
}

/**
 * Inline run of differently styled pieces on one baseline:
 * [{ s, bold, italic, under, px }]. Returns the x after the last piece.
 */
function runs(ctx, parts, x, base, px) {
  let cx = x;
  parts.forEach((p) => {
    const size = p.px || px;
    text(ctx, p.s, cx, base, size, p);
    const w = textW(ctx, p.s, size, p.bold, p.italic);
    if (p.under) hline(ctx, cx, base + 1.2, w, 0.5);
    cx += w;
  });
  return cx;
}

/** Word-wrapped static text. Returns the baseline after the last line. */
function para(ctx, str, x, base, w, px, opts = {}) {
  ctx.font = arial(px, opts.bold, opts.italic);
  const lh = opts.lh || px + 1.6;
  const lines = GumaFit.wrapLines(ctx, str, w, 99);
  lines.forEach((ln, i) => text(ctx, ln, x, base + i * lh, px, opts));
  return base + lines.length * lh;
}

/** Printed value of a field: formatted, "" when empty (blank paper form). */
function shownVal(ref, kind) {
  const raw = uofRawVal(ref);
  if (!raw.trim()) return "";
  if (kind === "date") return fmtDate(raw);
  if (kind === "datetime") return fmtDatetime(raw);
  return raw.trim();
}

/**
 * One value painted at a baseline, shrunk to fit maxW, registered for editing.
 * opts: kind, align, px, label, hit (box override {x, y, w, h}).
 */
function value(ctx, ref, x, base, maxW, opts = {}) {
  const shown = shownVal(ref, opts.kind);
  if (shown) {
    ctx.fillStyle = "#000";
    GumaFit.fitFont(ctx, shown, maxW, opts.px || VAL_PX, VAL_MIN_PX, (px) => arial(px));
    ctx.textAlign = opts.align || "left";
    ctx.fillText(shown, opts.align === "center" ? x + maxW / 2 : x, base);
    ctx.textAlign = "left";
  }
  const hit = opts.hit || { x: x - 2, y: base - 9, w: maxW + 4, h: 12 };
  regField(ref, hit.x, hit.y, hit.w, hit.h, { kind: opts.kind, label: opts.label, align: opts.align });
}

/** Value on an underline (the paper form's "____" blanks). */
function blank(ctx, ref, x, base, w, opts = {}) {
  hline(ctx, x, base + 2, w);
  value(ctx, ref, x + 1.5, base, w - 3, { align: "center", ...opts });
}

/** "Label ________" on one baseline. Returns the x after the blank. */
function labelBlank(ctx, label, ref, x, base, w, opts = {}) {
  const lw = label ? textW(ctx, label, opts.px || OPT_PX) + 3 : 0;
  if (label) text(ctx, label, x, base, opts.px || OPT_PX);
  blank(ctx, ref, x + lw, base, w - lw, { label: opts.editLabel || label, kind: opts.kind });
  return x + w;
}

/** Labelled table cell: small label top-left, value along the bottom. */
function cell(ctx, x, y, w, h, label, ref, opts = {}) {
  box(ctx, x, y, w, h, CELL_BG);
  if (label) text(ctx, label, x + 2.5, y + 7, opts.labelPx || LABEL_PX, { color: "#222", lh: (opts.labelPx || LABEL_PX) + 1 });
  if (ref) value(ctx, ref, x + 3, y + h - 4.5, w - 6, { ...opts, label: opts.editLabel || label.replace(/\n/g, " "), hit: { x, y, w, h } });
}

/** Lay a row of { label, ref, w, ... } cells across a width. */
function cellRow(ctx, spec, x0, y, totalW, h) {
  const widths = spec.map((s) => Math.round(totalW * s.w));
  widths[widths.length - 1] += totalW - widths.reduce((a, b) => a + b, 0);
  let x = x0;
  spec.forEach((s, i) => {
    if (s.draw) s.draw(ctx, x, y, widths[i], h);
    else cell(ctx, x, y, widths[i], h, s.label, s.ref, s);
    x += widths[i];
  });
  return y + h;
}

function tick(ctx, x, y, checked) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, BOX, BOX);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, BOX, BOX);
  if (!checked) return;
  ctx.fillStyle = "#000";
  ctx.font = arial(BOX + 1, true);
  ctx.textAlign = "center";
  ctx.fillText("X", x + BOX / 2, y + BOX - 0.5);
  ctx.textAlign = "left";
}

/**
 * Tick box + label at a baseline, registered as a check field. "\n" in the
 * label stacks lines below the first (a size smaller with opts.sub). Returns
 * the x right after the label.
 */
function checkOpt(ctx, id, label, x, base, px, opts = {}) {
  const p = px || OPT_PX;
  tick(ctx, x, base - BOX + 0.5, uofChecked(id));
  const lx = x + BOX + 3;
  const lines = String(label).split("\n");
  const size = (i) => (i > 0 && opts.sub ? p - 1 : p);
  lines.forEach((ln, i) => text(ctx, ln, lx, base + i * (p + 1), size(i), { bold: opts.bold && i === 0 }));
  const w = Math.max(0, ...lines.map((l, i) => textW(ctx, l, size(i), opts.bold && i === 0)));
  const hitW = opts.hitW || w + BOX + 7;
  regField(id, x - 2, base - 9, hitW, 12 + (lines.length - 1) * (p + 1), { kind: "check", label: opts.editLabel || label.replace(/\n/g, " ") });
  return lx + w;
}

/** YES / NO boxes for a <name>_yes / <name>_no radio pair. */
function yesNo(ctx, name, x, base, label, opts = {}) {
  const gap = opts.gap || 30;
  const yes = opts.upper ? "YES" : "Yes";
  const no = opts.upper ? "NO" : "No";
  checkOpt(ctx, `${name}_yes`, yes, x, base, opts.px, { editLabel: `${label}: Yes` });
  return checkOpt(ctx, `${name}_no`, no, x + gap, base, opts.px, { editLabel: `${label}: No` });
}

/**
 * Vertical list of table items. `text` items get a blank running to maxX
 * (inside "( )" when `wrap`). Returns the baseline after the list.
 */
function checkList(ctx, prefix, items, x, base, step, maxX, px) {
  let y = base;
  items.forEach((it) => {
    const id = `${prefix}_${it.code}`;
    const end = checkOpt(ctx, id, it.label, x, y, px, { sub: it.sub });
    if (it.text) {
      const tref = `${id}_text`;
      if (it.wrap) {
        text(ctx, "(", end + 2, y, px || OPT_PX);
        blank(ctx, tref, end + 6, y, maxX - end - 12, { label: `${it.label} (specify)` });
        text(ctx, ")", maxX - 4, y, px || OPT_PX);
      } else {
        blank(ctx, tref, end + 4, y, maxX - end - 4, { label: `${it.label} (specify)` });
      }
    }
    y += step + (it.label.split("\n").length - 1) * ((px || OPT_PX) + 1);
  });
  return y;
}

/** Grey band with a bold title and an optional plain note after it. */
function sectionBar(ctx, y, title, note) {
  const h = 13;
  box(ctx, MARGIN, y, BODY_W, h, BAR_BG, 0.8);
  const end = runs(ctx, [{ s: title, bold: true, px: 8.5 }], MARGIN + 4, y + 9.5, 8.5);
  if (note) runs(ctx, note, end + 6, y + 9.3, 6);
  return y + h;
}

/** Wrapped multi-line value inside a box, shrinking until it fits. */
function multiline(ctx, ref, x, y, w, h, label, basePx) {
  const raw = uofRawVal(ref).trim();
  ctx.fillStyle = "#000";
  if (raw) {
    let px = basePx || 7.5;
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
  regField(ref, x, y, w, h, { kind: "multiline", label, fontPx: basePx || 7.5 });
}

/** Form number + "Page n of 3" (left) and DR No. (right) on pages 2-3. */
function sheetHead(ctx, y, n) {
  text(ctx, `${UOF_FORM_NO} Page ${n} of ${UOF_PAGES.length}`, MARGIN, y + 8, 6.5);
  const w = 110;
  text(ctx, "DR No.", X1 - w - 26, y + 8, 7, { bold: true });
  blank(ctx, "dr_no", X1 - w, y + 8, w, { label: "DR No." });
  return y + 16;
}

// ── Page 1: incident, suspect, employees, witnesses ───────────────────────────
function drawPage1(ctx, oy) {
  let y = oy + MARGIN;

  // Header: form no. / page / level (left), agency + title (centre), DR box.
  text(ctx, UOF_FORM_NO, MARGIN, y + 7, 6.5, { bold: true });
  text(ctx, `Page 1 of ${UOF_PAGES.length}`, MARGIN, y + 16, 6.5);
  const lx = checkOpt(ctx, "level_1", "Level I", MARGIN, y + 28, 7, { editLabel: "Level I" });
  checkOpt(ctx, "level_2", "Level II", lx + 10, y + 28, 7, { editLabel: "Level II" });

  const cx = DOC_W / 2;
  text(ctx, agencyName(), cx, y + 8, 7.5, { align: "center" });
  const agencyW = Math.max(160, textW(ctx, agencyName(), 7.5) + 10);
  regField("agency_name", cx - agencyW / 2, y, agencyW, 11, { label: "Agency Name", align: "center", fontPx: 7.5, transform: "upper" });
  text(ctx, "NON-CATEGORICAL USE OF FORCE REPORT", cx, y + 22, 12.5, { bold: true, align: "center" });

  const drW = 110;
  box(ctx, X1 - drW, y + 12, drW, 22, CELL_BG);
  text(ctx, "DR No.", X1 - drW + 3, y + 19, LABEL_PX, { color: "#222" });
  value(ctx, "dr_no", X1 - drW + 4, y + 30, drW - 8, { label: "DR No.", hit: { x: X1 - drW, y: y + 12, w: drW, h: 22 } });
  y += 34;

  y = cellRow(
    ctx,
    [
      { label: "Date of Incident", ref: "date_inc", w: 0.13, kind: "date" },
      { label: "Day of Week", ref: "dow", w: 0.11 },
      { label: "Time", ref: "time_inc", w: 0.09, kind: "time" },
      { label: "Location of Occurrence", ref: "location", w: 0.55 },
      { label: "RD", ref: "rd", w: 0.12 },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );
  y = cellRow(
    ctx,
    [
      { label: "Date & Time of this Report", ref: "report_dt", w: 0.23, kind: "datetime" },
      { label: "Officer's Area/Division of Assignment", ref: "off_div", w: 0.47 },
      { label: "Area/Division of Occurrence", ref: "occ_div", w: 0.3 },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );

  // Suspect
  y = sectionBar(ctx, y, "SUSPECT");
  y = cellRow(
    ctx,
    [
      { label: "Last Name, First, M.I.", ref: "s_name", w: 0.25 },
      { label: "Sex", ref: "s_sex", w: 0.05 },
      { label: "Desc", ref: "s_desc", w: 0.06 },
      { label: "Ht", ref: "s_ht", w: 0.06 },
      { label: "Wt", ref: "s_wt", w: 0.06 },
      { label: "DOB", ref: "s_dob", w: 0.09, kind: "date" },
      { label: "Age", ref: "s_age", w: 0.05 },
      { label: "Bkg. No.", ref: "s_bkg", w: 0.12 },
      { label: "Arrest Charge", ref: "s_charge", w: 0.13 },
      { label: "Connected Reports", ref: "s_connected", w: 0.13 },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );
  y = cellRow(
    ctx,
    [
      { label: "Tape No.", ref: "s_tape", w: 0.09 },
      { label: "Interviewer Name", ref: "s_interviewer", w: 0.3 },
      { label: "Serial No.", ref: "s_int_serial", w: 0.1 },
      { label: "Date", ref: "s_int_date", w: 0.11, kind: "date" },
      { label: "Time", ref: "s_int_time", w: 0.08, kind: "time" },
      { label: "Location of Interview", ref: "s_int_loc", w: 0.32 },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );

  // Injuries related to the UOF
  const ih = 84;
  box(ctx, MARGIN, y, BODY_W, ih, CELL_BG);
  checkOpt(ctx, "s_sep", "Suspect interviewed separately.", MARGIN + 60, y + 9, 6.2);
  let bx = runs(ctx, [{ s: "Suspect's injury(s) related to UOF:  Check all that apply.  " }, { s: "Medical Release Form:" }], MARGIN + 3, y + 20, 6.3);
  bx = checkOpt(ctx, "med_rel_signed", "Signed/Attached", bx + 40, y + 20, 6.3, { editLabel: "Medical Release Form: Signed/Attached" });
  checkOpt(ctx, "med_rel_refused", "Refused", bx + 24, y + 20, 6.3, { editLabel: "Medical Release Form: Refused" });
  const codeW = (BODY_W - 10) / UOF_INJ_CODES.length;
  UOF_INJ_CODES.forEach((c, i) => checkOpt(ctx, `inj_${c.code}`, c.label, MARGIN + 4 + i * codeW, y + 30, 6.5, { bold: true }));
  text(ctx, "Document injuries related to use of force, medical treatment provided, by whom and name of medical provider (e.g., medical facility).", MARGIN + 3, y + 39, 6.2);
  multiline(ctx, "inj_desc", MARGIN + 3, y + 41, BODY_W - 6, 26, "Injuries related to UOF", 7);
  let sx = MARGIN + 4;
  UOF_INJ_SOURCE.forEach((s) => {
    sx = checkOpt(ctx, `inj_src_${s.code}`, s.label, sx, y + 76, 6.3, { editLabel: `Related injuries: ${s.label}` }) + 40;
  });
  text(ctx, "(Check one box only.)", sx - 34, y + 76, 6.3);
  y += ih;

  // Injuries unrelated to the UOF + hospitalized
  const uh = 46;
  const hospW = 120;
  box(ctx, MARGIN, y, BODY_W - hospW, uh, CELL_BG);
  runs(
    ctx,
    [{ s: "Suspect's injury(s) " }, { s: "unrelated", bold: true, under: true }, { s: " to UOF, i.e., traffic collision (Use Injuries/MT section if additional space is needed)" }],
    MARGIN + 3,
    y + 8,
    6.2,
  );
  multiline(ctx, "uinj_desc", MARGIN + 3, y + 10, BODY_W - hospW - 6, 22, "Injuries unrelated to UOF", 7);
  sx = MARGIN + 4;
  UOF_INJ_SOURCE.forEach((s) => {
    sx = checkOpt(ctx, `uinj_src_${s.code}`, s.label, sx, y + 42, 6.3, { editLabel: `Unrelated injuries: ${s.label}` }) + 40;
  });
  text(ctx, "(Check one box only.)", sx - 34, y + 42, 6.3);
  const hx = X1 - hospW;
  box(ctx, hx, y, hospW, uh, CELL_BG);
  text(ctx, "Hospitalized (unrelated to the UOF)", hx + hospW / 2, y + 12, 6.2, { align: "center" });
  yesNo(ctx, "hosp", hx + 28, y + 32, "Hospitalized", { gap: 38 });
  y += uh;

  // Employees using force
  y = sectionBar(ctx, y, "EMPLOYEES USING FORCE", [
    { s: "(Use continuation sheet if needed.  List partner officer not using force under " },
    { s: "WITNESSES", bold: true, italic: true },
    { s: " below.)" },
  ]);
  const widths = UOF_EMP_COLS.map((c) => Math.round(BODY_W * c.w));
  widths[widths.length - 1] += BODY_W - widths.reduce((a, b) => a + b, 0);
  const headH = 17;
  let ex = MARGIN;
  UOF_EMP_COLS.forEach((c, i) => {
    box(ctx, ex, y, widths[i], headH, CELL_BG);
    const lines = c.label.split("\n");
    const ty = y + headH / 2 + 2 - (lines.length - 1) * 3.4;
    text(ctx, c.label, c.key === "name" ? ex + 3 : ex + widths[i] / 2, ty, 6, { align: c.key === "name" ? "left" : "center", lh: 6.8 });
    ex += widths[i];
  });
  y += headH;
  const rowH = 19;
  for (let r = 1; r <= UOF_EMP_ROWS; r++) {
    ex = MARGIN;
    UOF_EMP_COLS.forEach((c, i) => {
      box(ctx, ex, y, widths[i], rowH, CELL_BG);
      const ref = `emp${r}_${c.key}`;
      const label = `Employee ${r} - ${(c.form || c.label).replace(/\n/g, " ")}`;
      value(ctx, ref, ex + 3, y + rowH - 5, widths[i] - 6, {
        align: c.key === "name" ? "left" : "center",
        kind: c.yn ? "select" : undefined,
        label,
        hit: { x: ex, y, w: widths[i], h: rowH },
      });
      ex += widths[i];
    });
    y += rowH;
  }

  // Witnesses
  y = sectionBar(ctx, y, "WITNESSES/NON-INVOLVED EMPLOYEE WITNESSES", [{ s: "(If witness not interviewed separately, explain on PAGE 3.)" }]);
  for (let r = 1; r <= UOF_WIT_ROWS; r++) {
    const p = `wit${r}`;
    const W = `Witness ${r}`;
    y = cellRow(
      ctx,
      [
        { label: "Last Name, First Name, Middle Initial", ref: `${p}_name`, w: 0.33, editLabel: `${W} Name` },
        { label: "DOB", ref: `${p}_dob`, w: 0.1, kind: "date", editLabel: `${W} DOB` },
        { label: "Address and ZIP Code or Area and Unit of Employee's Assignment", ref: `${p}_addr`, w: 0.43, editLabel: `${W} Address` },
        { label: "Phone No.", ref: `${p}_phone`, w: 0.14, editLabel: `${W} Phone No.` },
      ],
      MARGIN,
      y,
      BODY_W,
      23,
    );
    y = cellRow(
      ctx,
      [
        { label: "D.L. No. or Serial No.", ref: `${p}_dl`, w: 0.22, editLabel: `${W} D.L. No. or Serial No.` },
        {
          w: 0.64,
          draw: (c, x, yy, w, h) => {
            box(c, x, yy, w, h, CELL_BG);
            checkOpt(c, `${p}_sep`, "", x + 2.5, yy + 8, 5.8, { editLabel: `${W} interviewed separately`, hitW: BOX + 4 });
            text(c, "This witness interviewed separately. Name/Serial No. of Supervisor Interviewing/Date/Time/Location of Interview", x + BOX + 5, yy + 7.5, 5.8, { color: "#222" });
            value(c, `${p}_sep_info`, x + 3, yy + h - 4.5, w - 6, { label: `${W} supervisor interviewing`, hit: { x: x + BOX + 6, y: yy + 9, w: w - BOX - 6, h: h - 9 } });
          },
        },
        { label: "Tape No.", ref: `${p}_tape`, w: 0.14, editLabel: `${W} Tape No.` },
      ],
      MARGIN,
      y,
      BODY_W,
      23,
    );
  }

  // Supervisor attestation + sign-off
  const ah = 44;
  box(ctx, MARGIN, y, BODY_W, ah, CELL_BG);
  UOF_ATTEST.forEach((a, i) => checkOpt(ctx, a.id, a.label, MARGIN + 10, y + 13 + i * 12, 6.5));
  y += ah;
  y = cellRow(
    ctx,
    [
      { label: "Investigating Supervisor", ref: "sup_name", w: 0.62 },
      { label: "Serial No.", ref: "sup_serial", w: 0.18 },
      { label: "Date", ref: "sup_date", w: 0.2, kind: "date" },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );
  y = cellRow(
    ctx,
    [
      { label: "Watch Commander/OIC Approving", ref: "wc_name", w: 0.36 },
      {
        w: 0.26,
        draw: (c, x, yy, w, h) => {
          box(c, x, yy, w, h, CELL_BG);
          checkOpt(c, "wc_reviewed", "I have reviewed all reports\nrelated to this use of force.", x + 4, yy + 9, 6, { editLabel: "Watch Commander: reviewed all reports" });
        },
      },
      { label: "Serial No.", ref: "wc_serial", w: 0.18 },
      { label: "Date", ref: "wc_date", w: 0.2, kind: "date" },
    ],
    MARGIN,
    y,
    BODY_W,
    24,
  );
  return y - oy;
}

// ── Page 2: control of subject, activity, type of force, body diagram ────────
let uofDiagramBox = null; // logical document box of the figures, for the overlay

function drawPage2(ctx, oy) {
  let y = sheetHead(ctx, oy + MARGIN, 2);

  // Control of subject (left) | type of activity (right)
  const topH = 198;
  const leftW = Math.round(BODY_W * 0.63);
  const rightW = BODY_W - leftW;
  const L = MARGIN + 4;
  const LX = MARGIN + leftW;
  box(ctx, MARGIN, y, leftW, topH, CELL_BG);
  text(ctx, "CONTROL OF SUBJECT", MARGIN + leftW / 2, y + 10, 8, { bold: true, align: "center" });
  hline(ctx, MARGIN, y + 13, leftW, 0.6);

  labelBlank(ctx, "Last UOF that controlled the suspect:", "last_uof", L, y + 26, leftW - 10);
  let x = runs(ctx, [{ s: "Secondary Restraint Device Used?" }], L, y + 40, OPT_PX) + 6;
  x = yesNo(ctx, "srd", x, y + 40, "Secondary Restraint Device Used", { gap: 30 }) + 10;
  labelBlank(ctx, "If yes, list device used", "srd_device", x, y + 40, LX - x - 6, { editLabel: "Secondary Restraint Device" });
  text(ctx, "Part of body restrained by Secondary Restraint Device?", L, y + 54, OPT_PX);
  let px = L;
  UOF_RESTRAINT_PARTS.forEach((it) => {
    const end = checkOpt(ctx, `srd_part_${it.code}`, it.label, px, y + 66, OPT_PX, { editLabel: `Restrained: ${it.label}` });
    if (it.text) blank(ctx, `srd_part_${it.code}_text`, end + 4, y + 66, LX - end - 10, { label: "Restrained: Other (specify)" });
    px = end + 22;
  });
  x = runs(ctx, [{ s: "Placed in upright seated position?" }], L, y + 80, OPT_PX) + 6;
  x = yesNo(ctx, "upright", x, y + 80, "Placed in upright seated position", { gap: 30 });
  text(ctx, "(If no, explain in narrative.)", x + 10, y + 80, OPT_PX);
  labelBlank(ctx, "Time restrained with Secondary Restraint Device:", "srd_time", L, y + 94, leftW - 10);

  // Warning (left of the split) | source of activity (right of the split)
  const sy = y + 102;
  const warnW = Math.round(leftW * 0.6);
  hline(ctx, MARGIN, sy, leftW, 0.6);
  ctx.fillStyle = "#000";
  ctx.fillRect(MARGIN + warnW, sy, 0.6, topH - (sy - y));
  let wy = para(ctx, "Was a warning required (i.e., TASER, impact device, less lethal munitions, bean bag shotgun involved)?", L, sy + 10, warnW - 10, 6.3);
  yesNo(ctx, "warn_req", L, wy + 2, "Warning required", { gap: 32 });
  x = runs(ctx, [{ s: "If required, was a warning given?" }], L, wy + 16, 6.3) + 6;
  yesNo(ctx, "warn_given", x, wy + 16, "Warning given", { gap: 30 });
  wy += 28;
  runs(ctx, [{ s: "Under " }, { s: "Investigating Supervisor Notes", bold: true, italic: true }, { s: " heading in" }], L, wy, 6);
  para(ctx, "narrative, document warning given and name of warning officer, or provide an explanation if warning was required and not given.", L, wy + 7.6, warnW - 10, 6);

  const sx = MARGIN + warnW + 6;
  text(ctx, "SOURCE OF ACTIVITY", MARGIN + warnW + (leftW - warnW) / 2, sy + 11, 7.5, { bold: true, align: "center" });
  text(ctx, "(Check all that apply.)", MARGIN + warnW + (leftW - warnW) / 2, sy + 19, 6.2, { align: "center" });
  checkList(ctx, "src", UOF_SOURCE, sx, sy + 32, 12, LX - 6, OPT_PX);

  // Type of activity
  box(ctx, LX, y, rightW, topH, CELL_BG);
  text(ctx, "TYPE OF ACTIVITY", LX + rightW / 2, y + 10, 8, { bold: true, align: "center" });
  text(ctx, "(Check all that apply.)", LX + rightW / 2, y + 18, 6.2, { align: "center" });
  const colW = (rightW - 10) / 2;
  UOF_ACTIVITY.forEach((it, i) => {
    const ax = LX + 6 + (i % 2) * colW;
    const ab = y + 34 + Math.floor(i / 2) * 14.6;
    const end = checkOpt(ctx, `act_${it.code}`, it.label, ax, ab, OPT_PX);
    if (it.text) blank(ctx, `act_${it.code}_text`, end + 4, ab, ax + colW - end - 10, { label: "Activity: Other (specify)" });
  });
  y += topH;

  // Type of force used
  y = sectionBar(ctx, y, "TYPE OF FORCE USED", [{ s: "(Check all that apply.)", bold: true }]);
  const fH = 262;
  const cw = [0.22, 0.19, 0.22, 0.37].map((f) => Math.round(BODY_W * f));
  cw[3] = BODY_W - cw[0] - cw[1] - cw[2];
  const cx = [MARGIN, MARGIN + cw[0], MARGIN + cw[0] + cw[1], MARGIN + cw[0] + cw[1] + cw[2]];
  cw.forEach((w, i) => box(ctx, cx[i], y, w, fH, CELL_BG));
  const head = (str, x0, base) => text(ctx, str, x0, base, 7.8, { bold: true });

  // Column 1: joint locks + motion
  head("JOINT LOCKS", cx[0] + 5, y + 12);
  let b = checkList(ctx, "jl", UOF_JOINT_LOCKS, cx[0] + 6, y + 25, 12.5, cx[1] - 6, OPT_PX);
  head("MOTION", cx[0] + 5, b + 4);
  checkList(ctx, "mo", UOF_MOTION, cx[0] + 6, b + 17, 13.2, cx[1] - 6, OPT_PX);

  // Column 2: device + body area affected
  head("DEVICE", cx[1] + 5, y + 12);
  b = checkList(ctx, "dev", UOF_DEVICE, cx[1] + 6, y + 25, 13.5, cx[2] - 6, OPT_PX);
  head("BODY AREA AFFECTED", cx[1] + 5, b + 6);
  checkList(ctx, "ba", UOF_BODY_AREA, cx[1] + 6, b + 19, 13, cx[2] - 6, OPT_PX);

  // Column 3: chemical agent
  const c3 = cx[2] + 5;
  const c3w = cw[2] - 10;
  head("CHEMICAL AGENT", c3, y + 12);
  text(ctx, "Brand of Spray", c3, y + 24, OPT_PX);
  blank(ctx, "ca_brand", c3, y + 36, c3w, { label: "Brand of Spray" });
  labelBlank(ctx, "Model", "ca_model", c3, y + 50, c3w);
  labelBlank(ctx, "Manufacture date", "ca_mfg", c3, y + 64, c3w);
  text(ctx, "OR", c3, y + 74, OPT_PX, { bold: true });
  labelBlank(ctx, "Expiration date", "ca_exp", c3, y + 85, c3w);
  labelBlank(ctx, "Number of times sprayed", "ca_times", c3, y + 99, c3w);
  text(ctx, "Distance", c3 + 30, y + 112, OPT_PX);
  text(ctx, "Duration", c3 + 70, y + 112, OPT_PX);
  [1, 2, 3].forEach((n) => {
    const base = y + 112 + n * 12;
    text(ctx, UOF_ORD[n - 1], c3, base, OPT_PX);
    blank(ctx, `ca_d${n}`, c3 + 20, base, 26, { label: `Spray ${UOF_ORD[n - 1]} distance (ft)` });
    text(ctx, "FT.", c3 + 49, base, OPT_PX);
    blank(ctx, `ca_t${n}`, c3 + 64, base, 26, { label: `Spray ${UOF_ORD[n - 1]} duration (sec)` });
    text(ctx, "SEC.", c3 + 93, base, OPT_PX);
  });
  text(ctx, "Was spray effective?", c3, y + 162, OPT_PX);
  yesNo(ctx, "ca_eff", c3 + 16, y + 174, "Spray effective", { upper: true, gap: 34 });
  text(ctx, "If no, why not?", c3, y + 188, OPT_PX);
  blank(ctx, "ca_why", c3, y + 202, c3w, { label: "Spray: if no, why not?" });
  text(ctx, "Residual effects on officers", c3, y + 236, OPT_PX);
  blank(ctx, "ca_residual", c3, y + 250, c3w, { label: "Residual effects on officers" });

  // Column 4: TASER
  const c4 = cx[3] + 6;
  const c4r = X1 - 6;
  head("TASER", c4, y + 12);
  labelBlank(ctx, "Number of cartridges fired", "tz_cart", c4, y + 27, 130, { editLabel: "TASER cartridges fired" });
  text(ctx, "Distance to suspect (in feet)", c4, y + 41, OPT_PX);
  const dw = (c4r - c4) / 4;
  UOF_ORD.slice(0, 4).forEach((o, i) => labelBlank(ctx, o, `tz_d${i + 1}`, c4 + i * dw, y + 55, dw - 6, { editLabel: `TASER ${o} distance (ft)` }));
  text(ctx, "Skin penetrated?", c4, y + 70, OPT_PX);
  yesNo(ctx, "tz_skin", c4r - 62, y + 70, "TASER skin penetrated", { upper: true, gap: 34 });
  x = runs(ctx, [{ s: "Time for TASER to arrive at scene:" }], c4, y + 85, OPT_PX) + 4;
  blank(ctx, "tz_arrive", x, y + 85, 26, { label: "Time for TASER to arrive (min)" });
  text(ctx, "Min.", x + 30, y + 85, OPT_PX);
  text(ctx, "Was TASER effective?", c4, y + 100, OPT_PX);
  yesNo(ctx, "tz_eff", c4r - 62, y + 100, "TASER effective", { upper: true, gap: 34 });
  text(ctx, "If no, why not?", c4, y + 114, OPT_PX);
  multiline(ctx, "tz_why", c4 - 2, y + 117, c4r - c4 + 4, 86, "TASER: if no, why not?", 7);
  labelBlank(ctx, "TASER No.", "tz_no", c4, y + 222, (c4r - c4) * 0.5 - 6);
  labelBlank(ctx, "Brand", "tz_brand", c4 + (c4r - c4) * 0.5, y + 222, (c4r - c4) * 0.5, { editLabel: "TASER Brand" });
  labelBlank(ctx, "Type", "tz_type", c4, y + 242, c4r - c4, { editLabel: "TASER Type" });
  y += fH;

  // Less lethal (left) | body diagram (right)
  const bH = 238;
  const llW = Math.round(BODY_W * 0.42);
  const dX = MARGIN + llW;
  const dW = BODY_W - llW;
  box(ctx, MARGIN, y, llW, bH, CELL_BG);
  const l = MARGIN + 6;
  const lr = dX - 6;
  checkOpt(ctx, "ll_beanbag", "BEANBAG SHOTGUN", l, y + 14, 7.8, { bold: true });
  const oe = checkOpt(ctx, "ll_other", "OTHER LESS LETHAL DEVICE(S)", l, y + 32, 7.8, { bold: true });
  blank(ctx, "ll_other_text", oe + 5, y + 32, lr - oe - 5, { label: "Other less lethal device(s)" });
  labelBlank(ctx, "Number of Less Lethal Device(s) rounds fired", "ll_rounds", l, y + 48, 180, { editLabel: "Less lethal rounds fired" });
  text(ctx, "Distance to suspect (in feet)", l, y + 62, OPT_PX);
  const lw = (lr - l) / 4;
  UOF_ORD.forEach((o, i) => {
    const row = Math.floor(i / 4);
    labelBlank(ctx, o, `ll_d${i + 1}`, l + (i % 4) * lw, y + 76 + row * 14, lw - 6, { editLabel: `Less lethal ${o} distance (ft)` });
  });
  x = runs(ctx, [{ s: "Skin penetrated?" }], l, y + 108, OPT_PX) + 10;
  yesNo(ctx, "ll_skin", x, y + 108, "Less lethal skin penetrated", { upper: true, gap: 34 });
  x = runs(ctx, [{ s: "Time for Less Lethal Device to arrive at scene:" }], l, y + 124, OPT_PX) + 4;
  blank(ctx, "ll_arrive", x, y + 124, 24, { label: "Time for less lethal device to arrive (min)" });
  text(ctx, "Minutes", x + 28, y + 124, OPT_PX);
  x = runs(ctx, [{ s: "Was it effective?" }], l, y + 140, OPT_PX) + 10;
  yesNo(ctx, "ll_eff", x, y + 140, "Less lethal effective", { upper: true, gap: 34 });
  text(ctx, "If no, why not?", l, y + 155, OPT_PX);
  multiline(ctx, "ll_why", l - 2, y + 158, lr - l + 4, bH - 164, "Less lethal: if no, why not?", 7);

  // Body diagram. No canvas-edit field may sit inside figBox - the overlay
  // owns clicks there.
  box(ctx, dX, y, dW, bH, CELL_BG);
  const legendH = 30;
  const figBox = { x: dX + 6, y: y + 4, w: dW - 12, h: bH - legendH - 6 };
  GumaBodyDiagram.draw(ctx, figBox, uofDiagram);
  if (REG) uofDiagramBox = figBox;
  const ly = y + bH - legendH + 6;
  const lx2 = dX + 6;
  text(ctx, "Use the following codes:  BB- Beanbag,  T - TASER,  CA - Chemical Agent", lx2, ly + 2, 5.8);
  text(ctx, "Show Dart / Beanbag S/G point of contact and indicate (BB-1, BB-2, BB-3, etc.)", lx2, ly + 10, 5.8);
  text(ctx, "Shade other device(s) such as Chemical Agent", lx2, ly + 18, 5.8);
  const swX = X1 - 92;
  GumaBodyDiagram.swatch(ctx, swX, ly + 4, 7, "CA");
  text(ctx, "CA", swX + 10, ly + 10, 5.8, { bold: true });
  GumaBodyDiagram.swatch(ctx, swX + 30, ly + 4, 7, "OTHER");
  text(ctx, "Other", swX + 40, ly + 10, 5.8, { bold: true });
  y += bH;
  return y - oy;
}

// ── Page 3: canvass, narrative, Level I / II criteria ────────────────────────
function narrativeBox(ctx, y, h, ref, label, title, rest) {
  box(ctx, MARGIN, y, BODY_W, h, CELL_BG);
  ctx.font = arial(6.8);
  const titleW = textW(ctx, title, 8.2, true) + 6;
  text(ctx, title, MARGIN + 3, y + 10, 8.2, { bold: true });
  // The note continues after the bold title and wraps under it.
  ctx.font = arial(6.8);
  const first = GumaFit.wrapLines(ctx, rest, BODY_W - titleW - 8, 99);
  let base = y + 10;
  let used = 0;
  if (first.length) {
    text(ctx, first[0], MARGIN + 3 + titleW, base, 6.8);
    used = first[0].split(/\s+/).length;
  }
  const tail = rest.split(/\s+/).slice(used).join(" ");
  if (tail) base = para(ctx, tail, MARGIN + 3, base + 9, BODY_W - 8, 6.8) - 8.4;
  const top = base + 4;
  multiline(ctx, ref, MARGIN + 3, top, BODY_W - 6, y + h - top - 3, label, 8);
  return y + h;
}

/** One Level I / II column of the criteria table. Returns the bottom. */
function criteriaColumn(ctx, x, y, w, lvl, criteria, headings, prefix) {
  const iw = w - 12;
  let b = y + 10;
  text(ctx, "Criteria:", x + 4, b, 6.5, { italic: true });
  b += 9;
  criteria.forEach((c) => {
    text(ctx, "*", x + 10, b, 6.3);
    b = para(ctx, c, x + 16, b, iw - 12, 6.3, { lh: 7.6 }) + 1;
  });
  b += 6;
  b = para(ctx, UOF_ATTACH_NOTE(lvl), x + 6, b, iw - 4, 6.3, { italic: true, lh: 7.6 }) + 6;
  headings.forEach((h) => {
    const end = checkOpt(ctx, `${prefix}_${h.code}`, h.title, x + 6, b, 6.8, { bold: true, editLabel: `Level ${lvl}: ${h.title}` });
    hline(ctx, x + 6 + BOX + 3, b + 1.2, end - (x + 6 + BOX + 3), 0.5);
    if (h.note) text(ctx, h.note, end + 4, b, 6.3);
    b += 8.5;
    (h.body || []).forEach((ln) => {
      const indent = ln.startsWith("  >") ? 22 : 16;
      b = para(ctx, ln.trim(), x + indent, b, iw - indent + 4, 6.2, { lh: 7.4 });
    });
    b += 4;
  });
  return b;
}

function drawPage3(ctx, oy) {
  let y = sheetHead(ctx, oy + MARGIN, 3);
  y = narrativeBox(ctx, y, 150, "canvass", "Area canvassed", "AREA CANVASSED FOR WITNESSES AND EVIDENCE.", "Include scope of search and evidence located. If unable to locate witnesses, explain.");
  y = narrativeBox(
    ctx,
    y,
    136,
    "not_interviewed",
    "Witnesses not interviewed separately",
    "WITNESSES NOT INTERVIEWED SEPARATELY.",
    "List all employees/ witnesses/ suspects that were not interviewed separately, and explain. Use Continuation Sheet if necessary.",
  );
  y = narrativeBox(
    ctx,
    y,
    150,
    "overview",
    "Incident overview",
    "INCIDENT OVERVIEW (For Level I Incidents only).",
    "Without offering opinion or conclusions, briefly summarize the incident and/or any relevant actions that preceded or followed the incident, to include techniques and tactics used by involved employee(s).",
  );

  // Level I | Level II criteria. Measured first, so the boxes fit the text.
  const half = BODY_W / 2;
  const titleH = 14;
  const prevReg = REG;
  REG = false;
  const mctx = measureCanvas.getContext("2d");
  const hL = criteriaColumn(mctx, 0, 0, half, "I", UOF_L1_CRITERIA, UOF_L1_HEADINGS, "l1");
  const hR = criteriaColumn(mctx, 0, 0, half, "II", UOF_L2_CRITERIA, UOF_L2_HEADINGS, "l2");
  REG = prevReg;
  const colH = Math.max(hL, hR) + 4;
  [
    { x: MARGIN, title: "LEVEL I INCIDENT", lvl: "I", crit: UOF_L1_CRITERIA, heads: UOF_L1_HEADINGS, prefix: "l1" },
    { x: MARGIN + half, title: "LEVEL II INCIDENT", lvl: "II", crit: UOF_L2_CRITERIA, heads: UOF_L2_HEADINGS, prefix: "l2" },
  ].forEach((c) => {
    box(ctx, c.x, y, half, titleH, CELL_BG);
    text(ctx, c.title, c.x + half / 2, y + 10, 8, { bold: true, align: "center" });
    box(ctx, c.x, y + titleH, half, colH, CELL_BG);
    criteriaColumn(ctx, c.x, y + titleH, half, c.lvl, c.crit, c.heads, c.prefix);
  });
  y += titleH + colH;
  return y - oy;
}

// ── Main draw ─────────────────────────────────────────────────────────────────
const UOF_DRAW = { p1: drawPage1, p2: drawPage2, p3: drawPage3 };

let uofPageBounds = []; // [{ key, y, h }] in logical px, gap excluded
let uofDocH = 0;
const measureCanvas = document.createElement("canvas");
measureCanvas.width = 1;
measureCanvas.height = 1;

function drawForm() {
  window.GumaCanvasEdit?.begin({ scale: SCALE });

  // Measuring pass: same code path, nothing registers, nothing visible lands.
  REG = false;
  const mctx = measureCanvas.getContext("2d");
  const heights = UOF_PAGES.map((pg) => Math.max(PAGE_H, Math.ceil(UOF_DRAW[pg.key](mctx, 0) + MARGIN)));
  REG = true;

  uofPageBounds = [];
  let acc = 0;
  UOF_PAGES.forEach((pg, i) => {
    uofPageBounds.push({ key: pg.key, y: acc, h: heights[i] });
    acc += heights[i] + (i < UOF_PAGES.length - 1 ? PAGE_GAP : 0);
  });
  uofDocH = acc;

  const canvas = document.getElementById("docCanvas");
  canvas.width = DOC_W * SCALE;
  canvas.height = uofDocH * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = GAP_BG;
  ctx.fillRect(0, 0, DOC_W, uofDocH);

  UOF_PAGES.forEach((pg, i) => {
    const b = uofPageBounds[i];
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, b.y, DOC_W, b.h);
    UOF_DRAW[pg.key](ctx, b.y);
  });

  window.GumaCanvasEdit?.end();
  uofOverlay?.sync();
}

/** Bring a page into view inside the preview scroll box. */
function scrollToPage(key) {
  const b = uofPageBounds.find((x) => x.key === key);
  const wrap = document.getElementById("uofWrap");
  const canvas = document.getElementById("docCanvas");
  if (!b || !wrap || !canvas || !uofDocH) return;
  if (wrap.scrollHeight <= wrap.clientHeight) return;
  const k = canvas.clientHeight / uofDocH;
  wrap.scrollTo({ top: b.y * k, behavior: "smooth" });
}

// ── Per-page export ──────────────────────────────────────────────────────────
/** A fresh offscreen canvas holding just one sheet of the document. */
function uofPageCanvas(i) {
  const src = document.getElementById("docCanvas");
  const b = uofPageBounds[i];
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

// A multi-sheet PNG pasted into Discord is unreadable, so each sheet ships on
// its own (the modal passes the visible page). History stores the full stack.
async function downloadPng(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && uofPageBounds[pageIndex];
  const a = document.createElement("a");
  a.download = perPage ? `use-of-force-report-page-${pageIndex + 1}.png` : "use-of-force-report.png";
  a.href = (perPage ? uofPageCanvas(pageIndex) : canvas).toDataURL("image/png");
  a.click();
  await GumaHistoryWiring.save(canvas);
}

async function copyDocToClipboard(pageIndex) {
  drawForm();
  const canvas = document.getElementById("docCanvas");
  const perPage = Number.isInteger(pageIndex) && uofPageBounds[pageIndex];
  if (!(await GumaClipboard.copyCanvas(perPage ? uofPageCanvas(pageIndex) : canvas))) return;

  const newCount = await window.GumaCounters?.trackDownload(UOF_KEY);
  const countEl = document.getElementById("downloadCount");
  if (newCount !== null && countEl) countEl.textContent = window.GumaCounters.fmt(newCount);
  await GumaHistoryWiring.save(canvas);
  GumaClipboard.flash(document.getElementById("copyDiscordBtn"));
}

// ── Auto-filled fields ────────────────────────────────────────────────────────
const UOF_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseIsoDate(raw) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function autoDayOfWeek() {
  const d = parseIsoDate(uofRawVal("date_inc"));
  if (d) document.getElementById("dow").value = UOF_DAYS[d.getDay()];
}

/** Suspect age on the incident date (today when no date is set yet). */
function autoSuspectAge() {
  const dob = parseIsoDate(uofRawVal("s_dob"));
  if (!dob) return;
  const on = parseIsoDate(uofRawVal("date_inc")) || new Date();
  let age = on.getFullYear() - dob.getFullYear();
  if (on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate())) age--;
  if (age >= 0 && age < 130) document.getElementById("s_age").value = String(age);
}

// ── Body diagram state + editors ─────────────────────────────────────────────
let uofDiagram = GumaBodyDiagram.empty();
let uofTool = "T";
let uofWidget = null;
let uofOverlay = null;
let uofWidgetTools = null;
let uofLiveRaf = 0;

/** Single write path for both editors. Live = mid-drag, coalesced to rAF. */
function setDiagram(next, opts) {
  uofDiagram = next;
  if (opts && opts.live) {
    if (uofLiveRaf) return;
    uofLiveRaf = requestAnimationFrame(() => {
      uofLiveRaf = 0;
      uofWidget?.paint();
      drawForm();
    });
    return;
  }
  uofWidget?.paint();
  drawForm();
}

function setTool(tool) {
  uofTool = tool;
  uofWidgetTools?.set(tool);
  uofOverlay?.set(tool);
}

function clearDiagram() {
  setDiagram(GumaBodyDiagram.empty());
}

// ── Init ─────────────────────────────────────────────────────────────────────
buildPanels();
const uofForm = document.querySelector(".guma-panel-form");
GumaFit.applyCaps(uofForm, UOF_MAXLEN);
GumaRadio.makeClearable(uofForm);
renderTabs();

uofWidgetTools = GumaBodyDiagram.toolbar(document.getElementById("bdTools"), {
  btnClass: "guma-seg-btn",
  onTool: setTool,
  onClear: clearDiagram,
});
// Taller than the document's figure box so the figures read on a phone. Marks
// are stored relative to each figure, so they land in the same spot anyway.
uofWidget = GumaBodyDiagram.createWidget({
  canvas: document.getElementById("bdCanvas"),
  width: 317,
  height: 300,
  getState: () => uofDiagram,
  setState: setDiagram,
  getTool: () => uofTool,
});
document.getElementById("bdClear").addEventListener("click", clearDiagram);

// Auto-fills run before the generic redraw listener below, so the redraw
// already sees the new value.
uofForm.addEventListener("input", (e) => {
  const id = e.target.id;
  if (id === "date_inc") autoDayOfWeek();
  if (id === "s_dob" || id === "date_inc") autoSuspectAge();
});
["input", "change"].forEach((type) => uofForm.addEventListener(type, refreshPreview));
uofForm.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-uof-tab]");
  if (tab) showTab(tab.dataset.uofTab);
});

drawForm();

// ── Saved reports: serialize / hydrate / wiring ───────────────
// The form is generated from tables, so the state is every id'd control under
// the form panel, plus the diagram (which has no input of its own).
function uofControls() {
  return document.querySelectorAll(".guma-panel-form input[id], .guma-panel-form select[id], .guma-panel-form textarea[id]");
}

function uofSerializeState() {
  const values = {};
  uofControls().forEach((el) => {
    values[el.id] = el.type === "checkbox" || el.type === "radio" ? el.checked : el.value;
  });
  return { values, diagram: GumaBodyDiagram.normalize(uofDiagram) };
}

function uofHydrateState(payload) {
  if (!payload) return;
  window.GumaCanvasEdit?.cancelEdit();
  const v = payload.values || {};
  uofControls().forEach((el) => {
    const saved = v[el.id];
    if (el.type === "checkbox" || el.type === "radio") el.checked = !!saved;
    else el.value = saved == null ? "" : saved;
  });
  uofDiagram = GumaBodyDiagram.normalize(payload.diagram);
  uofWidget?.paint();
  drawForm();
}

function uofBuildLabel(payload) {
  const v = payload.values || {};
  const dr = (v.dr_no || "").trim();
  const suspect = (v.s_name || "").trim();
  const head = dr ? "DR " + dr : "Use of Force";
  return [head, suspect, (v.date_inc || "").trim()].filter(Boolean).join(" - ");
}

GumaHistoryWiring.register({
  key: UOF_KEY,
  noun: "report",
  serialize: uofSerializeState,
  hydrate: uofHydrateState,
  buildLabel: uofBuildLabel,
  // no buildFaction - the agency is free text on this report, not a faction
});

// ── Export + WYSIWYG editing wiring ───────────────────────────────────────────
// The preview modal delegates export here so counters and history keep firing.
window.GumaExport = {
  download: downloadPng,
  copy: copyDocToClipboard,
  canvas: () => document.getElementById("docCanvas"),
  pages: () => {
    drawForm();
    return uofPageBounds.map((b, i) => ({ label: `${i + 1}. ${UOF_PAGES[i].tab}`, canvas: uofPageCanvas(i) }));
  },
};

window.GumaCanvasEdit?.attach({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  host: uofForm,
  toolbar: document.getElementById("ceToolbar"),
  redraw: drawForm,
  key: UOF_KEY,
});

// Attached after canvas-edit, so on the canvas its pointer handlers run first
// and the diagram's cursor wins inside the figure box.
uofOverlay = GumaBodyDiagram.attachOverlay({
  canvas: document.getElementById("docCanvas"),
  frame: document.getElementById("ceFrame"),
  scale: SCALE,
  getBox: () => uofDiagramBox,
  getState: () => uofDiagram,
  setState: setDiagram,
  getTool: () => uofTool,
  onTool: setTool,
  onClear: clearDiagram,
  enabled: () => document.documentElement.classList.contains("guma-ce-on"),
});
setTool(uofTool);
uofOverlay.sync();
