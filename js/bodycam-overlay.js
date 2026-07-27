"use strict";

// ── Bodycam Overlay generator ────────────────────────────────────────────
// Page wiring only: reads the form into BodycamRender.state and drives the
// exports. Geometry lives in bodycam-layers.js, drawing in bodycam-render.js
// and direct manipulation on the frame in bodycam-stage.js.

const BCAM_KEY = "bodycam";

// Picker entries that are not real agencies but still need a tile. "None" has
// no artwork to show, so it gets a drawn glyph instead of an image.
const BCAM_CUSTOM_TILE = { short: "Custom", icon: "assets/custom.png" };
const BCAM_NONE_TILE = {
  short: "None",
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
             stroke-linejoin="round" class="opacity-70" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
        </svg>`,
};

const bcamEl = (id) => document.getElementById(id);

// ── Render entry points ──────────────────────────────────────────────────
/** HUD only: text, logos and layer geometry. Safe on every keystroke. */
function bcamRender() {
  window.BodycamStage.render();
}

/** Full rebuild, including the pixel effects. Only for the effect controls. */
function bcamRenderAll() {
  window.BodycamRender.renderAll();
  window.BodycamStage.sync();
}

// ── Form binding helpers ─────────────────────────────────────────────────
const S = () => window.BodycamRender.state;

function bcamBindText(id, key) {
  const el = bcamEl(id);
  el?.addEventListener("input", () => {
    S()[key] = el.value;
    bcamRender();
  });
}

function bcamBindNumber(id, key, min, max) {
  const el = bcamEl(id);
  el?.addEventListener("input", () => {
    const value = Number.parseInt(el.value, 10);
    S()[key] = Number.isNaN(value) ? min : Math.max(min, Math.min(max, value));
    bcamRender();
  });
}

function bcamBindToggle(id, key, full) {
  const el = bcamEl(id);
  el?.addEventListener("change", () => {
    S()[key] = el.checked;
    (full ? bcamRenderAll : bcamRender)();
  });
}

function bcamBindRange(id, key, valueId, full) {
  const el = bcamEl(id);
  const out = valueId ? bcamEl(valueId) : null;
  el?.addEventListener("input", () => {
    S()[key] = Number.parseInt(el.value, 10);
    if (out) out.textContent = el.value;
    (full ? bcamRenderAll : bcamRender)();
  });
}

// ── Picker tiles ─────────────────────────────────────────────────────────
/**
 * Build a row of faction-style tiles. An entry carries either an `icon` image
 * or inline `svg` markup for the entries that have no artwork of their own.
 * @param {string} containerId host element id
 * @param {Array<{key: string, label: string, icon?: string, svg?: string}>} entries
 * @param {(key: string) => void} onPick
 * @param {string} [extraClass] appended to each tile, e.g. to drop the fixed width
 */
function bcamBuildPicker(containerId, entries, onPick, extraClass = "") {
  const host = bcamEl(containerId);
  if (!host) return;
  host.innerHTML = "";

  entries.forEach(({ key, label, icon, svg }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `faction-btn ${extraClass}`.trim();
    btn.dataset.pick = key;
    btn.innerHTML = `
      ${svg || `<img src="${icon}" class="h-9 w-9 object-contain" alt="${label}" />`}
      <span>${label}</span>
    `;
    btn.addEventListener("click", () => onPick(key));
    host.appendChild(btn);
  });
}

function bcamMarkActive(containerId, key) {
  document.querySelectorAll(`#${containerId} .faction-btn`).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.pick === key);
  });
}

// ── Camera brand ─────────────────────────────────────────────────────────
function bcamSelectBrand(key) {
  const brands = window.BodycamCameras.BRANDS;
  S().brand = key;
  bcamMarkActive("bcamBrandSwitcher", key);

  const uploadRow = bcamEl("bcamBrandUploadRow");
  if (uploadRow) uploadRow.style.display = key === "custom" ? "block" : "none";

  // Refresh the device-label presets, and adopt the new brand's default label
  // unless the user has typed something of their own.
  const devices = brands[key]?.devices || [];
  const list = bcamEl("bcamDeviceList");
  if (list) list.innerHTML = devices.map((d) => `<option value="${d}"></option>`).join("");

  const field = bcamEl("bcamDevice");
  if (field && devices.length) {
    const isPreset = Object.values(brands).some((b) => b.devices.includes(field.value));
    if (!field.value.trim() || isPreset) {
      field.value = devices[0];
      S().device = devices[0];
    }
  }

  bcamRender();
}

