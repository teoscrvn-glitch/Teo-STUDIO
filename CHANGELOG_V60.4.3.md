# TeoStudio V60.4.3 — Admin interaction freeze fix

## Root cause found in source
Both `admin.html` and `tenant-admin.html` loaded `performance-guard.js`. That script walked the entire document (`querySelectorAll('*')`) and called `getAnimations()` for every element during startup, then observed broad class/style mutations. The Admin pages contain very large management DOM trees. On mobile, this expensive scan can monopolize the main thread and make the login form appear frozen. Public Share pages do not load this script, matching the reported contrast.

## Changes
- Skip the animation-scanning performance guard on pages with `body.admin-body`.
- Keep the guard active on public pages.
- Add a 5-second abort timeout to stored Admin session validation.
- Bump the performance guard asset version on both Admin pages.

## Safety
- No Worker routes, D1 schema/data, secrets, Admin Key, or tenant credentials changed.
- Frontend-only patch.
- Live browser interaction still needs verification after deployment.
