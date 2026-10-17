# TeoStudio V57.1 — Cấu hình Runtime sau khi deploy

## Nơi cấu hình đúng

Cloudflare Dashboard → **Workers & Pages → `teo-studio` → Settings → Variables and Secrets → Production**. Thay đổi cần được lưu/deploy để Worker Production nhận biến. Đừng chỉ thêm ở mục Build variables. Không gửi các giá trị Secret qua chat hoặc lưu vào source code/GitHub.

## 1. Các cấu hình nền tảng

| Tên | Loại | Ghi chú |
|---|---|---|
| `ADMIN_KEY` | Secret | Key dùng để đăng nhập Admin. Không đặt trong frontend. |
| `SEPAY_API_KEY` | Secret | Key đúng với cách xác thực webhook đã cấu hình ở SePay. |
| `SEPAY_BANK_CODE` | Variable | Mã ngân hàng VietQR, ví dụ `MB` nếu tài khoản nhận là MB. |
| `SEPAY_ACCOUNT_NUMBER` | Variable | Số tài khoản nhận tiền đầy đủ. Không đưa vào source công khai. |
| `SEPAY_ACCOUNT_NAME` | Variable, tùy chọn | Tên chủ tài khoản để hiển thị trên QR nếu cần. |
| `TURNSTILE_SITE_KEY` | Variable | Site key công khai của widget đang dùng. |
| `TURNSTILE_SECRET` | Secret | Secret tương ứng với đúng widget đó. Widget phải allow hostname `teostudio.top`. |
| `DB` | D1 binding | Giữ nguyên binding hiện tại tới D1 `teo-studio`. |

Nếu trang báo thiếu `SEPAY_BANK_CODE` hoặc `SEPAY_ACCOUNT_NUMBER` nhưng mày nghĩ đã thêm rồi, kiểm tra đúng Worker `teo-studio`, đúng **Production Runtime**, đúng spelling/viết hoa và xem `/api/health`. Không đặt giá trị giả vào source để che lỗi cấu hình.

## 2. Email OxMail — đăng ký/xác minh/quên mật khẩu

| Tên | Loại | Giá trị mặc định/ghi chú |
|---|---|---|
| `OXMAIL_SMTP_HOST` | Variable | `mail.teostudio.top` nếu mailbox của mày dùng host này. |
| `OXMAIL_SMTP_PORT` | Variable | `465`; code dùng SMTP implicit TLS trên cổng 465. |
| `OXMAIL_SMTP_USER` | Variable | `teostudio@teostudio.top` nếu đây đúng là mailbox gửi thư. |
| `OXMAIL_SMTP_PASS` | Secret | Mật khẩu mailbox SMTP, không phải mật khẩu đăng nhập Admin. |
| `EMAIL_FROM` | Variable, tùy chọn | Địa chỉ gửi; mặc định dùng SMTP user. |
| `EMAIL_ADMIN_TO` | Variable, tùy chọn | Địa chỉ nhận email thử nếu muốn khác mặc định. |

Sau khi lưu, đăng nhập Admin → phần Dashboard/Runtime config → **Thử gửi Email**. Sau đó đăng ký tài khoản test và xác minh email; thử reset password. Việc API báo SMTP đã nhận không đảm bảo email sẽ vào Inbox, nên kiểm tra cả Spam/Quảng cáo và DNS MX/SPF/DKIM của domain.

## 3. Teo AI — API tương thích OpenAI Chat Completions

| Tên | Loại | Ghi chú |
|---|---|---|
| `AI_API_URL` | Variable | URL HTTPS đầy đủ của endpoint Chat Completions; thường có dạng `https://<nhà-cung-cấp>/v1/chat/completions`. Dùng đúng URL trong tài liệu nhà cung cấp. |
| `AI_API_KEY` | Secret | API key do nhà cung cấp cấp. Không sử dụng khóa trình duyệt/public key. |
| `AI_MODEL` | Variable | ID model chính xác mà key/tài khoản của mày được phép gọi. |

Sau khi cấu hình, vào Admin → Runtime config → **Thử kết nối AI**. Nếu nhận `AI_PROVIDER_HTTP_ERROR`, kiểm tra endpoint path, model, trạng thái key/quota. Nếu AI vẫn trả lời dự phòng thì đó không phải bằng chứng model đang chạy; hãy kiểm tra status và test connection.

API có thể được gọi nhiều lần bởi người dùng; cần giới hạn lượt, có timeout và kiểm soát quota ở nhà cung cấp. Không cấp cho AI quyền sửa số dư, xác nhận thanh toán, thay mật khẩu hoặc duyệt rút tiền.

## 4. Telegram báo lỗi

| Tên | Loại | Ghi chú |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Secret | Tạo bot qua BotFather. |
| `TELEGRAM_CHAT_ID` | Variable | Chat cá nhân/nhóm/channel mà bot được phép gửi. |

Mở chat với bot và gửi `/start` trước khi thử chat cá nhân; với group, thêm bot vào group và lấy đúng chat ID. Sau đó chọn **Thử Telegram** trong Admin. Không chia sẻ token bot.

## 5. Cấu hình vượt link Free (nếu vẫn dùng)

Các biến tùy provider: `FREE_BYPASS_TEMPLATE_1`, `FREE_BYPASS_TEMPLATE_2`, `FREE_BYPASS_VERIFY_URL`, `FREE_BYPASS_API_KEY` (key đặt làm Secret nếu provider yêu cầu). Phải dùng endpoint/callback thật được provider tài liệu hóa; không bịa URL. Nếu chưa cấu hình, không quảng cáo rằng vượt link Free đã hoạt động.

## 6. SePay webhook và ví

- Webhook vẫn nhận tại `https://teostudio.top/api/webhook/sepay`.
- Đảm bảo cấu hình xác thực ở dashboard SePay khớp kiểu Authorization/header mà Worker đang kiểm tra. Đừng tắt auth để né lỗi 401.
- Một khoản nạp chỉ được cộng sau khi webhook khớp mã, tài khoản nhận, chiều tiền vào và số tiền; mã giao dịch trùng phải được bỏ qua.
- Đơn mua file mới trừ số dư nội bộ; 5% chỉ áp cho sale của studio tenant theo logic hiện tại. Doanh thu file do Teo bán không phải khoản thanh toán cho tenant.
- Test bằng số tiền thấp nhất cho phép (10.000đ) và ghi lại mã giao dịch. Không chuyển tiền lần hai cho QR còn pending. Đối soát lịch sử ngân hàng và ledger sau khi test.

## 7. Cấu hình bảo mật Cloudflare

- Kiểm tra Turnstile widget allowlist `teostudio.top`, Site Key và Secret phải thuộc cùng widget.
- Giữ `run_worker_first = true` để Worker xử lý canonical-host redirect/security middleware trước static assets.
- Bật Rate Limiting/WAF ở cấp Cloudflare theo mức lưu lượng; Map trong Worker chỉ là giới hạn best-effort theo isolate, không chống được mọi tấn công phân tán.
- Link Admin không phải một loại xác thực độc lập: yêu cầu vẫn cần session/admin authorization của Worker.
- Sao lưu D1 định kỳ và kiểm tra khả năng restore.
