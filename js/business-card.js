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
// 1 = full-width header + recruitment footer, 2 = masthead with rule + motto
let bcCurrentLayout = 1;
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

/** Layout-2 masthead defaults for a faction (empty object in Custom mode). */
function bcGetLayout2Config(key) {
  return bcGetBcConfig(key).layout2 || {};
}

// ── Rank -> badge artwork ────────────────────────────────────────────────
// Grade suffixes are cosmetic on the badge itself: a "Sergeant II" wears a
// badge reading "SERGEANT". Strip the trailing roman numeral (and "+1" style
// pay grades) so every grade of a rank maps to the same artwork.
const BC_RANK_GRADE_RE = /\s+I{1,3}(\+\d+)?$/;

function bcBaseRank(rank) {
  return (rank || "").replace(BC_RANK_GRADE_RE, "").trim();
}

/** Badge image for a rank, falling back to the faction default, then its logo. */
function bcResolveBadge(bc, base, rank) {
  const key = bcBaseRank(rank);
  if (bc.rankBadges && key in bc.rankBadges) {
    // A `null` entry means the rank has no shield: show the department logo.
    return bc.rankBadges[key] || base?.icon || "";
  }
  return bc.badge || base?.icon || "";
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

  bcSelectLayout(bcCurrentLayout, { render: false });
  bcSelectFaction("lspd");

  window.GumaUpload.init({
    zone: "bcImageDrop",
    input: "bcImageInput",
    text: "bcUploadText",
    preview: "bcImagePreview",
    textAfter: "Click to change image",
    onLoad: (dataURL) => {
      bcCustomImage = dataURL;
      delete bcImageCache[bcCustomImage];
      bcRender();
    },
  });
}

// ── Layout selection ────────────────────────────────────────────────────
/**
 * Switch between the two card layouts.
 * @param {number|string} layout 1 (classic) or 2 (masthead with rule)
 * @param {{render?: boolean}} [opts] pass `render: false` during bootstrap
 */
function bcSelectLayout(layout, opts = {}) {
  bcCurrentLayout = Number(layout) === 2 ? 2 : 1;

  document.querySelectorAll("#bcLayoutSwitcher .guma-seg-btn").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.layout) === bcCurrentLayout);
  });

  bcApplyLayoutVisibility();
  if (opts.render !== false) bcRender();
}

/** Show/hide the rows that only exist in one of the two layouts. */
function bcApplyLayoutVisibility() {
  const isL2 = bcCurrentLayout === 2;
  const isCustom = bcCurrentFaction === "custom";
  // Clear the inline value instead of forcing `block` so rows keep whatever
  // display their Tailwind classes give them (e.g. the area/role grid).
  const show = (id, visible) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.style.removeProperty("display");
    else el.style.display = "none";
  };

  show("bcLayout2HeaderPanel", isL2);
  show("bcL2StationRow", isL2);
  show("bcL2WebsiteRow", isL2);
  // Layout 2 prints name + rank only, so these have nowhere to go
  show("bcBadgeRow", !isL2);
  show("bcAreaRoleRow", !isL2);
  // Layout 2 replaces the footer strip with the website line
  show("bcCustomFooterPanel", isCustom && !isL2);
}

/** Reset the layout-2 masthead fields to the selected faction's defaults. */
function bcApplyLayout2Defaults(key) {
  const l2 = bcGetLayout2Config(key);
  const bc = bcGetBcConfig(key);
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  };

  setVal("bcL2Prefix", l2.prefix);
  setVal("bcL2Motto1", l2.motto1);
  setVal("bcL2Motto2", l2.motto2);
  setVal("bcL2Website", bc.websiteMain);
  setVal("bcL2Head", "");
  setVal("bcL2Station", "");
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
  document.getElementById("bcRankRow").style.display = isCustom ? "none" : "block";
  document.getElementById("bcCustomRankRow").style.display = isCustom ? "block" : "none";
  document.getElementById("bcBadgeOptional").classList.toggle("hidden", !isCustom);

  bcApplyLayout2Defaults(key);
  bcApplyLayoutVisibility();

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

