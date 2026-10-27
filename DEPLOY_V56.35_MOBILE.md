# Deploy V56.35 trên điện thoại

Bản này được tạo từ ZIP Teo-STUDIO-main (2).

## Nội dung
- Ảnh Téo Linh đặt tại `frontend/assets/img/teo-linh.webp` và widget dùng đường dẫn tuyệt đối `/assets/img/teo-linh.webp`.
- Danh sách đoạn chat lưu cục bộ trong trình duyệt bằng localStorage (tối đa 30 đoạn, tối đa 80 tin/đoạn); chưa đồng bộ giữa thiết bị.
- Feed giao dịch lọc theo scope, tenant ID và sự tồn tại của sản phẩm đúng catalogue.
- Trang chi tiết tenant có link chia sẻ kèm ảnh/tiêu đề; Worker trả OG/Twitter metadata server-side cho crawler.

## Triển khai
1. Sao lưu Worker và Static Assets hiện tại.
2. Tải lên toàn bộ Static Assets trong thư mục `frontend` theo cấu hình đang dùng. Không tải thư mục cha `frontend` thành một đường dẫn web lồng thêm.
3. Deploy `cloudflare/worker.js` làm Worker đang gắn với site. Giữ nguyên D1 binding và mọi Secrets/Variables hiện có.
4. Mở `/api/health`, xác nhận `version` là `v56.35-tenant-sales-detail-preview-ai-history-fix`.
5. Kiểm tra `/assets/img/teo-linh.webp`, trang `/share.html?tenant=SLUG`, `/tenant-detail.html?tenant=SLUG&id=PRODUCT_ID`, và link chia sẻ qua ứng dụng chat.
6. Dùng hai tài khoản tenant thử nghiệm riêng: mua một file trên web chính và xác nhận feed tenant không hiện; mua file trong tenant A và xác nhận chỉ feed A hiện giao dịch đó, tenant B không hiện.

Không xoá đơn hàng cũ hoặc thay đổi schema dữ liệu giao dịch. Nếu feed cũ có bản ghi sai `scope`/`tenant_id`, bản này lọc chúng khỏi feed; không tự sửa hoặc xoá lịch sử trong D1.
