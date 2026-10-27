# TeoStudio V56.42 — AI header and conversation list polish

- Fixed AI header layout so the avatar and “Téo hệ thống AI PRO” label sit on one row.
- Fixed header action layout: new chat, conversation list, and close (X) sit together at the upper-right.
- Hid the visible “Hiện chữ dần” checkbox; typewriter rendering remains enabled internally by default.
- Added a “＋ Chat mới” action inside the conversation-list panel.
- Conversation titles are automatically derived from each chat's first user message and shortened for mobile display.
- Improved the assistant's server-side system instructions for structured problem solving, image analysis, explicit uncertainty, and truthful reporting.
- Preserved existing image attachment flow and server-side authorization boundaries. This does not grant new account/admin privileges or bypass authentication.

## Verification

- `node --check frontend/assets/js/assistant.js`: passed.
- `node --check cloudflare/worker.js`: passed.
- Not deployed or tested against production API in this environment. AI connectivity still depends on valid Cloudflare Worker AI environment variables/secrets and a supported model endpoint.
