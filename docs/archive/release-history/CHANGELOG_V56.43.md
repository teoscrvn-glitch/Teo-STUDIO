# TeoStudio V56.43 — AI capability and support upgrade

- Expanded the Téo hệ thống AI system instructions for broader practical tech support, including Android game data, iOS/iPadOS, Shizuku/ADB, app compatibility and error troubleshooting.
- Added explicit safety and confirmation rules for web actions and report drafting.
- Improved guidance for clickable HTTPS links, official sources, account/login requirements and ambiguous requests.
- Made provider errors generic instead of hardcoding Gemini in every message; API-key and model errors are distinguished when provider details support that diagnosis.
- Added OpenRouter request headers (`HTTP-Referer`, `X-Title`) when using an OpenRouter endpoint.
- Accepts compatible providers that return `message.content` as an array of text blocks.
- Raised response token budget and timeout moderately for more complete answers.

## Verification

Static JavaScript syntax checks passed. Live provider/API behavior was not tested because production Cloudflare secrets and API credentials are not available in this build environment. This does not grant arbitrary browser control: only the website actions already wired in the frontend can be invoked, and sensitive changes still require user confirmation.
