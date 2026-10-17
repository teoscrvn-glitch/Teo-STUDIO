#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
if ! command -v node >/dev/null 2>&1; then
  echo 'ERROR: Node.js is required. Termux: pkg install nodejs' >&2; exit 2
fi
printf '%s\n' '[1/7] Worker syntax'
node --check cloudflare/worker.js
printf '%s\n' '[2/7] Frontend JavaScript syntax'
find frontend/assets/js -type f -name '*.js' -exec node --check '{}' \;
printf '%s\n' '[3/7] Inline scripts in HTML'
node scripts/check-inline-js.mjs
printf '%s\n' '[4/7] Local HTML/CSS references'
node scripts/check-local-refs.mjs
printf '%s\n' '[5/7] Release fingerprint and essential routes'
grep -q "v57.1-unified-release-candidate" cloudflare/worker.js
test -s frontend/earn.html
grep -q "run_worker_first = true" cloudflare/wrangler.toml
grep -q "api/admin/config-status" cloudflare/worker.js
grep -q "api/admin/ai/test" cloudflare/worker.js
grep -q "api/admin/email/test" cloudflare/worker.js
grep -q "api/admin/telegram/test" cloudflare/worker.js
grep -q "api/public/sales-feed" cloudflare/worker.js
grep -q "a.public_sales_opt_in=1" cloudflare/worker.js
! grep -q "loadSalesTicker(tenant)" frontend/assets/js/account.js
grep -q "id=\"runtimeConfigGrid\"" frontend/admin.html
printf '%s\n' '[6/7] Critical UI and files'
test -s frontend/assets/js/account.js
test -s frontend/assets/js/assistant.js
test -s frontend/assets/js/builder.js
test -s frontend/assets/js/sales-feed.js
test -s cloudflare/schema.sql
test -s cloudflare/schema_rental.sql
printf '%s\n' '[7/7] Configuration hygiene'
if grep -R -nE '(sk-[A-Za-z0-9]{20,}|BOT[0-9]{6,}:[A-Za-z0-9_-]{20,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----)' cloudflare frontend; then
  echo 'ERROR: possible credential/private-key literal found. Review before deployment.' >&2; exit 3
fi
echo 'PASS: local static checks succeeded.'
echo 'NOTE: This does not contact the live D1, SMTP, Turnstile, AI provider, Telegram, or SePay.'
