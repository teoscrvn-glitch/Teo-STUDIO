# TeoStudio V57.1 — Hướng dẫn cập nhật trên Android/Termux

## A. Trước khi thay mã nguồn

1. Vào Cloudflare Dashboard → D1 → `teo-studio` và tạo bản sao lưu/export hiện tại. Giữ nguyên database ID và binding `DB`.
2. Lưu lại commit đang chạy ở production để rollback được.
3. Không xóa `.git`, không tạo D1 mới, không xoá Runtime secrets.
4. Giải nén ZIP V57.1. Cấu trúc đúng ở thư mục gốc phải có `cloudflare/`, `frontend/`, `scripts/`, `wrangler.toml` nằm trong `cloudflare/`.

## B. Chép vào repo đúng

Nếu repo nằm tại `~/Teo-STUDIO`:

```bash
cd ~/Teo-STUDIO
git status --short
```

Chép đè thư mục `cloudflare/`, `frontend/`, `scripts/` và các tài liệu V57.1 từ bản ZIP vào repo. Không chép ZIP vào bên trong `cloudflare/`; cấu trúc phải là `Teo-STUDIO/cloudflare/worker.js` và `Teo-STUDIO/frontend/index.html`.

Kiểm tra:

```bash
cd ~/Teo-STUDIO
./scripts/check-build.sh
git diff --stat
```

Nếu `git diff --stat` trống thì file chưa thay đổi trong repo, có khả năng đã chép nhầm vị trí hoặc đang ở nhầm repo. Vào GitHub, xác nhận commit mới nhất có file `cloudflare/worker.js` chứa `v57.1-unified-release-candidate`.

## C. Dry-run, commit và push

Nếu Wrangler có sẵn hoặc `npx` có Internet:

```bash
cd ~/Teo-STUDIO/cloudflare
npx wrangler deploy --dry-run
```

Nếu dry-run còn lỗi, dừng và sửa lỗi trước khi push. Khi qua kiểm tra:

```bash
cd ~/Teo-STUDIO
git add cloudflare frontend scripts README.md VERSION_V57_1.md DEPLOY_V57_1_MOBILE.md CONFIGURATION_V57_1.md TEST_REPORT_V57_1.md
 git commit -m "V57.1 unified release candidate"
git push origin main
```

Cloudflare Build Settings nên tiếp tục dùng Root directory `cloudflare`, Build command `None` và Deploy command `npx wrangler deploy` như hiện tại. `wrangler.toml` giữ `assets.directory = "../frontend"`.

## D. Sau khi Cloudflare Build thành công

1. Mở `https://teostudio.top/api/health`.
2. Xác nhận JSON trả `version: "v57.1-unified-release-candidate"`.
3. Nếu `payment.missing` liệt kê `SEPAY_BANK_CODE` hoặc `SEPAY_ACCOUNT_NUMBER`, Worker production thật sự chưa nhận các biến đó. Vào **Workers & Pages → teo-studio → Settings → Variables and Secrets → Production Runtime**, thêm/sửa đúng tên biến. Build variables không thay thế Runtime variables.
4. Nếu `turnstileMissing` không rỗng, kiểm tra `TURNSTILE_SITE_KEY` (Variable) và `TURNSTILE_SECRET` (Secret); widget phải cho phép `teostudio.top`.
5. Nếu AI/email/Telegram thiếu, thực hiện theo `CONFIGURATION_V57_1.md`.
6. Test `/api/health`, trang chủ, chi tiết file, login/register, email verification, top-up QR, webhook, balance ledger, purchase, link tải, share page và Admin. Test bằng đơn nhỏ; không chuyển lại lần hai cho một mã QR đang xử lý.

## E. Rollback

Nếu sau deploy có lỗi thanh toán: pause việc tạo top-up/đơn mới; ghi lại mã giao dịch; không cộng ví thủ công. Rollback Worker/Assets về bản production đã lưu. Không rollback hoặc restore cả D1 về bản cũ trừ khi hiểu rõ tác động dữ liệu, vì đơn mới có thể đã được ghi.