// ── Canvas drawing primitives ───────────────────────────────────────────
const BC_INK = "#0a0a0a";
const BC_PAD_X = 24;

/** Draw an image contained (never cropped) inside a box, centred and scaled. */
function bcDrawContained(ctx, img, box, scale = 1, alpha = 1) {
  if (!img) return;
  const ratio = img.width / img.height;
  let dw, dh;
  if (ratio > box.w / box.h) {
    dw = box.w;
    dh = dw / ratio;
  } else {
    dh = box.h;
    dw = dh * ratio;
  }
  dw *= scale;
  dh *= scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
  ctx.restore();
}

/** Draw a stack of lines anchored on its LAST baseline (`bottomY`). */
function bcDrawLinesUp(ctx, lines, x, bottomY, lineH) {
  lines.forEach((line, i) => {
    ctx.fillText(line, x, bottomY - (lines.length - 1 - i) * lineH);
  });
}

/** Faint department logo behind the bottom-right contact block. */
function bcDrawWatermark(ctx, img, W, H) {
  if (!img) return;
  const box = { x: W - BC_PAD_X - 240, y: H - 30 - 220, w: 240, h: 220 };
  bcDrawContained(ctx, img, box, 1, 0.1);
}

// ── Form -> render model ────────────────────────────────────────────────
function bcReadForm() {
  const val = (id) => document.getElementById(id)?.value ?? "";
  const isCustom = bcCurrentFaction === "custom";
  const base = bcGetBaseFaction(bcCurrentFaction);
  const bc = bcGetBcConfig(bcCurrentFaction);

  // Email: the local part gets the faction domain unless it is already full
  const emailLocal = val("bcEmail").trim();
  let emailFull = "";
  if (emailLocal) {
    if (emailLocal.includes("@") || isCustom || !base?.emailDomain) emailFull = emailLocal;
    else emailFull = emailLocal + "@" + base.emailDomain;
  }

  const rank = isCustom ? val("bcCustomRank") : val("bcRank");
  const customHeader = val("bcHeader");

  // Contacts: "Label: value" for every filled phone field
  const contact = (label, id) => {
    const v = val(id).trim();
    return v ? `${label}: ${v}` : "";
  };

  return {
    isCustom,
    base,
    bc,
    // Layout 1 prints one wide, uppercase header; layout 2 keeps the case
    // because its title is rendered in small-caps.
    header: isCustom ? customHeader.toUpperCase() : bc.header || "",
    l2Title: isCustom ? customHeader : bcGetLayout2Config(bcCurrentFaction).title || bc.header || "",
    l2Prefix: val("bcL2Prefix"),
    l2Head: val("bcL2Head"),
    l2Motto: [val("bcL2Motto1"), val("bcL2Motto2")].filter(Boolean),
    l2Station: val("bcL2Station"),
    l2Website: val("bcL2Website"),
    rank,
    fullName: val("bcFullName"),
    badgeNo: val("bcBadge"),
    area: val("bcArea"),
    role: val("bcRole"),
    address1: val("bcAddress1"),
    address2: val("bcAddress2"),
    contactLines: [contact("Tel", "bcTel"), contact("Cell", "bcCell"), contact("TDD", "bcTdd"), emailFull].filter(Boolean),
    badgeScale: parseFloat(val("bcLogoScale")) || 1.0,
    watermarkOn: !!document.getElementById("bcWatermark")?.checked,
    imgSrc: isCustom ? bcCustomImage : bcResolveBadge(bc, base, rank),
  };
}

