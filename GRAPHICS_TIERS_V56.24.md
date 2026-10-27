# TeoStudio V56.24 — Graphics Tiers Preview

## Graphics modes
- **Lite (default):** existing page styling plus a small settings controller. Premium art/CSS are not requested in Lite mode.
- **Premium (opt-in):** after selecting Premium, the browser loads `assets/premium/premium.css` and `assets/premium/teo-linh.webp`. The WebP asset was optimized from the supplied concept image.
- **Sound:** disabled by default. If enabled, the UI uses a very short Web Audio tone; no audio file is downloaded.

## Files added
- `frontend/assets/css/graphics-tiers.css` — lightweight settings UI.
- `frontend/assets/js/graphics-tiers.js` — local mode preference, lazy asset loading, and optional sound.
- `frontend/assets/premium/premium.css` — fetched only after Premium is selected.
- `frontend/assets/premium/teo-linh.webp` — fetched only after Premium is selected.

## Notes
- Preferences are stored in localStorage on the current browser/device. Default is Lite.
- Returning to Lite removes the Premium stylesheet and releases the image reference; browser cache may retain already-downloaded bytes.
- No Worker, API, D1 schema, rental, payment, or account logic was intentionally changed.
- This is a preview build. Archive integrity and basic JS/CSS syntax checks are not equivalent to browser/device testing.
