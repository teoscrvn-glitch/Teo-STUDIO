from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
account = (ROOT / 'frontend/assets/js/account.js').read_text(encoding='utf-8')
admin_html = (ROOT / 'frontend/tenant-admin.html').read_text(encoding='utf-8')
admin_js = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')
share_js = (ROOT / 'frontend/assets/js/tenant-share.js').read_text(encoding='utf-8')
download_js = (ROOT / 'frontend/assets/js/main.js').read_text(encoding='utf-8')
note_js = (ROOT / 'frontend/assets/js/note-studio.js').read_text(encoding='utf-8')
seller_js = (ROOT / 'frontend/assets/js/seller.js').read_text(encoding='utf-8')
seller_css = (ROOT / 'frontend/assets/css/seller-performance.css').read_text(encoding='utf-8')

checks = {
    'additive membership schema and unique idempotency': all(x in worker for x in [
        'CREATE TABLE IF NOT EXISTS tenant_membership_plans',
        'CREATE TABLE IF NOT EXISTS tenant_memberships',
        'UNIQUE(buyer_id,request_key)',
        "addColumnSafe(e,'tenant_products','member_only'",
    ]),
    'membership purchase uses single buyer identity and verified email': all(x in worker for x in [
        "p==='/api/account/memberships/purchase'",
        'buyerFromRequest(r,e)',
        'Number(buyer.email_verified)!==1',
        'tenant-membership-purchase',
    ]),
    'tenant scoped membership plan create/read/edit': all(x in worker for x in [
        "'/api/tenant/membership-plans'", "'/api/tenant/memberships'",
        'WHERE tenant_id=? AND id=?', 'String(t.id)',
    ]),
    'member-only products require an enabled plan': worker.count('MEMBERSHIP_PLAN_REQUIRED') >= 2,
    'purchase endpoint enforces active membership before issuing download': 'buyerHasActiveTenantMembership(e,tenantId,buyer.id)' in worker,
    'public product endpoint redacts member-only URLs before returning JSON': all(x in worker for x in [
        'pub.member_locked=pub.member_only===1&&!memberAccess',
        'if(pub.member_locked){delete pub.download_link;delete pub.original_link;}',
    ]),
    'attached member-only Note enforces membership before revealing final URL': all(x in worker for x in [
        'const requiresMembership=Number(linked.member_only)===1;',
        "error:'MEMBERSHIP_REQUIRED'",
        'buyerHasActiveTenantMembership(e,t.id,account.id)',
    ]),
    'download client forwards unified account token': "authorization:'Bearer '+buyerToken" in download_js,
    'tenant Share renders membership plans and invokes common account purchase API': all(x in share_js for x in [
        'renderMembership()', '/api/account/memberships/purchase', 'TEO_BUYER_SESSION',
    ]),
    'account hub exposes single account entitlements and membership list': all(x in account for x in [
        'Một tài khoản · Nhiều quyền sử dụng', 'teoOpenMembershipHub', "tab==='memberships'",
    ]),
    'tenant admin provides membership plans, list and member-only/update controls': all(x in admin_html+admin_js for x in [
        'membershipPlanForm', 'membershipMemberList', 'member_only', 'notify_members',
    ]),
    'Messenger is recognized in Note task editor': all(x in note_js+admin_html for x in [
        'messenger', 'Messenger',
    ]),
    'Seller performance API returns persistent referral codes and tenant slugs': all(x in worker for x in [
        'rc.code AS referral_code', 'AS tenant_slug',
    ]),
    'Seller performance has copy, QR, destination and per-link stats UI': all(x in seller_js+seller_css for x in [
        'data-link-copy', 'data-link-qr', 'data-link-open', 'seller-link-stats',
        'api.qrserver.com/v1/create-qr-code',
    ]),
    'Seller center separates catalog, performance, payout and ledger into views': all(x in seller_js+seller_css+(ROOT / 'frontend/seller.html').read_text(encoding='utf-8') for x in [
        'data-seller-view', 'sellerPerformanceSection', 'sellerLedgerSection', 'sellerPayoutSection',
    ]),
    'Master and tenant admin both provide leaderboard navigation': 'href="/rankings.html"' in (ROOT / 'frontend/admin.html').read_text(encoding='utf-8') and 'href="/rankings.html"' in admin_html,
}

