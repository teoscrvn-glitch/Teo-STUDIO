import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const worker = fs.readFileSync(new URL('../cloudflare/worker.js', import.meta.url), 'utf8');
const lineFunction = (name) => {
  const line = worker.split('\n').find((x) => x.startsWith(`function ${name}(`));
  assert.ok(line, `missing worker helper ${name}`);
  return line;
};
const context = vm.createContext({
  URL,
  clean: (value, max = 5000) => String(value ?? '').trim().slice(0, max),
});
vm.runInContext([
  lineFunction('safeYouTubeUrl'),
  lineFunction('redactAssistantSecrets'),
  lineFunction('safeAssistantHistory'),
].join('\n'), context);

const yt = context.safeYouTubeUrl;
assert.equal(yt('https://www.youtube.com/watch?v=abcDEF_1234'), 'https://www.youtube.com/watch?v=abcDEF_1234');
assert.equal(yt('https://youtu.be/abcDEF_1234?t=42'), 'https://www.youtube.com/watch?v=abcDEF_1234');
assert.equal(yt('https://youtube.com/shorts/abcDEF_1234'), 'https://www.youtube.com/watch?v=abcDEF_1234');
assert.equal(yt('http://youtube.com/watch?v=abcDEF_1234'), '');
assert.equal(yt('https://youtube.com.attacker.example/watch?v=abcDEF_1234'), '');
assert.equal(yt('javascript:alert(1)'), '');

const apiKey = 'AIza' + 'X'.repeat(28);
const history = [
  { role: 'system', content: 'must be discarded' },
  ...Array.from({ length: 18 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i).repeat(1000) })),
  { role: 'user', content: `password=private123 ${apiKey}` },
];
const safe = context.safeAssistantHistory(history);
assert.ok(safe.length <= 16 && safe.length > 0, 'history must be bounded');
assert.ok(safe.every((x) => ['user', 'assistant'].includes(x.role)), 'only user/assistant roles are accepted');
assert.ok(!safe.some((x) => x.content.includes('must be discarded')), 'system role must be discarded');
assert.ok(!safe.some((x) => x.content.includes(apiKey)), 'API key pattern must be redacted');
assert.ok(safe.some((x) => x.content.includes('[đã ẩn]')), 'credential labels must be redacted');
assert.equal(safe.at(-1).role, 'user', 'latest user context should remain last');
console.log('PASS AI guardrails: YouTube allowlist, secret redaction, role filtering and recent-history bounds.');
