# Deploy V56.33 (mobile)

1. Back up the currently deployed source/configuration.
2. Upload/deploy the complete package, including `frontend/assets/img/teo-linh-v2.webp`, the updated `frontend/assets/js/assistant.js`, `frontend/assets/css/style.css`, and HTML files.
3. If using Cloudflare Worker + Static Assets, deploy both Worker and static assets from the same package. Do not replace Secrets or D1 bindings.
4. Open `/api/health` and confirm the reported version if the health endpoint exposes it.
5. On mobile, reload the site and check: AI button shows the new anime image; tapping gives a small scale effect; panel opens without a large character banner; page transitions are subtle; keyboard does not make the panel jump.
6. If the image still appears broken, inspect the network request for `/assets/img/teo-linh-v2.webp?v=56.33` and verify the deployed asset path.

This package has not been deployed or tested on a physical phone by the assistant.
