# TeoStudio V57.3 — Free bypass bằng key một lần

## Luồng mới
- Admin Free chỉ hiện cổng vượt link khi Studio Free đã hết thời hạn. Nếu `expires_at` còn ở tương lai, Admin tự mở và không bắt vượt link.
- Một lượt vượt BumX đưa người dùng về `/free-key.html` với state ngẫu nhiên đã lưu hash trong D1. Không có state thì mở trang nhận key trực tiếp sẽ không tạo được key.
- Người dùng chủ động bấm Tạo key. Key `TEO-...` được sinh bằng `crypto.getRandomValues`, lưu hash phía server, chỉ trả rõ một lần và hết hạn sau 5 phút.
- Copy thành công sẽ ẩn key khỏi màn hình; key vẫn được lưu dạng hash tối đa 5 phút để người dùng dán vào Admin. Sau khi redeem thành công, bản ghi key bị xóa.
- Key gắn với tenant và hash phiên đăng nhập đã khởi tạo lượt. Người khác/Studio khác không dùng được key. Có rate limit, state một lần, key một lần và cập nhật D1 có điều kiện để chống double redeem.
- Mỗi key hợp lệ cộng 4 ngày (giữ tổng phần thưởng cũ: 2 lượt × 2 ngày) và mở Admin Free. Khi thời hạn hết, cổng vượt link xuất hiện lại.

## Cấu hình
- Cần `BUMX_API_KEY` (Secret) và `BUMX_API_URL` (Variable; mặc định `https://linkfree.click/s/link/shorten`).
- `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1` chỉ bật sau khi BumX xác nhận bằng văn bản rằng traffic đổi lấy ngày thuê được phép. Không còn yêu cầu `FREE_BYPASS_VERIFY_URL` hoặc `FREE_BYPASS_API_KEY`.
- Không dùng Link4M cho traffic khuyến khích khi chưa được họ cho phép.

## Giới hạn bảo mật cần hiểu
BumX trong cấu hình hiện tại chỉ cung cấp endpoint tạo link. TeoStudio không nhận được tín hiệu có chữ ký từ BumX để chứng minh người dùng đã xem/hoàn thành quảng cáo. Trang nhận key chỉ xác nhận người dùng quay lại với state một lần do TeoStudio tạo; nó không phải xác minh quảng cáo từ nhà cung cấp. Người có thể trích xuất URL callback sau khi được chuyển hướng có thể thử mở callback trực tiếp; state một lần, rate limit và ràng buộc phiên/tenant giảm khả năng lạm dụng nhưng không thay thế callback xác thực của BumX. Muốn chống bypass ở mức mạnh cần provider webhook/callback có chữ ký hoặc API status chính thức.

## Kiểm tra
Chạy `bash scripts/check-build.sh`. Kết quả local/static không chứng minh API BumX, Cloudflare D1 Production, điều khoản traffic, hay trải nghiệm trình duyệt thật. Chưa deploy Production.
