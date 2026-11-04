// js/guma-draft.js
// ── GUMA form drafts (localStorage) ───────────────────────────
// Standalone, vanilla, no imports. Exposes window.GumaDraft.
// Keeps the work-in-progress form of every generator across reloads, so a
// refresh or a closed tab never wipes a half-written report. Reuses the
// serialize/hydrate pair a generator already registers for saved cards;
// GumaHistoryWiring.register() attaches it automatically.
//
// One draft per generator. It is written on edits only and removed again
// when the form is back to its untouched state. On the next visit the page
// opens blank and <guma-draft-banner> offers to restore the draft. Until
// the user picks Restore or Discard nothing is saved, so the offered draft
// can't be overwritten; typing into the blank form counts as Discard.

"use strict";

window.GumaDraft = (function () {
  // ── Config ───────────────────────────────────────────────────
  const KEY_PREFIX = "guma:draft:";
  const SAVE_DELAY = 600; // ms of quiet after the last edit
  const EDIT_EVENTS = ["input", "change", "click", "pointerup"];

  let _cfg = null;
  let _baseline = null; // serialized untouched form, captured on load
  let _last = null; // last serialized state written (or removed)
  let _timer = null;
  let _ready = false; // no saving until the load-time check has finished
  let _offer = null; // { draft, banner } while a restore is being offered

  // ── Internal: storage ─────────────────────────────────────────
  function _key() {
    return KEY_PREFIX + (window.GUMA_GENERATOR_KEY ?? _cfg.key ?? "doc");
  }

  function _read() {
    try {
      const raw = localStorage.getItem(_key());
      const draft = raw ? JSON.parse(raw) : null;
      return draft && draft.payload ? draft : null;
    } catch (e) {
      return null;
    }
  }

  function _remove() {
    try {
      localStorage.removeItem(_key());
    } catch (e) {
      /* storage unavailable - nothing to remove */
    }
  }

  // ── Internal: save (debounced, skips unchanged states) ────────
  async function _save() {
    if (!_ready || _offer) return;
    try {
      const payload = await _cfg.serialize();
      const json = JSON.stringify(payload);
      if (json === _last) return;
      _last = json;
      if (json === _baseline) {
        _remove(); // edits were undone - nothing worth restoring
        return;
      }
      localStorage.setItem(_key(), JSON.stringify({ savedAt: Date.now(), payload }));
    } catch (err) {
      console.warn("[GumaDraft] save failed:", err);
    }
  }

  function _onEdit(e) {
    if (!_ready) return;
    if (_offer) {
      // Only a real edit of the blank form answers the offer; clicks around
      // the page (or on the banner itself) leave it open.
      const typed = e.isTrusted && (e.type === "input" || e.type === "change");
      if (!typed || e.target.closest?.("guma-draft-banner")) return;
      discard();
    }
    clearTimeout(_timer);
    _timer = setTimeout(_save, SAVE_DELAY);
  }

  function _flush() {
    if (!_timer) return;
    clearTimeout(_timer);
    _timer = null;
    _save();
  }

  // ── Internal: offer the stored draft on page load ─────────────
  async function _check() {
    try {
      _baseline = JSON.stringify(await _cfg.serialize());
      _last = _baseline;
      const draft = _read();
      if (draft && JSON.stringify(draft.payload) !== _baseline) _showOffer(draft);
      else if (draft) _remove();
    } catch (err) {
      console.warn("[GumaDraft] draft check failed:", err);
    }
    _ready = true;
  }

  function _showOffer(draft) {
    if (!customElements.get("guma-draft-banner")) return;
    const banner = document.createElement("guma-draft-banner");
    banner.savedAt = draft.savedAt;
    banner.onRestore = restore;
    banner.onDiscard = discard;
    _offer = { draft, banner };
    document.body.appendChild(banner);
  }

  function _closeOffer() {
    const offer = _offer;
    _offer = null;
    if (offer) offer.banner.remove();
    return offer;
  }

  // ── Public: attach the active generator ───────────────────────
  // cfg: { key, serialize, hydrate } - the GumaHistoryWiring config.
  function attach(cfg) {
    if (_cfg || !cfg || typeof cfg.serialize !== "function" || typeof cfg.hydrate !== "function") return;
    _cfg = cfg;

    EDIT_EVENTS.forEach((type) => document.addEventListener(type, _onEdit, true));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") _flush();
    });
    window.addEventListener("pagehide", _flush);

    // Let every generator's own load-time setup (defaults, faction, dates)
    // run first, so the baseline is the real untouched form.
    const start = () => setTimeout(_check, 0);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  }

  // ── Public: answer the restore offer ──────────────────────────
  async function restore() {
    const offer = _closeOffer();
    if (!offer) return;
    try {
      await _cfg.hydrate(offer.draft.payload);
      _last = JSON.stringify(offer.draft.payload);
    } catch (err) {
      console.warn("[GumaDraft] restore failed:", err);
    }
  }

  function discard() {
    if (!_closeOffer()) return;
    _remove();
  }

  return { attach: attach, restore: restore, discard: discard };
})();
