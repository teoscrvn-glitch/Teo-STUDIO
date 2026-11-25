import fs from 'node:fs';
import assert from 'node:assert/strict';
const version=fs.readFileSync('VERSION.txt','utf8').trim();
const worker=fs.readFileSync('cloudflare/worker.js','utf8');
const config=fs.readFileSync('frontend/assets/js/config.js','utf8');
assert.match(version,/^v60\.3-phase0-performance-guard$/);
assert.ok(worker.includes(`const BUILD_VERSION='${version}'`));
assert.ok(config.includes(`BUILD_VERSION:'${version}'`));
for(const page of ['index.html','2.html','admin.html','tenant-admin.html','seller.html','share.html','rankings.html','account.html']){
 const html=fs.readFileSync(`frontend/${page}`,'utf8');
 assert.ok(html.includes('performance-guard.css?v=60.3'),`${page}: performance CSS missing`);
 assert.ok(html.includes('performance-guard.js?v=60.3'),`${page}: performance JS missing`);
}
const perf=fs.readFileSync('frontend/assets/js/performance-guard.js','utf8');
assert.ok(perf.includes('IntersectionObserver'));
assert.ok(perf.includes('timing.iterations!==Infinity'));
assert.ok(perf.includes('document.hidden'));
assert.ok(fs.existsSync('docs/PHASE0_REPO_AUDIT.md'));
for(let n=7;n<=13;n++)assert.ok(fs.existsSync(`docs/archive/legacy-admin-js/admin-v${n}.js`));
console.log('PASS V60.3 Phase 0/1: unified build id, archive preservation, mobile compositor guard and offscreen animation pausing.');
