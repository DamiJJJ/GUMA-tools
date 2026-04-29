let FACTION_KEY;
let faction;

// ── Switch faction ────────────────────────────────────────────
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

  document.querySelectorAll(".faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === key);
  });

  populateSelects();
  updateEmploymentRows();
  randomizePay();
}

function applyCustomFaction() {
  const name = document.getElementById("customFactionName")?.value.trim() || "Custom Faction";
  const rank = document.getElementById("customRank").value.trim();
  const div = document.getElementById("customDivision").value.trim();
  const domain = document.getElementById("customEmailDomain").value.trim();

  // Override global faction object with custom values
  faction = {
    name: name || "Custom Faction",
    short: name || "CUSTOM",
    emailDomain: domain || "faction.gov",
    cardBg: "#f0f0f0",
    cardBorder: "#888888",
    ranks: rank ? [rank] : ["Officer"],
    divisions: div ? [div] : ["General Division"],
    seniorRanks: [],
    midRanks: [],
    icon: null,
  };

  // Repopulate selects with single custom values
  const rankSel = document.getElementById("rank");
  rankSel.innerHTML = "";
  faction.ranks.forEach((r) => {
    const o = document.createElement("option");
    o.value = r;
    o.text = r;
    o.selected = true;
    rankSel.appendChild(o);
  });

  const divSel = document.getElementById("division");
  divSel.innerHTML = "";
  faction.divisions.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.text = d;
    divSel.appendChild(o);
  });

  generateCard();
}

// ── Populate selects from faction data ────────────────────────
function populateSelects() {
  const rankSel = document.getElementById("rank");
  rankSel.innerHTML = "";
  faction.ranks.forEach((r, i) => {
    const o = document.createElement("option");
    o.value = r;
    o.text = r;
    if (i === 0) o.selected = true;
    rankSel.appendChild(o);
  });

  const divSel = document.getElementById("division");
  divSel.innerHTML = "";
  faction.divisions.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.text = d;
    divSel.appendChild(o);
  });
}

// ── Year select ───────────────────────────────────────────────
const yearSel = document.getElementById("yearHired");
for (let y = 2026; y >= 1980; y--) {
  const o = document.createElement("option");
  o.value = y;
  o.text = y;
  yearSel.appendChild(o);
}

// ── Photo preview ─────────────────────────────────────────────────────────────
let photoDataURL = null;

function previewPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    photoDataURL = ev.target.result;
    const prev = document.getElementById("photoPreview");
    prev.src = photoDataURL;
    prev.style.display = "block";
    document.getElementById("uploadText").textContent = file.name;
  };
  reader.readAsDataURL(file);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcTotal() {
  const fields = ["payRegular", "payOvertime", "payOther", "payHealth"];
  let total = 0;
  fields.forEach((id) => {
    const raw = document.getElementById(id).value.replace(/[$,\s]/g, "");
    const n = parseFloat(raw);
    if (!isNaN(n) && isFinite(n)) total += n;
  });
  return total > 0 ? fmt(total) : "N/A";
}

// ── Randomize pay ─────────────────────────────────────────────────────────────
function randomizePay() {
  const rank = document.getElementById("rank").value;

  let base;
  if (faction.seniorRanks.includes(rank)) base = 130000 + Math.random() * 60000;
  else if (faction.midRanks.includes(rank)) base = 95000 + Math.random() * 40000;
  else base = 70000 + Math.random() * 50000;

  const ot = base * (0.5 + Math.random() * 0.5);
  const other = 5000 + Math.random() * 20000;
  const health = 18000 + Math.random() * 10000;

  document.getElementById("payRegular").value = fmt(base);
  document.getElementById("payOvertime").value = fmt(ot);
  document.getElementById("payOther").value = fmt(other);
  document.getElementById("payHealth").value = fmt(health);
  document.getElementById("payRetirement").value = "unknown";

  generateCard();
}

