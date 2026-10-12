# TeoStudio V48 — Email/DNS, payments and feature notes

## Email DNS: fix the 5 records shown as not pointed
The screenshot shows five DNS records for the OxMail email service are not resolving correctly. Do not guess MX/TXT/CNAME values. In the INET domain panel, open the OxMail package / DNS setup details and copy the exact records supplied for this domain. At the DNS provider for `teostudio.top`, create or correct each record exactly as provided: record type, host/name, value/target, priority, and TTL. Remove only conflicting duplicates after confirming the provider's instructions. Then wait for DNS propagation and use the provider's check button again. Keep website records for Cloudflare/Worker unchanged unless the mail provider explicitly says otherwise.

The screenshots do not expose all five record values, so this archive cannot safely fill them in automatically. DNS records are provider-specific.

## Payment / SePay
The current tenant product purchase flow uses SePay/VietQR and requires Worker secrets/configuration already documented in `SEPAY_SETUP_V46.md`. Keep the current SePay configuration; do not paste API keys into frontend files. Test with Sandbox first. The webhook must match exact amount and idempotently credit the wallet before production use.

## V48 UI/schema changes
- Additive D1 migration adds `product_mode`, `original_link`, and withdrawal terms acceptance timestamp. Existing data is preserved.
- Tenant file form now exposes Free, Free via unlock link, Paid, and Free or Paid modes. The existing SePay purchase flow supports paid products; a real link-unlock provider/API still needs to be configured before the unlock mode is advertised publicly.
- Withdrawal form requires terms acceptance; server checks `termsAccepted`.
- Admin withdrawal list has Priority / Normal / All filters.

## Email OTP and notifications are not activated by DNS alone
MX records allow receiving mail; SPF/DKIM/DMARC authenticate sending/receiving policy. Automated OTP and transaction emails additionally require a configured sending provider/API and Worker secret(s), a verified sender domain, and server-side OTP storage/expiry/rate limits. Do not tell users OTP is working until those pieces are connected and tested. This build does not invent a provider API key or sender address.

## Deployment safety
Deploy to a staging Worker + staging D1 first. The schema migration is additive; do not run destructive SQL or reset the production database. Confirm purchase, exact-amount webhook, replay, failed-credit recovery, withdrawal consent, priority fee, normal fee, and admin state transitions before production rollout.
