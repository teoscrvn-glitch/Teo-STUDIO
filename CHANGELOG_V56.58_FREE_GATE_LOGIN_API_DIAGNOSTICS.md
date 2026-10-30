# V56.58 — Free Gate Login + API Diagnostics

- Fix: after a valid tenant login, `FREE_BYPASS_REQUIRED` now opens the Free bypass gate instead of showing a generic "login succeeded but couldn't load admin data" error.
- Fix: Link4M/BumX shortener response parser accepts common top-level/nested URL fields and status variants.
- Fix: bypass UI shows the sanitized server error code returned by the Worker when link generation fails.
- Security note: Link shortening is not proof that a task was completed. The current return-state mechanism validates a one-time, expiring token, not provider-side task completion.
- Validation: Worker JavaScript syntax and ZIP integrity checked. Not deployed and not tested against live API secrets.
