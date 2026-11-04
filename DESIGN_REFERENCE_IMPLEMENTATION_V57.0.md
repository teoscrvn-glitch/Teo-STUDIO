# Đối chiếu 13 ảnh và video — TeoStudio V57.0

Tài liệu ghi nhận việc chuyển checklist tham chiếu thành thay đổi trong source. Đây không phải chứng nhận an toàn hoặc pháp lý.

## Từ 13 ảnh checklist

### Pháp lý và quyền riêng tư
- [x] Trang Điều khoản sử dụng riêng.
- [x] Thông báo quyền riêng tư riêng, mô tả nhóm dữ liệu, mục đích, bên xử lý/nhà cung cấp và quyền người dùng.
- [x] Chính sách Cookie riêng, phân biệt cookie với localStorage/sessionStorage.
- [x] Chính sách hoàn tiền riêng, quy trình gửi bằng chứng và nguyên tắc hoàn về phương thức gốc.
- [x] Hai checkbox riêng ở đăng ký: đồng ý Điều khoản và xác nhận đã đọc Thông báo quyền riêng tư.
- [x] Worker bắt buộc phiên bản tài liệu và ghi bằng chứng vào D1; tài khoản cũ chưa có chứng cứ phải xác nhận ở lần đăng nhập kế tiếp.
- [x] Trang/API yêu cầu truy cập, chỉnh sửa, xóa, hạn chế, rút lại sự đồng ý hoặc khiếu nại dữ liệu; Admin có màn hình tiếp nhận.
- [ ] Thông tin chủ quản/pháp nhân, địa chỉ, email, MST/đăng ký: cần người vận hành cung cấp thông tin thật.
- [ ] Phân loại vai trò pháp lý và thủ tục TMĐT: cần rà soát mô hình kinh doanh đang vận hành.

### Nội dung và quyền sở hữu
- [x] Điều khoản cấm nội dung bất hợp pháp, mã độc, lừa đảo, spam, xâm phạm bản quyền/quyền riêng tư và thao túng số liệu.
- [x] Nêu yêu cầu người đăng có quyền phân phối nội dung; có quy trình báo cáo/ẩn nội dung và khiếu nại.
- [x] Không đưa claim “số 1/tốt nhất”, đánh giá hay testimonial giả vào policy.
- [ ] Quy trình xử lý thông báo vi phạm bản quyền cần được kiểm tra vận hành và kênh tiếp nhận thực tế.

### Trải nghiệm và tiếp cận
- [x] Thêm focus-visible, skip-to-main, tương phản/nhấn màu có giới hạn và trạng thái focus rõ.
- [x] Tôn trọng `prefers-reduced-motion`; hiệu ứng xuất hiện khi cuộn có kiểm soát.
- [x] Footer chứa liên kết 4 chính sách và trang yêu cầu dữ liệu.
- [~] Alt text đã kiểm tra các ảnh tĩnh chính; nội dung ảnh được render động và alt phù hợp ngữ cảnh vẫn cần QA trên từng trang.
- [~] Nhãn form/keyboard được cải thiện ở phần mới; chưa có audit WCAG toàn bộ thành phần động.

### Bảo mật 20 điểm
- [x] Giữ rate limits, Turnstile và kiểm tra dữ liệu tại Worker ở các luồng đã có.
- [x] Giữ CORS allow-origin cố định, CSP, HSTS, nosniff, frame/referrer/permissions headers hiện có.
- [x] Giữ phân quyền tenant/admin và test cách ly dữ liệu tenant hiện tại.
- [x] Giữ kiểm tra loại/dung lượng upload ở các luồng đã có; SQL các truy vấn đã rà soát dùng bind parameter.
- [x] Có thời hạn session phía server và giới hạn thao tác nhạy cảm ở backend.
- [ ] Argon2id/bcrypt chưa triển khai; hiện password hash là PBKDF2 WebCrypto 100.000 vòng theo giới hạn runtime trong code.
- [ ] Buyer bearer session vẫn lưu localStorage/sessionStorage; chưa chuyển sang cookie HttpOnly/Secure/SameSite + CSRF.
- [ ] Backup/restore D1 tự động chưa được cấu hình và kiểm tra trên Cloudflare production.
- [ ] Seller electronic identity verification chưa tích hợp; cần xác định nghĩa vụ trước 01/01/2027 nếu là nền tảng thuộc phạm vi.
- [ ] CORS/custom domains, upload serving, edge limits, CSP và secrets cần kiểm thử từ Cloudflare Dashboard/production.

## Từ video giao diện
- [x] Hệ màu tối violet, điểm sáng cyan/magenta; gradient chữ dùng cho tiêu đề cần nhấn, tránh phủ mọi dòng.
- [x] Thứ bậc heading, nhãn eyebrow/badge và khối nội dung rõ ràng hơn.
- [x] Card/border/nút được làm mới có tiết chế, giảm cảm giác template mặc định.
- [x] Motion chỉ dùng để dẫn mắt, hỗ trợ giảm chuyển động khi hệ điều hành yêu cầu.
- [x] Khoảng cách và độ đọc trên màn nhỏ được đặt bằng kích thước linh hoạt.
- [ ] Visual QA trực tiếp trên nhiều màn Android/iOS vẫn cần thực hiện sau deploy.

## Ranh giới kết quả
Source build/static tests không chứng minh được cấu hình Cloudflare, độ an toàn production, khả năng khôi phục backup, nghĩa vụ pháp lý theo mô hình kinh doanh hoặc trải nghiệm trên mọi thiết bị. Các mục [ ] là chặn public hoặc cần xác minh bên ngoài source.
