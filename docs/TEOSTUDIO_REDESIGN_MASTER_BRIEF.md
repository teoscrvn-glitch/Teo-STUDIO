# TEOSTUDIO — BRIEF TÂN TRANG GIAO DIỆN & ĐỒ HOẠ (cho ChatGPT làm)

Áp dụng trên bản **V60.3** (Phase 0 + perf quick-win đã xong). Đây là **Phase 2 + 4** của `docs/TEOSTUDIO_FIX_BRIEF.md`: tân trang toàn bộ giao diện, logo, hình ảnh, bố cục, animation — **không đổi API/logic/tiền**.

> Kèm theo gói này có **TeoStudio-Redesign-Kit** đã dựng sẵn và đã test: logo SVG, token CSS, component, motion, icon sprite, 2 trang mẫu chạy được (`preview/index.html`, `preview/dashboard.html`). ChatGPT phải **bám theo kit này**, không tự chế hệ khác.

---

## A. ĐÁNH GIÁ V60.3 (đã làm / chưa làm)

**Đã làm tốt:** 1 BUILD_ID, dọn 277 md + 37 html vào `docs/archive`, chuyển `admin-v7…v13` vào archive, thêm `performance-guard.css/js` (tắt backdrop mobile, tạm dừng animation ngoài màn hình), bỏ blur 45/50/65px.

**Còn nguyên (đo bằng `scripts/check-design-rules.mjs`):**

| Chỉ số | V60.3 | Mục tiêu |
|---|---|---|
| `!important` | **490** | 0 |
| Màu tím/hồng cũ (`#8b7cff`, `#9665f7`, `#db68c7`…) | **14** | 0 |
| Màu hex viết cứng trong CSS | **917** | ~0 (chỉ ở `tokens.css`) |
| `backdrop-filter` | 22 | ≤ 1 / trang, tắt mobile |
| Animation `infinite` | 17 | chỉ chạy khi trong màn hình |
| File CSS nạp mỗi trang | index 9 · seller 10 · admin 11 · tenant-admin **13** | ≤ 4 |
| File JS nạp mỗi trang | index 10 · seller 8 · admin **16** · tenant-admin 12 | ≤ 5 lúc đầu, còn lại lazy |
| Hệ màu | 2 hệ đánh nhau (v58 tím vs v60 xanh rêu) | **1 hệ duy nhất = tokens.css** |
| Logo | PNG mờ 525×210, icon bị cắt viền | SVG sắc nét (có sẵn) |
| UI_PREVIEW_FOR_APPROVAL (4 mẫu Sakura/Tiger/Cloud/Pixel) | toàn tím-hồng-neon | **Bỏ**, không dùng làm hướng |

→ V60.3 an toàn để làm nền. Việc còn lại là **thay lớp giao diện**, không phải sửa logic.

---

## B. NHẬN DIỆN THƯƠNG HIỆU MỚI (đã làm sẵn trong kit)

**Ý tưởng:** giữ đúng DNA cũ — vương miện + chữ **T** + vòng quỹ đạo, tông **xanh điện – bạc – vàng VIP** — nhưng làm phẳng, sạch, sắc nét, dùng được từ 16px đến 512px. Linh vật **Téo Linh** (tóc bạc, điểm cyan) hợp tông xanh nên giữ làm gương mặt thương hiệu.

