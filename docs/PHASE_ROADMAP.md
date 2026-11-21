# TeoStudio — Phases after V60.3

V60.3 only completes Phase 0 and safe Phase 1 quick wins from `TEOSTUDIO_FIX_BRIEF.md`.

## Next phases

1. **Phase 2 — Design tokens and CSS layers:** introduce one token source, role accents, SVG icon system, larger mobile typography and merge overlapping page patches. Do not remove `!important` in one blind bulk pass; remove it per page with visual regression screenshots.
2. **Phase 3 — Portal registry and capability authorization:** first migrate Notifications + Support only, write Worker `can(role, capability)`, and test the full role/capability matrix before moving wallet, payout, ads or analytics. Keep all data scope enforcement in Worker.
3. **Phase 4 — Role-specific layouts and motion polish:** separate Master, Studio, Seller and Buyer page layouts; use Playwright at 390/768/1280px and real Android performance checks.
4. **Optional Phase 5:** split Worker and `tenant-admin.js` into modules only after tests pass before and after, without changing routes or behavior.

Do not bundle all phases into one enormous change. Each phase should have a small diff, a rollback point and a passing test gate.
