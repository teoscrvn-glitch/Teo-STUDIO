export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || url.origin;

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Admin-Token, X-Turnstile-Token",
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      /*
       * ============================================================
       * TURNSTILE CONFIG
       * ============================================================
       *
       * Worker Variables:
       * 0x4AAAAAAFM6DoL2w6HDogkC = Site Key
       *
       * Worker Secrets:
       * TURNSTILE_SECRET = Secret Key
       */

      const TURNSTILE_SITE_KEY = env.TURNSTILE_SITE_KEY;
      const TURNSTILE_SECRET = env.TURNSTILE_SECRET;

      /*
       * ============================================================
       * COOKIE / BOT CHECK
       * ============================================================
       */

      const BOT_COOKIE = "teo_bot_verified";
      const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 giờ

      function getCookie(name) {
        const cookie = request.headers.get("Cookie") || "";

        const parts = cookie.split(";");

        for (const part of parts) {
          const [key, ...value] = part.trim().split("=");

          if (key === name) {
            return decodeURIComponent(value.join("="));
          }
        }

        return null;
      }

      function base64urlEncode(data) {
        let binary = "";

        if (data instanceof Uint8Array) {
          for (const byte of data) {
            binary += String.fromCharCode(byte);
          }
        } else {
          binary = data;
        }

        return btoa(binary)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/g, "");
      }

      function base64urlDecode(str) {
        str = str.replace(/-/g, "+").replace(/_/g, "/");

        while (str.length % 4) {
          str += "=";
        }

        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
      }

      async function createSignature(data) {
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(TURNSTILE_SECRET),
          {
            name: "HMAC",
            hash: "SHA-256"
          },
          false,
          ["sign"]
        );

        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(data)
        );

        return base64urlEncode(new Uint8Array(signature));
      }

      async function verifySignature(data, signature) {
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(TURNSTILE_SECRET),
          {
            name: "HMAC",
            hash: "SHA-256"
          },
          false,
          ["verify"]
        );

        const signatureBytes = base64urlDecode(signature);

        return crypto.subtle.verify(
          "HMAC",
          key,
          signatureBytes,
          new TextEncoder().encode(data)
        );
      }

      async function createBotCookie() {
        const expires = Date.now() + COOKIE_MAX_AGE * 1000;

        const payload = String(expires);
        const signature = await createSignature(payload);

        return `${base64urlEncode(payload)}.${signature}`;
      }

      async function verifyBotCookie() {
        const cookie = getCookie(BOT_COOKIE);

        if (!cookie || !TURNSTILE_SECRET) {
          return false;
        }

        try {
          const [payloadEncoded, signature] = cookie.split(".");

          if (!payloadEncoded || !signature) {
            return false;
          }

          const payload = new TextDecoder().decode(
            base64urlDecode(payloadEncoded)
          );

          const expires = Number(payload);

          if (!Number.isFinite(expires)) {
            return false;
          }

          if (Date.now() > expires) {
            return false;
          }

          return await verifySignature(payload, signature);
        } catch {
          return false;
        }
      }

      /*
       * ============================================================
       * TURNSTILE PAGE
       * ============================================================
       */

      function turnstilePage(returnUrl = "/") {
        const safeReturnUrl =
          returnUrl.startsWith("/") && !returnUrl.startsWith("//")
            ? returnUrl
            : "/";

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
<title>Đang kiểm tra...</title>

<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer>
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #050505;
  color: white;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.box {
  width: min(420px, 100%);
  text-align: center;
  padding: 32px 24px;
  border-radius: 22px;
  background: #111;
  border: 1px solid #252525;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,#5865f2,#7c3aed);
  font-size: 30px;
  font-weight: 800;
}

h1 {
  margin: 0 0 10px;
  font-size: 22px;
}

p {
  margin: 0 0 24px;
  color: #999;
  line-height: 1.5;
}

#status {
  margin-top: 18px;
  color: #888;
  font-size: 14px;
}

.turnstile-wrap {
  display: flex;
  justify-content: center;
}
</style>
</head>

<body>

<div class="box">

  <div class="logo">T</div>

  <h1>Đang kiểm tra bảo mật</h1>

  <p>
    Vui lòng xác minh bạn là người thật
    trước khi vào Téo Studio.
  </p>

  <form
    id="verifyForm"
    method="POST"
    action="/__turnstile/verify">

    <input
      type="hidden"
      name="return"
      value="${safeReturnUrl.replace(/"/g, "&quot;")}"
    >

    <div class="turnstile-wrap">

      <div
        class="cf-turnstile"
        data-sitekey="${TURNSTILE_SITE_KEY || ""}"
        data-callback="turnstileSuccess">
      </div>

    </div>

    <div id="status">
      Đang chờ xác minh...
    </div>

  </form>

</div>

<script>
function turnstileSuccess(token) {
  const status = document.getElementById("status");

  status.textContent = "Đã xác minh. Đang vào Téo Studio...";

  const form = document.getElementById("verifyForm");

  let input = document.createElement("input");
  input.type = "hidden";
  input.name = "token";
  input.value = token;

  form.appendChild(input);

  form.submit();
}
</script>

</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        });
      }

      /*
       * ============================================================
       * TURNSTILE VERIFY
       * ============================================================
       */

      if (
        url.pathname === "/__turnstile/verify" &&
        request.method === "POST"
      ) {
        if (!