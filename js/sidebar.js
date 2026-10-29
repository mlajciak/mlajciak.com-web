const icons = {
  light: "fa-sun",
  dark: "fa-moon",
  system: "fa-circle-half-stroke",
};

const order = ["light", "dark", "system"];

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function theme() {
  const stored = localStorage.getItem("theme");
  return order.includes(stored) ? stored : "light";
}

function applyTheme(mode) {
  const dark = mode === "dark" || (mode === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", mode);
}

function themeName(mode) {
  return mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light";
}

function labelTheme(el) {
  const mode = theme();
  const name = themeName(mode);
  el.setAttribute("aria-label", name);
  el.innerHTML = '<i class="fa-solid ' + icons[mode] + '" aria-hidden="true"></i>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function byTitle(a, b) {
  return a.title.localeCompare(b.title, "en", { sensitivity: "base" });
}

function titleFromHtml(html, fallback) {
  const match = String(html).match(/<title>([^<]*)<\/title>/i);
  const title = match ? match[1].replace(/\s+/g, " ").trim() : "";
  return title || fallback;
}

function publicHref(filename) {
  const stem = String(filename).replace(/\.html$/i, "").replace(/^\/+|\/+$/g, "");
  if (!stem || stem === "about") return "/";
  return "/" + stem + "/";
}

function slugFromPath(pathname) {
  let path = decodeURIComponent(pathname || "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path === "" || path === "/") return "about";
  let slug = path.replace(/^\//, "");
  if (slug.startsWith("pages/")) slug = slug.slice("pages/".length);
  if (slug.toLowerCase().endsWith(".html")) slug = slug.slice(0, -5);
  if (!slug || slug.includes("/") || slug.includes(".")) return null;
  return slug;
}

async function pagesFromDirectory() {
  const res = await fetch("/content/");
  if (!res.ok) return null;
  const html = await res.text();
  if (!/Directory listing for/i.test(html)) return null;
  const names = [...html.matchAll(/href="([^"?#]+\.html)"/gi)]
    .map((match) => decodeURIComponent(match[1]))
    .filter((name) => !name.includes("/") && !name.startsWith("."));
  const pages = await Promise.all(
    [...new Set(names)].map(async (name) => {
      const file = await fetch("/content/" + encodeURIComponent(name));
      const text = file.ok ? await file.text() : "";
      const fallback = name.replace(/\.html$/i, "").replace(/-/g, " ");
      return { title: titleFromHtml(text, fallback), href: publicHref(name) };
    })
  );
  return pages.sort(byTitle);
}

async function pagesFromManifest() {
  const res = await fetch("/content/manifest.json");
  if (!res.ok) return [];
  const data = await res.json();
  return data
    .map((page) => ({
      title: page.title,
      href: publicHref((page.href || "").replace(/\/+$/, "").split("/").pop()),
    }))
    .sort(byTitle);
}

async function loadPages() {
  try {
    const listed = await pagesFromDirectory();
    if (listed && listed.length) return listed;
  } catch (err) {}
  try {
    return await pagesFromManifest();
  } catch (err) {
    return [];
  }
}

// Boyer–Moore, bad-character and good-suffix rules. The pattern is compiled once
// per keystroke and then run over each article.
function compileBoyerMoore(pattern) {
  const m = pattern.length;
  const right = new Map();
  for (let i = 0; i < m; i++) right.set(pattern[i], i);

  const border = new Array(m + 1);
  const shift = new Array(m + 1).fill(0);
  let i = m;
  let j = m + 1;
  border[i] = j;
  while (i > 0) {
    while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
      if (shift[j] === 0) shift[j] = j - i;
      j = border[j];
    }
    i -= 1;
    j -= 1;
    border[i] = j;
  }
  j = border[0];
  for (let k = 0; k <= m; k++) {
    if (shift[k] === 0) shift[k] = j;
    if (k === j) j = border[j];
  }

  return function indexIn(text, from = 0) {
    const n = text.length;
    if (m === 0) return from <= n ? from : -1;
    if (from < 0) from = 0;
    if (n - from < m) return -1;
    let pos = from;
    while (pos <= n - m) {
      let k = m - 1;
      while (k >= 0 && pattern[k] === text[pos + k]) k -= 1;
      if (k < 0) return pos;
      const ch = text[pos + k];
      const r = right.has(ch) ? right.get(ch) : -1;
      const badShift = Math.max(1, k - r);
      const goodShift = shift[k + 1] || 1;
      const next = pos + Math.max(badShift, goodShift);
      pos = next > pos ? next : pos + 1;
    }
    return -1;
  };
}

const linesByHref = new Map();
const LINE_BLOCK = "h1, h2, h3, p, li, ul, ol, blockquote";

function lineText(el) {
  if (!el.querySelector(LINE_BLOCK)) return el.textContent.replace(/\s+/g, " ").trim();
  let text = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
    else if (node.nodeType === Node.ELEMENT_NODE && !node.matches(LINE_BLOCK)) text += node.textContent;
  });
  return text.replace(/\s+/g, " ").trim();
}

function articleLines(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const main = doc.querySelector("main");
  if (!main) return [];
  const lines = [];
  main.querySelectorAll(LINE_BLOCK).forEach((el) => {
    const text = lineText(el);
    if (!text) return;
    lines.push({ n: lines.length + 1, text });
  });
  return lines;
}

async function indexArticles() {
  await Promise.all(
    sidebarLinks().map(async (link) => {
      const href = link.getAttribute("href") || "";
      if (link.origin !== location.origin) {
        linesByHref.set(href, []);
        return;
      }
      const slug = slugFromPath(link.pathname);
      if (!slug) {
        linesByHref.set(href, []);
        return;
      }
      try {
        const res = await fetch("/content/" + encodeURIComponent(slug) + ".html");
        linesByHref.set(href, res.ok ? articleLines(await res.text()) : []);
      } catch (err) {
        linesByHref.set(href, []);
      }
    })
  );
}

function fillHitLines(box, href, lines, needle, find) {
  box.replaceChildren();
  lines.forEach((line) => {
    const link = document.createElement("a");
    link.href = href;
    link.dataset.line = String(line.n);
    const number = document.createElement("span");
    number.className = "hit-no";
    number.textContent = "L:" + line.n;
    const body = document.createElement("span");
    body.className = "hit-text";
    body.textContent = line.text;
    link.append(number, body);
    highlightMatches(body, needle, find);
    box.appendChild(link);
  });
}

function clearSearchMarks(root) {
  root.querySelectorAll("mark.search-hit").forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function highlightMatches(root, needle, find) {
  clearSearchMarks(root);
  if (!root || !needle || !find) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let current;
  while ((current = walker.nextNode())) nodes.push(current);
  nodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent || parent.closest("script, style, mjx-container, mark.search-hit")) return;
    const raw = textNode.nodeValue;
    if (!raw) return;
    const lower = raw.toLowerCase();
    if (lower.length !== raw.length) return;
    const spans = [];
    let from = 0;
    while (from <= lower.length - needle.length) {
      const at = find(lower, from);
      if (at < 0 || at < from) break;
      spans.push(at);
      from = at + needle.length;
    }
    if (!spans.length) return;
    const frag = document.createDocumentFragment();
    let cursor = 0;
    spans.forEach((at) => {
      if (at > cursor) frag.appendChild(document.createTextNode(raw.slice(cursor, at)));
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = raw.slice(at, at + needle.length);
      frag.appendChild(mark);
      cursor = at + needle.length;
    });
    if (cursor < raw.length) frag.appendChild(document.createTextNode(raw.slice(cursor)));
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

function clearSearchLine() {
  document.querySelectorAll("#page .search-line").forEach((el) => el.classList.remove("search-line"));
}

function markSearchLine(n) {
  clearSearchLine();
  const page = document.getElementById("page");
  if (!page || !n) return;
  const lines = [];
  page.querySelectorAll(LINE_BLOCK).forEach((el) => {
    if (lineText(el)) lines.push(el);
  });
  const el = lines[n - 1];
  if (!el) return;
  el.classList.add("search-line");
  el.scrollIntoView({ block: "center" });
}

function renderToc(root) {
  const toc = document.getElementById("toc");
  if (!toc) return;
  toc.replaceChildren();
  if (!root || document.body.classList.contains("is-about")) return;
  [...root.querySelectorAll("h2, h3")].forEach((heading, index) => {
    const id = heading.id || "s" + (index + 1);
    heading.id = id;
    const item = document.createElement("div");
    item.className = "toc-item" + (heading.tagName === "H3" ? " toc-sub" : "");
    const para = document.createElement("p");
    const link = document.createElement("a");
    link.href = "#" + id;
    link.textContent = heading.textContent.replace(/\s+/g, " ").trim();
    para.appendChild(link);
    item.appendChild(para);
    toc.appendChild(item);
  });
}

const UNPUBLISHED = new Set([
  "/energy-based-a-neuron/",
  "/tertiary-gluon-computer/",
  "/what-will-be-the-finite-architecture-of-superintelligence/",
]);

function pageItemHtml(page, index) {
  return `<div class="page-item"><p><span class="menu-index">${index}</span><a href="${escapeHtml(page.href)}">${escapeHtml(page.title)}</a></p></div>`;
}

function renderPages(pages) {
  const slot = document.getElementById("page-list");
  if (!slot || slot.childElementCount) return;
  const listed = pages.filter((page) => page.href !== "/");
  slot.innerHTML = listed.map((page, index) => pageItemHtml(page, index)).join("");

  const unpublishedSlot = document.getElementById("list-unpublished");
  const blogSlot = document.getElementById("list-blog");
  if (unpublishedSlot) {
    unpublishedSlot.innerHTML = listed
      .filter((page) => UNPUBLISHED.has(page.href))
      .map((page) => pageItemHtml(page, 0))
      .join("");
  }
  if (blogSlot) {
    blogSlot.insertAdjacentHTML(
      "afterbegin",
      listed.filter((page) => !UNPUBLISHED.has(page.href)).map((page) => pageItemHtml(page, 0)).join("")
    );
  }

  document.querySelectorAll(".home-group").forEach((group) => {
    group.querySelectorAll(":scope > p").forEach((para) => {
      if (para.querySelector(".menu-index")) return;
      const mark = document.createElement("span");
      mark.className = "menu-index";
      para.insertBefore(mark, para.firstChild);
    });
    group.querySelectorAll(".menu-index").forEach((mark, index) => {
      mark.textContent = String(index);
    });
  });
}

async function typeset(node) {
  try {
    if (!window.MathJax) return;
    if (MathJax.startup && MathJax.startup.promise) await MathJax.startup.promise;
    if (MathJax.typesetPromise) await MathJax.typesetPromise([node]);
  } catch (err) {}
}

let currentSlug = null;
let requestId = 0;

async function openPage(slug, historyMode) {
  document.body.classList.toggle("is-about", slug === "about");
  if (slug === "about" && nav.classList.contains("is-searching")) {
    nav.classList.remove("is-searching");
    markSearchButton(false);
  }
  const path = slug === "about" ? "/" : "/" + slug + "/";
  if (slug === currentSlug) {
    if (historyMode === "push" && location.pathname !== path) {
      history.pushState({ slug }, "", path);
    }
    return;
  }

  const id = ++requestId;
  const content = document.getElementById("content");
  const page = document.getElementById("page");
  const instant = slug === "about";
  if (instant) {
    content.classList.remove("is-loading");
    content.removeAttribute("aria-busy");
  } else {
    content.classList.add("is-loading");
    content.setAttribute("aria-busy", "true");
    page.replaceChildren();
  }

  let response;
  try {
    response = await fetch("/content/" + encodeURIComponent(slug) + ".html");
  } catch (err) {
    response = null;
  }
  if (id !== requestId) return;

  if (!response || !response.ok) {
    document.title = "Not found";
    const message = document.createElement("p");
    message.textContent = "This page does not exist.";
    page.replaceChildren(message);
  } else {
    const html = await response.text();
    if (id !== requestId) return;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const article = doc.querySelector("main");
    const title = doc.querySelector("title");
    document.title = title && title.textContent.trim() ? title.textContent.trim() : slug;
    page.innerHTML = article ? article.innerHTML : "";
    await typeset(page);
    if (id !== requestId) return;
  }

  content.classList.remove("is-loading");
  content.removeAttribute("aria-busy");
  currentSlug = slug;
  renderToc(page);
  if (historyMode === "push") history.pushState({ slug }, "", path);
  else if (historyMode === "replace") history.replaceState({ slug }, "", path);
  if (historyMode !== "none") {
    window.scrollTo(0, 0);
    content.scrollTop = 0;
  }
  const queryInput = document.getElementById("nav-query");
  applySidebarFilter(queryInput ? queryInput.value : "");
}

function onClick(event) {
  if (event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a");
  if (!link || !link.href) return;
  if (link.target && link.target !== "_self") return;
  if (link.hasAttribute("download")) return;
  const raw = link.getAttribute("href") || "";
  if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) return;
  let url;
  try {
    url = new URL(link.href);
  } catch (err) {
    return;
  }
  if (url.origin !== location.origin) return;
  const slug = slugFromPath(url.pathname);
  if (!slug) return;
  event.preventDefault();
  const line = link.closest(".search-hits") ? Number(link.dataset.line) : 0;
  openPage(slug, "push").then(() => {
    if (line) markSearchLine(line);
  });
}

applyTheme(theme());

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (theme() === "system") applyTheme("system");
});

const toggle = document.getElementById("theme-toggle");
if (toggle) {
  labelTheme(toggle);
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const next = order[(order.indexOf(theme()) + 1) % order.length];
    applyTheme(next);
    labelTheme(toggle);
  });
}