// ── Render ─────────────────────────────────────────────────────────────
async function bcRender() {
  const canvas = document.getElementById("bcCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const myToken = ++bcRenderToken;
  const d = bcReadForm();

  d.img = d.imgSrc ? await bcLoadImage(d.imgSrc) : null;
  if (myToken !== bcRenderToken) return;

  ctx.drawImage(bcGetPaperTexture(W, H), 0, 0);
  if (bcCurrentLayout === 2) bcDrawLayout2(ctx, W, H, d);
  else bcDrawLayout1(ctx, W, H, d);
}

// ── Layout 1: wide header, rank above name, recruitment footer ──────────
function bcDrawLayout1(ctx, W, H, d) {
  const padX = BC_PAD_X;
  ctx.fillStyle = BC_INK;

  // ── 1. HEADER ───────────────────────────────────
  if (d.header) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    bcFitFontToWidth(ctx, d.header, W - 2 * padX, 25, "bold");
    ctx.fillText(d.header, W / 2, 18);
  }

  // ── 2. LEFT COLUMN: badge + address ──────────────────────────
  bcDrawContained(ctx, d.img, { x: padX, y: 56, w: 200, h: 224 }, d.badgeScale);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "14px 'Times New Roman', Times, serif";
  ctx.fillStyle = BC_INK;
  bcDrawLinesUp(ctx, [d.address1, d.address2].filter(Boolean), padX, H - 38, 19);

  // ── 3. CENTER COLUMN: rank / name / serial + area / role ─────
  const centerX = W / 2;
  const centerMaxW = 260;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = BC_INK;

  // Top group
  let cY = 92;
  if (d.rank) {
    bcFitFontToWidth(ctx, d.rank, centerMaxW, 24, "bold");
    ctx.fillText(d.rank, centerX, cY);
    cY += 32;
  }
  if (d.fullName) {
    ctx.font = "italic 17px 'Times New Roman', Times, serif";
    ctx.fillText(d.fullName, centerX, cY);
    cY += 26;
  }
  // Custom cards print the serial line only when a badge number is provided
  if (!d.isCustom || d.badgeNo) {
    ctx.font = "18px 'Times New Roman', Times, serif";
    ctx.fillText("Serial No. " + (d.badgeNo || ""), centerX, cY);
  }

  // Bottom group: area + role
  let aY = 218;
  if (d.area) {
    bcFitFontToWidth(ctx, d.area, centerMaxW, 20, "bold");
    ctx.fillText(d.area, centerX, aY);
    aY += 28;
  }
  if (d.role) {
    bcFitFontToWidth(ctx, d.role, centerMaxW, 16, "italic");
    ctx.fillText(d.role, centerX, aY);
  }

  // ── 3a. WATERMARK (logo behind contacts, bottom-right) ───────
  if (d.watermarkOn) bcDrawWatermark(ctx, d.img, W, H);

  // ── 4. RIGHT COLUMN: contacts (bottom-right anchored) ────────
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = "14px 'Times New Roman', Times, serif";
  ctx.fillStyle = BC_INK;
  bcDrawLinesUp(ctx, d.contactLines, W - padX, H - 38, 19);

  // ── 5. FOOTER (full width, bottom) ───────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "10px 'Times New Roman', Times, serif";

  let footerText = "";
  if (d.isCustom) {
    const val = (id) => document.getElementById(id)?.value || "";
    footerText = [val("bcCustomFooter1"), val("bcCustomFooter2"), val("bcCustomFooter3")].filter(Boolean).join("    ");
  } else if (d.bc.recruitName) {
    footerText = `Join the ${d.bc.recruitName}    ${d.bc.recruitPhone} Recruitment Hotline    ${d.bc.websiteMain}    ${d.bc.websiteJoin}`;
  }
  if (footerText) {
    bcFitFontToWidth(ctx, footerText, W - 50, 10, "normal", "'Times New Roman', Times, serif");
    ctx.fillText(footerText, W / 2, H - 14);
  }
}

