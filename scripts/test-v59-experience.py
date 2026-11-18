from pathlib import Path
root=Path(__file__).resolve().parents[1]
front=root/'frontend'
js=(front/'assets/js/teo-experience.js').read_text()
dock=(front/'assets/js/community-dock.js').read_text()
dock_css=(front/'assets/css/community-dock.css').read_text()
css=(front/'assets/css/teo-experience.css').read_text()
share=(front/'share.html').read_text()
assert 'AudioContext' in dock and 'webkitAudioContext' in dock
assert "localStorage.getItem('teo:clickSound')" in dock
assert 'prefers-reduced-motion' in js
assert 'teo-route-progress' in js and 'data-loading-label' in js
assert 'backgroundMusicUrl' in dock and 'const playMusic=' in dock
assert 'community-dock.js?v=60.0' in share
assert 'teo-audio-dock' in dock_css and 'teo-route-progress' in css
assert "musicBtn.addEventListener('click',playMusic)" in dock and 'audioEl.play()' in dock
html=list(front.glob('*.html'))
missing=[p.name for p in html if 'teo-experience.css' not in p.read_text(errors='ignore') or 'teo-experience.js' not in p.read_text(errors='ignore')]
assert not missing, f'Experience layer missing from: {missing}'
assert 'prefers-reduced-motion:reduce' in dock_css
assert '.teo-audio-dock,.teo-music-dock{display:none!important}' in dock_css
print(f'PASS V59/V60 experience: {len(html)} frontend pages wired; opt-in music and click sound in the community hub, route progress, reveal motion and reduced-motion support.')
