from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
front=ROOT/'frontend'
css=front/'assets/css/teo-visual-system.css'
js=front/'assets/js/teo-visual-system.js'
assert css.exists() and css.stat().st_size>9000, 'visual system CSS missing or unexpectedly small'
assert js.exists() and js.stat().st_size>1800, 'visual system JS missing or unexpectedly small'
c=css.read_text(); j=js.read_text()
for skin in ['home','share','master','studio','seller','download','note','wallet','earn','free','rental','product','legal','builder','ai']:
    assert f'data-teo-skin="{skin}"' in c, f'missing CSS skin: {skin}'
    assert f"'{skin}'" in j, f'missing JS mapping: {skin}'
assert 'prefers-reduced-motion:reduce' in c and 'prefers-reduced-motion: reduce' in j
assert '(hover: hover) and (pointer: fine)' in j
assert 'const max=4.2' in j, '3D tilt must stay subtle'
assert 'length>=8' in j, '3D tilt must be capped to eight elements'
assert 'WebGL' not in j and 'three.js' not in j.lower(), 'heavy 3D engine must not be added'
assert 'https://' not in j and 'http://' not in j, 'visual behavior must not request remote scripts'
htmls=list(front.glob('*.html'))
assert htmls, 'no frontend HTML pages found'
for p in htmls:
    s=p.read_text()
    assert 'teo-visual-system.css?v=58.10' in s, f'{p.name} missing visual CSS'
    assert 'teo-visual-system.js?v=58.10' in s, f'{p.name} missing visual JS'
for asset in ['visual-home.svg','visual-share.svg','visual-admin.svg','visual-studio.svg','visual-download.svg','visual-wallet.svg','visual-earn.svg','visual-builder.svg','visual-ai.svg']:
    assert (front/'assets/img/teo'/asset).exists(), f'missing local page artwork: {asset}'
print(f'PASS: V58.10 visual system is wired into {len(htmls)} frontend pages; page skins, reduced-motion, capped depth and no heavy 3D dependency verified.')
