import sqlite3
import uuid

c = sqlite3.connect(':memory:')
c.executescript('''
CREATE TABLE card_redemptions(id TEXT PRIMARY KEY,actor_type TEXT NOT NULL,actor_id TEXT NOT NULL,request_key TEXT NOT NULL,telco TEXT NOT NULL,face_vnd INTEGER NOT NULL,debit_vnd INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'processing',provider_order_code TEXT DEFAULT NULL,cards_ciphertext TEXT DEFAULT NULL,error_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')),UNIQUE(actor_type,actor_id,request_key));
CREATE TABLE seller_wallet_ledger(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,available_at TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_seller_wallet_once ON seller_wallet_ledger(seller_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE tenant_wallet_ledger(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT NOT NULL,ref_id TEXT NOT NULL,note TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),UNIQUE(ref_type,ref_id,kind));
CREATE TABLE card_topups(id TEXT PRIMARY KEY,request_id TEXT NOT NULL UNIQUE,buyer_id TEXT NOT NULL,telco TEXT NOT NULL,face_vnd INTEGER NOT NULL,member_rate REAL NOT NULL,card_fingerprint TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE buyer_wallet_ledger(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_buyer_wallet_once ON buyer_wallet_ledger(buyer_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE tenant_accounts(id TEXT PRIMARY KEY,plan_type TEXT,free_bypass_count INTEGER,free_admin_unlocked INTEGER,expires_at TEXT,starts_at TEXT);
CREATE TABLE free_bypass_attempts(id TEXT PRIMARY KEY,tenant_id TEXT,step INTEGER,status TEXT,expires_at INTEGER,verified_at TEXT);
''')

# Reserve a 100,000 VND card: exact 105% debit; ledger balance is now 95,000.
c.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,note) VALUES('seed','s1',200000,'sale','seed')")
ins_redemption = """INSERT INTO card_redemptions(id,actor_type,actor_id,request_key,telco,face_vnd,debit_vnd,status)
SELECT ?,?,?,?,?,?,?,'processing'
WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM seller_wallet_ledger WHERE seller_id=? AND (available_at IS NULL OR available_at<=datetime('now'))) >= ?
AND (SELECT COUNT(*) FROM card_redemptions WHERE actor_type=? AND actor_id=? AND created_at>=datetime('now','-1 hour'))<2"""
ins_reserve = """INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note)
SELECT ?,?,-?,'card_withdrawal_reserve','card_redemption',?,'reserve'
WHERE EXISTS(SELECT 1 FROM card_redemptions WHERE id=? AND status='processing')"""
redemption_id = str(uuid.uuid4())
debit = 100000 + round(100000 * .05)
c.execute(ins_redemption, (redemption_id,'seller','s1','request_key_000001','VINAPHONE',100000,debit,'s1',debit,'seller','s1'))
c.execute(ins_reserve, (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id))
assert c.execute("SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='s1'").fetchone()[0] == 95000
assert debit == 105000

# Explicit provider failure refunds once; repeating the reversal cannot duplicate credit.
c.execute("UPDATE card_redemptions SET status='failed' WHERE id=? AND status='processing'", (redemption_id,))
refund_sql = """INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note)
SELECT ?,?,?, 'card_withdrawal_reversal','card_redemption',?,'refund'
WHERE EXISTS(SELECT 1 FROM card_redemptions WHERE id=? AND status='failed')"""
refund = (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id)
c.execute(refund_sql, refund)
c.execute(refund_sql, (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id))
assert c.execute("SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='s1'").fetchone()[0] == 200000

# D1-style persistent caps: max 2 cash-out requests/hour, max 3 card top-ups/minute.
for n in range(2):
    rid = str(uuid.uuid4())
    c.execute(ins_redemption, (rid,'seller','s1',f'key_{n}_1234567890','VINAPHONE',10000,10500,'s1',10500,'seller','s1'))
third = c.execute(ins_redemption, (str(uuid.uuid4()),'seller','s1','key_3_1234567890','VINAPHONE',10000,10500,'s1',10500,'seller','s1')).rowcount
assert third == 0
ins_topup = """INSERT INTO card_topups(id,request_id,buyer_id,telco,face_vnd,member_rate,card_fingerprint,status)
SELECT ?,?,?,?,?,?,?,'pending'
WHERE (SELECT COUNT(*) FROM card_topups WHERE buyer_id=? AND created_at>=datetime('now','-1 minute'))<3"""
for n in range(3):
    c.execute(ins_topup, (str(uuid.uuid4()),str(uuid.uuid4()),'b1','VINAPHONE',10000,17.3,f'fp{n}','b1'))
assert c.execute(ins_topup, (str(uuid.uuid4()),str(uuid.uuid4()),'b1','VINAPHONE',10000,17.3,'fp3','b1')).rowcount == 0

# One-time wallet credit despite duplicate callback processing.
c.execute("INSERT INTO buyer_wallet_ledger VALUES('credit1','b1',8000,'card_topup','card_topup','topup1','credit',datetime('now'))")
c.execute("INSERT OR IGNORE INTO buyer_wallet_ledger VALUES('credit2','b1',8000,'card_topup','card_topup','topup1','duplicate',datetime('now'))")
assert c.execute("SELECT COUNT(*) FROM buyer_wallet_ledger WHERE buyer_id='b1'").fetchone()[0] == 1

# Atomic Free-bypass claim: first call advances step; replay cannot advance the same step again.
c.execute("INSERT INTO tenant_accounts VALUES('t1','free',0,0,'2026-01-01',NULL)")
c.execute("INSERT INTO free_bypass_attempts(id,tenant_id,step,status,expires_at) VALUES('a1','t1',1,'pending',9999999999999)")
c.commit()
update_tenant = """UPDATE tenant_accounts SET free_bypass_count=?,free_admin_unlocked=?,expires_at=?,starts_at=COALESCE(starts_at,?)
WHERE id=? AND plan_type='free' AND COALESCE(free_bypass_count,0)=?
AND EXISTS(SELECT 1 FROM free_bypass_attempts WHERE id=? AND tenant_id=? AND step=? AND status='pending' AND expires_at>?)"""
mark_attempt = """UPDATE free_bypass_attempts SET status='verified',verified_at=datetime('now')
WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM tenant_accounts WHERE id=? AND COALESCE(free_bypass_count,0)=?)"""
c.execute('BEGIN')
a = c.execute(update_tenant, (1,0,'2026-01-03','2026-01-03','t1',0,'a1','t1',1,1)).rowcount
b = c.execute(mark_attempt, ('a1','t1',1)).rowcount
c.commit()
assert (a,b) == (1,1)
c.execute('BEGIN')
a = c.execute(update_tenant, (1,0,'2026-01-03','2026-01-03','t1',0,'a1','t1',1,1)).rowcount
b = c.execute(mark_attempt, ('a1','t1',1)).rowcount
c.commit()
assert (a,b) == (0,0)

print('PASS V56.67 SQLite smoke tests: 105% reserve, one-time reversal, persistent limits, duplicate callback credit prevention, and atomic Free-bypass claim.')
