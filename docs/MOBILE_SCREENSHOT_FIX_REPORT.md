# TeoStudio — Mobile screenshot regression fixes

## Scope

Applied to the V60.3 Step 1.5 source. This patch addresses only layout/branding regressions that are observable in the supplied Android screenshots. No Worker, D1 schema, authentication endpoints, payment logic, wallet, referral, QR, download, or tenant entitlement code was changed.

## Findings and changes

| Screenshot symptom | Root cause identified in source | Change |
|---|---|---|
| Account page retains violet/purple legacy styling | `page-account.css` was wrapped in `@layer page`, while legacy `style.css` declarations are unlayered and therefore outrank layered declarations | Removed the outer layer wrapper and added token-based overrides for profile, balance, consent, tabs, links, buttons and message states |
| Oversized account launcher icon on Share/Detail | `account.js` creates the launcher with an SVG `.i`, but legacy pages do not load the stylesheet that assigns its dimensions | Added explicit 20×20 dimensions and flex sizing in `mobile-touch-fixes.css` |
| Main Detail uses two columns and crops the product media on a phone using desktop-site mode | Existing `max-width:800px` breakpoints are skipped when Chrome exposes a wider layout viewport | Added `hover:none` + `pointer:coarse` + `max-width:1024px` overrides; single-column detail, media contained within a 54dvh box, text/action rows allowed to wrap |
| Homepage shows desktop navigation and 3-column products on Android desktop-site mode | Existing breakpoints only respond to viewport width | Added touch/coarse-pointer fallback in `page-home.css`, without adding a fifth stylesheet to the homepage |
| Recent sales cards appear repeated and too small | `account.js` duplicates the card group for a marquee; Home displays it as a static grid | Hide the `aria-hidden` duplicate group, disable marquee layout for touch screens, and show cards in 2 columns (1 column at narrow widths) |
| Tenant header says “Lại Húp File” while hero says a tenant name such as “NVP Studio” | Legacy generic `siteName` values were treated as intentionally configured branding | Generic legacy names now fall back to `settings.studio`; static header flash starts as “TeoStudio” |
| Main Detail header still shows legacy Lại Húp File brand | Static header markup still used the old text and raster logo | Replaced with `logo-wordmark-dark.svg` and TeoStudio title in `detail.html` and `product-detail-view.html` |

## Files changed

- `frontend/assets/css/page-account.css`
- `frontend/assets/css/page-home.css`
- `frontend/assets/css/mobile-touch-fixes.css` (new)
- `frontend/assets/js/tenant-share.js`
- `frontend/share.html`
- `frontend/detail.html`
- `frontend/product-detail-view.html`
- `frontend/tenant-detail.html`
- `scripts/test-mobile-screenshot-regressions.mjs` (new)

## Explicitly not diagnosed from screenshots alone

The NVP Studio Share screen displays “Chưa có file.” The frontend renders that empty state when the public tenant API supplies an empty product list (or when a selected tag filters the list to empty). The screenshot alone cannot distinguish missing tenant product records, API response issues, or a tag/filter mismatch. This patch does not fabricate files or modify tenant data. Verify `/api/public-tenant/{slug}` response and current tenant tags before changing D1 or Worker logic.

No production Cloudflare Worker/D1 logs were available, so this patch makes no claim about live server errors. It also does not remove the legacy Note module; that remains a separate migration because the replacement module requirements must be specified before deleting its data/routes.

## Verification

- Targeted screenshot regression test: PASS
- `scripts/check-build.sh`: PASS, 40/40 groups
- All `scripts/test-*`: PASS, 45/45 files
- `scripts/check-local-refs.mjs`: PASS, 53 HTML/CSS files
- `scripts/check-inline-js.mjs`: PASS, 8 inline scripts
- `scripts/sync-build-id.mjs --check`: PASS
- `check-design-rules.mjs` on `page-account.css`, `page-home.css`, and `mobile-touch-fixes.css`: PASS, zero hard violations and zero warnings in these three files
- Full legacy `frontend/assets/css`: still FAIL with the pre-existing 490 `!important` and 14 legacy purple/pink matches; this patch intentionally did not mass-rewrite unrelated admin/seller/Note styles
- Visual Chromium screenshot capture: NOT VERIFIED; headless Chromium failed to complete a local screenshot in this execution environment. Must still be viewed on Android, including Chrome “Desktop site” mode.
- Live D1/API data, Turnstile, payment provider callbacks, and production Worker logs: NOT TESTED

## Skill basis

Reviewed the official `vercel-labs/skills` `find-skills` SKILL.md and the pinned Vercel Web Interface Guidelines reference. The current execution runtime is Node.js 22.16.0; the official Skills CLI README requires Node.js 22.20 or later. Therefore the `npx skills add ...` installation was not completed here. The guideline checks were read and applied manually to the changed UI/CSS. No claim of a successful CLI installation is made.
