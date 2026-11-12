/* TeoStudio V58.10 visual behavior: page skins + opt-in, low-cost pointer depth. */
(()=>{
  'use strict';
  const path=(location.pathname||'/').toLowerCase();
  const file=path.split('/').pop()||'index.html';
  const skinMap={
    'index.html':'home','':'home','share.html':'share','admin.html':'master','builder.html':'builder','ai-training.html':'ai',
    'tenant-admin.html':'studio','seller.html':'seller','download.html':'download',
    'note.html':'note','account.html':'wallet','topup.html':'wallet',
    'earn.html':'earn','free.html':'free','free-key.html':'free',
    'rent.html':'rental','detail.html':'product','product-detail-view.html':'product',
    'tenant-detail.html':'product','terms.html':'legal','privacy.html':'legal',
    'privacy-request.html':'legal','cookie-policy.html':'legal','refund-policy.html':'legal'
  };
  const body=document.body;
  if(!body)return;
  body.dataset.teoSkin=skinMap[file]||body.dataset.teoSkin||'home';
  document.documentElement.dataset.teoVisualVersion='58.10';
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const fine=window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  if(reduce||!fine)return;

  const selectors=[
    '.admin-body .stat-grid > .stat',
    '.seller-hero-card',
    '.seller-stat-grid > .seller-stat',
    '.download-flow-card',
    '.product-grid > .product-card',
    '.note-preview-card',
    '.earn-hero',
    '.tenant-detail-hero',
    '.tenant-owner-box'
  ];
  const found=[];
  for(const selector of selectors){
    for(const el of document.querySelectorAll(selector)){
      if(found.length>=8)break;
      if(el instanceof HTMLElement&&!el.dataset.teoNoTilt&&!el.classList.contains('hidden')&&!found.includes(el))found.push(el);
    }
    if(found.length>=8)break;
  }
  const max=4.2;
  for(const el of found){
    el.classList.add('teo-depth-card');
    let frame=0,lastX=0,lastY=0;
    const reset=()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=0;
      el.style.setProperty('--teo-tilt-x','0deg');
      el.style.setProperty('--teo-tilt-y','0deg');
      el.classList.remove('teo-depth-active');
    };
    el.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
      const rect=el.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const x=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));
      const y=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height-.5)*2));
      lastX=(y*-max);lastY=(x*max);
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        el.style.setProperty('--teo-tilt-x',`${lastX.toFixed(2)}deg`);
        el.style.setProperty('--teo-tilt-y',`${lastY.toFixed(2)}deg`);
        el.classList.add('teo-depth-active');
      });
    },{passive:true});
    el.addEventListener('pointerleave',reset,{passive:true});
    el.addEventListener('pointercancel',reset,{passive:true});
  }
})();
