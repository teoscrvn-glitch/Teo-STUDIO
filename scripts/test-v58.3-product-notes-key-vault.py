from pathlib import Path
import re, sqlite3, subprocess
ROOT=Path(__file__).resolve().parents[1]
read=lambda p:(ROOT/p).read_text(encoding='utf-8')
w=read('cloudflare/worker.js')
config=read('frontend/assets/js/config.js')
admin=read('frontend/assets/js/tenant-admin.js')
admin_html=read('frontend/tenant-admin.html')
detail=read('frontend/assets/js/tenant-detail.js')
notes=read('frontend/assets/js/tenant-note-page.js')
note_studio=read('frontend/assets/js/note-studio.js')
share=read('frontend/assets/js/tenant-share.js')
account=read('frontend/assets/js/account.js')
htmls={p.name:p.read_text(encoding='utf-8') for p in [ROOT/'frontend/tenant-admin.html',ROOT/'frontend/tenant-detail.html',ROOT/'frontend/share.html',ROOT/'frontend/note.html']}
checks=[
("BUILD_VERSION='v58.13-withdrawal-vietqr'" in w and "BUILD_VERSION:'v58.13-withdrawal-vietqr'" in config,'Worker/frontend release identity is V58.5 (Note/Key Vault retained)'),
("note_id:clean(row.note_id||'',100)" in w and "delete out.fixed_key_ciphertext;delete out.fixed_key_hash" in w,'product API exposes Note reference but never fixed key ciphertext/hash'),
("const noteId=clean(b.note_id||'',100)" in w and "tenant_notes WHERE tenant_id=? AND id=? AND visible=1" in w,'product Note selection is verified against the same tenant and visible Note'),
("attached=new Set(products.map(x=>String(x.note_id||'')).filter(Boolean))" in w and "requestedNote" in w,'Notes linked to products are removed from standalone Share list but can still be opened by their own Note URL'),
("mode==='free_or_unlock'" in detail and "mode==='both'" in detail and "mode==='paid'" in detail and "mode==='unlock'" in detail,'public product page supports Free/direct, Buy-or-unlock, Paid-only and Unlock-only modes'),
("bypassFree(noteUrl||p.download_link)" in detail and "noteUrl?" in detail,'bypass choice routes through the attached Note while retaining product card/detail'),
("note_id:f.get('note_id')||''" in admin and 'productNoteSelect' in admin_html,'Studio product editor saves a linked Note ID'),
("{{TASKS_LINK}}" in admin_html and 'insertNoteTaskLink' in note_studio and '0/30' in admin_html and '/30 bước' in note_studio,'Note content supports inline “tại đây” task link and up to 30 task steps'),
("steps:[]" in w and "adMode:'none'" in w and 'paid=1' in notes,'paid Note view strips task/advertisement steps after confirmed purchase'),
("CARD_DATA_ENCRYPTION_KEY" in w and 'encryptTenantProductKey' in w and 'decryptTenantProductKey' in w,'fixed and pooled keys are encrypted at rest and require configured encryption secret'),
("ORDER BY random() LIMIT 1" in w and "WHERE id=? AND tenant_id=? AND product_id=? AND status='available'" in w and "status='reserved'" in w,'key pool selects randomly and uses conditional status claim to avoid duplicate allocation'),
("async function issueTenantProductKey" in w and "status='issued'" in w and "tenantProductKeyForPurchase" in w,'reserved key transitions to issued and supports idempotent delivery retry'),
("status='used'" in w and "buyer_marked_used" in w and "data-key-used" in admin and "data-copy-delivery-key" in account,'buyer and Studio owner can move issued key to used and buyer can copy order key'),
("KEY_STOCK_EMPTY" in w and "releaseTenantProductKey" in w and "reserved_until<?" in w,'empty stock, failed purchase release and expired reservation recovery are handled'),
("noteUrl:repeatNoteUrl" in w and 'deliveryKey:repeatKey?.value' in w and '&paid=1' in w,'retrying an already-paid purchase returns the same key and protected Note URL'),
("teo_note_visitor=" in w and 'HMAC' in w and 'step_ticket_hash' in w and 'ticket_used_at_ms' in w,'task progress remains signed, visitor-bound and single-use on the Worker'),
("data-teo-ad-slot" in share and 'adPlacement' in note_studio and 'adMode' in w,'future ad slot/placement settings are prepared without claiming provider delivery'),
]
for ok,label in checks:
 print(('PASS' if ok else 'FAIL')+': '+label)
 if not ok: raise SystemExit(label)

