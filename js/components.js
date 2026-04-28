const GUMA_VERSION = "1.5";

// HEADER
class GumaHeader extends HTMLElement {
  connectedCallback() {
    const current = window.location.pathname.split("/").pop() || "index.html";

    const isCard = ["officer_generator.html", "firefighter_generator.html"].includes(current);
    const isReport = ["firearm_discharge.html", "traffic_collision_report.html"].includes(current);
    const isHome = current === "index.html" || current === "";

    const navLinkBase = "px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-[0.12em] transition";
    const navActive = "text-guma-gold bg-guma-gold/10";
    const navInactive = "text-guma-muted hover:text-guma-text hover:bg-white/5";

    const dropLinkBase = "flex items-center gap-2 px-4 py-3 text-sm transition hover:bg-guma-panel-2 hover:text-guma-gold";
    const dropActive = "text-guma-gold bg-guma-panel-2";
    const dropInactive = "text-guma-text";

    this.innerHTML = `
      <header class="sticky top-0 z-30 border-b border-white/10 bg-[#04045e]/85 backdrop-blur-md">

        <!-- ── Main bar ── -->
        <div class="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">

          <!-- Logo w jasnym tle -->
          <a href="index.html"
             class="flex-shrink-0 flex items-center rounded-xl bg-white px-3 py-1.5 shadow-md transition hover:bg-white/90 hover:-translate-y-px">
            <img src="assets/logo.png" alt="GUMA Tools" class="h-8 w-auto" />
          </a>

          <!-- Desktop nav -->
          <nav class="hidden md:flex items-center gap-0.5">

            <a href="index.html"
               class="${navLinkBase} ${isHome ? navActive : navInactive}">
              Home
            </a>

            <!-- Card Generators dropdown -->
            <div class="relative" id="gumaCardsDropdown">
              <button id="gumaCardsBtn"
                class="flex items-center gap-1.5 ${navLinkBase} ${isCard ? navActive : navInactive}"
                aria-haspopup="true" aria-expanded="false">
                Card Generators
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round"
                     class="transition-transform duration-200" id="gumaCardsChevron">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div id="gumaCardsMenu"
                   class="hidden absolute top-full left-0 mt-2 min-w-[230px] rounded-xl border border-guma-border bg-guma-panel shadow-panel overflow-hidden z-50">
                <a href="officer_generator.html"
                   class="${dropLinkBase} ${current === "officer_generator.html" ? dropActive : dropInactive}">
                  <img src="assets/policeman.png" class="h-5 w-5 object-contain opacity-80" alt="" />
                  Officer Card Generator
                </a>
                <a href="firefighter_generator.html"
                   class="${dropLinkBase} border-t border-guma-border ${current === "firefighter_generator.html" ? dropActive : dropInactive}">
                  <img src="assets/firefighter.png" class="h-5 w-5 object-contain opacity-80" alt="" />
                  Firefighter Card Generator
                </a>
              </div>
            </div>

            <!-- Report Generators dropdown -->
            <div class="relative" id="gumaReportsDropdown">
              <button id="gumaReportsBtn"
                class="flex items-center gap-1.5 ${navLinkBase} ${isReport ? navActive : navInactive}"
                aria-haspopup="true" aria-expanded="false">
                Report Generators
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round"
                     class="transition-transform duration-200" id="gumaReportsChevron">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div id="gumaReportsMenu"
                   class="hidden absolute top-full left-0 mt-2 min-w-[240px] rounded-xl border border-guma-border bg-guma-panel shadow-panel overflow-hidden z-50">
                <a href="firearm_discharge.html"
                   class="${dropLinkBase} ${current === "firearm_discharge.html" ? dropActive : dropInactive}">
                  <img src="assets/firearm_dis_192.png" class="h-5 w-5 object-contain opacity-80" alt="" />
                  Firearm Discharge Report
                </a>
                <a href="traffic_collision_report.html"
                   class="${dropLinkBase} border-t border-guma-border ${current === "traffic_collision_report.html" ? dropActive : dropInactive}">
                  <img src="assets/traffic_col_192.png" class="h-5 w-5 object-contain opacity-80" alt="" />
                  Traffic Collision Report
                </a>
              </div>
            </div>

            <!-- About (coming soon) -->
            <span class="${navLinkBase} opacity-35 cursor-not-allowed text-guma-muted select-none"
                  title="Coming soon">
              About
            </span>

          </nav>

          <!-- Right side -->
          <div class="flex items-center gap-3">

            <!-- Live badge (Kick) -->
            <a id="gumaLiveBadge"
               href="https://kick.com/damulec" target="_blank" rel="noopener noreferrer"
               class="hidden items-center gap-2 flex-shrink-0 rounded-xl px-3 py-2 text-sm font-bold tracking-wide no-underline transition-all duration-200 hover:-translate-y-px"
               style="background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.45); color: #f87171;">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              LIVE ON
            </a>

            <!-- Support button -->
            <a href="https://tipply.pl/@dami" target="_blank" rel="noopener noreferrer"
               class="hidden sm:inline-flex items-center gap-2 flex-shrink-0 rounded-xl px-4 py-2 text-sm font-black tracking-wide no-underline transition-all duration-200 hover:-translate-y-px hover:brightness-110"
               style="background: linear-gradient(135deg, #ffe066 0%, #f0c040 50%, #c8960c 100%); color: #1a1000; box-shadow: 0 0 18px rgba(240,192,64,0.35), 0 2px 8px rgba(0,0,0,0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                   fill="currentColor" stroke="none">
                <path d="M12 21.593c-.525-.47-10.58-9.06-10.58-13.777 0-3.624 2.955-6.566 6.58-6.566 1.73 0 3.39.676 4.62 1.899L12 3.093l-.62.056C12.621 1.897 14.276 1.25 16 1.25c3.625 0 6.58 2.942 6.58 6.566 0 4.717-10.055 13.307-10.58 13.777z"/>
              </svg>
              Support project
            </a>

            <!-- Hamburger (mobile only) -->
            <button id="gumaHamburger"
              class="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-guma-border text-guma-muted hover:border-guma-gold hover:text-guma-gold transition"
              aria-label="Toggle menu" aria-expanded="false">
              <svg id="gumaHamburgerIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <svg id="gumaCloseIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   class="hidden">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

          </div>
        </div>

        <!-- ── Mobile menu ── -->
        <div id="gumaMobileMenu" class="hidden md:hidden border-t border-white/10 bg-[#04045e]/95">
          <nav class="mx-auto max-w-[1400px] flex flex-col px-4 py-3 gap-0.5">

            <a href="index.html"
               class="px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-[0.12em] transition
                      ${isHome ? "text-guma-gold bg-guma-gold/10" : "text-guma-muted hover:text-guma-text hover:bg-white/5"}">
              Home
            </a>

            <p class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-guma-muted/50">
              Card Generators
            </p>
            <a href="officer_generator.html"
               class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition
                      ${current === "officer_generator.html" ? "text-guma-gold bg-guma-gold/10" : "text-guma-muted hover:text-guma-text hover:bg-white/5"}">
              <img src="assets/policeman.png" class="h-5 w-5 object-contain opacity-70" alt="" />
              Officer Card Generator
            </a>
            <a href="firefighter_generator.html"
               class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition
                      ${current === "firefighter_generator.html" ? "text-guma-gold bg-guma-gold/10" : "text-guma-muted hover:text-guma-text hover:bg-white/5"}">
              <img src="assets/firefighter.png" class="h-5 w-5 object-contain opacity-70" alt="" />
              Firefighter Card Generator
            </a>

            <p class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-guma-muted/50">
              Report Generators
            </p>
            <a href="firearm_discharge.html"
               class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition
                      ${current === "firearm_discharge.html" ? "text-guma-gold bg-guma-gold/10" : "text-guma-muted hover:text-guma-text hover:bg-white/5"}">
              <img src="assets/firearm_dis_192.png" class="h-5 w-5 object-contain opacity-70" alt="" />
              Firearm Discharge Report
            </a>
            <a href="traffic_collision_report.html"
               class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition
                      ${current === "traffic_collision_report.html" ? "text-guma-gold bg-guma-gold/10" : "text-guma-muted hover:text-guma-text hover:bg-white/5"}">
              <img src="assets/traffic_col_192.png" class="h-5 w-5 object-contain opacity-70" alt="" />
              Traffic Collision Report
            </a>

            <!-- About (coming soon) mobile -->
            <p class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-guma-muted/50">
              About
            </p>
            <span class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm opacity-35 cursor-not-allowed text-guma-muted select-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              About (coming soon)
            </span>

            <!-- Support button mobile -->
            <div class="pt-3 pb-1">
              <a href="https://tipply.pl/@dami" target="_blank" rel="noopener noreferrer"
                 class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black tracking-wide no-underline transition-all hover:brightness-110"
                 style="background: linear-gradient(135deg, #ffe066 0%, #f0c040 50%, #c8960c 100%); color: #1a1000; box-shadow: 0 0 18px rgba(240,192,64,0.3), 0 2px 8px rgba(0,0,0,0.3);">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="currentColor" stroke="none">
                  <path d="M12 21.593c-.525-.47-10.58-9.06-10.58-13.777 0-3.624 2.955-6.566 6.58-6.566 1.73 0 3.39.676 4.62 1.899L12 3.093l-.62.056C12.621 1.897 14.276 1.25 16 1.25c3.625 0 6.58 2.942 6.58 6.566 0 4.717-10.055 13.307-10.58 13.777z"/>
                </svg>
                Support project
              </a>
            </div>

          </nav>
        </div>

      </header>
    `;

    // ── Live badge (Kick) ──────────────────────────────────────────
    const showLiveBadge = () => {
      const badge = document.getElementById("gumaLiveBadge");
      if (!badge) return;
      badge.classList.remove("hidden");
      badge.classList.add("inline-flex");
    };
    const hideLiveBadge = () => {
      const badge = document.getElementById("gumaLiveBadge");
      if (!badge) return;
      badge.classList.add("hidden");
      badge.classList.remove("inline-flex");
    };

    const checkLiveStatus = async () => {
      // Tryb podglądu: dodaj ?preview_live=1 do URL żeby zobaczyć plakietkę offline
      if (new URLSearchParams(window.location.search).get("preview_live") === "1") {
        showLiveBadge();
        return;
      }
      try {
        const res = await fetch("https://kick.com/api/v1/channels/damulec", { cache: "no-store" });
        const data = await res.json();
        data.livestream ? showLiveBadge() : hideLiveBadge();
      } catch {
        hideLiveBadge(); // CORS lub brak sieci — chowamy cicho
      }
    };

    checkLiveStatus();
    setInterval(checkLiveStatus, 60_000); // sprawdzaj co minutę
    // ──────────────────────────────────────────────────────────────

    // ── Dropdown logic ──
    const setupDropdown = (btnId, menuId, chevronId) => {
      const btn = this.querySelector(`#${btnId}`);
      const menu = this.querySelector(`#${menuId}`);
      const chevron = this.querySelector(`#${chevronId}`);
      if (!btn || !menu) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !menu.classList.contains("hidden");
        this.querySelectorAll('[id$="Menu"]:not(#gumaMobileMenu)').forEach((m) => m.classList.add("hidden"));
        this.querySelectorAll('[id$="Chevron"]').forEach((c) => (c.style.transform = ""));
        if (!isOpen) {
          menu.classList.remove("hidden");
          if (chevron) chevron.style.transform = "rotate(180deg)";
          btn.setAttribute("aria-expanded", "true");
        } else {
          btn.setAttribute("aria-expanded", "false");
        }
      });
    };

    setupDropdown("gumaCardsBtn", "gumaCardsMenu", "gumaCardsChevron");
    setupDropdown("gumaReportsBtn", "gumaReportsMenu", "gumaReportsChevron");

    document.addEventListener("click", () => {
      this.querySelectorAll('[id$="Menu"]:not(#gumaMobileMenu)').forEach((m) => m.classList.add("hidden"));
      this.querySelectorAll('[id$="Chevron"]').forEach((c) => (c.style.transform = ""));
    });

    // ── Mobile menu toggle ──
    const hamburger = this.querySelector("#gumaHamburger");
    const mobileMenu = this.querySelector("#gumaMobileMenu");
    const hamburgerIcon = this.querySelector("#gumaHamburgerIcon");
    const closeIcon = this.querySelector("#gumaCloseIcon");

    hamburger?.addEventListener("click", () => {
      const isOpen = !mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden");
      hamburgerIcon.classList.toggle("hidden", !isOpen);
      closeIcon.classList.toggle("hidden", isOpen);
      hamburger.setAttribute("aria-expanded", String(!isOpen));
    });
  }
}

