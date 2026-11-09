import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
w=(root/'cloudflare/worker.js').read_text()
a=(root/'frontend/admin.html').read_text()
c=(root/'frontend/assets/js/account.js').read_text()
r=(root/'frontend/assets/js/card-rates-admin.js').read_text()
wr=(root/'cloudflare/wrangler.toml').read_text()
checks={
 'version marker':'v58.8-stability-experience' in w,
 'provider fee API refresh':'/chargingws/v2/getfee?partner_id=' in w,
 'exact provider amount credit':'credit=providerAmount' in w,
 'idempotent card ledger':"'card-topup:'+String(row.id)" in w,
 'dynamic amount validation':'face>10000000||face%1000!==0' in w,
 'card status check command':"command:'check'" in w,
 'Merchant overview admin route':"/api/admin/merchant/overview" in w,
 'Merchant withdraw admin route':"/api/admin/merchant/withdrawals" in w,
 'Merchant unknown-order reconciliation':"/reconcile" in w and 'MANUAL_RECONCILIATION_CONFIRMATION_REQUIRED' in w,
 'Merchant atomic single-open withdrawal guard':'idx_merchant_withdrawals_single_open' in w and "status IN ('submitting','unknown','pending','processing')" in w,
 'Merchant provider bank code not hardcoded':'const banks=' not in w and 'Mã ngân hàng theo TheCaoSieuToc' in a,
 'Merchant Token server secret':'THECAOSIEUTOC_TOKEN' in w,
 'merchant panel exists':'id="merchant-center"' in a,
 'ad placements panel exists':'id="ads-config"' in a,
 'ad placement endpoints':"/api/admin/ads/placements" in w and "'/api/ads/config'" in w,
 'agent endpoint':'/api/assistant/agent' in w and 'function assistantAgent' in w,
 'agent actions read-only wallet':'action===\'wallet\'' in w,
 'topup frontend removes manual member fee':'.member)' not in c and 'providerFee' in c,
 'topup shows no 1000 floor rounding':'làm tròn xuống 1.000đ' not in c.lower(),
 'API-managed read only rates UI':'Đồng bộ bảng phí API' in a and 'Lưu bảng phí' not in a,
 'keep dashboard vars on deploy':'keep_vars = true' in wr,
 'hourly tariff synchronization':'0 * * * *' in wr and "cron==='0 * * * *'" in w,
 'Merchant token documented':'THECAOSIEUTOC_TOKEN' in wr,
 'existing D1 binding preserved':'binding = "DB"' in wr,
 'existing rate limit preserved':'name = "FINANCE_EDGE_LIMITER"' in wr,
 'Note designer retained':'assets/js/note-studio.js?v=58.3' in a,
 'Key vault retained':'tenant_product_keys' in w,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
if failed: raise SystemExit(f'{len(failed)} checks failed: '+', '.join(failed))
# SQLite smoke test for the one-open-Merchant-withdrawal invariant.
db=sqlite3.connect(':memory:')
db.executescript("CREATE TABLE merchant_withdrawals(id TEXT PRIMARY KEY,client_request_id TEXT NOT NULL UNIQUE,order_code TEXT DEFAULT NULL UNIQUE,amount_vnd INTEGER NOT NULL,bank_code TEXT NOT NULL,account_last4 TEXT NOT NULL DEFAULT '',account_name_masked TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'submitting',provider_status INTEGER DEFAULT NULL,provider_message TEXT NOT NULL DEFAULT '',response_json TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')),checked_at TEXT DEFAULT NULL); CREATE UNIQUE INDEX idx_merchant_withdrawals_single_open ON merchant_withdrawals((1)) WHERE status IN ('submitting','unknown','pending','processing');")
db.execute("INSERT INTO merchant_withdrawals(id,client_request_id,amount_vnd,bank_code,status) VALUES('w1','r1',10000,'VCB','unknown')")
try:
 db.execute("INSERT INTO merchant_withdrawals(id,client_request_id,amount_vnd,bank_code,status) VALUES('w2','r2',10000,'VCB','pending')")
 raise SystemExit('Merchant single-open index allowed a duplicate unresolved withdrawal')
except sqlite3.IntegrityError: pass
db.execute("UPDATE merchant_withdrawals SET status='completed' WHERE id='w1'")
db.execute("INSERT INTO merchant_withdrawals(id,client_request_id,amount_vnd,bank_code,status) VALUES('w2','r2',10000,'VCB','pending')")
print('PASS SQLite Merchant invariant: only one open/submitting/unknown/pending/processing withdrawal at a time; new request allowed after completion.')
print(f'PASS: {len(checks)} V58.4 integration checks')
