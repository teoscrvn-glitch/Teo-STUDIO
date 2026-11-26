# TeoStudio V60.5 — UI Redesign Step 2

## Sources and base
- Base archive: TeoStudio V60.4.3 Admin UI Unfreeze.
- Design requirements: `docs/redesign-brief/GUIDE_FULL_PAGES_GPT.md` and `docs/redesign-brief/PROMPT_STEP2_GPT.md`.
- Feature parity baseline and checker: `scripts/feature-baseline.json`, `scripts/check-feature-parity.mjs`.

## Delivered in this step
- Added global SVG sizing guard in the base layer; legacy pages use `global-ui.css`, the two migrated detail pages receive it through the generated base bundle.
- Migrated `detail.html` and `product-detail-view.html` to `page-detail.css` inside `@layer page`.
- Detail design is one column, 720px max width, 16:9 media stage, compact metadata/share/warning sections, and 48px CTA target. Buy/Free is two columns when both actions are present.
- Detail pages now use 3 CSS references: `detail-foundation.css`, `membership-commerce.css`, `page-detail.css`.
- Removed legacy `teo-experience.css` and other old patch styles from the migrated detail pages; preserved `teo-experience.js` interaction behavior.
- Kept detail page JS and behavior hooks: `main-v604.js`, `main.js` (on corresponding page), `account.js`, existing media, buy, download/free, Seller and share handlers.
- Updated version/cache markers to `v60.5-ui-step2`; Worker BUILD_VERSION changed only as a release identifier.
- Added reproducible CSS bundle builder `scripts/build-detail-foundation.mjs`.

## Not changed
No API routes, D1 schema/data, authentication or permission policy, wallet/payment, SePay, Link4M/BumX or Telegram logic was intentionally changed.

## Remaining phases
Share/download/free/free-key; account/topup/rent/earn; Seller/tenant Admin/tenant detail; Master Admin/Note/Builder; rankings/intro/legal/AI training remain in their future migration stages. This ZIP is not a claim that all pages have already been redesigned.

## Known acceptance gaps
Playwright screenshots unavailable because Chromium is blocked by the runtime. Be Vietnam Pro WOFF2 was not in the provided sources, so self-hosting is pending rather than replaced with a remote font. See `TEST_REPORT_V60.5.md`.
