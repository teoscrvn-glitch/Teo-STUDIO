# TeoStudio V58.11 — AI Tool Calling & Knowledge Upgrade

Base: V58.10 visual system + V58.9 backend/source baseline

## Delivered

- Added OpenAI-compatible function/tool calling to the existing Worker AI gateway. Existing `AI_API_URL`, `AI_API_KEY` and `AI_MODEL` settings remain in use; no new provider or database binding is required.
- Added a bounded agent loop: at most two tool rounds, at most three tool calls per round, followed by a normal synthesis response.
- Added read-only tools for public file search, Admin-approved AI knowledge lookup, optional Tavily web search, and allowlisted TeoStudio navigation.
- Added personal wallet/orders/Studio lookup tools only when the buyer session is authenticated and `ai_personalization_enabled` is enabled.
- Added current-Studio analytics tool only for a validated tenant-admin session matching the current Studio.
- Kept key delivery, purchases, wallet mutations, payouts, permissions, deletion and content editing out of the AI tool registry.
- Added a provider compatibility fallback: if a provider rejects the `tools` request format (HTTP 400/404 with a tool/function capability error), the Worker retries as a regular chat-completion request. The assistant still works in chat-only mode.
- Simplified the chat labels and welcome message. Removed the PRO/BETA badge copy from the customer-facing assistant header.
- No D1 migration, new Secret, AI binding, Durable Object or package install is required.

## Important limitations

- This does not train model weights. Admin-approved content is retrieved from the D1 knowledge base and inserted as reference context (RAG-style retrieval).
- Tool calling depends on the configured upstream model supporting the OpenAI-compatible `tools` format. Unsupported providers fall back to ordinary chat and cannot execute tools.
- Live web search requires the existing `TAVILY_API_KEY` Secret.
- Account-specific AI tools require the user to enable AI personalization. No account purchase or wallet history is sent through these tools without that opt-in.
- The local regression suite checks source wiring and permission gates. A live OpenRouter model call, Cloudflare D1 Production, Tavily, phone rendering and end-to-end user flow have not been exercised in this package.