const nav = document.getElementById("site-nav");
const searchButton = document.getElementById("nav-search");
const searchInput = document.getElementById("nav-query");
const tocButton = document.getElementById("nav-toc");
const articlesButton = document.getElementById("nav-articles");

function showArticleList(articles) {
  if (nav.classList.contains("is-searching")) closeSidebarSearch();
  nav.classList.toggle("is-articles", articles);
  if (tocButton) tocButton.setAttribute("aria-pressed", articles ? "false" : "true");
  if (articlesButton) articlesButton.setAttribute("aria-pressed", articles ? "true" : "false");
}

if (tocButton) tocButton.addEventListener("click", () => showArticleList(false));
if (articlesButton) articlesButton.addEventListener("click", () => showArticleList(true));

function sidebarLinks() {
  const about = document.body.classList.contains("is-about");
  return [...nav.querySelectorAll("a")].filter((link) => {
    if (link.closest(".name") || link.closest(".activity") || link.closest(".search-hits") || link.closest("#toc")) return false;
    if (about && link.closest("#page-list")) return false;
    if (!about && link.closest(".home-group")) return false;
    return true;
  });
}

function searchStatus() {
  let status = document.getElementById("search-status");
  if (status) return status;
  status = document.createElement("p");
  status.id = "search-status";
  status.className = "search-status";
  status.hidden = true;
  status.textContent = "No results found.";
  const search = nav.querySelector(".nav-search");
  search.insertAdjacentElement("afterend", status);
  return status;
}