| Thành phần | Quy định |
|---|---|
| Logo | `assets/brand/logo-wordmark-dark.svg` (nền tối), `-light.svg` (nền sáng), `logo-mark.svg`, `favicon.svg`. Chữ đã chuyển thành path (không cần font). **Không** kéo giãn, không đổi màu, không thêm hiệu ứng lên logo. Vùng an toàn = chiều cao vương miện. Cỡ tối thiểu: wordmark cao 28px, icon 16px. |
| Màu thương hiệu | Arc Blue `#4C8DFF` · Cyan `#2DD4EE` · Vàng vương miện `#F5C451` (**chỉ** cho VIP/premium) |
| Nền | `#07090E` → `#0E121B` → `#151B28` → `#1C2436` (xếp lớp, viền `rgba(255,255,255,.08)`) |
| Màu nhấn theo vai trò (60-30-10) | Master = xanh dương · Studio = teal · Seller = hổ phách · Người mua = xanh trời. Đổi bằng `data-role` trên `<body>` |
| Chữ | **Be Vietnam Pro** (OFL, thiết kế cho tiếng Việt) 400/500/600/700/800, **self-host WOFF2** (subset latin + vietnamese, ≤ 60KB), `font-display: swap`. Không dùng Google Fonts từ xa. |
| Icon | `assets/icons.svg` (sprite 33 icon nét 1.8px). **Cấm emoji làm icon điều hướng.** Cần icon mới: vẽ cùng style (24×24, stroke, bo tròn). |
| Bo góc | Chỉ 3 mức: 8 / 12 / 20px |
| Tuyệt đối cấm | gradient tím→hồng, neon, blur lớn, bóng đen đặc, mọi thẻ cùng một kiểu |

### Bộ hình ảnh cần làm thêm (ChatGPT tạo bằng image gen, tôi liệt kê spec)

Phong cách chung: *anime-sạch, tông xanh–bạc–cyan, nền tối trong suốt, KHÔNG tím/hồng, không chữ trong ảnh.* Xuất **WebP có alpha**, ≤ 60KB/ảnh, có bản 1x và 2x, đặt `width/height`.

| # | Ảnh | Kích thước | Dùng ở |
|---|---|---|---|
| 1 | Téo Linh **cắt nền trong suốt** (hiện file `teo-linh.webp` có góc trắng) | 800×800 | Hero trang chủ, avatar hệ thống |
| 2 | Téo Linh vẫy tay / chào | 600×600 | Trang đăng nhập, onboarding |
| 3 | Téo Linh cầm khiên (bảo mật) | 600×600 | Trang Chặn IP, xác thực, Free-key |
| 4 | Téo Linh cầm ví / tiền | 600×600 | Ví & rút tiền, Seller |
| 5 | Téo Linh cầm thư mục/link | 600×600 | Trang Share, tải file |
| 6 | Empty state: *chưa có file* · *chưa có dữ liệu* · *đã khoá VIP* · *lỗi 404* · *thành công* | 480×360 | Trạng thái rỗng của mọi panel |
| 7 | OG preview chia sẻ | 1200×630 (PNG) | meta og:image |
| 8 | Icon PWA/Android | 192, 512, 512-maskable (xuất từ `logo-mark.svg`) | manifest |
| 9 | Banner Seller / Studio VIP (vàng nhấn) | 1200×400 | Dải quảng bá VIP |

**Prompt mẫu cho ảnh (thay phần [POSE]):**
```
Anime character "Téo Linh": long silver-white hair, cyan crystal accessories,
black and white outfit with silver trim, soft cyan rim light. [POSE].
Clean flat-shaded illustration, transparent background, no text, no purple or pink,
dark-UI friendly, centered, high detail face, 1:1.
```

Thumbnail file mặc định (khi người bán chưa có ảnh): **gradient theo danh mục + icon** (đã có mẫu `.t1…t6` trong `preview/index.html`) — không tải ảnh, không lag.

---

## C. CẤU TRÚC DỄ TÌM (IA)

**Nguyên tắc:** người dùng mới phải làm được việc chính trong **≤ 2 chạm**; menu nhóm theo *việc*, không theo *kỹ thuật*; luôn có ô tìm kiếm.

### C1. Trang công khai (Người mua)
Header: Logo · Trang chủ · Tài nguyên · Vì sao Téo · Seller & Studio · Xếp hạng · [Đăng nhập] [Tạo Studio].
Mobile: logo + nút chính; điều hướng ở **drawer** (☰) có nhóm: Khám phá · Tài khoản · Kiếm tiền · Hỗ trợ.

Trang chủ (thứ tự khối — mẫu thật trong `preview/index.html`):
1. Hero: tiêu đề giá trị + **ô tìm kiếm lớn** + chip danh mục + 3 số liệu đếm + Téo Linh (vòng quỹ đạo + 2 chip nổi)
2. Rail danh mục (cuộn ngang, snap)
3. Lưới "Mới cập nhật" (thẻ có thumbnail, badge Mới/VIP, nút Tải/Mở khoá)
4. "Vì sao Téo" 3 thẻ
5. Dải Seller & Studio VIP (viền vàng) → dẫn tới dashboard
6. Bình luận / cộng đồng (gọn, phân trang)
7. Footer: logo, liên kết pháp lý, Zalo

