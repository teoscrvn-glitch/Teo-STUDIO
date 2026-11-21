# TeoStudio V56.8 — Tenant Login + UI CTA Fix

## Changes
- Fixes tenant rental login for accounts whose password hash uses the existing `pbkdf2$iterations$salt$hash` format. Login lookup now checks candidate accounts against supported password formats rather than selecting a duplicate row blindly.
- Keeps legacy SHA-256 and legacy plaintext migration compatibility already present in V56.7.
- Makes Free / Paid / Free-or-Paid badges more distinct on mobile and desktop.
- Makes the free download / bypass-link CTA more prominent on file detail pages.
- TikTok / YouTube cards explicitly label the account handle as `ID:` while retaining the available avatar and channel name.
- Improves visibility of the “Đang hiện / Đã ẩn” file filters and per-file hide/show controls in tenant admin.
- Bumps asset cache versions and release fingerprint.

## Validation
- `node --check cloudflare/worker.js` passed.
- `node --check` passed for frontend JavaScript files.
- `scripts/check-build.sh` checks syntax and static release fingerprint.
- This ZIP has not been deployed to the live Worker and has not been tested against production D1 or SePay. Test on a separate Preview Worker and separate D1 first.

## Preserve production configuration
Do not delete or recreate the production D1 database. Keep the existing `DB` binding, `ADMIN_KEY`, SePay secrets/variables, Turnstile configuration, and OxMail secret unchanged. Runtime secrets are configured separately from this ZIP.
