# TeoStudio v56.20 — Purchase Marquee, Tenant Scoping & AI Fix

## Changes
- Moved the buyer purchase feed and TikTok/YouTube channel cards below the public comments on the main catalog and each tenant Share page.
- Reworked the purchase feed into a right-moving, continuous horizontal marquee. Each card shows the buyer profile avatar, display name and masked email, then the purchased item's thumbnail, title, amount and Vietnam-local timestamp.
- Main purchase feed queries only `scope='main'`; tenant feed queries only the current tenant ID and `scope='tenant'`. Both read up to 200 confirmed purchases and only expose masked emails. A missing user avatar uses the default avatar asset.
- Exempted the home, main/tenant Share, main detail, and tenant detail pages from the document-navigation rate guard so normal file opens do not fail. Other document paths retain the 40-per-10-second guard and receive an HTML wait page instead of raw JSON if triggered.
- Removed the `temperature` field from the Gemini OpenAI-compatible request payload; Gemini 3.8 Flash API migration guidance says to remove deprecated sampling parameters.
- Bumped the frontend/Worker build fingerprint to `v56.20-sales-marquee-detail-ai-fix`.

## Verification
Local JavaScript syntax and build/config checks are run before packaging. Live D1 records, Gemini credentials/quota, real mobile navigation, payments, and third-party link previews still require production verification. No deployment is performed by this package.
