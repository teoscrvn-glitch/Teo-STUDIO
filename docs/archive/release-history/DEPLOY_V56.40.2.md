# Deploy V56.40.2 — Mobile performance

1. Back up the current source and keep the existing Cloudflare secrets, D1 IDs/bindings, and production data unchanged.
2. Deploy the full source with the same Worker/static-asset configuration as the currently working release.
3. Hard-refresh the site / clear Acode Preview cache so `v=56.40.2` assets load.
4. On a phone, test scrolling with the AI closed, opening AI, opening saved chats, typing with the keyboard open, and sending a message.
5. If lag persists, capture a short screen recording and note whether it occurs on the live domain or only in Acode Preview. The current static checks do not measure real device frame rate or API latency.
