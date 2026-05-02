(function () {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const icon = document.getElementById("theme-toggle-icon");
  const root = document.documentElement;
  const icons = {
    dark: '<circle cx="12" cy="12" r="4" /><path d="M12 2.75v2" /><path d="M12 19.25v2" /><path d="m4.46 4.46 1.42 1.42" /><path d="m18.12 18.12 1.42 1.42" /><path d="M2.75 12h2" /><path d="M19.25 12h2" /><path d="m4.46 19.54 1.42-1.42" /><path d="m18.12 5.88 1.42-1.42" />',
    light: '<path d="M21.75 15A9.75 9.75 0 0 1 9 2.25 9.75 9.75 0 1 0 21.75 15Z" />',
  };

  function current() {
    return root.getAttribute("data-theme") || "dark";
  }
  function syncButton(theme) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    btn.setAttribute("aria-label", "Switch to " + nextTheme + " mode");
    btn.setAttribute("title", "Switch to " + nextTheme + " mode");
    if (icon) icon.innerHTML = icons[theme] || icons.light;
  }
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    syncButton(theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  syncButton(current());
  btn.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });
})();
