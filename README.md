# Teo-STUDIO Rental Safe V25

V25 is a compatibility-focused rental build for the existing Cloudflare Worker + D1 `teo-studio` deployment.

## Important
- Keep the existing D1 database. No DROP TABLE / reset is used by the tenant features.
- Deploy `cloudflare/worker.js` to the same Worker/API currently used by the frontend.
- Existing tenant accounts and content are preserved.

## V25 changes
- Tenant Admin redesigned into 3 areas: Tổng quan, Nội dung, Cài đặt.
- Tổng quan combines analytics + recent activity.
- Nội dung combines File + Bình luận + Tag.
- Cài đặt combines appearance + password/security.
- Tenant Admin re-authentication before entering the management UI.
- Top-right rental countdown runs in days/hours/minutes/seconds.
- Avatar can be selected from the device gallery using a file picker; images are compressed before storage.
- File thumbnails can be selected from the device; file Game/Tag is selected from existing tenant tags.
- Tenant Share page follows the main Lại Húp File visual structure: hero, avatar/video, tags, product cards, comments, support, owner box, small ad, donate, announcement modal.
- Share page supports comment images.
- Share page supports tag filtering and 9 + 10 file pagination.
- File/comment hide/show remains available in Admin.
- Analytics supports today, 7 days, 1 month, and historical month lookup.
- Tenant settings add avatar video, donate, announcement, owner info, and small ad fields.
- Public tenant comment API returns a specific database error instead of only a generic failure.
- Added tenant password verification endpoint for Admin re-authentication.
- Tenant account key detection prefers the existing `id` column after additive migration, while still supporting legacy `tenant_id` schemas.

## Settings stored in tenant_settings
siteName, studio, heroTitle, heroText, avatar, avatarVideoUrl, groupLink, adminContact, announcementEnabled, announcementTitle, announcementText, donateTitle, donateText, donateQr, ownerName, ownerText, adText, adLink

## Deploy
Use the same Worker and D1 binding as production. Do not create or delete a new D1 for this build unless explicitly intended.
