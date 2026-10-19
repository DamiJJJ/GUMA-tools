const GUMA_SUPABASE_URL = "https://gmbmkafaytrvywcavqob.supabase.co";
const GUMA_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtYm1rYWZheXRydnl3Y2F2cW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjQxOTksImV4cCI6MjA5MjYwMDE5OX0.ejRcJFfC2HDqtChOdugnyiyjza7_QlSAA5TpL7RlUy4";

// ─────────────────────────────────────────────────────────────────────────────

const _hdrs = {
  apikey: GUMA_SUPABASE_KEY,
  Authorization: `Bearer ${GUMA_SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function _rpc(fn, params = {}) {
  try {
    const res = await fetch(`${GUMA_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: _hdrs,
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function _getCounter(key) {
  try {
    const res = await fetch(`${GUMA_SUPABASE_URL}/rest/v1/counters?key=eq.${encodeURIComponent(key)}&select=value`, { headers: _hdrs });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

function _fmt(n) {
  if (n === null || n === undefined) return "—";
  n = Number(n);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (n >= 10_000) return Math.round(n / 1000) + "k";
  return n.toLocaleString("pl-PL");
}

async function trackVisit() {
  const SK = "guma_visited";
  if (sessionStorage.getItem(SK)) {
    return _getCounter("visits");
  }
  sessionStorage.setItem(SK, "1");
  return _rpc("increment_counter", { counter_key: "visits" });
}

async function trackDownload(generatorKey) {
  return _rpc("increment_counter", { counter_key: `downloads_${generatorKey}` });
}

async function getDownloadCount(generatorKey) {
  return _getCounter(`downloads_${generatorKey}`);
}

async function getDownloadCounts(generatorKeys) {
  try {
    const keys = generatorKeys.map((k) => `downloads_${k}`).join(",");
    const res = await fetch(`${GUMA_SUPABASE_URL}/rest/v1/counters?key=in.(${keys})&select=key,value`, { headers: _hdrs });
    if (!res.ok) return null;
    const rows = await res.json();
    const counts = {};
    rows.forEach((row) => {
      counts[row.key.replace(/^downloads_/, "")] = Number(row.value) || 0;
    });
    return counts;
  } catch {
    return null;
  }
}

async function initVisitCounter(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const count = await trackVisit();
  if (count !== null) {
    el.textContent = _fmt(count);
    el.closest("[data-guma-counter]")?.removeAttribute("hidden");
  }
}

async function initDownloadCounter(generatorKey, elId, btnId) {
  const el = document.getElementById(elId);
  const btn = document.getElementById(btnId);
  if (!el) return;

  const count = await getDownloadCount(generatorKey);
  if (count !== null) {
    el.textContent = _fmt(count);
    el.closest("[data-guma-counter]")?.removeAttribute("hidden");
  }

  if (btn) {
    btn.addEventListener("click", async () => {
      const newCount = await trackDownload(generatorKey);
      if (newCount !== null) {
        el.textContent = _fmt(newCount);
      }
    });
  }
}

// ── "Hot" / "Popular" generator flags ────────────────────────────
// Flag #0 goes to the most-generated tile, #1 to the runner-up.
const HOT_FLAGS = [
  {
    label: "Hot",
    cls: "guma-tile-flag-hot",
    iconCls: "text-orange-500 dark:text-orange-300",
    // lucide: flame
    icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  },
  {
    label: "Popular",
    cls: "guma-tile-flag-popular",
    iconCls: "text-guma-l-gold dark:text-guma-gold",
    // lucide: trending-up
    icon: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  },
];

const _HOT_CACHE_KEY = "guma_hot_top";
const _HOT_CACHE_TTL = 10 * 60 * 1000; // refetch at most every 10 min per tab

async function _getHotRanking(generatorKeys) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(_HOT_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.ts < _HOT_CACHE_TTL) return cached.top;
  } catch {}
  const counts = await getDownloadCounts(generatorKeys);
  if (!counts) return null;
  const top = generatorKeys
    .filter((k) => (counts[k] || 0) > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, HOT_FLAGS.length);
  try {
    sessionStorage.setItem(_HOT_CACHE_KEY, JSON.stringify({ ts: Date.now(), top }));
  } catch {}
  return top;
}

function _flagSvg(icon, size, fill = "none") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"` +
    ` fill="${fill}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"` +
    ` stroke-linejoin="round" aria-hidden="true">${icon}</svg>`
  );
}

// Bare tinted icon for a nav link (title doubles as the tooltip).
function _makeFlagIcon(flag, fill) {
  const el = document.createElement("span");
  el.className = `guma-tile-flag-icon ${flag.iconCls}`;
  el.title = flag.label;
  el.setAttribute("aria-label", flag.label);
  el.innerHTML = _flagSvg(flag.icon, 12, fill);
  return el;
}

// variant: undefined → corner pill (index tiles), "icon" → bare tinted icon
// for the nav link's flag slot.
function _makeHotFlag(flag, variant) {
  if (variant === "icon") return _makeFlagIcon(flag);
  const el = document.createElement("span");
  el.className = `guma-tile-flag guma-tile-flag-corner ${flag.cls}`;
  el.innerHTML = _flagSvg(flag.icon, 12) + flag.label;
  return el;
}

