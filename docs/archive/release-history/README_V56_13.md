# TeoStudio V56.13 — Tenant dashboard fix

Root cause found: `updateProductModeFields()` was invoked outside the `bind()` scope although it was declared within `bind()`. The resulting uncaught ReferenceError stopped the dashboard's event binding. V56.13 fixes the scope, makes data panels fail independently, syncs hidden/visible filter styles, and persists observed non-secret runtime vars in Wrangler config.

Read `DEPLOY_V56_13_TENANT_DASHBOARD.md` before deploying. This is a source patch, not a live Production test.
