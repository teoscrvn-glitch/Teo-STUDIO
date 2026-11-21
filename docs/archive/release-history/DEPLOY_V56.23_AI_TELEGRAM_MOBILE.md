# TeoStudio V56.23 — Sửa AI và chẩn đoán Telegram

## Điều cần biết trước
Ảnh Admin hiện đang báo **AI thiếu `AI_API_URL`, `AI_API_KEY`, `AI_MODEL`** và **Telegram thiếu `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`**; phiên bản đang chạy là `v56.8-tenant-login-ui-cta-fix`. Đây là dấu hiệu Worker Production chưa nhận đủ cấu hình và/hoặc chưa deploy mã mới. Chỉ sửa HTML trên điện thoại sẽ không khắc phục được các biến runtime.

Bản này khai báo sẵn hai biến không bí mật trong `cloudflare/wrangler.toml`:
- `AI_API_URL = https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- `AI_MODEL = gemini-3.8-flash`

`AI_API_KEY` và Telegram token không thể tạo tự động bằng mã nguồn; phải nhập vào Cloudflare Secrets của Worker Production.

## 1. Đưa bản V56.23 lên GitHub/Cloudflare
1. Giải nén ZIP; ở thư mục gốc phải thấy `cloudflare/`, `frontend/`.
2. Cập nhật/merge cả hai thư mục vào repo `teoscrvn-glitch/Teo-STUDIO`, không đặt chúng lồng thêm một thư mục.
3. Commit/push và đợi Cloudflare Worker Builds báo build/deploy thành công.
4. Mở `https://teostudio.top/api/health`. Trường `version` phải là `v56.23-ai-telegram-diagnostics-fix`. Nếu vẫn là `v56.8...`, production chưa chạy mã mới: kiểm tra branch, root directory `cloudflare`, build log và commit được deploy.

## 2. Cấu hình Teo AI
Cloudflare Dashboard → Workers & Pages → `teo-studio` → Settings → Variables and Secrets → **Production**:
- `AI_API_KEY` — thêm/giữ dưới dạng **Secret**, dùng key từ Google AI Studio.
- `AI_API_URL` — Variable: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
- `AI_MODEL` — Variable: `gemini-3.8-flash`.

Sau khi deploy, vào Admin → Runtime Check → **Thử kết nối AI**. Bản này vẫn không đưa key vào frontend hay GitHub; nếu provider trả lỗi, thông báo sẽ có HTTP status và phần mô tả đã lọc thông tin nhạy cảm. Nếu Google AI Studio của bạn hiển thị tên model khác chính xác `gemini-3.8-flash`, hãy dùng đúng model ID được cung cấp trong tài khoản đó.

## 3. Cấu hình bot Telegram
1. Mở Telegram, chat với `@BotFather`, dùng `/newbot` (hoặc lấy token của bot hiện có) và sao chép token. Không gửi token vào chat hay commit lên GitHub.
2. Mở cuộc trò chuyện riêng với bot mới và bấm **Start** hoặc gửi `/start`. Nếu gửi vào nhóm, hãy thêm bot vào nhóm và bảo đảm bot có quyền gửi tin.
3. Đặt `TELEGRAM_BOT_TOKEN` dưới dạng **Secret** trong Worker Production.
4. Đặt `TELEGRAM_CHAT_ID` dưới dạng **Variable** hoặc **Secret**. Với chat riêng, lấy ID bằng cách mở `https://api.telegram.org/bot<TOKEN>/getUpdates` sau khi đã gửi `/start`, rồi đọc `message.chat.id` trong kết quả. Thay `<TOKEN>` cục bộ; không gửi URL/token đó cho người khác. Với nhóm, đọc `message.chat.id` của bản cập nhật trong nhóm; ID nhóm thường là số âm.
5. Lưu cấu hình. Nếu Dashboard yêu cầu, deploy/restart Worker theo giao diện Cloudflare.
6. Vào Admin → Runtime Check → **Gửi Telegram test**. Bản V56.23 trả thông báo lỗi Telegram chi tiết hơn (ví dụ chat không tồn tại, bot chưa được bắt đầu, hoặc token sai) nhưng không trả token.

## 4. Xác nhận
- Runtime Check phải hiển thị AI **đủ cấu hình** và Telegram **đủ cấu hình**.
- Nút **Thử kết nối AI** phải báo kết nối thành công.
- Nút **Gửi Telegram test** phải báo thành công và tin nhắn test xuất hiện ở đúng chat.
- Nếu Telegram test thành công nhưng báo lỗi không tới Telegram ở một số luồng, kiểm tra từng luồng và xem log Worker; test chỉ xác nhận bot gửi được tới chat ID đã cấu hình.

## Bảo mật
Không đưa `AI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ADMIN_KEY` hay các secret khác vào `wrangler.toml`, HTML, JavaScript frontend, ảnh chụp công khai hoặc GitHub. ZIP này không thể kiểm chứng kết nối Production trước khi bạn deploy và điền secrets thật.
