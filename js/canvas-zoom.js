"use strict";

// ── Preview zoom for tall documents ──────────────────────────────────────────
// A tall sheet (the wanted poster) cannot be both whole and legible in the
// sticky preview box: fitted by width it scrolls, fitted by height it is tiny.
// This opens it fitted whole and lets the reader zoom in to check details,
// with the box scrolling in both directions once the sheet outgrows it.
//
// Zoom only changes the canvas' CSS display width, never its backing store,
// so the export is untouched and the photo croppers (js/photo-crop.js), which
// read the displayed size back on every sync, keep working at any zoom.
//
// Active from xl only, where the preview panel is sticky and its box is capped
// to the viewport. Below that the page scrolls a full-width sheet, which is
// already legible, so the shared preview classes are left in charge. The
// .guma-cz-on switch is set from here rather than a bare media query so that
// a page whose script failed to load keeps the plain capped preview.
//
// Classic global script, no ES modules: window.GumaCanvasZoom.create().

(function () {
  const ZOOM_MAX = 1; // native backing pixels - past that it only gets blurry
  const ZOOM_STEP = 1.25; // multiplicative, per button press
  const MEDIA = "(min-width: 1280px)"; // Tailwind xl

  function create() {
    let cfg = null;
    let mq = null;
    let active = false;
    let zoom = 1;
    // Follow the fit while the reader has not zoomed in, so a sheet that grows
    // as the form fills in stays whole instead of starting to scroll.
    let fitted = true;
    let outBtn = null;
    let inBtn = null;
    let label = null;

    /** Zoom at which the whole sheet fits the box - also the floor. */
    function fitZoom() {
      const c = cfg.canvas;
      if (!c.width || !c.height) return 1;
      // Width from the box itself: it is w-full, so it does not follow the
      // canvas. Height from its max-h cap: the box shrink-wraps the canvas, so
      // measuring it would hand back whatever zoom is already applied.
      // -2 for the canvas' own hairline border, which is outside its width.
      const availW = cfg.wrap.getBoundingClientRect().width - 2;
      const maxH = parseFloat(getComputedStyle(cfg.wrap).maxHeight);
      const availH = (Number.isFinite(maxH) ? maxH : window.innerHeight) - 2;
      if (!(availW > 0) || !(availH > 0)) return 1;
      return Math.min(availW / c.width, availH / c.height, ZOOM_MAX);
    }

    function apply(fit) {
      const w = cfg.wrap;
      // Keep the point at the centre of the box where it is across the zoom.
      const cx = w.scrollWidth ? (w.scrollLeft + w.clientWidth / 2) / w.scrollWidth : 0.5;
      const cy = w.scrollHeight ? (w.scrollTop + w.clientHeight / 2) / w.scrollHeight : 0.5;
      // Floored, so rounding can never push a fitted sheet 1px past the box
      // and summon a scrollbar.
      cfg.canvas.style.width = Math.floor(cfg.canvas.width * zoom) + "px";
      w.scrollLeft = cx * w.scrollWidth - w.clientWidth / 2;
      w.scrollTop = cy * w.scrollHeight - w.clientHeight / 2;

      if (label) label.textContent = Math.round(zoom * 100) + "%";
      if (outBtn) outBtn.disabled = zoom <= fit + 0.0005;
      if (inBtn) inBtn.disabled = zoom >= Math.max(ZOOM_MAX, fit) - 0.0005;
    }

    function setZoom(z) {
      if (!active) return;
      const fit = fitZoom();
      zoom = Math.min(Math.max(z, fit), Math.max(ZOOM_MAX, fit));
      fitted = zoom <= fit + 0.0005;
      apply(fit);
    }

    /** Re-measure after the sheet or its box changed size. */
    function refresh() {
      if (!active) return;
      const fit = fitZoom();
      zoom = fitted ? fit : Math.min(Math.max(zoom, fit), Math.max(ZOOM_MAX, fit));
      apply(fit);
    }

    function setActive(on) {
      active = on;
      cfg.wrap.classList.toggle("guma-cz-on", on);
      if (on) {
        fitted = true;
        refresh();
      } else {
        // Hand sizing back to the shared preview classes.
        cfg.canvas.style.width = "";
      }
    }

    // ── Control: − / readout / + ─────────────────────────────────────────
    function buildControl(host) {
      const mk = (text, title, fn, extra) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "guma-zoom-btn disabled:opacity-40 disabled:cursor-default" + (extra ? " " + extra : "");
        b.textContent = text;
        b.title = title;
        b.setAttribute("aria-label", title);
        b.addEventListener("click", fn);
        host.appendChild(b);
        return b;
      };
      outBtn = mk("−", "Zoom out", () => setZoom(zoom / ZOOM_STEP)); // real minus sign, not a hyphen
      label = mk("100%", "Fit the whole document", () => setZoom(0), "guma-zoom-value");
      inBtn = mk("+", "Zoom in", () => setZoom(zoom * ZOOM_STEP));
    }

    /**
     * @param {{canvas: HTMLCanvasElement, wrap: HTMLElement, control?: HTMLElement}} opts
     *   wrap is the scroll box around the canvas; control receives the buttons.
     */
    function attach(opts) {
      if (!opts || !opts.canvas || !opts.wrap) return;
      cfg = opts;
      if (cfg.control) buildControl(cfg.control);
      window.addEventListener("resize", refresh);
      mq = window.matchMedia(MEDIA);
      mq.addEventListener("change", (e) => setActive(e.matches));
      setActive(mq.matches);
    }

    return { attach, refresh };
  }

  window.GumaCanvasZoom = { create };
})();
