// Shared image upload zones - click, drag & drop, clipboard paste.
// Replaces the per-page FileReader duplicates in app.js / business-card.js /
// bodycam-overlay.js. Every zone is a .guma-drop box wrapping a hidden
// <input type="file">.

(function () {
  /** @type {HTMLElement|null} Zone that should receive the next Ctrl+V. */
  let pasteTarget = null;

  /**
   * Read an image file into a data URL and push it into the zone's preview.
   *
   * @param {File|null|undefined} file
   * @param {Object} cfg resolved zone config
   */
  function readFile(file, cfg) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataURL = ev.target.result;

      if (cfg.previewEl) {
        cfg.previewEl.src = dataURL;
        cfg.previewEl.classList.remove("hidden");
        cfg.previewEl.style.display = "";
      }
      if (cfg.textEl) {
        cfg.textEl.textContent = cfg.textAfter || file.name;
      }

      cfg.onLoad?.(dataURL, file);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Turn a .guma-drop box into a full upload zone.
   *
   * @param {{zone: string, input: string, text?: string, preview?: string,
   *          textAfter?: string, onLoad?: (dataURL: string, file: File) => void}} opts
   * @returns {boolean} false when the page does not have these elements
   */
  function init(opts) {
    const zone = document.getElementById(opts.zone);
    const input = document.getElementById(opts.input);
    if (!zone || !input) return false;

    const cfg = {
      textEl: opts.text ? document.getElementById(opts.text) : null,
      previewEl: opts.preview ? document.getElementById(opts.preview) : null,
      textAfter: opts.textAfter,
      onLoad: opts.onLoad,
    };

    // ── Click / keyboard ──────────────────────────────────────────────
    // The hidden input lives inside the zone, so its own click must not
    // bounce back through this handler.
    zone.addEventListener("click", (e) => {
      if (e.target === input) return;
      input.click();
    });
    zone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });

    // ── Picker ────────────────────────────────────────────────────────
    input.addEventListener("change", (e) => {
      readFile(e.target.files?.[0], cfg);
      // Allow re-picking the same file right after clearing it.
      e.target.value = "";
    });

    // ── Drag & drop ───────────────────────────────────────────────────
    ["dragenter", "dragover"].forEach((type) =>
      zone.addEventListener(type, (e) => {
        e.preventDefault();
        zone.classList.add("is-hot");
      })
    );

    ["dragleave", "drop"].forEach((type) =>
      zone.addEventListener(type, (e) => {
        e.preventDefault();
        // Moving between children of the zone is not a real leave.
        if (type === "dragleave" && e.relatedTarget && zone.contains(e.relatedTarget)) return;
        zone.classList.remove("is-hot");
      })
    );

    zone.addEventListener("drop", (e) => readFile(e.dataTransfer?.files?.[0], cfg));

    // ── Clipboard routing ─────────────────────────────────────────────
    // Only the focused zone gets the pasted image, so pages with their own
    // window-level paste handler (bodycam) keep working.
    zone.addEventListener("focus", () => (pasteTarget = zone));
    zone.addEventListener("blur", () => {
      if (pasteTarget === zone) pasteTarget = null;
    });

    zone._gumaUpload = cfg;
    return true;
  }

  // Capture phase so a consumed paste never reaches page-level handlers.
  window.addEventListener(
    "paste",
    (e) => {
      const cfg = pasteTarget?._gumaUpload;
      if (!cfg) return;

      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          readFile(item.getAsFile(), cfg);
          return;
        }
      }
    },
    true
  );

  window.GumaUpload = { init };
})();
