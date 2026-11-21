# TEOSTUDIO V60.2 — BRIEF SỬA LỖI & NÂNG CẤP (đưa cho AI làm)

> Cách dùng: nạp file này + skill UI vào AI (Claude Code / Cursor / ChatGPT), rồi giao **từng PHASE một** (mục 7). Không giao cả đống một lúc.
> Số liệu bên dưới đo trực tiếp từ zip `TeoStudio-V60.2-Master-Product-Edit-Save-Fix`. Chỗ nào là đề xuất của mình thì ghi "ĐỀ XUẤT".

---

## 0. LUẬT CHUNG CHO AI (dán đầu mỗi phiên)

1. **Không viết lại từ đầu.** Giữ nguyên API (`/api/...`), D1 schema, auth/session, luồng thanh toán/rút tiền/Link4M/BumX. Chỉ sửa giao diện, cấu trúc, phân quyền hiển thị, hiệu năng.
2. **Giữ animation + đồ họa như cũ** (mascot Téo, SVG visual, hero, hiệu ứng hover/thẻ). Chỉ đổi *cách chạy* cho nhẹ (xem mục 5), không xoá hiệu ứng.
3. Mỗi lượt: nói file nào sửa, **diff nhỏ**, không dán lại cả file 100KB. Không `// ...giữ nguyên`.
4. Sau mỗi phase chạy: `node scripts/check-inline-js.mjs`, `node scripts/check-local-refs.mjs`, `node --check cloudflare/worker.js`, và các test `scripts/test-*` liên quan. Báo kết quả pass/fail thật.
5. Không đụng logic tiền / key / chữ ký trừ khi phase yêu cầu. Gate quyền **phải có ở Worker**, không chỉ ẩn nút ở frontend.
6. Mobile 390px là chuẩn chính (chủ dự án code trên điện thoại, user chủ yếu dùng Android). Vùng chạm ≥ 44px, chữ thân ≥ 14px.

---

## 1. HIỆN TRẠNG ĐO ĐƯỢC

| Hạng mục | Số đo |
|---|---|
| Trang HTML chính | 27 file trong `frontend/` (admin.html 58KB, tenant-admin.html 48KB) |
| CSS | 20 file trong `frontend/assets/css` (~336KB), thêm 1 bản `assets/css/style.css` ở gốc **khác** bản trong `frontend/` |
| `index.html` tải | **8 CSS + 9 JS** (~128KB CSS, ~164KB JS), trong đó `account.js` 70KB + `assistant.js` 27KB tải cả ở trang chủ |
| `admin.html` tải | **10 CSS + 15 JS** (~190KB CSS, ~163KB JS), có thêm `<style>`/`<script>` inline |
| `!important` | **≥ 460** chỗ trong 10 file CSS (admin-redesign-v59: 113, note-modern-v60: 94, style: 69, rankings-modern: 54, v60-theme: 51…) |
| `backdrop-filter` | 18 chỗ trong 11 file CSS (`style.css` 6 chỗ) |
| `filter: blur(...)` | 23 chỗ, có chỗ **45px, 50px, 65px** |
| Animation `infinite` | 20 chỗ (`style.css` 10, `admin.css` 4); 28 `@keyframes` |
| JS admin | `admin-v7` … `admin-v13` = 7 file chết (admin.html chỉ nạp `admin-v14`); `v8` và `v9` giống hệt nhau |
| `tenant-admin.js` | 100KB nhưng chỉ 227 dòng → dòng cực dài, template HTML nhét trong JS, rất khó sửa |
| `worker.js` | 603KB / 3990 dòng, 1 file duy nhất |
| Trang trùng | `2.html` gần như = `index.html` (khác ~12 dòng sau khi bỏ `?v=`); `detail.html` và `product-detail-view.html` **giống hệt nhau** |
| Tài liệu rác ở gốc | **277 file .md + 37 file .html** (CHANGELOG/DEPLOY/TEST_REPORT/VERSION…) |
| Cache-bust | Mỗi file một `?v=` khác nhau (57.0, 58.10, 59.0, 60.0, 60.1, 60.2, 61.0…) → dễ nạp lẫn bản cũ/mới |

---

## 2. LỖI CẦN SỬA (xếp theo ưu tiên)

### P0 — Phân quyền/tính năng lộn xộn (lỗi bạn nói)

**Triệu chứng:** yêu cầu "làm cho cả Master, Seller, Studio VIP" nhưng AI chỉ gắn vào Seller.

