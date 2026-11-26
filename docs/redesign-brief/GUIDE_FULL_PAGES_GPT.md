# TeoStudio — ĐẠI TU TOÀN BỘ TRANG (dán cho ChatGPT G9)

Mục tiêu: làm lại bố cục TẤT CẢ trang theo 1 hệ duy nhất, nhìn như sản phẩm do designer làm (kiểu Linear/Stripe dashboard + chợ file), KHÔNG giống "AI template". Giữ mọi tính năng + animation, không đổi API/D1/auth/thanh toán/Link4M/BumX/SePay/Telegram. Quyền kiểm ở Worker.

## 0. Cách làm (bắt buộc)
- Làm theo ĐỢT, mỗi đợt 1 zip + ảnh before/after ở 390px, 980px (Desktop-site, coarse pointer), 1440px. Không báo "xong" khi chưa có ảnh.
- Mỗi trang: tạo `page-<tên>.css` (@layer page) + sửa HTML dùng class component chung. XÓA link tới style.css/teo-experience/pre-public-polish/v60-theme/patch-* khỏi trang đã migrate; xóa file vá khi không còn trang dùng. Không thêm `!important`.
- Khung chung: `<header class="topbar">` + `<main class="page">` + `<nav class="tabbar">` (mobile) từ components.css. Bỏ hoàn toàn chữ "Lại Húp File" → "TÉO STUDIO".
- Thứ tự đợt: **A** khung+SVG+font → **B** detail/share/download/free/free-key → **C** account/topup/rent/earn → **D** seller/tenant-admin/tenant-detail → **E** admin/note/builder → **F** rankings/intro/legal/ai-training/2.html.

## 1. Luật "KHÔNG AI-LOOK" (kiểm từng trang theo checklist này)
CẤM:
1. Hero căn giữa + tiêu đề gradient to + 2 nút. Hero = trái, tiêu đề đặc, 1 dòng mô tả, ô tìm kiếm thật.
2. Hàng 3 thẻ đều nhau "icon tròn + tiêu đề + 2 dòng chữ" (feature cards). Thay bằng danh sách/bảng/số liệu thật.
3. Glassmorphism/blur/viền phát sáng/blob màu/lưới chấm nền trên mọi thẻ. Nền phẳng #07090E, thẻ #0E121B, viền 1px #1C2436, KHÔNG shadow màu. Glow chỉ 1 chỗ: nút primary hover.
4. Gradient chữ, gradient nút, tím/hồng. 1 accent Arc Blue #4C8DFF; vàng #F5C451 chỉ cho VIP; màu vai trò chỉ ở chấm/badge nhỏ.
5. Emoji làm icon, badge "✨ Mới", "🔥 Hot". Dùng icon sprite `.i` (20px).
6. Bo góc 24–32px mọi nơi, thẻ lồng thẻ lồng thẻ. Chỉ 3 cỡ bo: 8 (input/nút nhỏ), 12 (thẻ/nút), 999 (chip).
7. Copy kiểu quảng cáo: "Khám phá…", "Trải nghiệm…", "nhanh và rõ ràng". Viết như công cụ: "Tìm file", "Đơn gần đây", "Số dư", "Rút tiền".
8. Mọi thứ căn giữa + khoảng trắng khổng lồ. Căn trái, mật độ vừa, nhịp spacing 4/8/12/16/24/40 (không toàn 24).
9. Số liệu 0 / "Chưa có" chiếm cả khối. Dữ liệu rỗng → 1 dòng 40px + gợi ý hành động.
10. Animation trang trí liên tục. Chỉ: reveal 1 lần, count-up số, hover/press 120ms, skeleton, sheet trượt. `data-live` cho vòng lặp.
BẮT BUỘC (tạo cảm giác “thiết kế thật”):
- Hệ chữ: Be Vietnam Pro (self-host WOFF2 400/500/600/700, preload 1 file). Cỡ: 12 / 14 (thân) / 16 / 20 / 28. Số dùng `font-variant-numeric: tabular-nums`. Tiêu đề trang 20–24px đậm, KHÔNG 40px+.
- Mật độ: dòng danh sách 48–56px, bảng thu gọn trên mobile thành "thẻ dòng" 2 hàng (trên: tên + giá, dưới: meta muted).
- Phân cấp bằng độ đậm/độ sáng chữ, không bằng thêm khung. Phân tách bằng đường kẻ 1px, không bằng thẻ.
- Ảnh thật: thumbnail file tỉ lệ 16:9 `object-fit:cover`, có skeleton + `aspect-ratio` (chống nhảy layout); avatar chữ cái khi không có ảnh. Logo crown-T xuất hiện ở topbar, favicon, loading, empty state; Teo-linh chỉ ở trang chủ/giới thiệu/404, không lặp mọi trang.
- Trạng thái đủ bộ: loading (skeleton), rỗng, lỗi (nút Thử lại + mã lỗi nhỏ), thành công (toast 3s), disabled (VIP khóa: mờ + badge vàng + nút “Nâng cấp”).
- Chạm: nút ≥44px cao mobile, khoảng cách giữa các nút ≥8px, vùng bấm cả dòng.

