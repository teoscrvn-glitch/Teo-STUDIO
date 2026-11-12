from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
wrangler = (ROOT / 'cloudflare/wrangler.toml').read_text(encoding='utf-8')
admin = (ROOT / 'frontend/admin.html').read_text(encoding='utf-8')
seller = (ROOT / 'frontend/assets/js/seller.js').read_text(encoding='utf-8')
tenant = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')

# Card top-up remains provider-verified; card withdrawal is intentionally manual.
for secret in ['THECAOSIEUTOC_PARTNER_ID', 'THECAOSIEUTOC_PARTNER_KEY', 'CARD_DATA_ENCRYPTION_KEY']:
    assert secret in worker and secret in wrangler
assert 'https://thecaosieutoc.vn/chargingws/v2' in worker
assert 'callback_sign' in worker and '/api/webhook/card-provider' in worker
assert 'AES-GCM' in worker and 'cards_ciphertext' in worker
assert "withdrawalMode:e?.THECAOSIEUTOC_TOKEN?'api':'manual'" in worker
assert 'async function providerCardBuy' not in worker
assert 'THECAOSIEUTOC_TOKEN' in worker and '/api/admin/merchant/overview' in worker
assert 'không tự động mua thẻ' in worker
assert 'Admin chính duyệt' in admin and 'không tự động mua thẻ' in seller
assert 'không tự động mua thẻ' in tenant
assert '/api/admin/card-withdrawals' in worker
assert "status='pending'" in worker and "'card_withdrawal_reserve'" in worker
assert "status='approved'" in worker and "status='paid'" in worker
assert "status='rejected'" in worker and "'card_withdrawal_reversal'" in worker
assert "e.DB.batch([update,refund])" in worker
assert "if(!['pending','approved','processing','unknown'].includes(row.status))" in worker
assert 'const debit=face+Math.round(face*0.05)' in worker
assert "created_at>=datetime('now','-1 hour'))<2" in worker
assert "created_at>=datetime('now','-1 minute'))<3" in worker
assert "limitedForAccount('wallet-card-topup',buyer.id,3,60000)" in worker
assert "limitedForAccount('seller-card-withdrawal',buyer.id,2,3600000)" in worker

# Fee table is now synchronized from TheCaoSieuToc API; no screenshot-derived manual tiers.
assert 'chargingws/v2/getfee?partner_id=' in worker
assert 'providerFee' in worker and 'member_rate' in worker
assert 'vcoin' in worker

# Edge protection and request constraints remain enabled.
for name in ['API_EDGE_LIMITER', 'AUTH_EDGE_LIMITER', 'FINANCE_EDGE_LIMITER', 'BYPASS_EDGE_LIMITER']:
    assert f'name = "{name}"' in wrangler
assert 'reader.read()' in worker and 'total>2_000_000' in worker
assert 'CROSS_SITE_REQUEST_BLOCKED' in worker
assert 'BYPASS_KEY_ALREADY_ISSUED' in worker and 'BYPASS_KEY_REDEEM_RACE' in worker
assert 'free_bypass_keys' in worker and 'session_hash' in worker


# Shared account, device-bound persistent sessions, optional AI context and moderation tools.
account = (ROOT / 'frontend/assets/js/account.js').read_text(encoding='utf-8')
share = (ROOT / 'frontend/share.html').read_text(encoding='utf-8')
public_tenant = worker[worker.find("if(parts[3]==='comments'&&r.method==='GET')"):worker.find("if(parts[3]==='comments'&&r.method==='GET')") + 1200]
assert "BUILD_VERSION='v58.13-withdrawal-vietqr'" in worker
assert 'session_device_key' in worker and 'teo-device-v2|' in worker
assert 'ip_address=?,device_label=?' in worker and 'x-teo-device-id' in worker
assert 'buyer_known_devices' in worker
assert 'teo-account-page-mode' in (ROOT / 'frontend/account.html').read_text(encoding='utf-8')
assert 'account.html?auth=login' in account
assert 'localStorage.setItem(SESSION_KEY,token)' in account
assert "if(aiPersonalizationAllowed)" in worker
assert 'aiPersonalizationEnabled' in account and 'Mặc định đang tắt' in account
assert 'không cấp quyền Admin' in account
assert 'tenant-creator-hub' in share and 'Tạo / thuê website' in share and 'Tham gia Seller' in share
assert 'b.avatar' in worker and 'LEFT JOIN buyer_accounts b ON b.id=c.buyer_id' in public_tenant
assert 'Chặn IP' in tenant and 'Chặn email' in tenant
assert "'/api/tenant/security/blocks'" in tenant
assert "'/api/admin/security/blocks'" in (ROOT / 'frontend/assets/js/admin-v14.js').read_text(encoding='utf-8')
assert 'productPerformance' in worker and 'productPerformance' in tenant
assert 'comment-avatar' in tenant

print('PASS V56.68 manual card workflow: provider-confirmed topups, Admin-only manual delivery, 105% reserve, encrypted card/serial storage, atomic rejection refund, persistent caps, source-grounded rates, and Cloudflare edge limits.')
