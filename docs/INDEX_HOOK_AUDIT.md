# Index DOM Hook Audit — Bước 1

Nguồn kiểm tra: `frontend/assets/js/main.js`, `account.js`, `assistant.js`, `community-dock.js` trên V60.3. Các hook dưới đây được giữ nguyên; một số ID được tạo động bởi JS hoặc chỉ xuất hiện ở các trang khác, không bắt buộc đặt tĩnh trong `frontend/index.html`.

## main.js

**IDs:** `avatarMedia`, `closeNotice`, `commentAccountBtn`, `commentAccountStatus`, `commentCaptcha`, `commentCaptchaStatus`, `commentForm`, `commentsList`, `copyDetailShareUrl`, `detailPage`, `detailShareStatus`, `detailShareUrl`, `donateBtn`, `donateModal`, `donateQr`, `donateText`, `donateTitle`, `downloadBypass`, `downloadChoice`, `downloadDetails`, `downloadInstall`, `downloadOriginal`, `downloadPage`, `downloadWait`, `downloadWaitBar`, `downloadWaitCount`, `downloadWaitText`, `downloadWaitTitle`, `drawer`, `drawerBackdrop`, `drawerClose`, `emptyState`, `groupBox`, `heroText`, `heroTitle`, `mainPayStatus`, `mainPurchaseCaptcha`, `mainPurchaseCreate`, `mainPurchaseMessage`, `menuBtn`, `morePublicComments`, `morePublicProducts`, `muteNotice`, `nativeShareDetailUrl`, `newestBtn`, `noticeCount`, `noticeModal`, `noticeText`, `noticeTitle`, `notificationBtn`, `notificationModal`, `productGrid`, `products`, `publicCommentMore`, `publicProductMore`, `refreshMainPay`, `searchInput`, `socialChannels`, `studioAvatar`, `studioName`, `subTagRail`, `supportBox`, `tagRail`, `teoMusicDock`, `toast`, `videoSoundBtn`.

**Classes / state hooks:** `active`, `hidden`, `is-ready`, `main-pay-card`, `open`, `product-card`, `show`, `social-avatar-img`, `tag`, `teo-music-panel`.

## account.js

**IDs:** no fixed page-level ID selector in the source scan; account modal, tabs, purchase and top-up controls are generated dynamically by `account.js`.

**Classes / state hooks:** `active`, `hidden`, `open`, `show`, `teo-account-page-mode`, `teo-register-video-frame`.

## assistant.js

**IDs:** `teoAgentBack`, `teoAgentResult`, `teoAgentSearchForm`, `teoAgentToChat`, `teoAiAccount`, `teoAiAgentOpen`, `teoAiBack`, `teoAiBubble`, `teoAiClose`, `teoAiForm`, `teoAiHistory`, `teoAiHistoryClose`, `teoAiHistoryNew`, `teoAiHistoryToggle`, `teoAiImageFile`, `teoAiImagePreview`, `teoAiInput`, `teoAiMessages`, `teoAiNew`, `teoAiPanel`, `teoAiPickImage`, `teoAiRemoveImage`, `teoAiReport`, `teoAiSend`, `teoAiWrap`, `teoReportCaptcha`, `teoReportDraft`, `teoReportForm`, `teoReportStatus`.

**Classes / state hooks:** `is-typing-out`, `open`, `teo-ai-typing`.

## community-dock.js

**IDs:** `tcdCommunityEditor`, `teoAiWrap`, `teoCommunityDock`.

**Classes / state hooks:** `is-open`, `teo-community-open`.

## Notes

- `main.js` also references IDs belonging to detail/download/payment flows. Those are intentionally not inserted into the home page; those views render their own markup.
- `morePublicComments`, `morePublicProducts`, `teoMusicDock`, `videoSoundBtn`, product-card and tag nodes are generated dynamically where applicable.
- No IDs/classes listed above were renamed in the four JavaScript files. Search, parent/child tag filtering, notification modal, donate modal, comment form/list/pagination and community/AI dock entry points remain wired to their existing hooks.
