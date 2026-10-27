# TeoStudio V56.38 — consolidated source handoff

Based on V56.37 Tag Video Partial, preserving its full project tree and assets.
Changes in this handoff:
- Added persistent main-admin setting `registerTutorialVideoUrl` to the existing settings allowlist and settings form submission.
- Added tenant-scoped PUT support for updating tenant tag name, parent, and YouTube video URL.
- Added tenant tag edit UI and kept tenant scope in the Worker update query.
- Kept existing tag video embedding and assets from V56.36/V56.37.
- Updated version labels and added a deployment note.
Validation: static syntax/build checks only; no live D1, Cloudflare production, crawler, or mobile browser test has been performed.
