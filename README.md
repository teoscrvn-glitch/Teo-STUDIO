# Téo Studio

Bản này giữ nguyên Worker + D1 hiện tại và bổ sung hệ thống **thuê Share File riêng**.

## D1 hiện tại — KHÔNG đổi
- Database: `teo-studio`
- Database ID: `567f1c65-c144-414e-8bc4-26a3a0d276ca`
- Binding: `DB`

Worker sẽ tự tạo các bảng `tenant_*` cần thiết khi chạy lần đầu; không drop/xóa các bảng cũ.

## Luồng thuê Share File
- Người dùng vào `rent.html` → đăng nhập ID + mật khẩu hoặc IB Zalo Téo.
- Master Admin tạo tenant, đặt ID + mật khẩu + số ngày thuê.
- Mỗi tenant có slug/link Share File cố định và link Admin cố định.
- ID tenant không thể đổi.
- Tenant có file, tag, bình luận, giao diện và thống kê riêng.
- Tenant đổi được mật khẩu; đổi mật khẩu sẽ đăng xuất các phiên cũ.
- Master Admin có tìm kiếm ID, gia hạn ngày, đổi mật khẩu, khóa/mở khóa, xem link và xóa tenant.
- Cảnh báo khi còn 7 ngày; hết hạn sẽ khóa truy cập. Sau 6 ngày kể từ hạn, Cron tự xóa dữ liệu tenant.
- Không có chức năng kiếm tiền trong bản này.

## Deploy Worker
```bash
cd cloudflare
npx wrangler deploy
```

Wrangler đã cấu hình Cron chạy mỗi giờ để dọn tenant hết hạn quá 6 ngày.
