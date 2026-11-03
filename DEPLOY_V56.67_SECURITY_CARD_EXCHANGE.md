# TeoStudio V56.67 — Payment, card exchange & edge security

## 1. Bản nền và phạm vi

- Bản nền: `TeoStudio-V56.66-Main-Share-UI`.
- Giữ nguyên các tính năng và Share UI của V56.66; bản `Web-Fixed-Plus-Share-Preview` chỉ dùng để đối chiếu, không lấy đè giao diện mới hơn.
- Worker/frontend được đánh dấu `v56.67-payment-security-hardening`.
- Không thay database_id D1, các biến SePay đang có hoặc các Secret cũ.

## 2. Nạp thẻ cào vào ví

- Kết nối API đổi thẻ của TheCaoSieuToc: `POST /chargingws/v2`, chữ ký `md5(partner_key + code + serial)`.
- Yêu cầu tài khoản đã xác minh email và Turnstile hợp lệ.
- Lưu dấu vân tay SHA-256 của thẻ, không lưu mã thẻ/serial dạng rõ trong D1.
- Callback `/api/webhook/card-provider` kiểm tra chữ ký nhà cung cấp, đối chiếu request ID, nhà mạng, mệnh giá và dấu vân tay thẻ.
- Chỉ cộng ví khi nhà cung cấp xác nhận thành công. Ghi sổ ví một lần bằng ràng buộc duy nhất; callback lặp không tạo thêm tiền.
- Số tiền cộng = số nhỏ hơn giữa số tiền nhà cung cấp xác nhận và số tiền theo chiết khấu thành viên đã cấu hình, sau đó làm tròn xuống 1.000đ.
- Nếu API timeout, đơn ở trạng thái `unknown`; không tự gửi thẻ lần nữa, chờ callback/đối soát.
- Hạn mức theo tài khoản: tối đa 3 yêu cầu nạp thẻ trong 1 phút; trùng fingerprint bị từ chối.

### Bảng phí đã biết từ ảnh

Mặc định chỉ điền Vinaphone theo đúng ảnh người dùng cung cấp. Phần trăm là chiết khấu, số dư nhận dự kiến được làm tròn xuống 1.000đ.

| Mệnh giá | Đối tác | Thành viên |
|---:|---:|---:|
| 10.000đ | 17,1% | 17,3% |
| 20.000đ | 14,6% | 14,8% |
| 30.000đ | 14,6% | 14,8% |
| 50.000đ | 11,1% | 11,3% |
| 100.000đ | 9,6% | 9,8% |
| 200.000đ | 9,6% | 9,8% |

Các nhà mạng khác để trống/tắt mặc định. Vào Admin → **Bảng phí thẻ** để cấu hình. Nút **Làm mới** lấy mức phí đối tác từ API nhà cung cấp; tỷ lệ thành viên được giữ nguyên và cần nhập/đối chiếu riêng. Không bật nhà mạng nếu chưa đủ 6 mệnh giá.

Ảnh người dùng cho thấy thẻ 10.000đ Vinaphone nhận khoảng 8.270đ ở một dòng; theo quy tắc làm tròn xuống 1.000đ thì số dự kiến ghi vào ví là 8.000đ. Số thực tế vẫn bị chặn trên bởi `amount` xác nhận từ API.

## 3. Rút thẻ cào cho Seller và Studio

- Seller: `/api/account/seller/card-withdrawals`.
- Studio/Tenant: `/api/tenant/card-withdrawals`.
- Phí rút: giữ/trừ đúng 105% mệnh giá (thẻ 100.000đ giữ 105.000đ).
- Số dư được giữ trong ledger trước khi gọi API mua thẻ; không dùng số dư hiển thị từ frontend làm nguồn sự thật.
- Chống gửi lặp bằng idempotency key duy nhất theo tài khoản; tối đa 2 yêu cầu/tài khoản/giờ được kiểm tra cả tại Worker và D1. Nếu còn đơn `processing`/`unknown`, tài khoản bị khóa tạo đơn đổi thẻ mới cho tới khi Admin đối soát, kể cả khi người dùng đổi trình duyệt hoặc xóa session.
- Nếu nhà cung cấp trả lỗi từ chối rõ ràng, ledger hoàn lại đúng khoản đã giữ. Nếu timeout/kết quả không rõ, tiền vẫn được giữ để đối soát, không tự retry nhằm tránh mua hai lần.
- Mã thẻ/serial lưu dưới dạng AES-GCM trong D1; API chỉ giải mã cho đúng tài khoản sở hữu.
- API mua thẻ công bố hiện hỗ trợ Vinaphone, Viettel, Mobifone, Garena và Zing trong phần triển khai này. Vcoin vẫn có thể được cấu hình bảng phí để hiển thị, nhưng không mở rút thẻ vì API mua thẻ công khai đang được dùng không liệt kê Vcoin.

