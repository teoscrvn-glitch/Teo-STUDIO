# TeoStudio V60.3 — Claude Brief Phase 0 + Performance Quick Wins

## Phạm vi
- Dùng `TeoStudio_Fix_Brief.md` làm checklist kỹ thuật, triển khai trước Phase 0 và các quick wins an toàn của Phase 1.
- Không viết lại từ đầu; giữ API, D1 schema, auth/session, thanh toán/rút tiền, Seller commission, Link4M/BumX, SePay, card flow và Telegram.

## Thay đổi
- Đồng bộ `VERSION.txt`, `cloudflare/worker.js`, `frontend/assets/js/config.js`, meta build của frontend và cache query CSS/JS về một BUILD_ID (`v60.3-phase0-performance-guard`, asset cache `?v=60.3`).
- Thêm `scripts/sync-build-id.mjs` để đồng bộ hoặc kiểm tra BUILD_ID/cache trong các lần phát hành tiếp theo.
- Lưu tài liệu lịch sử ở `docs/archive/release-history/` và `docs/archive/html-guides/`, không xoá nội dung.
- Chuyển `admin-v7.js`…`admin-v13.js` không có HTML tham chiếu vào `docs/archive/legacy-admin-js/`; giữ `admin-v14.js` đang chạy.
- Giữ riêng `assets/css/style.css` ở root cho GitHub Pages legacy; Cloudflare Worker vẫn publish `frontend/` như `cloudflare/wrangler.toml`.
- Giữ các URL `frontend/2.html`, `detail.html`, `product-detail-view.html` để tránh phá link cũ.
- Thêm `performance-guard.css`: tắt backdrop blur ở viewport <= 820px và hỗ trợ reduced-motion cho các hiệu ứng liên quan.
- Thêm `performance-guard.js`: tạm dừng CSS animation infinite khi phần tử nằm ngoài viewport hoặc tab ẩn; tiếp tục khi phần tử hiện lại. Người bật `prefers-reduced-motion` không bị áp hiệu ứng này.
- Thay glow blur lớn 45px/50px/65px bằng radial gradient nhẹ; tắt animation nền body/admin có chi phí repaint; thay `transition: all` ở Admin nav bằng thuộc tính cụ thể.
- Thêm test `scripts/test-v60.3-phase0-performance.mjs`.

## Không nằm trong V60.3
- Chưa tạo Portal Registry / role shell dùng chung.
- Chưa gộp toàn bộ CSS về tokens/layers và chưa xử lý hết `!important`.
- Chưa lazy-mount toàn bộ Admin panels hoặc chia nhỏ Worker.
- Chưa đo Lighthouse/FPS trên điện thoại thật hoặc xác nhận D1 production.
