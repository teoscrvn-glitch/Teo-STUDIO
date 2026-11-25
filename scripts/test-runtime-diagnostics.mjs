import fs from 'node:fs';
const worker=fs.readFileSync(new URL('../cloudflare/worker.js',import.meta.url),'utf8');
const checks=[
  ['health endpoint performs a real D1 SELECT 1 probe',/if\(p==='\/api\/health'\)[\s\S]*?SELECT 1 AS ok/.test(worker)],
  ['health endpoint reports required core tables without exposing rows',/requiredTables\[name\]=found\.has\(name\)/.test(worker)],
  ['health endpoint distinguishes missing D1 binding',/D1_BINDING_MISSING/.test(worker)],
  ['health endpoint distinguishes failed D1 query',/D1_QUERY_FAILED/.test(worker)],
  ['uncaught Worker errors include request ID, route, method and stack in server logs',/\[worker-request-error\][\s\S]*?requestId[\s\S]*?stack/.test(worker)],
  ['public error response does not disclose internal exception details',/error:'SERVER_ERROR',requestId,message:'Máy chủ gặp lỗi/.test(worker)],
];
for(const [label,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${label}`);
if(checks.some(([,ok])=>!ok))process.exit(1);
