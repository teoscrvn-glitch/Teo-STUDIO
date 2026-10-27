# TeoStudio V56.40.1 — avatar / mobile AI visual fix

- Fixed AI avatar URL resolution using the actual `assistant.js` location instead of a root-absolute path, so Acode Preview and deployed Worker routes resolve the same bundled image.
- Added a bundled TeoStudio icon fallback for AI header/bubble avatar failures.
- Fixed the main studio avatar to resolve local asset paths from `document.baseURI` and fall back to the bundled icon if a saved D1 avatar URL is broken.
- Fixed the malformed default Open Graph image URL in `frontend/index.html`.
- Adjusted the floating AI bubble on mobile so it sits above the browser/editor bottom bars and its label/avatar stay within the visible button.
- No database schema, D1 data, or Cloudflare secrets were changed.
