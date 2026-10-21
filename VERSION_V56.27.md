# TeoStudio V56.27 — Detail Route Restore, AI Diagnosis, Bypass Preservation

- Restores fast static HTML delivery for normal browser requests to `/detail` and `/detail.html`; D1/product lookup for OG metadata only runs for known social crawler user agents.
- Preserves dynamic product metadata for social previews when product lookup succeeds.
- Detail page loads the selected product endpoint directly instead of awaiting three unrelated catalogue/settings endpoints first.
- Adds a bounded timeout to frontend JSON API calls so a stalled API does not leave the detail view loading forever.
- Maps Google's `User location is not supported for the API use` response to a provider-eligibility diagnostic. It does not attempt to evade Google location/account restrictions.
- Keeps current server-side paid-link hiding, wallet purchase checks, Turnstile checks, idempotency validation and server-verified bypass state/expiry/one-time completion unchanged.
- Supports Telegram `TELEGRAM_CHAT_ID` and legacy `ID_CHAT_TELEGRAM` names.

Not production-verified from this environment: live D1 response times, Google Gemini API access, live purchase flow and Telegram delivery.
