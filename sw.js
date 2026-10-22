// sw.js
// ── GUMA service worker ───────────────────────────────────────
// Makes the app installable and usable offline. Same-origin GETs only;
// cross-origin calls (Supabase counters, Kick, randomuser.me) go straight
// to the network untouched.
//
// Pages and scripts are network-first, so a deploy is picked up on the
// next load and HTML never runs against stale JS. Images and other assets
// are stale-while-revalidate since they rarely change.

"use strict";

// ── Config ───────────────────────────────────────────────────
// Bump only to force-drop everything cached by older versions.
const CACHE = "guma-v1";
const PRECACHE = ["./", "index.html", "manifest.json"];

// ── Lifecycle ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ── Strategies ────────────────────────────────────────────────
function _store(request, response) {
  if (response && response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

async function _networkFirst(request) {
  try {
    return _store(request, await fetch(request));
  } catch (e) {
    // Query strings (e.g. ?preview_live=1) must not block the offline fallback.
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await caches.match("index.html");
      if (home) return home;
    }
    throw e;
  }
}

async function _staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => _store(request, response))
    .catch(() => cached);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}

// ── Fetch routing ─────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/assets/")) {
    event.respondWith(_staleWhileRevalidate(request, event));
  } else {
    event.respondWith(_networkFirst(request));
  }
});
