import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../cloudflare/worker.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('function assistantToolDefinitions('), source.indexOf('async function executeAssistantTool('));
assert.ok(block.includes('function assistantToolDefinitions('), 'assistant tool registry must exist');
const sandbox = vm.createContext({ clean: (v, n = 5000) => String(v ?? '').trim().slice(0, n) });
vm.runInContext(block, sandbox);

const names = (defs) => Array.from(defs, x => x.function.name);
const baseline = names(sandbox.assistantToolDefinitions({}));
assert.deepEqual(baseline, ['search_teostudio_files', 'search_teostudio_knowledge', 'search_github_repositories', 'open_teostudio_page']);
assert.ok(!baseline.some(x => /wallet|orders|studios|stats|withdraw|purchase|delete|update/i.test(x)), 'private and mutation tools must not be exposed by default');

const buyerTools = names(sandbox.assistantToolDefinitions({ buyer: { id: 'buyer-1' }, aiPersonalizationAllowed: true, webSearchConfigured: true }));
for (const required of ['get_my_wallet', 'get_my_orders', 'get_my_studios', 'search_web']) assert.ok(buyerTools.includes(required), `missing conditional tool ${required}`);

const tenantTools = names(sandbox.assistantToolDefinitions({ tenant: { id: 'tenant-1' }, authenticatedTenantAdmin: true }));
assert.ok(tenantTools.includes('get_current_studio_overview'), 'studio statistics must require authenticated tenant admin context');

for (const tool of sandbox.assistantToolDefinitions({})) {
  assert.equal(tool.type, 'function');
  assert.equal(tool.function.parameters.additionalProperties, false, `${tool.function.name} must reject extra arguments`);
}

const parseStart = source.indexOf('function parseAssistantToolArgs(');
const outputStart = source.indexOf('function assistantToolOutput(', parseStart);
const outputEnd = source.indexOf('async function executeAssistantTool(', outputStart);
vm.runInContext(source.slice(parseStart, outputEnd), sandbox);
assert.deepEqual({ ...sandbox.parseAssistantToolArgs('{"query":"file"}') }, { query: 'file' });
assert.deepEqual({ ...sandbox.parseAssistantToolArgs('[1,2]') }, {});
assert.deepEqual({ ...sandbox.parseAssistantToolArgs('not-json') }, {});
assert.deepEqual({ ...sandbox.parseAssistantToolArgs('x'.repeat(4001)) }, {});
assert.ok(sandbox.assistantToolOutput({ ok: true, value: 'x'.repeat(6000) }, 200).length <= 200);

const execStart = source.indexOf('async function executeAssistantTool(');
const execEnd = source.indexOf('async function callAICompletion(', execStart);
const execSource = source.slice(execStart, execEnd);
assert.ok(execSource.includes("if(name==='get_my_wallet')") && execSource.includes('!access.aiPersonalizationAllowed'), 'private wallet tool must require explicit AI personalization');
assert.ok(execSource.includes("if(name==='get_my_orders')") && execSource.includes('!access.aiPersonalizationAllowed'), 'orders tool must require explicit AI personalization');
assert.ok(execSource.includes("if(name==='get_current_studio_overview')") && execSource.includes('!access.authenticatedTenantAdmin'), 'tenant statistics must require an authenticated Studio admin');
assert.ok(execSource.includes("if(name==='open_teostudio_page')") && execSource.includes('PAGE_NOT_ALLOWED'), 'navigation must be allowlisted');
assert.ok(execSource.includes("return {ok:false,error:'TOOL_NOT_ALLOWED'}"), 'unknown tools must be rejected');

const chat = source.slice(source.indexOf('async function assistantChat('), source.indexOf('async function assistantAgent('));
assert.ok(chat.includes('for(let round=0;round<2;round++)'), 'agent loop must be bounded');
assert.ok(chat.includes('result.toolCalls.slice(0,3)'), 'tool calls per round must be capped');
assert.ok(chat.includes("role:'tool'"), 'tool results must be returned to the model');
assert.ok(chat.includes('assistantToolDefinitions(access)'), 'chat must use permission-scoped tools');
assert.ok(source.includes('tool_choice:\'auto\''), 'OpenAI-compatible function calling must use auto tool choice');
assert.ok(source.includes('dispatch(false)'), 'providers without tool calling must fall back to ordinary chat');



