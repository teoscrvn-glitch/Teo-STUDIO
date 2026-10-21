# Deploy V56.25 (mobile)

1. Upload the contents of this ZIP to the same GitHub repository and deployment branch used by the existing `teo-studio` Worker.
2. Wait for Cloudflare Workers Builds to finish successfully.
3. Open `/api/health`; confirm `version` and `frontendVersion` are `v56.25-detail-white-screen-fix`.
4. Open a file detail link again. The asset URLs now use absolute `/assets/...` paths and cache version `56.25`.
5. If file data still cannot load, the detail page should show an explicit error instead of remaining blank. Send the displayed error text to diagnose the API/D1 cause.
6. Retest AI and Telegram separately; this update preserves V56.24's diagnostics and Telegram legacy chat-ID alias.

Do not paste API keys or bot tokens into chat. This package passed syntax checks but has not been live-tested on production.
