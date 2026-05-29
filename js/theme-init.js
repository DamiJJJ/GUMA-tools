// Anti-FOUC theme init
(function () {
  try {
    var saved = localStorage.getItem("guma-theme");
    var useDark = saved ? saved === "dark" : true; // dark = default
    if (useDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
