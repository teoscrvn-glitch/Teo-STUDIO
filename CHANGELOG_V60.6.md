# TeoStudio V60.6 — Performance & Purchase Flow Fix

- Fixed the unstyled account/login overlay and oversized assistant avatar appearing below detail-page content after the legacy stylesheet was removed.
- Unauthenticated or expired-session purchases now route to the dedicated Account login page and preserve the return URL.
- Replaced full-DOM animation scanning with a selective visibility observer.
- Reduced Admin startup blocking: Admin Key interactions bind immediately; Master Admin optional data and Tenant Admin analytics/audit/wallet modules load in the background after core UI readiness.
- Skipped unnecessary reveal observers on Master/Tenant Admin screens.
- Rebuilt detail foundation CSS; detail pages remain within the 3-stylesheet limit.
- Bumped build/cache identity to `v60.6-performance-purchase-fix`.
- No API route, payment logic, auth policy, D1 schema, or migration changes. Worker change is BUILD_VERSION only.
- See `TEST_REPORT_V60.6.md` for tests and limitations.
