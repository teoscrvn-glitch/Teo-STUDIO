# V57.12 — TeoStudio destination / result page for Link4M

## Fixed
- Removed the extra `LINK4M_REWARDED_TRAFFIC_APPROVED=1` configuration gate that prevented the Link4M shortener flow from starting even though the Link4M URL-shortening API was configured.
- Link4M now follows the same one-time return-state flow as BumX: Worker creates a short URL whose destination is `https://teostudio.top/free-key.html` with a per-attempt state, tenant, browser proof and five-minute expiry.
- After redirecting back, the TeoStudio destination page automatically requests one key for the matching signed-in tenant session and original browser tab. A manual retry remains available for temporary network failures.
- The key is single-use, bound to the tenant session and has a separate five-minute redemption window. D1 remains authoritative for expiry and single-use checks.
- Updated the Free Admin status so Link4M is enabled when its API key and API URL exist; the previous disabled button was caused by the extra approval flag, not by a missing result page.

## Important limitation
- Neither URL-shortening API provides a verified ad-completion callback in this integration. TeoStudio only validates that the user returned with the correct unexpired state, tenant, session and browser proof. This is not independent proof that an advertisement was viewed or completed.
- `free-key.html` is TeoStudio's destination/result page; the provider still controls whether/how its shortened URL redirects to that destination.
