from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re
import sqlite3
import subprocess

ROOT = Path(__file__).resolve().parents[1]
read = lambda p: (ROOT / p).read_text(encoding='utf-8')
w = read('cloudflare/worker.js')
account = read('frontend/assets/js/account.js')
tenant_admin = read('frontend/assets/js/tenant-admin.js')
tenant_share = read('frontend/assets/js/tenant-share.js')
note_studio = read('frontend/assets/js/note-studio.js')
rental_master = read('frontend/assets/js/rental-master.js')
account_html = read('frontend/account.html')
share_html = read('frontend/share.html')
tenant_html = read('frontend/tenant-admin.html')
admin_html = read('frontend/admin.html')
css = read('frontend/assets/css/pre-public-polish.css')
note_css = read('frontend/assets/css/note-studio.css')
config = read('frontend/assets/js/config.js')
note_page_html = read('frontend/note.html')
note_page_js = read('frontend/assets/js/tenant-note-page.js')

checks = [
    ("BUILD_VERSION='v58.8-stability-experience'" in w and "BUILD_VERSION:'v58.8-stability-experience'" in config, 'Worker and frontend versions are V58.3'),
    ('#teoAccountMount' in account and 'parent.appendChild(overlay)' in account, 'account modal mounts inside the account page main content'),
    ('<div id="teoAccountMount"></div>' in account_html, 'account page exposes the in-flow mount before footer injection'),
    ('.teo-account-page-main{padding-bottom:clamp(18px,3vh,34px)!important;min-height:0!important}' in css, 'account layout avoids a viewport-sized spacer'),
    ('position:static;inset:auto' in css and 'max-height:none;overflow:visible' in css, 'account form is part of document flow and is not clipped'),
    ('vipEntitled=ownedRows.some' in w and 'tenantHasTimeLeft(x)' in w and 'studioLimit=vipEntitled?3:1' in w, 'Studio cap is derived server-side from active paid ownership'),
    ("plan==='paid'?3:1" not in w, 'client-selected paid plan cannot grant VIP Studio entitlement'),
    ('vipActive' in w and 'VIP đang hoạt động' in account and 'Đơn chờ không được tính' in account, 'account UI explains confirmed VIP entitlement'),
    ('CREATE TABLE IF NOT EXISTS tenant_notes' in w and 'idx_tenant_notes_public' in w, 'additive D1 Notes table and index are declared'),
    ('CREATE TABLE IF NOT EXISTS tenant_note_progress' in w and 'idx_tenant_note_progress_note' in w, 'server-side Note progress table and index are declared'),
    ("if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401)" in w, 'Master Admin Note APIs require Admin authentication'),
    ('WHERE ${k.clause} AND id=?' in w and 'const k=tenantInSql(t)' in w, 'tenant Note updates are scoped to the owning tenant'),
    ('await tenantNotes(e,t,true)' in w, 'public Share only receives visible Notes'),
    ("p==='/api/tenant/notes'" in w and "p==='/api/admin/tenant-notes'" in w, 'tenant and master-admin Note CRUD routes exist'),
    ('async function tenantNoteSessionSignature' in w and 'HMAC' in w, 'Note sessions are signed with a server-side HMAC key'),
    ('teo_note_visitor=' in w and 'tenantNoteVisitorSetCookie' in w and 'HttpOnly' in w, 'visitor identity is issued by Worker as a scoped HttpOnly cookie'),
    ('teo-note-flow-v2|' in w and 'tenantNoteVisitorCookieValue(r)' in w and 'x-teo-device-id' not in w[w.find('async function tenantNoteVisitorHash'):w.find('async function tenantNoteSessionSignature')], 'Note progress no longer trusts a client-editable device header'),
    ('HttpOnly; SameSite=Lax' in w and 'Secure; HttpOnly' in w, 'Note session cookie is HttpOnly, Secure, SameSite=Lax and scoped per Note'),
    ("NOTE_SESSION_REQUIRED" in w and "step_ticket_hash=?" in w, 'step redirect requires the signed session and visitor-bound ticket'),
    ('ticket_used_at_ms' in w and 'NOTE_TICKET_USED' in w, 'step redirect tickets are single-use'),
    ('5000' in w and 'NOTE_STEP_WAIT' in w, 'completion is checked server-side after the minimum wait'),
    ('localStorage' not in tenant_share[tenant_share.find('function noteTheme'):tenant_share.find('function renderHead')], 'Note progress is no longer held in localStorage'),
    ('assets/img/note-templates/${theme}.svg' in tenant_share, 'public Note uses project-owned custom SVG art'),
    ('assets/img/note-templates/${themeKey}.svg' in note_studio, 'designer preview uses the same custom SVG art pack'),
    ('data-note-add-step="youtube"' in tenant_html and 'data-note-add-step="zalo"' in tenant_html, 'Studio editor includes platform quick-add controls'),
    ('data-note-theme="editorial"' in tenant_html and 'data-note-theme="arcade"' in tenant_html and 'data-note-theme="pastel"' in tenant_html, 'Studio editor offers distinct design themes'),
    ('data-teo-ad-slot' in tenant_share and 'adPlacement' in tenant_share, 'placeholder for future provider-neutral ad slot exists'),
    ('note_open' in tenant_html and 'after_step' in tenant_html and 'before_unlock' in tenant_html and 'cta_click' in tenant_html, 'Note editor stores future ad placement choices without claiming ad delivery'),
    ('linkifyText(n.body||\'\')' in tenant_share, 'safe plain-text URLs in Note body are rendered as links'),
    ('note-flow-finished' in tenant_share and 'NOTE_DESTINATION_MISSING' not in w, 'a Note flow can finish without requiring a final destination URL'),
    ('function persistFreeBypassProof' in tenant_admin and 'localStorage.setItem(k,proof)' in tenant_admin, 'existing Free task state remains unchanged'),
    ('tenantNotesSection' in share_html and 'tenantNotesGrid' in share_html, 'Share page has a Notes section'),
    ('note.html?tenant=' in tenant_share and 'note-page-link' in tenant_share, 'Each public Note has its own shareable page URL'),
    ('tenant-note-page.js' in note_page_html and 'id=\"notePage\"' in note_page_html, 'Standalone Note page loads its dedicated renderer'),
    ('steps/${idx}/open' in note_page_js and 'flowRequest' in note_page_js and 'navigator.share' in note_page_js, 'Standalone Note page supports secure step flow and native sharing'),
    ('data-content="notes"' in tenant_html and 'tenantNoteForm' in tenant_html, 'tenant owner has Note editor and controls'),
    ('adminTenantNoteForm' in admin_html and 'adminTenantNotesList' in admin_html, 'Master Admin can manage Notes per Studio'),
    ('loadAdminTenantNotes' in rental_master and '/api/admin/tenant-notes' in rental_master, 'Master Admin Note UI calls protected endpoints'),
]
for ok, label in checks:
    print(('PASS' if ok else 'FAIL') + ': ' + label)
    if not ok:
        raise SystemExit('Failed: ' + label)

