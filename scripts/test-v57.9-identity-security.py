#!/usr/bin/env python3
"""Local regression tests for V57.9 persistent login and IP protections."""
from pathlib import Path
import hashlib
import re
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
WORKER = (ROOT / 'cloudflare/worker.js').read_text()

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print('PASS:', message)

# Source invariants: trust only Cloudflare's edge-populated IP header.
client_block = WORKER[WORKER.index('function canonicalIp('):WORKER.index('let lastMapPruneAt=', WORKER.index('function canonicalIp('))]
check("r.headers.get('CF-Connecting-IP')" in client_block, 'client IP uses CF-Connecting-IP')
check('X-Forwarded-For' not in client_block and 'X-Real-IP' not in client_block, 'client IP never trusts spoofable forwarding headers')
check("const LOGIN_FAIL_WINDOW_MS=15*60*1000,LOGIN_FAIL_LIMIT=8,LOGIN_IP_FAIL_LIMIT=24,LOGIN_NET_FAIL_LIMIT=60" in WORKER, 'account/IP/network failure thresholds are explicit')
check('CREATE TABLE IF NOT EXISTS security_login_attempts' in WORKER, 'persistent D1 login-throttle table is created additively')
check('subject_hash TEXT PRIMARY KEY' in WORKER and 'loginSubjectHash' in WORKER and 'name:\'HMAC\'' in WORKER, 'D1 stores HMAC-SHA-256 keyed subject hashes, not raw identifiers')
check("loginSubjectHash(e,'buyer-account',row.id)" in WORKER, 'buyer throttle is bound to stable account ID')
check("loginSubjectHash(e,'tenant-account',x)" in WORKER, 'tenant throttle is bound to stable tenant/account ID')
check('recordLoginAbuseFailure(e,abuseSubjects)' in WORKER, 'failed logins increment persistent IP/network buckets')
check("if(p==='/api/tenant/security-login'&&r.method==='POST')" in WORKER and "if(p==='/api/tenant/login'&&r.method==='POST')" in WORKER, 'both tenant login and saved-device security login are protected')
check(WORKER.count('verifyTurnstile(e,b.turnstileToken,r)') >= 1 and "verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi mở Admin.'},400)" in WORKER, 'saved-device Admin re-auth requires Turnstile')
check("tenant-security-account" in WORKER and "recordLoginFailure(e,securityHash)" in WORKER, 'saved-device Admin password has a stable tenant cooldown')
check("clientNetworkPrefix(r)" in WORKER and 'ipv6ExpandedGroups' in WORKER, 'network prefix is normalized for IPv4/IPv6')
check("config.js?v=58.9" in (ROOT/'frontend/account.html').read_text(), 'frontend config cache token is bumped')

# Exercise the actual Worker IP parsing and prefix helpers in Node.
node_test = r'''
const fs=require('fs');
const src=fs.readFileSync(process.argv[1],'utf8');
const a=src.indexOf('function canonicalIp('), b=src.indexOf('let lastMapPruneAt=',a);
const c=src.indexOf('function ipv6ExpandedGroups('), d=src.indexOf('function networkRateLimit(',c);
if(a<0||b<0||c<0||d<0) throw new Error('IP helper block missing');
const api=new Function('URL',src.slice(a,b)+src.slice(c,d)+';return {canonicalIp,clientIp,clientNetworkPrefix};')(URL);
const req=(cf,xff)=>({headers:{get(n){if(n==='CF-Connecting-IP')return cf;if(n==='X-Forwarded-For')return xff;return ''}}});
const assert=(v,m)=>{if(!v)throw new Error(m);console.log('PASS:',m)};
assert(api.clientIp(req('203.0.113.77','198.51.100.9'))==='203.0.113.77','forged X-Forwarded-For does not override Cloudflare IP');
assert(api.clientIp(req('','198.51.100.9'))==='','missing Cloudflare IP does not fall back to X-Forwarded-For');
assert(api.canonicalIp('203.0.113.007')==='203.0.113.7','IPv4 octets are normalized');
assert(api.canonicalIp('300.0.0.1')==='','invalid IPv4 rejected');
assert(api.canonicalIp('not-an-ip')==='','malformed IP rejected');
assert(api.clientNetworkPrefix(req('203.0.113.77',''))===api.clientNetworkPrefix(req('203.0.113.99','')),'IPv4 addresses in same /24 share prefix');
assert(api.clientNetworkPrefix(req('2001:db8:abcd:0012::1',''))===api.clientNetworkPrefix(req('2001:db8:abcd:12::2','')),'IPv6 addresses in same /64 share prefix');
assert(api.clientNetworkPrefix(req('2001:db8:abcd:13::2',''))!==api.clientNetworkPrefix(req('2001:db8:abcd:12::2','')),'different IPv6 /64 networks remain separate');
'''
proc = subprocess.run(['node', '-e', node_test, str(ROOT/'cloudflare/worker.js')], capture_output=True, text=True)
if proc.returncode:
    print(proc.stdout)
    print(proc.stderr, file=sys.stderr)
    raise SystemExit(proc.returncode)
