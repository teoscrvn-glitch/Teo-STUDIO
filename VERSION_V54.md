# TeoStudio V54 — Frontend/Rental/Wallet Fix

Based on `TeoStudio-V53-Rental-Catalog.zip`. This is source code for review and deployment, not a claim that production has been updated.

- Cache-busted updated frontend assets to V54 and added a frontend version meta marker.
- Clarified missing payment/Turnstile runtime configuration on rental page.
- Added visible backend-reported tenant plan label to help diagnose missing VIP-only UI.
- Preserved existing tenant payout profile, wallet and withdrawal UI/API; Free plans remain restricted to Share basics as intended.
- Prevented public tenant Share product-list API from serializing paid `original_link` URLs.
- Updated `/api/health` version to `v54-rental-catalog-payout`.

See `V54_FIXES_AND_RUNTIME_SETUP.md` before deploy. No production Worker, D1, secrets, DNS, payment provider, or WAF settings were changed from this archive.