## 4. Cloudflare Secrets cần thêm

Thêm trong **Workers & Pages → teo-studio → Settings → Variables and Secrets → Production → Secrets**. Không ghi giá trị vào `wrangler.toml`, GitHub hoặc chat.

| Secret | Dùng cho |
|---|---|
| `THECAOSIEUTOC_PARTNER_ID` | API nạp thẻ và lấy bảng phí |
| `THECAOSIEUTOC_PARTNER_KEY` | Ký request và xác minh callback nạp thẻ |
| `THECAOSIEUTOC_TOKEN` | API mua thẻ để rút cho Seller/Studio |
| `CARD_DATA_ENCRYPTION_KEY` | Khóa AES-GCM để mã hóa mã thẻ/serial; tối thiểu 32 ký tự ngẫu nhiên |

Có thể tạo khóa ngẫu nhiên trên máy có OpenSSL bằng `openssl rand -base64 48`, rồi dán trực tiếp vào Secret `CARD_DATA_ENCRYPTION_KEY`. **Không đổi khóa này tùy tiện**: đổi khóa sẽ khiến các mã thẻ đã mã hóa trước đó không giải mã được. Lưu bản sao an toàn ngoại tuyến.

Các lệnh Wrangler (chạy trong thư mục `cloudflare/` của dự án; mỗi lệnh sẽ hỏi giá trị Secret):

```bash
npx wrangler secret put THECAOSIEUTOC_PARTNER_ID
npx wrangler secret put THECAOSIEUTOC_PARTNER_KEY
npx wrangler secret put THECAOSIEUTOC_TOKEN
npx wrangler secret put CARD_DATA_ENCRYPTION_KEY
npx wrangler deploy
```

**Callback URL** cần đăng ký ở trang Merchant của nhà cung cấp:

```text
https://teostudio.top/api/webhook/card-provider
```

Chọn GET hoặc POST theo tùy chọn nhà cung cấp. Endpoint không dùng cookie/Origin của trình duyệt; nó xác thực chữ ký callback và đối chiếu giao dịch trong D1. Không đưa callback vào rule WAF chặn/rate-limit chung.

## 5. Lớp bảo vệ đã bổ sung trong Worker

- Cloudflare Rate Limiting bindings: API tổng 600/phút, xác thực 18/phút, giao dịch 12/phút, Free bypass 8/phút theo IP và bucket.
- Hạn mức cục bộ bổ sung theo IP và subnet IPv4 `/24`/IPv6 prefix; đây là defense-in-depth, không phải bộ đếm toàn cầu.
- Auth/finance có thêm hạn mức theo tài khoản ở các luồng nhạy cảm; nạp/rút thẻ còn có giới hạn được lưu ở D1 để không mất khi Worker isolate khởi động lại.
- Request body API ghi được giới hạn 2 MB; với body không có `Content-Length`, Worker đọc stream theo ngưỡng và hủy khi vượt giới hạn.
- Chặn request ghi cross-site, áp dụng CSP/HSTS/nosniff/frame protections, Turnstile trên các luồng nạp/đăng ký/mua quan trọng.
- Free bypass giữ xác minh phía server, state hash, thời hạn, kiểm tra thứ tự bước, xác minh với nhà cung cấp và chỉ cho dùng một lần; cập nhật lượt vượt và số ngày thuê bằng D1 batch có điều kiện để chặn hai callback chạy song song, giới hạn tối đa 2 phiên vượt đang chờ cho mỗi tenant; không tin query param hay trạng thái frontend.
- Hai webhook SePay và TheCaoSieuToc được miễn kiểm tra Origin dành cho trình duyệt; chúng vẫn phải đi qua xác minh webhook riêng và ledger/idempotency. WAF bên ngoài cần có rule riêng, không chặn nhầm callback.

