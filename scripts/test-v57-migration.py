import sqlite3
from pathlib import Path

sql = Path("migrations/20261104_legal_rights.sql").read_text()
db = sqlite3.connect(":memory:")
db.executescript(sql)
# The same document version is unique per account; OR IGNORE keeps replays idempotent.
db.execute("INSERT OR IGNORE INTO legal_acceptances(id,account_id,document_key,document_version) VALUES(?,?,?,?)", ("a1", "u1", "terms", "2026-11-04-v1.0"))
db.execute("INSERT OR IGNORE INTO legal_acceptances(id,account_id,document_key,document_version) VALUES(?,?,?,?)", ("a2", "u1", "terms", "2026-11-04-v1.0"))
db.execute("INSERT INTO legal_acceptances(id,account_id,document_key,document_version) VALUES(?,?,?,?)", ("a3", "u1", "privacy-notice", "2026-11-04-v1.0"))
db.execute("INSERT INTO privacy_rights_requests(id,account_id,request_type,message) VALUES(?,?,?,?)", ("r1", "u1", "access", "Please provide my account data"))
assert db.execute("SELECT COUNT(*) FROM legal_acceptances WHERE account_id='u1'").fetchone()[0] == 2
assert db.execute("SELECT status FROM privacy_rights_requests WHERE id='r1'").fetchone()[0] == 'received'
assert db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name IN ('idx_legal_acceptances_account','idx_privacy_requests_status','idx_privacy_requests_account')").fetchone()[0] == 3
print("PASS: legal migration creates D1 tables/indexes and acceptance deduplication works")
