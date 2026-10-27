# Deploy V56.31 — sửa khung Teo AI nhảy khi bật bàn phím

1. Sao lưu bản đang chạy trước.
2. Deploy frontend và Worker từ ZIP này theo đúng workflow hiện tại.
3. Không đổi/xóa Cloudflare Secrets trong lần deploy sửa giao diện này.
4. Sau deploy, kiểm tra `https://teostudio.top/api/health`; version mong đợi: `v56.31-teo-ai-keyboard-layout-stability-fix`.
5. Trên Android kiểm tra: mở Teo AI, chạm ô nhập, gõ vài dòng, gửi tin, ẩn/hiện bàn phím; khung chat phải giữ trong visual viewport, không bay lên/xuống hay nháy khi bàn phím thay đổi chiều cao.
6. Thử thu nhỏ/mở lại khung và kiểm tra các nút tạo chat mới/lịch sử.
7. Kiểm tra riêng AI reply. Nếu vẫn báo chưa kết nối, gửi lại kết quả `/api/health` và thông báo lỗi (không gửi API key).

## Giới hạn
Bản này sửa luồng bố cục/viewport, chưa sửa các lỗi Share File/admin Free chưa được tái hiện. Chưa deploy hay kiểm thử trên thiết bị thật trong môi trường này.

## Rollback
Nếu giao diện/chat có lỗi hồi quy, redeploy ZIP trước đó.
