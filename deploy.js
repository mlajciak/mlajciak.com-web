import { execSync } from 'child_process';
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'fs';

// Save the dev index.html
const devIndex = readFileSync('index.html', 'utf8');

// Copy built index.html to root (for GitHub Pages)
cpSync('dist/index.html', 'index.html');

// Copy built assets to root /assets folder (for GitHub Pages)
if (existsSync('assets')) rmSync('assets', { recursive: true });
cpSync('dist/assets', 'assets', { recursive: true });

// Git add, commit, push
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "deploy"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch (e) {
  console.log('Git operations completed (or nothing to commit)');
}

// Restore dev index.html
writeFileSync('index.html', devIndex);
console.log('Deploy complete. Dev index.html restored.');
