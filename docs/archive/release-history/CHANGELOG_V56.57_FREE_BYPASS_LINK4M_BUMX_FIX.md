# V56.57 — Free bypass Link4M/BumX integration

- Replaced the incompatible `FREE_BYPASS_TEMPLATE_*` / `FREE_BYPASS_VERIFY_*` requirement with existing `LINK4M_API_KEY` and `BUMX_API_KEY` plus their configured endpoint variables.
- Step 1 prefers Link4M; step 2 prefers BumX; if only one provider key exists, it can be reused as fallback.
- Creates a short link whose destination is the tenant Admin return URL containing a high-entropy, 20-minute, one-time state.
- Returning with a valid unused state advances the 2-step flow and grants 2 days per completed step.
- Important limitation: the supplied Link4M/BumX screenshots show URL-shortening APIs, not a server-side completion callback/verification API. This version records a valid one-time return; it does NOT prove provider-side task completion. Do not describe it as provider-verified.
- API test endpoint now checks the existing API key and HTTPS endpoint configuration.
- Not deployed to production. Test API response and the full two-step flow with a test Free tenant before rollout.
