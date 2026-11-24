import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='frontend/';
const accountCss=fs.readFileSync(root+'assets/css/page-account.css','utf8');
const homeCss=fs.readFileSync(root+'assets/css/page-home.css','utf8');
const mobileCss=fs.readFileSync(root+'assets/css/mobile-touch-fixes.css','utf8');
const shareJs=fs.readFileSync(root+'assets/js/tenant-share.js','utf8');
const detailHtml=fs.readFileSync(root+'detail.html','utf8');
for(const page of ['share.html','detail.html','product-detail-view.html','tenant-detail.html']){
  assert.match(fs.readFileSync(root+page,'utf8'),/mobile-touch-fixes\.css\?v=60\.3/,`${page} loads touch fixes`);
}
assert.doesNotMatch(accountCss,/^@layer\s+page\s*\{/m,'account stylesheet is unlayered so it can override legacy styles');
assert.match(accountCss,/\.teo-ai-consent-card\s*\{[^}]*background:var\(--surface-2\)/s,'account AI consent card uses current tokens');
assert.match(homeCss,/pointer:\s*coarse/s,'homepage has Android coarse-pointer fallback');
assert.match(homeCss,/\.site-nav, \.header-login \{ display:none; \}/,'homepage hides desktop navigation on touch screens');
assert.match(homeCss,/recent-sales-grid \.recent-sales-track,\s*\.recent-sales-grid \.recent-sales-group/s,'homepage stops ticker layout on touch screens');
assert.match(homeCss,/recent-sales-group\[aria-hidden=\"true\"\] \{ display:none; \}/,'homepage suppresses duplicated marquee cards');
assert.match(mobileCss,/\.teo-account-launcher > \.i\s*\{[^}]*width:20px[^}]*height:20px/s,'account launcher icon has explicit SVG dimensions');
assert.match(mobileCss,/\.detail-page \.detail-card\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/s,'detail becomes single-column on touch devices');
assert.match(mobileCss,/object-fit:contain/s,'large file media is contained instead of cropped');
assert.match(mobileCss,/recent-sales-grid \.recent-sales-track/s,'recent sales ticker becomes responsive cards');
assert.match(shareJs,/genericSiteName/,'tenant header treats legacy generic default names as fallback');
assert.match(shareJs,/s\.studio\|\|'TeoStudio'/,'tenant header falls back to tenant studio name');
assert.match(detailHtml,/logo-wordmark-dark\.svg/,'main detail uses current TeoStudio wordmark');
assert.doesNotMatch(detailHtml,/Lại Húp File/,'main detail removes stale legacy brand text');
console.log('PASS screenshot regressions: account cascade, Android touch layout, detail media, recent sales grid, tenant brand, launcher SVG.');
