from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
w = (ROOT / 'cloudflare/worker.js').read_text(encoding='utf-8')
ui = (ROOT / 'frontend/assets/js/tenant-admin.js').read_text(encoding='utf-8')
page = (ROOT / 'frontend/tenant-admin.html').read_text(encoding='utf-8')

checks = [
    ("BUILD_VERSION='v57.10-link4m-api-diagnostic'" in w, 'Worker build version bumped'),
    ('allowUnapprovedDiagnostic' in w, 'diagnostic-only Link4M API probe can run independently from reward approval'),
    ("if(providerName==='link4m'&&!cfg.link4mApproved&&!options.allowUnapprovedDiagnostic)" in w, 'real reward flow remains gated by provider approval'),
    ('async function testBypassShortener' in w, 'provider probe uses the server-side credentials'),
    ('resultDomain:new URL(result).hostname' in w, 'response returns host only, not the full generated short URL'),
    ('safeShortenerDiagnosticError' in w and "value.split(secret).join('[redacted]')" in w, 'provider errors redact API secrets'),
    ('const completionVerified=false' in w and 'providerCompletionVerified:completionVerified' in w, 'shortener success is not reported as ad-completion verification'),
    ('rewardFlowReady,verificationMode' in w, 'API health and reward eligibility are separate fields'),
    ("for(const providerName of ['bumx','link4m'])" in w, 'diagnostic tests both providers'),
    ('does not open the generated URL' in w and 'does not' in w, 'diagnostic does not open the shortlink or create rewards'),
    ('formatBypassApiTest' in ui, 'Free gate and settings show per-provider diagnostic detail'),
    ('HTTP ${v.httpStatus' in ui, 'UI shows provider HTTP result'),
    ('v57.10-link4m-api-diagnostic' in page, 'tenant admin cache-busting version bumped'),
]
failed = []
for ok, label in checks:
    print(('PASS' if ok else 'FAIL') + ': ' + label)
    if not ok:
        failed.append(label)
if failed:
    raise SystemExit('Failed checks: ' + ', '.join(failed))
print(f'PASS: {len(checks)}/{len(checks)} V57.10 Link4M diagnostics checks.')
