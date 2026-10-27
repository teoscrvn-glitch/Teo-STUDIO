# TeoStudio V56.29 — Teo Linh AI UI patch

## Phạm vi
Bản này dựa trên source `Teo-STUDIO-main` bro gửi (Worker đang có `BUILD_VERSION=v56.28-detail-clean-url-routing-fix`). Chỉ nâng cấp frontend AI và cache key; không thay API/Worker logic, D1 schema, giao dịch, quyền admin hoặc Cloudflare secrets.

## Thay đổi
- Thêm ảnh nhân vật AI trong `frontend/assets/img/teo-linh-ai.webp` (dùng đúng ảnh WebP người dùng gửi).
- Thay quả táo trên nút nổi bằng nhân vật Téo Linh, vòng hologram xoay rất chậm và trạng thái online.
- Khung chat có avatar nhỏ ở header, tên Téo Linh AI / PRO, nút `+` tạo chat mới và `−` thu nhỏ; không có banner nhân vật lớn phía trên hội thoại.
- Panel dùng opacity/transform để mở/thu, không đổi `display` qua lại; khu vực tin nhắn là vùng cuộn riêng.
- Theo dõi `visualViewport` bằng requestAnimationFrame để điều chỉnh khi bàn phím mobile xuất hiện.
- Tôn trọng `prefers-reduced-motion`.
- Bump cache key CSS/assistant JS lên `56.29` ở 11 trang frontend.

## Deploy
1. Giữ ZIP/source đang chạy làm bản dự phòng.
2. Giải nén ZIP và deploy Worker + Static Assets bằng quy trình Cloudflare hiện tại (hoặc deploy cùng repo qua Wrangler). `cloudflare/wrangler.toml` vẫn trỏ Static Assets vào `../frontend`.
3. Không thay đổi hay xóa Cloudflare Secrets.
4. Mở `https://teostudio.top`, tải lại trang hoàn toàn hoặc đóng/mở lại tab để CSS/JS mới được tải.
5. Kiểm tra nút AI có ảnh Téo Linh, mở/thu nhỏ, nút `+`, và mở bàn phím khi chat. Kiểm tra trên thiết bị thật.

## Phiên bản API
Bản này không thay Worker logic nên `/api/health` vẫn có thể báo `v56.28-detail-clean-url-routing-fix`. Query cache của CSS/JS là `56.29`; đây là bản vá frontend, không phải nâng cấp backend.

## Kiểm thử đã làm
- `node --check frontend/assets/js/assistant.js` — PASS.
- Đếm ngoặc CSS cân bằng — PASS.
- Xác nhận ảnh nhân vật tồn tại và 11 trang HTML đều dùng cache key assistant JS `56.29` — PASS.
- Chưa chạy được kiểm thử Chromium/điện thoại trong môi trường này; chưa deploy production. Vì vậy chưa thể cam kết hiện tượng nhấp nháy/lag đã hết trên mọi thiết bị.

## Lưu ý
`showChat()` khởi tạo hội thoại mới khi mở khung; nút `+` hiện tạo đoạn chat mới bằng cách xóa nội dung đang hiển thị, không phải lưu lịch sử chat vào server. Hãy sao lưu đoạn chat quan trọng trước khi bấm `+`.