// ── Card generator ────────────────────────────────────────────────────────────
function generateCard() {
  const canvas = document.getElementById("cardCanvas");
  const ctx = canvas.getContext("2d");
  const W = 840;
  const BASE_H = 680;

  const empEntries = getEmploymentHistoryData();
  const EMP_SECTION_H = empEntries && empEntries.length > 0 ? 24 + 32 + 24 + 34 + empEntries.length * 38 + 16 : 0;
  const H = BASE_H + EMP_SECTION_H;

  canvas.width = W;
  canvas.height = H;

  const name = document.getElementById("fullName").value || "John Nolan";
  const rank = document.getElementById("rank").value;
  const division = document.getElementById("division").value;
  const serial = document.getElementById("serial").value || "00000";
  const badge = document.getElementById("badge").value || "00000";
  const ethnicity = document.getElementById("ethnicity").value;
  const gender = document.getElementById("gender").value;
  const age = document.getElementById("age").value || "??";
  const yearHired = document.getElementById("yearHired").value;
  const height = document.getElementById("height").value || "??";
  const weight = document.getElementById("weight").value || "??";
  const payReg = document.getElementById("payRegular").value || "N/A";
  const payOT = document.getElementById("payOvertime").value || "N/A";
  const payOther = document.getElementById("payOther").value || "N/A";
  const payHealth = document.getElementById("payHealth").value || "N/A";
  const payRet = document.getElementById("payRetirement").value || "unknown";
  const total = calcTotal();
  const year = new Date().getFullYear() - 1;
  const email = serial + "@" + faction.emailDomain;

  const topOffset = 82;
  const photoW = 356,
    photoH = BASE_H - topOffset - 24,
    photoX = 24,
    photoY = topOffset;
  const rx = photoX + photoW + 20;
  const rw = W - rx - 20;

  // ── Draw label + value pair on canvas ──
  function lv(label, val, x, y, maxWidth = rw) {
    const fullText = label + ":  " + val;
    let fontSize = 20;
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;

    while (ctx.measureText(fullText).width > maxWidth && fontSize > 11) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    }
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(label + ": ", x, y);
    const lw = ctx.measureText(label + ": ").width;

    // Switch to regular weight for the value.
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = "#111";
    ctx.fillText(val, x + lw, y);
  }

  // ── Draw text layer ──
  function drawText() {
    const maxNameWidth = W - 48;
    let nameFontSize = 46;
    const minFontSize = 18;

    ctx.font = `bold ${nameFontSize}px 'Courier New', monospace`;
    while (ctx.measureText(name.toUpperCase()).width > maxNameWidth && nameFontSize > minFontSize) {
      nameFontSize -= 1;
      ctx.font = `bold ${nameFontSize}px 'Courier New', monospace`;
    }
    ctx.textAlign = "center";
    // ctx.font = "bold 46px 'Courier New', monospace";
    ctx.fillStyle = "#111";
    ctx.fillText(name.toUpperCase(), W / 2, 56);

    let y = 100;
    const lh = 32;

    lv("Rank", rank, rx, y);
    y += lh;
    lv("Division", division, rx, y);
    y += lh;
    lv("Email", email, rx, y);
    y += lh + 8;

    const half = rw / 2 - 10;
    lv("Serial", serial, rx, y, half);
    lv("Badge", badge, rx + 210, y, half);
    y += lh;
    lv("Ethnicity", ethnicity, rx, y, half);
    lv("Gender", gender, rx + 210, y, half);
    y += lh;
    lv("Current Age", age, rx, y, half);
    lv("Year Hired", yearHired, rx + 210, y, half);
    y += lh;
    lv("Height", height, rx, y, half);
    lv("Weight", weight + " lbs", rx + 210, y, half);
    y += lh + 12;

    // Payments box
    const bx = rx,
      by = y,
      bw = rw,
      bh = 256;
    ctx.fillStyle = faction.cardBg;
    ctx.strokeStyle = faction.cardBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 17px 'Courier New', monospace";
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.fillText("PAYMENTS FOR  " + year + "  " + (year - 1) + "  " + (year - 2), bx + 16, by + 26);
    const uw = ctx.measureText("PAYMENTS FOR  ").width;
    ctx.fillStyle = "#111";
    ctx.fillRect(bx + 16 + uw, by + 30, ctx.measureText(String(year)).width, 3);

    let py = by + 60;
    const plh = 36;

    function pl(label, val) {
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.fillText("\u2022 " + label + ": ", bx + 16, py);
      const lw = ctx.measureText("\u2022 " + label + ": ").width;
      ctx.font = "22px 'Courier New', monospace";
      ctx.fillStyle = "#111";
      ctx.fillText(val, bx + 16 + lw, py);
      py += plh;
    }

    pl("Regular Pay", payReg);
    pl("Overtime Pay", payOT);
    pl("Other Pay", payOther);
    pl("Health Benefits", payHealth);
    pl("Retirement Pay", payRet);

    ctx.font = "bold 23px 'Courier New', monospace";
    ctx.fillStyle = "#111";
    ctx.fillText("\u2022 " + year + " TOTAL: " + total, bx + 16, py);

    // Misconduct button
    const mx = rx,
      my = BASE_H - 64,
      mw = rw,
      mh = 44;
    ctx.fillStyle = "#d8d0b8";
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = "#444";
    ctx.textAlign = "center";
    ctx.fillText("SEARCH MISCONDUCT RECORDS", mx + mw / 2, my + 28);

    // Draw employment history below main card
    if (empEntries && empEntries.length > 0) {
      drawEmploymentHistory(ctx, W, BASE_H, empEntries, name, serial, badge);
    }

    document.getElementById("downloadBtn").style.display = "block";
  }

  // ── Draw background + photo, then text ──
  ctx.fillStyle = "#f5f0dc";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#c8b97a";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  ctx.fillStyle = "#bbb";
  ctx.fillRect(photoX, photoY, photoW, photoH);

  if (photoDataURL) {
    const img = new Image();
    let rendered = false;
    const renderPhoto = () => {
      if (rendered || !img.naturalWidth) return;
      rendered = true;

      const ratio = img.width / img.height;
      const areaR = photoW / photoH;
      let sx, sy, sw, sh;
      if (ratio > areaR) {
        sh = img.height;
        sw = sh * areaR;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / areaR;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
      drawText();
    };

    img.onload = renderPhoto;
    img.src = photoDataURL;

    if (img.complete && img.naturalWidth > 0) renderPhoto();
  } else {
    ctx.fillStyle = "#888";
    ctx.font = "22px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("No Photo", photoX + photoW / 2, photoY + photoH / 2);
    drawText();
  }
}

