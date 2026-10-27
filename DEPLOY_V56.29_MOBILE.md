# Deploy V56.29 (mobile-friendly)

1. Back up the currently deployed Worker code and current ZIP.
2. Review `VERSION_V56.29.md`.
3. Deploy the frontend assets and `cloudflare/worker.js` using the same workflow used for your current Worker.
4. Do not overwrite existing Cloudflare secrets. This release does not require secret changes.
5. Test:
   - Open `https://teostudio.top/share?tenant=YOUR_TENANT_SLUG` and verify the recent-sales area shows only that tenant's sales.
   - Open the main share page without `tenant` and verify it does not use the tenant-sales endpoint.
   - Open Teo AI, create a new chat, send a question, close/reopen the panel, and confirm local history remains.
   - Click a link returned by the assistant and verify it opens in a new tab.
   - Open the bug report form and verify it asks for confirmation before submission.
   - Test a known missing/expired tenant session; it must remain blocked rather than bypass authorization.
6. Verify `/api/health` and the deployed frontend version. Do not mark production fixed until tests pass on the live site.