**Nguyên nhân gốc (thấy trong code):** mỗi vai trò là 1 trang tự code riêng, không có chỗ dùng chung:
- Master: `admin.html` + `admin-v14.js` (13 panel: dashboard, products, comments, security, privacy, tenants, withdrawals, card-withdrawals, card-rates, merchant-center, ads-config, notices, settings)
- Studio (Free/VIP): `tenant-admin.html` + `tenant-admin.js` (8 tab: overview, content, members, wallet, security, notifications, support, settings); VIP/Free chỉ tách bằng `planType==='free'` trong `applyPlanUI()` bằng cách `classList.toggle('hidden')` từng phần tử
- Seller: `seller.html` + `seller.js` (không có tab, một trang dài)
- Người mua: `account.html` + `account.js`

Đếm từ khoá trong HTML cho thấy lệch rõ:

| Tính năng | seller | tenant-admin | admin |
|---|---|---|---|
| Hiệu suất từng link | 4 | 1 | 0 |
| Rút bằng thẻ cào | 2 | **0** | 2 (chỉ duyệt) |
| Thông báo | **0** | 6 | 5 |
| Báo lỗi / support | **0** | 4 | 2 |
| Telegram | **0** | 2 | 2 |
| Quảng cáo | **0** | 5 | 8 |

→ Mỗi lần AI thêm tính năng là nó sửa đúng 1 file. Không có "đăng ký tính năng" chung.

**Cách sửa (ĐỀ XUẤT):**
1. Tạo `assets/js/portal-registry.js`: danh sách module, mỗi module khai báo `{id, label, icon, roles:['master','studio_free','studio_vip','seller','buyer'], scope:'all'|'own', mount(el, ctx)}`.
2. 1 shell chung (sidebar desktop / bottom-tab mobile) sinh menu **từ registry theo role**. Thêm tính năng = thêm 1 dòng registry, tự hiện đúng role.
3. Module dùng chung viết 1 lần, truyền `scope`: Overview/Thống kê, Hiệu suất link, Lịch sử hoa hồng, Ví & rút (VietQR + thẻ cào), Thông báo, Báo lỗi, QR chia sẻ, Chặn IP/email, Quảng cáo.
4. Worker: 1 hàm `can(role, capability)` dùng cho mọi route. Ẩn nút ở frontend chỉ là UX; quyền thật nằm ở Worker.
5. Thay `applyPlanUI()` bằng thuộc tính `data-requires="studio_vip"` / `data-plan="free"` → khoá bằng CSS + hiện nút **"Nâng cấp VIP"** thay vì ẩn mất (user biết có tính năng đó).

**Ma trận đích (ĐỀ XUẤT — bạn chỉnh trước khi giao AI):**

| Module | Master | Studio Free | Studio VIP | Seller | Buyer |
|---|---|---|---|---|---|
| Tổng quan/thống kê | toàn hệ thống | của mình | của mình | của mình | — |
| Hiệu suất từng link | tất cả | ✅ (cơ bản) | ✅ đầy đủ | ✅ | — |
| Lịch sử hoa hồng/doanh thu | tất cả | — | ✅ | ✅ | — |
| Ví & rút VietQR | duyệt | khoá + nút nâng cấp | ✅ | ✅ | — |
| Rút thẻ cào | duyệt + bảng phí | khoá | ✅ | ✅ | — |
| Thông báo | gửi + nhận | nhận | nhận | nhận | nhận |
| Báo lỗi / ticket | xử lý | gửi | gửi (ưu tiên) | gửi | gửi |
| Quảng cáo/vị trí | cấu hình | — | tuỳ chọn | xem | — |
| QR/chia sẻ link | ✅ | ✅ | ✅ | ✅ | — |
| Chặn IP/email | toàn hệ thống | — | của studio | — | — |
| Hội viên/membership | quản lý | — | ✅ tạo gói | — | xem đã mua |
| Telegram | ✅ | — | ✅ | ✅ | — |

### P0 — Sai lệch hệ thống thiết kế (lý do nhìn "mùi AI")

