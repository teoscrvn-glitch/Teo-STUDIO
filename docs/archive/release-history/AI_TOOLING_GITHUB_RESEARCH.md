# GitHub research used for TeoStudio AI upgrade

## Primary reference: Cloudflare AI

Repository: https://github.com/cloudflare/ai

The official Cloudflare repository documents Workers AI provider adapters, AI Gateway provider routing, chat tool calling, embeddings and AI Search. Its `workers-ai-provider` and `ai-search-provider` documentation was used as a design reference for a Workers-compatible AI layer.

Useful references:

- https://github.com/cloudflare/ai/blob/main/README.md
- https://github.com/cloudflare/ai/blob/main/docs/workers-ai-provider/README.md
- https://github.com/cloudflare/ai/blob/main/docs/ai-search-provider/README.md
- https://github.com/cloudflare/ai/blob/main/docs/ai-gateway-provider/README.md

License reported by the repository: MIT (`LICENSE`).

## Secondary reference: Cloudflare Agents

Repository: https://github.com/cloudflare/agents

The Agents SDK provides persistent agents, tool calling, MCP, workflows and WebSocket chat on Durable Objects. It is a strong candidate for a later long-running agent/multi-step workflow release, but it is not transplanted into V58.11 because this release preserves the existing Worker + D1 architecture and avoids introducing Durable Object bindings/migrations solely for read-only tools.

## Integration decision

No third-party source files were copied into this release. Instead, the Cloudflare AI repository's provider-neutral tool-calling and Workers integration approach is adapted to TeoStudio's existing OpenAI-compatible `AI_API_URL` gateway. This minimizes framework changes and avoids replacing authentication, account data, D1 or the current chat UI.


## V58.12 decision: improve the existing brain without replacing the site

- `cloudflare/ai` (MIT) remains the primary architecture reference for Workers-compatible model/provider routing and tool calling. The current Worker already speaks the OpenAI-compatible chat-completions protocol, so importing the full Vercel AI SDK/provider packages would add a dependency and bundling change without being necessary for this focused upgrade.
- `cloudflare/agents` (MIT) is the stronger long-running agent framework: persistent state, tool calls, MCP, scheduling and human-in-the-loop workflows. It requires Durable Objects and a SQLite-class migration. Do not transplant it until TeoStudio explicitly needs persistent server-side agent jobs or real-time streaming; V58.12 keeps the existing Worker + D1 deployment intact.
- `danielmiessler/Fabric` (MIT) is a prompt-pattern library, not a trained model. Its task-specific prompt approach is used as a design reference for concise answer-quality rules; no third-party pattern files are copied.
- V58.12 adds a small, read-only GitHub repository search tool and improves the existing D1 lexical retrieval. This is not vector/embedding search and does not train model weights. Admin-approved knowledge remains the source of TeoStudio-specific facts.

References: https://github.com/cloudflare/ai · https://github.com/cloudflare/agents · https://github.com/danielmiessler/Fabric
