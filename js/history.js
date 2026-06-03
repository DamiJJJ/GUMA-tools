// js/history.js
// ── GUMA saved cards (localStorage) ───────────────────────────
// Standalone, vanilla, no imports. Exposes window.GumaHistory.
// Per-generator storage keyed by window.GUMA_GENERATOR_KEY ("officer" | "firefighter").
// Auto-save on export, dedup of identical consecutive saves, pinned entries
// are exempt from the FIFO trim.

"use strict";

window.GumaHistory = (function () {
  // ── Config ───────────────────────────────────────────────────
  const LIMIT = 10; // max UNPINNED entries per generator (FIFO trim)
  const KEY_PREFIX = "guma:history:";

  // type -> Set<fn> subscribers
  const _subs = Object.create(null);

  // ── Internal: storage key ─────────────────────────────────────
  function _key(type) {
    return KEY_PREFIX + type;
  }

  // ── Internal: schema migration (v1) ───────────────────────────
  function _migrate(entry) {
    if (!entry || typeof entry !== "object") return entry;
    if (!entry.schemaVersion) entry.schemaVersion = 1;
    if (typeof entry.pinned !== "boolean") entry.pinned = false;
    return entry;
  }

  // ── Internal: read / write JSON ───────────────────────────────
  function _read(type) {
    try {
      const raw = localStorage.getItem(_key(type));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(_migrate);
    } catch (e) {
      console.warn("[GumaHistory] read failed:", e);
      return [];
    }
  }

  function _write(type, arr) {
    try {
      localStorage.setItem(_key(type), JSON.stringify(arr));
      return true;
    } catch (e) {
      const quota = e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014);
      if (quota) return _handleQuotaExceeded(type, arr);
      console.warn("[GumaHistory] write failed:", e);
      return false;
    }
  }

  // ── Internal: FIFO trim (oldest UNPINNED first) ───────────────
  function _trim(arr) {
    while (arr.length > LIMIT) {
      let idx = -1;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (!arr[i].pinned) {
          idx = i;
          break;
        }
      }
      if (idx === -1) break; // everything pinned — keep it all
      arr.splice(idx, 1);
    }
  }

  // ── Internal: quota recovery (drop oldest unpinned, retry) ────
  function _handleQuotaExceeded(type, arr) {
    const trimmed = arr.slice();
    while (trimmed.length > 0) {
      let idx = -1;
      for (let i = trimmed.length - 1; i >= 0; i--) {
        if (!trimmed[i].pinned) {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = trimmed.length - 1; // nothing unpinned — sacrifice oldest
      trimmed.splice(idx, 1);
      try {
        localStorage.setItem(_key(type), JSON.stringify(trimmed));
        console.warn("[GumaHistory] quota hit — trimmed to " + trimmed.length + " entries.");
        if (typeof window.GumaToast === "function") {
          window.GumaToast("Storage full — oldest saved card removed.");
        }
        return true;
      } catch (e) {
        /* keep trimming */
      }
    }
    console.warn("[GumaHistory] quota exceeded — could not save entry.");
    if (typeof window.GumaToast === "function") {
      window.GumaToast("Could not save: storage full.");
    }
    return false;
  }

  // ── Internal: notify subscribers ──────────────────────────────
  function _notify(type) {
    const set = _subs[type];
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("[GumaHistory] subscriber error:", e);
      }
    });
  }

  // ── Internal: cover-crop downscale to slot size (PNG) ─────────
  function _downscaleAvatar(dataUrl, targetW, targetH) {
    return new Promise((resolve) => {
      if (!dataUrl) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous"; // defensive; uploads are same-origin data URLs
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // cover-crop (centered) — same math as generateCard()
          const ratio = img.width / img.height;
          const areaR = targetW / targetH;
          let sx, sy, sw, sh;
          if (ratio > areaR) {
            sh = img.height;
            sw = sh * areaR;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = sw / areaR;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          resolve(dataUrl); // fall back to original on taint/error
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ── Internal: square thumbnail (PNG) ──────────────────────────
  // Accepts a <canvas> or a dataURL string. Returns Promise<dataURL>.
  function _makeThumbnail(source, size) {
    size = size || 64;
    return new Promise((resolve) => {
      const draw = (img, w, h) => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          const side = Math.min(w, h);
          const sx = (w - side) / 2;
          const sy = (h - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          resolve(null);
        }
      };

      if (source && typeof source !== "string" && source.tagName === "CANVAS") {
        draw(source, source.width, source.height);
      } else if (typeof source === "string" && source) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => draw(img, img.width, img.height);
        img.onerror = () => resolve(null);
        img.src = source;
      } else {
        resolve(null);
      }
    });
  }

  // ── Public: save (dedup, pinned-aware FIFO trim, returns id) ──
  function save(type, entry) {
    if (!type) return null;
    const arr = _read(type);

    // Dedup: identical payload to the most recent entry → skip near-duplicate.
    if (arr.length) {
      try {
        if (JSON.stringify(entry && entry.payload) === JSON.stringify(arr[0].payload)) {
          return arr[0].id;
        }
      } catch (e) {
        /* fall through to a normal save */
      }
    }

    const id =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "h_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    const full = Object.assign({}, entry, {
      id: id,
      type: type,
      createdAt: Date.now(),
      pinned: false,
      schemaVersion: (entry && entry.schemaVersion) || 1,
    });

    arr.unshift(full); // newest first
    _trim(arr);

    _write(type, arr);
    _notify(type);
    return id;
  }

  // ── Public: list (meta only; pinned first, then newest) ───────
  function list(type) {
    const meta = _read(type).map((e) => ({
      id: e.id,
      label: e.label,
      faction: e.faction || null,
      thumbnail: e.thumbnail,
      createdAt: e.createdAt,
      pinned: !!e.pinned,
    }));
    return meta.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  // ── Public: load (full entry) ─────────────────────────────────
  function load(type, id) {
    return _read(type).find((e) => e.id === id) || null;
  }

  // ── Public: pin / unpin ───────────────────────────────────────
  function setPinned(type, id, value) {
    const arr = _read(type);
    const e = arr.find((x) => x.id === id);
    if (!e) return;
    e.pinned = !!value;
    _write(type, arr);
    _notify(type);
  }

  // ── Public: remove single entry ───────────────────────────────
  function remove(type, id) {
    const next = _read(type).filter((e) => e.id !== id);
    _write(type, next);
    _notify(type);
  }

  // ── Public: clear all entries for type ────────────────────────
  function clear(type) {
    try {
      localStorage.removeItem(_key(type));
    } catch (e) {
      console.warn("[GumaHistory] clear failed:", e);
    }
    _notify(type);
  }

  // ── Public: subscribe (returns unsubscribe fn) ────────────────
  function subscribe(type, fn) {
    if (!type || typeof fn !== "function") return () => {};
    if (!_subs[type]) _subs[type] = new Set();
    _subs[type].add(fn);
    return () => _subs[type] && _subs[type].delete(fn);
  }

  // ── Export ────────────────────────────────────────────────────
  return {
    LIMIT: LIMIT,
    save: save,
    list: list,
    load: load,
    setPinned: setPinned,
    remove: remove,
    clear: clear,
    subscribe: subscribe,
    // internal helpers (used by app.js hooks)
    _key: _key,
    _read: _read,
    _write: _write,
    _migrate: _migrate,
    _trim: _trim,
    _downscaleAvatar: _downscaleAvatar,
    _makeThumbnail: _makeThumbnail,
    _handleQuotaExceeded: _handleQuotaExceeded,
  };
})();
