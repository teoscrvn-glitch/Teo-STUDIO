# TeoStudio V58.9 — Seller Attribution & Task Flow Hardening

## Implemented in this source package
- Added an additive D1 table `buyer_seller_referrals` keyed by buyer + scope + Studio. Existing ledgers, purchases, referral codes and wallet rows are untouched.
- Seller links bind to an authenticated buyer account when the visitor is signed in. The first valid Seller referral is retained for that buyer in that Studio; subsequent purchases of other Seller-enabled files in the same Studio can still credit the same Seller.
- Purchase processing checks the stored account referral first, validates that the Seller remains active and that the purchased product itself is visible and Seller-enabled, and blocks self-referral.
- Seller catalog responses now include a safe thumbnail route and a short description; Seller cards display image, title, description, price and commission. Existing create-link logic continues to return the same persistent link for the same Seller/product.
- Telegram purchase notifications now include buyer display name/login, file title, wallet balance before purchase and after purchase.
- Confirmed card top-ups now send Telegram notices with account identity, telco, face value, credited value and balance before/after. The notice is tied to the unique credit-ledger insertion so provider callback retries do not double-notify.
- Tenant Note tasks now have an editable per-step action-button label. Platform is inferred from common YouTube/TikTok/Telegram/Zalo/Discord/Instagram/Facebook/X URLs for icon selection.
- Tenant Note task confirmation now requires a minimum 10-second server wait and, in the browser UI, at least 10 seconds with the task tab out of focus before confirmation becomes available. A blocked popup is reported instead of silently starting a timer.
- Final Note completion shows a 5-second hand-off countdown and uses the tab opened from the final confirmation click to navigate to the unlocked destination.
- Added a responsive pre-download landing page with the file image, title, description, warning, a 10-second preparation animation, bypass and purchase choices. Main product detail CTAs and tenant product detail CTAs now lead through this landing page.
- Added Seller Center to the Share page's hamburger drawer.

## Important limitations
- The server-side 10-second gate proves only that the one-time redirect was issued and enough time elapsed. The browser's tab-away guard is a UX barrier and can be evaded by a modified client; neither proves a follow, like, group join, download or other third-party action.
- This release does not add an advertising SDK or trusted ad-completion callback. Do not credit advertising revenue from a button click or elapsed timer.
- Existing tenant Product Key Vault / fixed and random pool behavior is retained from earlier versions; external key-provider purchase API integration is not included. Full Studio-scoped Membership, the three public leaderboards, new ad-provider integration, full admin IA redesign and end-to-end production payment testing are not included in this patch. They need complete API + permission + ledger work, not front-end-only switches.
- The migration is automatic/idempotent through `ensureV55Schema`; nevertheless deploy Worker and verify D1 schema in a staging environment before production.

- Admin analytics: bổ sung số lượt thẻ cào thành công, tổng mệnh giá, số tiền provider xác nhận, tiền thực cộng ví và danh sách tối đa 50 giao dịch theo tháng đã chọn. Không hiển thị PIN/serial thẻ.
- Seller Center: bổ sung menu hamburger điều hướng Tổng quan, File giới thiệu, Rút hoa hồng và Lịch sử hoa hồng; menu đóng bằng nút đóng, backdrop hoặc phím Escape.
