import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [worker, seller, sellerPage, tenantPage, adminCss, rankingsPage, rankingsJs, sharePage, homePage] = await Promise.all([
  read('cloudflare/worker.js'),
  read('frontend/assets/js/seller.js'),
  read('frontend/seller.html'),
  read('frontend/tenant-admin.html'),
  read('frontend/assets/css/admin.css'),
  read('frontend/rankings.html'),
  read('frontend/assets/js/rankings.js'),
  read('frontend/share.html'),
  read('frontend/index.html'),
]);

// Additive D1 analytics: daily unique referral-link visits; no raw IP column is persisted.
assert.match(worker, /CREATE TABLE IF NOT EXISTS seller_referral_visits\([^`]+visitor_hash TEXT NOT NULL/s);
assert.match(worker, /UNIQUE\(seller_id,scope,tenant_id,product_id,day_vn,visitor_hash\)/);
assert.match(worker, /SELLER_VISIT_HASH_KEY\|\|e\.LOGIN_RATE_HASH_KEY\|\|e\.ADMIN_KEY\|\|e\.TURNSTILE_SECRET/);
assert.match(worker, /name:'HMAC',hash:'SHA-256'/);
assert.match(worker, /INSERT OR IGNORE INTO seller_referral_visits/);
assert.doesNotMatch(worker.match(/CREATE TABLE IF NOT EXISTS seller_referral_visits\(([^`]+)\)/)?.[1] || '', /\bip_address\b|\bclient_ip\b/i);

// Per-link reporting is based on the persisted attribution and paid-purchase records.
assert.match(worker, /seller_referral_visits v WHERE v\.seller_id=rc\.seller_id/);
assert.match(worker, /AS clicks/);
assert.match(worker, /AS referredAccounts/);
assert.match(worker, /AS paidOrders/);
assert.match(worker, /AS salesVnd/);
assert.match(worker, /AS commissionVnd/);
assert.match(worker, /AS tenant_name/);
assert.match(seller, /renderPerformance\(w\.performance\|\|\[\]\)/);
assert.match(seller, /Lượt vào/);
assert.match(sellerPage, /id="sellerPerformanceSection"/);
assert.match(sellerPage, /Hiệu suất từng link/);

// Public rankings contain all three scoped views with bounded period selection.
assert.match(worker, /p==='\/api\/public\/leaderboards'/);
assert.match(worker, /!\['day','week','month'\]\.includes\(period\)/);
for (const category of ['owners', 'sellers', 'buyers']) assert.match(worker, new RegExp(`${category}\\.map\\(`));
assert.match(worker, /kind IN \('topup','card_topup'\)/);
assert.match(rankingsPage, /data-kind="owners"/);
assert.match(rankingsPage, /data-kind="sellers"/);
assert.match(rankingsPage, /data-kind="buyers"/);
assert.match(rankingsJs, /\/api\/public\/leaderboards\?period=/);

// Admin IA clarifies two separate creator flows and exposes ranking navigation.
assert.match(tenantPage, /href="\/rankings\.html"/);
assert.match(tenantPage, /File tải xuống/);
assert.match(tenantPage, /Note \/ nhiệm vụ/);
assert.match(adminCss, /\.tenant-tabs \.tenant-tab-link/);

// Seller return points go to the public home, not an invalid tenant-only Share URL.
assert.match(sellerPage, /href="\/" aria-label="Quay lại trang chủ"/);
assert.match(sellerPage, /href="\/"[^>]*>← Trang chủ TeoStudio/);
assert.match(sharePage, /\/rankings\.html/);
assert.match(homePage, /\/rankings\.html/);

console.log('PASS: V58.15 Seller attribution analytics, public leaderboards and Studio navigation checks');
