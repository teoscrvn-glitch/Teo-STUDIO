# Security Review — V56.65

## Đã sửa
- Cloudflare Worker shortener fetch không còn dùng `redirect: "error"`; chuyển sang `manual` và từ chối phản hồi 3xx.
- Hoàn tất Free bypass yêu cầu xác minh máy chủ qua HTTPS endpoint, kiểm tra state chính xác, `success/completed` và attempt một lần có hạn sử dụng.
- Raw state/attempt ID không còn được trả trong JSON khởi tạo; callback state chỉ còn trong return URL để nhà cung cấp đưa người dùng quay lại.
- Chẩn đoán bypass được rate limit và gọi thử API rút gọn; không tạo đơn thanh toán hoặc cộng ngày.
- Email tenant chỉ trả qua route danh sách Master Admin đã xác thực. Không trả password hash.
- Email và mật khẩu ban đầu che mặc định đến khi nhấn giữ; mật khẩu cũ không thể khôi phục từ hash.
- Mật khẩu thuê mới/reset dùng PBKDF2-HMAC-SHA256, salt 128-bit ngẫu nhiên, 100.000 vòng. Legacy SHA-256/plaintext được nâng cấp sau đăng nhập thành công.
- Reset mật khẩu từ Master Admin thu hồi tenant sessions.
- Thống kê thuê theo tháng dùng parameterized SQL và chỉ tính đơn `paid` có `paid_at` là doanh thu xác nhận.

## Giới hạn / điều kiện trước Production
- Shortener APIs là phụ thuộc bên ngoài. ZIP không chứa credentials nên không thể chứng minh cuộc gọi nhà cung cấp chạy thật trong môi trường này. Link4M bị loại khỏi Free gate có thưởng do điều khoản của họ nêu cấm traffic incentivized; BumX yêu cầu xác nhận chính sách trước khi bật.
- Shortener không phải completion verifier. Cho đến khi có endpoint xác minh nhà cung cấp thật và xác nhận chính sách traffic có thưởng, Free unlock cố ý bị khóa. Không dùng URL shorten làm verifier. Google Ad Manager Rewarded Ads for web là lựa chọn cần đánh giá cho luồng opt-in có SSV và API báo cáo, nhưng chưa được cấu hình trong build này; xem `ADS_PLATFORM_INTEGRATION_V56.65.md`.
- Ẩn email là biện pháp giảm nhìn trộm trên màn hình, không phải mã hóa. Master Admin được phép vẫn có thể thấy email trong authenticated API/browser tools.
- Mật khẩu ban đầu chỉ nằm trong bộ nhớ trang để Admin chủ động nhấn giữ/copy; không để trang tạo tài khoản mở trên thiết bị dùng chung.
- Không có production deploy, live D1 query, live SePay transaction, live Free-bypass hoặc adversarial Cloudflare Production test trong môi trường này.
- Concept Share nằm trong `UI_PREVIEW_FOR_APPROVAL/`, không link vào navigation và không nằm trong asset tree Production `frontend/`.
