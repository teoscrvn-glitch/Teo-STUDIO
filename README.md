# Lại Húp File — Téo Studio rental v19

Bản này giữ lại giao diện/vibe chính nhưng bỏ toàn bộ hệ thống kiếm tiền, điểm, rút tiền, tài khoản, giới thiệu, duyệt nguồn và nhiệm vụ.

## Còn lại
- Trang chia sẻ file
- Tag / game và lọc file
- Tìm kiếm
- Chi tiết + link tải
- Popup thông báo
- Khu thông báo cập nhật (file / tag / video)
- Video MP4 trang trí trên đầu trang: đã cài sẵn link Téo cung cấp
- Admin: thêm/sửa/xóa file
- Admin: thêm/sửa/xóa tag
- Admin: sửa thông báo
- Admin: sửa vài thông tin giao diện
- Dữ liệu dùng chung qua Cloudflare Worker + D1

## Deploy
1. Tạo D1 và thay `YOUR_D1_DATABASE_ID` trong `cloudflare/wrangler.toml`.
2. Chạy: `npx wrangler d1 execute teo-studio-mini --remote --file=cloudflare/schema.sql`
3. Tạo secret: `npx wrangler secret put ADMIN_KEY`
4. Deploy Worker: `cd cloudflare && npx wrangler deploy`
5. Nếu Worker URL khác URL hiện tại, sửa `frontend/assets/js/config.js`.
6. Upload thư mục `frontend` lên GitHub Pages/hosting tĩnh.

Admin key chỉ được nhập trong trình duyệt admin và gửi qua HTTPS tới Worker. Không đặt ADMIN_KEY trong source frontend.


## Admin auth v2
Admin login uses the Cloudflare Worker Secret `ADMIN_KEY` only. Enter that Admin Key in the Admin login screen; D1 stores only the temporary admin session token.

## v3.0 update
- Vietnam time is formatted at the UI layer (`Asia/Ho_Chi_Minh`) without rewriting existing D1 timestamps.
- Real product view tracking + daily site/product/outbound analytics.
- Admin dashboard: today totals, 30-day/1-year history, per-file views and outbound counts; auto-refreshes every 3 minutes.
- Public comments at the bottom of the home page, with 10-minute auto-refresh.
- Parent/sub-tag hierarchy; tag creation is now inside File / Code instead of a separate admin section.
- Donate Téo button + configurable QR in Admin > Giao diện.
- UI/button/card animations with reduced-motion support.
- Video tries autoplay with sound first; browsers that block audible autoplay fall back to muted playback with the sound toggle.


Admin auth in this rental build: the master Admin login uses the Cloudflare Worker Secret `ADMIN_KEY`; D1 is used for admin sessions/data and is not the master password source.


## V18 rental update
- Fixed the Admin blank-page issue caused by malformed HTML in the settings panel.
- Rental Center now shows the create-tenant form, creation result, credentials and both tenant links.
- Master Admin: search by ID, renew, change password, lock/unlock, open tenant Admin/Share, and delete tenant data.
- Tenant Admin expanded with files, hide/show, comments hide/show/delete, parent/sub-tags, analytics, settings, password change and fixed-ID display.
- File lists start at 9 items and add 10 at a time; comment lists start at 5 and add 10.
- Tenant Share and the main home page use the same 9-file / 10-more pattern; comments start at 5.
- Tenant expiry warning is shown within 7 days and during the 6-day grace period.
- After the 6-day grace period, the scheduled Worker cleanup removes the tenant account, sessions, files, tags, comments, settings, views and audit data.
- Cloudflare Cron is configured hourly in `cloudflare/wrangler.toml`.
- Existing D1 database ID and data are preserved; the Worker performs additive/safe schema setup.


## V19 hotfix
- Fixed D1 migration for older `tenant_accounts` tables that used `tenant_id` instead of `id`.
- Existing tenant IDs/data are preserved; the Worker adds `id` and backfills it from the legacy key.
- No D1 reset, DROP TABLE, or destructive migration is used.

## V20
- Rental D1 compatibility no longer assumes `tenant_accounts.id` exists. The Worker detects the account key (`id` or legacy `tenant_id`) and uses it dynamically.
- Legacy account rows are preserved; missing rental columns are added only when possible and populated additively.
- Tenant creation falls back to the legacy key when an older D1 cannot expose the new `id` column.
- Master tenant management, tenant sessions and password changes use the detected account key.
- Added animated glass/aurora/grid visual layer, hover lighting, animated cards/buttons and improved typography across public/admin/tenant pages.
- Cache-busting bumped to v20 for rental/public JavaScript.
