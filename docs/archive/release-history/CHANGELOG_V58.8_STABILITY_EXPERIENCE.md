# TeoStudio V58.8 — Stability & Experience

Base: V58.7 Support Ticket Replies.

## Fixed
- Fixed Tenant Seller toggle persistence: read checkbox state from the actual HTML form, not `FormData.elements` (which does not exist).
- Added server-side VIP enforcement for Seller activation. Free tenants cannot enable Seller through a manually crafted API request; Seller is accepted only for paid/both product modes.
- Fixed Account “Về Share” navigation: after loading the signed-in account, select the current owned Studio (or the most recent owned Studio if no selection exists) and construct `/share?tenant=<slug>`. An explicit same-origin `return` path remains respected.
- Added tenant-scoped support inbox (`/api/tenant/support/reports`) with statuses and replies; tenant replies create an in-app notification or email for the reporter and notify the tenant Telegram chat when linked. Master Admin replies also notify the associated tenant.
- Support reports sent from the AI widget carry the current tenant slug; AI can draft a report, but the user must review and press Send.
- Made repeated Telegram pairing messages idempotent and friendlier; Telegram update IDs are claimed once and re-sent used codes no longer create misleading invalid-code spam when the Studio is already linked.
- AI chat and Agent endpoints require an authenticated buyer, tenant admin, or master Admin session. Account purchases, top-ups, wallet ledger and activity are only included in AI context after the buyer explicitly enables personalization. Passwords, OTPs and secrets are not included.
- Added configurable background music URL for main site and each tenant Share. Playback is user-initiated; HTTPS required. YouTube can be embedded, direct audio files use native controls, and TikTok opens its own page (no unsupported promise of background playback).
- Improved Note editor mobile/tablet layout: preview becomes a single-column section at widths up to 1100px, including mobile browsers in desktop-site mode. Added restrained depth polish and reduced-motion handling.
- Updated asset cache versions and build marker to V58.8. `wrangler.toml` retains `keep_vars = true` and existing D1/Rate Limiter bindings.

## Preserved
- SePay, card gateway, Merchant API, wallet ledger, Seller marketplace, Notes, Key Vault, BumX/Link4M, D1, R2 and existing deployment bindings.
- Existing Free entitlement checks. Free remains limited to one Studio per account; paid products, Seller, wallet/payout/withdrawal routes and advanced builder remain VIP-gated. No arbitrary Free file-count quota was introduced.

## Not completed in this release
- Full Note IA redesign into a separate Link4Sub-style task-link builder plus plain notebook editor. This release improves responsiveness, not the entire workflow.
- Full autonomous browser Agent that can execute arbitrary UI operations. Current Agent is authenticated and read-only for listed actions/navigation; destructive or financial actions remain unavailable/require explicit confirmation.
- True 3D/WebGL visuals. This release uses lightweight CSS depth rather than a heavy 3D scene.
- Live production tests of Telegram, email, AI provider, D1, or Cloudflare phone layouts.
