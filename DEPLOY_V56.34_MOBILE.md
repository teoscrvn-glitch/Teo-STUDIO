# Deploy V56.34 on mobile

1. Download `TeoStudio-V56.34-Graphics-Tiers-Motion-Library.zip` and extract it.
2. Deploy the updated Worker and the whole `frontend/` Static Assets directory from this same package together. Do not deploy only `frontend/` or only `cloudflare/worker.js`; the build fingerprint and cache keys must match.
3. Preserve all existing Cloudflare Secrets and production variables. This graphics update does not require changing API keys, Telegram tokens, SePay credentials, D1 bindings or other secrets.
4. After deployment, open `https://teostudio.top/api/health` and check that `version` is `v56.34-graphics-tiers-motion-library`.
5. Refresh the website; open **Đồ họa** in the header and test Lite, Balanced, Premium. Lite should be the quickest option; Balanced is the recommended default on capable devices; Premium adds hero motion and mouse spotlight only on desktop-like pointers.
6. Test the homepage and a tenant Share File page: verify cards appear after loading, switch tags, navigate between pages, open/close Teo Linh, and open/close the mobile keyboard. Check landscape and portrait.
7. If the UI flashes, open Developer Tools/console if available and save the exact error plus `/api/health` output; do not delete production data or rotate secrets as part of this graphics test.

## Notes
- Do not expect guaranteed 60–120 FPS; that requires real-device measurement.
- This package has not been deployed or tested on a physical phone in this environment.
- Existing unresolved production issues (including `TENANT_REQUIRED`, Admin Free/Share File oddities and purchase-feed visibility) must be verified independently after deploy.
