/* TeoStudio V59 experience layer — lightweight native motion + opt-in sound. */
(()=>{
  'use strict';
  const doc=document, root=doc.documentElement, body=doc.body;
  if(!body || body.dataset.teoExperience==='59') return;
  body.dataset.teoExperience='59';
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const store={get(k,d){try{const v=localStorage.getItem('teo:'+k);return v===null?d:v}catch{return d}},set(k,v){try{localStorage.setItem('teo:'+k,v)}catch{}}};

  // A slim top progress line gives real navigation feedback without fake percentages.
  const bar=doc.createElement('div');bar.className='teo-route-progress';bar.setAttribute('aria-hidden','true');doc.body.append(bar);
  const startRoute=()=>{bar.classList.remove('done');bar.classList.add('active')};
  doc.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin===location.origin&&u.href!==location.href)startRoute()},{capture:true});
  window.addEventListener('pageshow',()=>{bar.classList.remove('active');bar.classList.add('done')});

  // Sound is opt-in and generated locally; no third-party audio request or autoplay.
  let ctx=null, clickEnabled=store.get('clickSound','1')==='1', musicEnabled=false, musicNodes=[];
  const audioContext=()=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{ctx ||= new C();if(ctx.state==='suspended')ctx.resume();return ctx}catch{return null}};
  const tone=(freq=620,duration=.045,volume=.025,type='sine',when=0)=>{const c=audioContext();if(!c)return;const t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.015)};
  const clickSound=()=>{if(clickEnabled)tone(540,.035,.018,'sine')};
  doc.addEventListener('click',e=>{const el=e.target.closest('button,.btn,.mini-btn,.icon-btn,.seller-btn,[role="button"],.product-card,.creator-hub-card');if(el&&!el.matches(':disabled,[aria-disabled="true"]'))clickSound()},{capture:true});

  const stopMusic=()=>{for(const n of musicNodes){try{n.stop?.();n.disconnect?.()}catch{}}musicNodes=[];musicEnabled=false;updateAudioUI()};
  const startMusic=async()=>{const c=audioContext();if(!c)return;stopMusic();musicEnabled=true;const master=c.createGain();master.gain.value=.0001;master.connect(c.destination);master.gain.setTargetAtTime(.045,c.currentTime,.8);musicNodes.push(master);
    // Soft original ambient pad, generated in-browser. No copyrighted recording.
    const notes=[174.61,220,261.63,329.63];notes.forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=[.16,.10,.075,.045][i];o.connect(g);g.connect(master);o.start();musicNodes.push(o,g)});
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.075;lg.gain.value=.012;lfo.connect(lg);lg.connect(master.gain);lfo.start();musicNodes.push(lfo,lg);updateAudioUI();
  };
  const updateAudioUI=()=>{const click=doc.getElementById('teoClickToggle'),music=doc.getElementById('teoMusicToggle');if(click){click.setAttribute('aria-pressed',String(clickEnabled));click.textContent=clickEnabled?'Âm click: Bật':'Âm click: Tắt'}if(music){music.setAttribute('aria-pressed',String(musicEnabled));music.textContent=musicEnabled?'♫ Tắt nhạc':'♫ Bật nhạc'}};
  const panel=doc.createElement('div');panel.className='teo-audio-dock';panel.innerHTML='<button type="button" id="teoAudioOpen" class="teo-audio-main" aria-label="Cài đặt âm thanh" aria-expanded="false">♫</button><div class="teo-audio-panel" id="teoAudioPanel" hidden><div class="teo-audio-title">Âm thanh Share</div><button type="button" id="teoMusicToggle" aria-pressed="false">♫ Bật nhạc</button><button type="button" id="teoClickToggle" aria-pressed="true">Âm click: Bật</button><small>Nhạc nền tự tạo · chỉ phát khi bạn bật</small></div>';
  if(body.dataset.teoSkin==='share'||location.pathname.toLowerCase().includes('share')){
    body.append(panel);const open=doc.getElementById('teoAudioOpen'),box=doc.getElementById('teoAudioPanel');open.addEventListener('click',()=>{box.hidden=!box.hidden;open.setAttribute('aria-expanded',String(!box.hidden))});
    doc.getElementById('teoMusicToggle').addEventListener('click',()=>musicEnabled?stopMusic():startMusic());
    doc.getElementById('teoClickToggle').addEventListener('click',()=>{clickEnabled=!clickEnabled;store.set('clickSound',clickEnabled?'1':'0');updateAudioUI();if(clickEnabled)tone(700,.05,.025)});
    updateAudioUI();
  }

  // Accessible loading state for explicit long-running actions; do not hijack form submission.
  doc.addEventListener('click',e=>{const b=e.target.closest('button[data-loading-label]');if(!b||b.disabled)return;const label=b.dataset.loadingLabel||'Đang xử lý…';b.dataset.originalLabel=b.textContent;b.textContent=label;b.classList.add('teo-is-loading');b.setAttribute('aria-busy','true');b.disabled=true;const restore=()=>{if(!b.isConnected)return;b.textContent=b.dataset.originalLabel||b.textContent;b.classList.remove('teo-is-loading');b.removeAttribute('aria-busy');b.disabled=false};b.addEventListener('teo:complete',restore,{once:true});setTimeout(restore,15000)},{capture:true});

  // Low-cost reveal for cards; IntersectionObserver avoids animating off-screen nodes.
  if(!reduced&&'IntersectionObserver'in window){const targets=doc.querySelectorAll('.product-card,.tenant-note-card,.seller-performance-card,.admin-card,.stat-card,.creator-hub-card');const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('teo-revealed');io.unobserve(x.target)}}),{threshold:.08});targets.forEach((el,i)=>{if(i<80){el.classList.add('teo-reveal');io.observe(el)}})}
})();
