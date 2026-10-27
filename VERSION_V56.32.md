# TeoStudio V56.32 — Mobile stability, AI vision, and tenant sales isolation

## Mục tiêu
- Khắc phục nguy cơ frontend dùng CSS/JS cũ do query-string cache chưa được tăng theo bản Worker.
- Gỡ hero nhân vật lớn và bỏ các hiệu ứng động nặng khỏi widget Teo AI.
- Ổn định khung chat khi bàn phím Android mở; giảm animation và blur trên mobile để tránh nhấp nháy.
- Cho phép người dùng đính kèm ảnh vào cuộc trò chuyện AI và báo lỗi; ảnh được nén phía trình duyệt và kiểm tra định dạng/dung lượng phía Worker.
- Cô lập luồng recent-sales theo `scope='main'` cho trang chính và `scope='tenant'` + tenant ID chuẩn cho từng Share File.
- Hướng dẫn AI trả lời về TeoStudio toàn diện hơn, cho phép trò chuyện đời thường, nhưng mọi thay đổi dữ liệu phải qua xác nhận và kiểm tra quyền ở backend.

## Chi tiết
- Cache-bust các CSS/JS nội bộ trong mọi HTML bằng `?v=56.32`. Đây là sửa quan trọng vì V56.31 vẫn trỏ `style.css?v=56.24`, `assistant.js?v=56.29` và `account.js?v=56.29`.
- Thay cả dải CSS chồng chéo cũ bằng một quy tắc widget thống nhất; ẩn hoàn toàn hero/presence trong khung chat; bỏ animation vô hạn và blur nặng trên mobile.
- Thay avatar nút nổi bằng asset `teo-linh-v2.webp` nén WebP.
- `assistant.js`: thêm gửi ảnh, preview/nén ảnh, báo lỗi có ảnh, nút dùng AI soạn nháp từ hội thoại gần đây và yêu cầu xác nhận trước khi gửi. Ảnh không giữ trong lịch sử cục bộ; lịch sử sẽ hiện nhãn ảnh đã gửi khi mở lại.
- `worker.js`: hỗ trợ multimodal `image_url` cho endpoint OpenAI-compatible; kiểm tra data URL và giới hạn dung lượng; lưu ảnh báo lỗi trong cột `support_reports.image_data`; cung cấp endpoint ảnh riêng chỉ cho admin đã xác thực.
- `account.js`: chỉ gọi endpoint doanh số tenant khi URL `share.html` có `?tenant=slug`; không dùng endpoint đơn mua trang chính cho một URL tenant hợp lệ.
- `worker.js`: endpoint tenant sales tiếp tục bắt buộc `scope='tenant'` và lọc tenant ID chuẩn; endpoint chính chỉ trả `scope='main'`.

## Kiểm thử trong gói
- Chạy `node --check` cho Worker và các file JS đã sửa.
- Kiểm tra mọi trang HTML nội bộ trỏ asset bằng query `v=56.32`.
- Kiểm tra các điều kiện scope đơn mua bằng kiểm thử tĩnh.
- Chưa deploy production, chưa chạy browser/mobile test thật và chưa truy cập D1 production; cần xác minh các kết quả trên sau khi deploy.