- Có **2 hệ màu đánh nhau**: `teo-visual-system.css` (tím `#8b7cff` + cyan) và `v60-theme.css` (xanh rêu/slate) — v60 phải ép bằng `!important` đè lên v58. Thêm `admin-redesign-v59`, `note-modern-v60`, `rankings-modern-v60`… cũng đè kiểu "patch chồng patch".
- `seller-premium.css` vẫn dùng **gradient tím→hồng** `linear-gradient(100deg,#9665f7,#db68c7)` (nút chính, icon) — đúng kiểu bị gọi là "AI slop", và trái với dòng chú thích "No violet/pink theme" của v60.
- Icon điều hướng bằng **emoji** (📊 📦 💰 🛡️ 🔔 🐞 ⚙ 💸 🎟 🏦 📣) → nhìn rẻ, lệch giữa Android/iOS.
- Chữ trong Seller **9–12px** (`.seller-panel-head p` 11px, `small` 10px, footer 10px) → khó đọc trên điện thoại.
- Mọi thẻ cùng bo 18px + cùng viền + cùng bóng; bố cục lặp "hero card → 4 stat → 2 cột" ở mọi trang → cảm giác template.
- Admin 13 panel nằm ngang trong 1 thanh, tên dài, không nhóm theo việc.

**Cách sửa:** mục 4.

### P0 — Lag

Nguyên nhân thật trong code (không phải đoán):
1. **Blur lớn**: `filter: blur(45/50/65px)` (vẽ lại cả lớp mỗi frame nếu có animation) + 18 `backdrop-filter` → chính thủ phạm tụt FPS Android tầm trung.
2. **20 animation `infinite`** chạy cùng lúc dù ngoài màn hình (`style.css` 10, `admin.css` 4, `intro.css` 2, `teo-experience.css` 2…).
3. `teo-visual-system.js` gắn `pointermove` + `requestAnimationFrame` cho hiệu ứng theo chuột — vô ích trên cảm ứng.
4. **Nạp thừa JS**: `account.js` (70KB) + `assistant.js` (27KB) + `community-dock.js` (14KB) trên mọi trang; admin nạp sẵn `note-studio`, `rental-master`, `merchant-admin`, `ads-admin`, `card-rates-admin` dù user chưa mở tab đó.
5. `body::before` `position:fixed` full-screen gradient + 8–10 file CSS chặn render.
6. `transition: all` (admin-redesign-v59) → animate cả thuộc tính nặng (layout).
7. `content-visibility` chỉ có ở 1/20 file CSS và không thấy lazy-mount tab → render hết DOM của 13 panel / 8 tab ngay lần đầu.

### P1 — Rác kỹ thuật làm AI sửa sai chỗ

- 7 file `admin-v7…v13.js` chết → AI dễ sửa nhầm file không chạy (đây có thể là lý do nhiều lần "sửa rồi mà không thấy đổi").
- `assets/css/style.css` (gốc) ≠ `frontend/assets/css/style.css`: 2 bản lệch nhau → không biết bản nào deploy.
- `2.html` ≈ `index.html`; `detail.html` = `product-detail-view.html` (giống hệt).
- 277 `.md` + 37 `.html` ở gốc → chiếm context của AI khi nạp repo. Gom vào `docs/archive/`, giữ lại `README.md`, `CHANGELOG.md` (gộp), `DEPLOY.md`, `SECURITY_PLAYBOOK`.
- `?v=` lệch nhau từng file → dùng 1 hằng `BUILD_ID` duy nhất, sinh lúc build/Action.
- Template HTML lớn trong chuỗi JS (`tenant-admin.js` 100KB) → tách thành hàm render nhỏ + file theo module.

### P1 — Mẫu lỗi lặp lại (dễ vỡ lại)

Changelog V59.3/V59.4/V60.2 đều là "sửa lưu sản phẩm": V60.2 xác nhận nguyên nhân là **hai trường cho cùng một dữ liệu** (`download_link` hiển thị vs `original_link` ẩn) nên giá trị cũ đè giá trị mới. Quy tắc cho AI: **mỗi dữ liệu 1 nguồn sự thật**; form không giữ hidden field trùng nghĩa; thêm test hồi quy cho mỗi lần sửa kiểu này (đã có `scripts/test-v60.2-master-product-edit-save.mjs`, giữ).

### P2 — Làm sau

- Tách `worker.js` thành module theo nhóm route (`routes/admin.js`, `routes/tenant.js`, `routes/seller.js`, `routes/pay.js`) — wrangler bundle được, không đổi hành vi. Chỉ làm khi có test chạy xanh trước/sau.
- Dọn migration/SQL, thêm index cho truy vấn thống kê nặng nếu đo thấy chậm.

---

## 3. BẢNG "CẦN GIỮ NGUYÊN"