### C2. Dashboard dùng **một khung chung** (mẫu thật trong `preview/dashboard.html`)
Desktop: sidebar 264px có nhóm + topbar + nội dung. Mobile: **bottom-tab 4 mục** (theo vai trò) + topbar.

| Nhóm menu | Master | Studio VIP | Studio Free | Seller | Người mua |
|---|---|---|---|---|---|
| **Vận hành** | Tổng quan · File & nội dung · Hiệu suất link · Hội viên | Tổng quan · File · Hiệu suất link · Hội viên | Tổng quan · File · Hiệu suất link | Tổng quan · Hiệu suất link | Tổng quan |
| **Tiền** | Hoa hồng · Ví & rút · Rút thẻ cào | Hoa hồng · Ví & rút · Rút thẻ cào | Ví 🔒VIP · Thẻ cào 🔒VIP | Hoa hồng · Ví & rút · Rút thẻ cào | — |
| **Hệ thống** | Quảng cáo · Quản lý Studio · Chặn IP/email | Quảng cáo · Chặn IP/email | — | — | — |
| **Hỗ trợ** | Thông báo · Báo lỗi · Cài đặt | Thông báo · Báo lỗi · Cài đặt | Thông báo · Báo lỗi · Cài đặt | Thông báo · Báo lỗi · Cài đặt | Thông báo · Báo lỗi · Cài đặt |

- Menu sinh từ **`MODULES` registry** (xem code trong `preview/dashboard.html`) → thêm tính năng = thêm 1 dòng, tự hiện đúng vai trò (đây là cách sửa lỗi "tính năng chỉ hiện bên Seller").
- Tính năng bị khoá theo gói → **hiện mờ + nhãn VIP + nút "Nâng cấp"**, không ẩn.
- Quyền thật vẫn gate ở Worker (`can(role, cap)`), UI chỉ phản chiếu.
- Master dùng bảng/bộ lọc dày thông tin; Studio nhấn "tác vụ nhanh"; Seller nhấn tiền & hoa hồng; Người mua nhấn thư viện đã mua. Mỗi vai trò **một thứ tự khối khác nhau**, không dùng chung công thức hero + 4 thẻ.

### C3. Wireframe từng trang (ChatGPT dựng theo, dùng component trong kit)

```
HOME            [Header: logo | nav | Đăng nhập | Tạo Studio]
                [Hero: H1 + search + chips + stats | Mascot]
                [Rail danh mục]
                [Grid file 3–4 cột]  ← reveal stagger
                [3 thẻ Vì sao] [Band VIP vàng] [Bình luận] [Footer]

DETAIL / SHARE  [Breadcrumb]
(trang file)    [Cột trái: ảnh/preview + mô tả + changelog]  [Cột phải sticky: Giá/nút Tải chính, link dự phòng, QR, báo lỗi]
                [File liên quan]   (mobile: nút Tải dính đáy màn hình)

DOWNLOAD/FREE-KEY  [Mascot nhỏ + tiến trình 2 bước (bar)] [Ô nhập key] [Nút] [Trạng thái rõ ràng idle/loading/success/error]

RANKINGS        [Tabs Tuần/Tháng/Mọi thời] [Top 3 bục podium] [Danh sách 4–50, hàng có avatar + số]

RENT (thuê Studio) [Hero] [So sánh Free vs VIP 2 cột, VIP viền vàng] [FAQ accordion] [CTA dính]

ACCOUNT         [Tabs: Đã mua · Hội viên · Ví · Cài đặt]  — dùng khung dashboard Người mua

SELLER / TENANT-ADMIN / ADMIN  → khung dashboard chung (C2)
```

---

## D. ANIMATION & ĐỒ HOẠ (đủ "vip", không lag)

Đã có sẵn trong `css/motion.css` + `js/motion.js` (~70 dòng, không thư viện). Danh mục hiệu ứng **được phép dùng**:

