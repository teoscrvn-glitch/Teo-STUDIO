#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js required (Termux: pkg install nodejs)"; exit 2; }
echo '[1/8] Worker syntax'
node --check cloudflare/worker.js
echo '[2/8] Frontend JavaScript syntax'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
echo '[3/8] Version fingerprint and cache keys'
grep -q "v56.16-account-wallet-tenant-suite" cloudflare/worker.js
grep -q "v56.16-account-wallet-tenant-suite" frontend/assets/js/config.js
grep -q 'assets/js/account.js?v=56.16' frontend/index.html
grep -q 'assets/js/account.js?v=56.16' frontend/detail.html
grep -q 'assets/js/tenant-detail.js?v=56.16' frontend/tenant-detail.html
grep -q 'assets/css/style.css?v=56.16' frontend/detail.html
! grep -R -qE 'v=56\.15|v56\.15' frontend cloudflare
echo '[4/8] Wallet purchase flow'
grep -q 'data-teo-wallet-buy' frontend/assets/js/main.js
grep -q 'data-teo-wallet-buy' frontend/assets/js/tenant-detail.js
grep -q "window.addEventListener('click'" frontend/assets/js/account.js
grep -q 'Số dư ví chưa đủ' frontend/assets/js/account.js
grep -q 'teoBuyTopup' frontend/assets/js/account.js
grep -q "p==='/api/account/purchase'" cloudflare/worker.js
grep -q 'IDEMPOTENCY_KEY_REQUIRED' cloudflare/worker.js
grep -q 'INSUFFICIENT_BALANCE' cloudflare/worker.js
echo '[5/8] Account, verification, notifications and idle expiry'
grep -q "p==='/api/account/register'" cloudflare/worker.js
grep -q "p==='/api/account/verify-email'" cloudflare/worker.js
grep -q 'lower(login_id)' cloudflare/worker.js
grep -q 'TEO_BUYER_LAST_ACTIVE' frontend/assets/js/account.js
grep -q '7\*86400000' frontend/assets/js/account.js
grep -q 'đăng nhập từ thiết bị mới' cloudflare/worker.js
grep -q "p==='/api/account/notifications'" cloudflare/worker.js
echo '[6/8] Tenant dashboard and scope'
grep -q 'tenantViewVisitCount' frontend/tenant-admin.html
grep -q 'tenantViewOutboundCount' frontend/assets/js/tenant-admin.js
grep -q 'Ví nhận từ bán file' frontend/assets/js/tenant-admin.js
grep -q 'tenant_security_blocks' cloudflare/worker.js
grep -q "p==='/api/tenant/security/blocks'" cloudflare/worker.js
grep -q 'buyerToken' frontend/assets/js/tenant-admin.js
grep -q "p==='/api/admin/tenants'&&r.method==='POST'" cloudflare/worker.js
echo '[7/8] Cloudflare configuration and secrets'
grep -q '^\[vars\]' cloudflare/wrangler.toml
grep -q '^SEPAY_ACCOUNT_NUMBER = "0979498243"' cloudflare/wrangler.toml
grep -q '^SEPAY_BANK_CODE = "MB"' cloudflare/wrangler.toml
grep -q '^TURNSTILE_SITE_KEY = "0x4AAAAAAFM6DoL2w6HDogkC"' cloudflare/wrangler.toml
grep -q 'database_name = "teo-studio"' cloudflare/wrangler.toml
grep -q '567f1c65-c144-414e-8bc4-26a3a0d276ca' cloudflare/wrangler.toml
if grep -Eq '^(ADMIN_KEY|SEPAY_API_KEY|TURNSTILE_SECRET|OXMAIL_SMTP_PASS|AI_API_KEY|TELEGRAM_BOT_TOKEN)\s*=' cloudflare/wrangler.toml; then echo 'ERROR: secret value hardcoded in wrangler.toml'; exit 1; fi
echo '[8/8] No unrequested automatic IP-ban mechanism'
if grep -Eq 'function banIp|function activeBan|IP_TEMPORARILY_BLOCKED|banIp\(' cloudflare/worker.js; then echo 'ERROR: unexpected automatic IP-ban code'; exit 1; fi
echo 'PASS: local syntax/static checks only. Live Cloudflare, browser, D1, SMTP, Turnstile and SePay flows are NOT tested here.'