// ── Layout 2: masthead with rule + motto, name above rank, no footer ────
// Modelled on the classic LASD / county sheriff card: the badge sits alone on
// the left while the whole masthead is right of it, closed by a full rule.
function bcDrawLayout2(ctx, W, H, d) {
  const padX = BC_PAD_X;
  const mastLeft = 208;
  const mastRight = W - padX;
  const mastW = mastRight - mastLeft;
  const mastCx = (mastLeft + mastRight) / 2;
  const ruleY = 102;

  ctx.fillStyle = BC_INK;

  // ── 1. MASTHEAD: prefix / title / department head ────────────
  // The whole masthead hangs off the right end of the rule.
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  if (d.l2Prefix) {
    bcFitFontToWidth(ctx, d.l2Prefix, mastW, 16, "italic");
    ctx.fillText(d.l2Prefix, mastRight, 22);
  }
  if (d.l2Title) {
    // Small-caps is what gives the county-card masthead its look; browsers
    // without support simply fall back to the plain Title Case string.
    bcFitFontToWidth(ctx, d.l2Title, mastW, 30, "small-caps bold");
    ctx.fillText(d.l2Title, mastRight, 44);
  }
  if (d.l2Head) {
    ctx.font = "12px 'Times New Roman', Times, serif";
    ctx.fillText(d.l2Head, mastRight, 84);
  }

  // ── 2. RULE + motto tucked under its left end ────────────────
  ctx.beginPath();
  ctx.moveTo(mastLeft, ruleY);
  ctx.lineTo(mastRight, ruleY);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = BC_INK;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  d.l2Motto.forEach((line, i) => {
    bcFitFontToWidth(ctx, line, mastW * 0.45, 14, "italic");
    ctx.fillText(line, mastLeft + 2, ruleY + 6 + i * 18);
  });

  // ── 3. LEFT COLUMN: badge ────────────────────────────────────
  bcDrawContained(ctx, d.img, { x: 16, y: 86, w: 190, h: 190 }, d.badgeScale);

  // ── 3a. WATERMARK (logo behind contacts, bottom-right) ───────
  if (d.watermarkOn) bcDrawWatermark(ctx, d.img, W, H);

  // ── 4. IDENTITY: name above rank, nothing else ───────────────
  // Deliberately no serial / area / role here: the county card this layout
  // copies prints only the name and the title under it.
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = BC_INK;

  let y = 166;
  if (d.fullName) {
    bcFitFontToWidth(ctx, d.fullName, mastW * 0.8, 28, "bold");
    ctx.fillText(d.fullName, mastCx, y);
    y += 34;
  }
  if (d.rank) {
    bcFitFontToWidth(ctx, d.rank, mastW * 0.8, 16, "normal");
    ctx.fillText(d.rank, mastCx, y);
  }

  // ── 5. BOTTOM: station + address (left), contacts (right) ────
  // Layout 2 has no footer strip; the website closes the address block.
  ctx.textBaseline = "alphabetic";
  ctx.font = "13px 'Times New Roman', Times, serif";
  ctx.fillStyle = BC_INK;

  const bottomY = H - 26;
  const lineH = 18;

  ctx.textAlign = "left";
  bcDrawLinesUp(ctx, [d.l2Station, d.address1, d.address2, d.l2Website].filter(Boolean), padX, bottomY, lineH);

  ctx.textAlign = "right";
  bcDrawLinesUp(ctx, d.contactLines, W - padX, bottomY, lineH);
}

