import fs from 'node:fs';
import assert from 'node:assert/strict';
const version=fs.readFileSync('VERSION.txt','utf8').trim();
const worker=fs.readFileSync('cloudflare/worker.js','utf8');
const config=fs.readFileSync('frontend/assets/js/config.js','utf8');
assert.match(version,/^v60\.8-admin-routing-responsive$/);
assert.ok(worker.includes(`const BUILD_VERSION='${version}'`));
assert.ok(config.includes(`BUILD_VERSION:'${version}'`));
for(const page of ['index.html','2.html','admin.html','tenant-admin.html','seller.html','share.html','rankings.html','account.html']){
 const html=fs.readFileSync(`frontend/${page}`,'utf8');
 if(page==='index.html'){
  for(const asset of ['tokens.css?v=60.8','components.css?v=60.8','motion.css?v=60.8','page-home.css?v=60.8']) assert.ok(html.includes(asset),`index.html: missing redesigned asset ${asset}`);
  assert.ok(!html.includes('performance-guard.css?v=60.8'),'index.html: legacy performance CSS must not be reloaded');
 }else assert.ok(html.includes('performance-guard.css?v=60.8'),`${page}: performance CSS missing`);
 assert.ok(html.includes('performance-guard.js?v=60.8'),`${page}: performance JS missing`);
}
const perf=fs.readFileSync('frontend/assets/js/performance-guard.js','utf8');
assert.ok(perf.includes('IntersectionObserver'));
assert.ok(perf.includes('timing.iterations!==Infinity'));
assert.ok(perf.includes("'[data-live],.teo-sales-track'"));
assert.ok(perf.includes("body.classList.contains('admin-body')"));
assert.ok(!/querySelectorAll\(['"]\*['"]\)/.test(perf),'performance guard must never scan the complete document');
assert.ok(perf.includes('document.hidden'));
assert.ok(fs.existsSync('docs/PHASE0_REPO_AUDIT.md'));
for(let n=7;n<=13;n++)assert.ok(fs.existsSync(`docs/archive/legacy-admin-js/admin-v${n}.js`));
console.log('PASS V60.3/V60.8: build id, archive preservation, selective animation visibility guard and Admin bypass.');
