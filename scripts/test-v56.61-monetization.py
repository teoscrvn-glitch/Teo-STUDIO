"""Local SQLite smoke test for V56.61 seller, payout, refund and ad reconciliation invariants.
Not a substitute for tests against the production Cloudflare D1 database."""
import sqlite3

con = sqlite3.connect(':memory:')
con.executescript('''
CREATE TABLE buyer_purchases(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,scope TEXT NOT NULL,tenant_id TEXT,product_id TEXT NOT NULL,title TEXT NOT NULL,amount_vnd INTEGER NOT NULL,seller_amount_vnd INTEGER NOT NULL DEFAULT 0,commission_vnd INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'paid',seller_id TEXT,seller_commission_vnd INTEGER NOT NULL DEFAULT 0,refund_reason TEXT,created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE seller_wallet_ledger(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,available_at TEXT,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_seller_wallet_once ON seller_wallet_ledger(seller_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE seller_withdrawals(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,gross_vnd INTEGER NOT NULL,fee_vnd INTEGER NOT NULL DEFAULT 0,payout_vnd INTEGER NOT NULL,method TEXT NOT NULL,payout_snapshot TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',admin_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),reviewed_at TEXT,paid_at TEXT);
CREATE TABLE ad_providers(provider_key TEXT PRIMARY KEY,display_name TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1);
CREATE TABLE ad_revenue_reports(id TEXT PRIMARY KEY,provider_key TEXT NOT NULL,provider_ref TEXT NOT NULL,scope TEXT NOT NULL,tenant_id TEXT,gross_vnd INTEGER NOT NULL,owner_vnd INTEGER NOT NULL DEFAULT 0,platform_vnd INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',UNIQUE(provider_key,provider_ref));
CREATE TABLE tenant_wallet_ledger(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT NOT NULL DEFAULT '');
CREATE UNIQUE INDEX idx_tenant_ledger_once ON tenant_wallet_ledger(kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE master_wallet_ledger(id TEXT PRIMARY KEY,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT NOT NULL DEFAULT '');
CREATE UNIQUE INDEX idx_master_ledger_once ON master_wallet_ledger(kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
''')

# VND allocation uses the server-calculated paid amount, not a frontend price.
def allocate(paid, seller=False):
    fee = paid // 20
    commission = paid // 20 if seller else 0
    owner = paid - fee - commission
    return owner, commission, fee
assert allocate(100_000) == (95_000, 0, 5_000)
assert allocate(100_000, True) == (90_000, 5_000, 5_000)
# The amount passed is the final amount charged (illustrative discount result).
assert allocate(80_000, True) == (72_000, 4_000, 4_000)

# Seller commission is pending for seven days; refunds post a matching reversal.
con.execute("INSERT INTO buyer_purchases(id,buyer_id,scope,product_id,title,amount_vnd,seller_amount_vnd,commission_vnd,status,seller_id,seller_commission_vnd) VALUES('p1','buyer','tenant','file','file',80000,72000,4000,'paid','seller',4000)")
con.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,available_at,note) VALUES('s1','seller',4000,'seller_commission_pending','buyer_purchase','p1',datetime('now','+7 days'),'pending')")
pending = con.execute("SELECT COALESCE(SUM(amount_vnd),0) FROM seller_wallet_ledger WHERE seller_id='seller' AND available_at>datetime('now')").fetchone()[0]
assert pending == 4000
available_at = con.execute("SELECT available_at FROM seller_wallet_ledger WHERE id='s1'").fetchone()[0]
con.execute("UPDATE buyer_purchases SET status='refunded',refund_reason='verified refund' WHERE id='p1' AND status='paid'")
con.execute("INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,available_at,note) SELECT 's2','seller',-4000,'purchase_refund','purchase_refund','p1',?,'refund' WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id='p1' AND status='refunded')", (available_at,))
net_pending = con.execute("SELECT COALESCE(SUM(amount_vnd),0) FROM seller_wallet_ledger WHERE seller_id='seller' AND available_at>datetime('now')").fetchone()[0]
assert net_pending == 0
# Repeated refund cannot create a second reversal.
con.execute("INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,available_at,note) VALUES('s3','seller',-4000,'purchase_refund','purchase_refund','p1',?,'duplicate')", (available_at,))
assert con.execute("SELECT COUNT(*) FROM seller_wallet_ledger WHERE kind='purchase_refund' AND ref_id='p1'").fetchone()[0] == 1

