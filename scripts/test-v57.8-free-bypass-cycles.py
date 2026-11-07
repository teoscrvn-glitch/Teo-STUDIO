from pathlib import Path
from datetime import datetime, timezone, timedelta
import sqlite3
import re

ROOT = Path(__file__).resolve().parents[1]
w = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
t = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')
k = (ROOT / 'frontend/assets/js/free-key.js').read_text(encoding='utf-8')
page = (ROOT / 'frontend/free-key.html').read_text(encoding='utf-8')
config = (ROOT / 'frontend/assets/js/config.js').read_text(encoding='utf-8')
admin_page = (ROOT / 'frontend/tenant-admin.html').read_text(encoding='utf-8')
a = (ROOT / 'frontend/assets/js/account.js').read_text(encoding='utf-8')
topup = (ROOT / 'frontend/topup.html').read_text(encoding='utf-8')
wrangler = (ROOT / 'cloudflare/wrangler.toml').read_text(encoding='utf-8')

# Build/version and server-side migration.
assert "BUILD_VERSION='v58.0-mobile-studio-notes'" in w
assert "BUILD_VERSION:'v58.0-mobile-studio-notes'" in config
assert 'v58.0-mobile-studio-notes' in page and 'v58.0-mobile-studio-notes' in admin_page
assert "'free_bypass_cycle_1_at','INTEGER DEFAULT NULL'" in w
assert "'free_bypass_cycle_2_at','INTEGER DEFAULT NULL'" in w
assert "'client_proof_hash','TEXT DEFAULT NULL'" in w
assert 'function freeBypassCycleState' in w and 'completedLast24h' in w

# Cycle sequencing: one BumX key, then one Link4M key; no 24-hour delay between them.
assert "provider=step===1?'bumx':'link4m'" in w
assert "progress=Math.max(0,Math.min(1,Number(t.free_bypass_count||0)))" in w
assert "if(step===2&&!Number(t.free_bypass_last_at||0))" in w
assert 'Bây giờ tiếp tục Link4M lượt 2/2' in w
assert "addedDays:7" in w and 'expiresAt:isoSqlDate(newExpiry)' in w
assert 'Math.max(now,Number.isFinite(expiryMs)?expiryMs:now)+7*86400000' in w

# Server-enforced state/session/tenant binding and one-time key constraints.
assert "status='pending' AND expires_at>? LIMIT 1" in w
assert "sha256(returnSession)!==String(attempt.session_hash||'')" in w
assert 'tenantFromFreeBypassSession(r,e,requestedTenant)' in w
assert "String(sessionTenant.id)!==String(attempt.tenant_id)" in w
assert "status='key_issued'" in w and 'BYPASS_KEY_ALREADY_ISSUED' in w
assert 'expires=now+5*60*1000,sessionHash=await sha256(sessionToken)' in w
assert 'keyExpires=now+5*60*1000' in w
assert "status='key_issued',key_issued_at=?,expires_at=?" in w
assert 'BYPASS_CLIENT_PROOF_REQUIRED' in w and 'BYPASS_CLIENT_PROOF_MISMATCH' in w
assert 'client_proof_hash' in w and '&proof=${encodeURIComponent(clientProof)}' in w
assert 'sessionStorage.getItem(proofKey)' in k and 'sessionStorage.removeItem(proofKey)' in k
assert "linkExpiresAt=Number(pending?.exp||0)" in k and 'function expireReturnLink()' in k
assert 'cleanReturnUrl()' in k and 'nhập trong 5 phút' in k
assert 'BYPASS_SESSION_MISMATCH' in w and 'BYPASS_TENANT_SESSION_MISMATCH' in w
assert 'history.replaceState' in k and 'cleanReturnUrl()' in k
assert "if(!state||!tenant||!clientProof||!linkExpiresAt){" in k and 'create.disabled=!retry' in k
assert "attempt.status!=='key_issued'" in w
assert 'used_at IS NULL AND expires_at>?' in w

