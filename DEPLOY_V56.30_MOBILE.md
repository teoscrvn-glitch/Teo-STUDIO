# Deploy V56.30 (mobile-friendly)

1. Back up the currently deployed version first.
2. Deploy the files from this ZIP using the same workflow used for the current Worker and frontend assets.
3. Do not change or delete Cloudflare Secrets for this UI-only update.
4. After deploy, open Teo AI on mobile and verify:
   - No large animated portrait strip appears above the messages.
   - The chat header has no avatar.
   - The floating launcher still shows the character image.
   - Opening/closing is smooth and the input remains visible when the keyboard opens.
   - New chat/history and report confirmation still work.
5. Check `/api/health` to confirm the deployed Worker version is `v56.30-teo-ai-lightweight-mobile-fix`.

Rollback: redeploy the previous ZIP if any core UI or chat action regresses.
