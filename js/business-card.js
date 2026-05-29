"use strict";

// Custom factions
const BC_CUSTOM = {
  short: "Custom",
  icon: "assets/custom.png",
  emailDomain: "",
};

const BC_FACTION_ORDER = ["lspd", "lssd", "bcso", "sahp", "lscofd", "lsfd"];

// ── State ────────────────────────────────────────────────────────────────
let bcCurrentFaction = "lspd";
let bcCustomImage = null;
const bcImageCache = {};
let bcRenderToken = 0;

// ── Paper texture ──────────────────────────────────────────────
let bcPaperTexture = null;

function bcGetPaperTexture(W, H) {
  if (bcPaperTexture && bcPaperTexture.width === W && bcPaperTexture.height === H) {
    return bcPaperTexture;
  }
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const octx = off.getContext("2d");

  // Base color
  octx.fillStyle = "#efefef";
  octx.fillRect(0, 0, W, H);

  // Noise
  const imageData = octx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  octx.putImageData(imageData, 0, 0);

  // Minor spots
  octx.fillStyle = "#8a6c3a";
  octx.globalAlpha = 0.05;
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.5 + 0.4;
    octx.beginPath();
    octx.arc(x, y, r, 0, Math.PI * 2);
    octx.fill();
  }
  octx.globalAlpha = 1;

  // Vignette
  const grad = octx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.7);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(80,60,30,0.08)");
  octx.fillStyle = grad;
  octx.fillRect(0, 0, W, H);

  bcPaperTexture = off;
  return off;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function bcGetBaseFaction(key) {
  if (key === "custom") return BC_CUSTOM;
  return typeof FACTIONS !== "undefined" ? FACTIONS[key] : undefined;
}

function bcGetBcConfig(key) {
  if (key === "custom") return {};
  return (typeof FACTIONS !== "undefined" ? FACTIONS[key]?.businessCard : null) || {};
}

// ── Init ─────────────────────────────────────────────────────────────────
function bcInit() {
  const switcher = document.getElementById("bcFactionSwitcher");
  if (!switcher) return;

  const keys = [...BC_FACTION_ORDER.filter((k) => typeof FACTIONS !== "undefined" && FACTIONS[k]), "custom"];

  keys.forEach((key) => {
    const f = bcGetBaseFaction(key);
    if (!f) return;
    const iconSrc = f.icon || "assets/card_256.png";
    const label = f.short || key.toUpperCase();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "faction-btn";
    btn.dataset.faction = key;
    btn.innerHTML = `
      <img src="${iconSrc}" class="h-9 w-9 object-contain" alt="${label}" />
      <span>${label}</span>
    `;
    btn.addEventListener("click", () => bcSelectFaction(key));
    switcher.appendChild(btn);
  });

  bcSelectFaction("lspd");
}

// ── Faction selection ───────────────────────────────────────────────────
function bcSelectFaction(key) {
  bcCurrentFaction = key;
  const isCustom = key === "custom";
  const f = bcGetBaseFaction(key);

  document.querySelectorAll("#bcFactionSwitcher .faction-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.faction === key);
  });

  document.getElementById("bcCustomImagePanel").style.display = isCustom ? "block" : "none";
  document.getElementById("bcCustomHeaderPanel").style.display = isCustom ? "block" : "none";
  document.getElementById("bcCustomFooterPanel").style.display = isCustom ? "block" : "none";
  document.getElementById("bcRankRow").style.display = isCustom ? "none" : "block";
  document.getElementById("bcCustomRankRow").style.display = isCustom ? "block" : "none";
  document.getElementById("bcBadgeRow").style.display = isCustom ? "none" : "block";

  // Email domain hint
  const hint = document.getElementById("bcEmailHint");
  if (isCustom || !f?.emailDomain) {
    hint.style.display = "none";
  } else {
    hint.style.display = "block";
    document.getElementById("bcEmailDomain").textContent = "@" + f.emailDomain;
  }

  const rankSel = document.getElementById("bcRank");
  rankSel.innerHTML = "";
  if (!isCustom && Array.isArray(f?.ranks)) {
    f.ranks.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      rankSel.appendChild(opt);
    });
    rankSel.selectedIndex = Math.min(2, rankSel.options.length - 1);
  }

  const slider = document.getElementById("bcLogoScale");
  if (slider) {
    slider.value = "1";
    const display = document.getElementById("bcLogoScaleValue");
    if (display) display.textContent = "100%";
  }
  bcRender();
}

// ── Custom image upload ────────────────────────────────────────────────
function bcPreviewImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    bcCustomImage = ev.target.result;
    delete bcImageCache[bcCustomImage];
    document.getElementById("bcUploadText").textContent = "Click to change image";
    const preview = document.getElementById("bcImagePreview");
    preview.src = bcCustomImage;
    preview.classList.remove("hidden");
    bcRender();
  };
  reader.readAsDataURL(file);
}

