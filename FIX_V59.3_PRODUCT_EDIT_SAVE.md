# V59.3 — Product edit persistence fix

- Master Admin product PUT now checks affected rows, reads the row back, and verifies title/download URL before returning success.
- Tenant Admin product PUT now scopes updates through tenantInSql (supports tenant legacy key variants), checks affected rows, and verifies persisted title/download URL.
- Both Admin forms await list refresh and compare the freshly loaded record before showing success or clearing the form.
- Cache-busting query versions updated for active Admin scripts to prevent stale JS from masking fixes.

Deploy frontend assets and Worker together. Test edits in Master Admin and Tenant Admin against staging D1 before production.
