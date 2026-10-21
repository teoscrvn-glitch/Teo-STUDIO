# Deploy V56.22 from Android

1. Download and unzip `TeoStudio-V56.22-Social-Preview-AI-Fix.zip`.
2. Copy the contents of `cloudflare/`, `frontend/`, and release docs into the root of the existing TeoStudio repo (do not add an extra nested folder).
3. Keep the existing Cloudflare Secrets and D1 binding. Do not reset D1.
4. Commit/push and wait for Cloudflare Worker Builds to complete.
5. Open `/api/health` and verify `version` and `frontendVersion` are `v56.22-social-preview-ai-request-fix`.
6. In Admin, run “Thử kết nối AI”. If it still fails, share the provider HTTP status and sanitized error text only; never share API keys.
7. Test the same `/detail?id=...` link in a new Zalo/Telegram message. Preview crawlers may cache prior metadata, so do not use an old message as the only test.
