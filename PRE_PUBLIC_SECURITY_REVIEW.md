# TeoStudio V57.0 — Pre-public review status

Ngày rà soát source: 04/11/2026. Đây là đánh giá tĩnh trên source ZIP, không phải chứng nhận an toàn hoặc ý kiến pháp lý.

## Đã thực hiện trong source
- [x] Đăng ký và lần đăng nhập đầu của tài khoản cũ chưa có bản ghi đều bắt buộc `termsAccepted`, `privacyAcknowledged` và phiên bản tài liệu đúng; ghi nhận bằng chứng vào `legal_acceptances` trong D1.
- [x] Có trang riêng: Điều khoản, Thông báo quyền riêng tư, Cookie, Hoàn tiền.
- [x] Có form gửi yêu cầu quyền dữ liệu; API người dùng yêu cầu xác thực tài khoản, rate limit; Admin có API và màn hình cập nhật trạng thái/phản hồi.
- [x] Có liên kết chính sách chung, thông báo lưu trữ thiết yếu, hỗ trợ focus-visible và `prefers-reduced-motion`.
- [x] Header bảo mật, CORS cố định origin và các guardrail upload/rate-limit hiện hữu vẫn giữ trong Worker.
- [x] Free bypass vẫn đóng nếu thiếu xác minh nhà cung cấp; không tự cộng ngày khi chỉ quay lại.

## Rà soát chưa đạt / cần hoàn thiện trước public
- [ ] **Thông tin pháp lý chủ quản**: điền tên pháp lý/chủ thể, địa chỉ, email tiếp nhận, MST/đăng ký nếu thuộc diện. Trang policy đang hiển thị placeholder để không tạo danh tính giả.
- [ ] **Phân loại mô hình**: xác định TeoStudio chỉ là SaaS/lưu trữ hay thuộc định nghĩa nền tảng TMĐT trung gian theo Luật 122/2025/QH15 và Nghị định 248/2026/NĐ-CP; rà soát thủ tục thông báo/đăng ký, quy chế hoạt động và trách nhiệm bảo vệ người mua/người bán.
- [ ] Nếu thuộc nền tảng TMĐT trung gian/mạng xã hội có hoạt động TMĐT: đánh giá quy trình xác thực điện tử người bán trước mốc 01/01/2027 theo thông báo của Cục TMĐT. Source chưa tích hợp xác thực e-ID.
- [ ] **Hồ sơ dữ liệu cá nhân**: xác định controller/processor, mục đích và căn cứ xử lý từng trường, retention schedule, hợp đồng xử lý dữ liệu, chuyển dữ liệu xuyên biên giới, quy trình thông báo vi phạm và hồ sơ đánh giá tác động theo phạm vi luật. Các trang policy hiện là bản dự thảo vận hành, chưa phải hồ sơ pháp lý đầy đủ.
- [ ] **Mật khẩu**: source hiện dùng PBKDF2 WebCrypto 100.000 vòng (theo ràng buộc runtime trong code); chưa đạt yêu cầu triển khai Argon2id/bcrypt như checklist video. Cần thiết kế chuyển đổi hash an toàn, kiểm thử trên Cloudflare Workers và nâng cấp dần khi đăng nhập; không thay thuật toán bằng một chỉnh sửa giả.
- [ ] **Session**: buyer token hiện lưu localStorage/sessionStorage, chưa phải cookie HttpOnly/Secure/SameSite. Cần thiết kế migration cookie + CSRF + rotation/expiry, kiểm thử mọi flow trước khi bật.
- [ ] **Backup/restore**: source chưa chứng minh được backup D1 tự động, immutable/offsite, lịch retention và thử restore. Cấu hình trên Cloudflare dashboard cần được xác minh.
- [ ] **CORS/headers**: source có allow-origin hẹp và CSP/security headers; cần kiểm tra domain thực, subdomain tenant/custom domain và các embed provider ngoài production.
- [ ] **Upload**: các luồng đã có MIME/size validation; vẫn cần kiểm tra malware scanning, file serving headers, private object authorization và quota ở production.
- [ ] **Admin quyền dữ liệu**: yêu cầu xóa được tiếp nhận và đánh dấu; việc xóa/ẩn danh phải thực hiện thủ công sau khi xác định dữ liệu nào phải bảo lưu. Không có nút xóa tự động toàn bộ để tránh xóa nhầm sổ giao dịch.
- [ ] **BumX**: chưa có xác nhận cho rewarded traffic và chưa có verify URL/key thật. Không bật `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1`; Link4M không được dùng làm rewarded-flow nếu nhà cung cấp không cho phép.
- [ ] **Kiểm thử production**: chưa deploy, chưa test D1 schema migration thực tế, email, SePay callback, tenant isolation live, quyền riêng tư, UI Android/iOS và pen-test độc lập.

## Kết luận
V57.0 là bản cập nhật source có trang chính sách, cơ chế lưu đồng ý phía máy chủ và quy trình tiếp nhận quyền dữ liệu, cộng lớp thiết kế/truy cập dễ dùng hơn. Không được ghi “đã tuân thủ đầy đủ” hoặc “đã audit an toàn” cho đến khi hoàn thành các mục chưa đạt, điền thông tin pháp lý thật và kiểm thử production.
