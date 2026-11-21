# Deploy V56.44 — AI web search & activity

1. Back up the currently deployed frontend and Cloudflare Worker.
2. Upload frontend files from this package, including updated `assets/js/assistant.js` and `assets/js/config.js`.
3. Deploy `cloudflare/worker.js` to the existing TeoStudio Worker.
4. Keep existing secrets/bindings unchanged. Do not paste any API key into source code.
5. To enable live web search, create a Tavily API key and add it in Worker → Settings → Variables and Secrets as Secret `TAVILY_API_KEY`. This is optional; without it the AI should say live search is unavailable.
6. Existing model provider settings remain `AI_API_URL`, `AI_MODEL`, and Secret `AI_API_KEY` (e.g. OpenRouter if that is the configured provider).
7. D1 creates `buyer_activity_events` on first use. No manual SQL migration is required. Page visits are recorded only for authenticated buyer sessions on pages that load `assistant.js`; logout and successful wallet purchases are logged server-side.
8. Verify tenant isolation: purchase a file on tenant A and tenant B; each share page's “recent sales” should show only its own tenant's products and purchases.
9. Verify AI context as a buyer, then as tenant admin. Buyer context must contain only the current buyer's history; tenant activity must appear only for a valid admin session of that tenant.
10. Test live search with a request such as “Tìm hướng dẫn Shizuku chính thức” and check that links appear. Test normal chat, image analysis, report drafting, and account history.

## Privacy and limits
- AI is not given passwords, OTPs, API keys, session tokens, or full payment credentials.
- Tenant IDs/records are scoped on the server; a URL slug alone is not admin authorization.
- Search result pages are untrusted input and may contain prompt injection.
- The release does not retrain model weights or give the AI unrestricted browser control. Actions that modify/send data still require explicit confirmation and an implemented endpoint.
- Static checks do not prove the Production API/provider is working.
