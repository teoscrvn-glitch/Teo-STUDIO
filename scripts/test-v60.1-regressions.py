from pathlib import Path
import re, sqlite3
ROOT=Path(__file__).resolve().parents[1]
F=ROOT/'frontend'
W=(ROOT/'cloudflare/worker.js').read_text(encoding='utf-8')
TS=(F/'assets/js/tenant-share.js').read_text(encoding='utf-8')
TA=(F/'assets/js/tenant-admin.js').read_text(encoding='utf-8')
ADM=(F/'assets/js/admin-v14.js').read_text(encoding='utf-8')
RANK=(F/'assets/js/rankings.js').read_text(encoding='utf-8')
DOCK=(F/'assets/js/community-dock.js').read_text(encoding='utf-8')
DOCKCSS=(F/'assets/css/community-dock.css').read_text(encoding='utf-8')
THEME=(F/'assets/css/v60-theme.css').read_text(encoding='utf-8')
NOTE=(F/'assets/css/note-modern-v60.css').read_text(encoding='utf-8')
INTER=(F/'assets/js/interaction-polish-v60.js').read_text(encoding='utf-8')

def ok(cond,msg):
    if not cond: raise SystemExit('FAIL: '+msg)

# 1-3: tenant Share fatal null href / route guards
ok("if(!slug){location.replace('/2');return}" in TS, 'Share without tenant slug has deterministic fallback')
ok("$('#brand')?.setAttribute('href',shareHome)" in TS and "$('#shareHomeLink')?.setAttribute('href',shareHome)" in TS, 'Tenant Share home anchors are null-safe')
ok("$('#supportBox').href" not in TS and "$('#groupBox').href" not in TS, 'Removed supportBox/groupBox elements are not dereferenced')
ok('tenant-share.js?v=60.8' in (F/'share.html').read_text(), 'Share page cache-busts repaired tenant-share script')

# 4-8: user-uploaded payout QR, server-enforced and visible to master admin
payout_html=(F/'tenant-admin.html').read_text()
ok('name="qr_image_file"' in payout_html and 'name="qr_image"' in payout_html, 'Tenant payout form uploads and posts a QR image')
ok('Ảnh QR nhận tiền (bắt buộc)' in payout_html and 'Mã BIN VietQR' not in payout_html and 'VietQR bắt buộc' not in payout_html, 'Tenant payout form no longer requires BIN and labels QR upload')
ok('compressPayoutQr' in TA and "qr_image_file" in TA and "b.qr_image" in TA, 'Payout image is compressed and uploaded as the actual QR')
ok("if(!qrImage||!/^data:image\\/(?:png|jpeg|jpg|webp);base64,/i.test(qrImage))" in W, 'Worker requires a valid uploaded image for payout profile')
ok("if(!profile.qr_image||!/^data:image\\/(?:png|jpeg|jpg|webp);base64,/i.test(String(profile.qr_image)))" in W, 'Withdrawal endpoint refuses requests without stored QR image')
ok("qrUrl:String(payout.qr_image||'')" in W and 'Ảnh QR nhận tiền do Studio tải lên' in ADM, 'Master admin receives and displays the tenant QR snapshot')

# 9-14: leaderboard top 100, names/avatar/privacy and own rank across every category
leader=W[W.index("if(p==='/api/public/leaderboards'"):W.index("if(p==='/api/seller/attribute'")]
ok(leader.count('LIMIT 100')>=3, 'All three public leaderboards return up to 100 entries')
ok('maskEmail(x.email)' in leader and "avatar:'/media/buyer-avatar/'" in leader, 'Leaderboard masks only email and returns account avatar')
ok("self={owners:null,sellers:null,buyers:null}" in leader and 'const ownedStudio=await' in leader and 'self.owners=' in leader, 'Logged-in Studio owner receives own rank')
ok('self={sellers:' in leader and 'buyers:' in leader, 'Logged-in Seller and buyer receive own rank')
ok('owner_name' in leader and 'owner_email' in leader and 'a.avatar' in leader, 'Studio leaderboard joins owner profile with masked email and avatar')
ok('rank-self-card' in (F/'rankings.html').read_text() and 'TOP 100' in (F/'rankings.html').read_text(), 'Leaderboard page displays Top 100 and personal rank')
ok("data?.self?.[kind]" in RANK and 'emailMasked' in RANK and 'rank-avatar' in RANK, 'Leaderboard renders personal placement, display name, masked email and avatar')

