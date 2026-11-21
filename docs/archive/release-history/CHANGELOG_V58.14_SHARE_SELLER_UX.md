# TeoStudio V58.14 — Share route & Seller UX

## Changes
- Bare `/share` without a `tenant` query now redirects to the public home page. Tenant-specific Share URLs still require `?tenant=<slug>` and retain the existing tenant-scoped API flow. This prevents the common Seller return link from opening the tenant shell with an empty slug and then producing `TENANT_NOT_FOUND`.
- Expanded the public Share drawer with direct entries for Seller Center, account/orders and the user's Studio list.
- Expanded Seller drawer navigation for catalog/link creation, payout, card withdrawal, ledger and account settings.
- Increased Seller catalog thumbnail size and text legibility, with a mobile-specific two-column card layout.
- Bumped build markers and cache keys for touched pages.

## Reference research
Link4Sub public product pages were reviewed for the information architecture: create link, configure ordered actions, preview, publish, manage and analyze. This release does not copy Link4Sub code or assets.

## Scope note
This is a focused UX/stability patch, not the full feature program requested for TeoStudio. The following larger items still need dedicated implementation and D1/API work: three leaderboards with day/week/month filters, member subscriptions and update entitlements, multi-step social task verification and countdown/new-tab ad flow, seller referral persistence across later purchases, tenant note redesign, task-vs-download builder separation, per-link analytics, admin analytics redesign and card top-up Telegram balance-before/after messages. No such functionality is claimed as completed in V58.14.
