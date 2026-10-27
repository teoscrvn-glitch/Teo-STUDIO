# TeoStudio — Trạng thái dự án sau V56.32
Cập nhật: 24/10/2026 (giờ Việt Nam)

## Nguồn để tiếp tục
- ZIP trước: V56.31 TeoAI Keyboard Layout Fix.
- ZIP mới cần đánh giá: V56.32 TeoAI Vision Stable Tenant Sales Isolation.
- Worker version mong đợi sau deploy: `v56.32-teo-ai-vision-stable-tenant-sales-isolation`.
- Production chưa được xác minh; dùng `/api/health` để kiểm tra bản đang chạy.

## Đã sửa trong source V56.32 (chưa production-verified)
- Tăng cache-busting cho CSS/JS trong các trang HTML lên `?v=56.32`, khắc phục sự chênh lệch version query cũ.
- Gộp CSS widget AI thành một bộ quy tắc ổn định; bỏ hero ảnh lớn, animation vô hạn và giảm blur/animation nặng trên mobile.
- Đổi asset nhân vật ở nút mở AI sang WebP mới.
- Thêm đính kèm ảnh cho cuộc trò chuyện AI; backend hỗ trợ multimodal data URL nếu model/provider hỗ trợ ảnh.
- Thêm ảnh báo lỗi, xem trước, dùng AI soạn nháp từ hội thoại gần đây và yêu cầu xác nhận trước khi gửi. Ảnh báo lỗi được lưu vào D1 và chỉ có endpoint xem ảnh có xác thực admin.
- Tăng độ chặt của route recent-sales: trang chính `scope='main'`; tenant bắt buộc `scope='tenant'` và tenant ID chuẩn (canonical) tương ứng. Frontend chỉ gọi endpoint tenant khi có `?tenant=slug`, không fallback sang đơn main nếu URL tenant không hợp lệ.
- Cập nhật prompt AI: hướng dẫn web, small talk và luật không thực hiện thay đổi dữ liệu nếu chưa xác nhận/quyền backend.

## Chưa xác minh / việc tồn đọng
- Chưa deploy, chưa kiểm tra UI bằng trình duyệt mobile thật, chưa kiểm tra D1 production.
- Cần xem `/api/health` sau deploy và kiểm thử mở/đóng bàn phím nhiều lần.
- Cần kiểm tra route tenant trên hai tenant riêng biệt và trang chính.
- `TENANT_REQUIRED` và các vấn đề khác của Admin Free/Share File chưa được coi là đã sửa; cần tái hiện theo thao tác chính xác.
- AI ảnh chỉ hoạt động khi model/provider đang cấu hình có hỗ trợ vision.
- Lịch sử chat chỉ đồng bộ trong localStorage cùng thiết bị; ảnh chat không giữ sau khi rời cuộc trò chuyện.
- Chỉ mới hỗ trợ một số điều hướng an toàn và soạn báo cáo; chưa có tác vụ backend tổng quát cho AI.

## Hoàn tất đã xác minh
- Chưa có thay đổi production nào được đánh dấu hoàn tất. Kiểm tra syntax/package được chạy sau khi build.
