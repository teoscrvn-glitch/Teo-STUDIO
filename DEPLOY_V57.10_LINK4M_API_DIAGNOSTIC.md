# Deploy V57.10 — Link4M API diagnostic

## Purpose
This release lets the tenant owner test the actual URL-shortening endpoint from the Worker. It is intended to tell whether the configured API token and API URL can create a short link.

## Deploy
1. Back up the current Worker and frontend assets. Do not delete D1.
2. Deploy the complete `cloudflare/worker.js` and `frontend` directory.
3. Keep `BUMX_API_KEY`, `BUMX_API_URL`, `LINK4M_API_KEY`, and `LINK4M_API_URL` in Production as already configured.
4. Do not add `LINK4M_REWARDED_TRAFFIC_APPROVED=1` just to run the test.
5. Confirm `/api/health` reports `v57.10-link4m-api-diagnostic`.
6. Hard-refresh Tenant Admin. Use the Free gate test button or Settings → Test API tạo link rút gọn.

## How to interpret the result
- `API tạo link OK · HTTP 200 · status success · <domain>`: the short-link API accepted the test request. The full URL is intentionally not returned.
- `SHORTENER_HTTP_401` / `SHORTENER_HTTP_403`: check token validity, account access, or provider-side restrictions.
- `SHORTENER_HTTP_404`: check the configured endpoint.
- `SHORTENER_BAD_JSON`: provider returned a non-JSON body.
- `SHORTENER_REJECTED_*`: provider returned an unexpected status or no short URL.
- A successful short-link API probe is not a completed ad view, a reward callback, or proof that the provider allows incentivized traffic.

The probe creates one temporary short URL per provider, but it does not open either link, create a bypass attempt, issue a key, or award days. Results are rate-limited to two probe calls per minute per tenant.

## Reward activation limitation
The ordinary Link4M reward flow still checks `LINK4M_REWARDED_TRAFFIC_APPROVED=1`. Do not enable it until Link4M has expressly allowed incentivized traffic in writing. The API screen supplied for this project documents URL shortening and a JSON create-link response, not a signed callback or per-attempt completion check.

Link4M's current public rules prohibit incentivized traffic except with special permission and state that the publisher account holder must be at least 18. An eligible adult must manage the Link4M publisher account.

## Validation
Local build checks pass. The environment used to build this ZIP has no access to Cloudflare Production Secrets or the live provider accounts. The API probe runs after deploying the Worker and pressing the test button.
