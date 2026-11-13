# TeoStudio V59.0 — Interaction Experience

## Changes in this release
- Added a shared native CSS/JS interaction layer across frontend pages.
- Added a lightweight navigation progress indicator.
- Added viewport-triggered reveal transitions for cards, with `prefers-reduced-motion` support.
- Added generated click tones using Web Audio API. Click audio is user-configurable and stored locally.
- Added an optional ambient pad on Share pages. It is original audio generated in the browser; it does not autoplay and starts only after the visitor explicitly enables it.
- Added an accessible floating sound panel with separate music and click-sound controls.
- Added an opt-in `data-loading-label` helper for actions that explicitly declare a loading label.
- No external animation runtime, remote audio file, external font, or WebGL renderer was added. This keeps the new layer light on low-end phones.

## Animation research
- dotLottie Web: https://github.com/LottieFiles/dotlottie-web (MIT runtime; useful for designer-authored vector animation files, but adds a WASM runtime and should be loaded only where needed).
- Anime.js: https://github.com/juliangarnier/anime (MIT; suitable for timeline/SVG motion if a future complex sequence justifies a dependency).
- lottie-web: https://github.com/airbnb/lottie-web (MIT; mature player for After Effects-exported vector animation).

For V59.0 the project uses original CSS/SVG/native Web Audio effects rather than shipping a large library to every page. Third-party animation assets must be checked individually for license and attribution before inclusion.

## Explicit limitations
This release is an interaction/visual layer, not the completion of all previously requested commerce features. Studio-specific membership plans, member entitlements/renewal, member-only catalog/download center, provider-verified social tasks, live ad-provider delivery, and production payment/Telegram end-to-end validation remain separate work. Existing V58.15 functionality and API contracts were preserved.

## Validation scope
Run `sh scripts/check-build.sh` and JavaScript syntax checks. These are local static checks only; test audio on a real phone after a user gesture and verify D1/Worker/payment flows on staging before production deployment.
