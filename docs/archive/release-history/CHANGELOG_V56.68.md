# TeoStudio V56.68

- Chuyển rút thẻ Seller/Studio sang quy trình Admin chính duyệt và gửi thủ công; không tự gọi API mua thẻ.
- Tạm giữ 105% mệnh giá; Admin từ chối sẽ hoàn ledger theo D1 batch, có kiểm soát lặp.
- Mã thẻ/serial nhập bởi Admin được mã hóa AES-GCM trước khi lưu.
- Bổ sung trang tài khoản riêng và phiên buyer dùng chung 30 ngày, ghi nhận IP + browser device ID.
- Ràng buộc session với device ID ở những request có gửi device header; IP động thay đổi không tự logout trên cùng browser device.
- Thêm consent AI cá nhân hóa dạng opt-in, chỉ chia sẻ ngữ cảnh đọc và không cấp quyền thao tác tài chính/Admin.
- Bổ sung avatar bình luận công khai, công cụ chặn IP/email ở Admin chính và Tenant Admin.
- Thêm thống kê hiệu suất từng file: views, outbound clicks, paid orders, revenue và conversion rate.
- Thêm khu vực Seller và tạo/thuê website ở cuối trang Share.
- Gia cố thông báo cấu hình cho luồng rút thẻ thủ công; bỏ yêu cầu API auto-purchase token.
- Cập nhật CSS/JS cache version sang V56.68.
