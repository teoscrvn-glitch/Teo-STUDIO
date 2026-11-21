# TeoStudio V58.11 — AI Architecture Notes

## Runtime choice

Keep the existing Cloudflare Worker + D1 + static frontend. The existing OpenAI-compatible provider configuration is retained:

- `AI_API_URL`
- `AI_API_KEY` (Cloudflare Secret)
- `AI_MODEL`
- optional `TAVILY_API_KEY` for search

No provider key is included in this source package.

## AI request path

1. Worker authenticates the buyer/Admin Studio session.
2. It assembles only the context allowed for that identity and current Studio.
3. Admin-approved knowledge notes are retrieved from D1 by keyword and inserted as reference content.
4. When the configured model supports function calling, Téo receives a scoped list of read-only tools.
5. The Worker validates each tool name against a fixed allowlist, executes it server-side, adds the result to the model conversation, and asks the model to synthesize the answer.
6. The loop is bounded and cannot modify financial state or content.

## Tool list

- `search_teostudio_files`
- `search_teostudio_knowledge`
- `search_web` (only when Tavily is configured)
- `get_my_wallet`, `get_my_orders`, `get_my_studios` (only for an authenticated buyer who opted into AI personalization)
- `get_current_studio_overview` (only for a validated admin session of that exact Studio)
- `open_teostudio_page` (allowlisted relative destinations; suggestion only)

## Why not transplant a full chatbot application?

TeoStudio already has its own account system, D1 data model, tenant isolation, purchase logic, support flow and frontend. Replacing those pieces with a standalone AI app would duplicate authentication and data access. The official Cloudflare AI repository was used as an architectural reference for Workers-native model calls, tool calling, provider compatibility and retrieval. The existing Worker API contract was retained to minimize changes.

The Cloudflare Agents SDK is a possible later option for long-running/stateful workflows, but it introduces Durable Objects, class bindings and migrations. That is not necessary for this bounded read-only tool upgrade.
