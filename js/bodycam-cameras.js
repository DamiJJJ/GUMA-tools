"use strict";

// ── Camera brands ────────────────────────────────────────────────────────
// A body-worn camera burns its maker's mark into the top corner of its own
// footage, together with a device label. Each brand here supplies both, so
// picking a brand fills the label presets as well.
// `logo: null` means nothing is drawn in the corner: "custom" waits for an
// uploaded file, "none" leaves the corner empty on purpose.
const BODYCAM_BRANDS = {
  coil: {
    name: "Coil",
    logo: "assets/bodycam_coil.png",
    devices: ["Coil Body 3", "Coil Body 5", "Coil Watchman"],
  },
  axon: {
    name: "Axon",
    logo: "assets/bodycam_axon.png",
    devices: ["Axon Body 3", "Axon Body 4", "Axon Flex 2"],
  },
  custom: {
    name: "Custom",
    logo: null,
    devices: [],
  },
  none: {
    name: "No logo",
    logo: null,
    devices: [],
  },
};

// Default first, matching how the faction pickers are ordered elsewhere.
const BODYCAM_BRAND_ORDER = ["coil", "axon", "custom", "none"];

// ── Agency logo sources ──────────────────────────────────────────────────
// Reuses the shared faction registry so the picker never drifts from the
// rest of the app; "custom" and "none" are appended by the page.
const BODYCAM_FACTION_ORDER = ["lspd", "lssd", "bcso", "sahp", "lscofd", "lsfd"];

/** Serial a camera stamps beside its device label: "X" + 10 digits. */
function bodycamRandomSerial() {
  let serial = "X";
  for (let i = 0; i < 10; i++) serial += Math.floor(Math.random() * 10);
  return serial;
}

/** Zero-padded elapsed-time string for the REC counter, e.g. "00:14:23". */
function bodycamRandomTimer() {
  const pad = (n) => String(n).padStart(2, "0");
  return `00:${pad(Math.floor(Math.random() * 60))}:${pad(Math.floor(Math.random() * 60))}`;
}

window.BodycamCameras = {
  BRANDS: BODYCAM_BRANDS,
  BRAND_ORDER: BODYCAM_BRAND_ORDER,
  FACTION_ORDER: BODYCAM_FACTION_ORDER,
  randomSerial: bodycamRandomSerial,
  randomTimer: bodycamRandomTimer,
};
