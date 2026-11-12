import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../cloudflare/worker.js', import.meta.url), 'utf8');
const start = source.indexOf('function assistantNormalize(');
const end = source.indexOf('function assistantShouldSearch(', start);
assert.ok(start >= 0 && end > start, 'AI retrieval helpers must exist');
let rows = [];
const clean = (v, n = 5000) => String(v ?? '').trim().slice(0, n);
const context = vm.createContext({
  clean,
  ensureAssistantKnowledgeSchema: async () => {},
  URL,
  AbortSignal,
  Response,
  safeHttpUrl: (v, n = 500) => { try { const u = new URL(String(v)); return ['https:'].includes(u.protocol) ? u.toString().slice(0, n) : ''; } catch { return ''; } },
  fetch: async (url, options) => {
    assert.match(String(url), /^https:\/\/api\.github\.com\/search\/repositories/);
    assert.equal(options.headers['user-agent'], 'TeoStudio-AI-Agent');
    return new Response(JSON.stringify({ items: [
      { full_name: 'cloudflare/agents', description: 'Persistent agents for Cloudflare Workers', html_url: 'https://github.com/cloudflare/agents', stargazers_count: 1000, language: 'TypeScript', license: { spdx_id: 'MIT' }, updated_at: '2026-11-01T00:00:00Z' },
      { full_name: 'bad/example', description: 'Bad URL', html_url: 'javascript:alert(1)', stargazers_count: 99 }
    ] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
});
vm.runInContext(source.slice(start, end), context);

assert.ok(Array.from(context.assistantTerms('AI UI UX JS API D1 R2')).includes('ai'), 'short technical term AI must be retained');
assert.ok(Array.from(context.assistantTerms('AI UI UX JS API D1 R2')).includes('ui'), 'short technical term UI must be retained');
assert.ok(Array.from(context.assistantTerms('AI UI UX JS API D1 R2')).includes('d1'), 'D1 must be retained');
assert.ok(Array.from(context.assistantExpandedTerms('lỗi đăng nhập tài khoản')).includes('auth'), 'Vietnamese query expansion must add auth terms');

const db = { prepare: () => ({ all: async () => ({ results: rows }) }) };
rows = [
  { id: '1', title: 'Cấu hình AI Agent', content: 'Thiết lập tool calling và API gateway', tags: 'AI, Agent, API, D1', source: 'Admin', updated_at: '2026-11-01' },
  { id: '2', title: 'Hướng dẫn nạp tiền', content: 'Tạo QR và theo dõi ví SePay', tags: 'nạp tiền, QR, ví', source: 'Admin', updated_at: '2026-11-02' },
  { id: '3', title: 'Thiết kế giao diện', content: 'CSS và responsive', tags: 'UI, UX', source: 'Admin', updated_at: '2026-11-03' }
];
const retrieved = await context.retrieveAssistantKnowledge({ DB: db }, 'AI Agent API');
assert.equal(retrieved[0].id, undefined, 'retrieval output must not expose internal database IDs');
assert.equal(retrieved[0].title, 'Cấu hình AI Agent', 'the most relevant knowledge title should rank first');
assert.ok(retrieved[0].score > 0, 'relevant knowledge must include a relevance score');
assert.equal((await context.retrieveAssistantKnowledge({ DB: db }, 'QR nạp tiền'))[0].title, 'Hướng dẫn nạp tiền');

const github = await context.searchAssistantGitHub('Cloudflare Agents');
assert.equal(github.ok, true);
assert.equal(github.items.length, 1, 'unsafe/non-HTTPS repository links must be filtered');
assert.equal(github.items[0].name, 'cloudflare/agents');
assert.equal(github.items[0].license, 'MIT');
console.log('PASS V58.12 AI brain: short technical tokens, Vietnamese query expansion, ranked D1 knowledge retrieval and safe GitHub repo search.');
