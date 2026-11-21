# Deploy TeoStudio V56.65

## 1. Sao lưu
1. Sao lưu D1 database và export Worker hiện tại.
2. Giữ ZIP V56.64 để rollback.
3. Không xoá `tenant_rental_orders`, `tenant_accounts`, `tenant_sessions` hoặc `free_bypass_attempts`.

## 2. Secrets / Variables cho Free bypass
Các biến rút gọn link hiện tại vẫn dùng:
- **Free gate có thưởng chỉ dùng BumX**: `BUMX_API_KEY` (Secret) và tùy chọn `BUMX_API_URL` (Variable; endpoint hiện tại trong Worker). Link4M không được dùng trong luồng này vì điều khoản công khai của Link4M cấm traffic incentivized.
- `LINK4M_API_KEY` (Secret) có thể giữ cho các link không có thưởng khác; nó không được gọi từ Free gate.

Để **mở khóa Free an toàn**, cần thêm:
- `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1` (Variable): chỉ bật sau khi có xác nhận bằng văn bản từ BumX cho phép luồng truy cập có thưởng/đổi ngày thuê.
- `FREE_BYPASS_VERIFY_URL` (Variable): endpoint HTTPS thật của nhà cung cấp có khả năng xác minh hoàn thành nhiệm vụ từ phía máy chủ.
- `FREE_BYPASS_API_KEY` (Secret): Bearer key dùng để gọi endpoint xác minh.

### Contract bắt buộc của endpoint xác minh
Worker gọi POST JSON:
```json
{
  "state": "<state nhận từ callback>",
  "step": 1,
  "attemptId": "<mã lần vượt>"
}
```
Header `Authorization: Bearer <FREE_BYPASS_API_KEY>`.
Chỉ khi nhà cung cấp **đã tự xác minh người dùng hoàn thành nhiệm vụ** mới được trả:
```json
{
  "success": true,
  "completed": true,
  "state": "<đúng state được gửi lên>"
}
```

Không dùng URL rút gọn Link4M/BumX làm `FREE_BYPASS_VERIFY_URL`. API tạo short URL chỉ cho biết link đã được tạo; nó không chứng minh người dùng đã hoàn thành quảng cáo. Nếu nhà cung cấp chưa có endpoint/callback xác minh phù hợp hoặc chưa xác nhận cho traffic có thưởng, Free gate sẽ chưa mở khóa; đây là hành vi an toàn chủ ý. Link4M công khai điều kiện 18+ và cấm traffic incentivized; không dùng cho luồng đổi lượt thuê Free.

## 3. Kiểm tra API
1. Deploy Worker mới.
2. Vào Master Admin → Thuê Share File → bấm **Kiểm tra kết nối vượt link** (hoặc đăng nhập tài khoản Free để thấy nút này).
3. Phần kiểm tra gọi thử API rút gọn thật và báo riêng trạng thái shortener với `verificationConfigured`.
4. Chỉ thử luồng Free 2 bước khi cả hai phần được cấu hình và endpoint xác minh đã được nhà cung cấp kiểm tra đúng contract.

## 4. Deploy
```bash
npx wrangler deploy
```
Sau deploy, mở `/admin`, vào Thuê Share File và kiểm tra phần **Thống kê thuê Studio theo ngày**. Chọn tháng cần xem; dữ liệu tính theo `Asia/Ho_Chi_Minh`.

## 5. Mật khẩu
- Mật khẩu lưu dạng hash, không thể giải mã để xem mật khẩu cũ.
- Email chỉ hiện đầy đủ khi nhấn giữ trong trang Master Admin.
- Với tenant đã tồn tại, dùng **Đặt lại MK** để cấp mật khẩu mới. Các phiên tenant cũ sẽ bị thu hồi.
- Mật khẩu mới dùng PBKDF2 với salt ngẫu nhiên; mật khẩu cũ SHA-256/plaintext được nâng cấp khi đăng nhập hợp lệ.

## 6. Lựa chọn nền tảng quảng cáo hợp lệ
Google Ad Manager có định dạng Rewarded Ads cho web, yêu cầu người dùng tự chọn tham gia và hỗ trợ server-side verification. Đây là hướng phù hợp hơn cho quảng cáo đổi lấy quyền lợi, nhưng cần tài khoản Ad Manager, Network Code, Ad Unit Path và cấu hình SSV riêng. Bản V56.65 chưa tích hợp GPT/SSV Google thật vì chưa có thông tin inventory và callback của tài khoản.

## 7. Nền tảng quảng cáo
Tham khảo `ADS_PLATFORM_INTEGRATION_V56.65.md`. Google Ad Manager Rewarded Ads for web là hướng khuyến nghị cho quảng cáo có thưởng và API báo cáo; cần Network Code, Ad Unit Path, cấu hình SSV và OAuth. Chưa tích hợp vào Production trong gói này vì thiếu thông tin tài khoản/inventory.

## 8. Bộ concept Share
Mở `UI_PREVIEW_FOR_APPROVAL/index.html` để xem bốn mẫu. Thư mục concept nằm ngoài `frontend/`, không được nối vào website Production. Cần chọn và duyệt mẫu riêng trước khi tích hợp.