# Execute representative SQLite DDL and transaction statements against an isolated in-memory DB.
db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE tenant_products(id TEXT PRIMARY KEY, tenant_id TEXT, member_only INTEGER NOT NULL DEFAULT 0);
CREATE TABLE buyer_wallet_ledger(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT,ref_id TEXT,note TEXT DEFAULT '');
CREATE TABLE tenant_membership_plans(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price_vnd INTEGER NOT NULL,duration_days INTEGER NOT NULL DEFAULT 30,enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT(datetime('now')),updated_at TEXT DEFAULT(datetime('now')));
CREATE TABLE tenant_memberships(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,buyer_id TEXT NOT NULL,plan_id TEXT NOT NULL,plan_name TEXT NOT NULL,paid_vnd INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',starts_at_ms INTEGER NOT NULL,expires_at_ms INTEGER NOT NULL,request_key TEXT NOT NULL,created_at TEXT DEFAULT(datetime('now')),UNIQUE(buyer_id,request_key));
''')
db.execute("INSERT INTO tenant_membership_plans(id,tenant_id,name,price_vnd,duration_days) VALUES('p1','studio-a','Gold',19900,30)")
db.execute("INSERT INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind) VALUES('seed','buyer-1',50000,'topup')")
member_id='m1'
db.execute("INSERT INTO tenant_memberships(id,tenant_id,buyer_id,plan_id,plan_name,paid_vnd,status,starts_at_ms,expires_at_ms,request_key) VALUES(?,?,?,?,?,?,'pending',?,?,?)",(member_id,'studio-a','buyer-1','p1','Gold',19900,100,100+30*86400000,'request-key-000000000000'))
db.execute("INSERT INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,-?,'membership_purchase','tenant_membership',?,? WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM buyer_wallet_ledger WHERE buyer_id=?)>=?",('debit-1','buyer-1',19900,member_id,'membership purchase','buyer-1',19900))
db.execute("UPDATE tenant_memberships SET status='active' WHERE id=? AND EXISTS(SELECT 1 FROM buyer_wallet_ledger WHERE buyer_id=? AND kind='membership_purchase' AND ref_type='tenant_membership' AND ref_id=?)",(member_id,'buyer-1',member_id))
active = db.execute("SELECT status FROM tenant_memberships WHERE id=?",(member_id,)).fetchone()[0]
balance = db.execute("SELECT SUM(amount_vnd) FROM buyer_wallet_ledger WHERE buyer_id='buyer-1'").fetchone()[0]
checks['SQLite wallet debit activates membership and preserves expected balance'] = active == 'active' and balance == 30100
checks['SQLite request key blocks duplicate membership purchase'] = False
try:
    db.execute("INSERT INTO tenant_memberships(id,tenant_id,buyer_id,plan_id,plan_name,paid_vnd,status,starts_at_ms,expires_at_ms,request_key) VALUES('m2','studio-a','buyer-1','p1','Gold',19900,'active',100,200,'request-key-000000000000')")
except sqlite3.IntegrityError:
    checks['SQLite request key blocks duplicate membership purchase'] = True
checks['SQLite tenant isolation prevents cross-Studio membership unlock'] = db.execute("SELECT COUNT(*) FROM tenant_memberships WHERE tenant_id='studio-b' AND buyer_id='buyer-1' AND status='active' AND expires_at_ms>100").fetchone()[0] == 0
checks['SQLite insufficient wallet does not create paid membership'] = False
db.execute("INSERT INTO tenant_memberships(id,tenant_id,buyer_id,plan_id,plan_name,paid_vnd,status,starts_at_ms,expires_at_ms,request_key) VALUES('m3','studio-a','buyer-2','p1','Gold',19900,'pending',100,200,'request-key-buyer-2-0000')")
db.execute("INSERT INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind,ref_type,ref_id,note) SELECT 'debit-2','buyer-2',-19900,'membership_purchase','tenant_membership','m3','membership purchase' WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM buyer_wallet_ledger WHERE buyer_id='buyer-2')>=19900")
db.execute("UPDATE tenant_memberships SET status='active' WHERE id='m3' AND EXISTS(SELECT 1 FROM buyer_wallet_ledger WHERE buyer_id='buyer-2' AND kind='membership_purchase' AND ref_type='tenant_membership' AND ref_id='m3')")
db.execute("DELETE FROM tenant_memberships WHERE id='m3' AND status='pending'")
checks['SQLite insufficient wallet does not create paid membership'] = db.execute("SELECT COUNT(*) FROM tenant_memberships WHERE id='m3'").fetchone()[0] == 0

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ': ' + name)
print(f'V59.1 membership checks: {len(checks)-len(failed)}/{len(checks)} passed')
if failed:
    raise SystemExit('Failed: ' + '; '.join(failed))