## 2. Khung chung (Đợt A)
- **Topbar** 56px: [☰ drawer] [logo-mark + TÉO STUDIO] … [chuông] [avatar/Đăng nhập]. Không nút “Tạo Studio” to ở mọi trang; để trong menu + trang chủ.
- **Tabbar mobile** 4 mục theo vai trò: Khách/Buyer = Trang chủ · Tìm · Đơn · Tài khoản. Seller = Trang chủ · File · Doanh thu · Tài khoản. Studio = Trang chủ · Studio · Thuê · Tài khoản. Master = Tổng quan · File · Duyệt · Khác.
- **Nút nổi AI/Cộng đồng**: gộp 1 nút (FAB 44px) nằm `bottom: calc(68px + env(safe-area-inset-bottom))`, bên phải; không đè nội dung; ẩn khi bàn phím mở và ở trang thanh toán.
- **Global**: `svg:not([width]):not([height]){width:1.25em;height:1.25em}`, `.i{20px}`, `img{max-width:100%;height:auto}`, `button svg,a svg{flex:none}`; không SVG nào >24px ngoài hero/ảnh.
- **Desktop site trên điện thoại**: dùng media `(hover:none) and (pointer:coarse) and (max-width:1024px)` để ép bố cục mobile; container `max-width:720px;margin-inline:auto`.
- **Sheet/Modal** chung 1 component (trượt từ dưới, kéo đóng, focus trap).

## 3. Wireframe từng trang (mobile 390px; desktop ≥1024 = thêm cột phụ bên phải)
### index.html — Trang chủ
```
[topbar]
Tìm file, code, script…  [ô tìm kiếm 48px] 
chip: Tất cả | Game | Tool | Code | …  (cuộn ngang)
— Mới cập nhật —                    Xem tất cả
[thẻ dòng: thumb 56 | tiêu đề 1 dòng / game · 2.3k lượt | giá hoặc Free]  ×8
— Đơn gần đây —  (chỉ 5 dòng, "Xem thêm")
[Bảng xếp hạng tuần] 3 dòng top
[Cho thuê Studio / Kiếm tiền] 2 dòng link (không phải thẻ to)
```
Số liệu (tài nguyên/lượt xem/danh mục) = 1 dải chữ nhỏ dưới ô tìm kiếm, không phải 3 ô to. Hero ảnh Teo-linh: tối đa 120px bên phải ô tìm kiếm ở desktop, ẨN ở mobile.

### detail.html / product-detail-view.html — Chi tiết file
```
[topbar]  ← Quay lại | Game › Tag
[thumb 16:9]
Tiêu đề (20px, tối đa 2 dòng)
[badge Free/Mua/VIP] · 2.3k lượt · cập nhật 3 ngày trước · Seller: tên
[CTA chính 48px: MUA FILE – 49.000đ]   (hoặc: Lấy link tải)
[CTA phụ ×2 cùng hàng, ghost: Link gốc | Lấy link Seller]
— Mô tả — (thu gọn 4 dòng + "Xem thêm")
— Cảnh báo — (1 khối viền vàng nhạt, chữ 13px)
— Hướng dẫn video — (nếu tag có video, 1 dòng link)
— Bình luận — (danh sách dòng, ô nhập dính đáy trong sheet)
— File liên quan — 3 thẻ dòng
```
Một nút primary duy nhất. Không nút oval, không pill trắng. Sau khi bấm Mua: sheet thanh toán (ví / SePay QR), không chuyển trang.

### share.html / download.html / free.html / free-key.html — Luồng lấy link
Một layout “stepper”: tiêu đề file (thumb 48 + tên) → thanh bước 1-2-3 (nhỏ, 4px) → khối hành động 1 nội dung/lượt (đếm ngược, nhập key, bấm vượt link) → khối “Gặp lỗi?” (thu gọn). Không quảng cáo xen giữa nút chính; nút chính luôn cố định vị trí. Trạng thái: chờ / đang kiểm tra / thành công (nút Tải) / lỗi (Thử lại).

### account.html — Tài khoản (mọi vai trò dùng chung)
```
[avatar 48 | tên | vai trò badge | số dư  (Nạp ví)]
Tab ngang: Tổng quan · Đơn mua · Ví · Cài đặt (+ Seller/Studio theo vai trò)
Tổng quan: 2 chỉ số (Số dư, Đơn tháng) dạng dải; "Việc cần làm" (≤3 dòng)
Đơn mua: danh sách dòng 56px, lọc trạng thái, phân trang 20, bấm dòng → sheet chi tiết + nút Tải lại
Ví: giao dịch dòng 48px (+/− màu chữ, không nền), nút Nạp / Rút
Cài đặt: danh sách nhóm (Hồ sơ, Mật khẩu, Thông báo, Xóa dữ liệu), mỗi dòng mở sheet
```
Tab nào vai trò không có → hiện mờ + khóa kèm lý do, KHÔNG ẩn.

