// Anti-FOUC theme init
(function () {
  try {
    var saved = localStorage.getItem("guma-theme");
    var useDark = saved ? saved === "dark" : true; // dark = default
    if (useDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();

// ── Theme-aware favicon ───────────────────────────────────────
// Swaps the logo favicon to match the active theme. Pages with
// generator-specific favicons (collision.png etc.) are left as-is.
function gumaApplyThemeFavicon() {
  var link = document.querySelector('link[rel="icon"]');
  var href = link ? link.getAttribute("href") || "" : "";
  if (!href.includes("logo_short")) return;
  var dark = document.documentElement.classList.contains("dark");
  link.setAttribute("href", dark ? "assets/logo_short_dark.png" : "assets/logo_short.png");
}
gumaApplyThemeFavicon();
