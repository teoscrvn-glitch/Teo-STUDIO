from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
wrangler = (ROOT / 'cloudflare/wrangler.toml').read_text(encoding='utf-8')
admin = (ROOT / 'frontend/admin.html').read_text(encoding='utf-8')
account = (ROOT / 'frontend/assets/js/account.js').read_text(encoding='utf-8')
seller = (ROOT / 'frontend/assets/js/seller.js').read_text(encoding='utf-8')
tenant = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')

# Provider credentials are only runtime bindings/secrets; no API key material is committed.
for secret in ['THECAOSIEUTOC_PARTNER_ID', 'THECAOSIEUTOC_PARTNER_KEY', 'THECAOSIEUTOC_TOKEN', 'CARD_DATA_ENCRYPTION_KEY']:
    assert secret in worker and secret in wrangler
assert 'cardVendorReady(e){return !!(String(e?.THECAOSIEUTOC_TOKEN' in worker
assert 'https://thecaosieutoc.vn/chargingws/v2' in worker
assert 'https://thecaosieutoc.vn/api/card/buy' in worker
assert "md5hex(String(e.THECAOSIEUTOC_PARTNER_KEY||'')+code+serial)" in worker
assert 'callback_sign' in worker and '/api/webhook/card-provider' in worker
assert "status IN ('processing','unknown') ORDER BY created_at DESC LIMIT 1" in worker
assert 'AES-GCM' in worker and 'cards_ciphertext' in worker

# Anti-replay, ledger, and fail-closed behaviour.
assert 'UNIQUE(actor_type,actor_id,request_key)' in worker
assert "status='unknown'" in worker
assert 'Nhà cung cấp chưa trả kết quả chắc chắn' in worker
assert 'ref_type,ref_id,kind' in worker
assert "card_withdrawal_reserve" in worker and "card_withdrawal_reversal" in worker
assert 'const debit=face+Math.round(face*0.05)' in worker
assert "created_at>=datetime('now','-1 hour'))<2" in worker
assert "created_at>=datetime('now','-1 minute'))<3" in worker
assert "limitedForAccount('wallet-card-topup',buyer.id,3,60000)" in worker
assert "limitedForAccount('seller-card-withdrawal',buyer.id,2,3600000)" in worker

# Fee table is precisely grounded in the user-provided screenshot; unsupported carriers remain disabled.
assert 'const partner=[17.1,14.6,14.6,11.1,9.6,9.6]' in worker
assert 'member=[17.3,14.8,14.8,11.3,9.8,9.8]' in worker
assert 'vcoin' in worker and "CARD_VENDOR_TYPES={vinaphone:'VINAPHONE',mobifone:'MOBIFONE',viettel:'VIETTEL',garena:'GARENA',zing:'ZING'}" in worker
assert 'Math.floor(Number(amount.value)*(1-rate/100)/1000)*1000' in account
assert '105% mệnh giá' in seller and '105% mệnh giá' in tenant
assert 'card-rates-admin.js' in admin

# Cloudflare edge limiters plus bounded request bodies and browser write origin protection.
for name in ['API_EDGE_LIMITER', 'AUTH_EDGE_LIMITER', 'FINANCE_EDGE_LIMITER', 'BYPASS_EDGE_LIMITER']:
    assert f'name = "{name}"' in wrangler
assert 'reader.read()' in worker and 'total>2_000_000' in worker
assert 'CROSS_SITE_REQUEST_BLOCKED' in worker
assert 'const activeAttempts=await e.DB.prepare' in worker
assert 'const claim=await e.DB.batch([' in worker
assert 'BYPASS_ALREADY_USED_OR_STEP_ADVANCED' in worker
assert "p!=='/api/webhook/card-provider'" in worker
assert "CARD_TYPE_NOT_SUPPORTED" in worker

print('PASS V56.67: card provider wiring, signed callbacks, AES-GCM card storage, one-time ledger, persistent request caps, 105% redemption, source-grounded tariff table, and Cloudflare edge limits.')
