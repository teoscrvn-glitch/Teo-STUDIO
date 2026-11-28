# TeoStudio V60.9 — Test Report

## Build and functional parity
- `bash scripts/check-build.sh`: PASS, 41/41 stages.
- `node scripts/check-feature-parity.mjs frontend`: PASS — required IDs, forms, fields and handlers preserved versus the project baseline.
- `node scripts/check-local-refs.mjs frontend`: PASS — 64 HTML/CSS files checked.
- `node scripts/check-inline-js.mjs frontend`: PASS — 7 inline scripts, 0 failures.
- `node --check frontend/assets/js/teo-navigation-v609.js`: PASS.
- `node scripts/sync-build-id.mjs --check`: PASS.
- ZIP integrity: verified after packaging.

## V60.9-specific checks
- Main homepage, legacy `/2`, and tenant `/share` load the shared mobile catalog stylesheet.
- CSS enforces 3 columns on desktop, 2 columns on phone widths, and 2 columns for coarse-pointer devices up to 1024px (including Android desktop-site widths around 980px).
- Product card body/title/metadata/description/price/view fields are explicitly kept visible; thumbnail ratio is constrained.
- Recent sales feed keeps the duplicated horizontal track and moves left-to-right; border glow cycles blue/teal/violet. Reduced-motion preference disables the continuous animation.
- Leaderboard is opened in an overlay on the current document. Parent pathname and query string are not replaced; a `#teo-rankings` history entry allows Back to close the overlay.
- Leaderboard iframe receives whitelisted tenant/Studio/scope/AI context identifiers. Generic `id` on an AI/assistant route is carried as `ai_id`.
- Account navigation carries a same-origin `return` route; account Back/brand shortcuts are restored to that route with tenant/AI context retained.
- Master Admin logo remains an in-shell dashboard shortcut.

## Design lint status
- `node scripts/check-design-rules.mjs` still reports repository-wide debt: 1,909 `!important` occurrences and 14 legacy purple/pink color occurrences (plus advisory counts for backdrop/infinite motion/hex colors).
- The repository-wide design linter therefore does not pass. These counts should not be presented as a clean stylesheet migration.

## Not verified in this environment
- No visual before/after browser screenshots were captured; the available headless Chromium process timed out during screenshot capture.
- Android Chrome touch behavior at 390px and Android “Desktop site” at ~980px still requires device verification.
- Live Cloudflare Worker/D1 behavior, payment callbacks, Telegram delivery and production page latency were not exercised.
- No D1 migration, API route, auth policy, payment flow or Worker business logic was intentionally changed.
