// Books, Movies, Games
let cachedBMG = null;

async function loadBMG() {
  if (cachedBMG) return cachedBMG;
  const response = await fetch('books-movies-games.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  cachedBMG = await response.json();
  return cachedBMG;
}

function populateBMG(items) {
  const container = document.querySelector('#book-movies-games-recommendations .section-content');
  if (!container) return;
  const existing = container.querySelectorAll('[data-bmg-entry]');
  existing.forEach(el => el.remove());
  const keys = Object.keys(items);
  for (let i = 0; i < keys.length; i++) {
    const item = items[i];
    if (!item) continue;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-bmg-entry', 'true');
    wrapper.setAttribute('style', 'border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; border-left: 5px solid #000000; padding-left: 1rem; margin-bottom:1rem;');
    const h2 = document.createElement('h2');
    h2.textContent = item.title || '';
    const p = document.createElement('p');
    p.setAttribute('style', 'color: gray; font-size: 0.9rem;');
    p.textContent = item.review || '';
    wrapper.appendChild(h2);
    wrapper.appendChild(p);
    container.appendChild(wrapper);
  }
}

async function initBMG() {
  try {
    const data = await loadBMG();
    populateBMG(data);
  } catch (err) {
    console.error('Failed to load books-movies-games.json', err);
  }
}

document.addEventListener('DOMContentLoaded', initBMG);