# Two completed provider pairs in a rolling 24-hour window; block the third until the oldest expires.
assert "quota.completedLast24h>=2" in w
assert 'FREE_BYPASS_DAILY_LIMIT' in w
assert 'freeBypassCyclesLast24h' in w and 'freeBypassNextAllowedAt' in w
assert 'freeEarnStart' in t and 'freeBypassEarnPanel' in t
assert 'makeFreeBypassProof()' in t and 'function persistFreeBypassProof' in t and 'sessionStorage.setItem(k,proof)' in t
assert 'Có thể hoàn tất tối đa 2 chu kỳ trong 24 giờ' in t
assert 'Mỗi chu kỳ hoàn thành <b>BumX → Link4M</b> được cộng thêm 7 ngày' in t
assert 'MÃ NHẬN 7 NGÀY FREE' in page and 'BumX' in t and 'Link4M' in t and 'Tối đa 2 chu kỳ trong 24 giờ' in t

# The shortener APIs in this project do not return a cryptographically verifiable ad-completion callback.
# The build must disclose that limitation rather than claim independent proof of a completed view.
assert 'callback' in w or 'callback' in t
assert 'adCompletionVerified:false' in w and 'completionVerified:false' in w
assert 'LINK4M_REWARDED_TRAFFIC_APPROVED' not in w
assert "if(provider==='link4m'&&!cfg.link4mApproved)" not in w
assert "if(step===2&&!bypassProviderConfig(e).link4mApproved)" not in w
assert "destinationPage:'/free-key.html'" in w
assert 'auto-claim' in k or 'issueKey()' in k

# Preserve the existing independent card top-up flow and guardian acknowledgement.
assert '(?:account|topup)' in a and 'isTopupPage()' in a
assert "location.href='/topup.html?method=card'" in a
assert 'name="guardianConsent" required' in a
assert 'd.guardianConsent=e.target.elements.guardianConsent.checked===true' in a
assert 'b.guardianConsent!==true' in w
assert 'THECAOSIEUTOC_PARTNER_ID' in w and 'THECAOSIEUTOC_PARTNER_KEY' in w
assert 'teo-account-page-mode' in topup and 'assets/js/account.js?v=57.8' in topup
assert 'CARD_ALREADY_SUBMITTED' in w and 'CARD_PROVIDER_REJECTED' in w
assert '(?:start|issue|redeem|complete)' in w
assert 'crons = ["0 * * * *", "*/5 * * * *"]' in wrangler
assert 'purgeExpiredBypassArtifacts(e)' in w and "controller?.cron||''" in w

# Exercise the exact SQL used to award a completed cycle, including rolling quota and expiry accumulation.
marker = ':e.DB.prepare(`UPDATE tenant_accounts SET\n      free_bypass_count=0'
start = w.index(marker) + len(':e.DB.prepare(`')
end = w.index('`).bind(', start)
sql = w[start:end].replace('${accountKey}', 'id')
assert sql.count('?') == 17, f'Unexpected D1 bind count: {sql.count("?")}'

db = sqlite3.connect(':memory:')
db.executescript("""
CREATE TABLE tenant_accounts(
 id TEXT PRIMARY KEY, plan_type TEXT, free_bypass_count INTEGER,
 free_bypass_last_at INTEGER, free_admin_unlocked INTEGER,
 free_bypass_cycle_1_at INTEGER, free_bypass_cycle_2_at INTEGER,
 expires_at TEXT, starts_at TEXT, locked INTEGER DEFAULT 0, deleted_at TEXT
);
CREATE TABLE free_bypass_keys(id TEXT PRIMARY KEY, redemption_id TEXT, used_at TEXT);
INSERT INTO tenant_accounts VALUES('tenant-1','free',1,1700000000000,1,NULL,NULL,'2026-11-05 00:00:00','2026-11-01 00:00:00',0,NULL);
""")
DAY = 86_400_000
base = 1_800_000_000_000
expiry = datetime.fromtimestamp(base / 1000, timezone.utc).replace(tzinfo=None)
initial_expiry = expiry.strftime('%Y-%m-%d %H:%M:%S')
db.execute('UPDATE tenant_accounts SET expires_at=? WHERE id=?', (initial_expiry, 'tenant-1'))

