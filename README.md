# Téo Studio Rental V27

Bản sửa tiếp theo cho hệ thống thuê Share File.

## Sửa chính
- Tương thích tenant_accounts cũ dùng `id`, `tenant_id` hoặc `slug`.
- Lookup tenant master/admin/share không còn phụ thuộc duy nhất vào một cột khóa.
- Chuẩn hóa tenant trước khi Share File đọc settings/files/tags/comments.
- Sửa thao tác gia hạn/đổi mật khẩu/khóa/xóa tenant để dùng đúng canonical tenant id.
- Re-auth Admin: sai mật khẩu xác minh không làm mất session ngay.
- Health API đổi version thành `rental-v27-safe` để kiểm tra đúng bản Worker đang chạy.
- Ảnh nền avatar hiển thị thành một dải nhỏ phía sau avatar; avatar nằm đè khoảng giữa ảnh nền và bên ngoài.
- Giữ nguyên D1 hiện tại, không reset database.
- Giữ khu vực dịch vụ TikTok / YouTube / Zalo ở cuối Share File.

## Deploy
Upload/deploy `cloudflare/worker.js` và frontend đi kèm. Sau deploy kiểm tra `/api/health`; kết quả phải có `version: rental-v27-safe`.
