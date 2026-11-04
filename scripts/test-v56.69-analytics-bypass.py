from pathlib import Path
root=Path(__file__).resolve().parents[1]
worker=(root/'cloudflare/worker.js').read_text()
tenant=(root/'frontend/assets/js/tenant-admin.js').read_text()
tenant_html=(root/'frontend/tenant-admin.html').read_text()
admin=(root/'frontend/assets/js/admin-v14.js').read_text()
admin_html=(root/'frontend/admin.html').read_text()
assert "rewardTrafficApproved:String(e?.FREE_BYPASS_REWARDED_TRAFFIC_APPROVED||'')==='1'" in worker
assert 'if(!bypassCfg.rewardTrafficApproved)' in worker
assert 'if(!cfg.rewardTrafficApproved)' in worker
assert "payload?.success!==true||payload?.completed!==true||String(payload?.state??'')!==String(state)" in worker
assert "p.scope='tenant' AND p.tenant_id=? AND p.status='paid' AND COALESCE(p.seller_id,'')<>''" in worker
assert 'sellerAnalytics' in worker and 'seller_commission_vnd' in worker
assert 'tenantSellerRows' in tenant_html and 'tenantSellerDaily' in tenant_html
assert 'renderTenantSellerAnalytics(x.sellerAnalytics||{},selectedMonth)' in tenant
assert 'sellerAffiliateRows' in worker and 'sellerAffiliateOrders' in worker and 'sellerAffiliateDaily' in worker
assert 'v56SellerCommissionRows' in admin_html and 'v56SellerCommissionDaily' in admin_html
assert 'const sa=x.sellerAnalytics||{}' in admin
print('PASS V56.69: Free bypass approval flag, strict provider verification, tenant-scoped Seller reports and master Seller-ID reports.')
