# TeoStudio V57.1 — Stable Release Candidate

Bản phát hành hợp nhất dựa trên mã nguồn V56.4, ưu tiên giữ lại luồng SePay/rental hiện có trong Worker, sửa cơ chế kiểm tra cấu hình và hoàn thiện luồng tài khoản/ví/Builder/AI/report.

## Trạng thái trung thực

- Đã chạy kiểm tra cú pháp JavaScript Worker và frontend, kiểm tra script nội tuyến HTML, kiểm tra các dấu mốc cấu hình và quét chuỗi giống secret trong source.
- Đã thêm API chẩn đoán `/api/health` trả phiên bản và trạng thái cấu hình/bảng thiếu theo tên biến, không trả giá trị bí mật.
- Chưa deploy từ môi trường này lên tài khoản Cloudflare của bạn; chưa xác minh live D1, email thật, AI thật, Telegram thật, Turnstile thật hay webhook SePay thật.
- Đây là bản release candidate để kiểm tra trên production/staging sau khi sao lưu, không phải cam kết không còn bug.

## Chức năng đang có trong code

- Tài khoản người mua: đăng ký, xác minh email, đăng nhập, reset mật khẩu, profile, lịch sử mua và số dư.
- Nạp ví qua QR VietQR; chỉ webhook SePay hợp lệ mới ghi ledger top-up.
- Mua file qua số dư nội bộ, xác nhận điều khoản hai bước, Turnstile, idempotency và 5% phí nền tảng với file tenant.
- Tài khoản có thể tạo/thuê studio; link Admin và trang Share; giữ hỗ trợ các tài khoản tenant cũ.
- Share Studio Builder dạng block, lưu layout qua API và xem trước.
- Báo cáo thống kê, báo lỗi, thông báo và kiểm duyệt bình luận/ảnh.
- Chặn IP/email bền vững trong D1, giới hạn request và bảo vệ truy cập file trả phí.
- Bong bóng Teo AI có fallback an toàn; kết nối model thật chỉ hoạt động khi cấu hình AI tương thích Chat Completions.
- Kiểm tra trạng thái cấu hình AI, SMTP, Telegram, Turnstile, SePay và D1 trong Admin.
- Dòng giao dịch gần đây chỉ hiện cho người mua đã tự bật chia sẻ; email được che. Mặc định người mua không tham gia feed công khai. Cả API feed mới và endpoint lịch sử tương thích cũ đều bắt buộc opt-in.

## Cấu trúc

- `cloudflare/worker.js`: API, xác thực, thanh toán và middleware.
- `cloudflare/wrangler.toml`: Worker, static assets và binding D1 đang có.
- `cloudflare/schema*.sql`: schema nền tảng/lịch sử; Worker có thêm bảng/column idempotent qua `ensure...Schema`.
- `frontend/`: các trang HTML, CSS và JS. Trang `earn.html` giữ đích liên kết “Điểm” cũ hoạt động và giải thích rõ chương trình điểm thưởng riêng chưa bật.
- `scripts/check-build.sh`: kiểm tra tĩnh trước khi push.
- `scripts/check-live.sh`: đọc `/api/health` sau deploy.
- `VERSION_V57_1.md` và `TEST_REPORT_V57_1.md`: ghi chú release và checklist acceptance.
- `DEPLOY_V57_1_MOBILE.md`: triển khai trên Android/Termux.
- `CONFIGURATION_V57_1.md`: danh sách biến Runtime và cách test dịch vụ.

## Nguyên tắc nâng cấp D1

Không tạo database mới để thay thế D1 cũ và không chạy lệnh DROP/RESET. Sao lưu D1 trước, giữ nguyên `database_id`, binding `DB` và tất cả secrets hiện tại. Bảng/cột mới được tạo bằng `CREATE TABLE IF NOT EXISTS`/`addColumnSafe` khi endpoint tương ứng được gọi.
