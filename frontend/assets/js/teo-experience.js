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

  // Audio and click feedback are provided by the shared community hub (community-dock.js).

  // Accessible loading state for explicit long-running actions; do not hijack form submission.
  doc.addEventListener('click',e=>{const b=e.target.closest('button[data-loading-label]');if(!b||b.disabled)return;const label=b.dataset.loadingLabel||'Đang xử lý…';b.dataset.originalLabel=b.textContent;b.textContent=label;b.classList.add('teo-is-loading');b.setAttribute('aria-busy','true');b.disabled=true;const restore=()=>{if(!b.isConnected)return;b.textContent=b.dataset.originalLabel||b.textContent;b.classList.remove('teo-is-loading');b.removeAttribute('aria-busy');b.disabled=false};b.addEventListener('teo:complete',restore,{once:true});setTimeout(restore,15000)},{capture:true});

  // Low-cost reveal for cards; IntersectionObserver avoids animating off-screen nodes.
  // Large Admin/Studio portals already contain many forms and tables. Skip
  // per-card reveal observers there so authentication and first paint stay responsive.
  if(!body.classList.contains('admin-body')&&!reduced&&'IntersectionObserver'in window){const targets=doc.querySelectorAll('.product-card,.tenant-note-card,.seller-performance-card,.stat-card,.creator-hub-card');const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('teo-revealed');io.unobserve(x.target)}}),{threshold:.08});targets.forEach((el,i)=>{if(i<48){el.classList.add('teo-reveal');io.observe(el)}})}
})();
