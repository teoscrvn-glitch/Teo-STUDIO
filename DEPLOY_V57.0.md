# Hướng dẫn deploy TeoStudio V57.0

## 1. Sao lưu trước khi deploy
1. Tải bản ZIP cũ và giữ nguyên một bản backup.
2. Sao lưu D1 từ Cloudflare Dashboard/CLI và lưu riêng các Worker Secrets. ZIP không chứa `ADMIN_KEY`, API keys, token, SMTP credentials hoặc bí mật thanh toán.
3. Không ghi secret vào `wrangler.toml`, file HTML/JS hoặc commit Git.

## 2. Deploy D1 migration
Các bảng pháp lý cũng được Worker tự tạo bằng `CREATE TABLE IF NOT EXISTS` khi gọi API liên quan. Có thể chạy trước migration thủ công để kiểm soát: từ thư mục `cloudflare/` chạy:

```bash
npx wrangler d1 execute teo-studio --remote --file ../migrations/20261104_legal_rights.sql --config wrangler.toml
```

## 3. Deploy Worker + assets
Từ thư mục `cloudflare/`:

```bash
npx wrangler deploy --config wrangler.toml
```

`wrangler.toml` đã trỏ assets sang `../frontend`; không deploy frontend thành Worker khác. Trên Android/Termux ARM, Wrangler có thể vướng gói `workerd` không hỗ trợ nền tảng; dùng Windows/macOS/Linux hoặc CI có Node.js được hỗ trợ.

## 4. Kiểm tra sau deploy
- Mở `/terms.html`, `/privacy.html`, `/cookie-policy.html`, `/refund-policy.html` và `/privacy-request.html`.
- Vào `/account.html?auth=register`, thử gửi form khi chưa tick từng checkbox: giao diện phải chặn. Dùng API test trực tiếp với thiếu checkbox/sai version: Worker phải trả `LEGAL_ACCEPTANCE_REQUIRED`.
- Đăng ký test có tick đủ 2 checkbox; xác minh email; kiểm tra D1 có 2 dòng tương ứng trong `legal_acceptances`.
- Đăng nhập test, gửi yêu cầu ở `/privacy-request.html`; vào Admin → “Quyền dữ liệu” để xem/cập nhật trạng thái.
- Kiểm tra các trang thuê Studio, share, seller, upload, mua file, SePay, rút tiền và Telegram không bị regression.
- Xác minh HTTPS, CSP, CORS, Turnstile, rate-limit bindings và API secrets qua Cloudflare Dashboard.

## 5. Các giá trị cần chủ quản cung cấp trước public
- Tên pháp lý/chủ thể vận hành, địa chỉ, email tiếp nhận, MST/đăng ký nếu thuộc diện.
- Mô hình kinh doanh: SaaS/lưu trữ hay nền tảng TMĐT trung gian; quy trình và hồ sơ thông báo/đăng ký cần thiết.
- Retention schedule, căn cứ xử lý, hợp đồng xử lý dữ liệu, đánh giá chuyển dữ liệu xuyên biên giới và quy trình xử lý sự cố.
- Xác minh người bán điện tử nếu thuộc phạm vi pháp luật.
- Quy trình/địa chỉ khiếu nại bản quyền, khiếu nại người tiêu dùng và hoàn tiền.

**Không deploy public trong trạng thái để placeholder chủ quản trên trang chính sách.** Không bật Free rewarded bypass khi chưa có hợp đồng/chấp thuận và API verify thật từ BumX.
