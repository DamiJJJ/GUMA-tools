// js/guma-locker.js
// ── GUMA Evidence Locker (easter-egg registry) ────────────────
// Standalone, vanilla, no imports. Exposes window.GumaLocker.
// Every easter egg is a piece of evidence. Finding one calls
// GumaLocker.collect("<id>"), which stores it in the shared profile
// (js/guma-profile.js) and, the first time only, shows a toast.
// The locker itself - the cabinet on about.html - is drawn by
// js/evidence-locker.js from list() / progress().
// New egg: add an entry to EVIDENCE, then call collect() from the
// egg's own code. The locker pages through the exhibits and pads its
// last page with "Soon" slots; the total grows with the registry, and
// a locker that was closed once keeps its lockerClosedAt for good.

"use strict";

window.GumaLocker = (function () {
  // ── Config ───────────────────────────────────────────────────
  const TOAST_MS = 4500;
  const TOAST_FADE_MS = 300; // matches the .guma-toast transition
  const LOCKER_URL = "about.html#evidence-locker";
  const EXHIBIT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // ── Icons ─────────────────────────────────────────────────────
  // Each call returns a fresh element: the toast and the locker each
  // need their own copy. Sized by their container (.guma-toast-icon,
  // .guma-locker-icon), so they carry no size classes of their own.

  function _el(markup) {
    const tpl = document.createElement("template");
    tpl.innerHTML = markup.trim();
    return tpl.content.firstElementChild;
  }

  // The GUMA shield on its own - the logo that got stretched.
  function logoIcon() {
    if (typeof gumaLogoSymbolPaths !== "function") return _el(`<img src="assets/brand/svg/guma-symbol.svg" alt="" />`);
    return _el(`<svg viewBox="32 12 192 234" aria-hidden="true" focusable="false">${gumaLogoSymbolPaths()}</svg>`);
  }

  // The branded tire from the burnout scene (js/tire-spin.js), or the
  // plain tire asset on a page that does not load it.
  function tireIcon() {
    if (window.GumaTireSpin) return window.GumaTireSpin.create().el;
    return _el(`<img src="assets/tire.svg" alt="" />`);
  }

  // A patrol car lightbar (assets/police.svg, inlined so the outline can
  // follow the theme via currentColor). Each lens throws a soft glow in the
  // colours of the lightbar egg's lamps (js/guma-styles.js), spilling
  // past the viewBox (overflow="visible") like light would. Lenses and
  // glows carry the hover hooks for the locker (.guma-kod3-blue / -red).
  // Gradient ids are numbered: the toast and the locker each hold a copy.
  let _kod3Seq = 0;
  function lightbarIcon() {
    const id = `gumaKod3${++_kod3Seq}`;
    const glow = (name, rgb) => `
      <radialGradient id="${id}${name}">
        <stop offset="0%" stop-color="rgb(${rgb})" stop-opacity="1"/>
        <stop offset="35%" stop-color="rgb(${rgb})" stop-opacity="0.6"/>
        <stop offset="70%" stop-color="rgb(${rgb})" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="rgb(${rgb})" stop-opacity="0"/>
      </radialGradient>`;
    return _el(`
      <svg viewBox="0 0 512 512" class="guma-kod3-icon" overflow="visible" aria-hidden="true" focusable="false">
        <defs>${glow("Blue", "60, 125, 255")}${glow("Red", "255, 30, 45")}</defs>
        <ellipse class="guma-kod3-blue" cx="139" cy="270" rx="215" ry="200" fill="url(#${id}Blue)"/>
        <ellipse class="guma-kod3-red" cx="375" cy="270" rx="215" ry="200" fill="url(#${id}Red)"/>
        <path fill="#7A6D79" d="M494.5 372.642h-477c-5.523 0-10-4.477-10-10 0-14.704 11.92-26.623 26.623-26.623h443.754c14.704 0 26.623 11.92 26.623 26.623 0 5.523-4.477 10-10 10z"/>
        <path fill="#685E68" d="M477.877 336.019h-40c14.704 0 26.623 11.919 26.623 26.623 0 5.523-4.477 10-10 10h40c5.523 0 10-4.477 10-10 0-14.704-11.92-26.623-26.623-26.623z"/>
        <g class="guma-kod3-blue">
          <path fill="#26A6FE" d="M244 336.019H34.5v-60.877c0-27.614 22.386-50 50-50H244z"/>
          <rect x="194" y="225.142" width="50" height="110.877" fill="#0593FC"/>
        </g>
        <g class="guma-kod3-red">
          <path fill="#FD8087" d="M480.25 336.019h-209.5V225.142h159.5c27.614 0 50 22.386 50 50z"/>
          <path fill="#FE646F" d="M430.25 225.142h-40c27.614 0 50 22.386 50 50v60.877h40v-60.877c0-27.615-22.386-50-50-50z"/>
        </g>
        <path fill="#F3F0F3" d="M278.231 336.019h-44.462V223.765c0-5.523 4.477-10 10-10h24.462c5.523 0 10 4.477 10 10z"/>
        <g fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">
          <path d="M455.877 372.642H494.5c5.523 0 10-4.477 10-10 0-14.704-11.92-26.623-26.623-26.623H34.123C19.419 336.019 7.5 347.938 7.5 362.642c0 5.523 4.477 10 10 10h408.52"/>
          <path d="M144.5 225.142h89.269"/>
          <path d="M34.5 336.019v-60.877c0-27.614 22.386-50 50-50H117"/>
          <path d="M278.231 225.142H430.25c27.614 0 50 22.386 50 50v60.877"/>
          <path d="M278.231 336.019h-44.462V223.765c0-5.523 4.477-10 10-10h24.462c5.523 0 10 4.477 10 10z"/>
          <path d="M256 139.358v22.045M156.965 165.895l11.023 19.091M355.035 165.895l-11.023 19.091"/>
        </g>
      </svg>`);
  }

  // The donut from the search egg (js/donut-egg.js).
  function donutIcon() {
    return _el(`<img src="assets/donut.svg" alt="" />`);
  }

  // A rubber stamp over its red INTERNAL AFFAIRS imprint, from the arrest
  // report egg (js/internal-affairs-egg.js). The outline follows the theme
  // via currentColor; the tool and the imprint carry the hover hooks
  // (.guma-ia-tool / .guma-ia-ink).
  function iaStampIcon() {
    return _el(`
      <svg viewBox="0 0 100 100" class="guma-ia-icon" aria-hidden="true" focusable="false">
        <g class="guma-ia-ink" fill="none" stroke="#c8102e" transform="rotate(-6 50 79)">
          <rect x="10" y="64" width="80" height="30" rx="3" stroke-width="3"/>
          <rect x="14.5" y="68.5" width="71" height="21" rx="1.5" stroke-width="1"/>
          <g fill="#c8102e" stroke="none" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="900" text-anchor="middle" letter-spacing="0.5">
            <text x="50" y="77.5">INTERNAL</text>
            <text x="50" y="86.5">AFFAIRS</text>
          </g>
        </g>
        <g class="guma-ia-tool" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">
          <rect x="44" y="24" width="12" height="14" fill="#a8714a"/>
          <ellipse cx="50" cy="16" rx="13" ry="10" fill="#8a5a3b"/>
          <rect x="22" y="37" width="56" height="13" rx="3" fill="#c48a5c"/>
          <rect x="25" y="50" width="50" height="6" rx="1" fill="#c8102e"/>
        </g>
      </svg>`);
  }

  // A wanted poster with a rubber stamp across it, from the wanted poster
  // eggs (js/reward-egg.js): the reward on the poster and the stamp text
  // differ per egg. The sheet outline follows the theme via currentColor;
  // the stamp carries the hover hook (.guma-reward-stamp).
  function wantedPosterIcon(reward, stampMain, stampSub) {
    return _el(`
      <svg viewBox="6 1 88 98" class="guma-reward-icon" aria-hidden="true" focusable="false">
        <rect x="18" y="5" width="64" height="90" rx="3" fill="#f5f5f2"/>
        <path d="M21 5h58a3 3 0 0 1 3 3v13H18V8a3 3 0 0 1 3-3z" fill="#c1121f"/>
        <text x="50" y="17.5" fill="#ffffff" font-family="Impact, Arial, Helvetica, sans-serif" font-size="10" text-anchor="middle" letter-spacing="0.5">WANTED</text>
        <rect x="26" y="27" width="20" height="24" fill="#d7dae0"/>
        <path d="M28 51c0-6 3.5-9 8-9s8 3 8 9z" fill="#b3b8c2"/>
        <circle cx="36" cy="35.5" r="5" fill="#b3b8c2"/>
        <path d="M52 30h22M52 36h18M52 42h22M52 48h14" stroke="#b3b8c2" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="26" y="74" width="48" height="14" rx="2" fill="#c1121f"/>
        <text x="50" y="84.5" fill="#ffffff" font-family="Impact, Arial, Helvetica, sans-serif" font-size="9" text-anchor="middle"${reward.length > 4 ? ' textLength="40" lengthAdjust="spacingAndGlyphs"' : ""}>${reward}</text>
        <rect x="18" y="5" width="64" height="90" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <g class="guma-reward-stamp">
          <g fill="none" stroke="#c8102e">
            <rect x="11" y="52" width="78" height="22" rx="3" stroke-width="2.6"/>
            <rect x="14" y="55" width="72" height="16" rx="1.5" stroke-width="0.9"/>
          </g>
          <g fill="#c8102e" font-family="Impact, Arial, Helvetica, sans-serif" text-anchor="middle">
            <text x="50" y="64" font-size="9" textLength="62" lengthAdjust="spacingAndGlyphs">${stampMain}</text>
            <text x="50" y="70.5" font-size="6" letter-spacing="0.8">${stampSub}</text>
          </g>
        </g>
      </svg>`);
  }

  const publicEnemyIcon = () => wantedPosterIcon("$10,000,000", "PUBLIC ENEMY", "No. 1");
  const nobodyIcon = () => wantedPosterIcon("$0", "NOBODY IS LOOKING", "FOR HIM");

  // ── Evidence registry ─────────────────────────────────────────
  // Order = exhibit letter. `fx` names the hover replay in the locker
  // (.guma-locker-icon[data-fx]). Police terms (title, "Exhibit",
  // stamps) stay English; the notes are Polish, like the About copy.
  const EVIDENCE = [
    {
      id: "logo-band",
      title: "Guma LEA",
      note: "Logo w nagłówku naciągnięte jak guma. Na szczęście wróciło na miejsce.",
      fx: "band",
      icon: logoIcon,
    },
    {
      id: "burnout",
      title: "Palimy gumę!",
      note: "Ślady opon, kłęby dymu i jedno bardzo gorące koło na stronie „O projekcie”.",
      fx: "spin",
      icon: tireIcon,
    },
    {
      id: "lightbar",
      title: "KOD 3",
      note: "Dziesięć przełączeń motywu w pięć sekund. Reaguj w kodzie 3.",
      fx: "flash",
      icon: lightbarIcon,
    },
    {
      id: "donut",
      title: "Jedziemy na pączki",
      note: "Jedno słowo w wyszukiwarce i z nieba lecą pączki. Stereotyp potwierdzony.",
      fx: "bite",
      icon: donutIcon,
    },
    {
      id: "internal-affairs",
      title: "Sam siebie zakuł",
      note: "Zatrzymał sam siebie. Sprawa trafia do Wydziału Wewnętrznego.",
      fx: "stamp",
      icon: iaStampIcon,
    },
    {
      id: "public-enemy",
      title: "Wróg publiczny",
      note: "Dziesięć milionów dolarów za głowę. Szuka go całe San Andreas.",
      fx: "slam",
      icon: publicEnemyIcon,
    },
    {
      id: "nobody",
      title: "Nikt",
      note: "Nawet straż rybacka go nie szuka.",
      fx: "slam",
      icon: nobodyIcon,
    },
  ];

  const _profile = window.GumaProfile;

  function _find(id) {
    return EVIDENCE.find((e) => e.id === id) || null;
  }

  function _exhibit(item) {
    return EXHIBIT_LETTERS[EVIDENCE.indexOf(item)] || "?";
  }

  function _evidence() {
    return _profile ? _profile.get().evidence : {};
  }

  // ── Public API ────────────────────────────────────────────────
  /** True once `id` has been collected in this browser. */
  function has(id) {
    return !!_evidence()[id];
  }

  /**
   * Registered evidence only - ids of retired eggs are not counted.
   * @returns {{found: number, total: number}}
   */
  function progress() {
    const found = _evidence();
    return {
      found: EVIDENCE.filter((e) => found[e.id]).length,
      total: EVIDENCE.length,
    };
  }

  function isComplete() {
    const p = progress();
    return p.found === p.total;
  }

  /** When the locker was first completed (ms), or null. */
  function closedAt() {
    return _profile ? _profile.get().lockerClosedAt : null;
  }

  /**
   * Every exhibit in order, with its collection time (ms) or null.
   * @returns {{id, exhibit, title, note, fx, collectedAt, icon: () => Element}[]}
   */
  function list() {
    const found = _evidence();
    return EVIDENCE.map((e) => ({
      id: e.id,
      exhibit: _exhibit(e),
      title: e.title,
      note: e.note,
      fx: e.fx,
      collectedAt: found[e.id] || null,
      icon: e.icon,
    }));
  }

  /**
   * Every slot on the locker shelf: list() followed by "Soon"
   * placeholders ({ soon: true, exhibit }) for eggs that do not exist
   * yet, padding the last page so every page is a full grid.
   * @param {number} pageSize slots per page; 0 = no padding
   */
  function slots(pageSize) {
    const items = list();
    const pad = pageSize ? (pageSize - (items.length % pageSize)) % pageSize : 0;
    for (let i = 0; i < pad; i++) {
      items.push({ soon: true, exhibit: EXHIBIT_LETTERS[EVIDENCE.length + i] || "?" });
    }
    return items;
  }

  /**
   * Logs a found egg. Safe to call on every trigger: only the first
   * call per id stores it and shows the toast.
   * @param {string} id evidence id from EVIDENCE
   * @returns {boolean} true when this call collected it
   */
  function collect(id) {
    const item = _find(id);
    if (!item) {
      console.warn(`[GumaLocker] unknown evidence "${id}"`);
      return false;
    }
    if (!_profile || has(id)) return false;

    let closedNow = false;
    _profile.update((p) => {
      const now = Date.now();
      p.evidence[id] = now;
      if (!p.lockerClosedAt && EVIDENCE.every((e) => p.evidence[e.id])) {
        p.lockerClosedAt = now;
        closedNow = true;
      }
    });
    _showToast(item, closedNow);
    return true;
  }

  /**
   * Called with the profile after every change (here or in another tab).
   * @returns {() => void} unsubscribe
   */
  function subscribe(fn) {
    return _profile ? _profile.subscribe(fn) : () => {};
  }

  /** Empties the locker - for testing from the console. */
  function reset() {
    _profile?.update((p) => {
      p.evidence = {};
      p.lockerClosedAt = null;
    });
  }

  // ── Toast ─────────────────────────────────────────────────────
  // One element, mounted hidden on load and reused: the Tailwind CDN
  // compiles classes it finds in the DOM, so a toast injected on demand
  // would paint unstyled for a frame. role="status" stays in the DOM so
  // screen readers announce the text when it changes.
  let _toast = null;
  let _hideTimer = 0;
  let _clearTimer = 0;

  function _mountToast() {
    if (_toast || !document.body) return _toast;
    _toast = _el(`
      <div class="guma-toast" role="status">
        <a class="guma-toast-link" href="${LOCKER_URL}" tabindex="-1">
          <span class="guma-toast-icon" data-toast-icon></span>
          <span class="guma-toast-body">
            <span class="guma-toast-kicker" data-toast-kicker></span>
            <span class="guma-toast-title" data-toast-title></span>
          </span>
          <span class="guma-toast-count" data-toast-count></span>
        </a>
      </div>`);
    // Hovering holds the toast so it can be read and clicked.
    _toast.addEventListener("mouseenter", () => clearTimeout(_hideTimer));
    _toast.addEventListener("mouseleave", () => {
      if (_toast.classList.contains("is-visible")) _scheduleHide(1500);
    });
    document.body.appendChild(_toast);
    return _toast;
  }

  function _scheduleHide(ms) {
    clearTimeout(_hideTimer);
    _hideTimer = setTimeout(_hideToast, ms);
  }

  function _hideToast() {
    if (!_toast) return;
    _toast.classList.remove("is-visible");
    _toast.querySelector(".guma-toast-link").setAttribute("tabindex", "-1");
    // Emptied once faded, so a screen reader does not find stale text.
    _clearTimer = setTimeout(() => {
      _toast.querySelectorAll("[data-toast-icon], [data-toast-kicker], [data-toast-title], [data-toast-count]").forEach((n) => (n.textContent = ""));
    }, TOAST_FADE_MS);
  }

  function _showToast(item, closedNow) {
    const toast = _mountToast();
    if (!toast) return;
    clearTimeout(_clearTimer);

    const p = progress();
    const icon = toast.querySelector("[data-toast-icon]");
    icon.textContent = "";
    icon.appendChild(item.icon());
    toast.querySelector("[data-toast-kicker]").textContent = closedNow ? "Case closed" : "Evidence collected";
    toast.querySelector("[data-toast-title]").textContent = `Exhibit ${_exhibit(item)} - ${item.title}`;
    toast.querySelector("[data-toast-count]").textContent = `${p.found}/${p.total}`;
    toast.classList.toggle("is-closed", closedNow);
    toast.querySelector(".guma-toast-link").removeAttribute("tabindex");
    toast.classList.add("is-visible");
    _scheduleHide(TOAST_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _mountToast, { once: true });
  } else {
    _mountToast();
  }

  return { collect, has, list, slots, progress, isComplete, closedAt, subscribe, reset };
})();
