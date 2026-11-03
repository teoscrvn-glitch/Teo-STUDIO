# TeoStudio V56.65 — Tenant Admin Polish

## Sửa lỗi Admin Free
- Đổi `fetch(..., redirect: "error")` của API rút gọn sang `redirect: "manual"` và chặn phản hồi 3xx ngoài dự kiến. Ảnh lỗi cho thấy Cloudflare báo `Invalid redirect value`; Worker Edge không chấp nhận nhánh redirect này trong cấu hình hiện tại.
- Sau khi ID/mật khẩu thuê hợp lệ, tài khoản Free mở đúng màn hình Free gate và có nút **Đi tới link vượt 1/2** hoặc **2/2**, kèm nút kiểm tra kết nối API.
- Bổ sung kiểm tra API thực tế bằng một lần gọi thử API rút gọn, có rate limit.
- Không cộng lượt chỉ vì trình duyệt quay lại mang `state`. Trước khi cộng ngày, Worker gọi `FREE_BYPASS_VERIFY_URL` từ máy chủ và chỉ chấp nhận JSON xác nhận `success: true`, `completed: true` cùng `state` trùng chính xác. Nếu thiếu API xác minh, không tự mở khóa.

## Admin thuê
- API danh sách tenant chỉ trả `email` cho Master Admin đã xác thực; không trả `password_hash` hoặc mật khẩu.
- Email mặc định che; nhấn giữ mới xem đầy đủ.
- Email và mật khẩu ban đầu của tài khoản vừa tạo mặc định che; nhấn giữ trong phiên tạo để xem. Nút Copy là thao tác chủ động.
- Mật khẩu cũ không thể khôi phục từ hash. Danh sách cung cấp **Đặt lại MK**.
- Mật khẩu thuê mới/đổi mới dùng PBKDF2-HMAC-SHA256, salt ngẫu nhiên 16 byte, 100.000 vòng; SHA-256/plaintext đời cũ được nâng cấp sang PBKDF2 sau lần đăng nhập hợp lệ.
- Đặt lại mật khẩu từ Master Admin sẽ thu hồi các phiên tenant hiện có.

## Thống kê thuê theo ngày
- Thêm `/api/admin/tenants/stats?month=YYYY-MM` cho Master Admin.
- Thống kê từng ngày GMT+7: tài khoản tạo, đơn thuê mới, đơn gia hạn, đơn trả thành công và doanh thu đã xác nhận.
- Tách đơn đang chờ; không tính đơn pending thành doanh thu.
- Tách số tài khoản Free, VIP, đang hoạt động và tổng tài khoản.
- Doanh thu chỉ tính từ `tenant_rental_orders` có `status='paid'` và `paid_at`; tài khoản tạo thủ công được đếm riêng, không tự giả định là giao dịch thu tiền.

## Mẫu Share chờ duyệt
- Thêm `UI_PREVIEW_FOR_APPROVAL/` với 4 concept: Sakura Glow, Tiger Neon, Cloud Minimal và Pixel Arcade.
- Banner, mascot và logo vector được tạo riêng cho concept; không dùng ảnh tải từ website khác.
- Thư mục nằm ngoài `frontend/`, không được nối vào trang Share hiện tại. Chỉ tích hợp mẫu được duyệt sau khi có lựa chọn cụ thể.

## Nền tảng quảng cáo
- Thêm tài liệu lựa chọn Google Ad Manager Rewarded Ads for web, SSV và Reporting API trong `ADS_PLATFORM_INTEGRATION_V56.65.md`.
- Chưa chèn quảng cáo thật hoặc đồng bộ doanh thu vì thiếu Network Code, Ad Unit Path và OAuth credentials.

## Giới hạn chưa xác nhận
- ZIP không chứa khóa API thật nên không thể kiểm thử live Link4M/BumX.
- API rút gọn link không đồng nghĩa API xác minh hoàn thành nhiệm vụ. Cần endpoint xác minh có tài liệu và xác nhận hoàn thành từ phía máy chủ. Link4M đã bị loại khỏi Free gate có thưởng vì điều khoản công khai không cho traffic incentivized; BumX chỉ được dùng sau khi xác nhận bằng văn bản cho luồng này. Không điền URL API shorten vào `FREE_BYPASS_VERIFY_URL`.
- Không triển khai Production và không chạy giao dịch D1/SePay thật trong môi trường này.
