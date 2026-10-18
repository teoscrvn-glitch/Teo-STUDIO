#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install it in Termux with: pkg install nodejs"
  exit 2
fi
printf '%s\n' '[1/4] Checking Cloudflare Worker syntax...'
node --check cloudflare/worker.js
printf '%s\n' '[2/4] Checking frontend JavaScript syntax...'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
printf '%s\n' '[3/4] Checking release fingerprint and admin blocklist...'
grep -q "v56.8-tenant-login-ui-cta-fix" cloudflare/worker.js
grep -q "security_blocks" cloudflare/worker.js
grep -q "api/admin/security/blocks" cloudflare/worker.js
printf '%s\n' '[4/4] Ensuring automatic IP bans are absent...'
if grep -Eq 'function banIp|function activeBan|IP_TEMPORARILY_BLOCKED|banIp\(' cloudflare/worker.js; then
  echo 'ERROR: automatic IP-ban code still present.'; exit 1
fi
grep -q 'securityBlockForm' frontend/admin.html
echo 'PASS: syntax and static checks succeeded. Live D1/Worker/payment tests are not included.'
