# TeoStudio V50 — OxMail + D1 Web Notifications

V50 is additive on top of V49 OxMail Integration.

## Included
- Keeps the V49 OxMail SMTP integration, admin SMTP test endpoint, tenant welcome email, and withdrawal email notifications.
- Adds a `web_notifications` D1 table created with `CREATE TABLE IF NOT EXISTS`; no table drops, full resets, or data wipes are performed.
- Adds tenant notification APIs: `GET /api/tenant/notifications` and `POST /api/tenant/notifications/read`.
- Adds admin notification APIs: `GET /api/admin/notifications` and `POST /api/admin/notifications/read`.
- Adds a notification bell/dropdown to `admin.html` and `tenant-admin.html`, with unread count and click-to-mark-read behavior. UI refreshes every 30 seconds while logged in.
- Writes D1 notifications when a tenant is created, when a withdrawal is requested, and when an admin approves, marks paid, or rejects a withdrawal.
- Keeps Vietnam-local display formatting for notification timestamps.

## Preserved
- No DROP TABLE, database reset, bulk deletion, or changes to existing wallet/SePay configuration.
- Existing V49 tenant/email fields and SMTP secrets are retained.
- This ZIP is source only; it has not been deployed to the production Worker, and live SMTP/D1 behavior has not been verified against production.

## Deploy notes
1. Back up the current Worker source/configuration before deploying.
2. Deploy the updated `cloudflare/worker.js` and frontend files together.
3. Keep the existing D1 binding and SePay settings unchanged.
4. Keep SMTP password only in Cloudflare Worker Secrets (`OXMAIL_SMTP_PASS`). Never put it in frontend files or source control.
5. Test admin email from Admin → Tenant management → Test email, then log in as admin and tenant to verify notification bell behavior.

The new D1 table is created lazily by the Worker on first notification API/write. Creation is additive and preserves existing rows and tables.
