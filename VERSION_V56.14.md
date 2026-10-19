# TeoStudio V56.14 — Wallet & Session UX

## Changes
- Fix buyer purchase flow when a token exists but buyer profile has not loaded yet: fetch `/api/account/me` before opening the login gate.
- Make Turnstile load failures visible in the purchase dialog rather than leaving a seemingly inert confirmation button.
- Persist buyer account sessions across reloads/tabs and clear them after seven days without activity.
- Persist tenant-admin sessions across reloads/tabs with the same seven-day inactivity policy.
- Extend buyer and tenant session expiry on authenticated API activity.
- Bust frontend JS/CSS cache keys to avoid loading older cached modules.
- Add a short mobile-friendly guide to the Builder.
- Keep existing admin monthly top-up stats (`v55Topups`/`v55TopupCount`) and existing tenant analytics; no new wallet data is fabricated.

## Not included / limits
- AI remains a support assistant and issue-reporting tool; it does not autonomously mutate products, payments, tenant accounts, or settings. Any future action-capable AI should use explicit per-action confirmation and server-side permission checks.
- Live SePay payment, live D1, and browser end-to-end flows were not run in this environment.