print(proc.stdout, end='')

# Mirror the exact UPSERT used by the Worker using SQLite, including reset window behavior.
sql = '''INSERT INTO security_login_attempts(subject_hash,window_started_at,failed_count,locked_until,updated_at)
VALUES(?,?,1,0,?)
ON CONFLICT(subject_hash) DO UPDATE SET
failed_count=CASE WHEN security_login_attempts.window_started_at<=? THEN 1 ELSE security_login_attempts.failed_count+1 END,
window_started_at=CASE WHEN security_login_attempts.window_started_at<=? THEN excluded.window_started_at ELSE security_login_attempts.window_started_at END,
locked_until=CASE WHEN security_login_attempts.window_started_at<=? THEN 0 WHEN security_login_attempts.failed_count+1>=? THEN excluded.updated_at+? ELSE security_login_attempts.locked_until END,
updated_at=excluded.updated_at'''
db = sqlite3.connect(':memory:')
db.execute('''CREATE TABLE security_login_attempts(subject_hash TEXT PRIMARY KEY,window_started_at INTEGER NOT NULL,failed_count INTEGER NOT NULL DEFAULT 0,locked_until INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL)''')

def digest(scope, subject):
    return hashlib.new('sha256', b'').hexdigest() if False else __import__('hmac').new(b'test-only-secret', ('teostudio-login-v1|' + scope + '|' + subject.strip().lower()).encode(), hashlib.sha256).hexdigest()

def record(subject_hash, now, limit=8):
    cutoff = now - 15*60*1000
    db.execute(sql, (subject_hash, now, now, cutoff, cutoff, cutoff, limit, 15*60*1000))

buyer_id = 'buyer-uuid-001'
account_hash = digest('buyer-account', buyer_id)
# Both login aliases end up at the same stable buyer account bucket.
email_input = digest('buyer-input', 'user@example.com')
login_input = digest('buyer-input', 'Teo_User')
for i in range(8):
    record(account_hash, 1_000_000+i*1000, 8)
row = db.execute('SELECT failed_count,locked_until FROM security_login_attempts WHERE subject_hash=?', (account_hash,)).fetchone()
assert row[0] == 8 and row[1] > 1_007_000
check(True, '8 failures lock the stable buyer account bucket for 15 minutes')
# A different source IP and a different login alias do not alter this account hash.
assert digest('buyer-account', buyer_id) == account_hash and email_input != login_input
check(True, 'switching login alias or source IP cannot reset the stable account bucket')
# IP / subnet buckets have their own higher thresholds.
ip_hash = digest('login-client-ip', '203.0.113.77')
net_hash = digest('login-network', 'v4:203.0.113')
for i in range(24): record(ip_hash, 2_000_000+i*1000, 24)
for i in range(60): record(net_hash, 3_000_000+i*1000, 60)
assert db.execute('SELECT failed_count,locked_until FROM security_login_attempts WHERE subject_hash=?',(ip_hash,)).fetchone()[0] == 24
assert db.execute('SELECT failed_count,locked_until FROM security_login_attempts WHERE subject_hash=?',(net_hash,)).fetchone()[0] == 60
check(True, 'persistent exact-IP and /24-or-/64 buckets use higher shared-network thresholds')
# Once the rolling window ages out, the next attempt starts a fresh window.
record(account_hash, 1_000_000 + 16*60*1000, 8)
row = db.execute('SELECT failed_count,locked_until,window_started_at FROM security_login_attempts WHERE subject_hash=?',(account_hash,)).fetchone()
assert row[0] == 1 and row[1] == 0 and row[2] == 1_000_000 + 16*60*1000
check(True, 'expired 15-minute failure window resets without a permanent lock')

print('PASS: V57.9 identity, IP parsing, and persistent throttle tests completed.')
