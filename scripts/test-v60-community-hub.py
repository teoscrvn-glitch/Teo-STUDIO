#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "frontend"
WORKER = (ROOT / "cloudflare/worker.js").read_text(encoding="utf-8")
DOCK = (FRONT / "assets/js/community-dock.js").read_text(encoding="utf-8")
DOCK_CSS = (FRONT / "assets/css/community-dock.css").read_text(encoding="utf-8")
THEME = (FRONT / "assets/css/v60-theme.css").read_text(encoding="utf-8")
RANK = (FRONT / "assets/js/rankings.js").read_text(encoding="utf-8")
TENANT_SHARE = (FRONT / "assets/js/tenant-share.js").read_text(encoding="utf-8")
TENANT_ADMIN = (FRONT / "assets/js/tenant-admin.js").read_text(encoding="utf-8")
CONFIG = (FRONT / "assets/js/config.js").read_text(encoding="utf-8")

def require(ok, message):
    if not ok:
        raise SystemExit("FAIL: " + message)

require("v60.0-community-hub-landing" in WORKER and "v60.0-community-hub-landing" in CONFIG,
        "Worker/config build identifiers must match V60")
require("new URL('/intro',r.url)" in WORKER and "p==='/index.html'" in WORKER and "new URL('/2'+u.search,r.url)" in WORKER,
        "Root landing and legacy catalogue routes missing")
require((FRONT / "intro.html").exists() and (FRONT / "2.html").exists(),
        "intro.html and 2.html must both exist")
require('href="/2"' in (FRONT / "intro.html").read_text(encoding="utf-8"),
        "Landing page must link to the preserved resource catalogue")
require("normalizeCommunityBoxes" in WORKER and "parsed.protocol==='https:'" in WORKER,
        "Community custom links must be normalized and HTTPS-only")
require("slice(0,12)" in WORKER and "communityBoxes" in WORKER,
        "Community links must be bounded and included in settings")
require("url:safeUrl(x.url)" in DOCK and 'inputmode="url"' in DOCK and "if(!raw||raw==='#')return ''" in DOCK,
        "Admin custom URL editor must normalize relative paths and reject empty/hash placeholders")
require("add('Thuê Share File','/rent.html'" in DOCK and "add('Zalo tư vấn thuê',settings.rentZalo" in DOCK,
        "Studio rental navigation and Zalo contact must be separate links")
require((FRONT / '2.html').read_text(encoding='utf-8').count('/account.html?tab=memberships') == 1,
        "Main catalogue membership menu entry must not be duplicated")
require("localStorage.setItem('teo:clickSound'" in DOCK and "backgroundMusicUrl" in DOCK,
        "Music and click sound preferences must be available in the hub")
require("teo-community-open #teoAiWrap" in DOCK_CSS and "body:not(.teo-community-open) #teoAiWrap{bottom:88px" in DOCK_CSS and r"\nbody.teo-community-open" not in DOCK_CSS,
        "AI bubble must sit above the community launcher and move while hub opens")
require("tcd-action-in" in DOCK_CSS and "rotate(360deg)" in DOCK_CSS,
        "Hub launcher rotation and staggered reveal effects missing")
require("-webkit-tap-highlight-color:transparent" in THEME and ".teo-ai-bubble" in THEME,
        "TeoStudio touch feedback / assistant palette missing")
require("const rankingHome=rankingTenant?'/share?tenant='+encodeURIComponent(rankingTenant):'/'" in RANK,
        "Ranking Home must preserve tenant Share context or return to root landing")
require("rankings.html?tenant=" in TENANT_ADMIN and "rankings.html?tenant=" in TENANT_SHARE,
        "Tenant Admin and tenant Share must preserve slug when opening rankings")
require("mountBackgroundMusic(site.backgroundMusicUrl)" not in (FRONT / "assets/js/main.js").read_text(encoding="utf-8"),
        "Old detached main music dock call must remain removed")
require("mountTenantMusicPlayer(s.backgroundMusicUrl)" not in TENANT_SHARE,
        "Old detached tenant music dock call must remain removed")

pages = ["intro.html", "2.html", "share.html", "admin.html", "tenant-admin.html",
         "seller.html", "rankings.html", "account.html", "tenant-detail.html"]
for name in pages:
    html = (FRONT / name).read_text(encoding="utf-8")
    require("community-dock.js?v=60.0" in html, f"{name} missing community dock")
require('id="support"' not in (FRONT / "2.html").read_text(encoding="utf-8"),
        "Old support/community panel must be removed from catalogue page")
require('id="support"' not in (FRONT / "share.html").read_text(encoding="utf-8"),
        "Old support/community panel must be removed from tenant Share")
require('/account.html?tab=memberships' in (FRONT / "2.html").read_text(encoding="utf-8"),
        "Main catalogue needs membership shortcut")
require('/account.html?tab=memberships' in (FRONT / "share.html").read_text(encoding="utf-8"),
        "Tenant Share needs membership shortcut")
require("themeAccent:tc.accent||'#49b8a9'" in TENANT_ADMIN and "safeAccent(t.accent)" in TENANT_SHARE,
        "Tenant theme defaults and purple/pink fallback must use Teo palette")

print("PASS: V60.0 community hub, root landing, tenant-aware ranking, membership nav, music controls, touch styling and HTTPS-only custom links.")
