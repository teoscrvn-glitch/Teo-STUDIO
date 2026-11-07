# TeoStudio V58.0 — Mobile Account, Studio Limits & Notes

## Đã thay đổi

### 1. Tài khoản trên mobile
- Đưa vùng đăng nhập/đăng ký và hồ sơ tài khoản vào `#teoAccountMount` nằm ngay trong phần `main`, trước footer.
- Trên trang `/account` và `/topup`, modal tài khoản chuyển thành khối nội dung theo luồng trang thay vì overlay cố định giữa viewport.
- Gỡ khoảng đệm/min-height không cần thiết ở cuối phần giới thiệu; giới hạn chiều rộng và tràn nội dung trên màn hình nhỏ.
- Tăng cache version cho CSS/JS liên quan lên `58.0`.

### 2. Giới hạn Studio theo quyền đã thanh toán
- Free: tối đa 1 Studio trên mỗi tài khoản TeoStudio.
- VIP: tối đa 3 Studio khi tài khoản có ít nhất một Studio VIP đã thanh toán, đang mở khóa và còn hạn.
- Chỉ chọn `planType=paid` hoặc tạo đơn VIP đang chờ không cấp quyền 3 Studio.
- API máy chủ tự tính quyền; không tin giới hạn do trình duyệt gửi lên.
- Trang tài khoản hiển thị giới hạn hiện tại và trạng thái VIP đang hoạt động/chờ thanh toán/tạm khóa.

### 3. Note cho Master Admin và chủ Studio
- Bổ sung bảng D1 `tenant_notes` và index theo Studio/trạng thái hiển thị.
- Chủ Studio có thể tạo, sửa, ẩn/hiện và xóa Note trong Tenant Admin.
- Master Admin có thể chọn Studio đích và quản lý Note tương ứng.
- Một Note hỗ trợ tiêu đề, nội dung, tag dạng nhãn chữ, nút chính, link, tối đa 8 bước liên kết, tùy chọn link quảng cáo và trạng thái công khai.
- Share công khai hiển thị các Note đang bật. Người xem lần lượt mở link và tự xác nhận từng bước; trạng thái hiện tại lưu trên trình duyệt của người xem.
- URL được giới hạn ở HTTP/HTTPS và nội dung hiển thị được escape trước khi render.

## Giới hạn cần biết
- Tag của Note hiện là nhãn riêng dạng chữ, chưa liên kết trực tiếp với tag file có sẵn. Các bước Note chưa khóa/mở quyền tải file thực tế; sau khi xong chỉ hiện trạng thái hoàn tất. Xác nhận từng bước chỉ là thao tác tự khai báo trên trình duyệt. Hệ thống không xác thực người dùng thật sự đã vào nhóm Zalo, follow TikTok hay hoàn thành hành động bên ngoài; không dùng trạng thái này làm bằng chứng thanh toán hoặc phát hành tài sản có giá trị.
- Link quảng cáo trong Note chỉ là liên kết ngoài tùy chọn. Bản này không nhúng SDK quảng cáo, không xác nhận impression/click với mạng quảng cáo và không tự cộng tiền từ lượt nhấp.
- Quy trình ghi nhận doanh thu quảng cáo hiện có (nhập báo cáo và Admin xác nhận đối soát) được giữ nguyên; không thay đổi tỷ lệ hoặc sổ cái.
- Nhiệm vụ Free A BumX → Link4M được giữ nguyên theo V57.13. Chưa tạo nhiệm vụ B tăng hạn mức mua file vì mã nguồn hiện tại chưa có mô hình quota mua file riêng để cộng/trừ an toàn.
- Chưa nâng cấp AI thành agent có thể tự thao tác tùy ý trên website. Các khả năng AI và giới hạn điều hướng an toàn hiện hữu được giữ nguyên.
- Luồng Seller/referral hiện tại và tích hợp nạp thẻ TheCaoSieuToc được giữ nguyên, không chỉnh sửa logic thanh toán/hoa hồng trong bản này.
