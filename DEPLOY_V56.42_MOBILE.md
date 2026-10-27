# V56.42 deployment notes

1. Keep a backup of the current production files and Cloudflare D1 database configuration.
2. Review and merge the files from this package; this ZIP is not a verified export of the current production branch.
3. Deploy the frontend changes, including `frontend/assets/js/assistant.js` and `frontend/assets/css/style.css`.
4. Deploy `cloudflare/worker.js` only after reviewing the diff. Keep existing D1 bindings and secrets; do not reset the database.
5. Confirm the AI endpoint/model/key are configured in the Cloudflare Worker. The UI changes cannot fix missing or invalid provider secrets.
6. Test on mobile: header title next to avatar, action buttons in one row, hidden typing checkbox, create/select chat, auto-generated chat labels, image upload, normal text chat, and close X.

The assistant prompt improves task analysis and image-handling instructions but does not grant admin privileges. Server-side authentication and confirmation requirements remain in force.