- Toàn bộ API, schema D1, luồng Link4M/BumX/free key, SePay/VietQR, thẻ cào, commission, Telegram.
- Hình ảnh/mascot/SVG trong `assets/img` (chỉ tối ưu kích thước, không bỏ).
- Phong cách "có hoạt hoạ + đồ hoạ" — giữ: hero reveal, hover thẻ, chuyển tab, toast, skeleton, progress, số đếm.

---

## 4. HƯỚNG THIẾT KẾ MỚI (giữ đẹp, bớt "AI")

**4.1 Một design token duy nhất** (`assets/css/tokens.css`, ĐỀ XUẤT — lấy nền từ skill của bạn):
- Nền lớp: `--bg #09090B` → `--surface-1 #121623` → `--surface-2 #1A2032`; viền `rgba(255,255,255,.08)`.
- Chữ: chính `#F8FAFC`, phụ `#94A3B8` (đạt tương phản ≥ 4.5:1 trên nền).
- **Mỗi vai trò 1 màu nhấn** (quy tắc 60-30-10), thay cho tím-hồng:
  Master = xanh dương `#60A5FA`, Studio = teal `#2DD4BF`, Seller = hổ phách `#F0B95E`, Buyer = xanh lá nhạt. (Đã có sẵn cơ chế `data-teo-skin` — tái dùng, bỏ tím.)
- Thang cỡ chữ: 14 / 16 / 20 / 28 / 40 với `clamp()`. Khoảng cách bội số 4px. Bo góc 3 mức: 8 / 12 / 20 (không phải thẻ nào cũng 18).
- Cho **mỗi trang 1 bố cục riêng** theo việc: Master = bảng + bộ lọc dày thông tin; Studio = tổng quan + tác vụ nhanh; Seller = tiền/hoa hồng nổi bật; Buyer = thư viện/đã mua. Không dùng chung công thức "hero + 4 stat".

**4.2 Icon:** thay emoji bằng 1 bộ SVG (Lucide, inline sprite `icons.svg`). Giữ emoji chỉ trong nội dung do người dùng nhập.

**4.3 Điều hướng:** desktop sidebar có nhóm; mobile **bottom-tab 5 mục + "Thêm"**. Master chia nhóm: *Vận hành* (Tổng quan, File/Code, Bình luận) · *Tiền* (Duyệt rút, Thẻ cào, Phí thẻ, Merchant) · *Studio* (Thuê Share File, Quảng cáo, Thông báo) · *Hệ thống* (Bảo mật, Quyền dữ liệu, Giao diện).

**4.4 Gộp CSS:** `tokens.css` + `base.css` + `components.css` + `portal-<role>.css` + `page-<name>.css`. Xoá hết file "patch" (v59/v60/polish) sau khi gộp; **đích: 0 `!important`** (cho phép vài chỗ cho utility `.hidden`). Dùng `@layer reset, tokens, base, components, portal, page, utilities;` để hết cần `!important`.

---

## 5. ANIMATION — GIỮ ĐẸP NHƯNG NHẸ

Quy tắc kỹ thuật (từ skill của bạn + kiểm chứng):

1. Chỉ animate `transform` và `opacity`. Cấm `transition: all`. Easing: vào `cubic-bezier(.16,1,.3,1)` 250–450ms; hover 150–200ms; lò xo `cubic-bezier(.34,1.56,.64,1)` cho nút/toggle.
2. **Hiệu ứng nền/glow:** thay `filter: blur(45–65px)` + animation bằng **ảnh gradient tĩnh** (`radial-gradient` hoặc WebP/AVIF đã dựng sẵn) + chỉ trôi `transform`. Không `blur` trên phần tử đang animate.
3. `backdrop-filter`: tối đa **1 phần tử** (topbar/dock), **tắt trên mobile** (`@media (max-width:820px){backdrop-filter:none; background:var(--surface-1)}`).
4. Animation `infinite` chỉ chạy khi trong viewport: `IntersectionObserver` bật/tắt class `.is-live`; tab ẩn thì `animation-play-state:paused`.
5. Hover/mouse-follow chỉ bật khi `@media (hover:hover) and (pointer:fine)`. Trên cảm ứng: bỏ `pointermove`.
6. `@media (prefers-reduced-motion:reduce)` — hiện đã rải rác ở 14 file CSS; gom về 1 chỗ trong `base.css`, tắt infinite + giảm transition.
7. Reveal khi cuộn: `IntersectionObserver` một lần (không scroll listener), stagger 40–60ms, tối đa 8 phần tử/lần.
8. `content-visibility:auto; contain-intrinsic-size:auto 600px` cho panel/section dài; `contain: layout paint` cho thẻ lặp.
9. Danh sách dài (file, lịch sử, hội viên): phân trang hoặc render theo cụm 20, không đổ 500 hàng.
10. Ảnh: WebP/AVIF, `loading="lazy"`, `decoding="async"`, có `width/height`. Hero chính `fetchpriority="high"`.
11. Nếu cần hiệu ứng "xịn" thật (số đếm, chuyển trang, timeline): dùng GSAP/`motion` nạp **động** chỉ trang cần, không nạp toàn site.

