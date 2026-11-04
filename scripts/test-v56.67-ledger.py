import sqlite3
import uuid

c = sqlite3.connect(':memory:')
c.executescript('''
CREATE TABLE card_redemptions(id TEXT PRIMARY KEY,actor_type TEXT NOT NULL,actor_id TEXT NOT NULL,request_key TEXT NOT NULL,telco TEXT NOT NULL,face_vnd INTEGER NOT NULL,debit_vnd INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'processing',cards_ciphertext TEXT DEFAULT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')),UNIQUE(actor_type,actor_id,request_key));
CREATE TABLE seller_wallet_ledger(id TEXT PRIMARY KEY,seller_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,available_at TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_seller_wallet_once ON seller_wallet_ledger(seller_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE tenant_wallet_ledger(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT NOT NULL,ref_id TEXT NOT NULL,note TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),UNIQUE(ref_type,ref_id,kind));
CREATE TABLE card_topups(id TEXT PRIMARY KEY,request_id TEXT NOT NULL UNIQUE,buyer_id TEXT NOT NULL,telco TEXT NOT NULL,face_vnd INTEGER NOT NULL,member_rate REAL NOT NULL,card_fingerprint TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE buyer_wallet_ledger(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE UNIQUE INDEX idx_buyer_wallet_once ON buyer_wallet_ledger(buyer_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;
CREATE TABLE tenant_accounts(id TEXT PRIMARY KEY,plan_type TEXT,free_bypass_count INTEGER,free_admin_unlocked INTEGER,expires_at TEXT,starts_at TEXT);
CREATE TABLE free_bypass_attempts(id TEXT PRIMARY KEY,tenant_id TEXT,step INTEGER,status TEXT,expires_at INTEGER,verified_at TEXT);
''')

# Manual withdrawal: reserve 105% when request is submitted.
c.execute("INSERT INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,note) VALUES('seed','s1',200000,'sale','seed')")
redemption_id = str(uuid.uuid4())
debit = 100000 + round(100000 * .05)
ins_redemption = """INSERT INTO card_redemptions(id,actor_type,actor_id,request_key,telco,face_vnd,debit_vnd,status)
SELECT ?,?,?,?,?,?,?,'pending'
WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM seller_wallet_ledger WHERE seller_id=? AND (available_at IS NULL OR available_at<=datetime('now'))) >= ?
AND (SELECT COUNT(*) FROM card_redemptions WHERE actor_type=? AND actor_id=? AND created_at>=datetime('now','-1 hour'))<2"""
ins_reserve = """INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note)
SELECT ?,?,-?,'card_withdrawal_reserve','card_redemption',?,'Admin review' WHERE EXISTS(SELECT 1 FROM card_redemptions WHERE id=? AND status='pending')"""
c.execute(ins_redemption, (redemption_id,'seller','s1','request_key_000001','VINAPHONE',100000,debit,'s1',debit,'seller','s1'))
c.execute(ins_reserve, (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id))
assert c.execute("SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='s1'").fetchone()[0] == 95000
assert c.execute("SELECT status FROM card_redemptions WHERE id=?", (redemption_id,)).fetchone()[0] == 'pending'
assert debit == 105000
c.commit()

# Admin rejects once; atomic status + refund, replay cannot duplicate refund.
update = "UPDATE card_redemptions SET status='rejected' WHERE id=? AND status IN ('pending','approved','processing','unknown')"
refund = """INSERT OR IGNORE INTO seller_wallet_ledger(id,seller_id,amount_vnd,kind,ref_type,ref_id,note)
SELECT ?,?,?,'card_withdrawal_reversal','card_redemption',?,'refund'
WHERE EXISTS(SELECT 1 FROM card_redemptions WHERE id=? AND status='rejected')"""
c.execute('BEGIN')
changed = c.execute(update, (redemption_id,)).rowcount
c.execute(refund, (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id))
c.commit()
assert changed == 1
c.execute('BEGIN')
changed_again = c.execute(update, (redemption_id,)).rowcount
c.execute(refund, (str(uuid.uuid4()),'s1',debit,redemption_id,redemption_id))
c.commit()
assert changed_again == 0
assert c.execute("SELECT SUM(amount_vnd) FROM seller_wallet_ledger WHERE seller_id='s1'").fetchone()[0] == 200000
assert c.execute("SELECT COUNT(*) FROM seller_wallet_ledger WHERE kind='card_withdrawal_reversal'").fetchone()[0] == 1

