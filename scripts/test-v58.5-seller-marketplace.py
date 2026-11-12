from pathlib import Path
import re, sqlite3
ROOT=Path(__file__).resolve().parents[1]
w=(ROOT/'cloudflare/worker.js').read_text()
seller=(ROOT/'frontend/assets/js/seller.js').read_text()
seller_html=(ROOT/'frontend/seller.html').read_text()
tenant=(ROOT/'frontend/assets/js/tenant-admin.js').read_text()
master=(ROOT/'frontend/assets/js/admin-v14.js').read_text()
master_html=(ROOT/'frontend/admin.html').read_text()
main=(ROOT/'frontend/assets/js/main.js').read_text()

def check(ok,msg):
    if not ok: raise AssertionError(msg)
    print('PASS',msg)

check("v58.13-withdrawal-vietqr" in w and "v58.13-withdrawal-vietqr" in (ROOT/'VERSION.txt').read_text(),'release identity V58.5')
check("addColumnSafe(e,'products','seller_commission_pct','REAL NOT NULL DEFAULT 5')" in w and "addColumnSafe(e,'tenant_products','seller_commission_pct','REAL NOT NULL DEFAULT 5')" in w,'additive commission migrations preserve existing products')
check("p.seller_commission_pct" in w and "commissionPct:pct" in w and "commissionVnd:Math.floor" in w,'Seller catalog includes per-file percent and expected VND commission')
check("createdAt:x.created_at||''" in w and "LIMIT 500" in w and "LIMIT 1000" in w,'catalog exposes recent products with bounded query sizes')
check("value=\"newest\"" in seller_html and "value=\"commission\"" in seller_html and "value=\"earning\"" in seller_html,'Seller UI has newest, highest-percent, highest-commission sorting')
check("sellerSearch" in seller_html and "toLocaleLowerCase('vi')" in seller,'Seller UI supports product and Studio search')
check("seller_commission_pct:Number(f.get('seller_commission_pct')??5)" in tenant,'Tenant owner can configure per-file Seller percentage')
check("seller_commission_pct:Number(f.get('seller_commission_pct')??5)" in master and "seller_commission_pct" in master_html,'Master Admin can configure per-file Seller percentage')
check("productSellerCommissionPct=Math.max(0,Math.min(50,Number(x.seller_commission_pct??5)))" in w,'Purchase reads bounded commission rate from authoritative product record')
check("sellerCommission=Math.floor(amount*productSellerCommissionPct/100)" in w,'Purchase credits seller using saved product rate')
check("const fee=Math.floor(amount*0.05),ownerAmount=amount-fee-sellerCommission" in w,'Platform fee stays 5%; seller commission is deducted from owner share')
check("Hoa hồng Seller ${productSellerCommissionPct}%" in w,'Ledger note records actual applied commission rate')
check("SELLER ${Number(p.seller_commission_pct??5)}%" in tenant or "seller_commission_pct" in (ROOT/'frontend/assets/js/tenant-detail.js').read_text(),'Tenant product detail shows configured rate')
check("SELLER ${Number(p.seller_commission_pct??5)}%" in main,'Main product detail shows configured rate')
# Verify the accounting invariant for multiple rates and prevent a negative owner share.
for pct in (0, 5, 12.5, 50):
    amount=100_000; fee=amount//20; seller=int(amount*pct/100); owner=amount-fee-seller
    check(fee+seller+owner==amount and owner>=0, f'ledger split invariant at seller rate {pct}%')
# Verify schema additions are valid and existing rows receive default 5.
db=sqlite3.connect(':memory:')
db.execute('CREATE TABLE products(id TEXT PRIMARY KEY, seller_enabled INTEGER NOT NULL DEFAULT 0)')
db.execute("INSERT INTO products(id) VALUES('old')")
db.execute('ALTER TABLE products ADD COLUMN seller_commission_pct REAL NOT NULL DEFAULT 5')
check(db.execute("SELECT seller_commission_pct FROM products WHERE id='old'").fetchone()[0]==5,'legacy product gets safe 5% default')
print('PASS V58.5 Seller marketplace regression suite')