**Ngân sách hiệu năng (ĐỀ XUẤT, đo bằng Lighthouse mobile giả lập Moto G Power):**
- Performance ≥ 85 trên `index`, `seller`, `tenant-admin`, `admin`.
- JS lần đầu ≤ 120KB/trang (hiện ~164KB), CSS ≤ 70KB/trang (hiện ~128–190KB).
- Cuộn 60fps trên Android tầm trung; INP < 200ms; CLS < 0.1; LCP < 2.5s.
- Đang tìm/lọc trong admin: thao tác phản hồi < 100ms.

---

## 6. REPO / SKILL NÊN DÙNG (chọn ít, đúng việc)

Lấy từ danh sách `VoltAgent/awesome-agent-skills` trong cấu hình của bạn — **mình chưa mở từng repo để kiểm tra nội dung/giấy phép hiện tại, bạn đọc `SKILL.md` của từng cái trước khi cài**.

| Việc | Nên dùng |
|---|---|
| Thiết kế chống "AI slop" | `anthropics/skills` → `frontend-design`, `theme-factory`; `Leonxlnx/taste-skill`; `nextlevelbuilder/ui-ux-pro-max-skill`; `dembrandt/dembrandt-skills` (hierarchy, typography) |
| Ép AI làm theo từng bước, kiểm trước khi báo xong | `obra/superpowers` → `systematic-debugging`, `verification-before-completion`, `writing-plans`; `mattpocock/skills` |
| Hiệu năng web | `addyosmani/web-quality-audit`, `performance`, `core-web-vitals`, `accessibility`; `cloudflare/web-perf` |
| Animation | `greensock/gsap-performance`, `gsap-core`, `gsap-scrolltrigger` (chỉ khi thật sự dùng GSAP) |
| Cloudflare Worker/D1 | `cloudflare/workers-best-practices`, `cloudflare/wrangler`, `cloudflare/cloudflare` |
| Bảo mật trước khi mở public | `cloudflare/security-audit-skill`, `trailofbits/insecure-defaults`, `trailofbits/sharp-edges` |
| Test giao diện thật | `anthropics/skills` → `webapp-testing` (Playwright), `testdino-hq/playwright-skill` |
| Quét lỗi site nhanh | `squirrelscan/squirrelscan` (SEO/perf/a11y) |

**Về 3 file skill bạn gửi:**
- `Skill5trong1.txt` (11KB, gọn): dùng cho **việc UI/animation** — hợp.
- `skil2100trong1.txt` (13KB) và `skillchitiet.txt` (30KB, "600+ dòng"): trộn UI + 3D + APK + chống bypass + DDoS trong 1 file. Nạp hết cho mọi việc sẽ **tốn context và làm AI loãng chỉ dẫn**; chuẩn skill khuyên thân < 500 dòng, mô tả nêu rõ *khi nào dùng*. → **Tách** thành: `ui-motion` (mục 2–3), `worker-security` (chống bypass/WAF), `android-build` (APK/Actions); mỗi việc chỉ nạp skill liên quan.
- Trong các skill đó có luật hay nên giữ nguyên làm chuẩn kiểm: chỉ animate `transform/opacity`, cấm `transition:all`, khoá `devicePixelRatio ≤ 2`, `prepare().bind()` cho D1, kiểm key/VIP ở server.

---

## 7. KẾ HOẠCH THEO PHASE (giao từng cái cho AI)

**PHASE 0 — Dọn & đo (không đổi giao diện)**
- Chuyển 277 `.md` + 37 `.html` rác vào `docs/archive/`; xoá `admin-v7…v13.js`; quyết định bản `style.css` đúng, xoá bản kia; xoá/redirect `2.html`.
- 1 `BUILD_ID`, bỏ `?v=` lẻ.
- Chạy Lighthouse + ghi baseline (LCP/INP/CLS/JS/CSS) cho 4 trang. Lưu `docs/PERF_BASELINE.md`.
- ✅ Xong khi: site chạy y như cũ, test `scripts/` xanh, có baseline.