| Hiệu ứng | Cách làm | Chạy ở đâu |
|---|---|---|
| Reveal + stagger khi cuộn | `data-reveal` → `.is-in`, trễ 55ms/phần tử (tối đa 8) | thẻ, khối section |
| Vào trang | `.page-in` (fade + lên 8px) | `<main>` mỗi trang |
| Đếm số | `data-count="…" data-format="vnd"` | KPI, thống kê hero |
| Biểu đồ vẽ nét | `.draw` (stroke-dashoffset) + `.fade-area` | dashboard |
| Thanh tiến độ | `.bar > i` với `scaleX` | mục tiêu, free-key |
| Hover nâng thẻ | `translateY(-4px)` **chỉ** khi `(hover:hover)` | thẻ file |
| Nút: nhấn co + ánh sáng quét | `:active scale(.97)`, `::after translateX` | `.btn--primary` |
| Chip bật/tắt lò xo | `cubic-bezier(.34,1.56,.64,1)` | rail danh mục |
| Nổi nhẹ / vòng quay | `.float-a/.float-b/.ring-spin` + `data-live` | mascot, chip nổi |
| Chuyển panel | `teoSwitchPanel()` (View Transitions nếu có) | dashboard |
| Skeleton | pseudo-element `translateX` | khi tải dữ liệu |
| Toast | spring vào từ dưới | phản hồi thao tác |
| Chấm online | `.pulse` | trạng thái |

**Luật cứng (kiểm bằng script):**
1. Chỉ animate `transform` và `opacity` (ngoại lệ: `stroke-dashoffset` một lần).
2. Cấm `transition: all`; cấm `filter: blur` ≥ 30px; cấm blur trên phần tử đang chuyển động.
3. `backdrop-filter`: tối đa 1 chỗ/trang, **tắt trên mobile**. Topbar dùng nền đặc `color-mix` (đã làm).
4. Mọi animation `infinite` phải có `data-live` (JS chỉ bật khi trong màn hình và tab đang mở).
5. Nền ambient = **1 lớp radial-gradient tĩnh** (`body.has-ambient::before`), không animation.
6. `@media (prefers-reduced-motion: reduce)` tắt hết (đã có trong `motion.css`).
7. Hiệu ứng theo chuột chỉ khi `(hover:hover) and (pointer:fine)`. Gỡ `pointermove` trên cảm ứng.
8. Ảnh: WebP, `loading="lazy"`, `decoding="async"`, có `width/height`; ảnh hero `fetchpriority="high"`.
9. Danh sách dài: phân trang/cụm 20 hàng; section dài dùng `content-visibility:auto`.
10. Nếu muốn hiệu ứng nặng hơn (3D hạt, timeline): nạp **động** chỉ trang cần, khoá `devicePixelRatio ≤ 2`, giới hạn 60fps, dừng khi ngoài màn hình (theo skill `Skill5trong1`).

---

## E. KẾ HOẠCH TRIỂN KHAI (strangler — làm từng trang, trang cũ vẫn chạy)

**Bước 0 — Cài kit (không đổi trang nào)**
- Chép `css/tokens.css`, `components.css`, `motion.css`, `js/motion.js`, `assets/icons.svg`, `assets/brand/*` vào `frontend/assets/…`.
- Thêm `fonts/BeVietnamPro-*.woff2` (self-host) + `@font-face` trong `base`.
- Chạy `node scripts/check-design-rules.mjs frontend/assets/css` → ghi baseline vào `docs/DESIGN_BASELINE.md`.
- Tạo manifest + favicon + OG từ logo mới.

**Bước 1 — Trang công khai:** `index.html` (+`2.html` thành redirect) → `detail/product-detail-view` (1 file, file kia redirect) → `share` → `free/free-key/download` → `rankings` → `rent` → `earn/topup/intro`.
**Bước 2 — Dashboard khung chung:** làm `portal-shell.js` + `portal-registry.js` theo mẫu; chuyển **Seller** trước (nhỏ nhất), rồi **Tenant-admin**, cuối cùng **Admin**. Mỗi module cũ bọc lại, giữ hàm gọi API cũ.
**Bước 3 — Dọn:** khi trang đã chuyển xong, xoá CSS cũ tương ứng; đích cuối còn: `tokens.css`, `components.css`, `motion.css`, `portal.css`, `page-<tên>.css` (loại bỏ v58/v59/v60/pre-public/polish/rankings-modern…).
**Bước 4 — Nghiệm thu:** Lighthouse mobile, Playwright 390/768/1280, chạy toàn bộ `scripts/test-*`.

