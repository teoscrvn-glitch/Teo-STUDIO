# Deploy V56.45 — Tenant Repair

1. Back up the live frontend and Worker source.
2. Deploy `cloudflare/worker.js` with `cloudflare/wrangler.toml` as its configuration. Do not deploy only the Worker file while keeping an older Wrangler config.
3. The source config keeps these non-secret Production values: `AI_API_URL=https://openrouter.ai/api/v1/chat/completions`, `AI_MODEL=openrouter/free`, `TELEGRAM_CHAT_ID=-5376839466`, SePay account/bank values, and the Turnstile site key.
4. Keep all secret values in Cloudflare Secrets: `AI_API_KEY`, `ADMIN_KEY`, `SEPAY_API_KEY`, `OXMAIL_SMTP_PASS`, `TELEGRAM_BOT_TOKEN`, `TURNSTILE_SECRET`, and any other existing secrets. `TAVILY_API_KEY` is optional; add it as a Cloudflare Secret only if direct web search is wanted. Never place secret values in this ZIP or Wrangler vars.
5. Verify after deploy: send AI prompt; login and add comment on homepage; login and add comment on `/share?tenant=...`; create/edit a tenant item in each of the three modes; delete parent/child tag; confirm tenant recent sales are tenant-only; inspect today revenue/seller net/fees; choose a new buyer avatar image.

Important limitations: deployment is not performed by this package. Shared login is provided when the tenant is linked to a buyer account; an unlinked legacy tenant-only credential is not silently merged into a buyer identity. Tenant AI can suggest or prepare actions, but destructive/financial changes should still require explicit confirmation.
