# Deploy TeoStudio V60.2

1. Back up D1 before deployment.
2. Deploy the updated Cloudflare Worker from `cloudflare/worker.js`.
3. Deploy the complete `frontend/` directory, including `assets/js/admin-v14.js` and `assets/js/config.js`.
4. Open `/admin` in a fresh browser tab or clear the site's cached files.
5. In a test paid product, edit the visible field “Link gốc tải sau khi mua”. Save.
6. Confirm the list's link opens the new URL, reload `/admin`, reopen the same file and confirm the new URL remains.
7. Test the product detail and a low-value/test purchase in staging; purchase delivery must also return the new URL.

Do not deploy frontend without the Worker change: the stale-link precedence is fixed server-side as well as client-side.
