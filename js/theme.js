(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function applyTheme(dark) {
    root.classList.toggle("dark", dark);
  }

  applyTheme(localStorage.getItem("theme") !== "light");

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function revealTheme(dark) {
    const rect = toggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-r", `${r}px`);
    root.classList.add("theme-switching");

    const done = () => root.classList.remove("theme-switching");

    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      applyTheme(dark);
      done();
      return;
    }

    const transition = document.startViewTransition(() => applyTheme(dark));
    transition.finished.finally(done);
  }

  toggle.addEventListener("click", () => {
    const dark = !root.classList.contains("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    revealTheme(dark);
  });
})();
