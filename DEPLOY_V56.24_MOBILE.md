# Deploy V56.24 (mobile)

1. Upload the contents of this ZIP to the same GitHub repository and deployment branch used by the existing `teo-studio` Worker.
2. Wait for Cloudflare Workers Builds to finish successfully.
3. Open `/api/health`; confirm `version` and `frontendVersion` are `v56.24-ai-error-detail-telegram-id-alias-fix`.
4. In Admin, run **Thử kết nối AI** and read the detailed provider response.
5. Telegram: the Worker now accepts either `TELEGRAM_CHAT_ID` or the legacy `ID_CHAT_TELEGRAM`. Keep the existing variable; do not delete secrets. Run Telegram test after deployment.

Do not paste API keys or bot tokens into chat.
