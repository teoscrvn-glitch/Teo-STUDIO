# Deploy TeoStudio V59.0

1. Back up the currently deployed Worker project and export/backup D1 before deployment.
2. Extract this archive and keep the existing Cloudflare bindings, D1 database ID, R2 bucket, routes, and secrets unchanged.
3. Deploy the Worker from `cloudflare/worker.js` using the existing `cloudflare/wrangler.toml` configuration.
4. Publish the complete `frontend/` directory to the existing static assets binding. Do not upload only the new CSS/JS files: the archive includes the full V58.15 application plus the V59 interaction layer.
5. Run `sh scripts/check-build.sh` before deployment. The suite should report 34/34 local groups passing.
6. Verify on staging using a phone: open Share, tap the floating music icon, enable music, turn click sound on/off, navigate to another page, then test with Android battery saver and reduced-motion accessibility settings.
7. Verify all existing login, Seller, purchase, wallet, withdrawal, top-up, Telegram and Note flows against staging D1 and real provider sandbox callbacks before production.

## Audio behavior
- No sound or music starts automatically.
- Ambient Share music is generated locally with Web Audio API and only begins after the visitor taps “Bật nhạc”.
- Click sounds are short locally generated tones; the preference is saved on that browser/device.
- If the browser/device blocks Web Audio or the user has not interacted, the site remains fully usable without audio.

## Important scope note
V59.0 adds the interaction layer only. It does not claim to complete Studio-specific membership billing/entitlements, provider-verified social tasks, or external ad network delivery. Those need separate database/API/provider integration and production tests. Do not enable a paid membership offer until that work is complete.