// ── Agency logo ──────────────────────────────────────────────────────────
function bcamSelectFaction(key) {
  S().faction = key;
  bcamMarkActive("bcamFactionSwitcher", key);

  const uploadRow = bcamEl("bcamFactionUploadRow");
  if (uploadRow) uploadRow.style.display = key === "custom" ? "block" : "none";

  bcamRender();
}

// ── Logo uploads ─────────────────────────────────────────────────────────
/** Wire one .guma-drop box to a custom-logo slot in the render state. */
function bcamBindLogoUpload(zone, input, textId, previewId, apply) {
  window.GumaUpload.init({
    zone,
    input,
    text: textId,
    preview: previewId,
    textAfter: "Click to change image",
    onLoad: (dataURL) => {
      apply(dataURL);
      bcamRender();
    },
  });
}

// ── Layer visibility ─────────────────────────────────────────────────────
// The REC layer is toggled from the Recording HUD section instead, next to
// the elapsed time and battery fields that feed it.
const BCAM_HUD_LAYER = "rec";

function bcamSetLayerVisible(id, visible) {
  window.BodycamLayers.get(id).visible = visible;
  // A hidden layer has no box left to drag, so let go of it first.
  if (!visible && window.BodycamLayers.getSelected() === id) {
    window.BodycamStage.select(null);
  }
  bcamRender();
}

function bcamBuildLayerToggles() {
  const host = bcamEl("bcamLayerToggles");
  if (!host) return;
  host.innerHTML = "";

  window.BodycamLayers.DEFS.filter((def) => def.id !== BCAM_HUD_LAYER).forEach((def) => {
    const row = document.createElement("label");
    row.className = "guma-bcam-switch";
    row.innerHTML = `<span>${def.label}</span>`;

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = window.BodycamLayers.get(def.id).visible;
    box.addEventListener("change", () => bcamSetLayerVisible(def.id, box.checked));

    row.appendChild(box);
    host.appendChild(row);
  });
}

function bcamBindLayerCheckbox(inputId, layerId) {
  const el = bcamEl(inputId);
  el?.addEventListener("change", () => bcamSetLayerVisible(layerId, el.checked));
}

/** Send every layer back to its anchor corner at 100%. */
function bcamResetLayout() {
  window.BodycamLayers.resetPlacement();
  bcamRender();
}

// ── Randomizers ──────────────────────────────────────────────────────────
function bcamRandomSerial() {
  const value = window.BodycamCameras.randomSerial();
  S().serial = value;
  const field = bcamEl("bcamSerial");
  if (field) field.value = value;
  bcamRender();
}

function bcamRandomTimer() {
  const value = window.BodycamCameras.randomTimer();
  S().timer = value;
  const field = bcamEl("bcamTimer");
  if (field) field.value = value;
  bcamRender();
}

// ── Export ───────────────────────────────────────────────────────────────
function bcamFileName() {
  const date = (S().date || "").replace(/-/g, "") || "screenshot";
  const time = (S().time || "").replace(/:/g, "");
  return `bodycam_${date}${time ? `_${time}` : ""}.png`;
}

function bcamDownload() {
  if (!window.BodycamRender.hasImage()) return;
  const link = document.createElement("a");
  link.download = bcamFileName();
  link.href = window.BodycamRender.canvas().toDataURL("image/png");
  link.click();
}

function bcamCopy() {
  if (!window.BodycamRender.hasImage()) return;

  const btn = bcamEl("bcamCopyBtn");
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    alert("Clipboard not supported in this browser.");
    return;
  }

  window.BodycamRender.canvas().toBlob(async (blob) => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const count = await window.GumaCounters?.trackDownload(BCAM_KEY);
      const readout = bcamEl("downloadCount");
      if (count != null && readout) readout.textContent = window.GumaCounters.fmt(count);

      const original = btn.innerHTML;
      btn.innerHTML = "✓ Copied!";
      setTimeout(() => {
        btn.innerHTML = original;
      }, 1200);
    } catch {
      alert("Copy failed.");
    }
  }, "image/png");
}

/** Exports stay disabled until there is actually a frame to export. */
function bcamSetExportEnabled(enabled) {
  ["bcamDownloadBtn", "bcamCopyBtn"].forEach((id) => {
    const btn = bcamEl(id);
    if (!btn) return;
    btn.disabled = !enabled;
    btn.classList.toggle("opacity-40", !enabled);
    btn.classList.toggle("pointer-events-none", !enabled);
  });
}

