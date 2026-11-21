# TeoStudio V58.7 — Support ticket replies

- Added `admin_reply` and `replied_at` fields additively to `support_reports`; existing reports are preserved.
- Admin support report list now includes a reply editor. Saving a changed reply updates the ticket and sends an in-site notification to the authenticated report owner. For guest reports with an email address, the system attempts an email reply.
- Added authenticated `/api/account/support/reports` endpoint. It returns only reports belonging to the current buyer ID, plus guest reports whose email matches the signed-in account.
- Added Account → “Báo lỗi của tôi” view with report ID, status, original message, and Admin reply.
- Avoids sending duplicate notifications when Admin saves an unchanged reply.
- Existing Telegram notification on report submission remains unchanged.
