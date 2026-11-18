# TeoStudio V60.0 — Community Hub & Landing

## Delivered in source
- `/` serves a new TeoStudio introduction page without changing the domain.
- The former resource catalogue is preserved at `/2`; `/index.html` redirects to `/2`.
- Added a second multifunction bubble below the AI assistant. It rotates, reveals actions progressively, and pushes the AI bubble upward while open.
- Moved Admin contact and community/group shortcuts into the bubble. Added up to 12 configurable custom link buttons in Master Admin and Tenant Admin settings.
- Added in-bubble music controls and locally generated click sound controls. Music only starts after an explicit user action.
- Removed the detached music dock that previously appeared independently on content/ranking pages.
- Added membership shortcut to main and tenant Share menus.
- Restyled rankings and corrected Home navigation: main rankings return to `/`; tenant rankings return to `/share?tenant=<slug>`.
- Added TeoStudio-specific pressed/focus feedback and suppressed the default blue Android tap flash.
- Updated shared palettes toward slate, teal, blue, green and amber; removed purple/pink defaults from tenant theme controls and safe-fallback handling for existing purple/pink accent values.
- Custom community links are normalized to HTTPS-only URLs, reject embedded credentials, and are rendered as escaped text.

## Scope and limitations
- Custom link buttons are available in both Master Admin and Tenant Admin, and render on the main/tenant Share surfaces.
- Music can use configured HTTPS audio/YouTube sources; when no source is configured, the bubble offers a locally generated ambient tone. TikTok URLs open TikTok rather than attempting embedded playback.
- Browser autoplay policies remain in force; music does not auto-play.
- Existing product thumbnails and user-uploaded content are preserved; this release does not replace seller/customer assets with generated artwork.
- This is a source-level security and UX improvement, not a penetration-test certification. The existing legacy CSP still uses `unsafe-inline`; a full nonce migration, session-cookie migration, Argon2id migration, D1 backup/restore test and production review remain separate work.
- No ad provider, social follow/join verifier, or external key vendor has been configured.

## Final polish (2026-11-18)
- Fixed a literal escaped newline between AI-bubble CSS rules so the AI assistant reliably moves clear of the expanded community panel.
- Rejected blank and `#` shortcut URLs before rendering/saving.
- Split the Studio rental page action (`/rent.html`) from the optional Zalo rental contact.
- Removed a duplicate purchased-membership entry in the main catalogue drawer.
- Updated the legacy Seller UI regression test to expect the new hand-authored SVG hero illustration.
