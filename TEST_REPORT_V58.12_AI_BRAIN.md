# V58.12 AI Brain — Test Report

Date: 2026-11-12

## Automated checks

- `node --check cloudflare/worker.js` — PASS
- `node --check` for all frontend JavaScript — PASS
- Existing V58.11 AI tool-calling, permissions, tenant isolation and provider fallback tests — PASS
- New AI retrieval tests — PASS
  - short technical tokens (AI/UI/API/D1/R2/QR) are preserved
  - Vietnamese query expansion adds related technical terms
  - relevant Admin-approved D1 knowledge ranks above unrelated entries
  - internal database IDs are not returned to the model
- New GitHub search tests — PASS
  - public GitHub Search API request shape is correct
  - at most five results are returned
  - non-HTTPS repository URLs are filtered
  - repository metadata includes name, description, stars, language, license and update time
- Full `sh scripts/check-build.sh` — PASS (30/30 stages)

## Not tested in this environment

- Live OpenRouter/model tool-calling
- Live GitHub API rate limits and network behavior
- Production Cloudflare Worker and D1
- Tavily web search
- Real Android browser rendering and user acceptance

## Important model limitation

The deployed model selector remains `openrouter/free`. The patch improves retrieval and tool orchestration, not model weights. Free model routing can vary in answer quality and tool-call reliability. A fixed higher-quality model requires selecting a provider/model and confirming its cost and tool/vision support.
