# Deploy V56.46 — Tenant sale modes

1. Back up the currently deployed frontend and Worker.
2. Deploy frontend assets and `cloudflare/worker.js` together.
3. Keep existing Cloudflare Secrets and bindings; this change does not require new secrets.
4. In Tenant Admin, test each mode with test URLs:
   - FREE 100% / Vượt link: first URL is direct download; second URL is bypass page.
   - Vượt link / Mua: first URL is bypass page; second URL is paid origin; enter price >= 1,000 VND.
   - Chỉ mua: enter paid origin and price >= 1,000 VND.
5. Verify Share cards show only metadata plus mode label. Open details to verify the corresponding action buttons.
6. For paid modes, confirm the original download URL is not included in public API responses before successful wallet/payment confirmation.
7. Confirm the bypass provider actually grants the file after the visitor completes its flow. This application redirects to the configured bypass URL; it cannot validate an external provider's unlock without that provider's server-verifiable integration.

Do not overwrite Cloudflare Secrets with placeholder values from any config file.