function bcamOnImageLoaded() {
  const { W, H } = S();
  const dims = bcamEl("bcamDims");
  if (dims) dims.textContent = `${W} × ${H} px`;
  bcamSetExportEnabled(true);
}

// ── Init ─────────────────────────────────────────────────────────────────
function bcamInitDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  S().date = date;
  S().time = time;
  const dateField = bcamEl("bcamDate");
  const timeField = bcamEl("bcamTime");
  if (dateField) dateField.value = date;
  if (timeField) timeField.value = time;
}

function bcamInit() {
  const cameras = window.BodycamCameras;

  // Pickers
  // The brand tiles live in the narrow form column, so they share a grid
  // instead of the switcher's fixed-width flex row.
  bcamBuildPicker(
    "bcamBrandSwitcher",
    cameras.BRAND_ORDER.map((key) => {
      const brand = cameras.BRANDS[key];
      if (brand.logo) return { key, label: brand.name, icon: brand.logo };
      if (key === "custom") return { key, label: brand.name, icon: BCAM_CUSTOM_TILE.icon };
      return { key, label: brand.name, svg: BCAM_NONE_TILE.svg };
    }),
    bcamSelectBrand,
    "w-full"
  );

  const factionEntries = cameras.FACTION_ORDER.filter((key) => typeof FACTIONS !== "undefined" && FACTIONS[key]).map((key) => ({
    key,
    label: FACTIONS[key].short || key.toUpperCase(),
    icon: FACTIONS[key].icon,
  }));
  factionEntries.push({ key: "custom", label: BCAM_CUSTOM_TILE.short, icon: BCAM_CUSTOM_TILE.icon });
  factionEntries.push({ key: "none", label: BCAM_NONE_TILE.short, svg: BCAM_NONE_TILE.svg });
  bcamBuildPicker("bcamFactionSwitcher", factionEntries, bcamSelectFaction);

  bcamBuildLayerToggles();

  // Stage
  window.BodycamStage.init({
    canvas: bcamEl("bcamCanvas"),
    stage: bcamEl("bcamStage"),
    selection: bcamEl("bcamSelection"),
    selectionLabel: bcamEl("bcamSelectionInfo"),
    scaleHandle: bcamEl("bcamScaleHandle"),
    dropzone: bcamEl("bcamDropzone"),
    onImage: bcamOnImageLoaded,
  });

  // Screenshot upload
  bcamEl("bcamUploadBtn")?.addEventListener("click", () => bcamEl("bcamFileInput")?.click());
  bcamEl("bcamFileInput")?.addEventListener("change", (e) => window.BodycamStage.loadFile(e.target.files?.[0]));
  bcamEl("bcamDropzone")?.addEventListener("click", () => bcamEl("bcamFileInput")?.click());

  // Logo uploads
  bcamBindLogoUpload("bcamBrandDrop", "bcamBrandLogoInput", "bcamBrandUploadText", "bcamBrandLogoPreview", (src) => {
    S().brandCustomLogo = src;
  });
  bcamBindLogoUpload("bcamFactionDrop", "bcamFactionLogoInput", "bcamFactionUploadText", "bcamFactionLogoPreview", (src) => {
    S().factionCustomLogo = src;
  });

  // Burned-in data
  bcamBindText("bcamDevice", "device");
  bcamBindText("bcamSerial", "serial");
  bcamBindText("bcamTz", "tz");
  bcamBindText("bcamDate", "date");
  bcamBindText("bcamTime", "time");
  bcamBindText("bcamTimer", "timer");
  bcamBindNumber("bcamBattery", "battery", 0, 100);
  bcamBindLayerCheckbox("bcamShowRec", BCAM_HUD_LAYER);

  // Image effects
  bcamBindToggle("bcamSensor", "sensorGrade", true);
  bcamBindToggle("bcamVignetteOn", "vignetteOn", true);
  bcamBindRange("bcamVignette", "vignette", "bcamVignetteValue", true);
  bcamBindRange("bcamGrain", "grain", "bcamGrainValue", true);
  bcamBindToggle("bcamScanOn", "scanlinesOn", true);
  bcamBindRange("bcamScan", "scanlines", "bcamScanValue", true);
  bcamBindToggle("bcamAbOn", "aberrationOn", true);
  bcamBindRange("bcamAb", "aberration", "bcamAbValue", true);

  // Defaults
  bcamInitDateTime();
  bcamSelectBrand("coil");
  bcamSelectFaction("lspd");
  bcamRandomSerial();
  bcamSetExportEnabled(false);
  window.BodycamStage.sync();
}
