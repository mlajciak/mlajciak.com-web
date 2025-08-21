// Awards
let cachedAwards = null;

async function loadAwards() {
  if (cachedAwards) return cachedAwards;
  const response = await fetch('awards.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  cachedAwards = await response.json();
  return cachedAwards;
}

function populateAwards(awardsData) {
  const container = document.querySelector('#awards .section-content');
  if (!container) return;
  const existing = container.querySelectorAll('[data-award-entry]');
  existing.forEach(el => el.remove());
  const keys = Object.keys(awardsData);
  for (let i = 0; i < keys.length; i++) {
    const award = awardsData[i];
    if (!award) continue;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-award-entry', 'true');
    wrapper.setAttribute('style', 'border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; border-left: 5px solid #000000; padding-left: 1rem; margin-bottom:1rem;');
    const h2 = document.createElement('h2');
    if (award.link) {
      const a = document.createElement('a');
      a.href = award.link;
      a.target = '_blank';
      a.textContent = award.title || '';
      h2.appendChild(a);
    } else {
      h2.textContent = award.title || '';
    }
    const p = document.createElement('p');
    p.setAttribute('style', 'color: gray; font-size: 0.9rem;');
    p.textContent = award.description || '';
    wrapper.appendChild(h2);
    wrapper.appendChild(p);
    container.appendChild(wrapper);
  }
}

async function initAwards() {
  try {
    const data = await loadAwards();
    populateAwards(data);
  } catch (err) {
    console.error('Failed to load awards.json', err);
  }
}

document.addEventListener('DOMContentLoaded', initAwards);