# Deploy TeoStudio V58.0

## Phạm vi
Bản này gồm frontend mới, Worker mới và một bảng D1 bổ sung `tenant_notes`.

## Trước khi deploy
1. Sao lưu D1 database `teo-studio`.
2. Giữ nguyên tất cả Cloudflare Secrets và Variables đang cấu hình. Không xóa hoặc tạo lại Secret.
3. Không thay `database_id`, `database_name`, ratelimits hoặc cấu hình domain trong `cloudflare/wrangler.toml`.

## Triển khai
1. Mở thư mục `cloudflare/` của gói mã nguồn. Cấu hình Wrangler hiện dùng `[assets] directory = "../frontend"`, vì vậy lệnh deploy sẽ đóng gói cả Worker và frontend assets.
2. Triển khai Worker theo quy trình Production hiện tại, ví dụ chạy `npx wrangler deploy --config wrangler.toml` từ thư mục `cloudflare/`. Nếu website của bạn đang phục vụ frontend từ một static hosting tách riêng thay vì Worker Assets, hãy upload toàn bộ `frontend/` vào đúng nơi đang phục vụ các trang HTML.
3. Khi Worker chạy phiên bản mới, `ensureTenantSchema` sẽ tự tạo bổ sung bảng `tenant_notes` và index nếu chưa có. Không cần xóa bảng cũ hoặc reset D1.
4. Mở mới hoặc hard-refresh `/account.html`, `/tenant-admin.html`, `/admin.html` và trang Share của một Studio thử nghiệm.

## Kiểm tra sau deploy
- `/account.html`: form đăng nhập nằm sau phần giới thiệu và trước footer; kiểm tra cả màn hình Android thấp.
- Đăng nhập tài khoản Free có 1 Studio: API từ chối tạo Studio thứ hai.
- Tài khoản không có Studio VIP đang hoạt động không được giới hạn 3 chỉ vì có đơn VIP chờ thanh toán.
- Tài khoản có Studio VIP đã thanh toán, mở khóa và còn hạn: được tạo tối đa 3 Studio tổng cộng.
- Tenant Admin: tạo Note, sửa, ẩn/hiện, xóa; kiểm tra Note không xuất hiện ở Studio khác.
- Master Admin: tạo Note cho đúng slug, tải lại danh sách, sửa và xóa.
- Share: Note đang bật hiển thị; Note đã ẩn không xuất hiện; liên kết bước mở đúng URL.
- Xác nhận sổ ví, đơn mua, Seller/referral và nạp thẻ vẫn hoạt động như trước.

## Lưu ý
- Gói ZIP này chưa được deploy lên `teostudio.top`; cần thực hiện các bước trên trong Cloudflare/static hosting của chủ website.
- Tag Note hiện chỉ là nhãn chữ, chưa liên kết với tag file. Chuỗi bước chưa khóa/mở quyền tải file. Tiến trình Note lưu ở trình duyệt người xem và là tự xác nhận, không xác thực hành động tại Zalo/TikTok.
- Link quảng cáo tùy chọn không phải tích hợp mạng quảng cáo. Chỉ đối soát và cộng doanh thu khi có báo cáo hợp lệ từ nền tảng và Admin xác nhận.
- Nhiệm vụ B tăng quota mua file chưa triển khai vì V57.13 chưa có bảng/quy tắc quota tương ứng.
