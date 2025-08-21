function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const content = section.querySelector('.section-content');
  const header = section.querySelector('h1');
  const arrow = header && header.querySelector('[data-arrow]');
  if (!content) return;
  const willShow = (content.style.display === 'none' || !content.style.display);
  content.style.display = willShow ? 'block' : 'none';
  if (arrow) arrow.textContent = willShow ? '▼' : '▶';
  if (header) header.setAttribute('aria-expanded', String(willShow));
}

function initCollapsibles() {
  const contents = document.querySelectorAll('.section-content');
  contents.forEach(content => {
    content.style.display = 'none';
    const section = content.closest('[id]');
    if (!section) return;
    const header = section.querySelector('h1');
    if (!header) return;
    if (!header.querySelector('[data-arrow]')) {
      const btn = document.createElement('button');
      btn.setAttribute('data-arrow', 'true');
      btn.setAttribute('aria-hidden', 'true');
      btn.setAttribute('style', 'border:none;background:none;cursor:pointer;margin-right:0.5rem;font-size:1rem;');
      btn.textContent = '▶';
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleSection(section.id); });
      header.prepend(btn);
    }
    header.style.cursor = 'pointer';
    header.setAttribute('aria-expanded', 'false');
    if (!header.hasAttribute('onclick')) {
      header.addEventListener('click', () => toggleSection(section.id));
    }
  });
}

document.addEventListener('DOMContentLoaded', initCollapsibles);


