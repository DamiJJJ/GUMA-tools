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
        // ── light variants ──
        "panel-light": "0 8px 24px rgba(20,20,40,.06), 0 2px 6px rgba(20,20,40,.04)",
        "glow-light": "0 0 0 1px rgba(45,71,135,.20), 0 12px 30px rgba(20,20,40,.06)",
      },
      maxWidth: {
        "8xl": "2000px",
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
        // No max-height / overflow here on purpose: the drawer owns those
        // (.guma-mobile-menu) and a filled animation value would freeze them.
        "guma-mobile-open": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "guma-slide-up-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-8px)" },
        },
        "guma-dropdown-open": {
          from: { opacity: "0", transform: "translateY(-6px) scaleY(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scaleY(1)" },
        },
        // ── Header logo easter egg (click): rubber band ──
        // The wordmark is pulled to the right like a rubber band (pivot on its
        // left edge), snaps back past rest and wobbles out.
        "guma-logo-band": {
          "0%": { transform: "scale(1, 1)", animationTimingFunction: "cubic-bezier(0.3, 0, 0.3, 1)" },
          "24%": { transform: "scale(1.6, 0.78)", animationTimingFunction: "cubic-bezier(0.7, 0, 0.9, 0.5)" },
          "33%": { transform: "scale(0.7, 1.24)", animationTimingFunction: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
          "45%": { transform: "scale(1.2, 0.88)", animationTimingFunction: "ease-in-out" },
          "57%": { transform: "scale(0.9, 1.08)", animationTimingFunction: "ease-in-out" },
          "69%": { transform: "scale(1.07, 0.96)", animationTimingFunction: "ease-in-out" },
          "81%": { transform: "scale(0.98, 1.02)", animationTimingFunction: "ease-in-out" },
          "100%": { transform: "scale(1, 1)" },
        },
        // The shield leans after the band while it is pulled, then takes the
        // snap-back as a jelly squash.
        "guma-logo-recoil": {
          "0%": { transform: "translateX(0) rotate(0deg) scale(1, 1)", animationTimingFunction: "cubic-bezier(0.3, 0, 0.3, 1)" },
          "24%": { transform: "translateX(10px) rotate(5deg) scale(1, 1)", animationTimingFunction: "cubic-bezier(0.7, 0, 0.9, 0.5)" },
          "33%": { transform: "translateX(-12px) rotate(-4deg) scale(0.82, 1.14)", animationTimingFunction: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
          "45%": { transform: "translateX(4px) rotate(2deg) scale(1.12, 0.9)", animationTimingFunction: "ease-in-out" },
          "57%": { transform: "translateX(-2px) rotate(-1deg) scale(0.95, 1.05)", animationTimingFunction: "ease-in-out" },
          "71%": { transform: "translateX(0) rotate(0.5deg) scale(1.03, 0.98)", animationTimingFunction: "ease-in-out" },
          "100%": { transform: "translateX(0) rotate(0deg) scale(1, 1)" },
        },

        // ── About logo easter egg (click): badge stamp ──
        // The shield presses down like a rubber stamp and springs back.
        "guma-logo-stamp": {
          "0%": { transform: "scale(1) rotate(0deg)", animationTimingFunction: "cubic-bezier(0.5, 0, 0.75, 0)" },
          "18%": { transform: "scale(0.84) rotate(-6deg)", animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" },
          "42%": { transform: "scale(1.1) rotate(3deg)" },
          "62%": { transform: "scale(0.97) rotate(-1.5deg)" },
          "80%": { transform: "scale(1.02) rotate(0.5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        // The star winds up, spins a full turn with a pop and settles.
        "guma-logo-star-spin": {
          "0%": { transform: "rotate(0deg) scale(1)", animationTimingFunction: "cubic-bezier(0.5, 0, 0.75, 0)" },
          "20%": { transform: "rotate(-24deg) scale(0.8)", animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" },
          "72%": { transform: "rotate(375deg) scale(1.35)", animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        // The gold rule retracts and redraws from the left.
        "guma-logo-rule-sweep": {
          "0%": { transform: "scaleX(1)", animationTimingFunction: "cubic-bezier(0.5, 0, 0.75, 0)" },
          "30%": { transform: "scaleX(0)", animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" },
          "100%": { transform: "scaleX(1)" },
        },

        // ── Easter egg "burnout" (about.html) ──
        // The scene itself is driven from js/easter-egg.js; only the caption
        // entrance and the trigger nudge are CSS.
        "guma-egg-pop": {
          "0%": { opacity: "0", transform: "translateY(26px) scale(0.7) rotate(-4deg)" },
          "55%": { opacity: "1", transform: "translateY(0) scale(1.08) rotate(1.5deg)" },
          "72%": { transform: "scale(0.97) rotate(-1deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        // Feedback nudge on the trigger word so repeated clicks feel intentional.
        "guma-egg-poke": {
          "0%": { transform: "translateY(0) scale(1) rotate(0deg)" },
          "30%": { transform: "translateY(-3px) scale(1.07) rotate(-2.5deg)" },
          "60%": { transform: "translateY(1px) scale(0.98) rotate(1.5deg)" },
          "100%": { transform: "translateY(0) scale(1) rotate(0deg)" },
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
        "guma-logo-band": "guma-logo-band 1.25s linear both",
        "guma-logo-recoil": "guma-logo-recoil 1.25s linear both",
        "guma-logo-stamp": "guma-logo-stamp 0.9s linear both",
        "guma-logo-star-spin": "guma-logo-star-spin 1.1s linear both",
        "guma-logo-rule-sweep": "guma-logo-rule-sweep 0.9s linear both",
        "guma-egg-pop": "guma-egg-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guma-egg-poke": "guma-egg-poke 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
};

// Injects the shared animation classes as <style type="text/tailwindcss"> -
// the Tailwind CDN runtime picks them up via MutationObserver alongside the
// per-page blocks.
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
      /* From the xl breakpoint the generator layout is two columns, so the
         preview sticks under the header while the form scrolls. */
      .guma-panel-preview {
        @apply animate-guma-slide-in-right xl:sticky xl:top-20;
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
      /* Brand logo (inline SVG from gumaLogoSvg(): header + <guma-logo>).
         SVG children transform around their own user-space origin, so every
         animated part sits in a group pre-translated to its pivot. Only
         vector parts move, so the logo stays sharp - never transform the
         whole link or <svg>, which would rasterise it. */
      /* Hover (star turn) is driven from JS, see gumaWireLogoHover(). */
      .guma-logo-rule {
        transform-box: fill-box;
        transform-origin: left center;
      }
      .guma-logo.is-snapping .guma-logo-word {
        @apply animate-guma-logo-band;
      }
      .guma-logo.is-snapping .guma-logo-symbol {
        @apply animate-guma-logo-recoil;
      }
      .guma-logo.is-stamping .guma-logo-symbol {
        @apply animate-guma-logo-stamp;
      }
      .guma-logo.is-stamping .guma-logo-star-spin {
        @apply animate-guma-logo-star-spin;
      }
      .guma-logo.is-stamping .guma-logo-rule {
        @apply animate-guma-logo-rule-sweep;
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
      /* Reduced motion: reveal everything up-front and drop the movement,
         keeping only the cheap colour transitions. */
      @media (prefers-reduced-motion: reduce) {
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
        .guma-logo.is-stamping *,
        .guma-logo.is-snapping * {
          animation: none !important;
        }
      }
    }
  `;
  document.head.appendChild(style);
})();
