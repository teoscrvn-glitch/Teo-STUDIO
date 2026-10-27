# TeoStudio V56.40.2 — Mobile performance pass

- Added a mobile performance profile to reduce continuous background/aurora animations, blur filters, and hover transforms on screens <=700px, targeting Android browsers and Acode Preview.
- Reduced AI transcript DOM rendering to the latest 30 messages in the visible panel. Saved history remains unchanged; request context remains bounded by the existing logic.
- Reduced AI panel shadow cost and adjusted mobile panel height to leave more room for the keyboard and page content.
- Updated frontend asset query versions to force cache refresh after deploying the new CSS/JS.

## Validation
- `node --check frontend/assets/js/assistant.js`: passed.
- `node --check cloudflare/worker.js`: passed.
- `sh scripts/check-build.sh`: passed all 9 groups.
- Not tested: physical phone rendering, Acode's WebView profiling, live Cloudflare Worker, D1 or production traffic. This is a targeted performance mitigation, not a claim that every source of lag is resolved.