### topup.html — Nạp
Chọn số tiền (chip 6 mức + nhập tự do) → phương thức (SePay QR / Thẻ cào) → QR + nội dung CK có nút Sao chép → trạng thái tự cập nhật (poll 5s, dừng khi ẩn tab). Bảng phí thẻ: bảng 3 cột gọn.

### rent.html — Thuê Studio
Bảng giá 2 cột so sánh Free vs VIP (bảng thật, có dấu ✓ icon, không 3 thẻ gradient). Dưới: “Tạo Studio” form 3 trường. Quyền lợi VIP = danh sách 6 dòng.

### earn.html — Kiếm tiền
Danh sách nhiệm vụ dạng dòng (tên · thưởng · nút Làm), tiến độ hôm nay dải trên cùng, lịch sử rút gọn.

### seller.html — Seller
```
Dải: Doanh thu tháng | Chờ rút | Hoa hồng %   (3 số nhỏ, không thẻ to)
Tab: File · Đơn · Rút tiền · Link giới thiệu
File: danh sách dòng + nút "+ Thêm"; form thêm = sheet toàn màn hình
```

### tenant-admin.html / tenant-detail.html — Studio (Free/VIP)
Sidebar → drawer. Menu theo module registry: Tổng quan · File · Note · Share · Doanh thu · Cài đặt · (VIP: Tên miền, Tag riêng, Báo cáo…). Free thấy hết, module VIP khóa mờ + badge vàng + “Nâng cấp”. Trang chi tiết Studio công khai: banner 120px, logo, tên, danh sách file dạng dòng.

### admin.html — Master
Shell: sidebar 240px desktop / drawer mobile; nhóm menu: Tổng quan · Nội dung (File, Tag, Bình luận) · Tiền (Duyệt rút, Ví merchant, Bảng phí) · Hệ thống (Chặn IP, Quyền dữ liệu, AI, Thông báo, Giao diện). Tổng quan: dải KPI 2 cột, 1 biểu đồ doanh thu (cao 180px), “Cần xử lý” (đơn rút chờ, báo cáo) lên đầu. Panel dịch vụ (runtime check) thu gọn, mặc định đóng.

### note.html / builder.html
Note: danh sách ghi chú dòng + trình soạn full màn hình (toolbar dính trên), lưu tự động có trạng thái “Đã lưu”. Builder: form chia bước, xem trước nổi dạng sheet.

### rankings.html
Bảng top: hạng · thumb 40 · tên · lượt · giá. Tab Tuần/Tháng/Mọi lúc. Top 3 chỉ khác bằng huy hiệu số nhỏ, không bục podium.

### intro.html / 2.html / ai-training.html / legal (terms, privacy, cookie, refund, privacy-request)
Trang văn bản: cột chữ 680px, mục lục trái ở desktop, tiêu đề 24px, thân 15px/1.7. Intro: ngắn, 1 màn hình + liên kết. Không hero lớn.

## 4. Component cần có (components.css, dùng lại mọi trang)
`.row` (thẻ dòng) · `.stat-strip` · `.tabs` · `.sheet` · `.badge(.vip/.free/.role)` · `.btn(.primary/.ghost/.danger)` 44–48px · `.field` · `.empty` · `.skeleton` · `.toast` · `.table-card` (bảng→thẻ dòng mobile) · `.pager`. Mỗi component có 1 ví dụ trong `preview/`.

## 5. Hiệu năng (không lag)
`content-visibility:auto` cho danh sách dài; ảnh `loading=lazy decoding=async` + width/height; list >30 dòng phân trang; không `backdrop-filter` trên mobile; JS không chạy vòng lặp khi tab ẩn (`visibilitychange`); polling dừng khi ẩn; font preload 1 file; mỗi trang ≤3 file CSS.

## 6. Nghiệm thu mỗi đợt
1. Ảnh 390 / 980-coarse / 1440 cho mọi trang đợt đó, trước & sau.
2. Checklist §1 tick từng mục có chứng cứ (ảnh/dòng code).
3. Linter: `important` giảm, `purple-pink`=0, file mới 0 vi phạm cứng; `grep -r "Lại Húp File"` = 0 ở trang đã làm.
4. Kiểm tay: không có SVG >24px, không nút cao <44px, không cuộn ngang, danh sách dài đã cắt/phân trang, đủ trạng thái rỗng/lỗi/loading.
5. Ghi rõ phần CHƯA kiểm (backend/D1 live, thanh toán thật).
