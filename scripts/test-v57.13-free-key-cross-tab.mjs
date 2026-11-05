import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'frontend/assets/js/free-key.js'),'utf8');
const now=Date.now(),state='state-cross-tab',tenant='studio-demo',proof='b'.repeat(64),key='TEO-'+'C'.repeat(20);
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:id==='#freeKeyResult',disabled:false,value:'',textContent:'',dataset:{},style:{},parentElement:{hidden:false},listeners:{},addEventListener(t,fn){this.listeners[t]=fn},focus(){},select(){}});return nodes.get(id)}
const session=new Map(); // A new tab has no sessionStorage state from the Admin tab.
const local=new Map([[`TEO_FREE_BYPASS_PROOF:${tenant}`,proof],['TEO_TENANT_SESSION','tenant-session-secret']]);
const requests=[];
const context={window:{TEO_CONFIG:{API_BASE_URL:'https://teostudio.top'}},document:{querySelector:node},location:{search:`?tenant=${tenant}&state=${state}&proof=${proof}&exp=${now+300000}`,pathname:'/free-key.html'},URLSearchParams,history:{last:null,replaceState(_s,_t,url){this.last=url}},sessionStorage:{getItem:k=>session.get(k)||null,removeItem:k=>session.delete(k),setItem:(k,v)=>session.set(k,v)},localStorage:{getItem:k=>local.get(k)||null,removeItem:k=>local.delete(k),setItem:(k,v)=>local.set(k,v)},navigator:{clipboard:{writeText:async()=>{}}},AbortController,setTimeout,clearTimeout,Date,setInterval:()=>1,clearInterval:()=>{},fetch:async(url,options)=>{requests.push({url,options});return{ok:true,json:async()=>({ok:true,key,step:2,provider:'Link4M',expiresAt:now+300000})}},console};
context.window.location=context.location;vm.runInNewContext(source,context,{filename:'free-key.js'});await new Promise(r=>setTimeout(r,0));
if(requests.length!==1)throw new Error(`Expected auto-issue on same-browser new tab, got ${requests.length}`);
if(!requests[0].url.endsWith('/api/rental/free/bypass/issue'))throw new Error('Wrong issue route');
const body=JSON.parse(requests[0].options.body);if(body.state!==state||body.clientProof!==proof)throw new Error('State/proof mismatch');
if(!String(requests[0].options.headers.authorization).includes('tenant-session-secret'))throw new Error('Same-browser tenant session not reused');
if(nodes.get('#freeKeyValue').value!==key||nodes.get('#freeKeyResult').hidden)throw new Error('Key result was not rendered');
if(context.history.last!=='/free-key.html')throw new Error('Sensitive query params were not removed immediately');
if(local.has('TEO_FREE_BYPASS_ACTIVE_RETURN'))throw new Error('Pending return state was not removed after issue');
if(local.has(`TEO_FREE_BYPASS_PROOF:${tenant}`))throw new Error('Local one-time proof was not cleared after issue');
console.log('PASS V57.13 cross-tab return: same-browser localStorage proof + tenant session issues one key; URL query is scrubbed.');
