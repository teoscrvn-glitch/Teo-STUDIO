# Deploy TeoStudio V60.3

## Trước khi deploy
1. Giữ lại ZIP V60.2 và backup D1 production. V60.3 không yêu cầu D1 migration.
2. Kiểm tra Git diff để chắc chắn không có `.env`, API key, token, mật khẩu hoặc secret trong commit.
3. Đảm bảo `VERSION.txt`, `cloudflare/worker.js` và `frontend/assets/js/config.js` cùng BUILD_ID `v60.3-phase0-performance-guard`.

## Kiểm tra local
```bash
node scripts/sync-build-id.mjs --check
node --check cloudflare/worker.js
node scripts/check-inline-js.mjs
node scripts/check-local-refs.mjs
bash scripts/check-build.sh
```

## Deploy
Cloudflare Worker dùng `cloudflare/wrangler.toml`; D1 binding, rate limits và vars hiện tại được giữ nguyên. Nếu deploy thủ công bằng Wrangler:
```bash
cd cloudflare
npx wrangler deploy
```
Nếu repo đang deploy tự động qua GitHub Actions/Cloudflare, push đúng branch deploy như quy trình hiện tại của bạn; tránh chạy hai quy trình deploy đồng thời.

## Smoke test sau deploy
- Mở `/`, `/2`, `/admin.html`, `/tenant-admin.html`, `/seller.html`, `/share?tenant=<slug>` và `/rankings.html` trên Android.
- Đảm bảo Share tenant tải được, Admin và Studio đăng nhập bình thường, menu/bong bóng/âm thanh vẫn hoạt động.
- Kiểm tra `X-Teostudio-Version`/meta version là V60.3, hard-refresh để bỏ cache cũ.
- Cuộn trang dài và mở/ẩn tab; kiểm tra animation nền không chạy vô ích khi ở ngoài viewport.
- Thử một giao dịch staging nếu có, nhưng không cần thử mua/rút tiền production để kiểm tra V60.3 vì phần nghiệp vụ tiền không thay đổi.

## Rollback
Triển khai lại Worker/frontend V60.2 từ ZIP backup. Không có migration mới nên không cần rollback schema D1.

## Giới hạn
Bộ test local không thay thế kiểm thử D1 production, payment callback thật hoặc đo Lighthouse trên thiết bị Android. `docs/PHASE0_REPO_AUDIT.md` ghi các số đo source tĩnh và giới hạn của baseline.
