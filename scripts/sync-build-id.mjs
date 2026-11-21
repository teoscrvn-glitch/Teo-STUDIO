import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const buildId=fs.readFileSync(path.join(root,'VERSION.txt'),'utf8').trim();
if(!/^v\d+\.\d+[a-z0-9.-]*$/i.test(buildId)) throw new Error('Invalid VERSION.txt build id');
const cacheId=buildId.match(/^v(\d+\.\d+)/i)?.[1];
if(!cacheId) throw new Error('Build id must start with vMAJOR.MINOR');
const workerPath=path.join(root,'cloudflare/worker.js');
const configPath=path.join(root,'frontend/assets/js/config.js');
function syncFile(file,transform){const before=fs.readFileSync(file,'utf8');const after=transform(before);if(process.argv.includes('--check')){if(before!==after){console.error('BUILD_ID mismatch:',path.relative(root,file));process.exitCode=1}}else if(before!==after)fs.writeFileSync(file,after)}
syncFile(workerPath,s=>s.replace(/const BUILD_VERSION='[^']*';/,`const BUILD_VERSION='${buildId}';`));
syncFile(configPath,s=>s.replace(/BUILD_VERSION:'[^']*'/,`BUILD_VERSION:'${buildId}'`));
const front=path.join(root,'frontend');
for(const name of fs.readdirSync(front)){if(!name.endsWith('.html'))continue;const file=path.join(front,name);syncFile(file,s=>{
  s=s.replace(/(<meta name="teo-(?:experience|visual|frontend)-version" content=")[^"]*(")/g,`$1${buildId}$2`);
  // Local CSS/JS query strings share one cache identity for this build.
  s=s.replace(/((?:href|src)=["'](?:\/|\.\/)?(?:assets\/)[^"']+\.(?:css|js))\?v=[^"']*(["'])/gi,`$1?v=${cacheId}$2`);
  return s;
});}
if(process.argv.includes('--check')&&process.exitCode){console.error('Run: node scripts/sync-build-id.mjs');}
else if(!process.argv.includes('--check'))console.log(`Synchronized ${buildId} / asset cache ${cacheId}`);