/**
 * Nav links keep their trend / new icons in one slot pinned to the right edge,
 * out of the text flow, so a link that is both new and trending shows both.
 */
function _navFlagSlot(link) {
  let slot = link.querySelector(":scope > .guma-nav-flags");
  if (!slot) {
    slot = document.createElement("span");
    slot.className = "guma-nav-flags";
    link.appendChild(slot);
  }
  return slot;
}

// Moves a nav link to the front of its category (no-op if already first).
function _moveToNavGroupStart(link) {
  const first = _navGroupStart(link);
  if (first !== link) first.parentElement.insertBefore(link, first);
}

/**
 * First link of the run of generator links this one sits in. A run is bounded
 * by anything that is not a generator link - the dropdown's own edges, or the
 * category heading above a group in the mobile menu - which is exactly what
 * makes "its category" mean the right thing in both menus.
 */
function _navGroupStart(el) {
  let first = el;
  while (first.previousElementSibling && first.previousElementSibling.matches("a[data-generator-key]")) {
    first = first.previousElementSibling;
  }
  return first;
}

/**
 * The desktop dropdowns draw their dividers as a top border on every link that
 * follows another link (a group label already carries its own), so after a
 * reorder the borders have to follow the new order.
 */
function _restripeDropdowns() {
  document.querySelectorAll("#gumaCardsMenu, #gumaReportsMenu, #gumaIngameMenu, #gumaImageMenu").forEach((menu) => {
    menu.querySelectorAll(":scope > a").forEach((a) => {
      const divided = !!a.previousElementSibling?.matches("a");
      a.classList.toggle("border-t", divided);
      a.classList.toggle("border-guma-l-border", divided);
      a.classList.toggle("dark:border-guma-border", divided);
    });
  });
}

// Decorates every [data-generator-key] element on the page. Index tiles get a
// corner pill; data-hot-flag="icon" (nav links) gets a bare icon. Both are
// reordered so the trending generator comes first in its own group - the tile
// grid for tiles, the dropdown or mobile category for nav links.
async function applyHotFlags() {
  const targets = [...document.querySelectorAll("[data-generator-key]")];
  if (!targets.length) return;

  const keys = [...new Set(targets.map((t) => t.dataset.generatorKey))];
  const top = await _getHotRanking(keys);
  if (!top || !top.length) return;

  const trendingTiles = [];
  const trendingNav = [];
  targets.forEach((el) => {
    const rank = top.indexOf(el.dataset.generatorKey);
    if (rank === -1) return;
    const variant = el.dataset.hotFlag;
    const flag = _makeHotFlag(HOT_FLAGS[rank], variant);
    if (variant === "icon") _navFlagSlot(el).prepend(flag);
    else el.appendChild(flag);
    if (variant === "icon" && el.matches("a[data-generator-key]")) trendingNav.push({ el, rank });
    else if (!variant) trendingTiles.push({ el, rank });
  });

  // Prepend worst rank first so the best ends up leftmost in its grid.
  trendingTiles
    .sort((a, b) => b.rank - a.rank)
    .forEach(({ el }) => el.parentElement.prepend(el));

  trendingNav
    .sort((a, b) => b.rank - a.rank)
    .forEach(({ el }) => _moveToNavGroupStart(el));
  _restripeDropdowns();
}

// ── "New" generator flags ────────────────────────────────────────
const NEW_FLAG = {
  label: "New",
  iconCls: "text-guma-l-gold dark:text-guma-gold",
  // lucide: star
  icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
};

/**
 * Marks the generators of the current release: index tiles get a "New" pill
 * under their description, nav links a star in their flag slot. Both move to
 * the front of their group. Must run before applyHotFlags() - its pass moves
 * Hot/Popular items to the very front, so they stay ahead of the new ones.
 */
function applyNewFlags(newKeys) {
  if (!newKeys || !newKeys.length) return;
  const isNew = (el) => newKeys.includes(el.dataset.generatorKey);
  const tiles = [...document.querySelectorAll(".guma-card[data-generator-key]")].filter(isNew);
  const navLinks = [...document.querySelectorAll('a[data-generator-key][data-hot-flag="icon"]')].filter(isNew);

  tiles.forEach((tile) => {
    const pill = document.createElement("span");
    pill.className = "guma-status guma-status-new";
    pill.innerHTML = _flagSvg(NEW_FLAG.icon, 12, "currentColor") + NEW_FLAG.label;
    tile.querySelector(".guma-card-desc")?.after(pill);
  });
  navLinks.forEach((link) => _navFlagSlot(link).appendChild(_makeFlagIcon(NEW_FLAG, "currentColor")));

  // Walk backwards so moving each to the front keeps the new ones in their
  // original relative order.
  tiles.reverse().forEach((tile) => tile.parentElement.prepend(tile));
  navLinks.reverse().forEach(_moveToNavGroupStart);
  _restripeDropdowns();
}

window.GumaCounters = {
  trackVisit,
  trackDownload,
  getDownloadCount,
  getDownloadCounts,
  initVisitCounter,
  initDownloadCounter,
  applyHotFlags,
  applyNewFlags,
  fmt: _fmt,
};
