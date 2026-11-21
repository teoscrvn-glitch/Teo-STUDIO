# Deploy TeoStudio V60.0

1. Back up Cloudflare D1 and record the current Worker deployment for rollback.
2. Keep the existing D1 database ID, bindings, secrets, and production variables unchanged.
3. Upload the package preserving the `cloudflare/` and `frontend/` folders.
4. Deploy the Worker and Assets together. The Worker build reports `v60.0-community-hub-landing`.
5. Verify:
   - `https://teostudio.top/` displays the new introduction page.
   - `https://teostudio.top/2` displays the previous resource catalogue.
   - `/index.html` redirects to `/2`.
   - `/rankings.html` Home returns to `/` on the main site.
   - `/rankings.html?tenant=<slug>` Home returns to `/share?tenant=<slug>`.
   - Admin and Tenant Admin both show the community link editor in settings.
   - Save one HTTPS custom link in each settings scope; reload settings and verify it remains.
   - The multifunction bubble appears on main Share, tenant Share, Admin, Tenant Admin, Seller and Account pages; on pages with the AI assistant, it sits below AI and AI moves upward when the panel expands.
   - Opening the bubble moves AI upward; close restores its original position.
   - Music and click sound remain off/on according to the device preference; no detached music dock appears. Studio rental navigation and optional Zalo rental contact are separate actions.
   - Membership menu opens `/account.html?tab=memberships`.
6. Test mobile in Chrome: portrait layout, drawer scrolling, touch feedback, `prefers-reduced-motion`, no horizontal overflow.
7. Test tenant isolation: custom community boxes saved under one tenant must not appear in another tenant.
8. Roll back the Worker/Assets deployment if settings fail to save, tenant links cross scopes, or the root route is blank.

Do not reset or migrate D1 for this release. V60.0's community shortcuts reuse existing settings records and add no D1 schema migration.
