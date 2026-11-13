from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
w = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
ui = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')
page = (ROOT / 'frontend/tenant-admin.html').read_text(encoding='utf-8')

checks = [
    ("BUILD_VERSION='v58.14-share-seller-ux'" in w, 'Worker build version bumped'),
    ("destinationPage:'/free-key.html'" in w, 'shortener destination is TeoStudio result page'),
    ("if(providerName==='link4m'&&!cfg.link4mApproved&&!options.allowUnapprovedDiagnostic)" not in w, 'Link4M flow no longer waits on an unused approval flag'),
    ('async function testBypassShortener' in w, 'provider probe uses the server-side credentials'),
    ('resultDomain:new URL(result).hostname' in w, 'response returns host only, not the full generated short URL'),
    ('safeShortenerDiagnosticError' in w and "value.split(secret).join('[redacted]')" in w, 'provider errors redact API secrets'),
    ('const completionVerified=false' in w and 'providerCompletionVerified:completionVerified' in w, 'shortener success is not reported as ad-completion verification'),
    ('returnFlowReady' in w and "verificationMode:'one-time-return-state-key'" in w, 'diagnostic distinguishes return-page flow from ad-completion proof'),
    ("for(const providerName of ['bumx','link4m'])" in w, 'diagnostic tests both providers'),
    ('does not open the generated URL' in w and 'does not' in w, 'diagnostic does not open the shortlink or create rewards'),
    ('friendlyFreeBypassError' in ui and 'API_NOT_CONFIGURED' in ui and 'LINK4M_API' in ui, 'Free tenant UI maps provider/API failures to a public-safe message'),
    ('HTTP ${v.httpStatus' not in ui and 'formatBypassApiTest' not in ui, 'Tenant UI does not expose provider HTTP/API diagnostics'),
    ('v58.14-share-seller-ux' in page, 'tenant admin version meta is updated'),
]
failed = []
for ok, label in checks:
    print(('PASS' if ok else 'FAIL') + ': ' + label)
    if not ok:
        failed.append(label)
if failed:
    raise SystemExit('Failed checks: ' + ', '.join(failed))
print(f'PASS: {len(checks)}/{len(checks)} V57.10 Link4M diagnostics checks.')