// Exercise the completion adapter with an OpenAI-compatible mock, including unsupported-tools fallback.
const clean = (v, n = 5000) => String(v ?? '').trim().slice(0, n);
const providerStart = source.indexOf('function aiProviderErrorMessage(');
const toolStart = source.indexOf('function parseAssistantToolArgs(');
const completionStart = source.indexOf('async function callAICompletion(');
const redactStart = source.indexOf('function redactAssistantSecrets(');
let mockedResponses = [];
let sentBodies = [];
const providerContext = vm.createContext({
  URL,
  AbortSignal,
  Response,
  clean,
  runtimeConfigStatus: () => ({ ai: { ready: true, missing: [] } }),
  fetch: async (_url, options) => {
    sentBodies.push(JSON.parse(options.body));
    const next = mockedResponses.shift();
    return new Response(next.body, { status: next.status, headers: { 'content-type': 'application/json' } });
  },
});
vm.runInContext(source.slice(providerStart, source.indexOf('function assistantToolDefinitions(')) + source.slice(toolStart, source.indexOf('function assistantToolOutput(')) + source.slice(completionStart, redactStart), providerContext);

mockedResponses = [{ status: 200, body: JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'search_teostudio_files', arguments: '{"query":"Mika"}' } }] } }] }) }];
sentBodies = [];
const toolResponse = await providerContext.callAICompletion({ AI_API_URL: 'https://openrouter.ai/api/v1/chat/completions', AI_API_KEY: 'test-key', AI_MODEL: 'openrouter/free' }, [{ role: 'user', content: 'Tìm Mika' }], { tools: baseline });
assert.equal(toolResponse.ok, true);
assert.equal(toolResponse.usedTools, true);
assert.equal(toolResponse.toolCalls[0].name, 'search_teostudio_files');
assert.deepEqual({ ...toolResponse.toolCalls[0].arguments }, { query: 'Mika' });
assert.equal(sentBodies[0].tool_choice, 'auto');

mockedResponses = [
  { status: 404, body: JSON.stringify({ error: { message: 'No endpoints found that support tool use for this model' } }) },
  { status: 200, body: JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Téo vẫn có thể trò chuyện.' } }] }) },
];
sentBodies = [];
const fallbackResponse = await providerContext.callAICompletion({ AI_API_URL: 'https://example.ai/v1/chat/completions', AI_API_KEY: 'test-key', AI_MODEL: 'chat-model' }, [{ role: 'user', content: 'Xin chào' }], { tools: baseline });
assert.equal(fallbackResponse.ok, true);
assert.equal(fallbackResponse.usedTools, false);
assert.equal(fallbackResponse.reply, 'Téo vẫn có thể trò chuyện.');
assert.ok(Array.isArray(sentBodies[0].tools), 'first provider request must include tools');
assert.equal(Object.hasOwn(sentBodies[1], 'tools'), false, 'fallback request must omit unsupported tools');

// Verify that sensitive tools fail closed before touching the database when consent/role is missing.
const executionStart = source.indexOf('async function executeAssistantTool(');
const executionEnd = source.indexOf('async function callAICompletion(', executionStart);
const executionContext = vm.createContext({
  clean,
  parseAssistantToolArgs: providerContext.parseAssistantToolArgs,
  PUBLIC_ORIGIN: 'https://teostudio.top',
});
vm.runInContext(source.slice(executionStart, executionEnd), executionContext);
assert.equal((await executionContext.executeAssistantTool({}, 'get_my_wallet', {}, { buyer: { id: 'b1' }, aiPersonalizationAllowed: false })).error, 'AI_PERSONALIZATION_DISABLED');
assert.equal((await executionContext.executeAssistantTool({}, 'get_my_orders', {}, { buyer: { id: 'b1' }, aiPersonalizationAllowed: false })).error, 'AI_PERSONALIZATION_DISABLED');
assert.equal((await executionContext.executeAssistantTool({}, 'get_current_studio_overview', {}, { tenant: { id: 't1' }, authenticatedTenantAdmin: false })).error, 'TENANT_ADMIN_REQUIRED');
assert.equal((await executionContext.executeAssistantTool({}, 'delete_product', {}, {})).error, 'TOOL_NOT_ALLOWED');
assert.equal((await executionContext.executeAssistantTool({}, 'open_teostudio_page', { page: 'https://evil.example' }, {})).error, 'PAGE_NOT_ALLOWED');

console.log('PASS AI tools: scoped registry, opt-in gates, mocked OpenAI tool-call parsing, 404 chat fallback, tenant isolation and allowlisted navigation.');
