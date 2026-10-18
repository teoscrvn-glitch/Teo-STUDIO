#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install it in Termux with: pkg install nodejs"
  exit 2
fi
printf '%s\n' '[1/5] Checking Cloudflare Worker syntax...'
node --check cloudflare/worker.js
printf '%s\n' '[2/5] Checking frontend JavaScript syntax...'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
printf '%s\n' '[3/5] Checking release fingerprint and tenant handlers...'
grep -q "v56.13-tenant-dashboard-interactions" cloudflare/worker.js
grep -q "v56.13-tenant-dashboard-interactions" frontend/assets/js/config.js
grep -q 'assets/js/tenant-admin.js?v=56.13' frontend/tenant-admin.html
grep -q 'Promise.allSettled' frontend/assets/js/tenant-admin.js
grep -q 'syncFilterButtons' frontend/assets/js/tenant-admin.js
if grep -q 'updateProductModeFields();try{bind()' frontend/assets/js/tenant-admin.js; then
  echo 'ERROR: unsafe out-of-scope updateProductModeFields call still exists.'; exit 1
fi
# Normal variables must remain in the Worker configuration, secrets must not be committed.
grep -q '^\[vars\]' cloudflare/wrangler.toml
grep -q '^SEPAY_ACCOUNT_NUMBER = "0979498243"' cloudflare/wrangler.toml
grep -q '^SEPAY_BANK_CODE = "MB"' cloudflare/wrangler.toml
grep -q '^TURNSTILE_SITE_KEY = "0x4AAAAAAFM6DoL2w6HDogkC"' cloudflare/wrangler.toml
if grep -Eq '^(ADMIN_KEY|SEPAY_API_KEY|TURNSTILE_SECRET|OXMAIL_SMTP_PASS)\s*=' cloudflare/wrangler.toml; then
  echo 'ERROR: Secret values/names must not be hardcoded in wrangler.toml.'; exit 1
fi
printf '%s\n' '[4/5] Checking required tenant dashboard controls...'
for id in login tabs showAddFile visibleFiles hiddenFiles visibleComments hiddenComments productForm tagForm settings password payoutProfile withdrawForm; do
  grep -q "id=\"$id\"" frontend/tenant-admin.html || { echo "ERROR: missing tenant control $id"; exit 1; }
done
printf '%s\n' '[5/5] Ensuring manual blocklist remains manual...'
if grep -Eq 'function banIp|function activeBan|IP_TEMPORARILY_BLOCKED|banIp\(' cloudflare/worker.js; then
  echo 'ERROR: automatic IP-ban code still present.'; exit 1
fi
echo 'PASS: syntax and static regression checks succeeded. Live Cloudflare/D1/payments were not exercised.'
