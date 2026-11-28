from pathlib import Path
root = Path(__file__).resolve().parents[1]
front = root / 'frontend'

# Every public page with the product list must load the same mobile catalog fix.
for page in ('index.html', '2.html', 'share.html'):
    html = (front / page).read_text()
    assert 'catalog-mobile-v609.css?v=60.9' in html, f'{page}: missing shared catalog CSS'

css = (front / 'assets/css/catalog-mobile-v609.css').read_text()
assert '#productGrid.product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))' in css
assert '@media(max-width:560px){#productGrid.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))' in css
assert '@media(hover:none) and (pointer:coarse) and (max-width:1024px){#productGrid.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))' in css
assert '#productGrid .product-card>.product-body' in css and 'visibility:visible;opacity:1' in css
assert 'aspect-ratio:16/10' in css
assert 'animation:teoSalesRight 52s linear infinite' in css
assert '@keyframes teoSalesRight{from{transform:translateX(-50%)}to{transform:translateX(0)}}' in css
assert '@keyframes teoSalesEdge' in css

router = (front / 'assets/js/teo-navigation-v609.js').read_text()
assert "u.searchParams.set('embed','app')" in router
assert "history.pushState" in router and "#teo-rankings" in router
assert 'safeInternalReturn' in router and "u.searchParams.set('return'" in router
assert 'ai_id' in router and 'assistant_id' in router
assert "u.searchParams.set('source',location.pathname)" in router and "location.pathname+location.search+location.hash);return u.pathname+u.search" not in router
assert 'function addContext(url)' in router

# Leaderboard uses only the new presentation layer; legacy stacked overrides are not loaded.
rank = (front / 'rankings.html').read_text()
assert 'rankings-v609.css?v=60.9' in rank
assert 'rankings-modern.css' not in rank and 'rankings-modern-v60.css' not in rank

# Tenant-aware account return shortcuts remain on the account shell.
account = (front / 'account.html').read_text()
assert 'id="accountBackShare"' in account and 'class="account-brand"' in account

print('PASS V60.9: catalog CSS wired on main/legacy/tenant Share, phone/coarse two-column + desktop three-column, product content visibility, LTR sales marquee + animated edge, same-document leaderboard history, account return routing and AI/tenant ID preservation.')
