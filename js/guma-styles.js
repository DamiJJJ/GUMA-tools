// Wspólne style aplikacji — wszystkie warstwy @layer base/components/utilities

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

      /* Date/time picker icon — invert tylko w dark */
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
        @apply mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8;
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
