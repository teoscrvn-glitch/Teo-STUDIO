# Cập nhật TeoStudio v56.20 trên điện thoại

1. Giải nén ZIP và cập nhật nội dung bên trong (giữ nguyên cấu trúc gốc `cloudflare/`, `frontend/`, `scripts/`) vào repo TeoStudio đang kết nối Cloudflare Worker Builds. Không đặt thêm một tầng thư mục lồng nhau.
2. Commit/push và chờ Worker Builds hoàn tất. Bản ZIP không tự triển khai lên production.
3. Không xóa hoặc thay các Secret hiện có (`ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, `AI_API_KEY` và SMTP password). Không cần đưa API key vào GitHub hoặc `wrangler.toml`.
4. Mở `https://teostudio.top/api/health`, kiểm tra `version` phải là `v56.20-sales-marquee-detail-ai-fix`. Nếu vẫn là bản cũ, kiểm tra lần deploy gần nhất trước khi thao tác gì với D1.
5. Test một file main ở `/detail?id=ID_FILE`, một file tenant ở `/tenant-detail.html?tenant=SLUG&id=ID_FILE`, và thử Teo AI với tin nhắn ngắn `Xin chào`.
6. Kiểm tra mua file và thanh toán qua ví/SePay sau khi deploy; package không thay đổi logic payment hay bảng giao dịch.

## Bảo vệ dữ liệu
- Feed public chỉ dùng email đã che bớt và ảnh avatar đã qua bộ lọc ảnh an toàn.
- Đơn main chỉ hiện ở trang chính; đơn tenant chỉ hiện trên trang tenant tương ứng.
- Nếu Gemini còn lỗi sau khi bỏ `temperature`, lưu lại HTTP status hiển thị trong AI diagnostics; không gửi API key.
