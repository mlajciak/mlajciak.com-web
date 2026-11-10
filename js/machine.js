const KEY = "xyzt-mode";
const FACE = '"Accelerando-8192"';
const originals = new WeakMap();

let machine = false;
let tokenizer = null;
let loading = null;
let applying = false;
let pauseGen = 0;

class GlyphTokenizer {
  constructor(data) {
    this.bytes = data.tokens.map((token) => Uint8Array.from(atob(token), (c) => c.charCodeAt(0)));
    this.ranks = new Map(this.bytes.map((bytes, index) => [String.fromCharCode(...bytes), index]));
    const contraction = "(?:'[sS]|'[tT]|'[rR][eE]|'[vV][eE]|'[mM]|'[lL][lL]|'[dD])";
    const pattern = data.pattern
      .replaceAll("(?i:'s|'t|'re|'ve|'m|'ll|'d)", contraction)
      .replaceAll("\\s", "\\p{White_Space}")
      .replaceAll("\\S", "\\P{White_Space}");
    this.pattern = new RegExp(pattern, "gu");
    this.encoder = new TextEncoder();
  }

  encode(text) {
    const ids = [];
    this.pattern.lastIndex = 0;
    const pieces = [...text.matchAll(this.pattern)].map((match) => match[0]);
    if (pieces.join("") !== text) throw new Error("unsegmented");
    for (const piece of pieces) {
      const bytes = String.fromCharCode(...this.encoder.encode(piece));
      if (this.ranks.has(bytes)) {
        ids.push(this.ranks.get(bytes));
        continue;
      }
      const parts = [...bytes];
      while (parts.length > 1) {
        let rank = Infinity;
        let index = -1;
        for (let i = 0; i < parts.length - 1; i++) {
          const next = this.ranks.get(parts[i] + parts[i + 1]);
          if (next !== undefined && next < rank) {
            rank = next;
            index = i;
          }
        }
        if (index < 0) break;
        parts.splice(index, 2, parts[index] + parts[index + 1]);
      }
      ids.push(...parts.map((part) => this.ranks.get(part)));
    }
    return ids;
  }
}

const glyphOf = (id) => String.fromCodePoint(0xf0000 + id);

const glyphs = (text) => {
  if (!tokenizer || !text) return text ?? "";
  try {
    return tokenizer.encode(text).map(glyphOf).join("");
  } catch (err) {
    return text;
  }
};

const blocked = (el) =>
  !el || el.closest("script, style, noscript, svg, mjx-container, mjx-assistive-mml, .mode-toggle");

const shown = (node, raw) => {
  const transform = getComputedStyle(node.parentElement).textTransform;
  if (transform === "uppercase") return raw.toLocaleUpperCase("en");
  if (transform === "lowercase") return raw.toLocaleLowerCase("en");
  return raw;
};

const displayText = (node, raw) => {
  const collapsed = raw.replace(/[ \t\n\r\f]+/g, " ");
  let core = collapsed;
  let lead = "";
  let tail = "";
  if (core.startsWith(" ")) {
    core = core.slice(1);
    if (node.previousSibling) lead = " ";
  }
  if (core.endsWith(" ")) {
    core = core.slice(0, -1);
    if (node.nextSibling) tail = " ";
  }
  if (!core) return raw;
  return lead + glyphs(shown(node, core)) + tail;
};

const encode = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (originals.has(node) || blocked(node.parentElement)) continue;
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) continue;
    originals.set(node, raw);
    node.nodeValue = displayText(node, raw);
  }
};

const restore = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (!originals.has(node)) continue;
    node.nodeValue = originals.get(node);
    originals.delete(node);
  }
};

const faceReady = () => document.fonts.load("400 16px " + FACE, "\u{F0000}");

const ensure = () => {
  if (!loading) {
    loading = fetch("/public/accelerando/vocab.json")
      .then((response) => {
        if (!response.ok) throw new Error("vocab");
        return response.json();
      })
      .then((data) => {
        tokenizer = new GlyphTokenizer(data);
      });
  }
  return loading.then(faceReady);
};

const paintButton = (button) => {
  if (!button) return;
  button.setAttribute("aria-pressed", machine ? "true" : "false");
  button.setAttribute("aria-label", machine ? "Switch to Latin" : "Switch to Accelerando");
};

const applyTree = () => {
  applying = true;
  if (machine) encode(document.body);
  else restore(document.body);
  applying = false;
};

const setMachine = async (next) => {
  const button = document.querySelector(".mode-toggle");
  if (next) {
    button?.setAttribute("aria-busy", "true");
    try {
      await ensure();
    } finally {
      button?.removeAttribute("aria-busy");
    }
  }
  machine = next;
  document.documentElement.classList.toggle("machine", next);
  if (!pauseGen) applyTree();
  try {
    localStorage.setItem(KEY, next ? "machine" : "human");
  } catch (err) {
    /* private mode */
  }
  paintButton(button);
};

window.machinePause = () => ++pauseGen;

window.machineResume = (gen) => {
  if (gen !== pauseGen) return;
  pauseGen = 0;
  if (machine && tokenizer) applyTree();
};

const button = document.querySelector(".mode-toggle");
paintButton(button);
button?.addEventListener("click", async () => {
  if (button.getAttribute("aria-busy") === "true") return;
  try {
    await setMachine(!machine);
  } catch (err) {
    button.removeAttribute("aria-busy");
  }
});

const observer = new MutationObserver(() => {
  if (applying || pauseGen || !machine || !tokenizer) return;
  applyTree();
});
observer.observe(document.body, { childList: true, subtree: true, characterData: true });

let saved = null;
try {
  saved = localStorage.getItem(KEY);
} catch (err) {
  saved = null;
}
if (saved === "machine") setMachine(true);
