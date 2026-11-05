import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'frontend/assets/js/free-key.js'), 'utf8');
const now = Date.now();
const state = 'state-opaque-one-time';
const tenant = 'studio-demo';
const proof = 'a'.repeat(64);
const key = 'TEO-' + 'A'.repeat(20);
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {
    id, hidden: false, disabled: false, value: '', textContent: '', text: '', style: {}, dataset: {},
    parentElement: { hidden: false }, listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    focus() {}, select() {}
  });
  return nodes.get(id);
}
const session = new Map();
const local = new Map([[`TEO_FREE_BYPASS_PROOF:${tenant}`, proof],['TEO_TENANT_SESSION', 'tenant-session-secret']]);
const requestLog = [];
const context = {
  window: { TEO_CONFIG: { API_BASE_URL: 'https://teostudio.top' } },
  document: { querySelector: selector => node(selector) },
  location: { search: `?tenant=${tenant}&state=${state}&proof=${proof}&exp=${now + 300000}`, pathname: '/free-key.html' },
  URLSearchParams,
  AbortController,
  setTimeout,
  clearTimeout,
  history: { last: null, replaceState(_state, _title, url) { this.last = url; } },
  sessionStorage: { getItem: k => session.get(k) || null, removeItem: k => session.delete(k), setItem: (k,v) => session.set(k,v) },
  localStorage: { getItem: k => local.get(k) || null, removeItem: k => local.delete(k), setItem: (k,v) => local.set(k,v) },
  navigator: { clipboard: { writeText: async () => {} } },
  fetch: async (url, options) => {
    requestLog.push({ url, options });
    return { ok: true, json: async () => ({ ok: true, key, step: 2, provider: 'Link4M', expiresAt: now + 300000 }) };
  },
  Date,
  setInterval: () => 1,
  clearInterval: () => {},
  console
};
node('#createFreeKey').parentElement = node('#freeKeyCreateBox');
context.window.location = context.location;
vm.runInNewContext(source, context, { filename: 'free-key.js' });
await new Promise(resolve => setTimeout(resolve, 0));

if (requestLog.length !== 1) throw new Error(`Expected one automatic issue request, got ${requestLog.length}`);
const { url, options } = requestLog[0];
if (!url.endsWith('/api/rental/free/bypass/issue')) throw new Error(`Wrong issue endpoint: ${url}`);
if (options.method !== 'POST') throw new Error('Issue request must use POST');
if (!String(options.headers.authorization).includes('tenant-session-secret')) throw new Error('Tenant session token was not sent');
const body = JSON.parse(options.body);
if (body.state !== state || body.clientProof !== proof) throw new Error('Return state/proof did not match original attempt');
if (node('#freeKeyResult').hidden) throw new Error('Result box did not become visible after return');
if (node('#freeKeyValue').value !== key) throw new Error('Destination page did not display the returned key');
if (!node('#freeKeyCreateBox').hidden) throw new Error('Create-key action remained visible after automatic issue');
if (!String(node('#freeKeyProvider').textContent).includes('Link4M')) throw new Error('Provider step badge was not displayed');
if (context.history.last !== `/free-key.html`) throw new Error('Sensitive return state was not removed from the visible URL');
if (local.has(`TEO_FREE_BYPASS_PROOF:${tenant}`)) throw new Error('Browser proof was not cleared after issue');
console.log('PASS V57.13 destination-page behavior: valid redirect automatically calls Worker, binds tenant session/state/proof, shows one-time key and scrubs return parameters.');
