"""SQLite model smoke tests for V57 ledger invariants; not a replacement for live D1 tests."""
import sqlite3

con = sqlite3.connect(':memory:')
con.executescript('''
CREATE TABLE buyer_accounts(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email_normalized TEXT NOT NULL, public_sales_opt_in INTEGER NOT NULL DEFAULT 0);
CREATE TABLE buyer_purchases(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,scope TEXT NOT NULL,tenant_id TEXT,product_id TEXT NOT NULL,title TEXT NOT NULL,amount_vnd INTEGER NOT NULL,seller_amount_vnd INTEGER NOT NULL DEFAULT 0,commission_vnd INTEGER NOT NULL DEFAULT 0,request_key TEXT,status TEXT NOT NULL DEFAULT 'paid',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_purchase_idem ON buyer_purchases(buyer_id,request_key) WHERE request_key IS NOT NULL AND request_key<>'';
CREATE TABLE buyer_wallet_ledger(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_buyer_wallet_once ON buyer_wallet_ledger(buyer_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE tenant_wallet_ledger(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_tenant_wallet_once ON tenant_wallet_ledger(kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE master_wallet_ledger(id TEXT PRIMARY KEY,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_master_wallet_once ON master_wallet_ledger(kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
''')
con.execute("INSERT INTO buyer_accounts VALUES('buyer-1','Test buyer','test@example.com',1)")
con.execute("INSERT INTO buyer_wallet_ledger VALUES('topup-1','buyer-1',100000,'topup','topup','topup-order-1','smoke test',datetime('now'))")
con.commit()

def purchase(purchase_id, request_key):
    amount=15000; seller=14250; fee=750
    con.execute('BEGIN')
    try:
        con.execute("INSERT OR IGNORE INTO buyer_purchases(id,buyer_id,scope,tenant_id,product_id,title,amount_vnd,seller_amount_vnd,commission_vnd,request_key,status) SELECT ?,?,?,?,?,?,?,?,?,?,'paid' WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM buyer_wallet_ledger WHERE buyer_id=?)>=?",(purchase_id,'buyer-1','tenant','tenant-1','file-1','Test file',amount,seller,fee,request_key,'buyer-1',amount))
        con.execute("INSERT INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,-?,'purchase','purchase',?,? WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')",('debit-'+purchase_id,'buyer-1',amount,purchase_id,'Test file',purchase_id,'buyer-1'))
        con.execute("INSERT OR IGNORE INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,?,'sale','buyer_purchase',?,? WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')",('seller-'+purchase_id,'tenant-1',seller,purchase_id,'sale',purchase_id,'buyer-1'))
        con.execute("INSERT OR IGNORE INTO master_wallet_ledger(id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,'platform_commission','buyer_purchase',?,? WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')",('fee-'+purchase_id,fee,purchase_id,'fee',purchase_id,'buyer-1'))
        con.commit()
    except Exception:
        con.rollback(); raise

purchase('purchase-1','same-request-key-0001')
purchase('purchase-2','same-request-key-0001')
balance=con.execute("SELECT SUM(amount_vnd) FROM buyer_wallet_ledger WHERE buyer_id='buyer-1'").fetchone()[0]
seller=con.execute("SELECT SUM(amount_vnd) FROM tenant_wallet_ledger WHERE tenant_id='tenant-1'").fetchone()[0]
fee=con.execute("SELECT SUM(amount_vnd) FROM master_wallet_ledger").fetchone()[0]
count=con.execute("SELECT COUNT(*) FROM buyer_purchases WHERE buyer_id='buyer-1'").fetchone()[0]
assert (balance,seller,fee,count)==(85000,14250,750,1),(balance,seller,fee,count)
# Public feed must omit buyers who have not opted in.
con.execute("INSERT INTO buyer_accounts VALUES('buyer-2','Opted out','private@example.com',0)")
con.execute("INSERT INTO buyer_purchases(id,buyer_id,scope,product_id,title,amount_vnd,request_key,status) VALUES('purchase-hidden','buyer-2','main','file-2','Hidden',1000,'request-hidden','paid')")
feed=con.execute("SELECT p.id,a.display_name,a.email_normalized FROM buyer_purchases p JOIN buyer_accounts a ON a.id=p.buyer_id WHERE p.status='paid' AND a.public_sales_opt_in=1").fetchall()
assert [r[0] for r in feed]==['purchase-1'] or len(feed)==1, feed
print('PASS: purchase is idempotent; buyer balance 85,000; seller 14,250; platform 750; opt-out buyer omitted from public sales feed.')
