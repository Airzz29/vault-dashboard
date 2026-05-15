/**
 * Copy static assets into Next.js standalone output (required for Render deploy).
 */
const fs = require('fs');
const path = require('path');

const standaloneDir = path.join('.next', 'standalone');
const staticSrc = path.join('.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = 'public';
const publicDest = path.join(standaloneDir, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone output not found. Run next build first.');
  process.exit(1);
}

copyRecursive(staticSrc, staticDest);
copyRecursive(publicSrc, publicDest);
console.log('Standalone assets copied successfully.');
