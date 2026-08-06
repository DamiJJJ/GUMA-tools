// Searchable index of every panel / generator in the app, plus the tiny
// matcher the command palette (<guma-search> in js/components.js) runs on it.
//
// This file is the single source of truth for "what tools exist". The nav
// dropdowns and the index.html tiles still carry their own markup, so when a
// generator is added or renamed it has to be added here too.
//
// ── Entry schema ────────────────────────────────────────────────────────────
//   id       stable key - the same value as data-generator-key (js/counters.js)
//   title    display name, worded exactly like the nav entry
//   url      page file relative to the site root, or null when unreleased
//   category group label shown as a chip in the results list
//   icon     assets/*.png shown next to the result, or null for a glyph
//   status   "available" | "soon"
//   summary  one sentence, mirrors the index.html tile description
//   aliases  other names people type for this tool - tool level only
//            (form fields and document wording are deliberately out of scope)
//
// The shape is plain JSON on purpose: it can be dumped to a search-index.json
// and handed to an AI agent as a tool manifest, or embedded into a vector
// store, without touching the UI code. Keep it serialisable - no functions,
// no DOM references.
//
// Array order = the order shown for an empty query, so keep it in sync with
// the section order on index.html.

window.GUMA_SEARCH_INDEX = [
  // ── Card Generators ─────────────────────────────────────────────
  {
    id: "officer",
    title: "Officer Card Generator",
    url: "officer_generator.html",
    category: "Card Generators",
    icon: "assets/policeman.png",
    status: "available",
    summary: "Generate your own officer card with personal details, faction data and generated preview.",
    aliases: ["police card", "id card", "badge", "lspd", "lssd", "bcso", "sahp"],
  },
  {
    id: "firefighter",
    title: "Firefighter Card Generator",
    url: "firefighter_generator.html",
    category: "Card Generators",
    icon: "assets/firefighter.png",
    status: "available",
    summary: "Generate your own firefighter card with personal details, faction data and generated preview.",
    aliases: ["fire card", "paramedic card", "lsfd", "lscofd", "ems"],
  },
  {
    id: "business_card",
    title: "Business Card Generator",
    url: "business_card_generator.html",
    category: "Card Generators",
    icon: "assets/card_256.png",
    status: "available",
    summary: "Universal business card generator for LEA, Fire, civilians and business owners.",
    aliases: ["contact card", "civilian card", "company card", "visit card"],
  },
  {
    id: "personnel",
    title: "Personnel File Generator",
    url: "personnel_file_generator.html",
    category: "Card Generators",
    icon: "assets/file.png",
    status: "available",
    summary: "Generate an official-style employee personnel file with commendations, disciplinary records, training history and more.",
    aliases: ["employee file", "service record", "hr file", "personnel record"],
  },

  // ── Report Generators: Police ───────────────────────────────────
  {
    id: "firearm",
    title: "Firearm Discharge Report",
    url: "firearm_discharge.html",
    category: "Police Reports",
    icon: "assets/shooting.png",
    status: "available",
    summary: "Officer-involved firearm discharge investigation generator with structured report workflow.",
    aliases: ["ois", "officer involved shooting", "weapon discharge", "gun"],
  },
  {
    id: "traffic",
    title: "Traffic Collision Report",
    url: "traffic_collision_report.html",
    category: "Police Reports",
    icon: "assets/collision.png",
    status: "available",
    summary: "Report generator for traffic collisions investigations with structured report workflow.",
    aliases: ["crash", "accident", "car accident", "tc"],
  },
  {
    id: "arrest",
    title: "Arrest Report",
    url: "arrest_report.html",
    category: "Police Reports",
    icon: "assets/arrest.png",
    status: "available",
    summary: "Report generator for arrest documentation and booking input forms with structured workflow.",
    aliases: ["booking", "custody", "charges", "detention"],
  },
  {
    id: "investigative",
    title: "Investigative Report",
    url: "investigative_report.html",
    category: "Police Reports",
    icon: "assets/investigation.png",
    status: "available",
    summary: "Two-page LSPD-style investigative report with combined crime, evidence and arrest sections.",
    aliases: ["investigation", "detective", "crime report", "evidence"],
  },

  // ── Report Generators: Fire / Medical ───────────────────────────
  {
    id: "pcr",
    title: "Pre-Hospital Care Report",
    url: "prehospital_care_report.html",
    category: "Fire / Medical",
    icon: "assets/hospital.png",
    status: "available",
    summary: "Report generator for EMS prehospital care documentation with structured report workflow.",
    aliases: ["pcr", "ems report", "medical report", "patient care", "ambulance"],
  },
  {
    id: "fire_inspection",
    title: "Fire Code Inspection Report",
    url: null,
    category: "Fire / Medical",
    icon: "assets/extinguisher.png",
    status: "soon",
    summary: "Future generator for Fire Code Inspection Report.",
    aliases: ["fire code", "inspection", "fire marshal"],
  },

  // ── Image Tools ─────────────────────────────────────────────────
  {
    id: "bodycam",
    title: "Bodycam Overlay",
    url: "bodycam_overlay.html",
    category: "Image Tools",
    icon: "assets/bodycam.png",
    status: "available",
    summary: "Stamp a body-worn camera HUD onto a game screenshot: timestamp, agency logo, REC counter and camera-grade image effects.",
    aliases: ["bwc", "body worn camera", "hud", "screenshot overlay", "axon"],
  },

  // ── Pages ───────────────────────────────────────────────────────
  {
    id: "home",
    title: "Home",
    url: "index.html",
    category: "Pages",
    icon: "assets/logo_short.png",
    status: "available",
    summary: "All card generators, report generators and image tools in one place.",
    aliases: ["index", "start", "main page", "dashboard"],
  },
  {
    id: "about",
    title: "About",
    url: "about.html",
    category: "Pages",
    icon: null,
    status: "available",
    summary: "What GUMA Tools is, who makes it and how to get in touch.",
    aliases: ["contact", "author", "changelog", "info"],
  },
];

