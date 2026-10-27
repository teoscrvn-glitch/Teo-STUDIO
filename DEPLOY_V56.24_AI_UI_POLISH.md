# TeoStudio V56.24 — AI UI Polish

## Phạm vi
- Chỉ tinh chỉnh giao diện trợ lý nổi Teo AI/Téo Linh AI: khung kính tối, viền cyan, avatar biểu tượng, trạng thái online, nhãn AI, hiệu ứng mở/đóng và tin nhắn.
- Tối ưu chiều cao trên mobile, vùng hội thoại cuộn riêng, thanh nhập ở đáy và safe-area.
- Tôn trọng `prefers-reduced-motion`.
- Không thay đổi API AI, endpoint, xử lý tin nhắn, hành động tenant, báo lỗi, thanh toán hoặc dữ liệu.

## Triển khai an toàn
1. Giải nén ZIP, giữ nguyên cấu trúc thư mục.
2. Kiểm tra diff trước khi đẩy lên GitHub/Cloudflare Builds.
3. Deploy theo quy trình đang dùng.
4. Mở `https://teostudio.top`, tải lại cứng/xóa cache nếu CSS cũ còn hiện.
5. Kiểm tra: mở/thu nhỏ AI, gửi tin nhắn, mở Báo lỗi, xem trên màn hình điện thoại nhỏ.

## Lưu ý
Đây là bản chỉnh giao diện dựa trên source ZIP bạn gửi; chưa được deploy lên production và chưa thể xác nhận AI backend đang phản hồi thành công. Nếu backend Gemini vẫn trả HTTP 400, bản này không sửa lỗi nhà cung cấp AI.
