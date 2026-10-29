# Deploy V56.53 — AI Knowledge

1. Upload/deploy the complete frontend and `cloudflare/worker.js` through the existing Cloudflare Worker Build pipeline.
2. Keep existing Worker Secrets and Variables; do not delete/recreate them as part of this upgrade.
3. For live web lookup, set `TAVILY_API_KEY` as a **Secret** in Worker Production variables/secrets. Without it, the assistant will not actually search the internet.
4. Open `https://teostudio.top/admin.html`, sign in, then open **🧠 Huấn luyện AI** in the sidebar (or visit `/ai-training.html`).
5. Add a small test note with a unique title and a content paragraph longer than 20 characters. Ask the AI a matching question and verify that it uses the note correctly; then remove the test note.
6. Test mobile layout, normal chat, image chat, and web-search questions. Confirm the AI does not claim it searched when `TAVILY_API_KEY` is missing or the provider fails.
7. The knowledge base stores curated notes in D1; it does not retrain the underlying model. User conversations are not automatically copied into the knowledge base.
8. Free Admin bypass remains disabled until a real server-side verification provider is configured. Link4M/BumX shortener API keys alone are not completion proof.

## Checks performed locally

- `node --check cloudflare/worker.js`
- Archive structure and new page reviewed locally.

These checks do not test the live Cloudflare Worker, D1 binding, AI provider, Tavily quota, or payment/email/webhook flows.
