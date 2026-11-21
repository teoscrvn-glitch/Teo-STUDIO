# TeoStudio V57.0 — Pre-public Design, Legal & Security

## Cập nhật chính
- Xây dựng hệ thống giao diện nhất quán theo video: nền tối violet, gradient tiêu đề có kiểm soát, accent cyan/magenta, card/border tinh tế, hover có chủ đích và giảm chuyển động khi người dùng bật `prefers-reduced-motion`.
- Bổ sung focus-visible, skip-to-content, thông báo lưu trữ trình duyệt thiết yếu và liên kết pháp lý ở footer.
- Tạo 4 trang độc lập: Điều khoản sử dụng, Thông báo quyền riêng tư, Chính sách Cookie, Chính sách hoàn tiền. Nội dung không tự nhận TeoStudio đã là doanh nghiệp/pháp nhân hay đã đăng ký TMĐT.
- Form đăng ký và lần đăng nhập đầu tiên của tài khoản cũ chưa có bằng chứng đồng ý yêu cầu 2 checkbox riêng: đồng ý Điều khoản và xác nhận đã đọc Thông báo quyền riêng tư; Worker xác minh chính xác phiên bản tài liệu.
- Lưu bằng chứng đồng ý (account/document/version/time/method) tại bảng `legal_acceptances` trong D1; chặn API đăng ký nếu client bỏ qua checkbox hoặc gửi sai version.
- Thêm trang `/privacy-request.html`; người dùng đã đăng nhập có thể yêu cầu truy cập, chỉnh sửa, xóa, hạn chế, rút lại sự đồng ý hoặc khiếu nại dữ liệu.
- Thêm API Admin và bảng quản trị để tiếp nhận, phân loại, cập nhật trạng thái/ghi chú yêu cầu quyền dữ liệu. Không tự xóa toàn bộ bản ghi tài chính khi nhận yêu cầu; admin phải kiểm tra nghĩa vụ lưu trữ.
- Giữ Free bypass ở trạng thái fail-closed nếu chưa có xác nhận rewarded traffic và API verify chính thức từ BumX.

## Không thay đổi / không tuyên bố đã hoàn tất
- Chưa chuyển password hash sang Argon2id/bcrypt; source vẫn dùng PBKDF2 WebCrypto 100.000 vòng do giới hạn runtime được ghi trong code.
- Chưa chuyển buyer session từ bearer token localStorage sang HttpOnly/Secure/SameSite cookie; cần migration CSRF và kiểm thử riêng.
- Chưa thiết lập/kiểm chứng backup D1/R2 và khôi phục thử trên Cloudflare production.
- Chưa tích hợp xác thực điện tử người bán; cần đánh giá nghĩa vụ theo mô hình nền tảng và mốc 01/01/2027 nếu thuộc phạm vi.
- Chưa điền thông tin pháp lý chủ quản vì chưa được cung cấp; trang chính sách chủ động hiển thị trường cần bổ sung.

## Kiểm thử
- `bash scripts/check-build.sh`: 18/18 nhóm kiểm tra source/helper/static passed.
- `node scripts/check-inline-js.mjs`: 6 inline scripts checked, 0 failures.
- `node scripts/check-local-refs.mjs`: 24 HTML/CSS files passed local-reference checks.
- Chưa deploy Worker, chưa thực thi D1 trên tài khoản Cloudflare thật, chưa test email/SePay/Turnstile/Telegram/BumX, chưa pen-test hoặc kiểm tra Android/iOS thực tế.
