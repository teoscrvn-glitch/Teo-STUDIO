# TeoStudio — trạng thái sau V56.31

## Đã làm trong source (chưa production-verified)
- Sửa cách đồng bộ visual viewport của Teo AI bằng requestAnimationFrame và theo dõi offsetTop.
- Khi bàn phím mở: neo panel vào vùng nhìn thấy, tắt animation/transform để tránh nhảy layout.
- JavaScript syntax check đã qua cho assistant.js và worker.js.

## Đang chờ kiểm tra sau deploy
- Teo AI có còn nháy/nhảy khi bàn phím Android mở/đóng không.
- API AI có phản hồi thành công hay còn báo chưa kết nối.

## Việc chưa hoàn tất
- Điều tra các lỗi Share File.
- Điều tra các lỗi trang admin Free/tenant và các trạng thái “sai sai”.
- Điều tra nguyên nhân `TENANT_REQUIRED` theo thao tác cụ thể và phiên tenant thực tế.
- Kiểm tra phân luồng đơn mua theo owner/tenant ở backend.

Không coi các mục chưa hoàn tất là đã sửa chỉ vì đã tạo ZIP.
