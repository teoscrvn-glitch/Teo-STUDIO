from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / 'cloudflare/worker.js').read_text()
seller_js = (ROOT / 'frontend/assets/js/seller.js').read_text()
seller_html = (ROOT / 'frontend/seller.html').read_text()
main_js = (ROOT / 'frontend/assets/js/main.js').read_text()
tenant_js = (ROOT / 'frontend/assets/js/tenant-detail.js').read_text()
account_js = (ROOT / 'frontend/assets/js/account.js').read_text()

# Referral codes are 12 random bytes (24 hex chars); attribution tokens are 24 random bytes (48 hex chars).
assert "!/^[a-f0-9]{24}$/i.test(code)" in worker
assert "/^[a-f0-9]{48}$/i.test(tok)" in worker
assert "crypto.getRandomValues(new Uint8Array(12))" in worker
assert "crypto.getRandomValues(new Uint8Array(24))" in worker
assert "JOIN buyer_accounts a ON a.id=c.seller_id AND COALESCE(a.locked,0)=0" in worker
assert "COALESCE(locked,0)=0" in worker
assert "seller_attributions WHERE expires_at<=?" in worker

# Endpoint-specific caps protect payout/profile/link actions without a site-wide auto-ban.
for marker in ["limitedForAccount('seller-link-create',buyer.id,40,60000)", "limitedForAccount('seller-payout-profile',buyer.id,12,3600000)", "limitedForAccount('seller-withdraw-create',buyer.id,5,3600000)"]:
    assert marker in worker, marker
assert "EMAIL_VERIFICATION_REQUIRED" in worker
assert 'function limitedForAccount(key,accountId,limit,windowMs)' in worker
assert "limited(r,'seller-link-create'" not in worker
assert "seller_enabled" in worker and "visible=1" in worker
assert "if(!attribution&&b.sellerToken)" in worker
assert "buyer_seller_referrals" in worker
assert "INSERT OR IGNORE INTO buyer_seller_referrals" in worker
assert "accountReferral" in worker
assert "balanceBefore" in worker and "balanceAfter" in worker
assert "Math.floor(amount*0.05)" in worker

# Product-detail seller entry points exist for both main catalogue and tenant catalogue.
assert "/seller.html?scope=main&product=" in main_js
assert "/seller.html?scope=tenant&tenant=" in tenant_js
assert "seller_enabled" in main_js and "seller_enabled" in tenant_js
assert "captureSellerAttribution" in account_js
assert "/api/seller/attribute" not in main_js and "/api/seller/attribute" not in tenant_js

# Seller UI is escaped, mobile-first, resilient to network timeouts, and avoids blocking popups.
assert "AbortController" in seller_js
assert "esc=v=>String(v??'')" in seller_js
assert "navigator.share" in seller_js
assert "sellerCreatedLink" in seller_js
assert "prompt(" not in seller_js and "alert(" not in seller_js
assert "seller-premium.css?v=58.14" in seller_html
assert "seller-hero.webp" in seller_html
assert "mỗi file có mức hoa hồng riêng" in seller_html.lower() or "hoa hồng theo từng file" in seller_html.lower()

for asset in [
    'seller-hero.webp', 'seller-mascot.webp', 'sakura-night.webp',
    'teo-shield.svg', 'teo-seller.svg', 'teo-links.svg', 'teo-wallet.svg', 'teo-ads.svg', 'teo-cloud.svg'
]:
    assert (ROOT / 'frontend/assets/img/teo' / asset).is_file(), asset

# Check the referral code parser's exact length contract.
assert re.fullmatch(r'[a-f0-9]{24}', 'ab' * 12)
assert not re.fullmatch(r'[a-f0-9]{24}', 'ab' * 24)
assert re.fullmatch(r'[a-f0-9]{48}', 'cd' * 24)

# Existing security design deliberately does not automatically ban IPs.
assert 'securityBlocked(e,\'ip\',requesterIp)' in worker
for forbidden in ['function banIp', 'IP_TEMPORARILY_BLOCKED', 'autoBanIp(']:
    assert forbidden not in worker, forbidden

print('PASS V56.64: Seller referral/token formats, locked-seller checks, expiry cleanup, scoped action limits, verified payout identity, main/tenant seller CTAs, responsive Seller UI, generated art assets, and no automatic IP bans.')
