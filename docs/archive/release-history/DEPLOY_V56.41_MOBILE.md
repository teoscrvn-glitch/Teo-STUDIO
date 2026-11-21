# Triển khai V56.41

1. Giải nén gói và cập nhật các tệp frontend như quy trình deploy hiện tại.
2. Triển khai `cloudflare/worker.js` lên Cloudflare Worker đang phục vụ API của TeoStudio.
3. Giữ nguyên các secrets và bindings hiện tại (`AI_API_URL`, `AI_API_KEY`, `AI_MODEL`, D1/R2/Assets nếu đang dùng).
4. Mở trang bằng trình duyệt, tải lại mạnh hoặc xóa cache nếu CSS/JS cũ vẫn được dùng.
5. Kiểm tra: mở bong bóng AI, nút X, lịch sử chat, nhập tin nhắn dài, bật/tắt Hiện chữ dần, chọn ảnh JPG/PNG/WebP rồi gửi câu hỏi về ảnh.

**Lưu ý:** ảnh được nén trên trình duyệt và gửi qua Worker tới nhà cung cấp AI đã cấu hình. Model phải hỗ trợ đầu vào ảnh. Không gửi mật khẩu, OTP hoặc API key trong tin nhắn/ảnh.
