// js/latest-video.js
// "Latest video" widget - newest upload pulled from the public YouTube feed.
"use strict";

/**
 * YouTube publishes a per-channel Atom feed that needs no API key, but serves
 * it without an Access-Control-Allow-Origin header, so a static page cannot
 * read it directly. The feed is therefore pulled through a public CORS proxy,
 * with a second proxy behind it and a localStorage cache in front, so a normal
 * visit usually hits neither.
 *
 * Every failure path is silent: the section stays hidden and the page looks
 * exactly as it did before the widget existed.
 */
window.GumaLatestVideo = (function () {
  const CHANNEL_ID = "UC1uYJszfaKTzbbz7jMiXBFg";
  const CHANNEL_NAME = "Dami";
  const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  // Tried in order; the first one returning a parsable feed wins.
  const PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];

  const CACHE_KEY = "guma_latest_video";
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const FETCH_TIMEOUT_MS = 8000;

  const NS_ATOM = "http://www.w3.org/2005/Atom";
  const NS_YT = "http://www.youtube.com/xml/schemas/2015";
  const NS_MEDIA = "http://search.yahoo.com/mrss/";

  // ── Cache ────────────────────────────────────────────────────

  /**
   * @returns {{video: object, stale: boolean}|null} cached entry, or null when
   *   there is nothing usable stored
   */
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.video || !parsed.video.videoId) return null;

      return { video: parsed.video, stale: Date.now() - (parsed.ts || 0) > CACHE_TTL_MS };
    } catch {
      return null;
    }
  }

  function writeCache(video) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), video }));
    } catch {
      /* private mode / quota - the widget works without the cache */
    }
  }

  // ── Feed ─────────────────────────────────────────────────────

  async function fetchText(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function textOf(node) {
    return node ? node.textContent.trim() : "";
  }

  /**
   * @param {string} xml - raw Atom feed
   * @returns {{videoId: string, title: string, published: string, thumb: string}|null}
   */
  function parseFeed(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    if (doc.getElementsByTagName("parsererror").length) return null;

    const entry = doc.getElementsByTagNameNS(NS_ATOM, "entry")[0];
    if (!entry) return null;

    const video = {
      videoId: textOf(entry.getElementsByTagNameNS(NS_YT, "videoId")[0]),
      title: textOf(entry.getElementsByTagNameNS(NS_ATOM, "title")[0]),
      published: textOf(entry.getElementsByTagNameNS(NS_ATOM, "published")[0]),
      thumb: entry.getElementsByTagNameNS(NS_MEDIA, "thumbnail")[0]?.getAttribute("url") || "",
    };

    return video.videoId && video.title ? video : null;
  }

  async function loadFeed() {
    for (const buildUrl of PROXIES) {
      const xml = await fetchText(buildUrl(FEED_URL));
      if (!xml) continue;

      const video = parseFeed(xml);
      if (video) return video;
    }
    return null;
  }

  // ── Rendering ────────────────────────────────────────────────

  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function buildThumb(video) {
    const wrap = document.createElement("div");
    wrap.className = "guma-video-thumb";

    const img = document.createElement("img");
    // maxresdefault exists only for HD uploads, so the feed's own thumbnail
    // (hqdefault) is the guaranteed fallback. It is 4:3 with letterbox bars,
    // which object-cover crops back off inside the 16:9 slot.
    img.src = `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    if (video.thumb) {
      img.addEventListener("error", () => {
        img.src = video.thumb;
      }, { once: true });
    }

    const play = document.createElement("span");
    play.className = "guma-video-play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML = `<svg viewBox="0 0 24 24" class="h-6 w-6 fill-current"><path d="M8 5v14l11-7z"/></svg>`;

    wrap.append(img, play);
    return wrap;
  }

  function buildCard(video) {
    const card = document.createElement("a");
    card.className = "guma-video-card";
    card.href = `https://www.youtube.com/watch?v=${video.videoId}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `Watch on YouTube: ${video.title}`);

    const body = document.createElement("div");
    body.className = "guma-video-body";

    const kicker = document.createElement("span");
    kicker.className = "guma-video-kicker";
    kicker.textContent = "Newest upload";

    // textContent, not innerHTML - the title comes straight off the feed.
    const title = document.createElement("h3");
    title.className = "guma-video-title";
    title.textContent = video.title;

    const meta = document.createElement("p");
    meta.className = "guma-video-meta";
    meta.textContent = [CHANNEL_NAME, formatDate(video.published)].filter(Boolean).join(" · ");

    const cta = document.createElement("span");
    cta.className = "guma-video-cta";
    cta.innerHTML =
      `<svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/></svg>` +
      `<span>Watch on YouTube</span>`;

    body.append(kicker, title, meta, cta);
    card.append(buildThumb(video), body);
    return card;
  }

  function show(section, mount, video) {
    mount.replaceChildren(buildCard(video));
    if (section) section.hidden = false;
  }

  // ── Entry point ──────────────────────────────────────────────

  /**
   * Renders the newest video into `mountId` and reveals `sectionId`.
   * Cached data paints immediately; a stale or missing cache triggers a fetch.
   *
   * @param {string} [mountId] - id of the container the card is rendered into
   * @param {string} [sectionId] - id of the section unhidden once there is data
   */
  function init(mountId = "latestVideo", sectionId = "latestVideoSection") {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    const section = sectionId ? document.getElementById(sectionId) : null;
    const cached = readCache();

    if (cached) show(section, mount, cached.video);
    if (cached && !cached.stale) return;

    loadFeed().then((video) => {
      if (!video) return;
      writeCache(video);
      show(section, mount, video);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  return { init };
})();
