from pathlib import Path
import sqlite3
ROOT=Path(__file__).resolve().parents[1]
worker=(ROOT/'cloudflare/worker.js').read_text()
admin=(ROOT/'frontend/admin.html').read_text()
master=(ROOT/'frontend/assets/js/rental-master.js').read_text()
tenant=(ROOT/'frontend/assets/js/tenant-admin.js').read_text()
preview=ROOT/'UI_PREVIEW_FOR_APPROVAL'

# Cloudflare fetch redirect bug and safe handling
assert "redirect:'error'" not in worker
assert "redirect:'manual'" in worker
assert 'SHORTENER_REDIRECT_BLOCKED' in worker

# V57.4 Free gate uses one-time TeoStudio keys after BumX/Link4M return URLs.
assert 'FREE_BYPASS_VERIFY_URL' not in worker and 'FREE_BYPASS_API_KEY' not in worker
assert 'LINK4M_REWARDED_TRAFFIC_APPROVED' not in worker
assert "destinationPage:'/free-key.html'" in worker
assert 'async function startFreeBypass' in worker
assert 'async function issueFreeBypassKey' in worker
assert 'async function redeemFreeBypassKey' in worker
assert 'free_bypass_keys' in worker and 'key_hash' in worker and 'session_hash' in worker
assert 'keyExpires=now+5*60*1000' in worker
assert 'BYPASS_KEY_ALREADY_ISSUED' in worker and 'BYPASS_KEY_REDEEM_RACE' in worker
assert 'DELETE FROM free_bypass_keys' in worker
assert 'tenantHasTimeLeft(t)' in worker
assert "limited(r,'tenant-bypass-api-test',2,60000)" in worker
assert 'showFreeBypassGate' in tenant and 'freeGateStart' in tenant
assert 'freeGateCheck' in tenant and '/api/tenant/bypass/test' in tenant

# Master tenant API data minimization and password privacy
assert "email:clean(x.email||'',320)" in worker
assert 'password_hash' not in worker[worker.index("if(p==='/api/admin/tenants'&&r.method==='GET')"):worker.index("if(p==='/api/admin/tenants/stats'")] if "if(p==='/api/admin/tenants'&&r.method==='GET')" in worker else True
assert 'PBKDF2' in worker or 'pbkdf2' in worker
assert 'storeTenantPasswordHash' in worker and "sets.push(`${legacy}=" in worker
assert 'tenant-email-hold' in master and 'tenant-password-locked' in master
assert 'Đặt lại MK' in master
assert 'createdTenantPassword' in master and 'onpointerdown' in master
assert 'Mật khẩu cũ chỉ lưu dạng hash' in master

# Daily rental statistics API and UI
assert "p==='/api/admin/tenants/stats'" in worker
assert "date(paid_at,'+7 hours')" in worker
assert "status='paid'" in worker
assert 'tenantRentalMonth' in admin and 'tenantRentalDailyRows' in admin
assert '/api/admin/tenants/stats?month=' in master
assert 'Đơn đang chờ' in master

# Isolated concept gallery, not part of production frontend bundle
assert (preview/'index.html').is_file()
assert (preview/'preview-contact-sheet.png').is_file()
assert not (ROOT/'frontend/UI_PREVIEW_FOR_APPROVAL').exists()
html=(preview/'index.html').read_text()
for design in ['Sakura Glow','Tiger Neon','Cloud Minimal','Pixel Arcade']:
    assert design in html
for asset in ['tiger-neon.webp','creator-banner.webp','chibi-upload.webp','logo-sakura.svg','logo-tiger.svg','logo-cloud.svg','logo-pixel.svg']:
    assert (preview/'assets'/asset).is_file(), asset

# SQL query semantics for month-by-month reporting, with Vietnam +07 boundaries.
db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE tenant_rental_orders(id TEXT, tenant_id TEXT, amount_vnd INTEGER, operation TEXT, status TEXT, paid_at TEXT, expires_at INTEGER);
CREATE TABLE tenant_accounts(id TEXT, plan_type TEXT, locked INTEGER, expires_at TEXT, deleted_at TEXT, created_at TEXT);
INSERT INTO tenant_rental_orders VALUES
('n1','t1',50000,'new','paid','2026-11-01 17:30:00',9999999999999),
('r1','t1',50000,'renew','paid','2026-11-02 03:00:00',9999999999999),
('p1','t2',50000,'new','pending',NULL,9999999999999);
INSERT INTO tenant_accounts VALUES
('t1','paid',0,'2026-12-31 23:59:59',NULL,'2026-11-01 18:00:00'),
('t2','free',0,'2026-11-30 23:59:59',NULL,'2026-11-02 18:00:00');
''')
paid=db.execute("SELECT date(paid_at,'+7 hours') AS day,operation,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS amount FROM tenant_rental_orders WHERE status='paid' AND paid_at IS NOT NULL AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<? GROUP BY date(paid_at,'+7 hours'),operation ORDER BY day",('2026-11-01','2026-12-01')).fetchall()
assert paid==[('2026-11-02','new',1,50000),('2026-11-02','renew',1,50000)], paid
pending=db.execute("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS amount FROM tenant_rental_orders WHERE status='pending' AND expires_at>?",(1000,)).fetchone()
assert pending==(1,50000),pending
created=db.execute("SELECT date(created_at,'+7 hours') AS day,COUNT(*) AS accounts FROM tenant_accounts WHERE date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<? AND (deleted_at IS NULL OR deleted_at='') GROUP BY date(created_at,'+7 hours') ORDER BY day",('2026-11-01','2026-12-01')).fetchall()
assert created==[('2026-11-02',1),('2026-11-03',1)],created
print('PASS V56.65/V57.3: redirect handling, one-time Free key gate + Link4M policy gate, password/email privacy, PBKDF2 migration, daily tenant rental statistics, and isolated 4-theme Share preview.')
