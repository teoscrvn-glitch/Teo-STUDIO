#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js required (Termux: pkg install nodejs)"; exit 2; }
echo '[1/23] Worker syntax'
node --check cloudflare/worker.js
echo '[2/23] Frontend JavaScript syntax'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
echo '[3/23] Version and image asset'
grep -q "ensureAssistantActivitySchema" cloudflare/worker.js
grep -q "v57.12-link4m-destination-key-page" cloudflare/worker.js
grep -q "v57.12-link4m-destination-key-page" frontend/assets/js/config.js
test -s frontend/assets/img/teo-linh.webp
grep -q "new URL('../img/teo-linh.webp',SCRIPT_URL)" frontend/assets/js/assistant.js
grep -q 'safeYouTubeUrl' cloudflare/worker.js
grep -q 'registerTutorialVideoUrl' frontend/assets/js/account.js
grep -q 'image_data,image_type,image_size' cloudflare/worker.js
echo '[4/23] Chat history'
grep -q 'teo_ai_chats_v1' frontend/assets/js/assistant.js
grep -q 'teoAiHistoryToggle' frontend/assets/js/assistant.js
grep -q 'teoAiNew' frontend/assets/js/assistant.js
grep -q 'history:prior' frontend/assets/js/assistant.js
grep -q 'safeAssistantHistory' cloudflare/worker.js
grep -q "scope='tenant' AND tenant_id=?" cloudflare/worker.js
grep -q 'Không tiết lộ đơn hàng, khách hàng' cloudflare/worker.js
grep -q 'tenantRecentActivity' cloudflare/worker.js
grep -q 'accountRecentPurchases' cloudflare/worker.js
grep -q 'compressReportImage' frontend/assets/js/assistant.js
echo '[5/23] Sales isolation'
grep -q "bp.scope='main' AND (bp.tenant_id IS NULL OR bp.tenant_id='') AND bp.status='paid'" cloudflare/worker.js
grep -q "p.scope='tenant' AND p.status='paid'" cloudflare/worker.js
grep -q 'JOIN tenant_products tp ON tp.id=p.product_id AND tp.tenant_id=p.tenant_id AND tp.tenant_id IN' cloudflare/worker.js
echo '[6/23] Tenant detail social preview'
grep -q "p==='/tenant-detail'||p==='/tenant-detail.html'" cloudflare/worker.js
grep -q 'tenantDetailShareUrl' frontend/assets/js/tenant-detail.js
grep -q '/media/tenant-product/' frontend/assets/js/tenant-detail.js
echo '[7/23] Tag and registration video settings'
grep -q "registerTutorialVideoUrl" cloudflare/worker.js
grep -q "registerTutorialVideoUrl" frontend/assets/js/admin-v14.js
grep -q "window.editTag" frontend/assets/js/tenant-admin.js
grep -q 'video_url' frontend/admin.html
grep -q 'https://www.youtube-nocookie.com' cloudflare/worker.js
echo '[8/23] Security guardrails'
grep -q 'REPORT_IMAGE_MIME_MISMATCH' cloudflare/worker.js
grep -q 'api/admin/support/reports/' frontend/assets/js/admin-v14.js
grep -q 'X-Content-Type-Options' cloudflare/worker.js || grep -q 'x-content-type-options' cloudflare/worker.js
grep -q "p==='/api/account/purchase'" cloudflare/worker.js
grep -q 'IDEMPOTENCY_KEY_REQUIRED' cloudflare/worker.js
grep -q 'content-security-policy' cloudflare/worker.js
grep -q 'https://www.youtube-nocookie.com' cloudflare/worker.js
if grep -Eq 'function banIp|function activeBan|IP_TEMPORARILY_BLOCKED|banIp\(' cloudflare/worker.js; then echo 'ERROR: unexpected automatic IP-ban code'; exit 1; fi
grep -q 'searchAssistantWeb' cloudflare/worker.js
grep -q 'TAVILY_API_KEY' cloudflare/worker.js
grep -q 'recordBuyerActivity' cloudflare/worker.js
grep -q "if(tenant)loadRecentSalesFeed('/api/public-tenant/'" frontend/assets/js/account.js
grep -q "window.addEventListener('teo:auth-changed'" frontend/assets/js/main.js
grep -q "if(tg&&r.method==='DELETE')" cloudflare/worker.js
grep -q 'TELEGRAM_CHAT_ID = "-5376839466"' cloudflare/wrangler.toml
grep -q 'AI_MODEL = "openrouter/free"' cloudflare/wrangler.toml
[ "$(grep -o '<option value="free"' frontend/tenant-admin.html | wc -l | tr -d ' ')" -eq 1 ]
[ "$(grep -o '<option value="unlock"' frontend/tenant-admin.html | wc -l | tr -d ' ')" -eq 1 ]
[ "$(grep -o '<option value="paid"' frontend/tenant-admin.html | wc -l | tr -d ' ')" -eq 1 ]
! grep -q '<option value="both"' frontend/tenant-admin.html
grep -q 'tp.tenant_id=p.tenant_id' cloudflare/worker.js
grep -q 'TAVILY_API_KEY' DEPLOY_V56.44_AI_WEB_ACTIVITY.md
echo '[9/23] AI guardrail behavior'
node scripts/test-ai-guardrails.mjs
echo '[10/23] Unified tenant session regression checks'
node scripts/test-unified-tenant-session.mjs
echo '[11/23] V56.64 Seller hardening and responsive UI checks'
python scripts/test-v56.64-security-polish.py
echo '[12/23] V56.68 manual card exchange and security checks'
python scripts/test-v56.67-card-security.py
echo '[13/23] Card tariff normalization tests'
node scripts/test-v56.67-card-rates.mjs
echo '[14/23] V56.68 SQLite wallet and bypass tests'
python scripts/test-v56.67-ledger.py
echo '[15/23] Card callback signature helper tests'
node scripts/test-v56.67-md5.mjs
echo '[16/23] V56.69 seller analytics and Free bypass regression checks'
python scripts/test-v56.69-analytics-bypass.py
echo '[17/23] V57 legal, privacy and design checks'
node scripts/test-v57-legal-design.mjs
echo '[18/23] V57 D1 migration smoke test'
python scripts/test-v57-migration.py
echo '[19/23] V57.8 two-cycle Free bypass security and standalone top-up checks'
python scripts/test-v57.8-free-bypass-cycles.py
echo '[20/23] V57.9 identity-based authentication security checks'
python scripts/test-v57.9-identity-security.py
echo '[21/23] V57.10 Link4M shortlink API diagnostic checks'
python scripts/test-v57.10-link4m-diagnostic.py
echo '[22/23] V57.12 Free key 5-minute link/key expiry and destination page checks'
python scripts/test-v57.12-free-key-five-minute-ttl.py
echo '[23/23] V57.12 destination page return behavior'
node scripts/test-v57.12-free-key-return-page.mjs
echo 'PASS: syntax, local helper behavior and static checks only. Live Cloudflare, D1, social preview crawlers and phone UI are NOT tested here.'
