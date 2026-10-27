# TeoStudio V56.24 — Téo Linh Motion Preview

## Phạm vi
- Bản thử nghiệm dựa trên `TeoStudio-V56.23-AI-Telegram-Fix.zip`.
- Thêm hình đại diện Téo Linh cho nút trợ lý và phần đầu bảng chat.
- Thêm khu vực nhân vật có quỹ đạo hologram và chuyển động nhẹ.
- Đổi màu trợ lý sang graphite / bạc / cyan lạnh, thay gradient tím-xanh cũ trong widget.
- Giữ logic chat API và các hành động an toàn hiện có; không thay Worker, schema D1, cấu hình thanh toán hay luồng giao dịch.
- Có `prefers-reduced-motion` cho người dùng muốn giảm chuyển động.

## Cách thử
1. Giải nén vào môi trường staging/preview riêng, không ghi đè production.
2. Mở trang chủ, share, rent, admin và tenant-admin.
3. Bấm nút nhân vật ở góc dưới để mở panel, thử gửi câu hỏi và mở báo cáo lỗi.
4. Xác nhận đường dẫn ảnh `assets/img/teo-linh.webp` tải được trên hosting.

## Giới hạn đã biết
- Téo Linh hiện là giao diện nhân vật + trợ lý dựa trên logic/API sẵn có, không phải mô hình AI mới được huấn luyện.
- Ảnh nhân vật là concept 2D/CG tĩnh; chuyển động được tạo bằng CSS, chưa có rig/3D animation.
- Chưa xác minh bằng trình duyệt thực hoặc thiết bị Android; chỉ kiểm tra cú pháp JavaScript và cấu trúc gói.
