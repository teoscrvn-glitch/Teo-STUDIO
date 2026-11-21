# V56.45 — Tenant UX, comment login, sales isolation, stats and profile repair

- Tenant file picker exposes three modes only: direct Free 100%, free via bypass link, and paid-only. Legacy combined rows are normalized.
- Tenant public cards show thumbnail, title, description, explicit pricing/free mode and a clear detail-page link.
- Free/bypass actions use large, high-contrast green CTAs on the main catalog and tenant detail pages.
- Comment authentication reads the same buyer session key from localStorage/sessionStorage and updates after login/logout; CAPTCHA state resets when a session changes.
- Recent-sale feed routes through the tenant-scoped API whenever a tenant slug is present; backend query already enforces tenant/product ownership.
- Tenant-tag deletion is tenant-scoped, deletes a parent and its children, clears matching product tag assignments, and returns a useful not-found error.
- Profile editor supports selecting avatar image from a device and compresses it before uploading.
- Tenant sales dashboard distinguishes 30-day gross/seller net/platform fees and today’s seller net/platform fees.
- Keep OpenRouter URL/model and Telegram chat ID in cloudflare/wrangler.toml. Secret values remain in Cloudflare.

Local syntax/build checks do not validate the live Cloudflare Worker, D1 data, SePay, OpenRouter or mobile UI.
