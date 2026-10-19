# Quick deploy notes
Use `DEPLOY_V56.16_ACCOUNT_WALLET_TENANT.md` for full instructions. Short version:
- Extract the ZIP contents into the matching repository paths, not as an extra nested folder.
- Commit the code and check that Cloudflare builds the new commit.
- Keep D1 `DB` and all existing Cloudflare Secrets.
- Confirm `/api/health` reports `v56.16-account-wallet-tenant-suite` before testing.
- Test insufficient balance first: 10,000đ wallet + 15,000đ item should show a 5,000đ top-up shortfall and must not deduct anything.
