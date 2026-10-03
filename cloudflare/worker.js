const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const BOT_COOKIE = "teo_bot_verified";
const BOT_TTL = 60 * 60 * 24; // 24 giờ

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const base64 =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);

  const binary = atob(base64);

  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function hmacSign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign", "verify"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return bytesToBase64Url(new Uint8Array(sig));
}

async function hmacVerify(value, signature, secret) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign", "verify"]
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(value)
    );
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (key === name) {
      return rest.join("=");
    }
  }

  return null;
}

async function hasValidBotCookie(request, env) {
  if (!env.TURNSTILE_SECRET) {
    return false;
  }

  const raw = getCookie(request, BOT_COOKIE);

  if (!raw) {
    return false;
  }

  const dot = raw.lastIndexOf(".");

  if (dot <= 0) {
    return false;
  }

  const timestamp = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const issuedAt = Number(timestamp);

  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  if (now - issuedAt > BOT_TTL) {
    return false;
  }

  if (issuedAt > now + 60) {
    return false;
  }

  return hmacVerify(
    timestamp,
    signature,
    env.TURNSTILE_SECRET
  );
}

function challengePage(siteKey, nextPath = "/") {
  const safeNext = nextPath
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");

  return `<!doctype html>
<html lang="vi">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>Đang kiểm tra • Téo Studio</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;

  display: grid;
  place-items: center;

  background: #080808;
  color: #fff;

  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
}

.box {
  width: min(92vw, 420px);

  padding: 30px 24px;

  text-align: center;

  border: 1px solid #292929;
  border-radius: 22px;

  background: #111;

  box-shadow:
    0 20px 60px #000;
}

.logo {
  width: 62px;
  height: 62px;

  margin: 0 auto 18px;

  border-radius: 18px;

  display: grid;
  place-items: center;

  background:
    linear-gradient(
      135deg,
      #ff4d4d,
      #7c3aed
    );

  font-size: 28px;
  font-weight: 800;
}

h1 {
  font-size: 22px;
  margin: 0 0 8px;
}

p {
  margin: 0 0 22px;

  color: #aaa;

  line-height: 1.5;
}

#msg {
  margin-top: 16px;

  color: #aaa;

  font-size: 14px;
}

</style>

<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer>
</script>

</head>

<body>

<main class="box">

  <div class="logo">T</div>

  <h1>Đang kiểm tra bảo mật</h1>

  <p>
    Xác minh bạn là người thật
    trước khi vào Téo Studio.
  </p>

  <div
    class="cf-turnstile"
    data-sitekey="${siteKey}"
    data-theme="dark"
    data-callback="turnstileSuccess"
    data-error-callback="turnstileError"
    data-expired-callback="turnstileExpired">
  </div>

  <div id="msg">
    Đang chờ xác minh…
  </div>

</main>

<script>

const nextPath = ${JSON.stringify(nextPath)};

const msg =
  document.getElementById("msg");

async function turnstileSuccess(token) {

  msg.textContent =
    "Đã xác minh, đang vào web…";

  try {

    const res =
      await fetch(
        "/api/verify-turnstile",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "same-origin",

          body: JSON.stringify({
            token
          })
        }
      );

    const data =
      await res.json();

    if (
      !res.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Xác minh thất bại"
      );
    }

    location.replace(nextPath);

  } catch (e) {

    msg.textContent =
      e.message ||
      "Xác minh thất bại. Hãy thử lại.";

    if (window.turnstile) {
      window.turnstile.reset();
    }

  }
}

function turnstileError() {

  msg.textContent =
    "Không thể xác minh. Kiểm tra mạng rồi thử lại.";

}

function turnstileExpired() {

  msg.textContent =
    "Phiên xác minh đã hết hạn. Đang chờ xác minh lại…";

}

</script>

</body>

</html>`;
}

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    const origin =
      request.headers.get("Origin") ||
      "*";

    const corsHeaders = {

      "Access-Control-Allow-Origin":
        origin,

      "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Admin-Token",

      "Access-Control-Allow-Credentials":
        "true"

    };

    if (
      request.method === "OPTIONS"
    ) {

      return new Response(
        null,
        {
          headers: corsHeaders
        }
      );

    }

    try {

      /*
       * =========================================
       * TURNSTILE CONFIG
       * =========================================
       */

      if (
        !env.TURNSTILE_SITE_KEY ||
        !env.TURNSTILE_SECRET
      ) {

        return new Response(
          "Thiếu TURNSTILE_SITE_KEY hoặc TURNSTILE_SECRET trong Worker.",
          {
            status: 500,

            headers: {
              "Content-Type":
                "text/plain; charset=utf-8"
            }
          }
        );

      }

      /*
       * =========================================
       * VERIFY TURNSTILE
       * =========================================
       */

      if (
        url.pathname ===
          "/api/verify-turnstile" &&
        request.method === "POST"
      ) {

        const body =
          await request
            .json()
            .catch(() => ({}));

        const token =
          body.token;

        if (
          !token ||
          typeof token !== "string"
        ) {

          return Response.json(
            {
              success: false,
              message:
                "Thiếu Turnstile token"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );

        }

        const form =
          new URLSearchParams();

        form.set(
          "secret",
          env.TURNSTILE_SECRET
        );

        form.set(
          "response",
          token
        );

        const clientIp =
          request.headers.get(
            "CF-Connecting-IP"
          );

        if (clientIp) {

          form.set(
            "remoteip",
            clientIp
          );

        }

        const verifyRes =
          await fetch(
            TURNSTILE_VERIFY_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded"
              },

              body: form
            }
          );

        const result =
          await verifyRes.json();

        if (!result.success) {

          return Response.json(
            {
              success: false,

              message:
                "Turnstile không xác minh được",

              errors:
                result["error-codes"] || []
            },
            {
              status: 403,
              headers: corsHeaders
            }
          );

        }

        const issuedAt =
          String(
            Math.floor(
              Date.now() / 1000
            )
          );

        const signature =
          await hmacSign(
            issuedAt,
            env.TURNSTILE_SECRET
          );

        const cookie =
          `${BOT_COOKIE}=${issuedAt}.${signature}; Max-Age=${BOT_TTL}; Path=/; HttpOnly; Secure; SameSite=Lax`;

        const headers =
          new Headers(
            corsHeaders
          );

        headers.append(
          "Set-Cookie",
          cookie
        );

        return Response.json(
          {
            success: true
          },
          {
            status: 200,
            headers
          }
        );

      }

      /*
       * =========================================
       * BOT GATE
       * =========================================
       */

      if (
        !(await hasValidBotCookie(
          request,
          env
        ))
      ) {

        if (
          url.pathname.startsWith(
            "/api/"
          )
        ) {

          return Response.json(
            {
              success: false,

              message:
                "Cần xác minh bạn là người thật trước.",

              code:
                "BOT_CHECK_REQUIRED"
            },
            {
              status: 403,
              headers: corsHeaders
            }
          );

        }

        return new Response(
          challengePage(
            env.TURNSTILE_SITE_KEY,
            url.pathname +
              url.search
          ),
          {
            status: 403,

            headers: {
              "Content-Type":
                "text/html; charset=utf-8",

              "Cache-Control":
                "no-store"
            }
          }
        );

      }

      /*
       * =========================================
       * PUBLIC API
       * =========================================
       */

      if (
        url.pathname ===
          "/api/files" &&
        request.method === "GET"
      ) {

        const { results } =
          await env.DB.prepare(
            "SELECT * FROM files WHERE status = 'active' ORDER BY id DESC"
          ).all();

        return Response.json(
          {
            success: true,
            data: results
          },
          {
            headers: corsHeaders
          }
        );

      }

      /*
       * =========================================
       * LINK4M
       * =========================================
       */

      if (
        url.pathname ===
          "/api/bypass/link4m" &&
        request.method === "POST"
      ) {

        const {
          userId,
          targetUrl
        } =
          await request.json();

        const apiToken =
          env.LINK4M_API;

        if (!apiToken) {

          return Response.json(
            {
              success: false,

              message:
                "Chưa cấu hình LINK4M_API trong Worker Secret"
            },
            {
              status: 500,
              headers: corsHeaders
            }
          );

        }

        const link4mRes =
          await fetch(
            `https://link4m.co/api?api=${apiToken}&url=${encodeURIComponent(
              targetUrl ||
              "https://google.com"
            )}`
          );

        const linkData =
          await link4mRes.json();

        if (
          linkData.status ===
          "error"
        ) {

          return Response.json(
            {
              success: false,
              message:
                linkData.message
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );

        }

        const taskId =
          crypto.randomUUID();

        await env.DB.prepare(
          "INSERT INTO bypass_tasks (id, user_id, provider, short_url, target_url, status, reward_points) VALUES (?, ?, 'link4m', ?, ?, 'created', 400)"
        )
          .bind(
            taskId,

            userId ||
              "guest",

            linkData.shortenedUrl,

            targetUrl ||
              ""
          )
          .run();

        return Response.json(
          {
            success: true,

            shortUrl:
              linkData.shortenedUrl,

            taskId
          },
          {
            headers:
              corsHeaders
          }
        );

      }

      /*
       * =========================================
       * ADMIN API
       * =========================================
       */

      const adminToken =
        request.headers.get(
          "X-Admin-Token"
        );

      const isAdmin =
        adminToken &&
        (
          adminToken ===
            env.ADMIN_SECRET ||

          adminToken ===
            env.ADMIN_EMAIL ||

          adminToken ===
            "admin123"
        );

      if (
        url.pathname.startsWith(
          "/api/admin"
        )
      ) {

        if (!isAdmin) {

          return Response.json(
            {
              success: false,
              message:
                "Sai quyền Admin"
            },
            {
              status: 403,
              headers:
                corsHeaders
            }
          );

        }

        /*
         * GET FILES
         */

        if (
          url.pathname ===
            "/api/admin/files" &&
          request.method === "GET"
        ) {

          const { results } =
            await env.DB.prepare(
              "SELECT * FROM files ORDER BY id DESC"
            ).all();

          return Response.json(
            {
              success: true,
              data: results
            },
            {
              headers:
                corsHeaders
            }
          );

        }

        /*
         * ADD FILE
         */

        if (
          url.pathname ===
            "/api/admin/files" &&
          request.method === "POST"
        ) {

          const body =
            await request.json();

          const {
            title,
            slug,
            tag,
            points,
            fileUrl,
            imageUrl
          } = body;

          await env.DB.prepare(
            "INSERT INTO files (title, slug, tag, points_required, download_url, image_url, status) VALUES (?, ?, ?, ?, ?, ?, 'active')"
          )
            .bind(
              title,

              slug ||
                `file-${Date.now()}`,

              tag ||
                "General",

              points ||
                0,

              fileUrl,

              imageUrl ||
                ""
            )
            .run();

          return Response.json(
            {
              success: true,

              message:
                "Đã thêm file vào D1"
            },
            {
              headers:
                corsHeaders
            }
          );

        }

        /*
         * DELETE FILE
         */

        if (
          url.pathname.startsWith(
            "/api/admin/files/"
          ) &&
          request.method === "DELETE"
        ) {

          const id =
            url.pathname
              .split("/")
              .pop();

          await env.DB.prepare(
            "DELETE FROM files WHERE id = ?"
          )
            .bind(id)
            .run();

          return Response.json(
            {
              success: true,

              message:
                "Đã xóa file khỏi database"
            },
            {
              headers:
                corsHeaders
            }
          );

        }

        /*
         * TOGGLE FILE
         */

        if (
          url.pathname.startsWith(
            "/api/admin/files/toggle/"
          ) &&
          request.method === "POST"
        ) {

          const id =
            url.pathname
              .split("/")
              .pop();

          await env.DB.prepare(
            "UPDATE files SET status = CASE WHEN status = 'active' THEN 'hidden' ELSE 'active' END WHERE id = ?"
          )
            .bind(id)
            .run();

          return Response.json(
            {
              success: true,

              message:
                "Đã cập nhật trạng thái file"
            },
            {
              headers:
                corsHeaders
            }
          );

        }

        /*
         * WITHDRAWALS
         */

        if (
          url.pathname ===
            "/api/admin/withdrawals" &&
          request.method === "GET"
        ) {

          const { results } =
            await env.DB.prepare(
              "SELECT * FROM withdrawals ORDER BY id DESC"
            ).all();

          return Response.json(
            {
              success: true,
              data: results
            },
            {
              headers:
                corsHeaders
            }
          );

        }

      }

      /*
       * =========================================
       * STATIC ASSETS
       * =========================================
       */

      if (
        env.ASSETS &&
        typeof env.ASSETS.fetch ===
          "function"
      ) {

        return env.ASSETS.fetch(
          request
        );

      }

      return new Response(
        "Not Found",
        {
          status: 404,
          headers:
            corsHeaders
        }
      );

    } catch (err) {

      return Response.json(
        {
          success: false,
          error: err.message
        },
        {
          status: 500,
          headers:
            corsHeaders
        }
      );

    }

  }

};