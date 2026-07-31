// Wspólne style aplikacji - wszystkie warstwy @layer base/components/utilities

(function () {
  const style = document.createElement("style");
  style.type = "text/tailwindcss";
  style.textContent = `
    @layer base {
      html {
        @apply h-full;
      }

      body {
        @apply min-h-full font-sans antialiased text-guma-l-text dark:text-guma-text;
        background-color: #eef2f9;
        background-image:
          radial-gradient(circle at top, rgba(45, 71, 135, 0.06), transparent 28%),
          linear-gradient(180deg, #f8fafd 0%, #eef2f9 40%, #dde4f0 100%);
        background-attachment: fixed;
      }

      /* Dark mode default = navy (index, business_card) */
      html.dark body {
        background-color: #03034a;
        background-image:
          radial-gradient(circle at top, rgba(240, 192, 64, 0.08), transparent 28%),
          linear-gradient(180deg, #06065f 0%, #04045e 40%, #03034a 100%);
      }

      /* Dark mode override = navy soft (officer, firearm, traffic) */
      html.dark body.theme-navy-soft {
        background-color: #03154a;
        background-image:
          radial-gradient(circle at top, rgba(240, 192, 64, 0.08), transparent 28%),
          linear-gradient(180deg, #06305f 0%, #04045e 40%, #03154a 100%);
      }

      /* Dark mode override = red (firefighter) */
      html.dark body.theme-red {
        background-color: #4a0303;
        background-image:
          radial-gradient(circle at top, rgba(240, 192, 64, 0.08), transparent 28%),
          linear-gradient(180deg, #5f0606 0%, #5e0404 40%, #4a0303 100%);
      }

      ::selection {
        background: rgba(45, 71, 135, 0.25);
        color: #ffffff;
      }
      html.dark ::selection {
        background: rgba(240, 192, 64, 0.35);
        color: #fff;
      }

      /* Date/time picker icon - invert tylko w dark */
      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="time"]::-webkit-calendar-picker-indicator,
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
      }
      html.dark input[type="date"]::-webkit-calendar-picker-indicator,
      html.dark input[type="time"]::-webkit-calendar-picker-indicator,
      html.dark input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(0.7);
      }

      /* Checkbox accent + size */
      input[type="checkbox"] {
        accent-color: #2d4787;
        width: 14px;
        height: 14px;
        cursor: pointer;
      }
      html.dark input[type="checkbox"] {
        accent-color: #f0c040;
      }
    }

    @layer components {
      /* ─── Layout ─── */
      .guma-page {
        @apply mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8 2xl:px-12;
      }
      .guma-topbar {
        @apply sticky top-0 z-30 border-b backdrop-blur
               border-guma-l-border bg-guma-l-bg/80
               dark:border-white/10 dark:bg-guma-bg/80;
      }
      .guma-brand {
        @apply inline-flex items-center gap-3 no-underline text-guma-l-text dark:text-guma-text;
      }
      .guma-brand-mark {
        @apply inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black
               border border-guma-l-gold/40 bg-guma-l-dark text-guma-l-gold shadow-glow-light
               dark:border-guma-gold/40 dark:bg-guma-dark dark:text-guma-gold dark:shadow-glow;
      }
      .guma-chip {
        @apply inline-flex items-center rounded-full border px-3 py-1
               text-[11px] font-semibold uppercase tracking-[0.16em]
               border-guma-l-gold/30 bg-guma-l-dark text-guma-l-gold/90
               dark:border-guma-gold/30 dark:bg-guma-dark dark:text-guma-gold/90;
      }

      /* ─── Panels ─── */
      .guma-panel {
        @apply rounded-2xl border
               border-guma-l-border bg-guma-l-panel shadow-panel-light
               dark:border-guma-border dark:bg-guma-panel dark:shadow-panel;
      }

      /* ─── Upload dropzone ─── */
      .guma-drop {
        @apply flex cursor-pointer flex-col items-center justify-center rounded-xl
               border-2 border-dashed px-4 py-5 text-center text-sm outline-none transition
               border-guma-l-border-2 text-guma-l-muted
               hover:border-guma-l-gold hover:text-guma-l-gold
               focus-visible:border-guma-l-gold focus-visible:text-guma-l-gold
               dark:border-guma-border-2 dark:text-guma-muted
               dark:hover:border-guma-gold dark:hover:text-guma-gold
               dark:focus-visible:border-guma-gold dark:focus-visible:text-guma-gold;
      }
      .guma-drop.is-hot {
        @apply border-guma-l-gold bg-guma-l-panel-2 text-guma-l-gold
               dark:border-guma-gold dark:bg-guma-panel-2 dark:text-guma-gold;
      }
      .guma-drop-hint {
        @apply mt-1 text-[11px] leading-5 text-guma-l-muted/80 dark:text-guma-muted/70;
      }

      /* ─── Themed scrollbar ─── */
      /* Raw hex instead of @apply — Tailwind cannot attach the dark: variant
         to a ::-webkit-scrollbar-* selector. Values mirror the guma-l-border-2
         / guma-l-gold and guma-border-2 / guma-gold tokens. */
      .guma-scroll {
        scrollbar-width: thin;
        scrollbar-color: #bfc9dd transparent;
      }
      .guma-scroll::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      .guma-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .guma-scroll::-webkit-scrollbar-thumb {
        background-color: #bfc9dd;
        border: 2px solid transparent;
        background-clip: padding-box;
        border-radius: 999px;
        transition: background-color 0.2s ease;
      }
      .guma-scroll::-webkit-scrollbar-thumb:hover {
        background-color: #2d4787;
      }
      .guma-scroll::-webkit-scrollbar-corner {
        background: transparent;
      }

      html.dark .guma-scroll {
        scrollbar-color: #2a2a5a transparent;
      }
      html.dark .guma-scroll::-webkit-scrollbar-thumb {
        background-color: #2a2a5a;
      }
      html.dark .guma-scroll::-webkit-scrollbar-thumb:hover {
        background-color: #f0c040;
      }

      /* ─── Canvas preview ─── */
      /* Scroll box around the canvas. From xl the preview panel is sticky,
         so the box is capped to the viewport and tall documents scroll
         inside it instead of stretching the page. */
      .guma-canvas-wrap {
        @apply flex w-full items-start justify-center overflow-y-auto overflow-x-hidden
               xl:max-h-[calc(100vh_-_21rem)];
      }
      /* Auto width + height keeps the intrinsic aspect ratio and caps the
         canvas at its native pixel size, so the preview never upscales
         into a blurry mess. A flat hairline edge, no drop shadow — every
         generator renders its document the same way.

         The max-h mirrors .guma-canvas-wrap's own cap. Without it the canvas
         was constrained by width only, so a tall document (an officer card
         carrying employment history is 840x1050) scaled to the panel's width
         and then overflowed its height, and the wrap scrolled. Constraining
         both axes makes a replaced element scale down to fit inside both while
         keeping its aspect ratio, which is what fits the card in the panel. */
      .guma-canvas-preview {
        @apply block h-auto w-auto min-w-0 max-w-full border
               border-guma-l-border-2 dark:border-guma-border-2
               xl:max-h-[calc(100vh_-_21rem)];
      }

      /* ─── Section titles (index) ─── */
      .guma-section-title {
        @apply text-center text-2xl font-bold uppercase tracking-[0.18em] md:text-3xl
               text-guma-l-gold dark:text-guma-gold;
      }
      .guma-section-subtitle {
        @apply mt-2 text-center text-sm uppercase tracking-[0.22em]
               text-guma-l-muted dark:text-guma-muted;
      }

      /* ─── Index tiles ─── */
      .guma-card {
        @apply relative flex h-full flex-col overflow-hidden rounded-2xl
               border p-6 transition duration-200
               border-guma-l-border bg-guma-l-panel/95 shadow-panel-light
               hover:-translate-y-1 hover:border-guma-l-gold hover:bg-guma-l-panel-2 hover:shadow-glow-light
               dark:border-guma-border dark:bg-guma-panel/95 dark:shadow-panel
               dark:hover:border-guma-gold dark:hover:bg-guma-panel-2 dark:hover:shadow-glow;
      }
      .guma-card-disabled {
        @apply cursor-not-allowed pointer-events-none;
      }
      .guma-badge-wrap {
        @apply mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border p-3
               border-guma-l-border bg-guma-l-dark
               dark:border-guma-border dark:bg-guma-dark;
      }
      .guma-badge-wrap img {
        @apply h-full w-full object-contain;
      }
      .guma-card-title {
        @apply text-lg font-bold uppercase tracking-[0.14em] transition
               text-guma-l-text dark:text-guma-text;
      }
      .guma-card-desc {
        @apply mt-3 text-sm leading-6 text-guma-l-muted dark:text-guma-muted;
      }
      .guma-status {
        @apply mt-5 inline-flex w-fit items-center rounded-full border px-3 py-1
               text-[11px] font-bold uppercase tracking-[0.18em];
      }
      .guma-status-available {
        @apply border-guma-l-gold bg-guma-l-input text-guma-l-gold
               dark:border-guma-gold dark:bg-guma-input dark:text-guma-gold;
      }
      .guma-status-soon {
        @apply border-slate-300 bg-slate-100 text-slate-500
               dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300;
      }
      .guma-tile-flag {
        @apply inline-flex items-center gap-1 rounded-full border
               px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em];
      }
      .guma-tile-flag-corner {
        @apply absolute right-3 top-3 z-10;
      }
      /* Nav links: the trend icon sits out of flow so labels never wrap */
      [data-hot-flag="icon"] {
        @apply relative;
      }
      .guma-tile-flag-icon {
        @apply absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center;
      }
      .guma-tile-flag-hot {
        @apply border-orange-500/50 bg-orange-100 text-orange-600
               dark:border-orange-400/50 dark:bg-orange-400/10 dark:text-orange-300;
      }
      .guma-tile-flag-popular {
        @apply border-guma-l-gold/50 bg-guma-l-input text-guma-l-gold
               dark:border-guma-gold/50 dark:bg-guma-gold/10 dark:text-guma-gold;
      }

      /* ─── Form labels/inputs (card generators) ─── */
      .guma-label {
        @apply mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em]
               text-guma-l-muted dark:text-guma-muted;
      }
      .guma-input {
        @apply w-full rounded-lg border px-3 py-2 text-sm transition
               border-guma-l-border-2 bg-guma-l-input text-guma-l-text placeholder:text-guma-l-muted/60
               focus:border-guma-l-gold focus:ring-1 focus:ring-guma-l-gold/40 focus:outline-none
               dark:border-guma-border-2 dark:bg-guma-input dark:text-white dark:placeholder:text-slate-500
               dark:focus:border-guma-gold dark:focus:ring-guma-gold/40;
      }
      .guma-select {
        @apply guma-input appearance-auto;
      }

      /* ─── Buttons ─── */
      .guma-btn-outline {
        @apply inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition
               border-guma-l-gold bg-guma-l-input text-guma-l-gold hover:bg-guma-l-gold hover:text-white
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-l-gold
               dark:border-guma-gold dark:bg-guma-input dark:text-guma-gold dark:hover:bg-guma-gold dark:hover:text-black
               dark:focus-visible:ring-guma-gold;
      }
      .guma-btn-primary {
        @apply inline-flex h-full min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-gold;
        background: linear-gradient(135deg, #f0c040, #c8960c);
        display: flex !important;
      }
      .guma-btn-support {
        @apply inline-flex h-full min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:opacity-90;
        background: linear-gradient(135deg, #6cdd5e, #4ab034);
      }
      .guma-btn-back {
        @apply inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition
               border-guma-l-gold/50 bg-guma-l-input text-guma-l-gold hover:border-guma-l-gold hover:bg-guma-l-gold hover:text-white
               dark:border-guma-gold/50 dark:bg-guma-input dark:text-guma-gold dark:hover:border-guma-gold dark:hover:bg-guma-gold dark:hover:text-black;
      }

      /* ─── Form section header ─── */
      .guma-form-section {
        @apply mb-4 border-b pb-2 text-[11px] font-bold uppercase tracking-[0.16em]
               border-guma-l-border text-guma-l-gold
               dark:border-guma-border dark:text-guma-gold;
      }

      /* ─── Faction switcher button ─── */
      .faction-btn {
        @apply flex w-24 cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition
               border-guma-l-border bg-guma-l-panel text-guma-l-muted hover:border-guma-l-gold hover:text-guma-l-gold
               dark:border-guma-border dark:bg-guma-panel dark:text-guma-muted dark:hover:border-guma-gold dark:hover:text-guma-gold;
      }
      .faction-btn.active {
        @apply border-guma-l-gold bg-guma-l-panel-2 text-guma-l-gold
               dark:border-guma-gold dark:bg-guma-panel-2 dark:text-guma-gold;
      }

      /* ─── Segmented control (e.g. card layout picker) ─── */
      .guma-seg {
        @apply flex w-full gap-2;
      }
      .guma-seg-btn {
        @apply flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5
               text-[11px] font-bold uppercase tracking-[0.14em] transition
               border-guma-l-border bg-guma-l-panel text-guma-l-muted hover:border-guma-l-gold hover:text-guma-l-gold
               dark:border-guma-border dark:bg-guma-panel dark:text-guma-muted dark:hover:border-guma-gold dark:hover:text-guma-gold;
      }
      .guma-seg-btn.active {
        @apply border-guma-l-gold bg-guma-l-panel-2 text-guma-l-gold
               dark:border-guma-gold dark:bg-guma-panel-2 dark:text-guma-gold;
      }

      /* ─── Bodycam overlay: preview stage ─── */
      .guma-bcam-stage {
        @apply relative flex w-full items-center justify-center overflow-hidden rounded-xl border p-3
               border-guma-l-border bg-guma-l-dark
               dark:border-guma-border dark:bg-guma-dark;
        min-height: 280px;
      }
      /* Shrink-wraps the canvas so the selection overlay can be positioned
         straight against the rendered frame. */
      .guma-bcam-frame {
        @apply relative inline-block max-w-full;
        line-height: 0;
      }
      .guma-bcam-canvas {
        @apply block h-auto w-auto max-w-full rounded-md border
               border-guma-l-border-2 dark:border-guma-border-2;
        max-height: calc(100vh - 19rem);
        touch-action: none;
      }
      .guma-bcam-drop {
        @apply pointer-events-none absolute inset-3 flex flex-col items-center justify-center gap-3
               rounded-xl border-2 border-dashed px-6 text-center transition
               border-guma-l-border-2 text-guma-l-muted
               dark:border-guma-border-2 dark:text-guma-muted;
      }
      .guma-bcam-drop.is-hot {
        @apply border-guma-l-gold text-guma-l-gold dark:border-guma-gold dark:text-guma-gold;
      }
      /* Dashed marquee around the picked layer. Dark rings on both sides of
         the gold keep it readable over any screenshot. */
      .guma-bcam-sel {
        @apply pointer-events-none absolute;
        outline: 2px dashed #f0c040;
        outline-offset: 2px;
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45), 0 0 0 6px rgba(0, 0, 0, 0.28);
      }
      /* Resize grip, hung off the bottom-left corner of the selection.
         Drag-only: there is nothing to click, so it is not a button. */
      .guma-bcam-scale {
        @apply pointer-events-auto absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center
               rounded-lg border text-guma-gold transition-colors;
        transform: translate(-50%, 50%);
        border-color: #f0c040;
        background: #0b0b3a;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        cursor: nesw-resize;
        touch-action: none;
      }
      .guma-bcam-scale:hover {
        background: #f0c040;
        color: #000;
      }
      /* Toggle row: element name on the left, checkbox on the right. */
      .guma-bcam-switch {
        @apply flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition
               text-guma-l-text hover:bg-black/5
               dark:text-guma-text dark:hover:bg-white/5;
      }
      .guma-bcam-slider {
        @apply w-full cursor-pointer accent-guma-gold;
      }

      /* ─── Reports: dynamic rows ─── */
      .dynamic-row {
        @apply relative mb-3 rounded-xl border p-4
               border-guma-l-border-2 bg-guma-l-dark
               dark:border-guma-border-2 dark:bg-guma-dark;
      }
      .row-title {
        @apply mb-3 text-[11px] font-bold uppercase tracking-[0.14em]
               text-guma-l-gold dark:text-guma-gold;
      }
      .btn-remove-row {
        @apply absolute right-3 top-3 inline-flex items-center justify-center rounded-md
               bg-guma-danger px-2 py-0.5 text-[11px] font-semibold text-white transition
               hover:bg-guma-danger-h;
      }
      .btn-add {
        @apply inline-flex w-full items-center justify-center rounded-lg border border-dashed px-4 py-2
               text-xs font-semibold uppercase tracking-[0.12em] transition
               border-guma-l-gold bg-guma-l-input text-guma-l-gold hover:bg-guma-l-panel-2
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-l-gold
               dark:border-guma-gold dark:bg-guma-input dark:text-guma-gold dark:hover:bg-guma-panel-2
               dark:focus-visible:ring-guma-gold;
      }

      /* ─── Form grid helpers (reports) ─── */
      .form-group {
        @apply mb-3 flex flex-col justify-end;
      }
      .form-group label {
        @apply mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em]
               text-guma-l-muted dark:text-guma-muted;
      }
      .form-group input,
      .form-group select {
        @apply w-full rounded-lg border px-3 py-2 text-sm transition appearance-auto
               border-guma-l-border-2 bg-guma-l-input text-guma-l-text placeholder:text-guma-l-muted/60
               focus:border-guma-l-gold focus:ring-1 focus:ring-guma-l-gold/40 focus:outline-none
               dark:border-guma-border-2 dark:bg-guma-input dark:text-white dark:placeholder:text-slate-500
               dark:focus:border-guma-gold dark:focus:ring-guma-gold/40;
      }
      .two-col {
        @apply grid grid-cols-2 gap-3;
      }
      .three-col {
        @apply grid grid-cols-3 gap-3;
      }
      .four-col {
        @apply grid grid-cols-4 gap-3;
      }

      /* ─── Checkbox group (firearm) ─── */
      .checkbox-group {
        @apply mb-5 flex flex-col gap-2;
      }
      .checkbox-item {
        @apply flex cursor-pointer items-center gap-2 text-sm select-none
               text-guma-l-text dark:text-guma-text;
      }

      /* ─── WYSIWYG canvas editing (report generators) ─── */
      /* The form panel stays in the DOM as the state store; while in-canvas
         editing is active it is visually hidden but focusable. Never
         display:none - a hidden input cannot be focused and native pickers
         refuse to open on it.
         The gate is .guma-ce-on, put on <html> by js/canvas-edit.js once it
         has attached and its media query matches. A bare media query here
         would hide the form even on a page where that script never loaded,
         leaving a dead canvas and no way to enter anything. */
      .guma-ce-on .guma-ce-host {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      /* Scroll box override: the shared wrap hides overflow-x, but a zoomed
         document must scroll horizontally on the editing pages.
         min-width:0 is load-bearing - without it the flex chain sizes itself
         to the zoomed canvas, the panel stretches the page instead of
         scrolling, and any fit-to-width measurement reads back the current
         zoom rather than the available width. */
      /* Report pages sit under a shorter page header than the card generators,
         so they can spend less of the viewport on chrome and give the rest to
         the document. One shared reserve cannot serve both: sized for the cards
         it wastes ~40px on every report, sized for the reports the cards hang
         below the fold. This override is the report half of that pair; the card
         half is .guma-canvas-wrap's own max-h. Both are measured so the box
         ends just above the fold - a box that runs past it has to be scrolled
         to, which defeats the point of making it tall. */
      .guma-ce-wrap {
        @apply xl:max-h-[calc(100vh_-_18.5rem)] xl:justify-start xl:overflow-x-auto;
        min-width: 0;
      }
      /* Shrink-wraps the canvas so all edit chrome can be positioned straight
         against the rendered document (same trick as .guma-bcam-frame). The
         hairline border lives here, not on the canvas, so hit-test math never
         has to subtract it. */
      .guma-ce-frame {
        @apply relative mx-auto inline-block max-w-full border
               border-guma-l-border-2 dark:border-guma-border-2;
        line-height: 0;
      }
      .guma-ce-canvas {
        @apply block h-auto w-auto max-w-full;
      }
      @media (min-width: 1280px) {
        .guma-ce-frame {
          max-width: none;
        }
        .guma-ce-canvas {
          max-width: none;
        }
      }
      /* Chrome layers exist only while editing is active (xl+). The document
         itself is white paper in both app themes, so all chrome over it uses
         the navy accent in both - gold has too little contrast on white. */
      .guma-ce-layer {
        display: none;
      }
      .guma-ce-active .guma-ce-layer {
        display: block;
      }
      .guma-ce-svg {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .guma-ce-svg rect {
        fill: none;
        stroke: #2d4787;
        stroke-opacity: 0.45;
        stroke-width: 1;
        stroke-dasharray: 3 2;
      }
      .guma-ce-hover {
        position: absolute;
        pointer-events: none;
        background: rgba(45, 71, 135, 0.08);
        outline: 1px solid rgba(45, 71, 135, 0.55);
      }
      .guma-ce-chips {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .guma-ce-chip {
        position: absolute;
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 1px solid rgba(45, 71, 135, 0.7);
        border-radius: 4px;
        background: #e8eef9;
        color: #2d4787;
        font-family: "Segoe UI", Arial, sans-serif;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .guma-ce-chip:hover {
        background: #2d4787;
        color: #fff;
      }
      .guma-ce-chip-add {
        border-style: dashed;
        background: transparent;
      }
      .guma-ce-chip-add:hover {
        border-style: solid;
        background: #2d4787;
        color: #fff;
      }
      /* Pick-one affordance the document already paints itself (party type,
         day of week): an invisible hit target that only tints on hover, so
         the printed checkbox is never drawn twice. */
      .guma-ce-chip-pick {
        border-color: transparent;
        background: transparent;
      }
      .guma-ce-chip-pick:hover {
        border-color: rgba(45, 71, 135, 0.7);
        background: rgba(45, 71, 135, 0.14);
      }
      /* The single floating editor, mounted inside the frame. */
      .guma-ce-editor {
        position: absolute;
        z-index: 10;
        box-sizing: border-box;
        padding: 0 2px;
        border: 1px solid #2d4787;
        border-radius: 2px;
        background: #fff;
        color: #000;
        font-family: Arial, sans-serif;
        /* Explicit, because .guma-ce-frame zeroes line-height to shrink-wrap
           the canvas. WebKit lays out the segments of a date/time input along
           that line box, so inheriting 0 clips the digits to slivers. */
        line-height: normal;
        outline: none;
        box-shadow: 0 0 0 2px rgba(45, 71, 135, 0.25), 0 4px 14px rgba(0, 0, 0, 0.25);
      }
      /* The editor always sits on white paper, whichever app theme is active,
         so the global dark-mode invert would wash its picker icon out. */
      html.dark .guma-ce-editor::-webkit-calendar-picker-indicator {
        filter: none;
      }
      /* Date editor: a text field in the document's own mm/dd/yyyy format
         (a native date input would render in the browser's locale instead),
         plus a button that opens the real calendar on demand. */
      .guma-ce-editor-date {
        display: flex;
        align-items: stretch;
        padding: 0;
      }
      .guma-ce-date-text {
        flex: 1 1 auto;
        min-width: 0;
        box-sizing: border-box;
        padding: 0 2px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: inherit;
        line-height: normal;
        outline: none;
      }
      /* Rendered, so showPicker() has something to anchor the popup to, but
         invisible and never focusable or clickable. */
      .guma-ce-date-native {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 1px;
        padding: 0;
        border: 0;
        opacity: 0;
        pointer-events: none;
      }
      .guma-ce-date-pick {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        padding: 0;
        border: 0;
        border-left: 1px solid rgba(45, 71, 135, 0.35);
        background: transparent;
        color: #2d4787;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .guma-ce-date-pick:hover {
        background: rgba(45, 71, 135, 0.14);
      }
      /* Toolbar above the canvas: zoom seg (injected) + one-time hint.
         Centred rather than pushed to the edges - the seg is the only control
         here most of the time, and left-aligned it read as page furniture
         rather than as something to use. Kept to a SINGLE ROW: stacking the
         hint under the seg cost 22px of document height on every first visit,
         which is the opposite of what this panel needs. */
      /* Relative so the hint can be pulled out of the flow: with the hint in
         flow the whole group centres, which pushes the zoom buttons visibly
         left of the document they sit above. */
      .guma-ce-toolbar {
        @apply relative items-center justify-center gap-3;
      }
      .guma-ce-zoom {
        @apply flex items-center gap-1.5;
      }
      /* Full-strength text, not muted: these were hard to read against the
         panel, which is the whole reason the control went unnoticed. */
      .guma-ce-zoom-btn {
        @apply inline-flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center
               rounded-lg border-2 px-3 text-[13px] font-bold uppercase tracking-wider transition
               border-guma-l-border bg-guma-l-panel text-guma-l-text
               hover:border-guma-l-gold hover:text-guma-l-gold
               dark:border-guma-border dark:bg-guma-panel dark:text-guma-text
               dark:hover:border-guma-gold dark:hover:text-guma-gold;
      }
      /* The percentage is a readout as much as a button, so it is the widest
         and carries the accent colour. */
      .guma-ce-zoom-btn.guma-ce-zoom-value {
        @apply min-w-[4rem] text-guma-l-gold dark:text-guma-gold;
      }
      /* Parked on the right edge instead of sitting in the flow, so it stops
         off-centring the zoom buttons. The toolbar only renders from xl up,
         where it is never narrower than ~1150px, so the hint cannot reach the
         buttons. */
      .guma-ce-hint {
        @apply absolute right-0 top-1/2 -translate-y-1/2 text-[12px]
               text-guma-l-muted dark:text-guma-muted;
      }
    }

    @layer utilities {
      .border-guma-border-2 {
        border-color: #2a2a5a;
      }
      .border-guma-l-border-2 {
        border-color: #d4cdb4;
      }
    }
  `;
  document.head.appendChild(style);
})();
