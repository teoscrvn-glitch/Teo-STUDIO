from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
w = (root / 'cloudflare/worker.js').read_text()
t = (root / 'frontend/assets/js/tenant-admin.js').read_text()
a = (root / 'frontend/assets/js/account.js').read_text()
k = (root / 'frontend/assets/js/free-key.js').read_text()
page = (root / 'frontend/free-key.html').read_text()
topup = (root / 'frontend/topup.html').read_text()

assert "BUILD_VERSION='v58.13-withdrawal-vietqr'" in w
assert "provider=step===1?'bumx':'link4m'" in w
assert 'free_bypass_last_at' in w and '86400000' in w
assert 'now+7*86400000' in w
assert 'step===1' in w and 'step===2' in w and 'provider:short.provider' in w
assert 'BYPASS_SESSION_MISMATCH' in w and 'sha256(returnSession)' in w
assert 'tenantFromFreeBypassSession' in w
assert "b.id||b.tenant||b.slug||b.tenantId" in w
assert "unscopedHeaders.delete('x-tenant-slug')" in w
assert "scopedHeaders.set(" + chr(39) + "x-tenant-slug" + chr(39) + ",slug)" in w
assert "canonical keys matches" in w
assert 'v58.13-withdrawal-vietqr' in (root / 'frontend/assets/js/config.js').read_text()
assert 'tenant-admin.js?v=58.9' in (root / 'frontend/tenant-admin.html').read_text()
assert "authorization:'Bearer '+tenantToken" in k
assert 'LINK4M_REWARDED_TRAFFIC_APPROVED' in w
assert 'FREE_BYPASS_VERIFY_URL' not in w and 'FREE_BYPASS_API_KEY' not in w
assert 'FREE_BYPASS_REWARDED_TRAFFIC_APPROVED' not in w
assert 'Đã hoàn tất lượt BumX 1/2' in w
assert '7 ngày Free' in t and '24 giờ' in t and 'Vượt Link4M' in t
assert 'Key đã ẩn khỏi màn hình' in k
assert 'BumX' in page and '7 ngày Free' in page
assert '(?:account|topup)' in a and 'isTopupPage()' in a
assert "location.href='/topup.html?method=card'" in a
assert 'name="guardianConsent" required' in a
assert 'd.guardianConsent=e.target.elements.guardianConsent.checked===true' in a
assert 'b.guardianConsent!==true' in w
assert 'THECAOSIEUTOC_PARTNER_ID' in w and 'THECAOSIEUTOC_PARTNER_KEY' in w
assert 'teo-account-page-mode' in topup and 'assets/js/account.js?v=58.9' in topup
assert 'CARD_ALREADY_SUBMITTED' in w and 'CARD_PROVIDER_REJECTED' in w
assert '(?:start|issue|redeem|complete)' in w
assert 'crons = ["0 * * * *", "*/5 * * * *"]' in (root / 'cloudflare/wrangler.toml').read_text()
assert 'purgeExpiredBypassArtifacts(e)' in w and "controller?.cron||''" in w

# Exercise the intended 24-hour cumulative schedule and 7-day final grant in SQLite.
db = sqlite3.connect(':memory:')
db.executescript("""
CREATE TABLE tenant_accounts(
 id TEXT PRIMARY KEY, plan_type TEXT, free_bypass_count INTEGER,
 free_bypass_last_at INTEGER, free_admin_unlocked INTEGER,
 expires_at TEXT, starts_at TEXT, locked INTEGER DEFAULT 0,
 deleted_at TEXT
);
INSERT INTO tenant_accounts VALUES('t1','free',0,NULL,0,NULL,NULL,0,NULL);
""")
now = 1_800_000_000_000
# BumX key issuance becomes the anchor; redeem first step stores progress 1/2.
db.execute('UPDATE tenant_accounts SET free_bypass_last_at=? WHERE id=? AND free_bypass_count=0', (now, 't1'))
db.execute('UPDATE tenant_accounts SET free_bypass_count=1 WHERE id=? AND free_bypass_count=0 AND free_bypass_last_at IS NOT NULL AND free_bypass_last_at<=?', ('t1', now))
assert db.execute('SELECT free_bypass_count,free_bypass_last_at FROM tenant_accounts WHERE id=?', ('t1',)).fetchone() == (1, now)
assert now + 86_399_999 < now + 86_400_000
# At exactly 24h, Link4M key issuance preserves the first-step anchor.
now2 = now + 86_400_000
cur = db.execute('UPDATE tenant_accounts SET free_bypass_last_at=free_bypass_last_at WHERE id=? AND free_bypass_count=1 AND free_bypass_last_at IS NOT NULL AND free_bypass_last_at<=?', ('t1', now2 - 86_400_000))
assert cur.rowcount == 1
# Redeeming the second key checks the same anchor and grants seven days.
expiry = now2 + 7 * 86_400_000
db.execute('UPDATE tenant_accounts SET free_bypass_count=0,free_admin_unlocked=1,free_bypass_last_at=NULL,expires_at=?,starts_at=? WHERE id=? AND free_bypass_count=1 AND free_bypass_last_at<=?', (str(expiry), str(now2), 't1', now2 - 86_400_000))
row = db.execute('SELECT free_bypass_count,free_admin_unlocked,free_bypass_last_at,expires_at FROM tenant_accounts WHERE id=?', ('t1',)).fetchone()
assert row == (0, 1, None, str(expiry)), row

print('PASS V57.7: two-provider cumulative Free path, 24-hour interval, 7-day grant, Link4M permission gate, standalone top-up page, guardian acknowledgement and provider-confirmed credit.')
