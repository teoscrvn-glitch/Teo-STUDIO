# Test Report — TeoStudio V60.5 UI Redesign Step 2

## Verified PASS

- `bash scripts/check-build.sh`: 40/40 sections passed, including Worker syntax, frontend JavaScript syntax, legacy regressions, SQLite helper simulations, redesign baseline and generated bundle freshness. Full captured output: `docs/test-results/build-check-v60.5.txt`.
- `node scripts/check-feature-parity.mjs frontend`: PASS — baseline feature IDs/forms/fields/handlers retained. Output: `docs/test-results/feature-parity-v60.5.txt`.
- `node scripts/check-local-refs.mjs`: PASS — 59 HTML/CSS files checked. Output: `docs/test-results/local-refs-v60.5.txt`.
- Strict design-rule lint on new authored `global-ui.css` and `page-detail.css`: PASS — 0 `!important`, `transition: all`, large blur, old purple/pink, backdrop-filter, infinite animation or fixed hex color occurrences. Output: `docs/test-results/design-rules-new-css-v60.5.txt`.
- Generated `detail-foundation.css` is reproducible from `tokens.css`, `components.css`, `motion.css`, and `global-ui.css`; `scripts/build-detail-foundation.mjs --check` passes.
- Both migrated pages use exactly 3 CSS references and no longer load `style.css`, `teo-experience.css`, `pre-public-polish.css`, `v60-theme.css`, or `patch-v604.css`.

## Inherited CSS debt — not hidden

The full-project CSS lint remains failing because legacy, not-yet-migrated pages still contain **512 `!important`** and **14 old purple/pink palette occurrences**. The whole-project count is saved in `docs/test-results/design-rules-all-css-v60.5.txt`. The new page and base lock CSS pass strict lint independently. Other inherited warnings are reported in the same output.

## Not verified in this environment

- Required Playwright screenshots at 390px, 980px with coarse pointer/Desktop-site, and 1440px could not be produced: Chromium navigation returns `net::ERR_BLOCKED_BY_ADMINISTRATOR`. No screenshots are fabricated; visual acceptance remains pending.
- Be Vietnam Pro WOFF2 font binaries are absent from the supplied ZIPs. No false font files, CDN dependency, or broken `@font-face` reference was introduced. Self-hosted font integration remains pending.
- No live Cloudflare Worker/D1, purchase/withdrawal, SePay, Link4M/BumX, Telegram, or real Android interaction was executed.

## Staging smoke test required

1. Open `/detail?id=<valid-id>` and `/product-detail-view.html?id=<valid-id>` at 390px and Desktop-site 980px.
2. Confirm image/video media controls and gallery behavior.
3. Test copy URL and native share.
4. Test Free, paid checkout, and Seller referral actions with a test account.
5. Verify wallet modal opens/closes and the public Worker responses are unchanged.

## Scope boundary

This is **Step 2**, not the full-site redesign. Share/download/free/free-key, account/topup/rent/earn, Seller, tenant Admin, Master Admin, Note/Builder, rankings, intro/legal/AI training still await their dedicated migration stages. Their existing functionality and backend contracts remain in place.
