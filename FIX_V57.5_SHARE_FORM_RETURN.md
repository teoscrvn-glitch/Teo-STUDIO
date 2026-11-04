# V57.5 — Share/form/response safety patch

- Guarded form field access in tenant admin and public share comments.
- Public tenant bootstrap now reads response text safely and handles empty/non-JSON bodies with a user-facing message rather than throwing `Unexpected end of JSON input`.
- Bumped Share script cache version to 57.5.

This is a targeted client-side patch. It does not prove the underlying server endpoint is healthy; if it returns an empty response, the page now reports that clearly. Login return handling in account.js already supports same-origin `return` paths; keep using `?return=%2Fshare` for the public Share entry.
