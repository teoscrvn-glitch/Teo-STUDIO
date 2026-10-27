# TeoStudio V56.40 — Admin-aware Téo Linh

## Changes
- The AI API now adds today's statistics to context only when the request carries a valid master-admin session or a valid tenant-admin session.
- Master-admin context is scoped to platform-wide paid orders/revenue and page views for the current Vietnam date.
- Tenant-admin context is scoped to that tenant only: visits, file views, outbound clicks, paid orders, gross revenue and seller net for today.
- The tenant authorization check uses `tenant_sessions` directly; a buyer session that merely belongs to the same email does not gain tenant-admin statistics.
- The AI system prompt now instructs the model to answer from `authorizedAdminStats` when present and never claim it cannot access authorized figures; it must not invent stats or mix tenant and platform scopes.
- No database schema migration or production secret changes are included.

## Account identity note
Master `ADMIN_KEY`, tenant-admin credentials and buyer accounts are distinct authentication roles. A tenant can be linked to the buyer experience through the existing verified-email matching flow; a tenant record without a verified email cannot safely be silently converted into a buyer account. This release does not merge accounts or alter passwords. Complete linking should use an explicit verified-email flow.

## Validation
- `node --check cloudflare/worker.js`: passed.
- `sh scripts/check-build.sh`: passed all 9 groups.
- These are static/local checks. No live Cloudflare, D1, payment or mobile browser test was performed.