// ── Download ──────────────────────────────────────────────────────────────────
function downloadCard() {
  const canvas = document.getElementById("cardCanvas");
  const a = document.createElement("a");
  a.download = "officer_card.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}

// ── Copy to Clipboard ───────────────────────────────────────────────
async function copyCardToClipboard() {
  const canvas = document.getElementById("cardCanvas");
  const btn = document.getElementById("copyDiscordBtn");
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const newCount = await window.GumaCounters?.trackDownload(window.GUMA_GENERATOR_KEY ?? "officer");
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

function discordBtnHTML() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> Copy`;
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Employment History ─────────────────────────────────────────────────────────

function toggleEmploymentHistory() {
  const section = document.getElementById("employmentHistorySection");
  const checked = document.getElementById("attachEmploymentHistory").checked;
  section.classList.toggle("hidden", !checked);
  if (checked && document.querySelectorAll(".employment-row").length === 0) {
    addEmploymentRow();
  }
  generateCard();
}

function addEmploymentRow() {
  const container = document.getElementById("employmentRows");
  const idx = container.children.length + 1;
  const rankOptions = faction.ranks.map((r) => `<option value="${r}">${r}</option>`).join("");
  const agencyName = faction ? faction.name : "";

  const row = document.createElement("div");
  row.className = "employment-row rounded-xl border border-guma-border-2 bg-guma-dark p-3";
  row.innerHTML = `
    <div class="mb-2 flex items-center justify-between">
      <span class="text-[11px] font-bold uppercase tracking-wider text-guma-gold">Entry #${idx}</span>
      <button type="button" onclick="removeEmploymentRow(this)" class="text-xs text-red-400 transition hover:text-red-300">✕ Remove</button>
    </div>
    <div class="mb-2 grid grid-cols-2 gap-2">
      <div>
        <label class="guma-label">From</label>
        <input type="date" class="guma-input emp-from" oninput="generateCard()" />
      </div>
      <div>
        <label class="guma-label">To <span class="font-normal normal-case">(empty = N/A)</span></label>
        <input type="date" class="guma-input emp-to" oninput="generateCard()" />
      </div>
    </div>
    <div class="mb-2">
      <label class="guma-label">Change</label>
      <input type="text" class="guma-input emp-change" placeholder="e.g. Promotion/Demotion (optional)" oninput="generateCard()" />
    </div>
    <div class="mb-2">
      <label class="guma-label">Agency</label>
      <input type="text" class="guma-input emp-agency" value="${agencyName}" oninput="generateCard()" />
    </div>
    <div>
      <label class="guma-label">Rank</label>
      <select class="guma-select emp-rank-select mb-1.5" onchange="generateCard()">${rankOptions}</select>
      <input type="text" class="guma-input emp-rank-custom" placeholder="Custom rank (overrides dropdown)" oninput="generateCard()" />
    </div>
  `;
  container.appendChild(row);
  renumberEmploymentRows();
  generateCard();
}

function updateEmploymentRows() {
  const rows = document.querySelectorAll(".employment-row");
  if (rows.length === 0) return;
  const rankOptions = faction.ranks.map((r) => `<option value="${r}">${r}</option>`).join("");
  const agencyName = faction ? faction.name : "";
  rows.forEach((row) => {
    row.querySelector(".emp-agency").value = agencyName;
    row.querySelector(".emp-rank-select").innerHTML = rankOptions;
  });
  generateCard();
}

function removeEmploymentRow(btn) {
  btn.closest(".employment-row").remove();
  renumberEmploymentRows();
  generateCard();
}

function renumberEmploymentRows() {
  document.querySelectorAll(".employment-row").forEach((row, i) => {
    row.querySelector("span").textContent = `Entry #${i + 1}`;
  });
}