# Withdrawal reserve checks available amount and rejection restores it once.
con.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,note) VALUES('s3','seller',150000,'earned','available')")
con.execute("INSERT INTO seller_withdrawals(id,seller_id,gross_vnd,payout_vnd,method,payout_snapshot,status) SELECT 'w1','seller',100000,100000,'bank','{}','pending' WHERE (SELECT COALESCE(SUM(CASE WHEN available_at IS NULL OR available_at<=datetime('now') THEN amount_vnd ELSE 0 END),0) FROM seller_wallet_ledger WHERE seller_id='seller')>=100000")
con.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note) SELECT 'reserve1','seller',-100000,'withdrawal_reserve','seller_withdrawal','w1','reserve' WHERE EXISTS(SELECT 1 FROM seller_withdrawals WHERE id='w1' AND status='pending')")
remaining = con.execute("SELECT SUM(CASE WHEN available_at IS NULL OR available_at<=datetime('now') THEN amount_vnd ELSE 0 END) FROM seller_wallet_ledger WHERE seller_id='seller'").fetchone()[0]
assert remaining == 50_000
con.execute("UPDATE seller_withdrawals SET status='rejected' WHERE id='w1' AND status IN ('pending','approved')")
con.execute("INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note) SELECT 'restore1','seller',100000,'withdrawal_reversal','seller_withdrawal_reject','w1','restore' WHERE EXISTS(SELECT 1 FROM seller_withdrawals WHERE id='w1' AND status='rejected')")
con.execute("INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note) VALUES('restore2','seller',100000,'withdrawal_reversal','seller_withdrawal_reject','w1','duplicate')")
restored = con.execute("SELECT SUM(CASE WHEN available_at IS NULL OR available_at<=datetime('now') THEN amount_vnd ELSE 0 END) FROM seller_wallet_ledger WHERE seller_id='seller'").fetchone()[0]
assert restored == 150_000
# A later approved payout is marked paid without another seller-ledger debit.
con.execute("INSERT INTO seller_withdrawals(id,seller_id,gross_vnd,payout_vnd,method,payout_snapshot,status) VALUES('w2','seller',100000,100000,'bank','{}','pending')")
con.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note) VALUES('reserve2','seller',-100000,'withdrawal_reserve','seller_withdrawal','w2','reserve')")
con.execute("UPDATE seller_withdrawals SET status='approved' WHERE id='w2' AND status='pending'")
con.execute("UPDATE seller_withdrawals SET status='paid',paid_at=datetime('now') WHERE id='w2' AND status='approved'")
assert con.execute("SELECT status FROM seller_withdrawals WHERE id='w2'").fetchone()[0] == 'paid'
assert con.execute("SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='seller'").fetchone()[0] == 50_000

# Ad reports remain pending without wallet credits; confirmation allocates 80/20 once.
con.execute("INSERT INTO ad_providers(provider_key,display_name,enabled) VALUES('test','Test provider',1)")
con.execute("INSERT INTO ad_revenue_reports(id,provider_key,provider_ref,scope,tenant_id,gross_vnd) VALUES('a1','test','ref-1','tenant','tenant-1',100000)")
assert con.execute("SELECT COUNT(*) FROM tenant_wallet_ledger").fetchone()[0] == 0
con.execute("UPDATE ad_revenue_reports SET status='confirmed',owner_vnd=80000,platform_vnd=20000 WHERE id='a1' AND status='pending'")
con.execute("INSERT OR IGNORE INTO tenant_wallet_ledger VALUES('ad-owner','tenant-1',80000,'ad_revenue','ad_report','a1','confirmed 80%')")
con.execute("INSERT OR IGNORE INTO master_wallet_ledger VALUES('ad-platform',20000,'ad_platform_share','ad_report','a1','confirmed 20%')")
con.execute("INSERT OR IGNORE INTO tenant_wallet_ledger VALUES('ad-owner-dup','tenant-1',80000,'ad_revenue','ad_report','a1','duplicate')")
assert con.execute("SELECT SUM(amount_vnd) FROM tenant_wallet_ledger WHERE kind='ad_revenue'").fetchone()[0] == 80000
assert con.execute("SELECT SUM(amount_vnd) FROM master_wallet_ledger WHERE kind='ad_platform_share'").fetchone()[0] == 20000

# The client must capture the newly clicked referral code before falling back to an older cache.
from pathlib import Path
root = Path(__file__).resolve().parents[1]
account_js = (root / 'frontend/assets/js/account.js').read_text()
assert 'The latest clicked referral link wins' in account_js
assert account_js.index('if(currentLinkMatches)') < account_js.index('const cached=JSON.parse(localStorage.getItem(key)')
worker_js = (root / 'cloudflare/worker.js').read_text()
assert 'expires=Date.now()+30*86400000' in worker_js
assert "datetime('now','+7 days')" in worker_js
assert "TELEGRAM_WEBHOOK_SECRET" in worker_js and 'pairCode:code' in worker_js and 'deepLink:' in worker_js

print('PASS V56.61 finance simulation: 95/5 and 90/5/5 splits; amount after discount; 7-day pending/refund reversal; withdrawal reserve/approve/reject/paid idempotency; pending ads create no balance; confirmed ads split 80/20 once.')
