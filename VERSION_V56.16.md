# TeoStudio V56.16 — Account, Wallet & Tenant Suite

## Scope
- Correct shared wallet purchase entry points on main-site and tenant product detail pages.
- If the buyer's wallet is below the displayed price, open a clear low-balance modal, show the exact shortfall and offer the top-up flow without sending a purchase request.
- For sufficient balance, keep the server-side purchase endpoint authoritative: verified buyer, Turnstile, terms and final confirmation, current product mode/visibility, current balance, idempotency and transactional ledger write.
- Buyer self-registration uses a login ID, display name, email and password; email must be verified before login/purchase. Login accepts ID or email.
- Buyer sessions use local storage plus last-active timestamps with a seven-day idle expiry; explicit logout clears the buyer session.
- Tenant Admin can use verified buyer-owner SSO with a tenant slug, while legacy manually created tenant credentials remain supported.
- Tenant Admin contains tenant-scoped analytics, view/referrer/file/sales information, files, comments, tags, theme/account settings, notifications, manual IP/email block list and tenant-owned wallet/withdrawal history subject to plan permissions.
- Tenant Admin does not contain global wallet top-up statistics or the master Admin's withdrawal approval queue.
- Tenant account settings synchronize email/password with the TeoStudio account when authenticated through buyer SSO; email changes require verification. Master Admin can optionally associate an email to a manually created tenant without end-user OTP.
- Supported email notices include verification/security events, new-device login, password/email changes, confirmed top-up, purchase and tenant seller/payout activity when SMTP is configured.
- Teo AI helper can navigate whitelisted UI panels and open reporting/forms; it does not autonomously transfer funds, approve payouts, ban users, delete records or finalize purchases.

## Configuration/data protection
- Keeps Worker name `teo-studio`, D1 binding `DB`, database name `teo-studio`, and the existing database ID in `cloudflare/wrangler.toml`.
- Non-secret `[vars]` include only the observed `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TURNSTILE_SITE_KEY`; verify these against current Production values before deployment.
- Does not embed any secret values. Keep admin/payment/Turnstile/email/AI/Telegram secrets in Cloudflare.
- Worker schema upgrades are additive; no `DROP TABLE` or destructive migration was added for this release.

## Known limits
- The ZIP has not been tested against the user's live Cloudflare D1, SePay bank webhook, SMTP server or browser session.
- Full Teo AI answers/actions need valid `AI_API_URL`, `AI_API_KEY` and `AI_MODEL` values; this ZIP cannot create the vendor API key.
- A real purchase must be tested with a test product and enough confirmed wallet balance. A 10,000đ balance cannot purchase a 15,000đ item; this release makes the 5,000đ shortfall explicit.
- Email transport/configuration still depends on the configured OxMail mailbox and Cloudflare network support for SMTP via `cloudflare:sockets`; run the admin email test after deployment.
- Always verify `/api/health` returns `v56.16-account-wallet-tenant-suite` after deployment; an old response means the new commit/cache is not active.
