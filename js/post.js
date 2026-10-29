(function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const toc = document.getElementById("toc");
  const outline = document.getElementById("outline");
  const tocToggle = document.getElementById("toc-toggle");

  function menuOpen() {
    return outline && outline.classList.contains("is-open");
  }

  function setMenuOpen(open) {
    if (!outline || !tocToggle) return;
    outline.classList.toggle("is-open", open);
    tocToggle.setAttribute("aria-expanded", String(open));
  }

  if (tocToggle && outline) {
    tocToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenuOpen(!menuOpen());
    });

    document.addEventListener("click", (e) => {
      if (!menuOpen()) return;
      if (outline.contains(e.target) || tocToggle.contains(e.target)) return;
      setMenuOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
  }

  const header = document.querySelector("header");
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const atTop = y < 8;
      const goingDown = y > lastY;
      const goingUp = y < lastY;

      header.classList.toggle("is-scrolled", !atTop);

      if (atTop || goingUp) {
        header.classList.remove("is-hidden");
      } else if (goingDown) {
        header.classList.add("is-hidden");
        setMenuOpen(false);
      }

      lastY = y;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();
  }

  if (toc) {
    toc.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      const target = document.querySelector(a.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      setMenuOpen(false);
    });
  }

  function addHeading(text, href) {
    if (!toc) return;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.className = "text-[var(--muted)] hover:text-[var(--fg)]";
    li.appendChild(a);
    toc.appendChild(li);
  }

  if (!slug) return;

  fetch("/content/blog/posts.json")
    .then((r) => r.json())
    .then((posts) => {
      const post = posts.find((p) => p.slug === slug);
      if (!post) return;

      document.getElementById("post-title").textContent = post.title;
      document.title = post.title + " - Michal Lajčiak";

      const mdDir = "/content/blog/" + post.file.replace(/[^/]+$/, "");
      return fetch("/content/blog/" + post.file)
        .then((r) => r.text())
        .then((md) => {
          marked.setOptions({ breaks: true });
          const content = document.getElementById("content");
          content.innerHTML = marked.parse(md);

          content.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src");
            if (
              !src ||
              /^(?:[a-z]+:)?\/\//i.test(src) ||
              src.startsWith("/") ||
              src.startsWith("data:") ||
              src.startsWith("#")
            ) {
              return;
            }
            img.setAttribute("src", mdDir + src);
          });

          content.querySelectorAll("h2").forEach((h, i) => {
            h.id = "section-" + i;
            addHeading(h.textContent, "#" + h.id);
          });

          const mathReady = window.MathJax && MathJax.startup
            ? MathJax.startup.promise.then(() => MathJax.typesetPromise([content]))
            : Promise.resolve();

          return mathReady.then(() => {
            content.querySelectorAll("script").forEach((oldScript) => {
              const newScript = document.createElement("script");
              newScript.textContent = oldScript.textContent;
              oldScript.parentNode.replaceChild(newScript, oldScript);
            });
          });
        });
    });
})();
