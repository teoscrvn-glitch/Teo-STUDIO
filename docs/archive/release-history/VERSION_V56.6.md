# TeoStudio V56.6 — Admin Route Fix

Based on V56.5 manual-IP-block source.

This release fixes a routing/authentication regression: the fallback static asset serving path was behind a global admin-session guard. The guard is now scoped to `/api/admin/` requests, so public pages are not required to have an admin session.

Manual IP/email blocklist behavior from V56.5 is retained. Automatic temporary IP bans remain disabled.

Local syntax/static tests pass; live deployment and payment testing have not been performed. Preview first; preserve V54 for rollback.
