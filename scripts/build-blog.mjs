import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import katex from "katex";

const root = fileURLToPath(new URL("..", import.meta.url));
const metadata = JSON.parse(
  readFileSync(join(root, "writing/metadata.json"), "utf8")
);

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return escapeHtml(tex);
  }
}

function preprocessMath(md) {
  let out = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) =>
    renderMath(tex, true)
  );
  out = out.replace(/\$([^\$\n]+?)\$/g, (_, tex) => renderMath(tex, false));
  return out;
}

marked.use({
  renderer: {
    image({ href, title, text }) {
      const cap = title
        ? `<figcaption>${escapeHtml(title)}</figcaption>`
        : "";
      return `<figure><img src="${href}" alt="${escapeHtml(text)}">${cap}</figure>`;
    },
  },
});

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function themeInit() {
  return `  <script>
    (function () {
      var t = localStorage.getItem("theme");
      if (t === "system") {
        t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      if (t === "dark" || t === "light") {
        document.documentElement.setAttribute("data-theme", t);
      }
    })();
  </script>`;
}

function postPage({ title, dateLabel, bodyHtml, katexCss }) {
  const katexLink = katexCss
    ? `  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">\n`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.png" type="image/png">
  <title>${escapeHtml(title)} — Michal Lajčiak</title>
  <link rel="stylesheet" href="/css/site.css">
${katexLink}${themeInit()}
</head>
<body>
  <div class="site">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Michal Lajčiak</a></li>
        <li><a href="/writing/">Writing</a></li>
        <li aria-current="page">${escapeHtml(title)}</li>
      </ol>
    </nav>
    <article>
      <header class="post-header">
        <p class="post-date">${escapeHtml(dateLabel)}</p>
      </header>
      <div class="post-body">
${bodyHtml}
      </div>
    </article>
  </div>
  <script src="/js/theme.js" defer></script>
</body>
</html>
`;
}

for (const entry of Object.values(metadata)) {
  if (entry.published === false) continue;
  const parts = entry.entry_point.split("/");
  const slug = parts[0];
  const mdPath = join(root, "writing", entry.entry_point);
  const md = readFileSync(mdPath, "utf8");
  const hasMath = /\$[\s\S]*?\$/.test(md);
  const html = marked.parse(preprocessMath(md));
  const dateLabel = entry.pinned ? "Pinned" : formatDate(entry.date);
  const outDir = join(root, "writing", slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "index.html"),
    postPage({
      title: entry.title,
      dateLabel,
      bodyHtml: html.trim(),
      katexCss: hasMath,
    })
  );
  console.log(`built writing/${slug}/index.html`);
}
