#!/usr/bin/env node
// Kiểm luật thiết kế TeoStudio. Dùng:  node scripts/check-design-rules.mjs frontend/assets/css [--strict]
// Không phụ thuộc thư viện. Thoát mã 1 nếu vi phạm luật CỨNG.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const dir = process.argv[2] || '.';
const strict = process.argv.includes('--strict');
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n === 'archive' || n.startsWith('.')) continue;
    // Generated detail bundle duplicates source CSS; lint its source files, not the compiled duplicate.
    if (n === 'detail-foundation.css') continue;
    const p = join(d, n); const s = statSync(p);
    s.isDirectory() ? walk(p) : extname(p) === '.css' && files.push(p);
  }
})(dir);

const rules = [
  { id: 'important',      hard: true,  re: /!important/g,                         msg: 'Cấm !important (dùng @layer)' },
  { id: 'transition-all', hard: true,  re: /transition\s*:\s*all\b/g,             msg: 'Cấm transition: all' },
  { id: 'big-blur',       hard: true,  re: /filter\s*:\s*blur\(\s*(?:[3-9]\d|\d{3,})px/g, msg: 'Cấm blur ≥ 30px' },
  { id: 'purple-pink',    hard: true,  re: /#(?:8b5cf6|a855f7|ec4899|7c3aed|9665f7|db68c7|8b7cff)\b/gi, msg: 'Cấm màu tím/hồng cũ' },
  { id: 'backdrop',       hard: false, re: /backdrop-filter\s*:/g,                msg: 'backdrop-filter: tối đa 1 chỗ/trang, tắt trên mobile' },
  { id: 'infinite',       hard: false, re: /animation[^;{}]*\binfinite\b/g,       msg: 'infinite: phải gắn data-live (chỉ chạy khi trong màn hình)' },
  { id: 'hex-color',      hard: false, re: /#[0-9a-f]{6}\b/gi,                    msg: 'Màu cứng: nên dùng var(--token)' },
];

let hardFail = 0; const totals = {};
for (const f of files) {
  const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); // bỏ comment
  const isTokens = /tokens\.css$/.test(f);
  for (const r of rules) {
    if (r.id === 'hex-color' && isTokens) continue;
    const n = (css.match(r.re) || []).length;
    if (!n) continue;
    totals[r.id] = (totals[r.id] || 0) + n;
    if (r.hard || strict) console.log(`${r.hard ? '✗' : '!'} ${f}: ${n} × ${r.msg}`);
  }
}
console.log('\n=== TỔNG ===');
for (const r of rules) { const n = totals[r.id] || 0; console.log(`${r.hard ? (n ? '✗' : '✓') : (n ? '!' : '✓')} ${r.id.padEnd(15)} ${n}`); if (r.hard && n) hardFail += n; }
console.log(`\nCSS files: ${files.length}`);
if (hardFail) { console.log(`FAIL — ${hardFail} vi phạm luật cứng`); process.exit(1); }
console.log('PASS');
