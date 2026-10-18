# TeoStudio V56.7 — PBKDF2 + legacy tenant login compatibility

Based on V56.6 Admin Route Fix. This release fixes the observed registration error caused by the Worker runtime rejecting PBKDF2 iteration counts above 100,000, and improves legacy rental-account login handling.

## Changes
- New buyer-account password hashes use PBKDF2-HMAC-SHA256 with 100,000 iterations, which is the maximum supported by the observed Worker runtime.
- Password verification validates the stored iteration count instead of attempting unsupported values.
- Tenant login can recognize legacy rental rows whose `password_hash` still contains the exact old plaintext password; on a successful login it immediately migrates the password to SHA-256 and synchronizes the identifier columns present in D1.
- Tenant login now displays clear error text and does not leave a failed session token behind if loading the admin dashboard fails.
- No tenant rows, rental records, D1 data, payment settings, or Worker secrets are deleted or reset.

## Important
- The account-registration PBKDF2 error should be fixed. Email verification still requires valid OxMail SMTP configuration. If `OXMAIL_SMTP_PASS` and the related SMTP settings are missing, registration may now report `EMAIL_SEND_FAILED` instead of the previous `SERVER_ERROR`; this is a separate, clearer failure.
- This package has local syntax/build checks only. It has not been deployed or tested against the live production D1/SMTP. Test on a Preview environment first.
- Existing buyer password hashes created with an unsupported 120,000-iteration setting cannot be verified by the current WebCrypto runtime. New hashes use 100,000 iterations. Rental/tenant admin passwords are a separate SHA-256 legacy system and are handled independently.
