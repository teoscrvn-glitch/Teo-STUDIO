# Deploy V56.26 from mobile

1. Upload the contents of this ZIP to the same GitHub repository and deployment branch used by the existing `teo-studio` Worker.
2. Wait for Cloudflare Workers Builds to finish successfully.
3. Open `/api/health` and confirm `version` is `v56.26-detail-runtime-diagnostics-fix`.
4. Open a product detail URL again. If it still fails, the page should now show a visible error instead of a blank screen; send that exact message.
5. Do not replace or delete existing Cloudflare Secrets/Vars as part of this update.

This package has not been tested against the live production database.
