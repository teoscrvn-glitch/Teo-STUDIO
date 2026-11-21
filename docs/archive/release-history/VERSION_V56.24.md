# TeoStudio V56.24

- Preserves support for the existing Telegram chat ID variable `ID_CHAT_TELEGRAM` as a backward-compatible alias for `TELEGRAM_CHAT_ID`; it does not require deleting or renaming the old variable.
- Improves Gemini provider error extraction for HTTP 400/401/403/404/429, including non-JSON response bodies, while redacting common API-key patterns.
- Build version: `v56.24-ai-error-detail-telegram-id-alias-fix`.
- Syntax checked locally. Not deployed or live-tested against the user's Cloudflare/Gemini account.
