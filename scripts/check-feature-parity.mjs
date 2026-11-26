#!/usr/bin/env node
// Dùng:  node check-feature-parity.mjs <thư-mục-frontend> --baseline   (lưu mốc từ bản CŨ)
//        node check-feature-parity.mjs <thư-mục-frontend>              (so bản MỚI với mốc; thoát 1 nếu mất chức năng)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2] || 'frontend', base = process.argv.includes('--baseline');
const BASE = new URL('./feature-baseline.json', import.meta.url).pathname;
const htmls = readdirSync(dir).filter(f => f.endsWith('.html'));
const read = p => existsSync(p) ? readFileSync(p, 'utf8') : '';
const snap = {};
for (const f of htmls) {
  const h = read(join(dir, f));
  const scripts = [...h.matchAll(/<script[^>]*\ssrc="\/?([^"?]+)/g)].map(m => m[1]);
  const js = scripts.map(s => read(join(dir, s.replace(/^frontend\//, '')))).join('\n') + [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const htmlIds = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const jsRefs = new Set([...js.matchAll(/(?:\$\(\s*['"]#|getElementById\(\s*['"]|querySelector\(\s*['"]#)([A-Za-z0-9_-]+)/g)].map(m => m[1]));
  const dyn = js.match(/id=\\?["']([A-Za-z0-9_-]+)/g) || [];           // id tạo bằng JS
  const dynIds = new Set(dyn.map(x => x.replace(/^id=\\?["']/, '')));
  const must = [...jsRefs].filter(i => htmlIds.has(i) || dynIds.has(i));      // id mà JS thật sự dùng
  snap[f] = {
    ids: must.sort(),
    forms: [...h.matchAll(/<form[^>]*\sid="([^"]+)"/g)].map(m => m[1]).sort(),
    fields: [...new Set([...h.matchAll(/<(?:input|select|textarea)[^>]*\sname="([^"]+)"/g)].map(m => m[1]))].sort(),
    handlers: [...new Set([...h.matchAll(/onclick="([A-Za-z0-9_.$]+)\(/g)].map(m => m[1]))].sort(),
    scripts: scripts.filter(s => !/^assets\/(css)/.test(s)).sort(),
  };
}
if (base) { writeFileSync(BASE, JSON.stringify(snap, null, 1)); console.log('Đã lưu mốc:', htmls.length, 'trang'); process.exit(0); }
const old = JSON.parse(read(BASE)); let miss = 0;
for (const [f, o] of Object.entries(old)) {
  const n = snap[f]; if (!n) { console.log(`✗ MẤT TRANG ${f}`); miss++; continue; }
  for (const k of ['ids', 'forms', 'fields', 'handlers']) {
    const lost = o[k].filter(x => !n[k].includes(x));
    if (lost.length) { miss += lost.length; console.log(`✗ ${f} mất ${k}: ${lost.join(', ')}`); }
  }
}
console.log(miss ? `FAIL — mất ${miss} mục chức năng` : 'PASS — đủ chức năng so với mốc');
process.exit(miss ? 1 : 0);
