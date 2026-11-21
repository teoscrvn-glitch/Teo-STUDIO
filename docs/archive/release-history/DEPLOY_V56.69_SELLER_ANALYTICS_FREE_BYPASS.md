# TeoStudio V56.69 — Seller Analytics & Free Bypass Fix

## Nội dung chính
- Sửa bug bị thiếu `rewardTrafficApproved` trong helper cấu hình Free bypass.
- Mở rộng `/api/tenant/stats?month=YYYY-MM` với báo cáo Seller ID, số đơn được giới thiệu, tổng doanh số, hoa hồng, theo ngày và chi tiết đơn trong Studio hiện tại.
- Mở rộng `/api/admin/analytics?month=YYYY-MM` với tổng Seller, danh sách Seller ID/tài khoản, doanh số, hoa hồng, theo ngày và danh sách đơn được giới thiệu toàn hệ thống.
- Bổ sung bảng và đồ họa responsive cho Dashboard Studio và Admin chính.

## Deploy
1. Sao lưu D1 trước khi triển khai.
2. Deploy theo cấu hình đang dùng: Root directory `cloudflare`, Deploy command `npx wrangler deploy`. File `wrangler.toml` đã trỏ `[assets].directory = "../frontend"`, nên Wrangler đóng gói frontend assets cùng Worker. Không đổi database binding và không upload frontend thành một Worker riêng.
4. Giữ tất cả Secrets hiện có.
5. Với Free bypass, kiểm tra `BUMX_API_KEY`, `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1`, `FREE_BYPASS_VERIFY_URL` và `FREE_BYPASS_API_KEY`. Chỉ bật biến approval sau khi BumX xác nhận bằng văn bản cho phép traffic có thưởng. Endpoint verify phải là API thật và trả đúng `success`, `completed`, `state` như hướng dẫn `HUONG_DAN_FIX_FREE_BYPASS_V56.69.md`.
6. Admin Studio → Cài đặt/kiểm tra API → Test API vượt link. Sau đó thử với một tenant Free kiểm thử. Chỉ lượt có xác minh thật mới được cộng.
7. Mở Admin Studio chọn từng tháng; mở Admin chính → Tổng quan → Thống kê doanh thu theo tháng. Đối chiếu đơn và hoa hồng với Seller wallet.

## Kiểm tra cục bộ
Chạy `bash scripts/check-build.sh`. Bộ test xác nhận cú pháp, static guards và regression cho cờ Free bypass + báo cáo Seller. Không thay thế deploy/test production, xác minh API BumX, hoặc đối soát giao dịch thật.

## Quy tắc đọc số liệu
- `Doanh số được giới thiệu`: giá trị tổng đơn paid có `seller_id`.
- `Hoa hồng Seller`: tổng `seller_commission_vnd` phát sinh từ những đơn paid đó.
- `Seller ID`: `buyer_accounts.id` được ghi vào từng đơn.
- Đơn lịch sử không có `seller_id` không thể tự suy đoán người giới thiệu; số liệu cũ đó vẫn hiển thị trong báo cáo doanh thu/Studio hiện hữu nhưng không được quy thành hoa hồng Seller.
- Danh sách chi tiết giới hạn 100 đơn ở Tenant và 200 đơn ở Admin để tránh payload quá lớn; tổng hợp Seller vẫn tổng hợp trên toàn bộ kỳ báo cáo.
