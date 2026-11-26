# Feature Map — V60.5 Step 2

This map documents what stayed in place and where the redesigned presentation is applied. The supplied Parity Kit checker verifies the baseline identifiers, forms, fields and handlers; it does not prove live API/provider behavior.

| Existing capability | Existing contract retained | Step 2 presentation |
|---|---|---|
| Product/detail route | `detail.html`, `product-detail-view.html`, query IDs/canonical URL | New single-column page skin, max-width 720px |
| Main thumbnail + gallery/media viewer | Existing `main-v604.js`/`main.js` rendering hooks and `data-teo-media-viewer` markup | 16:9 media stage, cover fit, compact controls |
| Price/mode metadata | Existing product metadata and `sale_mode` values | Compact badge/metadata line |
| Free download / unlock flow | Existing Free action markup, `trackOutbound`, download route and Worker checks | Full-width secondary CTA; two-column Buy/Free when both exist |
| Paid purchase | `data-teo-wallet-buy`, product ID/title/price, `#mainPurchaseBox` mount and `account.js` | Arc Blue primary button; commerce stylesheet retained |
| Seller referral action | Existing `.seller-detail-invite` and Seller target | Compact amber/ghost action |
| Share URL / copy / native share | `#detailShareUrl`, `#copyDetailShareUrl`, `#nativeShareDetailUrl`, `#detailShareStatus` and existing listeners | Compact share section |
| Description / warning / tutorial | Existing `.detail-description`, `.rule-box`, `.tag-tutorial-video` | Divider-based sections |
| SVG sizing | Existing SVG sprite references and `.i` class | Base layer fixes default SVG to 1.25em and `.i` to 20px |

## Migrated routes

- `detail.html`
- `product-detail-view.html`

## Files and page CSS budget

- `detail.html`: 3 CSS assets — /assets/css/detail-foundation.css?v=60.5, /assets/css/membership-commerce.css?v=60.5, /assets/css/page-detail.css?v=60.5
  - Legacy patch refs: none
- `product-detail-view.html`: 3 CSS assets — /assets/css/detail-foundation.css?v=60.5, /assets/css/membership-commerce.css?v=60.5, /assets/css/page-detail.css?v=60.5
  - Legacy patch refs: none

The two migrated pages now load a generated foundation bundle, the existing commerce stylesheet, and the page-specific stylesheet (3 CSS references total). The global SVG sizing rules are included in the generated foundation bundle for these two pages; other pages load `global-ui.css` directly.

## Integrity guarantees

- The Parity Kit feature checker passes against `feature-baseline.json`.
- Existing DOM IDs, forms, form fields, and event handlers were not rewritten in the two migrated page documents or their business-logic scripts.
- No Worker routes, D1 schema/data, authentication, payment, Link4M/BumX, SePay, or Telegram logic was intentionally changed. Worker `BUILD_VERSION` changes only to identify the frontend release.
