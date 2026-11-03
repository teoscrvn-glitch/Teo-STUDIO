import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../cloudflare/worker.js', import.meta.url), 'utf8');
const start = source.indexOf('function md5hex(');
const end = source.indexOf('\nfunction toB64', start);
if (start < 0 || end < 0) throw new Error('MD5 helper not found');
const sandbox = { TextEncoder };
vm.runInNewContext(source.slice(start, end) + '\nthis.__md5=md5hex;', sandbox);
const md5 = sandbox.__md5;
for (const [input, expected] of [
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
]) if (md5(input) !== expected) throw new Error(`MD5 vector failed: ${input}`);
console.log('PASS V56.67 MD5 callback/request signature vectors.');
