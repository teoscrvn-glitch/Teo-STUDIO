# TeoStudio V56.10 — giữ cấu hình Cloudflare

## Mục tiêu
Bản này kế thừa mã nguồn V56.9, giữ phần chẩn đoán đăng nhập tenant, nút hiện thêm/ẩn bớt danh sách và chuẩn hóa dấu phiên bản/cache. Đây không phải xác nhận đã sửa triệt để mọi lỗi đăng nhập; phải thử trên Preview trước.

## Vì sao cấu hình Cloudflare được giữ?
- `ADMIN_KEY`, `OXMAIL_SMTP_PASS`, `SEPAY_API_KEY`, `TURNSTILE_SECRET` là **Secrets** được lưu trong Cloudflare Worker, không nằm trong ZIP và không cần nhập lại khi chỉ cập nhật code cùng Worker.
- Binding D1 `DB` tiếp tục trỏ tới database `teo-studio` theo `cloudflare/wrangler.toml` hiện có.
- Các biến thường được khai báo trong Dashboard có thể bị Wrangler báo lệch cấu hình. Trước khi deploy, đối chiếu `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TURNSTILE_SITE_KEY` với giá trị đang có trong Worker. Nếu deploy bằng Cloudflare Git integration, giữ nguyên các biến Production hiện có; không xóa Worker, không xóa database, không tạo Worker mới.

## Triển khai an toàn bằng điện thoại
1. Giữ ZIP/bản đang chạy tốt làm bản quay lui.
2. Tải ZIP này lên **nhánh/repo thử nghiệm**, không ghi đè Production ngay.
3. Trong Cloudflare, dùng Preview Worker và D1 thử nghiệm riêng; không chạy migration trên D1 Production để thử.
4. Chạy `sh scripts/check-build.sh`.
5. Kiểm tra đăng nhập tenant cũ, mật khẩu sai, tạo Studio, tải trang Admin tenant, hiện thêm/ẩn bớt file và bình luận.
6. Chỉ sau khi Preview ổn mới triển khai cùng code lên Worker Production hiện tại.

## Những việc tuyệt đối không làm khi cập nhật
- Không xóa/tạo lại Worker `teo-studio`.
- Không xóa binding D1 `DB` hoặc database `teo-studio`.
- Không bấm xóa các Secrets rồi tạo lại nếu chúng vẫn đang hiện `Value encrypted`.
- Không đưa mật khẩu SMTP, API key hoặc `ADMIN_KEY` vào GitHub, ZIP, HTML hay tin nhắn.
- Không thay đổi giá trị biến Production nếu chưa xác nhận với cấu hình đang chạy.

## Giới hạn kiểm thử
Kiểm tra cú pháp và dấu phiên bản không thay thế kiểm thử trực tiếp trên Cloudflare. Bản này chưa được triển khai/test trực tiếp trên Worker Production; không thể cam kết đăng nhập tenant hoặc SePay chạy đúng chỉ từ kiểm tra cục bộ.