Mỗi bước là **một PR/zip riêng**, có thể quay lại.

### Bảng đổi tên class cũ → mới (để thay nhanh)

| Cũ (đang có) | Mới |
|---|---|
| `.btn.primary` / `.btn.ghost` / `.btn.full` | `.btn.btn--primary` / `.btn--ghost` / thêm `style="width:100%"` hoặc util |
| `.mini-btn`, `.seller-btn` | `.btn.btn--sm` |
| `.admin-card`, `.seller-panel`, `.tenant-row` | `.card` + `.row` |
| `.icon-btn` (☰, ×) | `.icon-btn` + `<svg class="i">` |
| `.eyebrow`, `.muted`, `.small` | giữ `.eyebrow`, `.muted`; `.small` → `font-size:var(--fs-sm)` |
| `.status`, `.notice-pill` | `.badge` / `.badge--ok` / `--warn` |
| `.tag-rail` | `.rail` + `.chip` |
| `.section-head` | `.section__head` |
| `.site-header`, `.drawer` | `.site-header`, drawer mới (cùng token) |
| Emoji 📊📦💰🛡️🔔🐞⚙ ở menu | `<svg class="i"><use href="/assets/icons.svg#…"/></svg>` |

---

## F. NGHIỆM THU (phải đạt mới coi là xong)

**Tự động**
- `node scripts/check-design-rules.mjs frontend/assets/css` → **PASS** (0 `!important`, 0 tím/hồng, 0 `transition:all`, 0 blur ≥ 30px).
- `node scripts/check-inline-js.mjs`, `check-local-refs.mjs`, `node --check cloudflare/worker.js`, toàn bộ `scripts/test-*` xanh.
- Playwright 390 / 768 / 1280: **không tràn ngang** (`scrollWidth ≤ innerWidth`), vùng chạm ≥ 44px, chữ thân ≥ 14px.

**Hiệu năng (ĐỀ XUẤT, cần đo trên máy thật)**
- Lighthouse mobile ≥ 85 cho `index`, `seller`, `tenant-admin`, `admin`.
- CSS ≤ 70KB, JS lần đầu ≤ 120KB mỗi trang. CLS < 0.1, INP < 200ms, LCP < 2.5s.
- Cuộn 60fps trên Android tầm trung; mở tab dashboard < 100ms.

**Nhìn bằng mắt** (ChatGPT chụp trước/sau)
- Mỗi trang có bố cục riêng theo vai trò; chỉ 1 màu nhấn/vai trò; không còn tím-hồng; logo mới ở header/footer/favicon/OG.
- Có đủ: reveal, đếm số, biểu đồ vẽ nét, chip, nút, toast, skeleton, empty-state có mascot.

---

## G. SKILL NÊN NẠP (từ bộ bạn gửi)

- **Luôn nạp:** `Skill5trong1.txt` (UI/anti-slop/motion). Đây là luật nền; kit này đã hiện thực hoá các điều chính (surface layering, 60-30-10, easing, stagger, 44px, `clamp()`, reduced-motion).
- **Chỉ nạp khi đụng tới:** `skillchitiet.txt` phần 2 (CSS design system) khi cần mẫu; phần 4 (chống bypass/key HMAC) chỉ khi sửa Worker — **không nạp cho việc giao diện**, tránh loãng chỉ dẫn.
- **Khi lệch nhau:** kit + brief này thắng skill (skill gợi cyan `#38BDF8` làm accent chung; brief dùng accent theo vai trò và Arc Blue làm thương hiệu).
- Repo hỗ trợ (đọc `SKILL.md` trước khi cài): `anthropics/skills` (frontend-design, webapp-testing), `Leonxlnx/taste-skill`, `nextlevelbuilder/ui-ux-pro-max-skill`, `addyosmani/web-quality-audit`, `obra/superpowers` (verification-before-completion).

