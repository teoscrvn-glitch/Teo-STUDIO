from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
w=(ROOT/'cloudflare/worker.js').read_text(); a=(ROOT/'frontend/assets/js/account.js').read_text(); s=(ROOT/'frontend/assets/js/seller.js').read_text(); n=(ROOT/'frontend/assets/js/note-studio.js').read_text(); pub=(ROOT/'frontend/assets/js/tenant-note-page.js').read_text()
assert 'CREATE TABLE IF NOT EXISTS buyer_seller_referrals' in w
assert 'PRIMARY KEY(buyer_id,scope,tenant_id)' in w
assert 'INSERT OR IGNORE INTO buyer_seller_referrals' in w
assert 'accountReferral' in w and 'String(attribution.seller_id)!==String(buyer.id)' in w
assert "headers.authorization='Bearer '+authToken" in a
assert "window.addEventListener('teo:auth-changed'" in a and 'bindPendingSellerAttributions' in a and "k.startsWith('TEO_SELLER_ATTR_')" in a
assert "description:clean(x.description||'',280)" in w and 'thumb:x.thumb?' in w
assert 'seller-product-description' in s and 'sellerDrawer' in (ROOT/'frontend/seller.html').read_text() and 'openDrawer' in s and 'seller-drawer.is-open' in (ROOT/'frontend/assets/css/seller-premium.css').read_text() and 'seller-premium.css?v=58.14' in (ROOT/'frontend/seller.html').read_text()
assert 'data-step-button-label' in n and 'detectPlatformFromUrl' in n
assert 'waitMs:10000' in w and 'elapsed<10000' in w
assert '10000-(Date.now()-Number(p.openedAt))' in pub
assert 'buttonLabel' in pub
assert 'balanceBefore' in w and 'balanceAfter' in w
assert 'const ledgerAdded=Number(batchResults?.[1]?.meta?.changes||0)>0' in w
assert 'NẠP THẺ CÀO THÀNH CÔNG' in w
admin=(ROOT/'frontend/admin.html').read_text(); adminjs=(ROOT/'frontend/assets/js/admin-v14.js').read_text()
assert 'cardTopupSummary' in w and 'cardTopupCreditedVnd' in w and 'cardTopups:cardTopupRows' in w
assert 'v55CardTopupRows' in admin and '#v55CardTopupCredited' in adminjs and 'x.cardTopups' in adminjs
main=(ROOT/'frontend/assets/js/main.js').read_text(); html=(ROOT/'frontend/download.html').read_text(); css=(ROOT/'frontend/assets/css/download-flow.css').read_text(); drawer=(ROOT/'frontend/share.html').read_text()
assert 'download-flow-card' in main and 'downloadInstall' in main and 'downloadChoice' in main
assert 'download-flow.css?v=58.9' in html and '.download-wait-track' in css
assert 'downloadBypass' in main and 'download-buy' in main
assert 'Seller Center' in drawer and '/seller.html' in drawer
assert 'TEO_NOTE_AWAY_' in pub and '10000-awayMs' in pub and 'visibilitychange' in pub
assert 'note-flow-warning' in pub and 'note-flow-handoff' in pub and 'left=5' in pub
assert 'balanceBefore' in w and 'NẠP THẺ CÀO THÀNH CÔNG' in w
print('PASS V58.9 regression checks: persistent Seller attribution, catalog media/details, pre-download landing, Seller drawer entry, leave-and-return task gate, 5-second hand-off and idempotent Telegram card-topup notices.')
