// ── Shared wiring for GUMA saved cards / reports ──────────────
// Sits on top of window.GumaHistory + <guma-history-drawer>.
// A generator registers its serialize/hydrate/buildLabel once; this
// module owns the save orchestration, the GUMA_* globals and the
// universal faction descriptor. Vanilla, no imports — global script.

"use strict";

window.GumaHistoryWiring = (function () {
  let _cfg = null;

  // ── Universal faction descriptor (path only — never base64) ──
  function buildFaction(payload, opts) {
    opts = opts || {};
    const fk = payload && payload.FACTION_KEY;
    if (!fk) return null;
    if (fk === "custom") {
      const short = (typeof opts.customShort === "function" ? opts.customShort(payload) : "") || "Custom";
      return { key: "custom", short: short, icon: "assets/custom.png" };
    }
    const f = typeof FACTIONS !== "undefined" ? FACTIONS[fk] : null;
    return { key: fk, short: (f && f.short) || "", icon: (f && f.icon) || "" };
  }

  // ── DOM helpers (safe: missing element / null value = no-op) ──
  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el == null || v == null) return;
    if (el.tagName === "SELECT") {
      if (Array.from(el.options).some((o) => o.value === String(v))) el.value = String(v);
    } else {
      el.value = v;
    }
  }
  function setChecked(id, v) {
    const el = document.getElementById(id);
    if (el) el.checked = !!v;
  }

  // ── Register the active generator's wiring ───────────────────
  // cfg: { key, noun?, serialize, hydrate, buildLabel, buildFaction? }
  function register(cfg) {
    _cfg = cfg || null;
    if (cfg) {
      if (cfg.key) window.GUMA_GENERATOR_KEY = cfg.key;
      if (cfg.noun) window.GUMA_GENERATOR_NOUN = cfg.noun;
      if (typeof cfg.hydrate === "function") window.GUMA_HYDRATE = cfg.hydrate;
    }
  }

  // ── Persist a snapshot on export (call from Download / Copy) ──
  async function save(canvas) {
    if (!_cfg || typeof GumaHistory === "undefined") return;
    try {
      const type = window.GUMA_GENERATOR_KEY ?? _cfg.key ?? "doc";
      const payload = await _cfg.serialize(); // serialize may be sync or async
      const thumbSource = (payload && payload.photoDataUrl) || canvas; // photo if any, else the canvas
      const thumbnail = await GumaHistory._makeThumbnail(thumbSource, 64);
      const label = typeof _cfg.buildLabel === "function" ? _cfg.buildLabel(payload) : "";
      const faction = typeof _cfg.buildFaction === "function" ? _cfg.buildFaction(payload) : null;
      GumaHistory.save(type, { schemaVersion: 1, type, label, faction, thumbnail, payload });
    } catch (err) {
      console.warn("[GumaHistory] save failed:", err);
    }
  }

  return { buildFaction: buildFaction, register: register, save: save, setVal: setVal, setChecked: setChecked };
})();
