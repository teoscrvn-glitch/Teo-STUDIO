# TeoStudio V60.4 — Responsive File Manager Upgrade

## Changes
- Replaced the compressed multi-column product table in both master and tenant admin with responsive file cards.
- Added a header-level Create File action and modal editor while preserving the existing create/edit API flow.
- Added up to 8 additional gallery images, one preview video (20 seconds maximum), per-file ad toggle, and up to 8 named Free continuation links for master and paid tenants.
- Public detail pages support image auto-advance every 2 seconds, manual arrows, touch swipe, and optional preview video.
- Free button opens the 10-second download flow only when per-file ads are enabled; ads disabled means the configured Free URL opens directly.
- Paid purchase remains on the wallet/purchase flow and does not use the Free wait screen.
- Added file analytics, QR view, original/share URLs, hide/show, edit, delete, and ad toggle actions to the admin cards.
- Added a visual-mode toggle for the admin file list.
- Free tenants cannot use premium media/ad/continuation features. The Worker hides these features publicly and preserves previously stored premium fields during a Free-plan downgrade.
- D1 schema updates are additive only; no table reset or existing row deletion is performed.

## Important limitation
The current repository has no configured ad-network SDK/provider credentials. The 10-second flow therefore shows a clearly labeled ad placement, not a live paid advertisement. Connect the chosen provider's official SDK/snippet before treating the placement as real ad delivery or counting ad revenue.

## Media limits
- Up to 8 supplemental images per file.
- Uploaded preview video: MP4/WebM, maximum 20 seconds and 700 KB.
- HTTPS video URL: the browser checks metadata and rejects durations over 20 seconds when metadata is readable. The Worker validates the HTTPS URL format but cannot independently inspect the media duration for arbitrary third-party hosts.
- Up to 8 named Free continuation buttons per file.
