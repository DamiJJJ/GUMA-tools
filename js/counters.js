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

window.GumaCounters = {
  trackVisit,
  trackDownload,
  getDownloadCount,
  initVisitCounter,
  initDownloadCounter,
  fmt: _fmt,
};
