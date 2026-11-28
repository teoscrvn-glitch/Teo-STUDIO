# TeoStudio V60.8 — Admin Routing & Responsive Layout

## Navigation and stable URL context
- Added an in-place Admin leaderboard overlay for Master Admin and Tenant Admin.
- Leaderboard opens in an iframe over the current Admin shell; the underlying page remains mounted, so current panel, tenant slug, Admin session and query parameters are not discarded.
- Uses the `#teo-rankings` history state. Browser Back closes the overlay and returns to the exact Admin URL instead of navigating to the public homepage.
- Removed the standalone leaderboard top navigation while embedded; the parent Admin close control is the only exit from the embedded view.
- Existing `/rankings.html` links remain usable as standalone links outside Admin.

## Responsive catalog and image controls
- Added a page-specific catalog stylesheet: desktop uses three columns; mobile uses two columns, including narrow phones.
- Added robust image picker presentation so the plus/select-image affordance remains visible and touchable without changing upload logic.

## Preserved
- No Worker route, D1 schema/migration, payment logic, tenant entitlement or Admin authentication logic was changed.
- Existing ranking API, filters, self-rank and Top 100 renderer are reused unchanged apart from embed-mode presentation.

## Verification limits
- All 40 repository build checks pass.
- JavaScript syntax, generated detail foundation and build/cache synchronization pass.
- No live Cloudflare deployment or physical mobile/desktop browser interaction was available; deploy and verify both Admin modes before production rollout.
