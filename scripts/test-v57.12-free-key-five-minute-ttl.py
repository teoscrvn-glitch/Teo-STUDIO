from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
w = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
ui = (ROOT / 'frontend/assets/js/free-key.js').read_text(encoding='utf-8')
page = (ROOT / 'frontend/free-key.html').read_text(encoding='utf-8')
config = (ROOT / 'frontend/assets/js/config.js').read_text(encoding='utf-8')

checks = [
    ("BUILD_VERSION='v57.12-link4m-destination-key-page'" in w, 'Worker build version bumped'),
    ("expires=now+5*60*1000,sessionHash=await sha256(sessionToken)" in w, 'new return-link state expires after five minutes'),
    ('&proof=${encodeURIComponent(clientProof)}&exp=${expires}' in w, 'return page receives the server expiry timestamp for its visible countdown'),
    ("SET status='key_issued',key_issued_at=?,expires_at=? WHERE id=? AND status='pending' AND expires_at>?" in w, 'issuing a key consumes the state atomically and aligns its expiry to the key expiry'),
    ('keyExpires=now+5*60*1000' in w, 'issued key receives its own five-minute validity window'),
    ('used_at IS NULL AND expires_at>?' in w, 'redemption rejects used or expired key rows'),
    ("status='key_issued'" in w and 'BYPASS_KEY_ALREADY_ISSUED' in w and 'attempt_id TEXT NOT NULL UNIQUE' in w, 'the same state cannot issue a second key'),
    ("linkExpiresAt=Number(q.get('exp')||0)" in ui and 'expireReturnLink()' in ui, 'return page displays the server-provided remaining link time'),
    ('cleanReturnUrl()' in ui and 'stateInvalidated=true' in ui, 'expired/consumed return URL is scrubbed and its create action disabled'),
    ('đồng hồ 5 phút vẫn tiếp tục chạy' in ui, 'key timer remains visible after copy'),
    ('issueKey()' in ui and 'else if(expireReturnLink()){issueKey()}' in ui, 'valid return page automatically issues the key'),
    ('v57.12-link4m-destination-key-page' in config and 'v57.12-link4m-destination-key-page' in page, 'front-end cache version is updated'),
]
failed = []
for ok, label in checks:
    print(('PASS' if ok else 'FAIL') + ': ' + label)
    if not ok:
        failed.append(label)
if failed:
    raise SystemExit('Failed checks: ' + ', '.join(failed))

# Simulate the two separate server-side windows and single-use state claim.
now = 1_800_000_000_000
five_minutes = 5 * 60 * 1000
db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE attempts (
 id TEXT PRIMARY KEY, status TEXT NOT NULL, expires_at INTEGER NOT NULL,
 key_issued_at INTEGER DEFAULT NULL
);
CREATE TABLE keys (
 id TEXT PRIMARY KEY, attempt_id TEXT UNIQUE, expires_at INTEGER NOT NULL,
 used_at INTEGER DEFAULT NULL
);
''')

# Link state is valid for five minutes from creation.
db.execute("INSERT INTO attempts(id,status,expires_at) VALUES('a1','pending',?)", (now + five_minutes,))
assert db.execute("SELECT count(*) FROM attempts WHERE id='a1' AND status='pending' AND expires_at>?", (now + five_minutes + 1,)).fetchone()[0] == 0
assert db.execute("SELECT count(*) FROM attempts WHERE id='a1' AND status='pending' AND expires_at>?", (now + five_minutes - 1,)).fetchone()[0] == 1

# The first key issue claims the state once and starts a fresh five-minute key window.
issued_at = now + 60_000
key_expiry = issued_at + five_minutes
with db:
    cur = db.execute("UPDATE attempts SET status='key_issued',key_issued_at=?,expires_at=? WHERE id='a1' AND status='pending' AND expires_at>?", (issued_at, key_expiry, issued_at))
    assert cur.rowcount == 1
    db.execute("INSERT INTO keys(id,attempt_id,expires_at) SELECT 'k1','a1',? WHERE EXISTS(SELECT 1 FROM attempts WHERE id='a1' AND status='key_issued' AND key_issued_at=? AND expires_at=?)", (key_expiry, issued_at, key_expiry))
assert db.execute("SELECT count(*) FROM keys WHERE attempt_id='a1'").fetchone()[0] == 1
# A second claim cannot change the consumed state or add another key.
with db:
    cur = db.execute("UPDATE attempts SET status='key_issued',key_issued_at=?,expires_at=? WHERE id='a1' AND status='pending' AND expires_at>?", (issued_at, key_expiry, issued_at))
    assert cur.rowcount == 0, 'A consumed return state must never issue a second key.'
assert db.execute("SELECT count(*) FROM keys WHERE id='k1' AND used_at IS NULL AND expires_at>?", (key_expiry - 1,)).fetchone()[0] == 1
assert db.execute("SELECT count(*) FROM keys WHERE id='k1' AND used_at IS NULL AND expires_at>?", (key_expiry,)).fetchone()[0] == 0
cur = db.execute("UPDATE keys SET used_at=? WHERE id='k1' AND used_at IS NULL AND expires_at>?", (key_expiry - 1, key_expiry - 1))
assert cur.rowcount == 1
cur = db.execute("UPDATE keys SET used_at=? WHERE id='k1' AND used_at IS NULL AND expires_at>?", (key_expiry - 1, key_expiry - 1))
assert cur.rowcount == 0, 'A redeemed key must not be redeemed twice.'

print('PASS: local SQLite simulation confirms separate five-minute link/key windows and one-time state/key claims.')
print('NOTE: this is a static/local SQL simulation; it does not exercise a live Cloudflare Worker or production D1 database.')
