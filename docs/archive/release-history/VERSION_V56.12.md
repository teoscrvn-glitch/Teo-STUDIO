# V56.12 — Tenant Login Cache Fix

- Sửa cache key của `frontend/assets/js/tenant-admin.js` từ `?v=56.9` sang `?v=56.12` để trình duyệt yêu cầu đúng JS mới sau deploy.
- Đồng bộ fingerprint HTML và `/api/health` thành `v56.12-tenant-login-cache-fix`.
- Không thay đổi schema D1, dữ liệu thuê, Secrets, cấu hình SePay hoặc SMTP.
- Đây là sửa lỗi phát hiện được trong ZIP và video; chưa thể khẳng định đăng nhập production thành công trước khi deploy và thử thực tế.
