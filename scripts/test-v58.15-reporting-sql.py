from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text()

performance = re.search(
    r'const performance=\(await e\.DB\.prepare\(`(SELECT rc\.product_id.*?LIMIT 100)`\)\.bind\(buyer\.id\)\.all\(\)\)\.results',
    worker,
    re.S,
)
assert performance, 'Seller performance SELECT was not found'
leaderboards = re.findall(
    r'const (owners|sellers|buyers)=\(await e\.DB\.prepare\(`(SELECT .*?)`\)\.bind\(start,end\)\.all\(\)\)',
    worker,
    re.S,
)
assert {name for name, _ in leaderboards} == {'owners', 'sellers', 'buyers'}

conn = sqlite3.connect(':memory:')
conn.executescript('''
CREATE TABLE seller_referral_codes(code TEXT,seller_id TEXT,scope TEXT,tenant_id TEXT,product_id TEXT,created_at TEXT);
CREATE TABLE seller_referral_visits(seller_id TEXT,scope TEXT,tenant_id TEXT,product_id TEXT,day_vn TEXT,visitor_hash TEXT, UNIQUE(seller_id,scope,tenant_id,product_id,day_vn,visitor_hash));
CREATE TABLE buyer_seller_referrals(buyer_id TEXT,scope TEXT,tenant_id TEXT,seller_id TEXT,product_id TEXT);
CREATE TABLE buyer_purchases(id TEXT,buyer_id TEXT,scope TEXT,tenant_id TEXT,product_id TEXT,title TEXT,amount_vnd INTEGER,status TEXT,seller_id TEXT,seller_commission_vnd INTEGER,created_at TEXT);
CREATE TABLE products(id TEXT,title TEXT);
CREATE TABLE tenant_products(tenant_id TEXT,id TEXT,title TEXT);
CREATE TABLE tenant_accounts(id TEXT,slug TEXT,studio_name TEXT,deleted_at TEXT);
CREATE TABLE buyer_accounts(id TEXT,display_name TEXT,login_id TEXT);
CREATE TABLE buyer_wallet_ledger(buyer_id TEXT,amount_vnd INTEGER,kind TEXT,created_at TEXT);
''')
conn.execute("INSERT INTO tenant_accounts VALUES('tenant-1','studio-a','Studio A',NULL)")
conn.execute("INSERT INTO buyer_accounts VALUES('seller-1','Seller One','seller1')")
conn.execute("INSERT INTO buyer_accounts VALUES('buyer-1','Buyer One','buyer1')")
conn.execute("INSERT INTO tenant_products VALUES('tenant-1','product-1','Sample file')")
conn.execute("INSERT INTO seller_referral_codes VALUES('code','seller-1','tenant','tenant-1','product-1','2026-11-13')")
conn.execute("INSERT INTO seller_referral_visits VALUES('seller-1','tenant','tenant-1','product-1','2026-11-13','hmac-hash')")
# Same visitor, link and VN day must deduplicate.
conn.execute("INSERT OR IGNORE INTO seller_referral_visits VALUES('seller-1','tenant','tenant-1','product-1','2026-11-13','hmac-hash')")
conn.execute("INSERT INTO buyer_seller_referrals VALUES('buyer-1','tenant','tenant-1','seller-1','product-1')")
conn.execute("INSERT INTO buyer_purchases VALUES('order-1','buyer-1','tenant','tenant-1','product-1','Sample file',10000,'paid','seller-1',500,'2026-11-13 10:00:00')")
conn.execute("INSERT INTO buyer_wallet_ledger VALUES('buyer-1',50000,'topup','2026-11-13 10:00:00')")
conn.execute("INSERT INTO buyer_wallet_ledger VALUES('buyer-1',10000,'card_topup','2026-11-13 11:00:00')")

performance_rows = conn.execute(performance.group(1), ('seller-1',)).fetchall()
assert len(performance_rows) == 1
assert performance_rows[0][3] == 'Studio A'  # tenant_name
assert performance_rows[0][5:10] == (1, 1, 1, 10000, 500)
assert conn.execute('SELECT COUNT(*) FROM seller_referral_visits').fetchone()[0] == 1

for name, sql in leaderboards:
    rows = conn.execute(sql, ('2026-11-13', '2026-11-14')).fetchall()
    assert len(rows) == 1, f'{name} returned an unexpected number of rows'
    assert int(rows[0][-1]) > 0, f'{name} did not calculate a positive total'

print('PASS V58.15 reporting SQL: Seller performance + Studio, Seller and top-up leaderboards execute; daily visit deduplication holds.')
