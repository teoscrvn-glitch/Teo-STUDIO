# TeoStudio V57.13 — Free key return fix

## Sửa lỗi Link4M quay về nhưng không nhận key
- Link4M có thể đưa trang đích sang tab/browsing context mới. V57.12 chỉ kiểm tra proof trong sessionStorage của tab Admin ban đầu, gây lỗi "chỉ dùng được trong đúng tab".
- V57.13 lưu proof tạm thời trong localStorage và sessionStorage của cùng origin. Worker vẫn yêu cầu đúng tenant session, tenant, state, proof hash, TTL 5 phút và trạng thái one-time; state được claim bằng giao dịch D1.
- Cho phép trang đích tự động cấp key trong tab mới của cùng trình duyệt đã đăng nhập. Không cho phép một thiết bị/trình duyệt khác không có session hợp lệ nhận key.

## Bảo mật và giao diện
- Trang /free-key.html dùng CSS độc lập, không tải admin.css/style.css; hiển thị trạng thái chờ ngay, giảm tài nguyên và độ trễ vẽ giao diện.
- Query tenant/state/proof/exp được chuyển vào bộ nhớ tạm same-origin rồi xóa khỏi thanh địa chỉ ngay sau khi trang tải.
- Bỏ thông tin debug API, HTTP status, hostname nhà cung cấp, tên biến Secret, callback/API và mô tả state/proof khỏi giao diện tenant.
- Trang nhận key chỉ hiển thị mã, nút sao chép, thời hạn và nút quay lại Admin.
- Giữ BumX → Link4M, 7 ngày mỗi chu kỳ, giới hạn hai chu kỳ trong 24 giờ, key 5 phút và dùng một lần.

## Giới hạn
Nhà cung cấp không gửi callback ký số xác nhận quảng cáo, vì vậy TeoStudio chỉ xác nhận lượt quay về với state hợp lệ; không khẳng định đã xác minh độc lập việc xem quảng cáo.