// ── Download / Copy ─────────────────────────────────────────────────────
async function bcDownload() {
  const canvas = document.getElementById("bcCanvas");
  const link = document.createElement("a");
  link.download = `business_card_${bcCurrentFaction}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  await GumaHistoryWiring.save(canvas);
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
      await GumaHistoryWiring.save(canvas);
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

// ── Saved cards: serialize / hydrate / wiring ─────────────────

// Aspect-preserving downscale (logos must NOT be cropped).
function bcDownscaleContain(dataUrl, maxW, maxH) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const r = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.max(1, Math.round(img.width * r));
        const h = Math.max(1, Math.round(img.height * r));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const cx = c.getContext("2d");
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        cx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/png"));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function bcSerializeState() {
  const val = (id) => document.getElementById(id)?.value ?? "";
  let customImage = null;
  if (bcCurrentFaction === "custom" && bcCustomImage) {
    customImage = await bcDownscaleContain(bcCustomImage, 200, 224);
  }
  return {
    FACTION_KEY: bcCurrentFaction,
    layout: bcCurrentLayout,
    header: val("bcHeader"),
    rank: val("bcRank"),
    customRank: val("bcCustomRank"),
    fullName: val("bcFullName"),
    badge: val("bcBadge"),
    area: val("bcArea"),
    role: val("bcRole"),
    tel: val("bcTel"),
    cell: val("bcCell"),
    tdd: val("bcTdd"),
    email: val("bcEmail"),
    address1: val("bcAddress1"),
    address2: val("bcAddress2"),
    logoScale: val("bcLogoScale"),
    watermark: !!document.getElementById("bcWatermark")?.checked,
    custom: { footer1: val("bcCustomFooter1"), footer2: val("bcCustomFooter2"), footer3: val("bcCustomFooter3") },
    layout2: {
      prefix: val("bcL2Prefix"),
      head: val("bcL2Head"),
      motto1: val("bcL2Motto1"),
      motto2: val("bcL2Motto2"),
      station: val("bcL2Station"),
      website: val("bcL2Website"),
    },
    customImage, // custom faction only
  };
}

function bcHydrateState(payload) {
  if (!payload) return;
  const setVal = GumaHistoryWiring.setVal;
  const fk = payload.FACTION_KEY || "lspd";
  bcSelectFaction(fk); // toggles panels + populates rank select + layout-2 defaults
  bcSelectLayout(payload.layout || 1, { render: false });

  if (fk === "custom") {
    bcCustomImage = payload.customImage || null;
    const preview = document.getElementById("bcImagePreview");
    const uploadText = document.getElementById("bcUploadText");
    if (bcCustomImage) {
      if (preview) {
        preview.src = bcCustomImage;
        preview.classList.remove("hidden");
      }
      if (uploadText) uploadText.textContent = "Click to change image";
    } else {
      if (preview) {
        preview.removeAttribute("src");
        preview.classList.add("hidden");
      }
      if (uploadText) uploadText.textContent = "Click to upload image";
    }
    setVal("bcHeader", payload.header);
    setVal("bcCustomRank", payload.customRank);
    setVal("bcCustomFooter1", payload.custom?.footer1);
    setVal("bcCustomFooter2", payload.custom?.footer2);
    setVal("bcCustomFooter3", payload.custom?.footer3);
  } else {
    setVal("bcRank", payload.rank);
  }

  setVal("bcFullName", payload.fullName);
  setVal("bcBadge", payload.badge);
  setVal("bcArea", payload.area);
  setVal("bcRole", payload.role);
  setVal("bcTel", payload.tel);
  setVal("bcCell", payload.cell);
  setVal("bcTdd", payload.tdd);
  setVal("bcEmail", payload.email);
  setVal("bcAddress1", payload.address1);
  setVal("bcAddress2", payload.address2);

  // Layout-2 masthead: fall back to the faction defaults already applied above
  const l2 = payload.layout2;
  if (l2) {
    setVal("bcL2Prefix", l2.prefix);
    setVal("bcL2Head", l2.head);
    setVal("bcL2Motto1", l2.motto1);
    setVal("bcL2Motto2", l2.motto2);
    setVal("bcL2Station", l2.station);
    setVal("bcL2Website", l2.website);
  }

  const wm = document.getElementById("bcWatermark");
  if (wm) wm.checked = !!payload.watermark;

  setVal("bcLogoScale", payload.logoScale || "1");
  const scaleDisp = document.getElementById("bcLogoScaleValue");
  if (scaleDisp) scaleDisp.textContent = Math.round((parseFloat(payload.logoScale) || 1) * 100) + "%";

  bcRender();
}

function bcBuildLabel(payload) {
  const name = (payload.fullName || "").trim() || "Unnamed";
  let rank, short;
  if (payload.FACTION_KEY === "custom") {
    rank = (payload.customRank || "").trim();
    short = (payload.header || "").trim() || "Custom";
  } else {
    rank = (payload.rank || "").trim();
    short = (typeof FACTIONS !== "undefined" && FACTIONS[payload.FACTION_KEY]?.short) || "";
  }
  const tail = short ? ` (${short})` : "";
  return rank ? `${name} — ${rank}${tail}` : `${name}${tail}`;
}

GumaHistoryWiring.register({
  key: "business_card",
  noun: "card",
  serialize: bcSerializeState,
  hydrate: bcHydrateState,
  buildLabel: bcBuildLabel,
  buildFaction: (p) => GumaHistoryWiring.buildFaction(p, { customShort: (pp) => (pp.header || "").trim() }),
});
