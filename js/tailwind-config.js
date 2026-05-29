tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── DARK THEME ──
        "guma-bg": "#04045e",
        "guma-bg-soft": "#0a0a72",
        "guma-panel": "#16213e",
        "guma-panel-2": "#1a2a4a",
        "guma-input": "#0f3460",
        "guma-dark": "#0f1e3d",
        "guma-footer": "#020338",
        "guma-gold": "#f0c040",
        "guma-gold-dark": "#c8960c",
        "guma-border": "#2a2a4a",
        "guma-border-2": "#2a2a5a",
        "guma-text": "#eeeeee",
        "guma-muted": "#aaaaaa",
        "guma-success": "#2f9e44",
        "guma-soon": "#6b7280",
        "guma-danger": "#7b0000",
        "guma-danger-h": "#cc0000",

        // ── LIGHT THEME ──
        "guma-l-bg": "#eef2f9",
        "guma-l-bg-soft": "#f8fafd",
        "guma-l-panel": "#ffffff",
        "guma-l-panel-2": "#e8eef9",
        "guma-l-input": "#e3eaf5",
        "guma-l-dark": "#d6e0ed",
        "guma-l-footer": "#dde4f0",
        "guma-l-gold": "#2d4787",
        "guma-l-gold-soft": "#5d7ab0",
        "guma-l-border": "#d4dceb",
        "guma-l-border-2": "#bfc9dd",
        "guma-l-text": "#0f0f3a",
        "guma-l-muted": "#5a5e7a",
      },
      boxShadow: {
        panel: "0 12px 32px rgba(0,0,0,.28)",
        glow: "0 0 0 1px rgba(240,192,64,.15), 0 10px 30px rgba(0,0,0,.18)",
        canvas: "0 4px 24px rgba(0,0,0,.5)",
        // ── light variants ──
        "panel-light": "0 8px 24px rgba(20,20,40,.06), 0 2px 6px rgba(20,20,40,.04)",
        "glow-light": "0 0 0 1px rgba(45,71,135,.20), 0 12px 30px rgba(20,20,40,.06)",
        "canvas-light": "0 4px 18px rgba(20,20,40,.08)",
      },
      maxWidth: {
        "8xl": "1400px",
      },
      fontFamily: {
        sans: ["Segoe UI", "Arial", "sans-serif"],
      },
      keyframes: {
        "guma-fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "guma-fade-up-dim": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "0.38", transform: "translateY(0)" },
        },
        "guma-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "guma-slide-in-left": {
          from: { opacity: "0", transform: "translateX(-28px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "guma-slide-in-right": {
          from: { opacity: "0", transform: "translateX(28px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "guma-header-drop": {
          from: { opacity: "0", transform: "translateY(-100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "guma-mobile-open": {
          from: { opacity: "0", transform: "translateY(-8px)", maxHeight: "0", overflow: "hidden" },
          to: { opacity: "1", transform: "translateY(0)", MaxHeight: "600px", overflow: "hidden" },
        },
        "guma-slide-up-out": {
          from: { opacity: "1", transform: "translateY(0)", maxHeight: "600px" },
          to: { opacity: "0", transform: "translateY(-8px)", maxHeight: "0" },
        },
        "guma-dropdown-open": {
          from: { opacity: "0", transform: "translateY(-6px) scaleY(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scaleY(1)" },
        },
      },
      animation: {
        "guma-header-drop": "guma-header-drop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-fade-up": "guma-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-fade-up-dim": "guma-fade-up-dim 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-fade-in": "guma-fade-in 0.4s ease both",
        "guma-slide-in-left": "guma-slide-in-left 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-slide-in-right": "guma-slide-in-right 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-mobile-open": "guma-mobile-open 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-slide-up-out": "guma-slide-up-out 0.22s ease-in both",
        "guma-dropdown-open": "guma-dropdown-open 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
};

// Wstrzykuje wspólne klasy animacji jako <style type="text/tailwindcss"> —
// Tailwind CDN runtime odbierze je przez MutationObserver razem z blokami stron.
(function () {
  const style = document.createElement("style");
  style.type = "text/tailwindcss";
  style.textContent = `
    @layer components {
      .guma-anim-header-drop {
        @apply animate-guma-header-drop;
      }
      .guma-page-title {
        @apply animate-guma-fade-up;
        animation-delay: 0.1s;
      }
      .guma-faction-switcher-wrap {
        @apply animate-guma-fade-in;
        animation-delay: 0.25s;
      }
      .guma-panel-form {
        @apply animate-guma-slide-in-left;
        animation-delay: 0.15s;
      }
      .guma-panel-preview {
        @apply animate-guma-slide-in-right;
        animation-delay: 0.25s;
      }
      .guma-reveal {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .guma-reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .guma-tile-stagger {
        opacity: 0;
        @apply animate-guma-fade-up;
        animation-play-state: paused;
      }
      .guma-tile-stagger.is-playing {
        animation-play-state: running;
      }
      #gumaMobileMenu.is-open {
        @apply animate-guma-mobile-open;
      }
      #gumaMobileMenu.is-closing {
        @apply animate-guma-slide-up-out;
      }
      [id$="Menu"]:not(#gumaMobileMenu).is-open {
        @apply animate-guma-dropdown-open;
        transform-origin: top left;
      }
            .guma-card {
        transition:
          transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
          border-color 0.25s ease,
          background-color 0.25s ease,
          box-shadow 0.35s ease !important;
      }
      .guma-card:not(.guma-card-disabled):hover {
        transform: translateY(-6px) !important;
      }
      html:not(.dark) .guma-card:not(.guma-card-disabled):hover {
        box-shadow:
          0 0 0 1px rgba(45, 71, 135, 0.25),
          0 18px 40px rgba(20, 20, 40, 0.08),
          0 0 28px rgba(45, 71, 135, 0.08) !important;
      }
      html.dark .guma-card:not(.guma-card-disabled):hover {
        box-shadow:
          0 0 0 1px rgba(240, 192, 64, 0.3),
          0 20px 48px rgba(0, 0, 0, 0.35),
          0 0 32px rgba(240, 192, 64, 0.08) !important;
      }
      .guma-card-disabled {
        filter: grayscale(0.5) brightness(0.72);
      }
      html:not(.dark) .guma-card-disabled {
        filter: grayscale(0.4) brightness(0.96) !important;
      }
      .guma-tile-stagger.guma-card-disabled {
        @apply animate-guma-fade-up-dim;
      }
      .guma-reveal {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
      .guma-card {
        transition: border-color 0.15s ease, background-color 0.15s ease !important;
      }
      .guma-card:not(.guma-card-disabled):hover {
        transform: none !important;
      }
      .guma-badge-wrap {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
