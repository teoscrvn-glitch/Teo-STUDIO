# TeoStudio V56.37 — Video hướng dẫn theo tag

## Có trong bản này
- Thêm cột `video_url` dạng bổ sung an toàn cho tag chính và tag tenant.
- Admin chính có thể dán link YouTube khi tạo/sửa tag (sửa tag sẽ hỏi link; tạo tag hỏi link).
- Admin tenant có ô link YouTube tùy chọn khi tạo tag.
- Trang chi tiết file trên site chính và tenant nhúng video cuối phần mô tả/lưu ý khi tag của file có link YouTube hợp lệ. Chấp nhận URL watch/youtu.be/embed; dùng YouTube-nocookie iframe, không tự phát.
- Video đăng ký tài khoản chưa được thêm trong bản này.

## Kiểm tra
- Cần chạy `node --check cloudflare/worker.js`, `node --check frontend/assets/js/main.js`, `node --check frontend/assets/js/tenant-detail.js`, `node --check frontend/assets/js/admin.js`, `node --check frontend/assets/js/tenant-admin.js`.
- Chưa deploy/test trên Cloudflare production.
- Các hạng mục AI context/history, ảnh báo lỗi, tenant-sales isolation và link xem trước tenant chưa được coi là đã fix trong bản này.
