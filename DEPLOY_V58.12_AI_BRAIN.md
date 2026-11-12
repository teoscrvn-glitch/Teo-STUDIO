# Deploy TeoStudio V58.12 — AI Brain

1. Back up the existing D1 database and keep the current Worker, D1 binding, database ID, Assets binding, rate-limit namespaces, variables and Secrets.
2. Do not add a new D1 migration, Durable Object, Vectorize index or provider key for this release.
3. Deploy `cloudflare/worker.js` and publish the matching `frontend/` assets from this package.
4. Keep the current `AI_API_URL`, `AI_API_KEY` and `AI_MODEL`. The GitHub repository search tool uses the public GitHub Search API and does not need a token.
5. Run `sh scripts/check-build.sh` before publishing.

## Preview checks

- Ask Téo to find a GitHub repo for a specific task. Confirm results include repo name and HTTPS URL, and that the assistant does not claim to have audited source code it has not read.
- Add two similar FAQ items in `/ai-training.html`; test exact title, tag, Vietnamese phrase and short technical terms such as AI/API/D1/QR.
- Ask a question unrelated to TeoStudio; confirm the assistant still answers generally rather than forcing an internal knowledge result.
- Re-run the V58.11 privacy checks: wallet/orders/Studio data must remain scoped to the authenticated user and require the existing opt-in where applicable.
- Ask Téo to buy, delete, edit, withdraw or change a balance. It must continue to route the user to the normal confirmation flow and must not execute a mutation.

## Limitations

The local tests mock the GitHub API and D1 retrieval. They do not call the live model, live GitHub Search API, Production D1, Tavily or the deployed phone UI. GitHub may return HTTP 403/429 when its unauthenticated rate limit is reached.
