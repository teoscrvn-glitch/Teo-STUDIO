# TeoStudio V57.13 — Free Key Cross-Tab Return Fix

## Lỗi đã xử lý
- Link4M có thể điều hướng về trang đích trong tab mới. V57.12 chỉ kiểm tra mã proof ở sessionStorage của tab Admin gốc nên báo lỗi yêu cầu quay lại đúng tab.
- V57.13 lưu proof tạm thời ở localStorage cùng origin (đồng thời giữ sessionStorage làm fallback). Tab đích mới trong cùng trình duyệt đã đăng nhập có thể gửi state/proof về Worker.
- Worker vẫn xác minh phiên đăng nhập, Studio, step BumX/Link4M, state còn hạn và trạng thái cấp key một lần. Không bỏ kiểm tra phía server.

## Giao diện và hiệu năng
- Trang nhận key độc lập, không tải style.css/admin.css; hiển thị skeleton/loader tức thì.
- URL return query được lưu tạm same-origin rồi xóa khỏi thanh địa chỉ.
- Giao diện khách thuê không còn hiển thị kiểm tra API, HTTP status, domain rút gọn, tên biến Secret, state/proof hoặc ghi chú callback nội bộ.
- Key vẫn dùng một lần, có hiệu lực 5 phút. Link nhận key cũng hết hạn sau 5 phút.

## Kiểm tra
- Mô phỏng tab mới với sessionStorage rỗng nhưng localStorage chia sẻ: PASS.
- Kiểm thử cấp key tự động, kiểm tra phiên và làm sạch URL: PASS.
- Kiểm thử thời hạn 5 phút và claim một lần bằng mô phỏng SQLite: PASS.
- Kiểm tra cú pháp JS Worker/frontend và parse HTML: PASS.
- Chưa chạy trực tiếp trên Cloudflare production, D1 production hoặc tài khoản Link4M/BumX thật.
