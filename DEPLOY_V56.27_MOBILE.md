# Deploy V56.27 from mobile

1. Upload the ZIP contents to the same GitHub repository and deployment branch used by the `teo-studio` Cloudflare Worker.
2. Wait for Cloudflare Workers Builds to report success. Do not create a new Worker and do not replace other secrets.
3. Open `https://teostudio.top/api/health`; confirm `version` and `frontendVersion` both show `v56.27-detail-route-ai-diagnostic-antibypass`.
4. Open a product from the homepage. Normal browsers should receive `detail.html` without waiting for a D1 lookup for social metadata; product details then load from `/api/products/{id}`.
5. If `TELEGRAM_CHAT_ID` is missing again, add it as a **Secret** in Worker Production settings (or add `ID_CHAT_TELEGRAM` as a Secret for the legacy alias) because Wrangler-managed `[vars]` may overwrite dashboard variables. Use the current chat ID privately; do not commit it into the repository. The existing bot token remains a Secret.
6. For AI testing, run Admin → Thử kết nối AI. If the provider says `User location is not supported for the API use`, the Google endpoint was reached but Google refused use under the request's location/account/project eligibility; confirm eligibility/region and account requirements. Do not repeatedly change the URL or publish the API key.
7. Check that free/unlock links still require their existing verification flow, and that a paid product does not disclose its original download link before the server confirms purchase.

This ZIP has static syntax and invariant checks, not live Production testing.
