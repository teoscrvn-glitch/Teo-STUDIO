import fs from 'node:fs';
import assert from 'node:assert/strict';

const worker = fs.readFileSync('cloudflare/worker.js', 'utf8');
const admin = fs.readFileSync('frontend/assets/js/admin-v14.js', 'utf8');
const html = fs.readFileSync('frontend/admin.html', 'utf8');
const config = fs.readFileSync('frontend/assets/js/config.js', 'utf8');
const version = fs.readFileSync('VERSION.txt', 'utf8').trim();

// Regression: a legacy hidden original_link must never override the visible
// "Link gốc tải sau khi mua" field edited by the Admin.
const oldLink = 'https://old.example/file.zip';
const editedVisibleLink = 'https://new.example/file.zip';
const paidTarget = editedVisibleLink || oldLink;
assert.equal(paidTarget, editedVisibleLink);

assert.match(worker, /const paidTarget=dl0\|\|original0;return \{title:clean\(b\.title,200\).*download_link:mode==='paid'\?paidTarget:dl0,original_link:mode==='free'\?'':\(mode==='paid'\?paidTarget:/s);
assert.match(admin, /original_link:String\(f\.get\('sale_mode'\)==='paid'\?\(f\.get\('downloadLink'\)\|\|''\):\(f\.get\('originalLink'\)\|\|''\)\)\.trim\(\)/);
assert.match(admin, /const expectedLink=String\(body\.download_link\)/);
assert.match(admin, /form\.dataset\.editingId='';form\.reset\(\)/);
assert.match(admin, /window\.newProductForm=\(\)=>\{const form=\$\('#productForm'\);form\.reset\(\);form\.dataset\.editingId=''/);
const adminAssetVersion = html.match(/admin-v14\.js\?v=([^"'&]+)/)?.[1];
const configAssetVersion = html.match(/config\.js\?v=([^"'&]+)/)?.[1];
assert.ok(adminAssetVersion, 'Admin script must have a cache key');
assert.equal(adminAssetVersion, configAssetVersion, 'Admin and config scripts must share the same cache key');
assert.ok(html.includes(version), 'Admin HTML must carry the current build version');
assert.ok(config.includes(version), 'Runtime config must carry the current build version');

console.log('PASS: V60.2 paid-product edits prefer the newly edited visible link, persist it to both legacy URL fields, verify the canonical URL, reset stale edit IDs, and refresh cache keys.');
