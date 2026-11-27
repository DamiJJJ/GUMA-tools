// js/guma-season.js
// ── GUMA seasonal events ──────────────────────────────────────
// Standalone, vanilla, no imports. Exposes window.GumaSeason.
// Holiday decorations switch themselves on by date. Every season is
// one entry in SEASONS (a yearly date range, an on/off flag and its
// script) and one script of its own; outside its range nothing of
// it is loaded. A season script registers its decorations with
// GumaSeason.register("<id>", start), and start() runs once the page
// is ready, only while that season is active.
//
// The active season is also set as html[data-season="<id>"], so
// styles can follow it.
//
// Preview: ?season=<id> forces a season on, ?season=off switches
// them all off, ?season=auto goes back to the calendar. The choice
// sticks for the tab (sessionStorage), so it survives navigation.

"use strict";

window.GumaSeason = (function () {
  // ── Config ───────────────────────────────────────────────────
  // `from` / `to` are "MM-DD", both days included; a range may wrap
  // over New Year ("12-28" to "01-02"). `enabled: false` keeps a
  // season off whatever the date.
  const SEASONS = [
    { id: "christmas", from: "12-05", to: "12-27", enabled: true, script: "js/season-christmas.js" },
  ];
  const PARAM = "season";
  const STORE_KEY = "guma:season";
  const OFF = "off";
  const AUTO = "auto";

  const _started = new Set();
  const _registered = new Set();
  let _forced = null; // read once on load, see _override()

  // ── Internal: preview override ───────────────────────────────
  // A season id, OFF, or null (follow the calendar).
  function _override() {
    let value = null;
    try {
      value = new URLSearchParams(window.location.search).get(PARAM);
    } catch (e) {
      value = null;
    }
    try {
      if (value === AUTO) sessionStorage.removeItem(STORE_KEY);
      else if (value) sessionStorage.setItem(STORE_KEY, value);
      else value = sessionStorage.getItem(STORE_KEY);
    } catch (e) {
      // Blocked storage: the URL still works for this page.
    }
    if (value === OFF) return OFF;
    return SEASONS.some((s) => s.id === value) ? value : null;
  }

  // ── Internal: calendar ───────────────────────────────────────
  // "MM-DD" -> MMDD as a number, so dates compare in year order.
  function _mmdd(str) {
    const [m, d] = str.split("-").map(Number);
    return m * 100 + d;
  }

  function _inRange(season, date) {
    const today = (date.getMonth() + 1) * 100 + date.getDate();
    const from = _mmdd(season.from);
    const to = _mmdd(season.to);
    return from <= to ? today >= from && today <= to : today >= from || today <= to;
  }

  // ── Public API ───────────────────────────────────────────────
  /**
   * The season on at `date` (default: now), or null.
   * @param {Date} [date]
   * @returns {string | null} season id
   */
  function active(date = new Date()) {
    if (_forced === OFF) return null;
    if (_forced) return _forced;
    const season = SEASONS.find((s) => s.enabled && _inRange(s, date));
    return season ? season.id : null;
  }

  /** True while season `id` is on. */
  function is(id) {
    return active() === id;
  }

  /**
   * Called by a season script. `start` runs once, after the DOM is
   * ready, and only while that season is active - so a page may load
   * the script off-season just for what it exposes (the locker needs
   * a seasonal exhibit's sound all year).
   * @param {string} id season id from SEASONS
   * @param {() => void} start puts the decorations up
   */
  function register(id, start) {
    _registered.add(id);
    if (!is(id) || _started.has(id)) return;
    _started.add(id);
    _whenReady(start);
  }

  // ── Internal: loading ────────────────────────────────────────
  function _whenReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // Loaded after the page's own scripts, so a page that ships the
  // season script itself (about.html) is not given a second copy.
  function _load(season) {
    if (_registered.has(season.id)) return;
    const script = document.createElement("script");
    script.src = season.script;
    document.body.appendChild(script);
  }

  _forced = _override();
  const _current = active();
  if (_current) {
    document.documentElement.dataset.season = _current;
    _whenReady(() => _load(SEASONS.find((s) => s.id === _current)));
  }

  return { active, is, register };
})();