Lưu ý: Rate Limiting binding trong Worker là bộ đếm gần đúng, phân tách theo Cloudflare location; request có thể vượt ngưỡng khi counter đồng bộ trễ. Vì vậy cấu hình WAF Rate Limiting của zone là lớp chính; binding chỉ bổ sung theo route. Wrangler yêu cầu phiên bản 4.36.0 trở lên cho Rate Limiting binding. Namespace `5667001`–`5667004` trong `wrangler.toml` phải duy nhất trong tài khoản Cloudflare; kiểm tra không trùng namespace hiện có trước khi deploy.

## 6. Rule đề xuất ở Cloudflare Dashboard

Vào **teostudio.top → Security → WAF → Rate limiting rules**. Chọn counting characteristic `IP source address`, action `Block` (hoặc Managed Challenge nếu muốn giảm false-positive lúc đầu). Bắt đầu với ngưỡng dưới đây, theo dõi Security Events rồi điều chỉnh:

### A. Đăng nhập / đăng ký / xác minh

Expression:

```text
(http.host eq "teostudio.top" and http.request.method eq "POST" and http.request.uri.path in {"/api/account/login" "/api/account/register" "/api/account/verify-email" "/api/account/password/reset/start" "/api/account/password/reset/finish" "/api/tenant/login" "/api/tenant/password" "/api/rental/email/start" "/api/rental/email/verify"})
```

Ngưỡng khởi điểm: 15 request / 60 giây / IP, Block 60 giây.

### B. Free bypass

```text
(http.host eq "teostudio.top" and http.request.method eq "POST" and http.request.uri.path in {"/api/rental/free/bypass/start" "/api/rental/free/bypass/complete"})
```

Ngưỡng: 8 request / 60 giây / IP, Block 60 giây.

### C. Giao dịch / tài chính

```text
(http.host eq "teostudio.top" and http.request.method eq "POST" and http.request.uri.path in {"/api/account/topups/create" "/api/account/card-topups" "/api/account/seller/card-withdrawals" "/api/tenant/card-withdrawals" "/api/account/seller/withdrawals" "/api/tenant/withdrawals"})
```

Ngưỡng: 10 request / 60 giây / IP, Block 60 giây. Hạn mức D1 theo user vẫn là lớp bổ sung khi người dùng đổi IP.

### D. API tổng

```text
(starts_with(http.request.uri.path, "/api/") and http.host eq "teostudio.top" and http.request.uri.path ne "/api/webhook/sepay" and http.request.uri.path ne "/api/webhook/card-provider")
```

Ngưỡng khởi điểm: 300 request / 60 giây / IP, Block 60 giây. Hai webhook được loại khỏi rule tổng để không làm rơi callback hợp lệ; không tạo rule khác chặn chúng theo phương thức POST.

### E. Thu gọn bề mặt tấn công

- Bật Cloudflare Managed Ruleset và OWASP Core Ruleset ở mức phù hợp; theo dõi event trước khi tăng độ nhạy.
- Giữ DNS record của hostname website đi qua Cloudflare proxy, SSL/TLS ở Full (strict) khi cấu hình chứng chỉ phù hợp.
- Không bật Challenge cho toàn bộ POST/API vì sẽ làm hỏng SePay/provider callbacks và các request API hợp lệ.
- Không chặn toàn bộ IP nước ngoài hoặc ASN nếu chưa có dữ liệu tấn công thực tế.
- Khi có đợt HTTP flood, có thể bật Under Attack Mode tạm thời; kiểm tra lại các luồng thanh toán và callback ngay sau đó.

Cloudflare có DDoS protection tự động cho L3/4 và HTTP/L7 trên các plan; WAF/Rate Limiting vẫn cần cấu hình đúng để giảm abuse ở các endpoint nhạy cảm. Không có cấu hình Worker nào đảm bảo website không thể bị DDoS hoặc bypass tuyệt đối.

## 7. Kiểm thử và giới hạn xác minh

Chạy tại thư mục gốc dự án:

```bash
bash scripts/check-build.sh
```

Bộ kiểm tra bao gồm cú pháp Worker/JS, các kiểm tra hồi quy hiện hữu và static assertions cho V56.67. Các test hiện có **không** thay thế kiểm thử live trên Cloudflare, D1, tài khoản TheCaoSieuToc hoặc điện thoại thực tế.

Chưa thể xác nhận giao dịch thật khi chưa có 4 Secrets đối tác và callback được khai báo. Sau khi cấu hình, thử trước với tài khoản test/giá trị nhỏ; xác minh callback success, failed, pending, callback lặp, API timeout và đơn mua thẻ hết kho. Không mở rộng sang Vcoin hoặc loại thẻ khác nếu API vendor chưa công bố hỗ trợ.
