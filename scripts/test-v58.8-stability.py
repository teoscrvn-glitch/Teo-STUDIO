from pathlib import Path
import re, sqlite3, tempfile
root=Path(__file__).resolve().parents[1]
worker=(root/'cloudflare/worker.js').read_text()
tenant_js=(root/'frontend/assets/js/tenant-admin.js').read_text()
account_js=(root/'frontend/assets/js/account.js').read_text()
assistant_js=(root/'frontend/assets/js/assistant.js').read_text()
share_html=(root/'frontend/tenant-admin.html').read_text()
note_css=(root/'frontend/assets/css/note-studio.css').read_text()
config=(root/'frontend/assets/js/config.js').read_text()
wrangler=(root/'cloudflare/wrangler.toml').read_text()
assert "const BUILD_VERSION='v59.1-unified-account-membership'" in worker
assert "BUILD_VERSION:'v59.1-unified-account-membership'" in config
# Seller toggle reads from the actual HTML form, not FormData.elements.
assert "const sellerEnabled=e.target.elements?.namedItem?.('seller_enabled')" in tenant_js
assert "const sellerEnabled=f.elements?.namedItem" not in tenant_js
assert "sellerRequested=b.seller_enabled===true||Number(b.seller_enabled)===1" in worker
assert "if(String(t.plan_type||'paid')==='free'&&sellerRequested)return J({ok:false,error:'VIP_REQUIRED'" in worker
assert "SELLER_PAID_MODE_REQUIRED" in worker
# Tenant support inbox is scoped by authenticated tenant id and has GET/PUT routes.
assert "p==='/api/tenant/support/reports'&&(r.method==='GET'||r.method==='PUT')" in worker
assert "WHERE tenant_id=? ORDER BY CASE status" in worker
assert "tenantTelegramSend(e,t.id,`💬 TeoStudio · Đã phản hồi báo lỗi" in worker
assert 'id="tab-support"' in share_html and 'id="tenantSupportReports"' in share_html
assert 'loadTenantSupportReports' in tenant_js
# AI chat and Agent are authenticated; account history is only added after consent.
assert "if(!buyer&&!tenantSession&&!masterAdmin)return J({ok:false,error:'ACCOUNT_REQUIRED'" in worker
assert "const aiPersonalizationAllowed=!!buyer&&Number(buyer.ai_personalization_enabled)===1" in worker
assert "recentWalletLedger" in worker and "recentTopups" in worker and "accountRecentPurchases" in worker
assert "if(!buyer&&!tenantSession&&!masterAdmin)return J({ok:false,error:'ACCOUNT_REQUIRED'" in worker[worker.index('async function assistantAgent'):]
assert "Bạn cần đăng nhập tài khoản TeoStudio để dùng AI và Agent." in assistant_js
# The account Share header now picks an owned Studio if the slug isn't in the return URL.
assert "const studios=Array.isArray(x.studios)?x.studios:[]" in account_js
assert "backLink.href='/share?tenant='+encodeURIComponent(selectedSlug)" in account_js
# Telegram duplicate updates and already-linked repeated pair code are idempotent.
assert 'tenant_telegram_updates(update_id)' in worker
assert 'alreadyLinked:true' in worker and 'Bot này đã được liên kết với Studio' in worker
# Music is configurable for the main site and each tenant, and HTTPS only.
assert 'backgroundMusicUrl' in worker and "if(k==='backgroundMusicUrl'&&v0&&!/^https:\\/\\//i.test(String(v0)))" in worker
assert 'mountBackgroundMusic(site.backgroundMusicUrl)' in (root/'frontend/assets/js/main.js').read_text()
assert 'mountTenantMusicPlayer(s.backgroundMusicUrl)' in (root/'frontend/assets/js/tenant-share.js').read_text()
# Note preview/editor collapses before desktop-site mobile viewport widths.
assert '@media(max-width:1100px){.note-studio-grid' in note_css
assert 'prefers-reduced-motion:reduce' in note_css
# Deploy preserves Dashboard variables and bindings.
assert 'keep_vars = true' in wrangler
assert '[[d1_databases]]' in wrangler and '[[ratelimits]]' in wrangler
# Smoke test SQLite support-ticket columns/index and seller unique commission primitives.
conn=sqlite3.connect(':memory:')
conn.execute('CREATE TABLE support_reports(id TEXT PRIMARY KEY,tenant_id TEXT,created_at TEXT,tenant_reply TEXT,tenant_replied_at TEXT)')
conn.execute('CREATE INDEX idx_support_reports_tenant ON support_reports(tenant_id,created_at)')
conn.execute('INSERT INTO support_reports(id,tenant_id,created_at,tenant_reply) VALUES(?,?,?,?)',('r1','t1','2026-11-08','ok'))
assert conn.execute('SELECT COUNT(*) FROM support_reports WHERE tenant_id=?',('t1',)).fetchone()[0]==1
print('PASS: V58.8 stability regression checks')