function getEmploymentHistoryData() {
  const checkbox = document.getElementById("attachEmploymentHistory");
  if (!checkbox || !checkbox.checked) return null;
  const entries = [];
  document.querySelectorAll(".employment-row").forEach((row) => {
    const from = row.querySelector(".emp-from").value;
    const to = row.querySelector(".emp-to").value;
    const change = row.querySelector(".emp-change").value.trim();
    const agency = row.querySelector(".emp-agency").value.trim();
    const rankCustom = row.querySelector(".emp-rank-custom").value.trim();
    const rankSelect = row.querySelector(".emp-rank-select");
    const rank = rankCustom || (rankSelect ? rankSelect.value : "");
    entries.push({ from, to, change, agency, rank });
  });
  return entries;
}

function drawEmploymentHistory(ctx, W, baseH, entries, cardName, cardSerial, cardBadge) {
  const margin = 24;
  const tableX = margin;
  const tableW = W - margin * 2;
  let y = baseH + 24;

  // Separator line
  ctx.strokeStyle = "#c8b97a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y - 8);
  ctx.lineTo(W - margin, y - 8);
  ctx.stroke();

  // "EMPLOYMENT HISTORY" header
  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.fillText("EMPLOYMENT HISTORY", tableX, y + 16);
  y += 32;

  // POST ID line
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = "#555";
  const postA = String(cardSerial).replace(/\D/g, "").slice(-3).padStart(3, "0");
  const postB = String(cardBadge).replace(/\D/g, "").slice(-3).padStart(3, "0");
  ctx.fillText(`POST ID: ${postA}-${postB}   POST Name: ${cardName.toUpperCase()}`, tableX, y);
  y += 24;

  // Column definitions
  const cols = [
    { label: "From", w: 128 },
    { label: "To", w: 128 },
    { label: "Change", w: 148 },
    { label: "Agency", w: 196 },
    { label: "Rank", w: tableW - 128 - 128 - 148 - 196 },
  ];

  // Table header row
  const headerH = 34;
  ctx.fillStyle = "#ddd4b0";
  ctx.strokeStyle = "#c8b97a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tableX, y, tableW, headerH, [4, 4, 0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = "#333";
  let cx = tableX + 8;
  cols.forEach((col) => {
    ctx.textAlign = "left";
    ctx.fillText(col.label, cx, y + 22);
    cx += col.w;
  });
  y += headerH;

  // Data rows
  const rowH = 38;
  entries.forEach((entry, i) => {
    const bg = i % 2 === 0 ? "#faf6ea" : "#f0ead4";
    ctx.fillStyle = bg;
    ctx.strokeStyle = "#d8cfa0";
    ctx.lineWidth = 1;
    ctx.fillRect(tableX, y, tableW, rowH);
    ctx.strokeRect(tableX, y, tableW, rowH);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = "#111";
    cx = tableX + 8;

    const values = [entry.from || "", entry.to || "n/a", entry.change, entry.agency, entry.rank];

    values.forEach((val, vi) => {
      const maxW = cols[vi].w - 14;
      let text = val;
      ctx.font = "14px 'Courier New', monospace";
      while (ctx.measureText(text).width > maxW && text.length > 1) {
        text = text.slice(0, -1);
      }
      if (text !== val) text += "…";
      ctx.textAlign = "left";
      ctx.fillText(text, cx, y + 24);
      cx += cols[vi].w;
    });
    y += rowH;
  });

  // Bottom border
  ctx.strokeStyle = "#c8b97a";
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, baseH + 24 + 32 + 24 + headerH, tableW, entries.length * rowH);
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initGenerator({ factionType = null, defaultFaction = "lspd" } = {}) {
  const urlFaction = new URLSearchParams(window.location.search).get("faction");

  if (urlFaction && FACTIONS[urlFaction]) {
    const matchesType = factionType === null || FACTIONS[urlFaction].type === factionType;
    FACTION_KEY = matchesType ? urlFaction : defaultFaction;
  } else {
    FACTION_KEY = defaultFaction;
  }

  faction = FACTIONS[FACTION_KEY];

  buildFactionSwitcher(switchFaction, FACTION_KEY, factionType);
  populateSelects();
  randomizePay();
  generateCard();

  document.querySelector(".guma-panel").addEventListener("input", debounce(generateCard));
}