customElements.define("guma-header", GumaHeader);

// FOOTER
class GumaFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="mt-auto w-full border-t border-guma-border bg-guma-footer">
        <div class="mx-auto flex w-full max-w-[1400px] flex-col items-start justify-between gap-4 px-4 py-4 text-sm text-zinc-400 sm:flex-row sm:items-center">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span class="text-xs sm:text-sm">GUMA Tools v${GUMA_VERSION} &copy; Dami ${new Date().getFullYear()}</span>
            <span data-guma-counter hidden class="flex items-center gap-1.5 text-[11px] text-guma-muted/60 border-l border-guma-border pl-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span id="gumaVisitCount">0</span> visits
            </span>
          </div>
          <div class="flex items-center gap-3">
            <a href="https://www.youtube.com/@DamiJJJ" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
               class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-guma-gold text-guma-gold transition hover:-translate-y-0.5 hover:bg-guma-gold hover:text-guma-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-gold">
              <svg class="h-4 w-4 fill-current" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
              </svg>
            </a>
            <!--  <a href="https://www.twitch.tv/ytdamipl" target="_blank" rel="noopener noreferrer" aria-label="Twitch"
               class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-guma-gold text-guma-gold transition hover:-translate-y-0.5 hover:bg-guma-gold hover:text-guma-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-gold">
              <svg class="h-4 w-4 fill-current" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.857 0 1 2.857v10.286h3.429V16l2.857-2.857H9.57L14.714 8V0zm9.714 7.429-2.285 2.285H9l-2 2v-2H4.429V1.143h9.142z"/>
                <path d="M11.857 3.143h-1.143V6.57h1.143zm-3.143 0H7.571V6.57h1.143z"/>
              </svg>
            </a>-->
            <a href="https://kick.com/damulec" target="_blank" rel="noopener noreferrer" aria-label="Kick"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-guma-gold text-guma-gold transition hover:-translate-y-0.5 hover:bg-guma-gold hover:text-guma-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-gold">
              <svg class="h-4 w-4 fill-current" viewBox="-1 0 25 24" aria-hidden="true">
                <path d="M4 2h4v7.5L13.5 2H19l-7 9 7 11h-5.5L8 13.5V22H4V2z"/>
              </svg>
            </a>
            <a href="https://discord.gg/gzQC2kUFbQ" target="_blank" rel="noopener noreferrer" aria-label="Discord"
               class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-guma-gold text-guma-gold transition hover:-translate-y-0.5 hover:bg-guma-gold hover:text-guma-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guma-gold">
              <svg class="h-4 w-4 fill-current" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    `;
    if (window.GumaCounters) {
      window.GumaCounters.initVisitCounter("gumaVisitCount");
    }
  }
}

customElements.define("guma-footer", GumaFooter);
