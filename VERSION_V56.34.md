# V56.34 — Graphics Tiers Motion Library

## Included
- Adds three graphics tiers: Lite, Balanced, Premium. Existing saved `lite` and `premium` selections are preserved; users without a selection receive a conservative hardware-aware recommendation.
- Disables the old continuously animated body background in all tiers. Uses a static technology grid by default.
- Adds opacity/transform-only off-screen product/rent-step reveals, observed only on cards and the product grid rather than the whole document.
- Pauses animations in hidden tabs and honors `prefers-reduced-motion`.
- Uses native cross-document View Transitions where supported and motion is permitted; tag filtering uses the native API only when available, with instant fallback.
- Adds static-size API loading skeletons for the main and tenant Share File product grid; the sheen only animates opacity and is disabled in Lite/reduced-motion mode.
- Premium mode adds low-frequency transform-only hero motion and fine-pointer-only product spotlight/very-light tilt. No animation FPS guarantee is made; actual performance depends on the device/browser.
- Bumps Worker/config fingerprints and all HTML/CSS/JS cache query versions to V56.34.

## Validation
- `scripts/check-build.sh` checks Worker and all frontend JavaScript syntax plus static feature/version invariants.
- This is local/static validation. It does not prove live Cloudflare behavior, real Android frame rate, D1 transactions, payment flows or tenant isolation.
