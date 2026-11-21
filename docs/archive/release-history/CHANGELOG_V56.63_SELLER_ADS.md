# V56.63 — Seller & Ads completion

- Bổ sung khóa idempotency cho yêu cầu rút Seller, chặn tái dùng cùng request key với số tiền khác.
- Ghi nhật ký sự kiện yêu cầu/duyệt/từ chối/đã trả và lịch sử nhập/xác nhận/từ chối báo cáo Ads.
- Kiểm tra kỳ báo cáo Ads, ngày hợp lệ và ngăn nhập kỳ tương lai.
- Bổ sung danh sách override Seller/Ads theo Studio; payout Seller được xác định rõ là công tắc toàn cục cấp tài khoản.
- Hiển thị doanh thu Ads đã xác nhận riêng trong thống kê Studio theo tháng và tổng thực nhận file + Ads.
- Cập nhật `TELEGRAM_BOT_USERNAME` trong `[vars]` bằng username bot đã cung cấp; không chứa token hoặc secret.
- Giữ nguyên luồng webhook SePay; schema mới chỉ tạo bảng/index hoặc thêm cột, không xóa dữ liệu tài chính cũ.

Ads API chưa được tích hợp vì chưa có tài liệu/API của nhà cung cấp; bản này hỗ trợ quản lý provider và nhập/đối soát thủ công.
- Thống kê tenant theo tháng hiển thị riêng doanh thu Ads đã xác nhận; tổng thực nhận = doanh thu bán file + Ads đã xác nhận. Số đơn và tỷ lệ chuyển đổi vẫn chỉ dựa trên đơn bán file.
- Rollout theo Studio chỉ cho Seller program và Ads; Seller payout được khóa ở cấp hệ thống, tránh cấu hình per-tenant gây hiểu nhầm.
