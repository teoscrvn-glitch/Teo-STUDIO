# TeoStudio V58.12 — AI Brain Upgrade

Base: V58.11 AI tool-calling + V58.10 page-specific visual system + V58.9 backend baseline.

## What changed

- Added a read-only `search_github_repositories` tool backed by GitHub's public repository Search API. It returns at most five public repository metadata records, filters non-HTTPS links, and never downloads or executes repository code.
- Improved D1 knowledge retrieval: Vietnamese normalization, preservation of short technical terms (`AI`, `UI`, `UX`, `API`, `D1`, `R2`, `QR`, etc.), limited synonym expansion, stronger title/tag weighting and a relevance score.
- Improved assistant response instructions: direct answers, task-specific technical structure, compatibility-first code changes, honest tool/source claims, and explicit distinction between GitHub stars and repository quality.
- Kept the existing chat UI, OpenAI-compatible AI gateway, Worker + D1 architecture, admin knowledge editor, account permissions and all read-only tool boundaries.
- Added local tests for retrieval ranking, short technical tokens, Vietnamese query expansion and safe GitHub repository results.

## What this is not

- This does not train model weights or make a weak model become a frontier model.
- D1 retrieval remains lexical/rule-based RAG; it is not vector embeddings or semantic vector search.
- GitHub search returns repository metadata only. It does not prove code quality, security, compatibility or license compliance. Read the README, license and relevant source files before integrating a repo.
- No account, wallet, order, payout, purchase, permission or content mutation is performed by the new tool.

## Runtime requirements

- Existing `AI_API_URL`, `AI_API_KEY`, `AI_MODEL` settings remain unchanged.
- Existing D1 binding `DB` remains unchanged.
- GitHub public search needs no new secret, but is subject to GitHub's unauthenticated API rate limits.
- Tavily remains optional and is still needed for general web search.
