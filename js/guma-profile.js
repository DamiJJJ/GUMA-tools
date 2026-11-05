// js/guma-profile.js
// ── GUMA user profile (localStorage) ──────────────────────────
// Standalone, vanilla, no imports. Exposes window.GumaProfile.
// One shared object per browser for everything the app remembers
// about the user across pages: collected easter-egg evidence (see
// js/guma-locker.js) today, the generated-documents rank counter
// later. Without localStorage (private mode, blocked storage) the
// profile lives in memory for the current page and nothing throws.

"use strict";

window.GumaProfile = (function () {
  // ── Config ───────────────────────────────────────────────────
  const KEY = "guma:profile";
  const SCHEMA_VERSION = 1;

  const _subs = new Set();
  // Set once a write fails: from then on this page reads and writes
  // the in-memory copy, so a full or blocked storage cannot hand back
  // a stale profile (and replay "first find" toasts on every click).
  let _memory = null;
  let _warned = false;

  // ── Internal: schema ──────────────────────────────────────────
  function _blank() {
    return { schemaVersion: SCHEMA_VERSION, evidence: {}, lockerClosedAt: null };
  }

  function _clone(profile) {
    return JSON.parse(JSON.stringify(profile));
  }

  function _warn(what, e) {
    if (_warned) return;
    _warned = true;
    console.warn(`[GumaProfile] ${what} failed, keeping the profile in memory:`, e);
  }

  // Fills in anything an older (or hand-edited) profile is missing,
  // so callers can always rely on the full v1 shape.
  function _migrate(profile) {
    const p = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
    if (!p.evidence || typeof p.evidence !== "object" || Array.isArray(p.evidence)) p.evidence = {};
    if (typeof p.lockerClosedAt !== "number") p.lockerClosedAt = null;
    p.schemaVersion = SCHEMA_VERSION;
    return p;
  }

  // ── Internal: read / write JSON ───────────────────────────────
  function _read() {
    if (_memory) return _clone(_memory);
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? _migrate(JSON.parse(raw)) : _blank();
    } catch (e) {
      _warn("read", e); // blocked storage or a corrupt value
      return _blank();
    }
  }

  function _write(profile) {
    if (!_memory) {
      try {
        localStorage.setItem(KEY, JSON.stringify(profile));
        return;
      } catch (e) {
        _warn("write", e);
      }
    }
    _memory = _clone(profile);
  }

  function _notify(profile) {
    _subs.forEach((fn) => {
      try {
        fn(profile);
      } catch (e) {
        console.warn("[GumaProfile] subscriber failed:", e);
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────
  /** Fresh copy of the profile - safe to mutate, never cached. */
  function get() {
    return _read();
  }

  /**
   * Read -> mutate -> write -> notify. The mutator edits the profile
   * in place; subscribers then receive the saved copy.
   * @param {(profile: Object) => void} mutator
   * @returns {Object} the saved profile
   */
  function update(mutator) {
    const profile = _read();
    mutator(profile);
    _write(profile);
    _notify(_read());
    return profile;
  }

  /**
   * Called with the new profile after every local update and after
   * another tab changes it.
   * @param {(profile: Object) => void} fn
   * @returns {() => void} unsubscribe
   */
  function subscribe(fn) {
    _subs.add(fn);
    return () => _subs.delete(fn);
  }

  // ── Cross-tab sync ────────────────────────────────────────────
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) _notify(_read());
  });

  return { get, update, subscribe };
})();
