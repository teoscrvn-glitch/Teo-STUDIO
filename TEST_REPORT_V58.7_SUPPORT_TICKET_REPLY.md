# Test report — V58.7 Support ticket reply

## Static checks
- `node --check cloudflare/worker.js`: PASS
- `node --check frontend/assets/js/account.js`: PASS
- `node --check frontend/assets/js/admin-v14.js`: PASS
- Confirmed additive schema migration uses `addColumnSafe`; no existing support report rows are dropped.
- Confirmed buyer report endpoint requires an authenticated buyer session and scopes rows by buyer ID (or matching email for guest-submitted reports).
- Confirmed Admin reply endpoint remains protected by `isAdmin`.
- Confirmed reply notifications are sent only when reply text changes.

## Not verified in this environment
- Live Cloudflare D1 migration and Production deployment.
- Actual email delivery for guest reports.
- End-to-end browser test with real buyer/Admin sessions.

Deploy to a staging Worker first, test a report from a buyer account, reply from Admin, then confirm the buyer sees the reply under Account → Báo lỗi của tôi and receives an in-site notification.
