# TeoStudio — BƯỚC 2: Detail/Mua file + Portal Admin/Studio/Seller (dán cho ChatGPT G9)

Bản V60.4.2 hiện tại: chỉ index.html + account dùng hệ mới (tokens/components/motion/page-home). Còn lại (detail, share, download, free-key, rankings, rent, earn, topup, seller, tenant-admin, admin, note) vẫn style.css cũ + vá chồng vá. !important tăng 490→512, tím/hồng còn 14, chưa có font Be Vietnam Pro. KHÔNG vá thêm kiểu chồng — MIGRATE.

## Luật cứng (giữ nguyên)
Không đổi API, D1, auth, thanh toán/rút tiền, Link4M/BumX, SePay, Telegram. Quyền kiểm ở Worker. Mobile 390px là chính; phải đúng cả "Desktop site" trên Android (media: `(hover:none) and (pointer:coarse) and (max-width:1024px)`). Giữ animation (chỉ transform/opacity, data-reveal/data-live). Linter `scripts/check-design-rules.mjs` không được tăng; file MỚI = 0 `!important`.

## Việc làm theo thứ tự (mỗi bước 1 zip, tự chụp ảnh 390px + 980px coarse bằng Playwright đính kèm trong docs/)
1. **Khóa SVG toàn cục** (base layer, mọi trang): `svg:not([width]):not([height]){width:1.25em;height:1.25em}` + `.i{width:20px;height:20px}` + `button svg,a svg{flex:none}`. Xóa icon đen khổng lồ ở trang chi tiết.
2. **detail.html + product-detail-view.html → page-detail.css (layer page)**: bỏ brand cũ "Lại Húp File" (dùng logo-mark + TÉO STUDIO); topbar giống index. Bố cục 1 cột mobile: ảnh/thumbnail (tỉ lệ 16:9, object-fit cover) → tiêu đề → giá/badge (Free/Mua/VIP) → 1 hàng CTA chính (MUA FILE) + CTA phụ (Link gốc, Lấy link Seller) cùng chiều cao 48px, bo 12px, KHÔNG nút hình oval khổng lồ. Chỉ 1 nút primary xanh Arc Blue; "Lấy link Seller" dùng ghost/amber (hết tím). Desktop-site: container max 720px, không cắt 2 cột.
3. **Danh sách "Đơn mua đã xác nhận" (home + account)**: chỉ hiện 5 dòng mới nhất, mỗi dòng 1 hàng cao ≤56px (avatar ẩn danh · tên file cắt 1 dòng · giá · "x phút trước"); nút "Xem thêm" mở sheet/trang riêng có phân trang 20/trang; gộp trùng (cùng file+người mua trong 10 phút). Không để list kéo dài trang.
4. **Nút Tài khoản nổi**: đưa vào bottom-nav hoặc topbar; nếu giữ nổi thì `bottom: calc(72px + env(safe-area-inset-bottom))`, không đè tiêu đề/nội dung; chừa `padding-bottom` cho trang.
5. **Admin (admin.html)**: dùng shell portal mới (sidebar → drawer mobile, tab ngang cuộn). Thẻ KPI chuẩn: label (12px muted) / số (22px) / phụ (11px) xếp dọc, lưới 2 cột. Biểu đồ rỗng → skeleton nhỏ hoặc "Chưa có dữ liệu" (≤120px), không để khoảng đen 300px. Dùng `admin-mobile-fix.css` làm khởi điểm rồi gộp vào components.css và xóa file vá.
6. **Registry quyền** (MODULES): Master / Studio Free / Studio VIP / Seller / Buyer — mỗi vai trò thấy đủ module của mình; module VIP khi khóa hiện mờ + badge VIP (không ẩn). Một Portal duy nhất, không tách "chỉ Seller mới có".
7. Font: tự host Be Vietnam Pro WOFF2 (400/500/600/700, subset vietnamese+latin), `font-display:swap`, preload 1 file.
8. Dọn: xóa `!important` ở file bạn đụng tới, thay bằng @layer; xóa màu tím/hồng còn lại → token.

## Nghiệm thu (đính kèm trong báo cáo)
- Ảnh trước/sau: detail, home (cuộn tới đơn mua), admin dashboard — ở 390px và 980px coarse. Không có SVG >24px ngoài ảnh/hero, không có nút oval, không chữ dính số.
- Linter: `important` giảm, `purple-pink` = 0 trên file đã migrate, file mới 0 vi phạm cứng.
- Báo rõ cái gì CHƯA kiểm được (backend/D1 live).
