# TeoStudio V57.7 — Free bypass tenant-session fix

## Sửa lỗi
- Sửa resolver của luồng Free bypass: ưu tiên phiên tenant đã xác thực, sau đó dùng slug Studio được gửi kèm để hỗ trợ owner SSO khi client cũ thiếu `x-tenant-slug`.
- Chỉ chấp nhận tenant khi mã định danh trong request khớp với một trong các khóa canonical của tenant; không bỏ qua bước xác thực quyền sở hữu.
- Dùng cùng resolver cho bước bắt đầu vượt link và đổi key để tránh lệch nhận diện phiên giữa hai bước.
- Nâng cache-busting frontend lên `v57.7`, bao gồm trang Tenant Admin, Free Key và các asset liên quan để tránh tải lại script cũ `v57.4`.

## Kiểm tra đã thực hiện
- Kiểm tra cú pháp JavaScript cho Worker và các script frontend liên quan.
- Kiểm tra ZIP có thể liệt kê/giải nén và các đường dẫn asset được tham chiếu tồn tại.

## Giới hạn xác minh
- Chưa thể kiểm thử đăng nhập/đổi key trên D1 production hoặc xác nhận cấu hình API BumX/Link4M của Cloudflare từ môi trường này.
- Luồng hiện tại xác nhận phiên quay lại và key dùng một lần; không tự khẳng định nhà cung cấp đã xác minh hành vi xem quảng cáo nếu không có callback ký số từ nhà cung cấp.
