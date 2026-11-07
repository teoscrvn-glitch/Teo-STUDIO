# TeoStudio V58.1 — Note Designer & Secure Flow

Current release notes: see `CHANGELOG_V58.1_NOTE_DESIGNER_FLOW.md`, `DEPLOY_V58.1_NOTE_DESIGNER_FLOW.md` and `TEST_REPORT_V58.1_NOTE_DESIGNER_FLOW.md`.

# TeoStudio V57.10 — Link4M API diagnostic

See `VERSION_V57.10.md`, `DEPLOY_V57.10_LINK4M_API_DIAGNOSTIC.md`, and `TEST_REPORT_V57.10_LINK4M_API_DIAGNOSTIC.md` for this release.

# TeoStudio V56.16 — Account, Wallet & Tenant Suite

This release bundles the account/session, wallet purchase UX, tenant dashboard, email notification and configuration-preservation work for the existing TeoStudio Cloudflare Worker project.

## Latest patch in this archive — V57.9
- `VERSION_V57.9.md` — release scope.
- `CHANGELOG_V57.9_IDENTITY_RATE_SECURITY.md` — persistent account/IP/network login throttles and IP-header hardening.
- `DEPLOY_V57.9_IDENTITY_RATE_SECURITY.md` — deploy steps and new D1 behavior.
- `CLOUDFLARE_WAF_V57.9.md` — recommended zone-level WAF rate-limit rules to configure in Cloudflare Dashboard.
- `TEST_REPORT_V57.9_IDENTITY_RATE_SECURITY.md` — local test scope and production limitations.

The release keeps the previous V56/V57 feature set and existing D1 database. It does not include or modify any Cloudflare Secret values.

## Read before deploying
- `VERSION_V56.16.md` — exact scope and limitations.
- `DEPLOY_V56.16_ACCOUNT_WALLET_TENANT.md` — mobile/GitHub/Cloudflare deployment guide.
- `TEST_REPORT_V56.16.md` — checks run and untested production behavior.

## Cloudflare configuration
- Keep existing Worker name `teo-studio`, D1 binding `DB`, database name `teo-studio`, and database ID unchanged.
- The non-secret Production vars are documented in `cloudflare/wrangler.toml`, including `BUMX_API_URL`, `LINK4M_API_URL`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, and `TURNSTILE_SITE_KEY`. Confirm they still match Cloudflare Production before deployment.
- Keep `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, `OXMAIL_SMTP_PASS`, and any AI/Telegram credentials as Cloudflare Secrets. Secret values must never be committed to GitHub or placed in this ZIP.
- Do not delete or recreate the D1 database. The Worker uses additive migrations; still make a D1 backup before production deployment.

## Main improvements in V56.16
- Purchase button handler shared by main and tenant file detail pages; wallet shortfall is explained before submitting a purchase.
- Purchase still requires verified account, Turnstile, explicit acceptance, explicit final confirmation, idempotency key and server-side balance/product validation.
- Account login accepts ID or email; self-registration requires unique login ID, email verification and password. Buyer session supports a 7-day idle timeout and explicit logout.
- Tenant Admin SSO for the verified account owner, legacy manual tenant login compatibility, per-Studio statistics, comments/files/tags/settings/notifications/security blocklist and owner-only wallet views.
- Tenant statistics are scoped to that tenant; no main-site wallet top-up statistics or master Admin withdrawal-approval queue is exposed in Tenant Admin.
- Email notifications are sent by the existing OxMail sender for supported account/security/purchase/top-up/tenant events when SMTP is configured.
- Teo AI has safe navigation/report helpers; financial/destructive operations remain user-confirmed. Full natural-language AI requires an external API configuration.

## Important
Static checks do not prove a real SePay webhook, email delivery, purchase debit, seller ledger credit, withdrawal, session ownership or end-to-end browser flow against production. Test on Preview or a branch with a separate D1 first.
