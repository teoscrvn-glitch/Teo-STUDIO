# Deploy V56.32 trên điện thoại

1. Giữ ZIP V56.31 làm bản dự phòng; không xóa Worker/Secrets đang hoạt động.
2. Giải nén ZIP V56.32 và cập nhật source theo quy trình hiện có của TeoStudio/GitHub Builds.
3. Deploy Worker + Static Assets cùng một commit; không chỉ deploy Worker vì bản này có cập nhật HTML/CSS/JS và ảnh nhân vật.
4. Mở `https://teostudio.top/api/health`; version mong đợi: `v56.32-teo-ai-vision-stable-tenant-sales-isolation`.
5. Mở trang trong tab ẩn danh hoặc làm mới cứng để chắc chắn tải assets `?v=56.32`.
6. Kiểm tra trang Share File chính: chỉ thấy các giao dịch `scope='main'`. Mở URL tenant có `?tenant=SLUG`: chỉ thấy đơn `scope='tenant'` của tenant tương ứng. Test hai tenant khác nhau để xác minh không lộ chéo.
7. Kiểm tra Teo Linh: khung chat không có ảnh lớn đầu hội thoại; mở bàn phím không làm trang nháy/nhảy; gửi câu hỏi text; đính kèm ảnh rồi hỏi về ảnh. Thành công với ảnh còn phụ thuộc model AI hiện được cấu hình có hỗ trợ vision.
8. Mở Báo lỗi, đính kèm ảnh, xác minh Turnstile, xem trước mô tả và xác nhận gửi. Trong Admin → Báo cáo lỗi, dùng “Xem ảnh” để kiểm tra ảnh đã lưu.
9. Thử tenant admin Free, đăng file, chỉnh file, ẩn/hiện, mở phần thống kê và các thao tác hiện lỗi; ghi lại chính xác thao tác + phản hồi API nếu `TENANT_REQUIRED` còn.

## Giới hạn cần biết
- Lịch sử chat lưu local trên thiết bị; ảnh chat không được lưu trong lịch sử để tránh làm đầy localStorage.
- Ảnh của báo cáo lỗi lưu trong D1 và xem qua endpoint có xác thực admin; phải cân nhắc xóa ảnh khi xử lý xong và chính sách lưu trữ.
- Chưa có cơ chế AI tự thay đổi dữ liệu tùy ý; V56.32 chỉ điều hướng tới một số giao diện được cho phép và soạn báo cáo, với xác nhận trước khi gửi. Không thực hiện xóa/đổi quyền/đổi tiền.
- Chưa xác nhận production và chưa thử nghiệm Android thực tế sau deploy.