// ── Matcher ───────────────────────────────────────────────────────
// Small enough to stay honest: a dozen entries never need a fuzzy library,
// and an exact-substring match keeps the results predictable.
(function () {
  // Diacritics are stripped so a query typed on a Polish keyboard still
  // matches the English index.
  const normalize = (value) =>
    String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // A hit in the title outranks the same hit in the summary.
  const FIELD_WEIGHTS = { title: 100, aliases: 70, category: 45, summary: 25 };

  // Where inside the field the hit landed: field start > word start > mid-word.
  const positionScore = (haystack, token) => {
    const at = haystack.indexOf(token);
    if (at < 0) return 0;
    if (at === 0) return 1;
    return /[\s/(-]/.test(haystack[at - 1]) ? 0.8 : 0.4;
  };

  // Normalised haystacks, built once per entry and cached on it.
  const haystacks = (entry) => {
    if (!entry._hay) {
      entry._hay = {
        title: normalize(entry.title),
        aliases: normalize((entry.aliases || []).join(" | ")),
        category: normalize(entry.category),
        summary: normalize(entry.summary),
      };
    }
    return entry._hay;
  };

  const tokenize = (query) => normalize(query).split(/\s+/).filter(Boolean);

  // Every token has to hit at least one field (AND), so "arrest report" does
  // not drag in every other report. The score is the sum of each token's best
  // field hit, which keeps title matches on top.
  const scoreEntry = (entry, tokens) => {
    const hay = haystacks(entry);
    let total = 0;

    for (const token of tokens) {
      let best = 0;
      for (const field in FIELD_WEIGHTS) {
        best = Math.max(best, FIELD_WEIGHTS[field] * positionScore(hay[field], token));
      }
      if (!best) return 0;
      total += best;
    }

    // Unreleased tools stay findable but never outrank a working one.
    return entry.status === "soon" ? total * 0.5 : total;
  };

  /**
   * Search the tool index.
   * @param {string} query   raw user input; empty returns the whole index
   * @param {number} [limit] max results
   * @returns {Array<Object>} matching entries, best first
   */
  const search = (query, limit = 20) => {
    const tokens = tokenize(query);
    const entries = window.GUMA_SEARCH_INDEX || [];
    if (!tokens.length) return entries.slice(0, limit);

    return entries
      .map((entry, index) => ({ entry, index, score: scoreEntry(entry, tokens) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .map((hit) => hit.entry);
  };

  window.GumaSearch = { search, tokenize, normalize };
})();
