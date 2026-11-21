# TeoStudio V60.3 — Test Report

## Automated checks

- `bash scripts/check-build.sh`: **39/39 steps passed**.
- `node scripts/check-inline-js.mjs`: **9 inline script blocks checked, 0 syntax failures**.
- `node scripts/check-local-refs.mjs`: **47 HTML/CSS files checked, no missing local references**.
- `node scripts/sync-build-id.mjs --check`: passed; Worker/config/HTML metadata and local CSS/JS cache versions are synchronized.
- Worker and frontend JavaScript syntax checks are included in `check-build.sh` and passed.

## V60.3-specific regression

- Unified `VERSION.txt`, Worker `BUILD_VERSION`, frontend config, page metadata and 380 CSS/JS cache references.
- Archive contains seven unreferenced legacy Admin scripts; `admin-v14.js` remains the live Admin script.
- Mobile backdrop-filter guard is present.
- Infinite CSS animations are paused when targets leave the viewport and while the document is hidden; `prefers-reduced-motion` bypasses the guard.
- High-cost body/admin background blur/animation declarations were replaced with static radial gradients.
- The only `transition: all` declaration in the frontend CSS was replaced with explicit properties.

## What this report does not prove

These are source-level, syntax, static-reference and local SQLite/mock tests. No live Cloudflare D1 production operation, payment callback, Telegram delivery, Lighthouse run or Android device FPS measurement was performed. Do not treat this as a production security certification or measured Core Web Vitals result.
