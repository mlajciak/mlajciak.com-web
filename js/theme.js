(function () {
  const STORAGE_KEY = "theme";
  const ORDER = ["dark", "light"];

  const ICONS = {
    dark: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    light: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  };

  const LABELS = {
    dark: "Theme: dark",
    light: "Theme: light",
  };

  function resolveTheme(value) {
    if (value === "dark" || value === "light") return value;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getStored() {
    return resolveTheme(localStorage.getItem(STORAGE_KEY));
  }

  function ensureIcons(btn) {
    if (btn.querySelector(".theme-toggle__icon--dark")) {
      return;
    }

    btn.innerHTML =
      '<span class="theme-toggle__icon theme-toggle__icon--dark">' +
      ICONS.dark +
      "</span>" +
      '<span class="theme-toggle__icon theme-toggle__icon--light">' +
      ICONS.light +
      "</span>";
  }

  function apply(theme) {
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute("data-theme", resolved);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      ensureIcons(btn);
      btn.setAttribute("data-theme-state", resolved);
      btn.setAttribute("aria-label", LABELS[resolved]);
      btn.removeAttribute("title");
    }
  }

  function next(theme) {
    const i = ORDER.indexOf(theme);
    return ORDER[(i + 1) % ORDER.length];
  }

  function mountToggle(btn) {
    const site = document.querySelector(".site");
    if (!site) {
      document.body.appendChild(btn);
      return;
    }

    let bar = site.querySelector(":scope > .site-header-bar");
    const breadcrumb = site.querySelector(":scope > .breadcrumb");

    if (bar) {
      if (breadcrumb && breadcrumb.parentElement !== bar) {
        bar.prepend(breadcrumb);
      }
      bar.appendChild(btn);
      return;
    }

    if (breadcrumb) {
      bar = document.createElement("div");
      bar.className = "site-header-bar";
      site.insertBefore(bar, breadcrumb);
      bar.appendChild(breadcrumb);
      bar.appendChild(btn);
      return;
    }

    bar = document.createElement("div");
    bar.className = "site-header-bar site-header-bar--home";
    site.insertBefore(bar, site.firstChild);
    bar.appendChild(btn);
  }

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "system") {
      localStorage.setItem(STORAGE_KEY, getStored());
    }

    const theme = getStored();
    apply(theme);

    let btn = document.getElementById("theme-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "theme-toggle";
      btn.className = "theme-toggle";
      mountToggle(btn);
    }

    apply(theme);

    if (btn.dataset.bound) {
      return;
    }
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const current = getStored();
      const updated = next(current);
      localStorage.setItem(STORAGE_KEY, updated);
      apply(updated);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
