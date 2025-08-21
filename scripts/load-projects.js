// Projects
let cachedProjects = null;

async function loadProjects() {
  if (cachedProjects) return cachedProjects;
  const response = await fetch('projects.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  cachedProjects = await response.json();
  return cachedProjects;
}

function populateProjects(projectsData) {
  const container = document.querySelector('#projects .section-content');
  if (!container) return;
  const existing = container.querySelectorAll('[data-project-entry]');
  existing.forEach(el => el.remove());
  const keys = Object.keys(projectsData);
  for (let i = 0; i < keys.length; i++) {
    const project = projectsData[i];
    if (!project) continue;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-project-entry', 'true');
    wrapper.setAttribute('style', 'border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; border-left: 5px solid #000000; padding-left: 1rem; margin-bottom:1rem;');
    const h2 = document.createElement('h2');
    h2.textContent = project.title || '';
    const p = document.createElement('p');
    p.setAttribute('style', 'color: gray; font-size: 0.9rem;');
    p.textContent = project.description || '';
    wrapper.appendChild(h2);
    wrapper.appendChild(p);
    container.appendChild(wrapper);
  }
}

async function initProjects() {
  try {
    const data = await loadProjects();
    populateProjects(data);
  } catch (err) {
    console.error('Failed to load projects.json', err);
  }
}

document.addEventListener('DOMContentLoaded', initProjects);