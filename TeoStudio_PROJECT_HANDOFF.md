# TeoStudio — Project Handoff / Trạng thái mới nhất
Cập nhật: 24/10/2026 (giờ Việt Nam)

## Nguồn mã hiện có
- Gói mới nhất vừa tạo: `TeoStudio-V56.34-Graphics-Tiers-Motion-Library.zip`, xây trên source V56.33 đã có trong cuộc trò chuyện.
- V56.34 chỉnh fingerprint Worker/config và query cache lên `56.34`; gồm 3 mức Lite/Balanced/Premium, animation tiết chế, skeleton loading, View Transitions có fallback, scroll reveal, Premium spotlight/tilt desktop.
- Hướng dẫn trong gói: `DEPLOY_V56.34_MOBILE.md`; báo cáo: `TEST_REPORT_V56.34.md`.
- Đã chạy `scripts/check-build.sh`: cú pháp Worker/JS và các static checks đạt. CSS parser không có lỗi cú pháp.
- Chưa deploy production. Thử mở preview bằng Chromium bị runtime chặn (`ERR_BLOCKED_BY_ADMINISTRATOR`), nên chưa test tương tác trên browser/điện thoại thật và không cam kết 60–120 FPS.
- V56.33 là source trước đó, nhưng Worker trong gói có fingerprint V56.32; V56.34 đã sửa fingerprint để đồng bộ.

## Ưu tiên tiếp theo (chưa xác minh xong)
1. Sau khi deploy V56.34, xác minh `/api/health` trả `v56.34-graphics-tiers-motion-library`, kiểm tra trên Android: đổi Lite/Balanced/Premium, cuộn danh sách, chuyển trang, mở Teo Linh và bật bàn phím. Ghi nhận nếu còn nhấp nháy/jank.
2. Điều tra lỗi đơn mua: giao dịch ở Share File chính của Téo không được lộ sang tenant khác. Cần test cách ly backend bằng tenant/scope ID chuẩn; không coi là xong chỉ vì frontend ẩn phần feed.
3. Điều tra `TENANT_REQUIRED` khi tenant admin đăng/sửa file và các lỗi còn lại ở Admin Free/Share File.
4. Teo Linh: làm kiến thức website toàn diện hơn; hiển thị link thật/đúng trang; cho gửi ảnh trong chat và ảnh báo lỗi; có lịch sử chat/cuộc chat mới. Các thao tác thay đổi dữ liệu phải có bước xem trước/xác nhận và backend kiểm tra quyền.
5. Tài khoản OpenRouter từng bị dán API key trực tiếp trong chat; cần thu hồi key đã lộ và tạo key mới. Chưa xác nhận Worker đang dùng OpenRouter thành công; đừng xóa Gemini hay thay Secrets cho đến khi code đã được xác minh.

## Nguyên tắc làm việc
- Mỗi lượt sửa bắt đầu từ ZIP mới nhất đã xác nhận, kiểm tra fingerprint và cache keys. Không mặc định source upload bằng production.
- Không tuyên bố đã deploy, test phone, hay fix production nếu chưa có bằng chứng.
- Tách từng lỗi để tránh lan sang thanh toán, ví, đăng nhập, D1 hoặc tenant permissions.
- Không yêu cầu API key, token, mật khẩu hoặc OTP.
- Chỉ đánh dấu hoàn tất khi có bằng chứng kiểm tra; sau đó thu gọn lịch sử thành một dòng kết quả.

## Hoàn tất trong V56.34 (local/static only)
- [x] Mở rộng Graphics Tiers thành Lite / Balanced / Premium.
- [x] Static background; pause animations when tab hidden; honor reduced motion.
- [x] Targeted IntersectionObserver / MutationObserver (không quét toàn document liên tục).
- [x] View Transitions progressive enhancement và instant fallback.
- [x] Static-size skeletons cho main product grid và tenant Share File.
- [x] Cập nhật cache keys, Worker/config fingerprint, build script checks.
- [ ] Production/mobile animation quality: chờ kiểm tra thật.
- [ ] Tenant purchase feed isolation / TENANT_REQUIRED / Admin Free: vẫn mở.
