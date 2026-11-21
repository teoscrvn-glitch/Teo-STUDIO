# Security Review — TeoStudio V56.64

## Threat controls in this build

| Threat | Control in code | Boundary |
|---|---|---|
| Forged Seller link | Exact 24-hex referral code lookup against D1; codes are generated from 12 random bytes | A link can still be shared intentionally; that is the program's design |
| Forged / cross-product attribution | 48-hex server-issued token lookup is bound to scope + product + expiry | The browser still stores attribution token in localStorage as the existing flow requires |
| Self-referral | Buyer ID must differ from seller ID at purchase | Does not detect related people using separate accounts |
| Locked seller | Seller account is rechecked at attribution capture and purchase time | Account must be manually locked by account/security operations when needed |
| Seller toggle bypass | Purchase path rechecks server-side `seller_enabled`, visibility, feature flag and product scope | Public UI visibility is not used as authorization |
| Duplicate payout submission | Request key, unique request index, atomic balance reservation and audit event | Live concurrent-load testing on D1 is still required |
| Payout profile takeover / typo | Verified email required; server validates payout method and account fields; request stores payout snapshot | Admin must still verify recipient details before marking paid |
| Abuse without harming shared networks | Seller mutations are rate-limited by authenticated account ID, not a shared IP bucket | Existing broad API burst limits / Cloudflare WAF still apply separately |
| IP false positives | No automatic IP ban was added; persistent blocks remain manual Admin actions | Edge WAF settings are controlled separately in Cloudflare Dashboard |
| Stale referral records | Scheduled cleanup deletes expired attribution tokens only | Requires the existing hourly Cron trigger to remain enabled |

## Important limitations — do not treat these as solved

1. **A paid file's external download URL can still be copied after a legitimate buyer receives it.** The public product API hides paid source links, but purchase history returns the configured external URL to the buyer. Preventing redistribution requires moving protected files into private R2 (or another private object store) and issuing short-lived, account-bound download URLs through an authenticated Worker endpoint. Anti-copy JavaScript or hiding the URL in HTML cannot reliably prevent copying.
2. **Live ad-provider integration is not present.** V56.63's Ads path supports provider records, manual revenue-report imports, Admin confirmation and 80/20 ledger settlement. It does not yet inject an ad network's SDK, validate provider impression/click postbacks or fetch live earnings. No provider-specific code or credentials were supplied in this task; a fake impression counter would be misleading and easy to bypass.
3. **A configurable multi-link “Trang Note” page builder is not present in the V56.63 source bundle and is not created by this V56.64 hardening patch.** A trustworthy ad unlock flow must be tied to a specific provider callback / signed postback, not just a client-side timer or JavaScript click counter.
4. Seller attribution token is held in browser localStorage to preserve the existing cross-page purchase flow. This is not a payment secret, but a same-origin XSS could alter attribution. The site still needs a full CSP nonce migration and systematic audit of every dynamic HTML insertion to reduce XSS exposure.

## Production rollout checklist

- Back up D1 and retain the previous Worker version.
- Confirm all existing Worker Secrets and plaintext Variables remain present before deployment.
- Deploy V56.64 to a staging Worker with a staging D1 copy first.
- Test a main file and a tenant file separately: disabled Seller, enabled Seller, self-referral, locked seller, buyer refund and cross-scope product ID collision.
- Run two concurrent withdrawal requests against a staging D1 copy; verify only one reservation is accepted for the available balance.
- Confirm the hourly Cron trigger remains enabled and verify expired `seller_attributions` rows are removed.
- Review Cloudflare WAF / rate limiting separately. Do not apply an aggressive global IP rule to all visitors.

5. The new account-scoped action limits use the Worker isolate's in-memory limiter, consistent with the existing local limiter. They protect against accidental bursts and simple repeated actions, but they are not a globally coordinated DDoS control across all Worker isolates. Configure Cloudflare WAF / Rate Limiting for edge-wide protection; keep the thresholds scoped to mutation routes so ordinary browsing is not throttled.
