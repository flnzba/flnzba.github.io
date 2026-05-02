(function () {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;

  function current() {
    return root.getAttribute("data-theme") || "dark";
  }
  function syncPrism(theme) {
    const light = document.getElementById("prism-light");
    const dark  = document.getElementById("prism-dark");
    if (!light || !dark) return;
    if (theme === "dark") { light.disabled = true;  dark.disabled = false; }
    else                  { light.disabled = false; dark.disabled = true;  }
  }
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    syncPrism(theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  btn.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });
})();
