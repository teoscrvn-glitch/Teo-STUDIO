# TeoStudio V56.69 — Seller Analytics & Free Bypass Fix

## Sửa lỗi Free bypass
- Bổ sung `rewardTrafficApproved` vào kết quả `bypassProviderConfig()`. Trước đó các luồng tạo link, kiểm tra API và cấu hình đọc thuộc tính không tồn tại nên luôn coi chính sách traffic có thưởng là chưa được duyệt, kể cả khi đã đặt Variable `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1`.
- Giữ nguyên điều kiện an toàn: chỉ cộng lượt/ngày sau khi API xác minh từ nhà cung cấp trả `success: true`, `completed: true` và đúng `state`. Không giả lập xác minh.
- Link4M vẫn không dùng cho luồng Free đổi ngày thuê do chính sách traffic có thưởng chưa được xác nhận.

## Báo cáo Seller
- API `/api/tenant/stats?month=YYYY-MM` trả thêm `sellerAnalytics`: tổng đơn giới thiệu, doanh số được giới thiệu, hoa hồng phát sinh, Seller ID/tài khoản, hoa hồng theo ngày và chi tiết đơn. Dữ liệu chỉ lấy đơn `paid` có `seller_id` thật trong phạm vi Studio đó.
- API `/api/admin/analytics?month=YYYY-MM` bổ sung báo cáo toàn hệ thống theo Seller ID, tài khoản, phạm vi/Studio, doanh số, hoa hồng, chi tiết đơn và biểu đồ theo ngày.
- Dashboard Studio và Admin chính có khu vực thống kê Seller riêng, responsive trên điện thoại.
- Dashboard Studio có bảng đơn hàng theo từng file/ngày, số đơn đã trả và doanh thu; gộp dữ liệu đơn ví và đơn SePay.
- Tổng số đơn/doanh số/hoa hồng Seller tính trên toàn kỳ, không bị giới hạn bởi số dòng chi tiết hiển thị. Admin chính gộp báo cáo theo Seller ID duy nhất, kèm danh sách Studio đã phát sinh.
- Giữ nguyên báo cáo doanh thu/tenant hiện có; không đổi số liệu đơn cũ không có attribution.

## Giới hạn cần biết
- Đơn lịch sử không có `seller_id` sẽ không thể quy ngược chính xác cho Seller.
- Hoa hồng báo cáo là hoa hồng phát sinh trên giao dịch trả tiền; trạng thái số dư chờ/khả dụng và rút tiền vẫn theo Seller wallet/withdrawals hiện có.
- Free bypass vẫn cần API xác minh hoàn thành thật do nhà cung cấp cấp, cùng xác nhận bằng văn bản rằng loại traffic có thưởng được phép. Chỉ có BumX API shorten key là chưa đủ.
