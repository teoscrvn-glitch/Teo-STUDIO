# V56.35 — báo cáo kiểm tra

Đã thực hiện kiểm tra tĩnh sau khi chỉnh source.

- Worker: cập nhật phiên bản và thêm nhánh metadata crawler cho tenant detail.
- Tenant recent-sales: yêu cầu `scope='tenant'`, tenant ID thuộc khoá chuẩn/legacy của tenant hiện tại, và product tồn tại trong tenant catalogue cùng nhóm ID.
- Main recent-sales: yêu cầu `scope='main'`, `tenant_id` rỗng/null và product tồn tại trong main catalogue.
- Tenant detail: thêm link chia sẻ trực tiếp, thumbnail và cập nhật OG/Twitter metadata trong trình duyệt; crawler nhận metadata từ Worker.
- Teo Linh: ảnh WebP được đóng gói vào assets; history dùng localStorage, không gửi nội dung hội thoại lên server.
- Cache busting: asset references trong HTML cập nhật lên v56.35.

Chưa deploy production, chưa truy cập được D1 production để xác minh các bản ghi cũ, và chưa chạy kiểm thử trên điện thoại thật. Kiểm tra cú pháp/build được ghi riêng sau khi chạy script trong môi trường hiện tại.
