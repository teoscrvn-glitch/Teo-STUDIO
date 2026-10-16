#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install it in Termux with: pkg install nodejs"
  exit 2
fi
printf '%s\n' '[1/3] Checking Cloudflare Worker syntax...'
node --check cloudflare/worker.js
printf '%s\n' '[2/3] Checking frontend JavaScript syntax...'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
printf '%s\n' '[3/3] Checking build fingerprint and key diagnostics routes...'
grep -q "v56.3-stability-ai-config" cloudflare/worker.js
grep -q "/api/admin/config-status" cloudflare/worker.js
grep -q "/api/admin/ai/test" cloudflare/worker.js
grep -q "/api/admin/telegram/test" cloudflare/worker.js
grep -q "id=\"runtimeConfigGrid\"" frontend/admin.html
echo 'PASS: local syntax/static checks succeeded. This does not run Wrangler or contact live services.'
