# Triển khai TeoStudio V56.19 trên điện thoại

## Các thay đổi chính
- Trang chủ và trang share tenant có mục **Khách vừa mua file** nằm giữa kênh và danh sách file. Mục chỉ hiện khi có đơn mua đã xác nhận; email người mua được che một phần để không công khai dữ liệu cá nhân.
- Bấm vào file trong danh sách sẽ dùng URL `/detail?id=...`. Trang chi tiết có thumbnail, nút sao chép link và nút Chia sẻ; bot xem trước link nhận tiêu đề/mô tả/thumbnail theo đúng file.
- Teo AI hiển thị chẩn đoán đã làm sạch như HTTP 401/403/404/429 thay vì nuốt lỗi thành câu chung.

## Cách đưa lên GitHub / Cloudflare Worker Builds
1. Giải nén ZIP này. Các thư mục `cloudflare/`, `frontend/`, `scripts/` và các file Markdown nằm ngay ở thư mục gốc.
2. Tải đè/cập nhật nội dung repo đang dùng bằng đúng cấu trúc đó, rồi commit/push. Đừng đặt cả thư mục ZIP lồng thêm một tầng `tmp/v5617`.
3. Chờ Cloudflare Worker Builds triển khai xong. Bản mới tự khai báo hai biến **không bí mật** trong `cloudflare/wrangler.toml`: `AI_API_URL` và `AI_MODEL`.
4. Giữ `AI_API_KEY` trong **Worker → Settings → Variables and Secrets → Production → Secret**. Không đưa API key vào `wrangler.toml`, GitHub, hay gửi cho người khác. Không cần xóa/tạo lại key nếu nó đang có.
5. Sau deploy, mở `https://teostudio.top/api/health` và kiểm tra trường `version` là `v56.19-sales-feed-detail-share-ai-diagnostics`. Nếu điện thoại vẫn hiện giao diện cũ, tải lại trang hoặc đóng/mở tab để lấy cache version mới.
6. Thử nhắn `Hello` cho Teo AI. Nếu Gemini vẫn lỗi, tin nhắn sẽ nêu nguyên nhân đã phân loại (ví dụ HTTP 401/403, 404 hoặc 429); gửi ảnh nội dung lỗi đó, nhưng không gửi key.
7. Thử một link file đã tồn tại dạng `https://teostudio.top/detail?id=ID_FILE`. Chia sẻ link mới vào ứng dụng chat để kiểm tra thumbnail. Hệ thống chat có thể cache ảnh cũ; thử một lần với link mới hoặc dùng chức năng làm mới preview của nền tảng.

## Lưu ý kiểm tra
- Mục giao dịch là dữ liệu thật từ các đơn có trạng thái `paid`; nếu chưa có đơn hợp lệ, mục sẽ ẩn thay vì tạo dữ liệu giả.
- Email hiển thị công khai đã được che một phần. ZIP không thay đổi số dư/đơn hàng hoặc cơ chế thanh toán.
- Các kiểm tra cục bộ đã qua, nhưng không thể chứng nhận kết nối Gemini, D1 thật, thanh toán/SePay, email, Turnstile hoặc xem trước liên kết của nền tảng bên ngoài cho tới khi bạn deploy và kiểm tra trên môi trường thật.
