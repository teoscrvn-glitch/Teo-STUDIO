# V57.13 — Local test report

Passed:
- `node scripts/test-v57.13-free-key-cross-tab.mjs`
- `node scripts/test-v57.13-free-key-return-page.mjs`
- `python scripts/test-v57.13-free-key-five-minute-ttl.py`
- `node --check cloudflare/worker.js`
- `node --check frontend/assets/js/tenant-admin.js`
- `node --check frontend/assets/js/free-key.js`
- HTML parser check for `frontend/free-key.html` and `frontend/tenant-admin.html`.
- Static check confirms tenant-facing markup/scripts no longer expose API diagnostic identifiers, provider HTTP/domain details, callback notes or Secret variable names.

The tests model a new tab with empty `sessionStorage` but shared same-origin `localStorage` and tenant login token. The mock Worker response validates frontend flow only. SQLite checks are a local simulation of one-time/expiry behavior.

Not tested:
- Live Cloudflare Worker deployment or production D1 transaction behavior.
- Real Link4M/BumX end-to-end redirects on the user's Android browser.
- Provider-side captcha, ad completion, or shortener navigation latency.
