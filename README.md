# TeoStudio V54

This source update is based on the supplied `TeoStudio-V52-Security-Rental.zip`. See `VERSION_V54.md` for changes, setup requirements, and limitations; see `TEST_REPORT_V54.md` for local checks.

Important: this archive is not a live production backup and has not been deployed. Preserve the existing Cloudflare D1 binding/database ID and secrets, compare against the current GitHub branch, and back up D1 before rollout.

# Téo Studio — Security & Rental Checkout V52

Gói nguồn V52: bổ sung nền tảng thanh toán SePay/VietQR, theo dõi doanh thu tenant và hardening bảo mật.

**Đây là gói nguồn để đối chiếu/triển khai có kiểm soát, không phải xác nhận đã deploy production.**

## Sửa chính
- Tương thích tenant_accounts cũ dùng `id`, `tenant_id` hoặc `slug`.
- Lookup tenant master/admin/share không còn phụ thuộc duy nhất vào một cột khóa.
- Chuẩn hóa tenant trước khi Share File đọc settings/files/tags/comments.
- Sửa thao tác gia hạn/đổi mật khẩu/khóa/xóa tenant để dùng đúng canonical tenant id.
- Re-auth Admin: sai mật khẩu xác minh không làm mất session ngay.
- Health API đổi version thành `rental-v27-safe` để kiểm tra đúng bản Worker đang chạy.
- Ảnh nền avatar hiển thị thành một dải nhỏ phía sau avatar; avatar nằm đè khoảng giữa ảnh nền và bên ngoài.
- Giữ nguyên D1 hiện tại, không reset database.
- Giữ khu vực dịch vụ TikTok / YouTube / Zalo ở cuối Share File.

## Deploy
Upload/deploy `cloudflare/worker.js` và frontend đi kèm. Sau deploy kiểm tra `/api/health`; kết quả phải có `version: rental-v27-safe`.


## V52 Security / Rental checkout update
See `VERSION_V52.md` for scope and limitations, and `SECURITY_HARDENING_V52.md` for required Cloudflare edge configuration. This source keeps the current D1 and performs additive migrations only. Do not reset production database or expose secrets.


## V52 security and rental checkout

See `VERSION_V52.md`, `SECURITY_HARDENING_V52.md`, and `DEPLOY_V52_MOBILE.md` for current features, known gaps, and safe production rollout. This archive is based on the V51 package available in the conversation, not a verified export of the current GitHub main branch. Compare/merge matching paths; keep the existing D1 database ID and secrets. Do not reset production D1.


See `V54_FIXES_AND_RUNTIME_SETUP.md` for runtime SePay/Turnstile setup, why stale frontend files hide sale-mode and wallet forms, and production-safe verification steps.
