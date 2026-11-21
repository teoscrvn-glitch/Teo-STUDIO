# TeoStudio V56.68 — Account, Analytics & Manual Card Withdrawal

Tài liệu này thay thế hướng dẫn triển khai V56.67 cho bản mã nguồn V56.68.

## 1. Điểm thay đổi

- Rút thẻ cào cho Seller/Studio là **quy trình duyệt thủ công bởi Admin chính**. Worker không gọi API mua thẻ tự động.
- Khi gửi yêu cầu, hệ thống tạm giữ 105% mệnh giá trong ledger. Admin có thể duyệt, nhập mã thẻ + serial sau khi tự gửi thẻ cho khách, hoặc từ chối để hoàn lại khoản tạm giữ.
- Mã thẻ và serial chỉ lưu dưới dạng AES-GCM ciphertext. Không ghi plaintext vào D1.
- Thêm trang tài khoản riêng `/account.html`; tài khoản dùng chung giữa Share, Seller, Studio, bình luận và AI.
- Phiên buyer được gia hạn trượt tối đa 30 ngày khi hoạt động. Browser device ID được lưu ở localStorage và đối chiếu với session. IP mới nhất được ghi nhận vào phiên/thiết bị; IP thay đổi không tự làm đăng xuất nếu cùng browser device ID.
- Thêm tùy chọn cho phép AI tham khảo ngữ cảnh tài khoản. Mặc định OFF; bật chỉ cho phép ngữ cảnh đọc để cá nhân hóa, không cấp quyền Admin hoặc giao dịch.
- Bình luận công khai/kiểm duyệt hiển thị avatar; Admin chính và Admin Studio có nút chặn IP/email.
- Dashboard Studio có phân tích theo file: view, click tải/vượt link, đơn đã trả, doanh thu và tỷ lệ mua/view.
- Thêm khu vực Seller và tạo/thuê website gần cuối trang Share.

## 2. Rút thẻ cào thủ công

### Luồng người dùng

1. Seller hoặc Studio chọn nhà mạng và mệnh giá.
2. Worker kiểm tra số dư, idempotency và giới hạn yêu cầu; sau đó tạo trạng thái `pending` và ghi ledger trừ/tạm giữ `face value × 105%`.
3. Yêu cầu xuất hiện trong Admin chính → **Duyệt rút thẻ**.
4. Admin có thể duyệt yêu cầu. Sau khi tự chuyển mã thẻ và serial cho khách qua kênh đã chọn, Admin nhập mã + serial vào panel và bấm **Xác nhận đã gửi thẻ**.
5. Hệ thống mã hóa AES-GCM, lưu ciphertext và chuyển trạng thái `paid`. Người dùng thấy mã/serial trong lịch sử rút thẻ.
6. Nếu từ chối, Admin nhập lý do. Cập nhật `rejected` và khoản hoàn ledger chạy trong cùng một D1 batch; khóa duy nhất của ledger ngăn hoàn tiền lặp.

**Không có tự động mua thẻ. Không cần `THECAOSIEUTOC_TOKEN` cho rút thẻ.** Admin phải thực sự gửi mã thẻ trước khi xác nhận `paid`.

### Secret cần thiết

- `CARD_DATA_ENCRYPTION_KEY`: Secret bắt buộc để mã hóa mã thẻ/serial. Hãy đặt chuỗi bí mật ngẫu nhiên dài ít nhất 32 ký tự. Không commit Secret vào GitHub và không gửi khóa trong chat.
- Rút thẻ thủ công không cần API purchase token.
- Nếu bật **nạp thẻ cào**, vẫn cần `THECAOSIEUTOC_PARTNER_ID` và `THECAOSIEUTOC_PARTNER_KEY` cùng callback đã đăng ký với nhà cung cấp. Callback nạp thẻ được nhận tại `/api/webhook/card-provider`.

Nếu thiếu `CARD_DATA_ENCRYPTION_KEY`, hệ thống sẽ không cho đánh dấu đã gửi thẻ vì không thể lưu mã thẻ/serial một cách an toàn.

## 3. Bảng phí nạp thẻ

- Mức Vinaphone đã nhập theo ảnh người dùng cung cấp, phân biệt nhóm Đối tác và Thành viên.
- Những nhà mạng/mệnh giá chưa có dữ liệu cần được nhập trong Admin → Bảng phí thẻ và chỉ bật sau khi đối chiếu đúng bảng phí đối tác.
- Không lấy phí của một nhà mạng áp cho nhà mạng khác.
- Số tiền nhận được làm tròn xuống bội số 1.000đ theo logic hiện có.

## 4. Phiên đăng nhập và quyền riêng tư