function applySidebarFilter(query) {
  const about = document.body.classList.contains("is-about");
  const searching = nav.classList.contains("is-searching");
  const active = searching;
  const needle = query.trim().toLowerCase();
  const find = needle ? compileBoyerMoore(needle) : null;
  let shown = 0;
  sidebarLinks().forEach((link) => {
    const item = link.closest(".page-item") || link.closest("p") || link;
    const hits = item.querySelector ? item.querySelector(":scope > .search-hits") : null;
    if (!active || !find) {
      item.hidden = searching && !find && !about;
      if (hits) hits.remove();
      return;
    }
    const href = link.getAttribute("href") || "";
    const lines = linesByHref.get(href) || [];
    const matched = lines.filter((line) => find(line.text.toLowerCase()) >= 0);
    const titleHit = find(link.textContent.toLowerCase()) >= 0;
    const linesOnly = searching && !about;
    if (linesOnly && !item.classList.contains("page-item")) {
      item.hidden = true;
      if (hits) hits.remove();
      return;
    }
    item.hidden = linesOnly ? matched.length === 0 : !titleHit && matched.length === 0;
    if (!item.hidden) shown += 1;
    if (!item.classList.contains("page-item")) return;
    if (item.hidden || matched.length === 0) {
      if (hits) hits.remove();
      return;
    }
    const box = hits || document.createElement("div");
    box.className = "search-hits";
    if (!hits) item.appendChild(box);
    fillHitLines(box, href, matched, needle, find);
  });
  document.querySelectorAll(".home-group").forEach((group) => {
    const title = group.previousElementSibling;
    const hasVisible = [...group.children].some((child) => !child.hidden);
    const hideSection = Boolean(find) && !hasVisible;
    group.hidden = hideSection;
    if (title && title.classList.contains("home-title")) title.hidden = hideSection;
  });
  const status = searchStatus();
  status.hidden = !active || !needle || shown > 0;
  const article = document.getElementById("page");
  if (article && !article.closest("main")?.classList.contains("is-loading")) {
    highlightMatches(article, needle, find);
  }
}

