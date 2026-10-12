# TeoStudio V47 — tenant wallet and manual payouts

## What changed
- Additive D1 tables: `tenant_wallet_ledger`, `tenant_payout_profiles`, `tenant_withdrawals`.
- A paid tenant file-sale order credits the tenant ledger once, using unique `(ref_type, ref_id, kind)` and SePay transaction de-duplication.
- Tenant Admin has a `Ví & rút tiền` tab, payout profile form (bank or e-wallet), balance and ledger, withdrawal form, history.
- Minimum withdrawal: 100,000 VND. Normal queue has 0% priority fee; priority requests charge 10% and are marked as a 24-hour target, not guaranteed bank settlement.
- Creating a withdrawal atomically checks available balance, creates the request and reserves the gross amount using a D1 batch.
- Main Admin has `Duyệt rút tiền`, payout details copy, approve, mark-paid, and reject/refund actions.
- Rejected requests get an idempotent refund ledger entry. Mark-paid is an admin declaration and must only be used after the real transfer is completed.
- Existing D1 data is not reset. Tenant account/file data is not deleted by this feature.

## Important scope
- The ledger credits paid file sales for tenant-owned files. It does not yet credit rent renewals or sales on the main site to tenant balances.
- All incoming money still goes to the owner's single SePay-linked bank account. Payouts to tenants are manual transfers initiated by the owner.
- SePay secrets remain Worker secrets. Do not put API keys in HTML or expose them to tenants.
- Before production, test the webhook in SePay sandbox, then use a low-value live transaction. Verify exact payload/auth settings and D1 binding in the deployed Worker.
