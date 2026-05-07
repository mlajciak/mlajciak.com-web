import { execSync } from 'child_process';
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'fs';

// Save the dev index.html
const devIndex = readFileSync('index.html', 'utf8');

// Copy built index.html to root (for GitHub Pages)
cpSync('dist/index.html', 'index.html');

// Copy built assets to root /assets folder (for GitHub Pages)
if (existsSync('assets')) rmSync('assets', { recursive: true });
cpSync('dist/assets', 'assets', { recursive: true });

// Copy blog folder to root (for GitHub Pages)
if (existsSync('blog')) rmSync('blog', { recursive: true });
cpSync('dist/blog', 'blog', { recursive: true });

// Copy 404.html to root
cpSync('dist/404.html', '404.html');

// Git add, commit, push (with the built index.html in place)
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "deploy"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch (e) {
  console.log('Git operations completed (or nothing to commit)');
}

// Restore dev index.html after pushing
writeFileSync('index.html', devIndex);
// Unstage the restored dev index.html so it doesn't show as modified
try {
  execSync('git checkout -- index.html', { stdio: 'inherit' });
} catch (e) {}
console.log('Deploy complete. Dev index.html restored.');
