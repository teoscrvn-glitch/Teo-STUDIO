# TeoStudio V60.3 — Phase 0 repository & performance baseline

## Scope

Phase 0 không thay schema D1, auth/session, API nghiệp vụ, giá, key, thanh toán, rút tiền, Seller commission hoặc Link4M/BumX. Đây là bước đo và làm gọn mã nguồn trước các lần nâng cấp giao diện lớn.

## Đo trực tiếp từ V60.2 source

| Hạng mục | Đo được |
|---|---:|
| HTML trong `frontend/` | 26 |
| CSS trong `frontend/assets/css/` | 20 file / 259,459 bytes |
| CSS legacy `assets/css/style.css` ở root | 76,559 bytes (GitHub Pages legacy) |
| Tổng 2 vùng CSS | 336,018 bytes |
| `!important` trong 20 CSS frontend | 489 |
| `backdrop-filter` declarations | 20 |
| `blur(px)` declarations | 23; giá trị lớn nhất gồm 65px, 50px, 45px |
| CSS animation declarations có `infinite` | 21 |
| Worker | 603,221 bytes / 3,990 dòng |
| `account.js` | 69,596 bytes |
| `assistant.js` | 26,718 bytes |
| `tenant-admin.js` | 99,951 bytes / 227 dòng |
| `admin.html` | 57,818 bytes; nạp 10 CSS + 15 JS + 2 inline scripts |
| `tenant-admin.html` | 48,160 bytes; nạp 12 CSS + 11 JS + 1 inline script |
| `index.html` | 8 CSS + 9 JS + 1 inline script |

## Đối chiếu thêm

- `admin-v7.js` … `admin-v13.js` không được tham chiếu trong HTML frontend; chuyển sang `docs/archive/legacy-admin-js/` thay vì xoá nội dung.
- `detail.html` và `product-detail-view.html` có nội dung giống hệt, nhưng giữ cả hai URL để không phá liên kết cũ.
- `index.html` và `2.html` gần giống nhưng có title/canonical khác nhau; giữ cả hai.
- `assets/css/style.css` (root) khác `frontend/assets/css/style.css`; root được giữ cho GitHub Pages legacy, Worker dùng `frontend/` theo `cloudflare/wrangler.toml`. Không xoá bản nào ở Phase 0.
- Các query version CSS/JS trước đó không đồng nhất; V60.3 đồng bộ chúng về `?v=60.3` và metadata/Worker/config về một BUILD_ID.

## Phase 1 quick wins included in V60.3

- Tắt backdrop blur trên viewport mobile <= 820px.
- Thay blur glow lớn 45–65px bằng radial gradient tĩnh; giữ glow/hero visuals nhưng không blur full layer.
- Tắt animation nền body/admin vốn animate background/filter liên tục.
- Thay `transition: all` tại Admin nav bằng danh sách thuộc tính có thể animate.
- Thêm `performance-guard.js`: pause CSS animations infinite khi target ngoài viewport và khi document hidden; không áp dụng khi user bật `prefers-reduced-motion`.
- Hiệu ứng pointer depth cũ đã có gate `(hover:hover) and (pointer:fine)`, giữ nguyên.

## Giới hạn baseline

Lighthouse, FPS Android thật, LCP, INP và CLS chưa đo trong môi trường local vì không có D1/Cloudflare production/browser session của site. Các số trên là thống kê source tĩnh, không phải kết quả Lighthouse hoặc cam kết FPS.
