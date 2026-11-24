# TeoStudio — Redesign Step 0 implementation report

## Scope completed
- Used `TeoStudio-V60.3-Claude-Phase0-Perf.zip` as the source baseline.
- Copied the supplied kit's `tokens.css`, `components.css`, `motion.css`, `motion.js`, 33-symbol icon sprite, and SVG brand assets into `frontend/assets/`.
- Added a PWA manifest and rendered 192px, 512px, maskable 512px icons from the supplied logo mark.
- Generated a 1200×630 OG preview from the supplied wordmark and replaced stale static OG image references where present.
- Updated favicon, Apple touch icon, manifest and theme-color metadata in frontend HTML heads only. Page body markup, APIs, D1, auth, Worker routes, payment, wallet, key, Seller commission and Link4M/BumX logic were not edited.
- Preserved the existing `teo-linh.webp` file; it already has an alpha channel and transparent corner pixels.
- Installed the supplied design-rule checker.

## Deferred / incomplete
- Be Vietnam Pro WOFF2 binaries were not included in either provided ZIP. The project contains a README showing the expected self-hosted files and official upstream source, but no broken `@font-face` URLs were added. Add and license the actual font files before declaring the font part complete.
- New CSS tokens/components/motion and `motion.js` are staged but deliberately not linked into pages yet. Step 1 will migrate one page at a time to avoid changing every page at once.
- This step does not remove the old Note module; its replacement is a separate product/IA decision and must not be disguised as a renamed Note.
- No new mascot pose set (#2–#6), seller banner, or additional custom illustration was generated in this asset-foundation step.

## Important route/runtime note
Cloudflare Workers serves `frontend/` as the static asset directory (`cloudflare/wrangler.toml`). The new `/assets/...` and `/manifest.webmanifest` paths therefore live in the served asset root.

## Audit và kiểm thử bổ sung
- Kiểm tra lại kit trước khi tích hợp: bản gốc có animation vô hạn chưa được gate bằng `data-live` và transition có thuộc tính ngoài `transform`/`opacity`. Đã sửa bản tích hợp trong `components.css` và `motion.css`; file ZIP kit gốc không bị thay đổi.
- Thêm `scripts/test-redesign-step0.mjs` và đưa vào `scripts/check-build.sh` thành bài `[40/40]`.
- Số liệu CSS, tải CSS/JS và giới hạn kiểm thử được ghi ở `docs/DESIGN_BASELINE.md`.
- Checker toàn bộ CSS vẫn báo FAIL do 490 `!important` và 14 màu tím/hồng legacy. Không được hiểu PASS của bộ CSS nền mới là toàn bộ website đã đạt chuẩn.
- Chromium trong môi trường này trả `net::ERR_BLOCKED_BY_ADMINISTRATOR`, nên không có screenshot mới; chưa có số FPS/Lighthouse từ điện thoại thật.
- Chưa có font WOFF2 trong các gói đầu vào nên font self-host còn pending.
