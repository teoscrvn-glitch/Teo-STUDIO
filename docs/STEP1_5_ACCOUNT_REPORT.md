# TeoStudio V60.3 — Step 1.5 Account

## Phạm vi
- Sửa giao diện `frontend/account.html` cho vai trò buyer, dùng design tokens/components/motion và CSS riêng `page-account.css`.
- Giữ nguyên cấu trúc mount `#teoAccountMount`, toàn bộ form IDs, API paths, account tabs, purchase flow, wallet, studio, membership, security, notifications và support.
- Không thay đổi Worker, D1 schema, API contract, xác thực, thanh toán hoặc ví.

## Lỗi đã xác định và sửa ở frontend
`account.js` trước đây xóa `TEO_BUYER_SESSION` khi mọi lỗi từ `/api/account/me` xảy ra. Một HTTP 500 `SERVER_ERROR` cũng bị xử lý như phiên hết hạn, dẫn tới mất phiên phía trình duyệt và hiện raw error trong form đăng nhập.

Đã sửa:
- Chỉ xóa phiên khi HTTP 401 hoặc `ACCOUNT_REQUIRED`.
- HTTP 5xx/lỗi mạng giữ nguyên phiên, hiển thị trang lỗi rõ ràng và nút Thử lại.
- Có nút Đăng xuất chủ động nếu người dùng muốn kết thúc phiên.

## Giao diện
- Thêm `frontend/assets/css/page-account.css`.
- Dùng token Arc Blue/Cyan, buyer role, surfaces, typography và spacing từ kit.
- Giới hạn chiều rộng, `min-width:0`, `overflow-x:clip`, form controls `width/max-width:100%`, min-height 48px.
- Điều chỉnh header mobile và Turnstile container.
- Giữ legacy stylesheets còn lại vì account profile/tabs và các panel sau đăng nhập vẫn phụ thuộc class cũ; không gỡ hàng loạt khi chưa migrate toàn bộ trạng thái account.

## Files changed
- `frontend/account.html`
- `frontend/assets/js/account.js`
- `frontend/assets/css/page-account.css` (new)
- `scripts/test-account-step15.mjs` (new)
- `docs/STEP1_5_ACCOUNT_REPORT.md` (new)

## Verification
- `node --check frontend/assets/js/account.js`: PASS
- `node scripts/check-design-rules.mjs` trên thư mục tạm chỉ chứa `page-account.css`: PASS, 0 hard-rule violations, 0 legacy purple/pink, 0 hard-coded hex, 0 backdrop/infinite.
- `node scripts/check-inline-js.mjs`: PASS (8 scripts, 0 failures)
- `node scripts/check-local-refs.mjs`: PASS (52 HTML/CSS files)
- `sh scripts/check-build.sh`: PASS (40/40)
- All `scripts/test-*`: PASS (44/44)

## Not verified / remaining
- Không có quyền truy cập Cloudflare production logs hoặc D1 production trong môi trường đóng gói. Vì vậy chưa thể xác định nguyên nhân backend tạo HTTP 500 `SERVER_ERROR`; chỉ sửa hành vi frontend làm mất session và bổ sung thông tin lỗi để chẩn đoán.
- Chưa chạy browser screenshot/Playwright ở 390px và 1280px trong môi trường này. CSS có kiểm tra tĩnh; cần kiểm tra trên Chrome Android sau deploy.
- Turnstile live verification và login thật chưa được chạy.
