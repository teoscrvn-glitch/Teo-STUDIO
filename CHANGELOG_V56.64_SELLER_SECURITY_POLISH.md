# TeoStudio V56.64 — Seller Security & UI Polish

## Đã cập nhật

### Seller / hoa hồng
- Bổ sung lời mời Seller ngay trong trang chi tiết file của Website chính và từng Studio thuê, chỉ hiển thị khi file đang bật Seller và thuộc chế độ bán trả phí.
- Seller Center được thiết kế lại theo hướng mobile-first: tổng quan pending/khả dụng/hoa hồng ròng/đơn giới thiệu, danh sách file đủ điều kiện, tạo link, sao chép/chia sẻ, hồ sơ nhận tiền, rút tiền và nhật ký.
- Thay prompt/alert bằng thông báo tại trang; xử lý timeout mạng, phản hồi lỗi API, trạng thái đang gửi và retry cùng request key.
- Trang Seller tự lọc file được chọn từ trang chi tiết để giảm thao tác tìm lại.

### Bảo mật và độ tin cậy
- Phân biệt đúng mã referral 24 ký tự hex (12 byte ngẫu nhiên) và attribution token 48 ký tự hex (24 byte ngẫu nhiên). Đây là hai định dạng khác nhau; xác thực sai độ dài sẽ bị từ chối.
- Referral chỉ được ghi nhận nếu mã tồn tại, chương trình Seller còn bật, file vẫn hiển thị/được bật Seller và tài khoản Seller chưa bị khóa.
- Khi mua, Worker kiểm tra lại attribution, phạm vi main/tenant, đúng product ID, quyền Seller của file và trạng thái tài khoản Seller; không tin cờ trạng thái từ trình duyệt.
- Giới hạn thao tác tạo link / cập nhật hồ sơ / yêu cầu rút theo **ID tài khoản** thay vì IP dùng chung, tránh người cùng Wi‑Fi làm ảnh hưởng lẫn nhau. Bộ giới hạn local không thay thế Cloudflare WAF / Rate Limiting toàn edge.
- Lưu hồ sơ nhận tiền yêu cầu email đã xác minh, định dạng tài khoản hợp lệ; rút tiền cũng yêu cầu email xác minh và request key idempotent.
- Cron dọn attribution token hết hạn; không xóa ledger, đơn mua, yêu cầu rút hay nội dung người dùng.
- Không bổ sung auto-ban IP. IP/email chỉ bị chặn khi Admin chủ động thêm vào danh sách chặn hiện có.

### Hình ảnh / giao diện
- Thêm bộ hình minh họa TeoStudio riêng: mascot Seller, nền sakura đêm và các SVG biểu tượng bảo mật, Seller, link, ví, quảng cáo, cloud.
- Thêm dải giới thiệu Seller / Studio riêng trên trang chủ.
- Phiên bản asset và Worker được nâng lên `v56.64-seller-security-polish` để làm mới cache.

## Kiểm tra đã chạy
- `node --check` cho Worker và toàn bộ JavaScript frontend.
- `scripts/test-v56.63-seller-ads.py` (ledger, idempotency, payout reserve, refund reversal, split tiền và 80/20 Ads).
- `scripts/test-v56.64-security-polish.py` (định dạng referral/token, seller locked, rate limit theo tài khoản, CTA main/tenant, asset và không auto-ban IP).
- `scripts/check-build.sh` (các kiểm tra cú pháp, test AI guardrail và unified tenant session).

Các kiểm tra này là kiểm tra local/static và mô phỏng SQLite; **không phải** kiểm thử D1 production, giao dịch thật, crawler mạng xã hội hay thiết bị Android thực tế.