---

## H. PROMPT DÁN CHO CHATGPT

**1) Thiết lập phiên (dán 1 lần, kèm `Skill5trong1.txt`, brief này, kit zip, zip V60.3):**
```
Bạn là Principal Front-end Engineer + Art Director cho dự án TeoStudio V60.3
(Cloudflare Worker + D1 + HTML/CSS/JS tĩnh, người dùng chính trên Android).
Nhiệm vụ: tân trang TOÀN BỘ giao diện theo TEOSTUDIO_REDESIGN_MASTER_BRIEF.md
và TeoStudio-Redesign-Kit. Kit là chuẩn thiết kế duy nhất — không tự chế token/màu mới.
Luật cứng: không đổi API, D1 schema, auth, thanh toán, rút tiền, Link4M/BumX, SePay, Telegram.
Giữ mọi tính năng hiện có; chỉ đổi lớp giao diện/cấu trúc hiển thị/hiệu năng.
Làm TỪNG BƯỚC ở mục E, mỗi lượt chỉ 1 trang hoặc 1 nhóm nhỏ.
Mỗi lượt phải: (1) liệt kê file sửa, (2) đưa file hoàn chỉnh (không "// giữ nguyên"),
(3) chạy node scripts/check-design-rules.mjs + test, (4) chụp ảnh 390 & 1280 trước/sau,
(5) báo kết quả pass/fail thật. Không báo "xong" nếu chưa chạy.
```

**2) Bước 0 (cài kit):**
```
Làm BƯỚC 0 mục E: chép kit vào frontend/assets, thêm @font-face Be Vietnam Pro self-host,
tạo favicon/manifest/OG từ logo mới, chạy check-design-rules và lưu baseline docs/DESIGN_BASELINE.md.
Không đổi trang nào.
```

**3) Một trang công khai (VD index):**
```
Làm lại frontend/index.html theo C1 + wireframe C3, dùng component trong kit
(preview/index.html là mẫu). Giữ nguyên id/class mà main.js/account.js cần
(liệt kê chúng trước khi sửa) và mọi chức năng: tìm, lọc tag, modal thông báo, donate, bình luận.
Đổi emoji → icon sprite. Bỏ các <link> CSS cũ không còn dùng. Trang chỉ nạp: tokens, components, motion, page-home.
Đặt data-reveal/data-count/data-live đúng luật mục D. Chụp 390/1280.
```

**4) Dashboard:**
```
Làm BƯỚC 2 mục E cho seller.html: dùng khung .shell + registry theo preview/dashboard.html.
Chuyển đúng các module Seller hiện có (hiệu suất link, hoa hồng, ví/rút, rút thẻ cào, thông tin nhận tiền)
sang module, giữ nguyên hàm gọi API trong seller.js. Chưa đụng Worker.
Khi xong, báo cáo ma trận role×module thực tế để tôi duyệt trước khi làm tenant-admin.
```

**5) Hình ảnh:** dùng prompt ở mục B, sinh lần lượt #1→#9, xuất WebP alpha ≤ 60KB, đặt vào `frontend/assets/img/brand/`.

---

## I. LƯU Ý TRUNG THỰC

- Kit đã render và kiểm trong trình duyệt headless ở 390px và 1280px, không tràn ngang, không lỗi console. **Chưa đo FPS/Lighthouse trên điện thoại thật** — Bước 0 + Bước 4 sẽ cho số thật.
- Logo mới là bản vector mình dựng theo DNA cũ, bạn có thể đổi nếu muốn; nếu đổi, giữ nguyên quy tắc ở mục B.
- Thumbnail trong trang mẫu là gradient + icon (không có ảnh thật). Ảnh sản phẩm thật do người bán tải lên, cần nén WebP phía client/Worker.
- Ảnh linh vật mới phải do bạn tạo bằng công cụ ảnh; mình đưa prompt nhưng không tạo ảnh bitmap mới ở đây.
- Mình chưa mở từng repo skill để kiểm giấy phép/nội dung hiện tại.
