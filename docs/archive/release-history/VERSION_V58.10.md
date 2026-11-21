# TeoStudio V58.10 — Page-specific Visual System

## Goal
Give each major product area its own visual identity while keeping the existing V58.9 behavior, data contracts, Cloudflare Worker routes, D1 schema and payment ledgers intact.

## Included
- One shared local visual stylesheet and one small local behavior script, loaded on all frontend HTML pages.
- Distinct page skins for Home, Share, Master Admin, Studio Admin, Seller Center, Download, Notes, Wallet, Earnings, Free, Rental, Product Detail and Legal pages.
- Separate color accents and visual motifs per area; restrained depth, layered surfaces and distinct button states.
- Lightweight pointer-based 3D tilt applied only to at most eight selected cards on desktop pointer devices. Tilt is capped at 4.2 degrees.
- No WebGL, Three.js, CDN, remote font, external runtime dependency or perpetual animation loop.
- Touch devices receive static depth styling rather than pointer tilt. `prefers-reduced-motion` disables motion effects.
- Existing business fields and transaction disclosures are not removed. Public views should show only decision-useful content; API keys, internal IDs, proof tokens, D1 details and debug messages remain administrative/internal data.

## GitHub research references
- `themesberg/flowbite-admin-dashboard`: study the admin navigation, filters, tables and data-page hierarchy. The repository README identifies the template as MIT licensed and based on Flowbite/Tailwind; its framework was not installed because TeoStudio is a static HTML/CSS/JS frontend.
- `shadcndashboard/shadcndashboard`: study responsive dashboard layouts, charts and table organization. The React/Vite stack was not transplanted into the existing Worker assets.
- `micku7zu/vanilla-tilt.js`: MIT-licensed reference for pointer tilt options and reduced intensity; a smaller project-local implementation was used instead of adding the ~8.5 KB minified library.
- `silvvrodriguez/micro-interactions-library`: reference for small, dependency-free CSS/JS feedback patterns. No files were copied.
- `NerdBlud/3DAnimatedCard`: inspected as a 3D card visual reference. No code was copied because a clear license file was not found during review.

## Compatibility
This is a frontend-only visual patch. The API build ID remains V58.9 because Worker routes and server behavior are unchanged. The visual asset version is V58.10. No D1 migration is required.

## Validation
Run `sh scripts/check-build.sh`. The added V58.10 check validates all page includes, page skins, reduced-motion behavior, tilt cap, element cap, and absence of heavyweight 3D or remote runtime dependencies. Browser/device rendering still requires manual preview testing.
