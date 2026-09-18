# Lại Húp File — bản rút gọn từ Téo Studio v10

Bản này giữ lại giao diện/vibe chính nhưng bỏ toàn bộ hệ thống kiếm tiền, điểm, rút tiền, tài khoản, giới thiệu, duyệt nguồn và nhiệm vụ.

## Còn lại
- Trang chia sẻ file
- Tag / game và lọc file
- Tìm kiếm
- Chi tiết + link tải
- Popup thông báo
- Khu thông báo cập nhật (file / tag / video)
- Video MP4 trang trí trên đầu trang: đã cài sẵn link Téo cung cấp
- Admin: thêm/sửa/xóa file
- Admin: thêm/sửa/xóa tag
- Admin: sửa thông báo
- Admin: sửa vài thông tin giao diện
- Dữ liệu dùng chung qua Cloudflare Worker + D1

## Deploy
1. Tạo D1 và thay `YOUR_D1_DATABASE_ID` trong `cloudflare/wrangler.toml`.
2. Chạy: `npx wrangler d1 execute teo-studio-mini --remote --file=cloudflare/schema.sql`
3. Tạo secret: `npx wrangler secret put ADMIN_KEY`
4. Deploy Worker: `cd cloudflare && npx wrangler deploy`
5. Nếu Worker URL khác URL hiện tại, sửa `frontend/assets/js/config.js`.
6. Upload thư mục `frontend` lên GitHub Pages/hosting tĩnh.

Admin key chỉ được nhập trong trình duyệt admin và gửi qua HTTPS tới Worker. Không đặt ADMIN_KEY trong source frontend.
