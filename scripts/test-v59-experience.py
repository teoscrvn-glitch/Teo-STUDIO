from pathlib import Path
root=Path(__file__).resolve().parents[1]
front=root/'frontend'
js=(front/'assets/js/teo-experience.js').read_text()
css=(front/'assets/css/teo-experience.css').read_text()
share=(front/'share.html').read_text()
assert 'AudioContext' in js and 'webkitAudioContext' in js
assert "store.get('clickSound','1')" in js
assert 'prefers-reduced-motion' in js
assert "body.dataset.teoSkin==='share'" in js
assert "musicEnabled?stopMusic():startMusic()" in js
assert 'teoMusicToggle' in share or 'teo-experience.js' in share
assert 'teo-audio-dock' in css and 'teo-route-progress' in css
assert 'autoplay=' not in js.lower()
html=list(front.glob('*.html'))
missing=[p.name for p in html if 'teo-experience.css' not in p.read_text(errors='ignore') or 'teo-experience.js' not in p.read_text(errors='ignore')]
assert not missing, f'Experience layer missing from: {missing}'
print(f'PASS V59 experience: {len(html)} frontend pages wired; opt-in ambient audio, click sound, route progress, reveal motion and reduced-motion support.')