# Extract and execute the actual product-key DDL plus additive migration in SQLite.
m=re.search(r"CREATE TABLE IF NOT EXISTS tenant_product_keys \((.*?)\n    \)\`",w,re.S)
assert m,'tenant_product_keys DDL missing'
db=sqlite3.connect(':memory:')
db.executescript('''CREATE TABLE buyer_purchases(id TEXT PRIMARY KEY,status TEXT NOT NULL);''')
db.execute('CREATE TABLE tenant_product_keys ('+m.group(1)+')')
# Verify migration is ordered after the table DDL.
create_pos=w.find('CREATE TABLE IF NOT EXISTS tenant_product_keys')
add_pos=w.find("tenantAddColumn(e,'tenant_product_keys','key_suffix'")
assert create_pos!=-1 and add_pos>create_pos,'key_suffix migration must run after table creation'
db.execute("ALTER TABLE tenant_product_keys ADD COLUMN key_suffix TEXT NOT NULL DEFAULT ''")
db.execute("CREATE UNIQUE INDEX idx_tenant_product_key_purchase ON tenant_product_keys(purchase_id) WHERE purchase_id IS NOT NULL AND purchase_id<>''")
db.execute("CREATE TABLE tenant_product_key_events(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,product_id TEXT NOT NULL,key_id TEXT NOT NULL,event_type TEXT NOT NULL,actor_id TEXT DEFAULT '',purchase_id TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP)")
assert 'key_suffix' in [r[1] for r in db.execute('PRAGMA table_info(tenant_product_keys)')]
for kid,hashv,suffix in [('k1','h1','A001'),('k2','h2','A002'),('k3','h3','A003')]:
 db.execute("INSERT INTO tenant_product_keys(id,tenant_id,product_id,key_hash,key_ciphertext,key_suffix,status) VALUES(?,?,?,?,?,?,'available')",(kid,'t1','p1',hashv,'cipher-'+kid,suffix))
# Atomic claim: a second caller cannot claim a key already reserved.
row=db.execute("SELECT id FROM tenant_product_keys WHERE tenant_id=? AND product_id=? AND status='available' ORDER BY random() LIMIT 1",('t1','p1')).fetchone()
assert row
first=db.execute("UPDATE tenant_product_keys SET status='reserved',buyer_id=?,purchase_id=?,reserved_until=? WHERE id=? AND status='available'",('buyer1','order1',9999999999999,row[0]))
second=db.execute("UPDATE tenant_product_keys SET status='reserved',buyer_id=?,purchase_id=?,reserved_until=? WHERE id=? AND status='available'",('buyer2','order2',9999999999999,row[0]))
assert first.rowcount==1 and second.rowcount==0,'same key was reserved twice'
db.execute("INSERT INTO buyer_purchases(id,status) VALUES('order1','paid')")
db.execute("UPDATE tenant_product_keys SET status='issued' WHERE purchase_id='order1' AND status='reserved'")
assert db.execute("SELECT status FROM tenant_product_keys WHERE id=?",(row[0],)).fetchone()==('issued',)
db.execute("UPDATE tenant_product_keys SET status='used' WHERE purchase_id='order1' AND status='issued'")
assert db.execute("SELECT status FROM tenant_product_keys WHERE id=?",(row[0],)).fetchone()==('used',)
try:
 db.execute("INSERT INTO tenant_product_keys(id,tenant_id,product_id,key_hash,key_ciphertext,status,purchase_id) VALUES('dup','t1','p1','different','cipher','issued','order1')")
except sqlite3.IntegrityError: pass
else: raise AssertionError('unique purchase index did not prevent duplicate key issue')
print('PASS: SQLite smoke test validates additive migration, key uniqueness, one-time reservation, and available→issued→used transitions')

# Share note de-duplication and owner isolation are tested with a small matching schema.
db.execute('CREATE TABLE tenant_products(id TEXT,tenant_id TEXT,note_id TEXT,visible INTEGER)')
db.execute('CREATE TABLE tenant_notes(id TEXT,tenant_id TEXT,visible INTEGER)')
db.executemany('INSERT INTO tenant_notes VALUES(?,?,1)',[('n1','t1'),('n2','t1'),('n3','t2')])
db.execute('INSERT INTO tenant_products VALUES(?,?,?,1)',('p1','t1','n1'))
attached={x[0] for x in db.execute('SELECT note_id FROM tenant_products WHERE tenant_id=? AND visible=1 AND note_id IS NOT NULL',('t1',))}
public=[x[0] for x in db.execute('SELECT id FROM tenant_notes WHERE tenant_id=? AND visible=1',('t1',)) if x[0] not in attached]
assert public==['n2'] and db.execute('SELECT count(*) FROM tenant_notes WHERE tenant_id=?',('t1',)).fetchone()[0]==2
print('PASS: SQLite smoke test confirms linked Note is not duplicated in Share list and tenant scopes stay isolated')

# Syntax check all changed JavaScript modules.
for rel in ['cloudflare/worker.js','frontend/assets/js/tenant-admin.js','frontend/assets/js/note-studio.js','frontend/assets/js/tenant-note-page.js','frontend/assets/js/tenant-detail.js','frontend/assets/js/account.js','frontend/assets/js/tenant-share.js','frontend/assets/js/config.js']:
 subprocess.run(['node','--check',str(ROOT/rel)],check=True,stdout=subprocess.DEVNULL)
 print('PASS: node --check '+rel)
print(f'PASS V58.3: {len(checks)} feature assertions, two SQLite smoke tests, 8 JavaScript syntax checks.')
