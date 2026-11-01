# TeoStudio V56.63 — Seller & Ads

## Có gì trong bản này
- Seller: link giới thiệu riêng theo file; token attribution có hạn 30 ngày; tự bỏ qua self-referral; mỗi đơn chỉ ghi một Seller; hoa hồng 5% chờ 7 ngày.
- Chia tiền theo số tiền server thực thu: không có Seller = 95% chủ file / 5% TeoStudio; có Seller = 90% chủ file / 5% Seller / 5% TeoStudio.
- Seller Center có số dư pending/khả dụng, lịch sử hoa hồng, hồ sơ nhận tiền và yêu cầu rút.
- Seller payout có khóa theo request key, giữ số dư tại thời điểm yêu cầu, nhật ký requested/approve/reject/paid; từ chối hoàn số dư bằng bút toán đảo.
- Ads: Admin tạo provider, nhập báo cáo thủ công theo kỳ và mã tham chiếu, xem lịch sử; chỉ Admin xác nhận mới ghi sổ 80% chủ trang/Studio và 20% TeoStudio. Báo cáo trùng bị chặn; báo cáo pending/rejected không ghi có. Doanh thu Ads đã xác nhận của Studio được thể hiện riêng trong thống kê và cộng vào tổng thực nhận, không làm tăng số đơn bán file.
- Có cờ bật toàn cục và override theo từng Studio cho Seller program/Ads. Rút Seller là cờ cấp tài khoản Seller (toàn hệ thống), không cấu hình theo Studio vì ví Seller có thể nhận hoa hồng từ nhiều Studio. Ads và Seller payouts mặc định tắt; Seller program giữ trạng thái mặc định đã có trong DB.
- API quảng cáo bên thứ ba chưa có trong bản này. Provider `api_pending` chỉ là trạng thái chờ tích hợp; hiện nhập/đối soát thủ công.

## Deploy an toàn — đặc biệt lưu ý biến Cloudflare
1. Sao lưu D1 `teo-studio` trước khi cập nhật và giữ lại phiên bản Worker cũ để rollback.
2. Không xóa Worker, không xóa/recreate D1, không chạy `DROP TABLE`, không reset database.
3. Giữ binding `DB` trỏ đúng database ID hiện tại trong `cloudflare/wrangler.toml`.
4. `wrangler.toml` chứa các biến plaintext đã biết từ cấu hình hiện tại, gồm `TELEGRAM_BOT_USERNAME=TeoStudioWebhookBot`. Nếu Cloudflare Dashboard đang có thêm **Variable không bí mật** ngoài danh sách trong `[vars]`, hãy thêm nguyên tên/giá trị đó vào `[vars]` trước khi deploy. Việc đồng bộ cấu hình bằng Wrangler có thể thay đổi danh sách Variables so với Dashboard nếu các biến đó không được khai báo trong config.
5. Secret phải tiếp tục là Worker Secrets trong Cloudflare Dashboard; tuyệt đối không đưa giá trị Secret vào ZIP/TOML. Giữ nguyên các secret đang có: `ADMIN_KEY`, `AI_API_KEY`, `BUMX_API_KEY`, `LINK4M_API_KEY`, `OXMAIL_SMTP_PASS`, `SEPAY_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TURNSTILE_SECRET` (và mọi secret bổ sung do bạn tự đặt). Không chạy `wrangler secret delete` hoặc thay secret bằng giá trị rỗng.
6. Sau khi kiểm tra `[vars]` và `DB` binding, deploy tại thư mục project:

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

Không có lệnh deploy nào được thực hiện từ môi trường tạo ZIP này; tài khoản Cloudflare của bạn không được truy cập hay thay đổi.

## D1 schema
Worker gọi `ensureV55Schema()` theo cơ chế additive khi các API Seller/Ads được dùng lần đầu. Các thay đổi chỉ tạo bảng/index mới hoặc thêm cột mới; không cập nhật lại số dư hay xóa lịch sử ví cũ. Vì vậy vẫn phải backup D1 trước lần deploy đầu tiên.

## Test rollout
1. Để `seller_payouts=0` và `ads_monetization=0` trong giai đoạn đầu.
2. Bật Seller trên một file thử; thử một đơn không có Seller (95/5) và một đơn theo link Seller (90/5/5). Kiểm tra đơn mua, hai ledger chủ file/platform và Seller ledger.
3. Chờ đủ 7 ngày hoặc thử trên bản sao D1 staging để xác nhận hoa hồng chuyển từ pending sang khả dụng.
4. Bật Seller payouts trên một Studio thử; kiểm tra reserve, approve, reject (số dư được trả lại đúng một lần), và mark paid (không trừ lần hai). Sau đó mới bật rộng.
5. Với Ads, thêm provider manual, nhập báo cáo pending và xác nhận rằng ví chưa thay đổi. Bật Ads cho một Studio thử, xác nhận một báo cáo rồi đối chiếu 80/20 trong ledger. Nhập lại cùng provider ref phải bị chặn.
6. Thu thập Worker logs và đối chiếu D1 trước khi bật toàn hệ thống.

## Giới hạn đã biết
- Bản hiện tại hỗ trợ nhập báo cáo Ads thủ công. Chưa gọi API provider vì bạn sẽ cung cấp API/credential sau; khi có tài liệu API sẽ bổ sung adapter riêng và lưu credential bằng Worker Secret.
- V56.62 không có quy trình coupon/discount. Hiện số tiền tính chia là giá thực thu do Worker lấy từ DB và ghi vào đơn; không nhận amount từ browser. Khi bổ sung giảm giá, phải tính giá sau giảm phía server trước khi phân bổ.
- Không có truy cập trực tiếp Cloudflare Production trong phiên này. Chưa deploy lên Worker/D1 production và chưa thể khẳng định runtime trên tài khoản thật.
