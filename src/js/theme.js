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

(function () {
  const btn = document.getElementById("mobile-nav-toggle");
  const menu = document.getElementById("primary-menu");
  if (!btn || !menu) return;

  // `hidden` is display:none; removing it falls back to display:block, not
  // flex — which left `flex-col` inert and ran the eight nav links together as
  // wrapped inline text. The open state has to set display:flex explicitly.
  function closeMenu() {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open navigation menu");
    btn.setAttribute("title", "Open navigation menu");
  }

  function openMenu() {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close navigation menu");
    btn.setAttribute("title", "Close navigation menu");
  }

  btn.addEventListener("click", function () {
    if (btn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener("click", function (event) {
    if (event.target instanceof Element && event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  if (window.matchMedia) {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeMenu);
    } else {
      desktopQuery.addListener(closeMenu);
    }
  }
})();

// Reveal-on-scroll for .u-reveal.
//
// The settled state is the CSS default; this script *adds* the hidden state
// and then removes it as elements enter the viewport. That ordering means a
// failed or blocked script leaves everything visible rather than blank.
(function () {
  const targets = document.querySelectorAll(".u-reveal");
  if (targets.length === 0) return;

  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  targets.forEach(function (el) {
    el.setAttribute("data-reveal", "pending");
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.removeAttribute("data-reveal");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();

// Copy-to-clipboard for citation blocks.
//
// The buttons are marked `hidden` in the markup and revealed here, so a
// browser without the async clipboard API — or with this script blocked —
// shows selectable text and no dead control rather than a button that
// silently does nothing.
(function () {
  const buttons = document.querySelectorAll("[data-copy]");
  if (buttons.length === 0) return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;

  buttons.forEach(function (btn) {
    const target = document.querySelector(btn.getAttribute("data-copy"));
    if (!target) return;
    const label = btn.textContent;
    let timer;

    btn.hidden = false;
    btn.addEventListener("click", function () {
      // textContent, not innerText: innerText is layout-dependent and
      // whitespace-normalising, which would flatten the BibTeX indentation.
      // The template puts each block on a single line, so textContent is
      // exactly the citation with nothing to strip but the outer trim.
      navigator.clipboard.writeText(target.textContent.trim()).then(
        function () {
          btn.textContent = "Copied";
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = label;
          }, 1600);
        },
        function () {
          btn.textContent = "Press ⌘C";
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = label;
          }, 1600);
        }
      );
    });
  });
})();
