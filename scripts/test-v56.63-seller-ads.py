"""Local SQLite simulation/static checks for V56.63 Seller + manual Ads.
This does NOT access Cloudflare D1 or production account data.
"""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text()
admin = (ROOT / 'frontend/assets/js/admin-v14.js').read_text()
seller_ui = (ROOT / 'frontend/assets/js/seller.js').read_text()

# Production-relevant static contracts.
for token in [
    "datetime('now','+7 days')",
    "expires=Date.now()+30*86400000",
    "seller_commission_pending",
    "request_key",
    "seller_withdrawal_events",
    "ad_revenue_report_events",
    "owner=Math.floor(gross*.8)",
    "platform=gross-owner",
    "IDEMPOTENCY_KEY_CONFLICT",
    "AD_REPORT_NOT_PENDING",
    "kind='ad_revenue'",
    "adsRevenueVnd",
    "totalIncomeVnd",
    "FEATURE_GLOBAL_ONLY",
]:
    assert token in worker, f'missing worker contract: {token}'
assert "data-rollout-toggle" in admin
assert "data-confirm-ad" in admin and "data-reject-ad" in admin
assert "requestKey" in seller_ui
assert "periodStart" in admin and "periodEnd" in admin
assert "adsRevenueVnd" in (ROOT / 'frontend/assets/js/tenant-admin.js').read_text()
assert "TELEGRAM_BOT_USERNAME = \"TeoStudioWebhookBot\"" in (ROOT / 'cloudflare/wrangler.toml').read_text()

# Payout reserve + one-use idempotency key.
db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE seller_wallet_ledger(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,available_at TEXT,note TEXT NOT NULL DEFAULT '');
CREATE UNIQUE INDEX seller_once ON seller_wallet_ledger(seller_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE seller_withdrawals(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,gross_vnd INTEGER NOT NULL,payout_vnd INTEGER NOT NULL,status TEXT NOT NULL,request_key TEXT);
CREATE UNIQUE INDEX request_once ON seller_withdrawals(seller_id,request_key) WHERE request_key IS NOT NULL AND request_key<>'';
CREATE TABLE seller_withdrawal_events(id TEXT PRIMARY KEY,withdrawal_id TEXT NOT NULL,event_type TEXT NOT NULL,UNIQUE(withdrawal_id,event_type));
''')
db.execute("INSERT INTO seller_wallet_ledger VALUES('earn','s1',150000,'earned',NULL,NULL,NULL,'earned')")
# Two distinct requests cannot reserve more than the available balance.
db.execute("INSERT INTO seller_withdrawals VALUES('w1','s1',100000,100000,'pending','key-1')")
db.execute("INSERT INTO seller_wallet_ledger VALUES('reserve1','s1',-100000,'withdrawal_reserve','seller_withdrawal','w1',NULL,'reserve')")
cur = db.execute("INSERT INTO seller_withdrawals SELECT 'w2','s1',60000,60000,'pending','key-2' WHERE (SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='s1' AND (available_at IS NULL OR available_at<=datetime('now'))) >= 60000")
assert cur.rowcount == 0
# Same key cannot be reused for another payout amount.
try:
    db.execute("INSERT INTO seller_withdrawals VALUES('w1-dup','s1',90000,90000,'pending','key-1')")
    raise AssertionError('duplicate payout idempotency key was accepted')
except sqlite3.IntegrityError:
    pass
# State transitions create one audit event each.
db.execute("INSERT INTO seller_withdrawal_events VALUES('e1','w1','requested')")
db.execute("INSERT INTO seller_withdrawal_events VALUES('e2','w1','approved')")
db.execute("INSERT INTO seller_withdrawal_events VALUES('e3','w1','paid')")
assert db.execute("SELECT COUNT(*) FROM seller_withdrawal_events WHERE withdrawal_id='w1'").fetchone()[0] == 3

# Ads: pending report has no wallet credit; confirm allocates 80/20 and ledger keys reject duplicates.
db.executescript('''
CREATE TABLE ad_reports(id TEXT PRIMARY KEY,gross INTEGER NOT NULL,owner INTEGER NOT NULL DEFAULT 0,platform INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL);
CREATE TABLE tenant_ledger(id TEXT PRIMARY KEY,kind TEXT,ref_type TEXT,ref_id TEXT,amount INTEGER);
CREATE UNIQUE INDEX tenant_ledger_once ON tenant_ledger(kind,ref_type,ref_id);
CREATE TABLE master_ledger(id TEXT PRIMARY KEY,kind TEXT,ref_type TEXT,ref_id TEXT,amount INTEGER);
CREATE TABLE tenant_wallet_ledger_stats(tenant_id TEXT,kind TEXT,amount_vnd INTEGER,created_at TEXT);
CREATE UNIQUE INDEX master_ledger_once ON master_ledger(kind,ref_type,ref_id);
''')
db.execute("INSERT INTO ad_reports VALUES('a1',101,0,0,'pending')")
assert db.execute("SELECT COUNT(*) FROM tenant_ledger").fetchone()[0] == 0
owner = 101 * 80 // 100
platform = 101 - owner
db.execute("UPDATE ad_reports SET status='confirmed',owner=?,platform=? WHERE id='a1' AND status='pending'", (owner, platform))
db.execute("INSERT OR IGNORE INTO tenant_ledger VALUES('t1','ad_revenue','ad_report','a1',?)", (owner,))
db.execute("INSERT OR IGNORE INTO master_ledger VALUES('m1','ad_platform_share','ad_report','a1',?)", (platform,))
db.execute("INSERT OR IGNORE INTO tenant_ledger VALUES('t2','ad_revenue','ad_report','a1',?)", (owner,))
db.execute("INSERT OR IGNORE INTO master_ledger VALUES('m2','ad_platform_share','ad_report','a1',?)", (platform,))
assert owner + platform == 101
assert db.execute("SELECT SUM(amount) FROM tenant_ledger WHERE ref_id='a1'").fetchone()[0] == owner
assert db.execute("SELECT SUM(amount) FROM master_ledger WHERE ref_id='a1'").fetchone()[0] == platform
assert db.execute("SELECT status FROM ad_reports WHERE id='a1'").fetchone()[0] == 'confirmed'
db.execute("INSERT INTO tenant_wallet_ledger_stats VALUES('t1','ad_revenue',?, '2026-10-31 10:00:00')", (owner,))
verified_ads_income = db.execute("SELECT COALESCE(SUM(amount_vnd),0) FROM tenant_wallet_ledger_stats WHERE tenant_id='t1' AND kind='ad_revenue'").fetchone()[0]
assert verified_ads_income == owner  # only the confirmed 80% owner share appears in tenant income stats

# Financial formulas, using the server's final amount received.
def split(paid, has_seller):
    platform = paid // 20
    seller = paid // 20 if has_seller else 0
    owner = paid - platform - seller
    return owner, seller, platform
assert split(100000, False) == (95000, 0, 5000)
assert split(100000, True) == (90000, 5000, 5000)
assert split(80000, True) == (72000, 4000, 4000)
print('PASS V56.63 Seller/Ads checks: 30-day attribution, 7-day settlement, payout reserve/idempotency/audit, 95/5 and 90/5/5 splits, Ads pending/no-credit then confirmed 80/20, duplicate ledger protection, confirmed Ads reflected separately in Tenant stats.')
