import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const exists = (p) => assert.ok(fs.existsSync(path.join(root, p)), `Missing ${p}`);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

for (const p of [
  'frontend/assets/css/tokens.css',
  'frontend/assets/css/components.css',
  'frontend/assets/css/motion.css',
  'frontend/assets/js/motion.js',
  'frontend/assets/icons.svg',
  'frontend/assets/brand/logo-wordmark-dark.svg',
  'frontend/assets/brand/logo-wordmark-light.svg',
  'frontend/assets/brand/logo-mark.svg',
  'frontend/assets/brand/favicon.svg',
  'frontend/assets/brand/favicon-64.png',
  'frontend/assets/brand/og-preview.png',
  'frontend/assets/img/pwa-192.png',
  'frontend/assets/img/pwa-512.png',
  'frontend/assets/img/pwa-512-maskable.png',
  'frontend/manifest.webmanifest',
  'scripts/check-design-rules.mjs',
  'docs/DESIGN_BASELINE.md',
  'docs/REDESIGN_STEP0_REPORT.md',
]) exists(p);

const manifest = JSON.parse(read('frontend/manifest.webmanifest'));
assert.equal(manifest.lang, 'vi-VN');
assert.equal(manifest.display, 'standalone');
for (const icon of manifest.icons) exists(`frontend${icon.src}`.replace('frontend/', 'frontend/'));

const pages = fs.readdirSync(path.join(root, 'frontend')).filter((f) => f.endsWith('.html'));
assert.equal(pages.length, 26, 'Expected all 26 frontend pages to carry shared brand metadata');
for (const file of pages) {
  const html = read(`frontend/${file}`);
  assert.ok(html.includes('/assets/brand/favicon.svg'), `${file}: SVG favicon missing`);
  assert.ok(html.includes('/manifest.webmanifest'), `${file}: manifest missing`);
  assert.ok(html.includes('/assets/img/pwa-192.png'), `${file}: Apple touch icon missing`);
}

const foundation = ['tokens.css', 'components.css', 'motion.css'].map((f) => read(`frontend/assets/css/${f}`)).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
assert.doesNotMatch(foundation, /!important/i, 'New foundation CSS must not use !important');
assert.doesNotMatch(foundation, /transition\s*:\s*all\b/i, 'transition: all is forbidden');
assert.doesNotMatch(foundation, /filter\s*:\s*blur\(\s*(?:[3-9]\d|\d{3,})px/i, 'Large blur is forbidden');
assert.doesNotMatch(foundation, /#(?:8b5cf6|a855f7|ec4899|7c3aed|9665f7|db68c7|8b7cff)\b/i, 'Legacy purple/pink colors are forbidden');

for (const match of foundation.matchAll(/transition\s*:\s*([^;]+);/gi)) {
  const value = match[1].trim();
  if (value === 'none') continue;
  for (const segment of value.split(',')) {
    const prop = segment.trim().split(/\s+/)[0];
    assert.ok(['transform', 'opacity', 'stroke-dashoffset'].includes(prop), `Forbidden transition property: ${prop}`);
  }
}

// Every infinite loop must require data-live and must start paused until in view.
for (const required of [
  '.float-a[data-live]', '.float-b[data-live]', '.ring-spin[data-live]',
  '.skeleton[data-live]::after', '.pulse[data-live]::after',
  '[data-live].is-live',
]) assert.ok(foundation.includes(required), `Missing viewport-motion gate ${required}`);

const motion = read('frontend/assets/js/motion.js');
assert.match(motion, /new IntersectionObserver/);
assert.match(motion, /document\.hidden/);
assert.match(motion, /querySelectorAll\('\[data-live\]'\)/);
console.log(`PASS Redesign Step 0: ${pages.length} HTML heads, PWA/brand assets, tokenized foundation CSS and viewport-gated motion.`);
