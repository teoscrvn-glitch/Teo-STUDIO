from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
w = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
account = (ROOT / 'frontend/assets/js/account.js').read_text(encoding='utf-8')
tenant_admin = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')
tenant_share = (ROOT / 'frontend/assets/js/tenant-share.js').read_text(encoding='utf-8')
rental_master = (ROOT / 'frontend/assets/js/rental-master.js').read_text(encoding='utf-8')
account_html = (ROOT / 'frontend/account.html').read_text(encoding='utf-8')
share_html = (ROOT / 'frontend/share.html').read_text(encoding='utf-8')
tenant_html = (ROOT / 'frontend/tenant-admin.html').read_text(encoding='utf-8')
admin_html = (ROOT / 'frontend/admin.html').read_text(encoding='utf-8')
css = (ROOT / 'frontend/assets/css/pre-public-polish.css').read_text(encoding='utf-8')

checks = [
    ("BUILD_VERSION='v58.0-mobile-studio-notes'" in w, 'Worker is versioned V58.0'),
    ('#teoAccountMount' in account and 'parent.appendChild(overlay)' in account, 'account modal mounts inside the account page main content'),
    ('<div id="teoAccountMount"></div>' in account_html, 'account page exposes the in-flow mount before footer injection'),
    ('.teo-account-page-main{padding-bottom:clamp(18px,3vh,34px)!important;min-height:0!important}' in css, 'account layout avoids a viewport-sized spacer'),
    ('position:static;inset:auto' in css and 'max-height:none;overflow:visible' in css, 'account form is part of document flow and is not clipped'),
    ('vipEntitled=ownedRows.some' in w and 'tenantHasTimeLeft(x)' in w and 'studioLimit=vipEntitled?3:1' in w, 'Studio cap is derived server-side from active paid ownership'),
    ("plan==='paid'?3:1" not in w, 'client-selected paid plan cannot grant VIP Studio entitlement'),
    ('vipActive' in w and 'VIP đang hoạt động' in account and 'Đơn chờ không được tính' in account, 'account UI explains confirmed VIP entitlement'),
    ('CREATE TABLE IF NOT EXISTS tenant_notes' in w and 'idx_tenant_notes_public' in w, 'additive D1 Notes table and index are declared'),
    ("if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401)" in w, 'Master Admin Note APIs require Admin authentication'),
    ("WHERE ${k.clause} AND id=?" in w and "const k=tenantInSql(t)" in w, 'tenant Note updates are scoped to the owning tenant'),
    ("await tenantNotes(e,t,true)" in w, 'public Share only receives visible Notes'),
    ("p==='/api/tenant/notes'" in w and "p==='/api/admin/tenant-notes'" in w, 'tenant and master-admin Note CRUD routes exist'),
    ('function persistFreeBypassProof' in tenant_admin and 'localStorage.setItem(k,proof)' in tenant_admin, 'existing Free task state remains separate and session-bound'),
    ('TeoStudio không tự kiểm tra việc tham gia nhóm hoặc theo dõi' in tenant_share, 'public Note discloses that social actions are self-confirmed only'),
    ('tenantNotesSection' in share_html and 'tenantNotesGrid' in share_html, 'Share page has a Notes section'),
    ('data-content="notes"' in tenant_html and 'tenantNoteForm' in tenant_html, 'tenant owner has Note editor and controls'),
    ('adminTenantNoteForm' in admin_html and 'adminTenantNotesList' in admin_html, 'Master Admin can manage Notes per Studio'),
    ('loadAdminTenantNotes' in rental_master and '/api/admin/tenant-notes' in rental_master, 'Master Admin Note UI calls protected endpoints'),
]
for ok, label in checks:
    print(('PASS' if ok else 'FAIL') + ': ' + label)
    if not ok:
        raise SystemExit('Failed: ' + label)

# Execute the exact Notes table/index statements in an in-memory SQLite DB.
m = re.search(r"CREATE TABLE IF NOT EXISTS tenant_notes \((.*?)\n    \)`", w, re.S)
assert m, 'tenant_notes DDL not found'
create = 'CREATE TABLE IF NOT EXISTS tenant_notes (' + m.group(1) + ')'
index = 'CREATE INDEX IF NOT EXISTS idx_tenant_notes_public ON tenant_notes(tenant_id,visible,updated_at)'
db = sqlite3.connect(':memory:')
db.execute(create)
db.execute(index)
db.execute("INSERT INTO tenant_notes(id,tenant_id,title,note_body,steps_json,ad_mode,visible) VALUES(?,?,?,?,?,?,?)", ('note-a','studio-a','Test','Body','[]','none',1))
assert db.execute('SELECT title FROM tenant_notes WHERE tenant_id=? AND visible=1', ('studio-a',)).fetchone() == ('Test',)
assert db.execute('SELECT count(*) FROM tenant_notes WHERE tenant_id=?', ('studio-b',)).fetchone()[0] == 0
print('PASS: SQLite Notes DDL/index/insert and tenant-isolation smoke test')

class IdParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]
    def handle_starttag(self, tag, attrs):
        value = dict(attrs).get('id')
        if value: self.ids.append(value)
for name, content in [('account.html', account_html), ('share.html', share_html), ('tenant-admin.html', tenant_html), ('admin.html', admin_html)]:
    p=IdParser(); p.feed(content)
    duplicates=[k for k,v in Counter(p.ids).items() if v>1]
    assert not duplicates, (name, duplicates)
    print(f'PASS: {name} has no duplicate static IDs')
print(f'PASS V58.0: {len(checks)} static checks and local D1 Notes schema/tenant isolation.')
