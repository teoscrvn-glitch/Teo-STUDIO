# Test report — V56.63 Seller & Ads

## Đã chạy trong môi trường tạo ZIP
- `node --check cloudflare/worker.js`
- `node --check frontend/assets/js/admin-v14.js`
- `node --check frontend/assets/js/tenant-admin.js`
- `node --check frontend/assets/js/seller.js`
- `node --check frontend/assets/js/account.js`
- `bash scripts/check-build.sh`
- `python scripts/test-v56.61-monetization.py`
- `python scripts/test-wallet-ledger.py`
- `python scripts/test-tenant-sales-isolation.py`
- `node scripts/check-inline-js.mjs`
- `node scripts/check-local-refs.mjs`
- `python scripts/test-v56.63-seller-ads.py`

## Phạm vi mô phỏng
- Split 95/5, 90/5/5; ví dụ số tiền 80.000đ sau giảm giả định chia 72.000/4.000/4.000.
- Pending Seller 7 ngày; refund ghi bút toán đảo; không sửa lịch sử cũ.
- Withdrawal reserve, request key duy nhất, audit event và từ chối hoàn tiền đúng một lần.
- Ads report pending không ghi có; confirmed ghi 80/20; ledger unique ngăn ghi trùng.
- Ads đã xác nhận xuất hiện riêng trong thống kê Studio theo tháng và tổng thực nhận; không làm tăng số đơn bán file.
- Payout Seller là cờ cấp toàn hệ thống; rollout per-Studio chỉ áp dụng Seller program và Ads.
- `wrangler.toml` TOML được parse thành công; kiểm tra binding `DB` giữ nguyên ID hiện tại và các biến plaintext đã biết được giữ trong `[vars]`.

## Chưa kiểm chứng
- Không kết nối production Cloudflare D1, không gọi SePay thật, không chuyển tiền thật, không test Telegram thật.
- Không xác nhận được toàn bộ Cloudflare Dashboard Variables/Secrets vì không truy cập tài khoản. Không deploy trong phiên này.
- Chưa có API Ads provider; chỉ test luồng nhập/đối soát thủ công.
- Không có coupon/discount workflow hiện tại. Ví dụ sau giảm trong test là dữ liệu mô phỏng, không phải tính năng coupon đang có.
