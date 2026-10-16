# TeoStudio V55

**Bản mã nguồn nâng cấp — chưa deploy production.** Package này được xây dựng từ file V54 được cung cấp trong cuộc trò chuyện, không phải bản export trực tiếp từ GitHub main hay bản sao lưu trực tiếp của production.

## Tài liệu
- `VERSION_V55.md` — phạm vi tính năng, cơ chế dữ liệu và giới hạn.
- `TEST_REPORT_V55.md` — kiểm tra đã chạy và kiểm thử còn cần thực hiện.
- `DEPLOY_V55_MOBILE.md` — hướng dẫn triển khai từ điện thoại và checklist bảo mật.
- `SECURITY_HARDENING_V52.md`, `SEPAY_SETUP_V45.md`, `OXMAIL_SETUP_V49.md` — tài liệu nền cũ, dùng khi cần đối chiếu.

## Những phần mới trong V55
1. Tài khoản người mua dùng chung với tài khoản studio; xác minh email, đăng nhập, đặt lại mật khẩu, hồ sơ và lịch sử mua.
2. Ví nội bộ: nạp theo VietQR/SePay, mua file bằng số dư, sổ cái người mua/người bán/nền tảng; seller nhận 95%, platform ghi 5% với đơn bán từ studio.
3. Thống kê admin theo tháng lấy từ D1: doanh thu, hoa hồng, doanh thu người bán, nạp ví, lượt xem, đơn hàng và bảng từng ngày.
4. Trình chỉnh sửa giao diện studio theo khối, preset, ẩn/hiện, sao chép, xóa, sắp xếp bằng nút lên/xuống, tùy chỉnh cơ bản và preview.
5. Bong bóng AI hỗ trợ người dùng, báo lỗi lưu vào D1, tuỳ chọn gửi Telegram; AI API chỉ bật khi cấu hình endpoint/key/model runtime.
6. Thêm các biện pháp chống bypass: không trả link gốc file trả phí qua endpoint công khai, kiểm tra quyền và giá ở Worker, Turnstile server-side và idempotency giao dịch.

## Triển khai an toàn
- Sao lưu D1 trước.
- Đối chiếu/merge với repository hiện tại; không ghi đè mù các chỉnh sửa mới hơn.
- Giữ nguyên D1 ID/binding `DB`, secrets và webhook SePay.
- Không reset database.
- Kiểm thử staging hoặc giao dịch nhỏ có đối soát trước khi mở rộng.

V55 chưa được triển khai hoặc kiểm thử end-to-end với tài khoản production. Không thể đảm bảo chống mọi hình thức tấn công chỉ bằng code Worker; cần cấu hình Cloudflare WAF/Rate Limiting cho lớp edge.
