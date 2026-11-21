# Deploy TeoStudio V57.7 — Free Admin / TENANT_REQUIRED

## Phần đã sửa
- Worker xác định tenant Free theo phiên đã đăng nhập; nếu client cũ chưa gửi `x-tenant-slug`, Worker dùng thêm ID trong body (`id`, `tenant`, `slug`, `tenantId`) làm gợi ý SSO.
- Kiểm tra ID trong request phải khớp `id`, `tenant_id` hoặc `slug` của tenant được phiên xác thực đại diện. Không bỏ qua xác thực quyền sở hữu.
- Dùng chung logic phân giải tenant ở bước tạo link vượt và bước đổi key.
- Bump cache version từ `57.4` lên `57.7` cho frontend; Worker `/api/health` báo `v57.7-free-bypass-session-fix`.

## Deploy
1. Giữ nguyên các Secret/Variables và D1 binding hiện có; không xóa hoặc tạo lại database.
2. Đảm bảo deploy **cả Worker và thư mục `frontend`** trong cấu hình `cloudflare/wrangler.toml` (Assets binding `ASSETS` trỏ tới `../frontend`).
3. Từ thư mục `cloudflare`, chạy:
   `npx wrangler deploy`
4. Mở `/api/health` và kiểm tra trường `version` là `v57.7-free-bypass-session-fix`.
5. Mở lại `/tenant-admin.html?tenant=ID_STUDIO`. Trên trình duyệt điện thoại, tải lại trang; không xóa dữ liệu đăng nhập/localStorage nếu không cần thiết.

## Luồng kiểm tra sau deploy
1. Đăng nhập Admin bằng đúng tài khoản Studio Free.
2. Bấm bắt đầu vượt link. API phải tạo URL BumX cho lượt 1/2, không trả `TENANT_REQUIRED`.
3. Quay lại cùng trình duyệt, mở trang nhận key, tạo key một lần, nhập lại trong Admin trước khi hết 5 phút.
4. Sau lượt 1, hệ thống khóa lượt 2 cho đến đủ 24 giờ. Đến hạn, lượt 2 dùng Link4M; hoàn tất và đổi key sẽ cộng 7 ngày Free.

## Điều kiện nhà cung cấp
- BumX cần `BUMX_API_KEY` và `BUMX_API_URL` hợp lệ.
- Link4M cần `LINK4M_API_KEY`, `LINK4M_API_URL`; cờ `LINK4M_REWARDED_TRAFFIC_APPROVED=1` chỉ được bật khi Link4M đã chấp thuận bằng văn bản cho traffic khuyến khích.
- Luồng key ràng buộc với phiên quay lại và key dùng một lần. Nếu nhà cung cấp không gửi callback/xác nhận ký số, không thể khẳng định hệ thống đã chứng minh việc người dùng thực sự xem quảng cáo.

## Kiểm tra đã chạy trong môi trường build
- Toàn bộ `scripts/test-*.py` và `scripts/test-*.mjs` hiện có đều PASS.
- `node --check` cho Worker, `tenant-admin.js`, `free-key.js` và `config.js` đều PASS.
- Chưa kiểm thử trực tiếp trên D1 production hoặc tài khoản Cloudflare thật; cần xác nhận luồng thực tế sau khi deploy.
