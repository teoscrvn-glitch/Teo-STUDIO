# Deploy V56.43 — AI capability upgrade

1. Back up the currently deployed site and Worker.
2. Upload the frontend files from this package to the existing hosting origin, preserving the current project structure.
3. Deploy `cloudflare/worker.js` to the existing TeoStudio Worker.
4. Keep existing secrets and bindings. Do not paste API keys into source files.
5. In Worker settings, verify `AI_API_URL`, `AI_MODEL`, and the secret `AI_API_KEY` match the same provider. For OpenRouter, the endpoint should be `https://openrouter.ai/api/v1/chat/completions`; choose a model ID actually available to the account.
6. Test normal text, ambiguous questions, an image prompt, a request to draft a bug report, and a question that needs login. Confirm the assistant never claims an action succeeded without the UI/API success response.

This package does not contain production secrets and has not been tested against the live provider.
