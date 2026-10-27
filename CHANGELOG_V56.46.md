# TeoStudio V56.46 — Tenant Sale Modes

- Tenant Admin now exposes exactly three primary delivery modes:
  1. FREE 100% / Vượt link (direct download plus bypass link).
  2. Vượt link miễn phí / Mua file (bypass destination plus paid origin).
  3. Chỉ mua file (paid origin only after purchase confirmation).
- Tenant product API validates and persists each mode and its corresponding links.
- Public Share cards expose only title, description, thumbnail, and an explicit mode/price label; action links are resolved on the detail page.
- Detail page shows large green direct-free/bypass buttons; the mixed bypass/buy mode shows both actions. Paid-only links are not returned by the public detail API.
- Tenant Free plan cannot enable paid/bypass-and-buy modes.
- Existing legacy `free`, `unlock`, `paid`, and `both` records remain recognized.

## Validation
- JavaScript syntax checks: `cloudflare/worker.js`, `frontend/assets/js/tenant-admin.js`, `frontend/assets/js/tenant-share.js`, `frontend/assets/js/tenant-detail.js`.
- Static assertions cover all three UI modes and public paid-link hiding.
- Production D1 / wallet checkout / external bypass-provider behavior must still be verified after deployment.