function markSearchButton(open) {
  if (!searchButton) return;
  const closing = open && document.body.classList.contains("is-about");
  searchButton.setAttribute("aria-pressed", open ? "true" : "false");
  searchButton.setAttribute("aria-label", closing ? "Close search" : "Search");
}

function closeSidebarSearch() {
  if (!nav.classList.contains("is-searching")) return;
  nav.classList.remove("is-searching");
  markSearchButton(false);
  searchInput.value = "";
  applySidebarFilter("");
}

if (searchButton && searchInput) {
  searchInput.form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  const searchClose = document.getElementById("nav-search-close");
  if (searchClose) {
    searchClose.addEventListener("click", (event) => {
      event.preventDefault();
      closeSidebarSearch();
    });
  }

  searchButton.addEventListener("click", () => {
    if (nav.classList.contains("is-searching")) {
      closeSidebarSearch();
      return;
    }
    nav.classList.add("is-searching");
    markSearchButton(true);
    searchInput.focus();
    applySidebarFilter(searchInput.value);
  });

  searchInput.addEventListener("input", () => {
    applySidebarFilter(searchInput.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSidebarSearch();
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-searching")) return;
    if (event.target.closest(".side") || event.target.closest(".activity") || event.target.closest(".theme")) return;
    closeSidebarSearch();
  });
}

document.addEventListener("click", onClick);
window.addEventListener("popstate", () => {
  const slug = slugFromPath(location.pathname);
  if (slug) openPage(slug, "pop");
});

if ((slugFromPath(location.pathname) || "about") === "about") {
  const content = document.getElementById("content");
  if (content) {
    content.classList.remove("is-loading");
    content.removeAttribute("aria-busy");
  }
}

async function start() {
  const pages = (await loadPages()).slice().sort(byTitle);
  renderPages(pages);
  openPage(slugFromPath(location.pathname) || "about", "none");
  await indexArticles();
  if (searchInput) applySidebarFilter(searchInput.value);
}

start();
