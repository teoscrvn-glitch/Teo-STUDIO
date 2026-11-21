# Deploy TeoStudio V58.1

## Before deployment

1. Back up the production D1 database and current frontend/Worker release.
2. Preserve all existing Cloudflare Worker secrets and variables; do not delete or replace payment, email, AI, Link4M, BumX, Telegram, Turnstile or card-provider secrets.
3. Recommended: add a new Worker Secret named `NOTE_FLOW_SECRET` (use a long random value). Do not put the value in `wrangler.toml`, source code or Git. The Worker also supports existing server secret fallbacks, but a dedicated key avoids coupling Note sessions to Admin-key rotation.

## Deploy

From the `cloudflare` directory, deploy the Worker using the existing `wrangler.toml`. Publish the `frontend` directory as the configured Assets binding (`../frontend`). The Worker calls `ensureTenantSchema` and applies additive Note/progress table migrations when the public tenant API is first reached. No destructive migration is intended.

Example:

```bash
cd cloudflare
npx wrangler deploy --config wrangler.toml
```

If your deployment pipeline already deploys Worker and Assets together, use that pipeline instead. Do not create a second D1 database; keep the configured `teo-studio` binding.

## Production smoke test

1. Open `/account.html` on a short Android screen and confirm the sign-in/register form appears before the footer.
2. Log in as a Free renter and verify the Studio creation limit is one.
3. Verify VIP Studio creation is limited to three only after a paid, active VIP Studio exists; a pending checkout must not grant VIP entitlement.
4. In Tenant Admin, create a Note, choose a theme, upload a cover image, add ordered platform steps and save it.
5. Open the Studio Share page, click **Mở trang Note riêng**, copy its URL and open it in another browser tab.
6. Test one Note flow end-to-end: start, open each step, return, wait for the minimum interval, confirm, then reveal the final destination.
7. Try opening the next step directly, replaying a redirect ticket, or calling progress without the Note cookie; these must not unlock the next step.
8. Confirm hidden Notes are not publicly listed and that one Studio cannot read another Studio's Note records.

## Important limitations

- This package has not been deployed to Production. Run the smoke tests above on your Cloudflare Worker and Android browser after deployment.
- The Note flow validates ordered link opening and confirmation, not actual social follow/join actions. Do not advertise it as social-action verification.
- Ad placement choices are future integration points only. No ad SDK, impression validation, confirmed-revenue callback, revenue settlement, or visitor rewards are enabled in V58.1.
- Note tags are not yet synchronized with file tags.
