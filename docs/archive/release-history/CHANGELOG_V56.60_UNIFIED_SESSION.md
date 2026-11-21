# V56.60 — Unified tenant session foundation

## Fixed
- Tenant session resolution now prefers the exact requested tenant slug when legacy D1 rows contain overlapping IDs/slugs.
- A stale tenant session row no longer prevents the Worker from checking the authenticated buyer's explicit Studio ownership.
- Tenant login creates a shared buyer session only when the Studio has an explicit `owner_user_id` link or the tenant email matches a verified, unlocked buyer account. This enables the same token to authenticate tenant Admin, Share comments, account APIs and AI context.
- Logging out of a shared buyer session revokes both buyer and tenant session rows.
- Switching buyer identity clears a stale tenant session; switching to a standalone tenant login clears a different buyer session to prevent cross-account comment/AI identity.
- AI's tenant-admin authorization now uses the same tenant session resolver as tenant APIs before exposing tenant analytics/activity context.
- Share URL remains on the clean `/share` path; removed Worker rewrite to `/share.html` remains absent. Updated Share canonical metadata and cache-busted affected frontend scripts.

## Preserved
- No D1 table is dropped, truncated, reset or rewritten by this release.
- No SQL schema migration is required by these changes.
- `wrangler.toml` D1 binding, Variables and Secrets are unchanged.
- Existing Free Gate, payment, file, tag, comment, rental, SePay, Telegram and support-report routes remain in place.

## AI / analytics / reports
- Authenticated tenant AI context can now resolve the same verified tenant identity used by the Admin API and read the existing tenant-scoped analytics/activity context.
- Existing tenant statistics and support-report workflows are retained.
- This release does **not** yet enable arbitrary natural-language database mutations. A separate allowlisted action executor with per-action confirmation and audit logging is required before the AI can create/edit/delete tenant content autonomously.

## Validation
- Worker and frontend JavaScript syntax checks: PASS.
- Existing AI guardrail tests: PASS.
- New unified-session static regression checks: PASS.
- Tenant sales isolation tests: PASS.
- Wallet ledger/idempotency tests: PASS.
- Inline script and local static reference checks: PASS.
- Live Cloudflare D1, Production session compatibility, social-crawler preview, and mobile browser smoke tests: NOT RUN.