**PHASE 1 — Perf quick-win (đổi ít nhìn thấy, hiệu quả lớn)**
- Mục 2 "Lag" #1–#7: bỏ blur lớn, giới hạn `backdrop-filter`, IntersectionObserver cho infinite, tắt pointermove trên touch, lazy-load JS theo tab/trang, `content-visibility`.
- ✅ Xong khi: đạt ngân sách mục 5, cuộn mượt trên Android thật.

**PHASE 2 — Token + gộp CSS**
- `tokens.css`, `@layer`, gộp CSS, về 0 `!important`, bỏ tím-hồng, icon SVG, tăng cỡ chữ Seller.
- Làm theo thứ tự: `seller` → `tenant-admin` → `admin` → `index` → còn lại. Mỗi trang chụp trước/sau 390px & 1280px.
- ✅ Xong khi: 1 hệ màu, mỗi vai trò 1 accent, animation vẫn còn.

**PHASE 3 — Portal registry + phân quyền**
- `portal-registry.js` + shell chung; chuyển dần module: Thông báo → Báo lỗi → Hiệu suất link → Hoa hồng → Ví/Rút → Thẻ cào → Quảng cáo.
- Worker: `can(role, cap)` cho mọi route liên quan; test cho từng cặp role×module (cấm Studio Free gọi API VIP, cấm Seller gọi API Master).
- ✅ Xong khi: ma trận mục 2 khớp thực tế; thêm 1 tính năng chỉ cần sửa registry.

**PHASE 4 — Bố cục từng vai trò + animation polish**
- Redesign bố cục theo 4.1 (mỗi vai trò khác nhau), nhóm menu Master, bottom-tab mobile.
- Thêm lại hiệu ứng theo quy tắc mục 5 (reveal, tab transition, số đếm, skeleton).
- ✅ Xong khi: Lighthouse đạt ngân sách + kiểm bằng Playwright ở 390px/768px/1280px, không tràn ngang.

**PHASE 5 (tuỳ chọn) — Tách worker.js, tách tenant-admin.js** theo mục P2.

---

## 8. PROMPT MẪU (copy dùng ngay)

**Mở đầu mọi phiên:**
```
Bạn đang sửa dự án TeoStudio V60.2 (Cloudflare Worker + D1 + HTML/CSS/JS tĩnh).
Đọc TEOSTUDIO_FIX_BRIEF.md. Tuân thủ mục 0 tuyệt đối.
Chỉ làm PHASE <N>. Không đụng phần ngoài phase.
Trước khi sửa: liệt kê file sẽ sửa + rủi ro. Sau khi sửa: chạy test mục 0.4 và báo kết quả thật.
Giữ nguyên animation/đồ họa, chỉ đổi cách chạy theo mục 5.
```

**Phase 3 (phân quyền):**
```
Mục tiêu: tính năng thêm 1 lần, hiện đúng role. Làm portal-registry.js + shell chung theo mục 2 P0.
Bước 1: chỉ làm module "Thông báo" và "Báo lỗi" chạy qua registry cho Master/Studio/Seller để chứng minh kiến trúc.
Bước 2: viết can(role,cap) ở worker.js và test role×module.
Dừng sau bước 2 và báo cáo trước khi chuyển module khác.
```

**Phase 2/4 (giao diện):**
```
Áp dụng mục 4. Không dùng gradient tím-hồng, không emoji làm icon, không thẻ nào cũng bo 18px.
Mỗi trang vai trò có bố cục riêng. Chữ thân ≥14px. Vùng chạm ≥44px.
Sau khi xong mỗi trang: chụp 390px và 1280px bằng Playwright, so trước/sau, liệt kê thay đổi.
```

---

## 9. LƯU Ý CÒN MỞ (cần bạn quyết)

1. **Ma trận quyền mục 2** là đề xuất của mình — bạn sửa ô nào sai với mô hình kinh doanh thật (VD: Studio Free có được xem hiệu suất link không?).
2. Màu nhấn từng vai trò (mục 4.1) — đổi nếu bạn đã có nhận diện.
3. Mình **chưa chạy site thật** (không có D1/Cloudflare ở đây) nên số FPS/Lighthouse là mục tiêu, chưa phải kết quả đo. Phase 0 sẽ cho baseline thật.
4. Việc đếm "tính năng thiếu" ở mục 2 dựa trên từ khoá trong HTML; một số tính năng có thể được dựng bằng JS lúc chạy, nên AI phải xác nhận lại bằng cách mở trang thật trước khi kết luận.