// ── Image loader ────────────────────────────────────────────────────────
function bcLoadImage(src) {
  if (!src) return Promise.resolve(null);
  if (bcImageCache[src]) return Promise.resolve(bcImageCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      bcImageCache[src] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function bcFitFontToWidth(ctx, text, maxW, baseSize, weight = "bold", family = "'Times New Roman', Times, serif") {
  let size = baseSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// ── Render ─────────────────────────────────────────────────────────────
async function bcRender() {
  const canvas = document.getElementById("bcCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const myToken = ++bcRenderToken;
  const isCustom = bcCurrentFaction === "custom";
  const base = bcGetBaseFaction(bcCurrentFaction);
  const bc = bcGetBcConfig(bcCurrentFaction);

  // ── Read inputs ────────────────────────────────────────────────
  const headerText = isCustom ? (document.getElementById("bcHeader").value || "").toUpperCase() : bc.header || "";
  const rank = isCustom ? document.getElementById("bcCustomRank").value || "" : document.getElementById("bcRank").value || "";
  const fullName = document.getElementById("bcFullName").value || "";
  const badgeNo = document.getElementById("bcBadge").value || "";
  const area = document.getElementById("bcArea").value || "";
  const role = document.getElementById("bcRole").value || "";
  const tel = document.getElementById("bcTel").value.trim();
  const cell = document.getElementById("bcCell").value.trim();
  const tdd = document.getElementById("bcTdd").value.trim();
  const emailLocal = document.getElementById("bcEmail").value.trim();
  const address1 = document.getElementById("bcAddress1").value || "";
  const address2 = document.getElementById("bcAddress2").value || "";

  // ── Email composition ────────────────────────────────────────
  let emailFull = "";
  if (emailLocal) {
    if (emailLocal.includes("@") || isCustom) emailFull = emailLocal;
    else if (base?.emailDomain) emailFull = emailLocal + "@" + base.emailDomain;
    else emailFull = emailLocal;
  }

  // ── Preload image ────────────────────────────────────────────
  const imgSrc = isCustom ? bcCustomImage : bc.badge || base?.icon || "";
  const img = imgSrc ? await bcLoadImage(imgSrc) : null;
  if (myToken !== bcRenderToken) return;

  // ── Background ───────────────────────────────────────────────
  ctx.drawImage(bcGetPaperTexture(W, H), 0, 0);

  const padX = 24;
  ctx.fillStyle = "#0a0a0a";

  // ── 1. HEADER ───────────────────────────────────
  if (headerText) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    bcFitFontToWidth(ctx, headerText, W - 2 * padX, 25, "bold");
    ctx.fillText(headerText, W / 2, 18);
  }

  // ── 2. LEFT COLUMN: badge + address ──────────────────────────
  const leftX = padX;

  // Badge scale slider
  const scaleSlider = document.getElementById("bcLogoScale");
  const badgeScale = scaleSlider ? parseFloat(scaleSlider.value) || 1.0 : 1.0;

  const badgeBoxX = leftX;
  const badgeBoxY = 56;
  const badgeBoxW = 200;
  const badgeBoxH = 224;
  let badgeLeftX = badgeBoxX;
  let badgeBottomY = badgeBoxY + badgeBoxH;

  if (img) {
    const ratio = img.width / img.height;
    let dw, dh;
    if (ratio > badgeBoxW / badgeBoxH) {
      dw = badgeBoxW;
      dh = dw / ratio;
    } else {
      dh = badgeBoxH;
      dw = dh * ratio;
    }
    dw *= badgeScale;
    dh *= badgeScale;

    const cx = badgeBoxX + badgeBoxW / 2;
    const cy = badgeBoxY + badgeBoxH / 2;
    const drawX = cx - dw / 2;
    const drawY = cy - dh / 2;
    ctx.drawImage(img, drawX, drawY, dw, dh);
    badgeLeftX = drawX;
    badgeBottomY = drawY + dh;
  }

  // Address
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "14px 'Times New Roman', Times, serif";
  ctx.fillStyle = "#0a0a0a";
  const addrLines = [address1, address2].filter(Boolean);
  const addrLineH = 19;
  const addrBottomY = H - 38;
  addrLines.forEach((line, i) => {
    const y = addrBottomY - (addrLines.length - 1 - i) * addrLineH;
    ctx.fillText(line, leftX, y);
  });

  // ── 3. CENTER COLUMN: rank / name / serial + area / role ─────
  const centerX = W / 2;
  const centerMaxW = 260;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#0a0a0a";

  // Top group
  let cY = 92;
  if (rank) {
    bcFitFontToWidth(ctx, rank, centerMaxW, 24, "bold");
    ctx.fillText(rank, centerX, cY);
    cY += 32;
  }
  if (fullName) {
    ctx.font = "italic 17px 'Times New Roman', Times, serif";
    ctx.fillText(fullName, centerX, cY);
    cY += 26;
  }
  if (!isCustom) {
    ctx.font = "18px 'Times New Roman', Times, serif";
    ctx.fillText("Serial No. " + (badgeNo || ""), centerX, cY);
  }

  // Bottom group: area + role
  let aY = 218;
  if (area) {
    bcFitFontToWidth(ctx, area, centerMaxW, 20, "bold");
    ctx.fillText(area, centerX, aY);
    aY += 28;
  }
  if (role) {
    bcFitFontToWidth(ctx, role, centerMaxW, 16, "italic");
    ctx.fillText(role, centerX, aY);
  }

  // ── 3a. WATERMARK (logo behind contacts, bottom-right) ───────
  const watermarkOn = document.getElementById("bcWatermark")?.checked;
  if (watermarkOn && img) {
    const wmBoxW = 240;
    const wmBoxH = 220;
    const wmBoxX = W - padX - wmBoxW;
    const wmBoxY = H - 30 - wmBoxH;

    const wmRatio = img.width / img.height;
    let wmDw, wmDh;
    if (wmRatio > wmBoxW / wmBoxH) {
      wmDw = wmBoxW;
      wmDh = wmDw / wmRatio;
    } else {
      wmDh = wmBoxH;
      wmDw = wmDh * wmRatio;
    }
    const wmCx = wmBoxX + wmBoxW / 2;
    const wmCy = wmBoxY + wmBoxH / 2;

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.drawImage(img, wmCx - wmDw / 2, wmCy - wmDh / 2, wmDw, wmDh);
    ctx.restore();
  }

  // ── 4. RIGHT COLUMN: contacts (bottom-right anchored) ────────
  const contactLines = [];
  if (tel) contactLines.push("Tel: " + tel);
  if (cell) contactLines.push("Cell: " + cell);
  if (tdd) contactLines.push("TDD: " + tdd);
  if (emailFull) contactLines.push(emailFull);

  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = "14px 'Times New Roman', Times, serif";
  ctx.fillStyle = "#0a0a0a";

  const contactLineH = 19;
  const contactBottomY = H - 38;
  contactLines.forEach((line, i) => {
    const y = contactBottomY - (contactLines.length - 1 - i) * contactLineH;
    ctx.fillText(line, W - padX, y);
  });

  // ── 5. FOOTER (full width, bottom) ───────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "10px 'Times New Roman', Times, serif";

  let footerText = "";
  if (isCustom) {
    const f1 = document.getElementById("bcCustomFooter1").value || "";
    const f2 = document.getElementById("bcCustomFooter2").value || "";
    const f3 = document.getElementById("bcCustomFooter3").value || "";
    footerText = [f1, f2, f3].filter(Boolean).join("    ");
  } else if (bc.recruitName) {
    footerText = `Join the ${bc.recruitName}    ${bc.recruitPhone} Recruitment Hotline    ${bc.websiteMain}    ${bc.websiteJoin}`;
  }
  if (footerText) {
    bcFitFontToWidth(ctx, footerText, W - 50, 10, "normal", "'Times New Roman', Times, serif");
    ctx.fillText(footerText, W / 2, H - 14);
  }
}

// ── Download / Copy ─────────────────────────────────────────────────────
function bcDownload() {
  const canvas = document.getElementById("bcCanvas");
  const link = document.createElement("a");
  link.download = `business_card_${bcCurrentFaction}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function bcCopy() {
  const canvas = document.getElementById("bcCanvas");
  const btn = document.getElementById("bcCopyBtn");

  const flashCopied = () => {
    const original = btn.innerHTML;
    btn.innerHTML = "✓ Copied!";
    setTimeout(() => {
      btn.innerHTML = original;
    }, 1200);
  };

  const bumpCounter = async () => {
    const newCount = await window.GumaCounters?.trackDownload("business_card");
    const countEl = document.getElementById("downloadCount");
    if (newCount != null && countEl) {
      countEl.textContent = window.GumaCounters.fmt(newCount);
    }
  };

  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    alert("Clipboard not supported in this browser.");
    return;
  }

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      await bumpCounter();
      flashCopied();
    } catch {
      alert("Copy failed.");
    }
  }, "image/png");
}

// ── Logo scale slider ────────────────────────────────────────────────
function bcOnLogoScaleChange(val) {
  const display = document.getElementById("bcLogoScaleValue");
  if (display) display.textContent = Math.round(parseFloat(val) * 100) + "%";
  bcRender();
}
