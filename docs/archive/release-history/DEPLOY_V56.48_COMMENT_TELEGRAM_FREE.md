# TeoStudio V56.48 — Bình luận công khai, Telegram tenant và Free bypass

## Thay đổi
- Bình luận chữ và ảnh hiển thị công khai ngay sau khi API xác nhận lưu thành công; không còn đặt bình luận có ảnh vào trạng thái chờ duyệt.
- Giữ đăng nhập, email đã xác minh, Cloudflare Turnstile và giới hạn tốc độ để giảm spam.
- `/api/admin/config-status` bổ sung `tenantTelegram` và `freeBypass` để báo rõ các biến còn thiếu.
- Giữ giới hạn bình luận hiện tại (2/tài khoản/phút, 5/IP/phút theo DB, 10/tài khoản/ngày; ảnh tối đa 5/ngày) và giới hạn burst theo IP. Admin tenant vẫn có API ẩn/xóa bình luận và chặn IP/email riêng Studio.

## Biến Cloudflare cho Telegram tenant
Trong Worker → Settings → Variables and Secrets → Production:
- Variable `TELEGRAM_BOT_USERNAME`: username bot chính thức, bỏ ký tự `@`.
- Secret `TELEGRAM_BOT_TOKEN`: token lấy từ BotFather.
- Secret `TELEGRAM_WEBHOOK_SECRET`: chuỗi ngẫu nhiên mạnh, không dùng lại token bot.

Giữ `TELEGRAM_CHAT_ID` cho thông báo của admin chính; nó không thay cho 3 biến kết nối Telegram riêng của tenant. Sau khi thêm biến, deploy Worker rồi mở Cài đặt trong Admin tenant và bấm Kết nối bot Telegram. Cần kiểm tra bot chính thức và quyền webhook trước khi sử dụng thật.

## Biến Cloudflare cho trang Free / vượt link
Cơ chế hiện tại yêu cầu đủ 4 biến sau:
- `FREE_BYPASS_TEMPLATE_1`
- `FREE_BYPASS_TEMPLATE_2`
- `FREE_BYPASS_VERIFY_URL`
- Secret `FREE_BYPASS_API_KEY`

Hai `TEMPLATE` phải là mẫu/link được nhà cung cấp vượt link hỗ trợ; `VERIFY_URL` phải là API xác minh của nhà cung cấp trả JSON có `success: true`, `completed: true`, và `state` trùng state gửi lên. Không điền link landing page thông thường thay cho API xác minh. Không thể tạo giá trị hợp lệ nếu chưa biết chính xác hai nhà cung cấp và tài khoản/API của chúng.

## Triển khai an toàn
1. Sao lưu D1 và Worker đang chạy.
2. Deploy source trong ZIP; giữ nguyên binding `DB`, `ASSETS`, database ID, và mọi Secret Production đã có.
3. Thêm các biến Telegram nêu trên trong Production. Không đặt Secret vào `wrangler.toml` hoặc commit Git.
4. Chỉ cấu hình Free bypass sau khi có thông số API chính thức của cả hai nhà cung cấp.
5. Test bình luận chữ/ảnh khi đã đăng nhập và xác minh email; thử spam ở mức an toàn để xác nhận trả HTTP 429; thử chặn IP/email trong admin tenant.
6. Test bot với tenant thử nghiệm trước khi dùng thật.

## Giới hạn xác minh
Đã kiểm tra cú pháp JavaScript bằng `node --check`. Chưa kết nối Cloudflare Production, D1 thật, Turnstile thật, Telegram thật hoặc hai nhà cung cấp vượt link; cần test sau deploy.
