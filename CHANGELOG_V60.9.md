# TeoStudio V60.9 — Mobile Catalog, Sales Ticker & Context Navigation

## Mobile catalog
- One shared responsive catalog stylesheet now applies to the main homepage, legacy `/2`, and tenant `share.html` page.
- Phone/coarse-pointer layouts use two columns; desktop uses three columns. Product thumbnail aspect ratio is constrained and title/meta/description/price/view content is kept visible beneath the image.
- Recent purchase cards remain a continuous duplicated ticker, moving left-to-right with a slowly cycling blue/teal/violet edge. Reduced-motion preference is respected.

## Navigation and IDs
- Leaderboard opens in a same-document overlay on all pages that load the shared navigation script; URL path and original query remain unchanged while `#teo-rankings` is appended to history. Back/Escape/close restore the parent route and scroll position.
- The leaderboard iframe receives all known tenant, Studio, scope and AI/assistant identifiers. A generic `id` on an AI/assistant route is retained as `ai_id`.
- Account navigation adds a safe same-origin `return` route. Account Back and brand links use that route, then the remembered route, then a tenant-aware Share URL or `/2`.
- Master Admin logo remains an in-shell dashboard shortcut.

## Safety
- No Worker route, D1 schema/data, authentication policy or payment logic was changed.
- Generic non-leaderboard navigation remains native to avoid breaking existing forms/session bootstraps.

## Follow-up coverage
- Extended the same catalog CSS to `share.html`; the first V60.9 pass covered only the main and legacy catalog pages.
- Account links now strengthen an explicit generic return path with current tenant/AI context instead of preserving a bare `/share` path that could lose a Studio slug.
- Leaderboard iframe receives whitelisted AI/assistant IDs while its `source` parameter carries only the pathname, not arbitrary source query values.
