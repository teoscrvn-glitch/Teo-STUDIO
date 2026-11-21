# TeoStudio V56.18 — Tenant Share polish & Vietnamese email notices

Based on V56.16. This release keeps the existing D1 binding and runtime secrets separate from code.

- Keeps tenant admin's existing overview, view/referrer/sales statistics, content/file hide-show, comments, tags, manual IP/email blocks, notifications, settings, VIP wallet and withdrawal request flows. It does not add platform-wide top-up statistics or the main-admin withdrawal approval queue to tenant admin.
- Hides the buyer account/wallet floating launcher inside tenant admin; the launcher remains available on public main/tenant Share and detail pages, where a buyer can use the same platform wallet to purchase eligible files.
- New-device email notice uses Vietnamese local time (Asia/Ho_Chi_Minh, UTC+7), a human-readable device/browser label, account identity, IP, and a clear security action.
- Bumps frontend cache fingerprints to avoid old cached assets.

Not claimed as live-tested: Cloudflare Production, SMTP delivery, SePay webhook, real wallet deductions, tenant seller payout credit, or live email templates. Free-plan bypass remains unavailable until a real provider callback/API is configured and verified server-side.
