# TeoStudio V58.1 — Note Designer & Secure Flow

## What's new

- Replaced the basic Note form with a visual Note designer inspired by multi-step link/Note builders.
- Supports title, subtitle, body, tag label, CTA, cover image, custom accent colour and up to 8 ordered action steps.
- Quick-add actions for YouTube, Telegram, TikTok, Instagram, Facebook, X, Zalo, Discord, custom links and destinations.
- Five hand-authored SVG art directions: Notebook, Editorial, Arcade, Midnight and Pastel. Owners can upload a project cover image; the built-in vector artwork is the fallback.
- Adds a dedicated public page per Note: `note.html?tenant=<slug>&id=<note-id>`, with native share/copy support. Note cards in the Studio Share page link to their dedicated page.
- Supports optional, provider-neutral ad placement markers (`note_open`, `after_step`, `before_unlock`, `cta_click`) for future ad SDK integration. These markers are placeholders only; there is no ad provider SDK, impression callback, revenue settlement or reward payment in this release.

## Anti-bypass controls

- Step progress is stored in D1, scoped by tenant, Note and visitor hash.
- The Worker issues a random per-Note visitor token in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie; progress identity no longer trusts the editable `localStorage` device header.
- Per-Note session is separately signed by HMAC and stored in a second scoped `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Public Note payload exposes step names/platforms, not the private step destination URLs.
- The Worker issues a short-lived, one-time redirect ticket for the current step only. Ticket consumption is recorded server-side, and redirects are marked `no-store`.
- Worker enforces step order, ticket consumption and a minimum 5-second wait before accepting completion. Atomic conditional updates prevent duplicate completion races.
- Tenant CRUD operations remain tenant-scoped; Master Admin Note operations require Admin authentication.

## Boundaries / not included yet

- This records opening the step link and the user's confirmation after the wait. It cannot prove that a user actually followed a social account or joined a Zalo/Telegram/Discord group. That requires an official platform API, bot permission, or a trusted provider callback.
- A determined visitor can still automate the sequence or rotate device identifiers. The flow is designed to stop simple localStorage edits, direct step skipping, replayed tickets and unauthenticated unlock attempts; it is not an absolute bypass-proof guarantee.
- Note `tag` is currently a free-text label and is not yet linked to the tenant file-tag database.
- Advertising slots are reserved only. No impression/click tracking, provider validation, confirmed revenue attribution, tax/fee calculation or visitor cash reward is active.
- The separate purchase-quota reward task is not included because the current release does not yet have an independent file-purchase quota ledger.

## Retained from V58.0

- Account mobile layout correction.
- Free account: one Studio. VIP: maximum three Studios only when there is a currently active paid VIP Studio entitlement; an unpaid/pending order does not unlock the limit.
- Existing BumX → Link4M Free task state and card-top-up integration remain unchanged.