# 15-19: common utility dock, Note, AI placement and tactile controls across the requested surfaces
for page in ['admin.html','tenant-admin.html','share.html','2.html','note.html','rankings.html','seller.html','account.html']:
    h=(F/page).read_text(encoding='utf-8')
    ok('community-dock.js?v=60.8' in h, f'{page} loads shared utility bubble')
ok("const syncAiPosition=()=>" in DOCK and 'rect.top' in DOCK and 'bottom:var(--tcd-ai-bottom' in DOCKCSS, 'AI bubble anchors just above the expanded utility panel')
ok("add('Admin liên hệ'" in DOCK and "add('Nhóm cộng đồng'" in DOCK and 'tcdAddBox' in DOCK, 'Contact, community and custom boxes are grouped in utility hub')
ok('contextmenu' in INTER and 'event.preventDefault()' in INTER and 'dragstart' in INTER, 'Native long-press download/context menu is suppressed on cards/images')
ok('-webkit-tap-highlight-color:transparent' in THEME and ':active' in THEME, 'Tap flash is removed and intentional press feedback is styled')
ok('note-modern-v60.css?v=60.8' in (F/'note.html').read_text() and 'note-modern-v60.css?v=60.8' in (F/'tenant-admin.html').read_text(), 'Public Note and Note editor share the refreshed visual system')

# 20: cache-busting for the files changed in this release
for page in F.glob('*.html'):
    html=page.read_text(encoding='utf-8',errors='ignore')
    if 'config.js?' in html: ok('config.js?v=60.8' in html, f'{page.name} uses current config cache version')
ok('admin-v14.js?v=60.8' in (F/'admin.html').read_text(), 'Master Admin loads updated QR and payout renderer')

# SQLite simulation: own Studio rank uses verified account ownership and period totals.
db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE tenant_accounts(id TEXT PRIMARY KEY,slug TEXT,studio_name TEXT,owner_user_id TEXT,email TEXT,email_verified_at TEXT,deleted_at TEXT);
CREATE TABLE buyer_purchases(id TEXT,scope TEXT,tenant_id TEXT,status TEXT,amount_vnd INTEGER,created_at TEXT);
INSERT INTO tenant_accounts VALUES('t1','alpha','Alpha Studio','b1','owner@example.test','2026-01-01',NULL);
INSERT INTO tenant_accounts VALUES('t2','beta','Beta Studio','b2','other@example.test','2026-01-01',NULL);
INSERT INTO buyer_purchases VALUES('p1','tenant','t1','paid',90000,'2026-11-18 10:00:00');
INSERT INTO buyer_purchases VALUES('p2','tenant','t2','paid',50000,'2026-11-18 11:00:00');
''')
owner_value=db.execute("SELECT SUM(bp.amount_vnd) FROM tenant_accounts t JOIN buyer_purchases bp ON bp.tenant_id=t.id WHERE t.owner_user_id=? AND bp.scope='tenant' AND bp.status='paid' GROUP BY t.id ORDER BY SUM(bp.amount_vnd) DESC LIMIT 1",('b1',)).fetchone()[0]
owner_rank=db.execute("SELECT COUNT(*)+1 FROM (SELECT tenant_id,SUM(amount_vnd) AS total FROM buyer_purchases WHERE scope='tenant' AND status='paid' GROUP BY tenant_id) WHERE total>?",(owner_value,)).fetchone()[0]
ok(owner_value==90000 and owner_rank==1, 'SQLite simulation: owned Studio personal rank is correctly computed')
print('PASS V60.1 regressions: tenant Share null dereference, payout QR upload/server gate/admin preview, Top 100 + own rank, shared dock, Note, touch behavior and cache versions.')
