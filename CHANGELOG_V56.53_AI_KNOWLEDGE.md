# V56.53 — AI Knowledge & Web Context

- Reduced unnecessary refusals for benign coding, learning, creative work, personal game modding and defensive security; harmful credential theft, malware, fraud and unauthorized access remain disallowed.
- Added a D1-backed, admin-only AI knowledge base with create/list/delete endpoints and a mobile-friendly `/ai-training.html` UI.
- AI retrieves up to five relevant approved notes by keyword and injects them as reference context. The notes are treated as untrusted reference material, not instructions.
- Expanded the web-search trigger phrases. Live web lookup still requires the `TAVILY_API_KEY` Worker Secret and depends on provider availability/quota.
- No automatic training on private user chats. Admin manually curates knowledge to avoid poisoning, privacy leaks and false facts.
- No production deployment was performed by this ZIP. Deploy the Worker and frontend, then test AI and the knowledge page.

## Known limitation: Free bypass

The existing Free Admin unlock intentionally requires a provider endpoint that confirms completion server-side (`success: true`, `completed: true`, and the exact `state`). Link4M/BumX URL-shortening credentials alone do not prove that a user completed a step. Do not disable server-side verification or count a browser redirect as proof; that would allow forged unlocks and unearned rental days. Configure a provider that documents the verification callback contract before enabling the two-step bypass.
