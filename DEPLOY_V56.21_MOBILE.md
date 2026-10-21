# Deploy V56.21 from Android

1. Download and extract `TeoStudio-V56.21-Detail-Redirect-Loop-Fix.zip`.
2. In the existing GitHub repo, copy the contents of `cloudflare/`, `frontend/`, and `scripts/` into the matching repo folders (do not add an extra nested folder).
3. Commit and push; wait for Cloudflare Worker Builds to finish.
4. Open `https://teostudio.top/api/health`; confirm `version` and `frontendVersion` both equal `v56.21-detail-redirect-loop-fix`.
5. Test the existing file link `https://teostudio.top/detail?id=<existing-file-id>` in a private tab.
6. In Cloudflare Observability, open that request event. Expected final response status is 200. If it remains 307, expand response headers and inspect `location` before making further changes.

Do not delete Cloudflare secrets, reset D1, or change payment settings for this update. This package has not been deployed to production by the assistant.
