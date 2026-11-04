from pathlib import Path
root=Path(__file__).resolve().parents[1]
worker=(root/"cloudflare/worker.js").read_text()
tenant=(root/"frontend/assets/js/tenant-admin.js").read_text()
key_page=(root/"frontend/assets/js/free-key.js").read_text()
key_html=(root/"frontend/free-key.html").read_text()
tenant_html=(root/"frontend/tenant-admin.html").read_text()
admin=(root/"frontend/assets/js/admin-v14.js").read_text()
admin_html=(root/"frontend/admin.html").read_text()
assert "link4mApproved:String(e?.LINK4M_REWARDED_TRAFFIC_APPROVED||'')==='1'" in worker
assert "providerName==='link4m'&&!cfg.link4mApproved" in worker
assert "FREE_BYPASS_VERIFY_URL" not in worker and "FREE_BYPASS_API_KEY" not in worker
assert "CREATE TABLE IF NOT EXISTS free_bypass_keys" in worker
assert "expiresIn:300" in worker or "keyExpires=now+5*60*1000" in worker
assert "DELETE FROM free_bypass_keys" in worker
assert "tenantHasTimeLeft(t)" in worker
assert "free/bypass/redeem" in tenant and "free/bypass/start" in tenant
assert "free/bypass/issue" in key_page and "navigator.clipboard.writeText" in key_page
assert "5 phút" in key_html and "7 ngày Free" in key_html
assert "p.scope='tenant' AND p.tenant_id=? AND p.status='paid' AND COALESCE(p.seller_id,'')<>''" in worker
assert 'sellerAnalytics' in worker and 'seller_commission_vnd' in worker
assert 'tenantSellerRows' in tenant_html and 'tenantSellerDaily' in tenant_html
assert 'renderTenantSellerAnalytics(x.sellerAnalytics||{},selectedMonth)' in tenant
assert 'sellerAffiliateRows' in worker and 'sellerAffiliateOrders' in worker and 'sellerAffiliateDaily' in worker
assert 'v56SellerCommissionRows' in admin_html and 'v56SellerCommissionDaily' in admin_html
assert 'const sa=x.sellerAnalytics||{}' in admin
print('PASS V57.4: one-time Free key, 5-minute expiry, active-rental bypass, Link4M approval guard, and Seller analytics regression checks.')
