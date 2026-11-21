# TeoStudio V54 — sửa giao diện, ví và cấu hình runtime

## Những gì được sửa

- Bump cache key của HTML/CSS/JS lên V54 và thêm meta marker `teo-frontend-version` để phân biệt mã frontend đã cập nhật.
- Trang thuê nêu rõ biến còn thiếu phải được đặt trong **runtime Worker Settings → Variables and Secrets**; biến ở **Builds settings** chỉ phục vụ quá trình build và không tự trở thành `env` của Worker.
- Tenant Admin hiển thị gói lấy từ API: `Free` hoặc `VIP`. Gói Free chỉ có Share cơ bản; Ví/rút tiền và bán file chỉ xuất hiện với tenant VIP/paid. Nếu tài khoản dự kiến là VIP nhưng nhãn hiện Free thì cần kiểm tra `plan_type` của tài khoản, không sửa bằng cách chỉ mở tab ở frontend.
- Giữ lại form thông tin nhận tiền, số dư ví, lịch sử giao dịch, tạo yêu cầu rút tiền, và quản trị duyệt/từ chối/đánh dấu đã trả.
- Giữ form chế độ catalog cho Admin chính và Tenant Admin: Free trực tiếp, Free qua link vượt, chỉ mua, Free/Mua. Giá và link trả phí chỉ được dùng cho checkout và trả về sau khi đơn được xác nhận đã thanh toán.
- Sửa danh sách sản phẩm công khai của Share tenant: API không còn gửi `original_link` trả phí cho trình duyệt trước thanh toán. Với mode `paid`, cả hai trường link đều bị làm rỗng trong payload công khai; Admin API vẫn đọc được để chỉnh sửa.
- `/api/health` giờ báo `v54-rental-catalog-payout`, giúp kiểm tra bản Worker đang chạy.

## Cấu hình SePay/Turnstile — quan trọng

Ảnh cấu hình trước đó đang ở trang **Builds**, không chứng minh các biến được gắn vào runtime Worker. Vào Cloudflare Dashboard → Workers & Pages → chọn Worker `teo-studio` phục vụ `teostudio.top` → **Settings → Variables and Secrets** (production/runtime environment). Tại đây tạo/kiểm tra:

- `SEPAY_API_KEY` — **Secret**, phải khớp chính xác API Key đã nhập trong webhook SePay.
- `SEPAY_BANK_CODE` — **Variable**, mã ngân hàng đúng với tài khoản nhận tiền/VietQR.
- `SEPAY_ACCOUNT_NUMBER` — **Variable**, số tài khoản nhận tiền hiện tại.
- `SEPAY_ACCOUNT_NAME` — **Variable**, tùy chọn, tên chủ tài khoản để tạo VietQR đẹp hơn.
- `TURNSTILE_SITE_KEY` — **Variable** (public site key).
- `TURNSTILE_SECRET` — **Secret** tương ứng với site key và hostname `teostudio.top`.

Không đổi tài khoản nhận tiền trong quá trình sửa và không chép key/secret vào GitHub, ảnh chụp hoặc chat. Sau khi lưu, redeploy nếu Cloudflare yêu cầu rồi mở `https://teostudio.top/api/health` và `https://teostudio.top/api/rental/config`. Các trường trong `missing` phải rỗng đối với thanh toán; `turnstileConfigured` phải là `true`.

Lỗi webhook HTTP 401 cần xử lý bằng cách khớp API Key SePay với runtime secret `SEPAY_API_KEY` và xác nhận đúng Worker/phiên bản đang chạy. Không tắt xác thực. Đối soát giao dịch bị cảnh báo trước khi cộng ví hay cấp file.

## Vì sao giao diện đang xem có thể thiếu trường

Trong ZIP V54, form Admin chính có trường `Hình thức bán`, `Kiểu link Free`, `Link tải miễn phí`, `Link gốc trả phí`, `Giá bán`; Tenant Admin có chế độ Free trực tiếp, Free qua link vượt, Chỉ mua, Free/Mua cùng form Ví & rút tiền. Nếu web thực tế vẫn hiện form chỉ có tên/tag/mô tả/link hoặc tenant VIP không có tab Ví, frontend đang được phục vụ từ bản cũ/cached hoặc dữ liệu tài khoản báo `planType=free`.

Để deploy đồng bộ qua Worker Builds, commit cả `cloudflare/` **và** `frontend/` từ repository-root của ZIP này, cùng `wrangler.toml` ở `cloudflare/`; cấu hình `directory = "../frontend"` cần trỏ đến thư mục frontend mới. Build log phải thuộc commit mới. Sau deploy, kiểm tra `/api/health` báo `v54-rental-catalog-payout`, mở trang trong tab ẩn danh, kiểm tra `meta name="teo-frontend-version"` là `v54-rental-catalog-payout`, và xác nhận URL script có `?v=54`. Nếu health là V54 nhưng meta frontend không phải V54 thì assets frontend chưa được cập nhật đồng bộ.

## Không làm trong bản vá này

- Không đụng vào D1 production hoặc thay database ID.
- Không tự điền SePay key, tài khoản ngân hàng, SMTP password, Turnstile secret hoặc provider vượt link. Các giá trị này chỉ chủ web mới cung cấp được.
- Chưa thực hiện giao dịch SePay production, không thể xác nhận webhook hoàn tất cho tới khi runtime secret được cấu hình và test bằng giao dịch có đối soát.
