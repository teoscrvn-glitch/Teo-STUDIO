# TeoStudio V56.49 — Telegram & Free Bypass Test Buttons

- Added a tenant-admin button to send a Telegram test message to the linked Studio chat.
- Added a tenant-admin API bypass configuration check. It verifies required environment variables and HTTPS URL shape without consuming a bypass attempt or granting rental days.
- Added authenticated Worker routes for both checks.

## Validation
- `node --check frontend/assets/js/tenant-admin.js`
- `node --check cloudflare/worker.js`

The bypass button is a configuration check, not a live provider verification: provider-specific APIs may require a signed test request or provider credentials beyond the configured variables. Production behavior has not been tested from this source archive.
