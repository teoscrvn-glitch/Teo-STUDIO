# TeoStudio Design Baseline — V60.3 + Redesign Step 0

Ngày kiểm tra: 2026-11-24. Đây là baseline tĩnh từ mã nguồn ZIP; không phải kết quả đo trên thiết bị Android thật.

## Phạm vi và số liệu

| Chỉ số | V60.3 trước khi thêm kit | Sau Step 0 | Mục tiêu brief |
|---|---:|---:|---:|
| CSS files trong `frontend/assets/css` | 21 | 24 | Sau migration: tối đa 4 CSS đầu trang + CSS riêng trang |
| `!important` | 490 | 490 | 0 |
| Màu tím/hồng cũ | 14 | 14 | 0 |
| Mã màu hex viết cứng | 917 | 917 | Gần 0 ngoài `tokens.css` |
| `backdrop-filter` | 22 | 22 | Tối đa 1/trang, tắt trên mobile |
| Animation `infinite` | 17 | 22 | Chỉ chạy khi phần tử trong viewport và tab đang mở |

Ghi chú: 5 animation bổ sung là từ kit (`float-a`, `float-b`, `ring-spin`, skeleton, pulse). Các animation mới đã được sửa để mặc định pause và cần `data-live` + trạng thái visible do `motion.js` điều khiển. 17 vòng lặp còn lại thuộc CSS legacy, cần xử lý theo từng trang khi migration.

## Tải CSS/JS hiện tại

| Trang | CSS refs | JS refs |
|---|---:|---:|
| `index.html` | 9 | 10 |
| `seller.html` | 10 | 8 |
| `admin.html` | 11 | 16 |
| `tenant-admin.html` | 13 | 12 |

Step 0 chưa giảm số lượng CSS/JS trên từng trang vì chưa chuyển trang; việc gỡ stylesheet cũ sẽ thực hiện sau khi trang tương ứng được migrate và kiểm tra đầy đủ.

## Kết quả checker

- Bộ CSS nền mới (`tokens.css`, `components.css`, `motion.css`): PASS các luật cứng — không `!important`, không màu tím/hồng cũ, không `transition: all`, không blur từ 30px, transition chỉ cho `transform`, `opacity`, `stroke-dashoffset` hoặc `none`.
- Toàn bộ `frontend/assets/css`: FAIL theo baseline legacy — 490 `!important`, 14 màu tím/hồng. Checker cũng báo 22 `backdrop-filter`, 22 animation vô hạn và 917 màu hex; backdrop/infinite/hex được báo dạng cảnh báo trong script hiện tại, không phải tất cả đều là hard-fail.
- Số CSS: 24 gồm 21 CSS V60.3 ban đầu và 3 CSS nền từ kit.

## Giới hạn đo kiểm

- Không có screenshot Playwright mới từ môi trường này: Chromium bị chặn bởi `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Brief đi kèm ghi kit đã được Claude render thử ở 390px và 1280px, nhưng đó không phải lượt render độc lập của bản tích hợp này.
- Chưa đo FPS, Lighthouse, CLS, INP hoặc LCP trên thiết bị Android thật.
- Các bài test trong `scripts/check-build.sh` là kiểm tra tĩnh/helper/SQLite mô phỏng. Chúng không kiểm thử live Cloudflare D1, thanh toán/provider callback, Telegram delivery hoặc thao tác trên thiết bị thật.
- Hai ZIP đầu vào không chứa binary Be Vietnam Pro WOFF2. Chưa thêm `@font-face` giả hoặc tải font từ xa; self-host font vẫn là việc cần hoàn thành trước khi coi typography đã chuyển đổi.