def redeem_cycle(now, key_id):
    cutoff = now - DAY
    old_expiry_text = db.execute('SELECT expires_at FROM tenant_accounts WHERE id=?', ('tenant-1',)).fetchone()[0]
    old_expiry = datetime.strptime(old_expiry_text, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc).timestamp() * 1000
    new_expiry_dt = datetime.fromtimestamp((max(now, old_expiry) + 7 * DAY) / 1000, timezone.utc).replace(tzinfo=None)
    new_expiry = new_expiry_dt.strftime('%Y-%m-%d %H:%M:%S')
    used_at = datetime.fromtimestamp(now / 1000, timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    redemption_id = 'redeem-' + key_id
    db.execute('INSERT INTO free_bypass_keys VALUES(?,?,?)', (key_id, redemption_id, used_at))
    binds = (
        now, cutoff, cutoff, now,
        cutoff, cutoff, now, cutoff, now,
        new_expiry, used_at, 'tenant-1', cutoff, cutoff,
        key_id, redemption_id, used_at
    )
    cur = db.execute(sql, binds)
    db.commit()
    return cur.rowcount, new_expiry

# First full pair: +7 days, counter slot one.
rows, exp1 = redeem_cycle(base, 'key-1')
assert rows == 1
c1, c2, count, exp = db.execute('SELECT free_bypass_cycle_1_at,free_bypass_cycle_2_at,free_bypass_count,expires_at FROM tenant_accounts').fetchone()
assert (c1, c2, count) == (base, None, 0)
# Simulate the second BumX redemption, then redeem Link4M within the same day.
db.execute('UPDATE tenant_accounts SET free_bypass_count=1,free_bypass_last_at=? WHERE id=?', (base + 60_000, 'tenant-1'))
rows, exp2 = redeem_cycle(base + 3_600_000, 'key-2')
assert rows == 1
c1, c2, count, exp = db.execute('SELECT free_bypass_cycle_1_at,free_bypass_cycle_2_at,free_bypass_count,expires_at FROM tenant_accounts').fetchone()
assert (c1, c2, count) == (base, base + 3_600_000, 0)
assert exp == exp2 and datetime.strptime(exp2, '%Y-%m-%d %H:%M:%S') > datetime.strptime(exp1, '%Y-%m-%d %H:%M:%S')
# Third completion inside the 24h window must fail; no 7-day increment is applied.
db.execute('UPDATE tenant_accounts SET free_bypass_count=1,free_bypass_last_at=? WHERE id=?', (base + 4_000_000, 'tenant-1'))
rows, exp3 = redeem_cycle(base + 5_000_000, 'key-3')
assert rows == 0, 'Third cycle should be blocked while both completed cycles are within 24 hours'
assert db.execute('SELECT expires_at FROM tenant_accounts').fetchone()[0] == exp2
# When the oldest cycle reaches 24h, one slot is available; the newer cycle remains counted.
release_time = base + DAY
rows, exp4 = redeem_cycle(release_time, 'key-4')
assert rows == 1, 'A slot should reopen when the oldest completion ages 24 hours'
c1, c2, count, exp = db.execute('SELECT free_bypass_cycle_1_at,free_bypass_cycle_2_at,free_bypass_count,expires_at FROM tenant_accounts').fetchone()
assert (c1, c2, count) == (base + 3_600_000, release_time, 0)
print('PASS V57.8 Free bypass cycle simulation: 2 cycles per rolling 24h, third blocked, oldest slot reopens at 24h, +7 days per completed pair (cumulative), and same-session one-time key checks.')
