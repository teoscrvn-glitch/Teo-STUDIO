# TeoStudio V56.38 — cập nhật an toàn

1. Sao lưu Worker, D1 và assets hiện tại trước khi triển khai.
2. Triển khai mã trong `cloudflare/worker.js` cùng toàn bộ thư mục `frontend/` theo cấu hình Cloudflare hiện tại.
3. Migration cột `video_url` của tag là bổ sung; không xóa/reset dữ liệu. Kiểm tra log Worker và D1 sau deploy.
4. Admin chính → Giao diện → “Video hướng dẫn đăng ký tài khoản”: dán link YouTube khi đã có; để trống nếu chưa có.
5. Admin chính và Admin tenant → quản lý tag: gắn link YouTube; tenant tag có thể sửa tên/link. Để link trống để ẩn video.
6. Chạy `sh scripts/check-build.sh` trước deploy. Đây là kiểm tra tĩnh, không thay thế kiểm thử production.
7. Chưa xác nhận đã deploy Cloudflare production. Không thay đổi secrets trong quá trình cập nhật này.
