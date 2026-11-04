# V57.4 Dual bypass + top-up

- Free bypass now uses cumulative steps: BumX (1/2), then Link4M (2/2) after at least 24 hours. Completing both grants 7 Free days.
- Fixes the second-step timestamp bug: the 24-hour anchor is recorded at first BumX key issuance and is not overwritten by Link4M issuance.
- Adds a one-time migration anchor for V57.3 tenants already at step 1.
- Active rental remains exempt from the bypass gate; expiry resets the cycle.
- Retains one-time random TeoStudio key, 5-minute expiry, hash-only D1 storage and session binding.
- Adds a Link4M incentivized-traffic policy gate; it must only be enabled after written permission.
- Adds `/topup.html` as a dedicated card-first wallet top-up page, while keeping bank transfer as an alternative.
- Requires guardian acknowledgement on bank/card top-ups when applicable; wallet credit still requires provider-side payment confirmation.
- Existing Free restrictions remain enforced in frontend and Worker (no builder, paid file sales, wallet withdrawal or paid order features).