- Tài khoản buyer được dùng chung ở Share, Seller, Studio, bình luận và AI.
- Browser device ID được tạo cục bộ và gửi qua `x-teo-device-id`; token xác thực vẫn là bearer token bí mật. Không dùng IP làm mật khẩu.
- IP và User-Agent gần nhất được lưu để theo dõi bảo mật. Nếu người dùng cùng browser/device nhưng IP mạng di động đổi, phiên vẫn có thể tiếp tục.
- Đăng nhập ở browser/device khác cần đăng nhập thông thường; phiên có thể gửi thông báo đăng nhập thiết bị mới.
- Đặt lại mật khẩu sẽ thu hồi các phiên đang có.
- Tùy chọn AI cá nhân hóa mặc định tắt. Khi bật, AI chỉ nhận thêm thông tin tài khoản/lịch sử ở dạng ngữ cảnh tư vấn; không được cấp quyền thay đổi tài khoản, duyệt, thanh toán, chuyển/rút tiền.

## 5. Bảo vệ và chặn IP/email

- Các thao tác chặn ở Admin chính áp dụng toàn website; thao tác từ Admin Studio chỉ áp dụng trong Studio đó.
- Chặn email ngăn tài khoản đó đăng nhập/đăng ký và thực hiện các thao tác cần tài khoản. Chặn IP áp dụng theo IP nguồn được Worker xác định.
- Các nút chặn từ bình luận chỉ tạo mục chặn sau khi Admin xác nhận.
- Worker có các lớp giới hạn API/auth/finance/bypass, giới hạn kích thước body và kiểm soát request nguồn gốc. Các giới hạn Worker không thay thế Cloudflare WAF/Rate Limiting ở zone.

### Khuyến nghị Cloudflare Zone

Trong Cloudflare Dashboard → Security:

1. Bật Managed Rules (Cloudflare Managed Ruleset) ở mức phù hợp.
2. Bật DDoS protection mặc định của zone; xem Security Events khi có đợt tấn công.
3. Tạo Rate Limiting Rules cho đăng nhập/đăng ký, API tài chính, bình luận và endpoint bypass. Bắt đầu với ngưỡng thấp vừa phải, theo dõi false positive rồi điều chỉnh.
4. Không tạo rule chặn mọi request `POST` chung chung vì sẽ làm hỏng checkout, upload và callback SePay/card-provider.
5. Có thể đưa callback thanh toán vào rule riêng; chỉ bỏ qua các rule challenge phù hợp khi đã xác thực IP/chữ ký từ nhà cung cấp. Không tắt toàn bộ WAF cho callback.

Rate limit bindings trong `wrangler.toml` cần namespace ID duy nhất trong tài khoản Cloudflare. Nếu tài khoản đã dùng các namespace ID này ở Worker khác, hãy đổi thành ID chưa sử dụng trước deploy.

## 6. Deploy

Repository sử dụng `cloudflare/worker.js` làm Worker entry point và `frontend` làm static assets.

Trong Cloudflare Workers Builds (theo cấu hình repo hiện tại):

- Root directory: `cloudflare`
- Build command: để trống / `None`
- Deploy command: `npx wrangler deploy`
- Build variables: chỉ đặt biến không bí mật tại mục Variables; Secrets quản lý riêng trong Cloudflare.

Trước khi deploy:

1. Kiểm tra D1 database binding `DB` trong `cloudflare/wrangler.toml` có đúng database sản xuất.
2. Kiểm tra các rate-limit namespace ID không bị trùng trong tài khoản.
3. Đặt `CARD_DATA_ENCRYPTION_KEY` trong Worker → Settings → Variables and Secrets → Production → Secrets.
4. Nếu có nạp thẻ, đặt Partner ID/Key dưới dạng Secret và đăng ký callback đúng URL.
5. Giữ nguyên các Secret đang sử dụng cho Admin, Turnstile, SePay, email, AI, Telegram và dịch vụ Free bypass. Không xóa rồi tạo lại Secret nếu chưa cần.
6. Push nhánh deploy để Cloudflare build và deploy; kiểm tra build log và `/api/health` sau deploy.

Schema bổ sung được tạo bằng các hàm ensure-schema hiện có khi Worker xử lý request; không cần chạy một migration SQL thủ công riêng cho các bảng/column này. Vẫn nên backup D1 trước khi deploy production.

## 7. Kiểm tra cục bộ

Chạy từ thư mục gốc repository:

```bash
bash scripts/check-build.sh
```

Bộ kiểm tra bao gồm cú pháp Worker/frontend, kiểm tra HTML inline JS và tài nguyên cục bộ, guardrail AI, session SSO, Seller, quy trình thẻ thủ công, tariff rounding, ledger/refund, callback signature và Free-bypass idempotency.

Các kiểm tra này **không** chứng minh deploy production thành công, không xác nhận Secret/credential đang đúng, không thực hiện giao dịch thật và không thay thế kiểm thử trên trình duyệt/điện thoại.
