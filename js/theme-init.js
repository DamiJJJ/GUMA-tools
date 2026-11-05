// Anti-FOUC theme init
(function () {
  try {
    var saved = localStorage.getItem("guma-theme");
    var useDark = saved ? saved === "dark" : true; // dark = default
    if (useDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();

// ── Theme-aware favicon ───────────────────────────────────────
// Swaps the SVG brand favicon to match the active theme (navy shield
// on light, white shield on dark). The .ico fallback stays as-is, and
// pages with generator-specific favicons are left alone.
function gumaApplyThemeFavicon() {
  var link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  var href = link ? link.getAttribute("href") || "" : "";
  if (!href.includes("assets/favicon")) return;
  var dark = document.documentElement.classList.contains("dark");
  link.setAttribute("href", dark ? "assets/favicon_dark.svg" : "assets/favicon.svg");
}
gumaApplyThemeFavicon();
