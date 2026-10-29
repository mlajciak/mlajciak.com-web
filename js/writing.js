(function () {
  const list = document.getElementById("index-list");
  const search = document.getElementById("index-search");
  if (!list) return;

  let items = [];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function itemHtml(item) {
    const href = item.url || `post.html?slug=${encodeURIComponent(item.slug)}`;
    const attrs = item.url ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<li>
      <a href="${href}"${attrs}>
        <span class="index-title">${escapeHtml(item.title)}</span>
        <time datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time>
      </a>
    </li>`;
  }

  function matches(item, query) {
    if (!query) return true;
    const date = formatDate(item.date);
    const hay = [item.title, item.slug, item.date, date, item.kind]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  }

  function render() {
    const query = (search && search.value ? search.value : "").trim().toLowerCase();
    const visible = items.filter((item) => matches(item, query));
    if (!visible.length) {
      list.innerHTML = `<li><p class="index-empty">No matching posts.</p></li>`;
      return;
    }
    list.innerHTML = visible.map(itemHtml).join("");
  }

  if (search) {
    search.addEventListener("input", render);
  }

  fetch("/content/blog/posts.json")
    .then((r) => r.json())
    .then((data) => {
      items = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      render();
    });
})();
