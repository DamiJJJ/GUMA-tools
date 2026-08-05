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
        "guma-rubber-ball": {
          // 1) hard sideways stretch (the squash)
          "0%": { transform: "translateY(0) scaleX(1) scaleY(1)" },
          "11%": { transform: "translateY(0) scaleX(1.42) scaleY(0.62)" },
          "18%": { transform: "translateY(0) scaleX(1.2) scaleY(0.8)", animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
          // 2) bounce 1 (highest)
          "30%": { transform: "translateY(-14px) scaleX(0.95) scaleY(1.05)", animationTimingFunction: "cubic-bezier(0.6, 0, 0.85, 0.4)" },
          "40%": { transform: "translateY(0) scaleX(1.2) scaleY(0.8)", animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
          // 3) bounce 2
          "50%": { transform: "translateY(-10px) scaleX(0.96) scaleY(1.04)", animationTimingFunction: "cubic-bezier(0.6, 0, 0.85, 0.4)" },
          "59%": { transform: "translateY(0) scaleX(1.14) scaleY(0.86)", animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
          // 4) bounce 3
          "67%": { transform: "translateY(-7px) scaleX(0.98) scaleY(1.03)", animationTimingFunction: "cubic-bezier(0.6, 0, 0.85, 0.4)" },
          "75%": { transform: "translateY(0) scaleX(1.09) scaleY(0.91)", animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
          // 5) bounce 4
          "82%": { transform: "translateY(-4px) scaleX(0.99) scaleY(1.02)", animationTimingFunction: "cubic-bezier(0.6, 0, 0.85, 0.4)" },
          "88%": { transform: "translateY(0) scaleX(1.05) scaleY(0.95)", animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.35, 1)" },
          // 6) bounce 5 (lowest)
          "93%": { transform: "translateY(-2px) scaleX(1) scaleY(1.01)", animationTimingFunction: "cubic-bezier(0.6, 0, 0.85, 0.4)" },
          "97%": { transform: "translateY(0) scaleX(1.03) scaleY(0.97)" },
          // 7) at rest
          "100%": { transform: "translateY(0) scaleX(1) scaleY(1)" },
        },

        // ── Easter egg "burnout" (about.html) ──
        // Tire drives in from the left, burns rubber in place, then launches
        // off to the right.
        "guma-egg-drive": {
          "0%": { transform: "translateX(-135vw) scaleX(1)", animationTimingFunction: "cubic-bezier(0.16, 0.9, 0.3, 1)" },
          "16%": { transform: "translateX(0) scaleX(1)" },
          "74%": { transform: "translateX(0) scaleX(1)", animationTimingFunction: "cubic-bezier(0.75, 0, 0.9, 0.25)" },
          "84%": { transform: "translateX(38vw) scaleX(1.18)", animationTimingFunction: "linear" },
          "100%": { transform: "translateX(155vw) scaleX(1.05)" },
        },
        // Fast jitter + squash that reads as a spinning wheel fighting for grip.
        "guma-egg-shake": {
          "0%": { transform: "translate(0, 0) rotate(0deg) scale(1, 1)" },
          "25%": { transform: "translate(-4px, 2px) rotate(-1.6deg) scale(1.05, 0.95)" },
          "50%": { transform: "translate(3px, -2px) rotate(1.3deg) scale(0.97, 1.03)" },
          "75%": { transform: "translate(-3px, 1px) rotate(-0.8deg) scale(1.03, 0.97)" },
          "100%": { transform: "translate(0, 0) rotate(0deg) scale(1, 1)" },
        },
        "guma-egg-smoke": {
          "0%": { opacity: "0", transform: "translate3d(0, 0, 0) scale(0.35)" },
          "18%": { opacity: "0.7" },
          "100%": { opacity: "0", transform: "translate3d(-150px, -110px, 0) scale(2.6)" },
        },
        "guma-egg-skid": {
          "0%": { opacity: "0", transform: "scaleX(0)" },
          "4%": { opacity: "0.9" },
          "16%": { transform: "scaleX(1)" },
          "74%": { opacity: "0.9", transform: "scaleX(1)" },
          "100%": { opacity: "0", transform: "scaleX(1.2)" },
        },
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
        "guma-rubber-ball": "guma-rubber-ball 2.1s linear both",
        "guma-egg-drive": "guma-egg-drive 4.2s linear both",
        "guma-egg-shake": "guma-egg-shake 0.11s linear infinite",
        "guma-egg-smoke": "guma-egg-smoke 1.6s ease-out infinite",
        "guma-egg-skid": "guma-egg-skid 4.2s linear both",
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
      .guma-anim-rubber {
        @apply animate-guma-rubber-ball;
        transform-origin: bottom center;
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
      }
    }
  `;
  document.head.appendChild(style);
})();
