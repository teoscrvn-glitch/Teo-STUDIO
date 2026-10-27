/* TeoStudio Graphics Tiers — progressive enhancement, conservative on mobile. */
(()=>{
  'use strict';
  const MODE_KEY='teo-graphics-mode-v1';
  const SOUND_KEY='teo-graphics-sound-v1';
  const root=document.documentElement;
  const $=(selector,scope=document)=>scope.querySelector(selector);
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let premiumLink=null;
  let premiumImage=null;
  let audioCtx=null;
  let cardObserver=null;
  let heroObserver=null;
  let gridObserver=null;
  let premiumMotionListener=null;
  let premiumPointerOutListener=null;
  const observedCards=new Set();
  const reducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const safeGet=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const safeSet=(key,value)=>{try{localStorage.setItem(key,value)}catch{}}
  function recommendedMode(){
    if(reducedMotion())return 'lite';
    const cores=Number(navigator.hardwareConcurrency)||0;
    const memory=Number(navigator.deviceMemory)||0;
    if((cores>0&&cores<=4)||(memory>0&&memory<=4))return 'lite';
    return 'balanced';
  }
  function mode(){
    const saved=safeGet(MODE_KEY);
    if(saved==='lite'||saved==='balanced'||saved==='premium')return saved;
    // Migrate the historical default (unset => Lite) to a conservative hardware-aware default.
    return recommendedMode();
  }
  const soundOn=()=>safeGet(SOUND_KEY)==='on';
  function tinySound(){
    if(!soundOn())return;
    try{
      audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume();
      const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();
      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(660,audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880,audioCtx.currentTime+.045);
      gain.gain.setValueAtTime(.018,audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.06);
      oscillator.connect(gain);gain.connect(audioCtx.destination);
      oscillator.start();oscillator.stop(audioCtx.currentTime+.065);
    }catch{}
  }
  function ensurePremium(){
    if(!premiumLink){
      premiumLink=document.createElement('link');
      premiumLink.rel='stylesheet';
      premiumLink.href='assets/premium/premium.css?v=56.34';
      premiumLink.dataset.teoPremium='1';
      premiumLink.onload=()=>{root.classList.add('teo-premium-assets-ready')};
      premiumLink.onerror=()=>{root.classList.remove('teo-premium-assets-ready')};
      document.head.appendChild(premiumLink);
    }
    if(!premiumImage){
      premiumImage=new Image();
      premiumImage.decoding='async';
      premiumImage.loading='eager';
      premiumImage.src='assets/premium/teo-linh.webp?v=56.34';
      premiumImage.dataset.teoPremium='1';
      premiumImage.onerror=()=>{premiumImage=null};
    }
  }
  function removePremium(){
    root.classList.remove('teo-premium-assets-ready');
    if(premiumLink){premiumLink.remove();premiumLink=null}
    if(premiumImage){premiumImage.src='';premiumImage=null}
    if(premiumMotionListener){document.removeEventListener('pointermove',premiumMotionListener);premiumMotionListener=null}
    if(premiumPointerOutListener){document.removeEventListener('pointerout',premiumPointerOutListener);premiumPointerOutListener=null}
    document.querySelectorAll('.product-card').forEach(card=>{
      card.style.removeProperty('--teo-mouse-x');
      card.style.removeProperty('--teo-mouse-y');
      card.style.removeProperty('--teo-tilt-x');
      card.style.removeProperty('--teo-tilt-y');
      card.classList.remove('teo-tilt-active');
    });
  }
  function showAllCards(){
    if(cardObserver)cardObserver.disconnect();
    observedCards.forEach(card=>{
      card.classList.remove('teo-reveal-pending','teo-reveal-visible');
      card.style.removeProperty('--teo-stagger-delay');
      cardObserver?.unobserve(card);
    });
    observedCards.clear();
    root.classList.remove('teo-motion-enabled');
  }
  function installObservers(){
    if(!('IntersectionObserver' in window))return;
    cardObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const card=entry.target;
        card.classList.remove('teo-reveal-pending');
        card.classList.add('teo-reveal-visible');
        cardObserver.unobserve(card);
        observedCards.delete(card);
      });
    },{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    heroObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.target.classList.toggle('teo-offscreen',!entry.isIntersecting));
    },{threshold:0});
    document.querySelectorAll('.hero-glow').forEach(glow=>heroObserver.observe(glow));
    const grid=$('#productGrid');
    if(grid&&'MutationObserver' in window){
      gridObserver=new MutationObserver(()=>observeCards(grid));
      // Observe only the product list, not the whole document, to avoid mutation-loop overhead.
      gridObserver.observe(grid,{childList:true});
    }
  }
  function observeCards(scope=document){
    if(!cardObserver||mode()==='lite'||reducedMotion())return;
    let index=0;
    scope.querySelectorAll('.product-card:not(.teo-reveal-pending):not(.teo-reveal-visible),.rent-step:not(.teo-reveal-pending):not(.teo-reveal-visible)').forEach(card=>{
      if(!card.isConnected)return;
      card.style.setProperty('--teo-stagger-delay',Math.min(index*35,175)+'ms');
      card.classList.add('teo-reveal-pending');
      observedCards.add(card);
      cardObserver.observe(card);
      index++;
    });
  }
  function installPremiumPointerMotion(){
    if(premiumMotionListener||!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)return;
    let frame=0,lastEvent=null;
    premiumMotionListener=event=>{
      lastEvent=event;
      if(frame||mode()!=='premium'||document.hidden)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const target=lastEvent?.target;
        const card=target&&target.closest?.('.product-card');
        if(!card)return;
        const rect=card.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const x=lastEvent.clientX-rect.left,y=lastEvent.clientY-rect.top;
        const nx=(x/rect.width-.5),ny=(y/rect.height-.5);
        card.style.setProperty('--teo-mouse-x',Math.round(x)+'px');
        card.style.setProperty('--teo-mouse-y',Math.round(y)+'px');
        card.style.setProperty('--teo-tilt-x',(-ny*2.8).toFixed(2)+'deg');
        card.style.setProperty('--teo-tilt-y',(nx*2.8).toFixed(2)+'deg');
        card.classList.add('teo-tilt-active');
      });
    };
    document.addEventListener('pointermove',premiumMotionListener,{passive:true});
    premiumPointerOutListener=event=>{
      const card=event.target?.closest?.('.product-card');
      if(!card||card.contains(event.relatedTarget))return;
      card.classList.remove('teo-tilt-active');
      card.style.removeProperty('--teo-tilt-x');card.style.removeProperty('--teo-tilt-y');
    };
    document.addEventListener('pointerout',premiumPointerOutListener,{passive:true});
  }
  function updateModeUI(){
    const current=mode(),status=$('#teoGraphicsStatus');
    if(status)status.textContent=current==='premium'?'Premium · hiệu ứng nâng cao':current==='balanced'?'Balanced · mượt và cân bằng':'Lite · ưu tiên tốc độ';
    document.querySelectorAll('[data-teo-mode]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.teoMode===current));
      button.classList.toggle('active',button.dataset.teoMode===current);
    });
    const sound=$('#teoGraphicsSound');if(sound)sound.checked=soundOn();
  }
  function apply(nextMode){
    const next=['lite','balanced','premium'].includes(nextMode)?nextMode:'balanced';
    root.dataset.teoGraphics=next;
    safeSet(MODE_KEY,next);
    if(next==='premium')ensurePremium();else removePremium();
    if(next==='lite'||reducedMotion())showAllCards();
    else{
      if(cardObserver)root.classList.add('teo-motion-enabled');
      observeCards();
    }
    if(next==='premium')installPremiumPointerMotion();
    renderPanel();
  }
  function renderPanel(){
    const current=mode(),on=soundOn();
    const status=$('#teoGraphicsStatus');
    if(status)status.textContent=current==='premium'?'Premium · hiệu ứng nâng cao':current==='balanced'?'Balanced · mượt và cân bằng':'Lite · ưu tiên tốc độ';
    document.querySelectorAll('[data-teo-mode]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.teoMode===current));
      button.classList.toggle('active',button.dataset.teoMode===current);
    });
    const sound=$('#teoGraphicsSound');if(sound)sound.checked=on;
  }
  function init(){
    root.dataset.teoGraphics=mode();
    root.classList.toggle('teo-tab-hidden',document.hidden);
    document.addEventListener('visibilitychange',()=>root.classList.toggle('teo-tab-hidden',document.hidden),{passive:true});
    installObservers();
    const mount=$('.header-actions')||$('.admin-topbar')||$('.site-header .header-inner');
    const holder=document.createElement('div');holder.className='teo-graphics-control';
    holder.innerHTML=`<button type="button" id="teoGraphicsToggle" class="teo-graphics-toggle" aria-expanded="false" aria-controls="teoGraphicsPanel" title="Chế độ đồ họa">◈ <span>Đồ họa</span></button><section id="teoGraphicsPanel" class="teo-graphics-panel" hidden aria-label="Cài đặt đồ họa"><div class="teo-graphics-title"><div><b>Đồ họa TeoStudio</b><small id="teoGraphicsStatus">Đang chọn chế độ…</small></div><button type="button" id="teoGraphicsClose" aria-label="Đóng">×</button></div><div class="teo-graphics-options"><button type="button" data-teo-mode="lite"><b>Lite</b><small>Máy yếu · tiết kiệm pin</small><span>✓</span></button><button type="button" data-teo-mode="balanced"><b>Balanced</b><small>Đẹp vừa đủ · khuyên dùng</small><span>◆</span></button><button type="button" data-teo-mode="premium"><b>Premium</b><small>Đầy đủ hiệu ứng · PC tốt</small><span>✦</span></button></div><label class="teo-graphics-sound"><input type="checkbox" id="teoGraphicsSound"> Âm thanh hiệu ứng <small>Tắt mặc định</small></label><p class="teo-graphics-note">Chế độ Lite/Balanced giảm chuyển động nền. Premium chỉ bật hiệu ứng bổ sung khi được chọn. Máy yếu được đề xuất Lite tự động.</p></section>`;
    if(mount){holder.classList.add('teo-graphics-in-header');mount.appendChild(holder)}else{holder.classList.add('teo-graphics-fallback');document.body.appendChild(holder)}
    const toggle=$('#teoGraphicsToggle',holder),panel=$('#teoGraphicsPanel',holder);
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)renderPanel();tinySound()});
    $('#teoGraphicsClose',holder).addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false')});
    holder.querySelectorAll('[data-teo-mode]').forEach(button=>button.addEventListener('click',()=>{apply(button.dataset.teoMode);tinySound()}));
    $('#teoGraphicsSound',holder).addEventListener('change',event=>{safeSet(SOUND,event.target.checked?'on':'off');if(event.target.checked)tinySound();renderPanel()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}});
    document.addEventListener('click',event=>{if(!holder.contains(event.target)&&!panel.hidden){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}},{passive:true});
    if(mode()==='premium')ensurePremium();
    if(mode()==='lite'||reducedMotion())showAllCards();else{if(cardObserver)root.classList.add('teo-motion-enabled');observeCards()}
    if(mode()==='premium')installPremiumPointerMotion();
    renderPanel();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
