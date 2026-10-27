# V56.41 — Téo hệ thống AI

- Đổi nhãn trợ lý thành **Téo hệ thống AI**.
- Mở rộng khung chat gần toàn màn hình trên điện thoại; điều chỉnh ô nhập để tự tăng chiều cao khi soạn tin dài.
- Bổ sung chọn ảnh, xem trước ảnh, bỏ ảnh và gửi ảnh kèm câu hỏi đến endpoint AI.
- Worker xác thực định dạng/kích thước ảnh trước khi chuyển nội dung đa phương thức tới endpoint tương thích OpenAI.
- Thêm trạng thái AI đang suy nghĩ, hiệu ứng hiện chữ dần có thể bật/tắt, và nút đóng X.
- Tinh chỉnh avatar bong bóng AI và giảm chuyển động khi thiết bị bật chế độ giảm chuyển động.
- Không thay đổi các chức năng hiện có về lịch sử chat, tài khoản, báo lỗi, hoặc hành động quản trị cần xác nhận.

## Kiểm tra tĩnh

- `node --check frontend/assets/js/assistant.js`
- `node --check cloudflare/worker.js`

Cần triển khai cả frontend và Cloudflare Worker để gửi ảnh cho AI hoạt động. Khả năng hiểu ảnh phụ thuộc model/endpoint AI đã cấu hình; nếu endpoint/model không hỗ trợ ảnh, tính năng phân tích ảnh sẽ trả lỗi từ nhà cung cấp.
