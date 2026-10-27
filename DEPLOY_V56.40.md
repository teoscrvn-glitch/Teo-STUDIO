# Deploy V56.40

1. Back up the current Worker source and D1 database.
2. Review `cloudflare/wrangler.toml`; keep the existing D1 binding and all production secrets unchanged.
3. Run `sh scripts/check-build.sh`.
4. Deploy using the project's existing Cloudflare workflow; do not reset or recreate D1.
5. Verify with a real master-admin session that asking Téo Linh for today's platform figures returns platform totals.
6. Verify with a tenant-admin session that the same question returns only that tenant's totals. Also verify a buyer-only session does not reveal tenant-admin statistics.

The package does not deploy itself and has not been tested against production Cloudflare/D1.