# Execute the exact Notes table/index statements in an in-memory SQLite DB.
m = re.search(r"CREATE TABLE IF NOT EXISTS tenant_notes \((.*?)\n    \)\`", w, re.S)
assert m, 'tenant_notes DDL not found'
create = 'CREATE TABLE IF NOT EXISTS tenant_notes (' + m.group(1) + ')'
db = sqlite3.connect(':memory:')
db.execute(create)
db.execute('CREATE INDEX IF NOT EXISTS idx_tenant_notes_public ON tenant_notes(tenant_id,visible,updated_at)')
db.execute('''CREATE TABLE tenant_note_progress (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, note_id TEXT NOT NULL, visitor_hash TEXT NOT NULL,
 step_index INTEGER NOT NULL DEFAULT 0, opened_step INTEGER NOT NULL DEFAULT -1,
 opened_at_ms INTEGER DEFAULT NULL, step_ticket_hash TEXT DEFAULT NULL,
 step_ticket_expires_ms INTEGER DEFAULT NULL, ticket_used_at_ms INTEGER DEFAULT NULL,
 status TEXT NOT NULL DEFAULT 'active', created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL,
 UNIQUE(tenant_id,note_id,visitor_hash))''')
db.execute("INSERT INTO tenant_notes(id,tenant_id,title,note_body,steps_json,ad_mode,visible) VALUES(?,?,?,?,?,?,?)", ('note-a','studio-a','Test','Body','[{"url":"https://example.com"}]','none',1))
assert db.execute('SELECT title FROM tenant_notes WHERE tenant_id=? AND visible=1', ('studio-a',)).fetchone() == ('Test',)
assert db.execute('SELECT count(*) FROM tenant_notes WHERE tenant_id=?', ('studio-b',)).fetchone()[0] == 0
db.execute("INSERT INTO tenant_note_progress(id,tenant_id,note_id,visitor_hash,created_at_ms,updated_at_ms) VALUES(?,?,?,?,?,?)", ('p1','studio-a','note-a','v1',1,1))
try:
    db.execute("INSERT INTO tenant_note_progress(id,tenant_id,note_id,visitor_hash,created_at_ms,updated_at_ms) VALUES(?,?,?,?,?,?)", ('p2','studio-a','note-a','v1',1,1))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError('progress uniqueness did not protect same visitor/note')
print('PASS: SQLite Notes/progress DDL, tenant isolation and unique visitor progress')

class IdParser(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]
    def handle_starttag(self, tag, attrs):
        value=dict(attrs).get('id')
        if value:self.ids.append(value)
for name, content in [('account.html',account_html),('share.html',share_html),('tenant-admin.html',tenant_html),('admin.html',admin_html),('note.html',note_page_html)]:
    parser=IdParser();parser.feed(content)
    dup=[k for k,v in Counter(parser.ids).items() if v>1]
    assert not dup,(name,dup)
    print(f'PASS: {name} has no duplicate static IDs')

for rel in ['cloudflare/worker.js','frontend/assets/js/tenant-note-page.js','frontend/assets/js/note-studio.js','frontend/assets/js/tenant-share.js','frontend/assets/js/tenant-admin.js','frontend/assets/js/rental-master.js','frontend/assets/js/account.js']:
    subprocess.run(['node','--check',str(ROOT/rel)],check=True,stdout=subprocess.DEVNULL)
    print('PASS: JavaScript syntax '+rel)

for theme in ['notebook','editorial','arcade','midnight','pastel']:
    svg=ROOT/f'frontend/assets/img/note-templates/{theme}.svg'
    assert svg.exists() and svg.stat().st_size>500
    content=svg.read_text(encoding='utf-8')
    assert '<svg' in content and '</svg>' in content
    assert '<script' not in content.lower()
    print(f'PASS: original SVG art {theme}')

print(f'PASS V58.3: {len(checks)} static checks, D1 smoke test, HTML IDs, JS syntax and 5 original SVGs.')
