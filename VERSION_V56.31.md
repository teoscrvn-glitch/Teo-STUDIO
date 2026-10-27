# V56.31 — Teo AI keyboard layout stability

## Mục tiêu
Sửa hiện tượng khung Teo AI nháy/nhảy vị trí khi Android mở bàn phím hoặc thay đổi visual viewport.

## Thay đổi
- `assistant.js`: gom cập nhật `visualViewport` qua `requestAnimationFrame`, theo dõi cả `offsetTop` và chiều cao viewport, dùng listener passive.
- `style.css`: override các quy tắc mobile cũ chồng lấn; khi bàn phím mở, khung chat neo theo `visualViewport` bằng top + height ổn định, tắt transform/transition/animation trên panel trong lúc nhập.
- `worker.js`: cập nhật version health thành `v56.31-teo-ai-keyboard-layout-stability-fix`.

## Kiểm tra
- Đã chạy `node --check` trên `frontend/assets/js/assistant.js` và `cloudflare/worker.js`.
- Đã kiểm tra gói ZIP.
- Chưa kiểm thử trên điện thoại thật và chưa deploy production.

## Chưa xử lý trong bản này
- Các lỗi Share File và trang admin Free khác cần tái hiện/đối chiếu riêng; không được xem là đã sửa trong V56.31.
- Lỗi AI báo chưa kết nối vẫn cần kiểm tra cấu hình endpoint/model/secret và phản hồi API sau deploy.
- Lỗi `TENANT_REQUIRED` chưa được coi là đã giải quyết.
