import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const dir = path.join(root, 'frontend');
const files = [];
function walk(p) { for (const ent of fs.readdirSync(p, {withFileTypes:true})) { const f=path.join(p,ent.name); if(ent.isDirectory()) walk(f); else if(/\.html?$/i.test(f)) files.push(f); } }
walk(dir);
let failures=0,checked=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi; let match,idx=0;
  while((match=re.exec(html))){idx++;const attrs=match[1]||'',code=match[2]||'';
    if(/\bsrc\s*=/i.test(attrs)||!code.trim()) continue;
    const type=(attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)||[])[1]||'';
    if(type && !/^(text|application)\/javascript|module$/i.test(type) && !/javascript|module/i.test(type)) continue;
    checked++; const tmp=path.join(os.tmpdir(),`teo-inline-${process.pid}-${checked}.cjs`);fs.writeFileSync(tmp,code);
    const r=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});try{fs.unlinkSync(tmp)}catch{}
    if(r.status!==0){failures++;console.error(`FAIL inline JS: ${path.relative(root,file)} script #${idx}\n${r.stderr||r.stdout}`)}
  }
}
console.log(`Inline scripts checked: ${checked}; failures: ${failures}`);
process.exitCode=failures?1:0;
