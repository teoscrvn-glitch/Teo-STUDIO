# TeoStudio V56.30 — Teo AI Lightweight Mobile UI

## Changes
- Removed the large animated portrait/hero strip from the chat transcript area.
- Removed the small avatar from the chat header; header now prioritizes the assistant name and chat controls.
- Kept the character only on the floating launcher button, styled as a static circular portrait.
- Disabled decorative orbit/ring animation and removed the animated hero markup to reduce repaint work.
- Reduced backdrop blur, shadow intensity, and open/close transition duration.
- Preserved chat history, new-chat/history controls, report confirmation, and existing backend behavior.

## Verification limits
- JavaScript syntax and ZIP integrity should be checked before deployment.
- Not deployed to Cloudflare and not tested on the user's actual phone/browser.
- This release does not claim to fix tenant routing or purchase visibility beyond the previous V56.29 behavior.
