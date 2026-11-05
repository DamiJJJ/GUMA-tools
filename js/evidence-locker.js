"use strict";

// Evidence Locker (about.html): a two-door locker whose right door swings open
// on hover, showing the GUMA shield inside. Clicking it opens the
// locker: every easter egg as an exhibit - collected ones with their icon and
// date, missing ones blurred out under a CLASSIFIED stamp, and empty "Soon"
// slots for eggs that are still to come. The data and the collect() API live
// in js/guma-locker.js; this file only draws the trigger and the dialog.
// Opt-in via [data-guma-locker] on the trigger button. about.html#evidence-
// locker opens the dialog on arrival - the "evidence collected" toast links
// there.

(function () {
  // ── Config ──────────────────────────────────────────────────────────
  const HASH = "#evidence-locker";

  let root = null; // dialog root, mounted hidden on init
  let trigger = null;
  let opener = null; // element to hand focus back to on close
  let unsubscribe = null;

  // ── Cabinet icon ────────────────────────────────────────────────────
  // Flat two-door locker on a plinth (viewBox 64x64): vents top and bottom,
  // the handle by each door's free edge. The right door is hinged on its
  // right edge (.guma-locker-door) and swings out past the hinge on hover;
  // `is-open` poses it open for good. Colours are theme classes in
  // js/guma-styles.js. The compartments are dark in both themes, so the
  // shield behind the door is always the white variant. Only the outer face
  // carries vents and handle (.guma-locker-door-outer) - the open door shows
  // its bare inner face.
  const DOOR_W = 21.5;
  const DOOR_TOP = 4.5;
  const DOOR_H = 51;

  function doorSvg(x, cls = "") {
    const vents = [10, 14, 46, 50].map((y) => `M${x + 4} ${y}h${DOOR_W - 8}`).join("");
    return `
        <g class="${cls}">
          <rect x="${x}" y="${DOOR_TOP}" width="${DOOR_W}" height="${DOOR_H}" rx="1" class="guma-locker-door-face"/>
          <rect x="${x + DOOR_W - 2.5}" y="${DOOR_TOP}" width="2.5" height="${DOOR_H}" class="guma-locker-door-edge"/>
          <g class="guma-locker-door-outer">
            <path d="${vents}" class="guma-locker-vent" fill="none" stroke-width="2" stroke-linecap="round"/>
            <rect x="${x + 3}" y="25" width="2.6" height="10" rx="1.3" class="guma-locker-handle"/>
          </g>
        </g>`;
  }

  function cabinetSvg(extraClass) {
    const logo = typeof gumaLogoSymbolPaths === "function" ? gumaLogoSymbolPaths(true) : "";
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="guma-locker-cabinet ${extraClass || ""}">
        <rect x="9" y="56" width="46" height="7" rx="1.5" class="guma-locker-plinth"/>
        <rect x="6" y="1" width="52" height="58" rx="3" class="guma-locker-body"/>
        <rect x="9.5" y="${DOOR_TOP}" width="${DOOR_W}" height="${DOOR_H}" rx="1" class="guma-locker-inside"/>
        <rect x="33" y="${DOOR_TOP}" width="${DOOR_W}" height="${DOOR_H}" rx="1" class="guma-locker-inside"/>
        <g transform="translate(43.75 30) scale(0.08) translate(-128 -129)">${logo}</g>
        ${doorSvg(9.5)}
        ${doorSvg(33, "guma-locker-door")}
      </svg>`;
  }

  // ── Dialog ──────────────────────────────────────────────────────────
  // Every slot is rendered while the dialog is still hidden, and found /
  // classified slots share one set of elements that only toggle `hidden`:
  // the Tailwind CDN compiles classes it finds in the DOM, so markup that
  // first appeared on open would paint unstyled for a frame.
  const LOCK_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v2"/>
    </svg>`;

  function buildDialog() {
    const el = document.createElement("div");
    el.className = "guma-locker-root hidden";
    el.innerHTML = `
      <div class="guma-locker-overlay" data-locker-close></div>
      <div class="guma-locker-panel guma-scroll" role="dialog" aria-modal="true" aria-labelledby="gumaLockerTitle">
        <div class="guma-locker-head">
          <span class="guma-locker-head-icon">${cabinetSvg("is-open")}</span>
          <div class="guma-locker-head-text">
            <p class="guma-locker-kicker">GUMA Tools property room</p>
            <h2 id="gumaLockerTitle" class="guma-locker-title">Evidence Locker</h2>
          </div>
          <p class="guma-locker-stamp guma-locker-stamp-closed hidden" data-locker-closed>Case closed</p>
          <button type="button" class="guma-locker-close" data-locker-close aria-label="Close Evidence Locker">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="guma-locker-summary">
          <div class="guma-locker-summary-row">
            <p class="guma-locker-count" data-locker-count></p>
            <p class="guma-locker-soon-count" data-locker-soon></p>
          </div>
          <div class="guma-locker-progress"><span class="guma-locker-progress-bar" data-locker-bar></span></div>
        </div>
        <ul class="guma-locker-grid" data-locker-grid></ul>
        <p class="guma-locker-foot" data-locker-foot></p>
      </div>`;
    el.querySelectorAll("[data-locker-close]").forEach((n) => n.addEventListener("click", close));
    return el;
  }

  function formatDate(ms) {
    return new Date(ms).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  }

  // An empty tag for an egg that does not exist yet.
  function buildSoonSlot(item) {
    const li = document.createElement("li");
    li.className = "guma-locker-slot is-soon";
    li.innerHTML = `
      <p class="guma-locker-exhibit">Exhibit ${item.exhibit}</p>
      <div class="guma-locker-art"><div class="guma-locker-icon">${LOCK_SVG}</div></div>
      <p class="guma-locker-name">Soon</p>
      <p class="guma-locker-note">Nowy dowód jest już w drodze.</p>`;
    return li;
  }

  function buildSlot(item) {
    if (item.soon) return buildSoonSlot(item);
    const found = !!item.collectedAt;
    const li = document.createElement("li");
    li.className = `guma-locker-slot${found ? "" : " is-classified"}`;
    li.innerHTML = `
      <p class="guma-locker-exhibit">Exhibit ${item.exhibit}</p>
      <div class="guma-locker-art">
        <div class="guma-locker-icon" data-fx="${item.fx || ""}"></div>
        <p class="guma-locker-stamp guma-locker-stamp-classified${found ? " hidden" : ""}" aria-hidden="true">Classified</p>
      </div>
      <p class="guma-locker-name"></p>
      <p class="guma-locker-note"></p>
      <p class="guma-locker-date${found ? "" : " hidden"}"></p>`;
    li.querySelector(".guma-locker-icon").appendChild(item.icon());
    li.querySelector(".guma-locker-name").textContent = found ? item.title : "Unidentified";
    li.querySelector(".guma-locker-note").textContent = found ? item.note : "Jeszcze nie znaleziony. Szukaj dalej.";
    if (found) li.querySelector(".guma-locker-date").textContent = `Collected ${formatDate(item.collectedAt)}`;
    return li;
  }

  function render() {
    const locker = window.GumaLocker;
    const { found, total, soon } = locker.progress();
    const closed = found === total;

    root.querySelector("[data-locker-count]").textContent = `${found}/${total} evidence collected`;
    const soonEl = root.querySelector("[data-locker-soon]");
    soonEl.textContent = `+${soon} coming soon`;
    soonEl.classList.toggle("hidden", !soon);
    root.querySelector("[data-locker-bar]").style.width = `${total ? (found / total) * 100 : 0}%`;

    const grid = root.querySelector("[data-locker-grid]");
    grid.textContent = "";
    locker.slots().forEach((item) => grid.appendChild(buildSlot(item)));

    root.querySelector("[data-locker-closed]").classList.toggle("hidden", !closed);
    root.querySelector("[data-locker-foot]").textContent = closed
      ? "Wszystkie dowody zabezpieczone. Sprawa zamknięta - przynajmniej na razie."
      : "Dowody są poukrywane w całym GUMA Tools. Miej oczy szeroko otwarte.";
  }

  function isOpen() {
    return root && !root.classList.contains("hidden");
  }

  function open() {
    if (!root || isOpen()) return;
    opener = document.activeElement;
    render();
    root.classList.remove("hidden");
    root.classList.add("flex");
    // Keep the open dialog in step with finds here or in another tab.
    unsubscribe = window.GumaLocker.subscribe(render);
    requestAnimationFrame(() => root.querySelector(".guma-locker-close").focus({ preventScroll: true }));
  }

  function close() {
    if (!isOpen()) return;
    root.classList.add("hidden");
    root.classList.remove("flex");
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    // Drop the hash so the toast link can open the dialog again.
    if (window.location.hash === HASH) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const back = opener && typeof opener.focus === "function" && opener !== document.body ? opener : trigger;
    back.focus({ preventScroll: true });
    opener = null;
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    trigger = document.querySelector("[data-guma-locker]");
    if (!trigger || !window.GumaLocker) return;

    trigger.innerHTML = cabinetSvg();
    trigger.addEventListener("click", open);

    root = buildDialog();
    document.body.appendChild(root);
    render();

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });
    window.addEventListener("hashchange", () => {
      if (window.location.hash === HASH) open();
    });
    // Two frames, so the CDN has compiled the freshly mounted dialog.
    if (window.location.hash === HASH) requestAnimationFrame(() => requestAnimationFrame(open));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
