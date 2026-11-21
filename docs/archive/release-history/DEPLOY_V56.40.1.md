# Deploy V56.40.1

1. Unzip the full source. For Acode Preview, open `Teo-STUDIO-main/frontend/index.html` and use Preview.
2. Check that the main studio avatar and Téo Linh AI avatar render; the AI bubble should be above the bottom browser/editor controls on mobile.
3. Deploy using the existing Cloudflare Worker/Pages setup, preserving current D1 bindings and secrets.
4. This is a source-level fix. Acode Preview is not a full Worker/D1 environment, so API-dependent pages still require a deployed/test environment.
