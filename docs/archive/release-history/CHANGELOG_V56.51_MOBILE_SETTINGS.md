# TeoStudio V56.51 — Mobile settings layout fix

- Strengthened the tenant settings page mobile layout to a single-column grid at <=760px.
- Added width/min-width constraints to settings cards and nested Telegram/API test card.
- Allowed Telegram action buttons to wrap on narrow screens.
- Added cache-busting version `56.51` for the tenant admin stylesheet.
- Preserved Cloudflare Worker environment bindings/secrets: no secrets were added to this archive.

Validation: inspected source changes and archive packaging. Not deployed to Cloudflare and not tested against the live Worker.
