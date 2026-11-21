# Notifications in V50

Notifications are user-specific and protected by the existing admin or tenant session. The browser never receives SMTP credentials.

- Admin notifications use recipient type `admin` and recipient ID `master`.
- Tenant notifications use recipient type `tenant` and the canonical tenant account ID.
- `read_at` is NULL until the user marks a notification read.
- The frontend polls every 30 seconds while a session exists. It does not use push notifications when the tab/browser is closed.
- OxMail email delivery and D1 web notifications are separate channels: D1 notifications can still be recorded if SMTP delivery fails.
