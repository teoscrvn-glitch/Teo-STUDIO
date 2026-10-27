import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const webRoot=path.join(root,'frontend');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())walk(f);else if(/\.(html?|css)$/i.test(entry.name))files.push(f)}}
walk(webRoot);
const misses=[];
function checkRef(file,raw,kind){let ref=String(raw||'').trim();if(!ref||ref.startsWith('#')||ref.startsWith('//')||/^(https?:|data:|blob:|javascript:|mailto:|tel:)/i.test(ref))return;ref=ref.split('#')[0].split('?')[0].trim();if(!ref||ref.includes('${')||ref.includes('<')||ref.includes('>'))return;let target;if(ref.startsWith('/'))target=path.join(webRoot,ref.replace(/^\/+/,''));else target=path.resolve(path.dirname(file),ref);if(!target.startsWith(webRoot+path.sep)&&target!==webRoot)return;if(!fs.existsSync(target)&&!path.extname(target)&&fs.existsSync(target+'.html'))return;if(!fs.existsSync(target))misses.push(`${path.relative(root,file)}: missing ${kind} ${raw}`)}
for(const file of files){const txt=fs.readFileSync(file,'utf8');if(/\.html?$/i.test(file)){for(const m of txt.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi))checkRef(file,m[1],m[0].split('=')[0].trim())}else{for(const m of txt.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi))checkRef(file,m[1],'CSS url')}}
if(misses.length){console.error(misses.join('\n'));process.exit(1)}
console.log(`PASS local static references: ${files.length} HTML/CSS files checked`);
