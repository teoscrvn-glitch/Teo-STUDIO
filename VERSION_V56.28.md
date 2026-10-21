# TeoStudio V56.28 — Detail Clean-URL Routing Fix

## Root cause
Cloudflare Workers Static Assets defaults to `html_handling = "auto-trailing-slash"`: a path such as `/detail.html` redirects to `/detail`, while `/detail` resolves to `frontend/detail.html`. The Worker was explicitly asking the asset binding for `/detail.html` from inside the `/detail` handler, so the request could return a redirect/non-HTML response and trigger the fallback screen. In addition, the detail handler was placed after the shared `ensureSchema(e)` initialization, causing a browser navigation to run D1 schema work before returning the page shell.

## Changes
- Detail HTML handlers run before the shared D1 initialization for regular browser navigations.
- Both normal browser and crawler paths fetch the canonical clean `/detail` path from Static Assets.
- Crawler preview handler validates that the response is an actual HTML asset before injecting OG metadata.
- `html_handling = "auto-trailing-slash"` is explicit in Wrangler config.
- Fixed account/assistant scripts in `detail.html` and `product-detail-view.html` from invalid `//assets/js/...` URLs to `/assets/js/...`.
- Bumped detail/config cache version.
- Did not modify purchase validation, wallet, SePay, bypass verification, or anti-bypass enforcement logic.

## AI diagnostic note
The current `FAILED_PRECONDITION: User location is not supported for the API use` is returned by Google, not the page renderer. Cloudflare Worker egress/IP geolocation or Google project/account eligibility may cause it. The source code cannot truthfully claim to override that provider decision.
