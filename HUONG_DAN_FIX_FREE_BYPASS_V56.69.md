# TeoStudio V56.69 — Hướng dẫn xử lý Admin Free / TENANT_REQUIRED

## Lưu ý quan trọng

Bản V56.69 được xây dựng trên mã nguồn V56.68 bạn gửi, bổ sung sửa lỗi cấu hình Free bypass và báo cáo Seller. Bộ kiểm tra cục bộ PASS, nhưng **chưa có API xác minh nhiệm vụ thật của BumX và chưa deploy/test trên Cloudflare production**. Vì vậy không thể khẳng định bật Free bypass chỉ bằng cách thêm Secret.

Worker chỉ cộng lượt khi API xác minh phía nhà cung cấp trả về `success: true`, `completed: true` và trả lại đúng `state`. Không được tự tạo endpoint/key giả, vì khi đó có thể mở Admin Free mà không hoàn thành nhiệm vụ.

## 1. Lỗi code đã sửa trong V56.69

V56.68 có lỗi trong `bypassProviderConfig()`: `startFreeBypass()`, API test và `/api/rental/config` đọc `rewardTrafficApproved`, nhưng helper không trả thuộc tính này. Vì vậy hệ thống luôn xem chính sách traffic có thưởng là chưa được duyệt, kể cả khi đã đặt Variable đúng. V56.69 đã thêm boolean này vào object trả về và có kiểm tra hồi quy.

## 2. Cấu hình Cloudflare

Cloudflare Dashboard → Workers & Pages → `teo-studio` → Settings → Variables and Secrets → Production.

Các giá trị cần có:

- `BUMX_API_KEY` — Secret/API key tạo link rút gọn BumX.
- `BUMX_API_URL` — URL API tạo link đúng theo tài liệu BumX (nếu không đặt, Worker dùng URL mặc định trong mã nguồn).
- `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED` — Variable `1` **chỉ sau khi BumX xác nhận bằng văn bản rằng traffic có thưởng/đổi ngày thuê được phép**.
- `FREE_BYPASS_VERIFY_URL` — HTTPS endpoint xác minh hoàn thành nhiệm vụ do BumX cung cấp.
- `FREE_BYPASS_API_KEY` — Secret xác thực endpoint xác minh.

Không dùng API rút gọn link làm API xác minh. Nếu BumX không cung cấp endpoint xác minh phù hợp, hãy hỏi họ về webhook/callback hoặc API kiểm tra trạng thái task. Không bật cờ approval nếu chưa được nhà cung cấp cho phép. Link4M không được dùng cho luồng đổi lượt nhận ngày thuê theo cấu hình hiện tại.

## 3. API xác minh hoàn thành phải có hợp đồng tương thích

`FREE_BYPASS_VERIFY_URL` là endpoint HTTPS phía máy chủ do nhà cung cấp/đối tác xác minh cấp. Worker gửi `POST` JSON:

```json
{ "state": "<state nhận được>", "step": 1, "attemptId": "<attempt id>" }
```

Header xác thực: `Authorization: Bearer <FREE_BYPASS_API_KEY>`. Endpoint phải trả JSON xác nhận đúng state:

```json
{ "success": true, "completed": true, "state": "<same state>" }
```

Nếu không có API/webhook xác minh trạng thái task, không thể bật ghi nhận tự động chỉ từ phản hồi tạo link hoặc từ việc người dùng quay về website. Không tạo endpoint giả trả `completed: true`.

## 4. Vì sao gặp `TENANT_REQUIRED`

`TENANT_REQUIRED` là lỗi xác thực phiên Admin thuê: request tới API Admin không mang theo phiên tenant hợp lệ. Đây không phải lỗi xác minh link.

Thử theo thứ tự:

1. Mở `https://teostudio.top/tenant-admin.html` trong cùng trình duyệt, cùng tab/profile đang dùng để thuê web.
2. Đăng nhập tài khoản thuê web trước; không mở link Admin Free trong tab ẩn danh hoặc trình duyệt khác.
3. Nếu đang dùng nhiều tài khoản, đăng xuất rồi đăng nhập đúng tài khoản sở hữu tenant.
4. Xóa dữ liệu trang của `teostudio.top` nếu phiên cũ bị lỗi, sau đó đăng nhập lại. Việc này sẽ làm mất phiên đăng nhập hiện tại.
5. Nếu API vẫn trả `TENANT_REQUIRED`, mở DevTools/Network (hoặc gửi ảnh màn hình lỗi) và kiểm tra request đầu tiên trả 401. Không gửi cookie, token hoặc Secret cho người khác.

## 5. Chẩn đoán nút kiểm tra API

Trong Admin thuê, chạy chức năng kiểm tra API vượt link nếu giao diện có nút này. Worker trả về `missing` để chỉ rõ cấu hình thiếu:

- `FREE_BYPASS_SHORTENER_NOT_CONFIGURED`: thiếu API key BumX.
- `FREE_BYPASS_PROVIDER_POLICY_NOT_CONFIRMED`: chưa xác nhận chính sách traffic có thưởng.
- `BYPASS_VERIFICATION_NOT_CONFIGURED`: thiếu URL/key xác minh.
- `FREE_BYPASS_SHORTENER_FAILED`: API rút gọn không phản hồi theo định dạng Worker hỗ trợ; xem log Worker và đối chiếu tài liệu BumX.
- `BYPASS_TASK_NOT_CONFIRMED`: provider chưa xác nhận hoàn thành; chưa cộng lượt.

Không tự đổi response thành thành công để bỏ qua kiểm tra.

## 6. Deploy an toàn

1. Sao lưu D1 trước khi deploy.
2. Trong Cloudflare Workers Builds, dùng Root directory `cloudflare`, Build command `None`, Deploy command `npx wrangler deploy` theo cấu hình repo.
3. Giữ nguyên các Secrets hiện có; chỉ thêm/cập nhật biến được nêu ở trên khi đã có thông tin chính thức từ BumX.
4. Deploy, mở build log và kiểm tra `/api/health`.
5. Đăng nhập tenant, kiểm tra API config, rồi thử một lượt Free thật. Xác nhận lượt chỉ tăng sau khi provider trả kết quả xác minh hợp lệ.

## 7. Kiểm tra cục bộ

Tại thư mục gốc repo:

```bash
bash scripts/check-build.sh
```

Kết quả PASS chỉ xác nhận cú pháp và các kiểm tra cục bộ/static; không chứng minh API provider, Secrets, D1 production hay giao diện điện thoại hoạt động thật.
