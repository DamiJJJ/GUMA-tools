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
  const W = 840,
    H = 680;
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
    photoH = H - topOffset - 24,
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
      my = H - 64,
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

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
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