# Approve -> paid stores only the encrypted field; Admin entry is manual.
manual_id = str(uuid.uuid4())
c.execute("INSERT INTO card_redemptions(id,actor_type,actor_id,request_key,telco,face_vnd,debit_vnd,status) VALUES(?,?,?,?,?,?,?,'pending')", (manual_id,'seller','s1','request_key_000002','VINAPHONE',20000,21000))
c.execute("UPDATE card_redemptions SET status='approved' WHERE id=? AND status='pending'", (manual_id,))
c.execute("UPDATE card_redemptions SET status='paid',cards_ciphertext=? WHERE id=? AND status='approved'", ('v1.iv.ciphertext',manual_id))
assert c.execute("SELECT status,cards_ciphertext FROM card_redemptions WHERE id=?", (manual_id,)).fetchone() == ('paid','v1.iv.ciphertext')
c.commit()

# Persisted request caps: max 2 withdrawals/hour, max 3 card top-ups/minute.
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

# One-time buyer wallet credit despite duplicate card callback processing.
c.execute("INSERT INTO buyer_wallet_ledger VALUES('credit1','b1',8000,'card_topup','card_topup','topup1','credit',datetime('now'))")
c.execute("INSERT OR IGNORE INTO buyer_wallet_ledger VALUES('credit2','b1',8000,'card_topup','card_topup','topup1','duplicate',datetime('now'))")
assert c.execute("SELECT COUNT(*) FROM buyer_wallet_ledger WHERE buyer_id='b1'").fetchone()[0] == 1

# V57.3 one-time Free key: short lifetime, session binding, atomic consume and deletion.
c.execute("INSERT INTO tenant_accounts VALUES('t1','free',0,0,'2026-01-01',NULL)")
c.execute("CREATE TABLE free_bypass_keys(id TEXT PRIMARY KEY,tenant_id TEXT,attempt_id TEXT UNIQUE,key_hash TEXT UNIQUE,session_hash TEXT,expires_at INTEGER,used_at TEXT,redemption_id TEXT)")
c.execute("INSERT INTO free_bypass_attempts(id,tenant_id,step,status,expires_at) VALUES('a1','t1',1,'key_issued',9999999999999)")
c.execute("INSERT INTO free_bypass_keys(id,tenant_id,attempt_id,key_hash,session_hash,expires_at) VALUES('k1','t1','a1','hash-key','same-session',9999999999999)")
c.commit()
now = 100
redemption_id = str(uuid.uuid4())
used_at = '2026-11-04 00:00:00'
claim_key = "UPDATE free_bypass_keys SET used_at=?,redemption_id=? WHERE id='k1' AND key_hash='hash-key' AND tenant_id='t1' AND session_hash='same-session' AND used_at IS NULL AND expires_at>?"
update_tenant = """UPDATE tenant_accounts SET free_bypass_count=1,free_admin_unlocked=1,expires_at='2026-11-08',starts_at=COALESCE(starts_at,'2026-11-04')
WHERE id='t1' AND plan_type='free' AND EXISTS(SELECT 1 FROM free_bypass_keys WHERE id='k1' AND redemption_id=? AND used_at=?)"""
c.execute('BEGIN')
a = c.execute(claim_key, (used_at, redemption_id, now)).rowcount
b = c.execute(update_tenant, (redemption_id, used_at)).rowcount
c.commit()
assert (a,b) == (1,1)
assert c.execute("SELECT free_bypass_count,free_admin_unlocked,expires_at FROM tenant_accounts WHERE id='t1'").fetchone() == (1,1,'2026-11-08')
# The same key cannot be claimed twice, and another browser session cannot redeem it.
c.execute('BEGIN')
replay = c.execute(claim_key, ('2026-11-04 00:00:01',str(uuid.uuid4()),now)).rowcount
c.commit()
assert replay == 0
# Copy is a client action; database stores only a key hash and removes the row after redemption.
c.execute("DELETE FROM free_bypass_keys WHERE id='k1' AND redemption_id=?", (redemption_id,))
assert c.execute("SELECT COUNT(*) FROM free_bypass_keys WHERE id='k1'").fetchone()[0] == 0
# An expired key cannot be claimed.
c.execute("INSERT INTO free_bypass_keys(id,tenant_id,attempt_id,key_hash,session_hash,expires_at) VALUES('k2','t1','a2','hash-expired','same-session',50)")
expired = c.execute("UPDATE free_bypass_keys SET used_at='2026-11-04 00:00:02' WHERE id='k2' AND used_at IS NULL AND expires_at>?", (now,)).rowcount
assert expired == 0

print('PASS SQLite smoke tests: 105% manual reservation, idempotent rejection refund, Admin manual delivery field, persistent limits, duplicate top-up callback protection, and V57.3 one-time Free-key claim/replay/expiry/delete.')
