# TeoStudio V55 — Hướng dẫn triển khai từ điện thoại

> **Chưa deploy production.** Gói này là mã nguồn để đối chiếu/triển khai có kiểm soát, không phải bằng chứng web live đã nâng cấp. Nó dựa trên ZIP V54 được cung cấp, không phải bản export trực tiếp từ GitHub main.

## Trước khi làm

1. Mở Cloudflare Dashboard → **Workers & Pages → D1 → `teo-studio`** và tạo bản backup/export dữ liệu hiện tại.
2. Mở GitHub `teoscrvn-glitch/Teo-STUDIO` và so sánh branch production với ZIP này. Không ghi đè mù các sửa đổi mới hơn.
3. Chờ các đơn QR mua file cũ đang `pending` được thanh toán hoặc hết hạn. V55 chuyển luồng mua file mới sang ví nội bộ, endpoint tạo QR từng file cũ sẽ trả `410`.
4. Giữ nguyên database ID, D1 binding `DB`, webhook URL SePay và secret hiện có. Không xóa database, không reset schema.

## Đưa mã lên GitHub

1. Tải và giải nén ZIP; ở thư mục gốc phải thấy `cloudflare/`, `frontend/`, các file Markdown.
2. Cập nhật/merge đúng đường dẫn trong repository; không tạo thêm một thư mục lồng kiểu `TeoStudio-V55/...` ở trên `cloudflare/` và `frontend/`.
3. Cloudflare Worker Builds hiện dùng thư mục root `cloudflare` và lệnh `npx wrangler deploy`. `wrangler.toml` trỏ assets tới `../frontend` nên cần cập nhật cả `cloudflare/` và `frontend/`.
4. Tạo branch/commit mới và đợi build đúng commit đó. Không retry commit cũ để mong nó lấy mã mới.
5. Sau khi build thành công, mở `https://teostudio.top/api/health`; phải trả `version: "v55-wallet-account-ai-builder"` và `frontendVersion` tương ứng. Nếu chưa đổi version, dừng và kiểm tra build/commit.

## Runtime Variables and Secrets

Workers & Pages → `teo-studio` → **Settings → Variables and Secrets → Production**.

Giữ lại các biến/secret hiện tại. Xác nhận có:
- `ADMIN_KEY` — Secret
- `SEPAY_API_KEY` — Secret
- `SEPAY_BANK_CODE` — Variable, giá trị hiện tại của tài khoản nhận tiền
- `SEPAY_ACCOUNT_NUMBER` — Variable, giữ nguyên tài khoản MB đang nhận tiền
- `TURNSTILE_SITE_KEY` — Variable
- `TURNSTILE_SECRET` — Secret
- `OXMAIL_SMTP_PASS` — Secret; giữ các biến SMTP hiện có

Tuỳ chọn, để bật tích hợp bổ sung:
- `AI_API_URL` — Variable, endpoint HTTPS của nhà cung cấp API tương thích OpenAI
- `AI_API_KEY` — Secret
- `AI_MODEL` — Variable
- `TELEGRAM_BOT_TOKEN` — Secret
- `TELEGRAM_CHAT_ID` — Variable hoặc Secret

Nếu không cấu hình AI thì bong bóng AI vẫn hiện nhưng chỉ có hướng dẫn fallback, không có mô hình AI từ xa. Nếu không cấu hình Telegram, báo cáo vẫn lưu ở D1 nhưng không gửi Telegram.

## Kiểm thử bắt buộc

- Đăng ký tài khoản test → nhận mã email → xác minh → đăng nhập → thử quên mật khẩu.
- Mở link trang chi tiết file trả phí khi chưa đăng nhập: không được thấy link gốc.
- Thử endpoint public `/api/products/<id>` hoặc `/api/public-tenant/<slug>`: không được trả link gốc cho file trả phí.
- Nạp một khoản nhỏ theo QR riêng, đợi webhook SePay xác nhận, so lại lịch sử ngân hàng và ví. Không chuyển tiền lần hai khi đơn đang xử lý.
- Mua một file test: checkbox điều khoản, xác nhận lần hai, Turnstile; kiểm tra ví giảm đúng giá, seller nhận 95%, platform ghi 5%; lặp cùng request không được trừ lần hai.
- Gửi một báo cáo lỗi test; xác nhận lưu trong mục Admin. Nếu Telegram secrets đã cấu hình, xác nhận bot nhận tin.
- Chọn tháng ở thống kê và đối chiếu vài giao dịch với D1/SePay; số liệu mới lấy từ dữ liệu thật.
- Kiểm tra Builder: gói Free không lưu được, gói trả phí có thể lưu/xem lại layout.
- Kiểm tra gói thuê Free, VIP, nâng cấp và webhook bằng staging hoặc khoản thử nhỏ phù hợp.

## Lưu ý bảo mật

- Không dán secret vào chat, HTML, JavaScript frontend hoặc GitHub.
- Giữ nguyên webhook SePay `https://teostudio.top/api/webhook/sepay`; không tắt xác thực webhook.
- V55 không chuyển tiền ngân hàng tự động khi người bán rút; vẫn cần Téo duyệt.
- Worker có rate limit theo isolate nhưng chưa thay cho Cloudflare WAF/Rate Limiting. Sau deploy, cấu hình rule ở cấp Cloudflare cho các endpoint đăng nhập, tạo đơn, báo lỗi và các request API lặp bất thường.
- Nếu lỗi nghiêm trọng, rollback commit về bản V54 đã lưu và giữ nguyên D1; không khôi phục bằng cách xóa database.
