/* TeoStudio V60.9 — context-preserving navigation and in-place leaderboard. */
(()=>{'use strict';
 if(window.__TEO_NAV_V609__)return;window.__TEO_NAV_V609__=true;
 const $=(s,r=document)=>r.querySelector(s),q=new URLSearchParams(location.search),sameOrigin=u=>u.origin===location.origin;
 const isRankPath=p=>/\/rankings(?:\.html)?\/?$/i.test(p);
 const body=document.body;
 const contextKeys=['tenant','tenant_id','tenantId','studio','studio_id','studioId','sid','scope','ai','ai_id','aiId','assistant','assistant_id','assistantId','bot_id','botId'];
 function currentContext(){const out={};for(const k of contextKeys){const v=q.get(k);if(v)out[k]=v;}if(q.get('id')&&(/ai|assistant|agent/i.test(location.pathname)||q.has('ai')||q.has('assistant')))out.ai_id=q.get('id');if(!out.tenant&&(/tenant-admin|tenant-detail|share/i.test(location.pathname))){try{out.tenant=localStorage.getItem('TEO_TENANT_ID')||''}catch{}}return out;}
 function addContext(url){if(!sameOrigin(url))return url;const c=currentContext();for(const [k,v] of Object.entries(c))if(v&&!url.searchParams.has(k))url.searchParams.set(k,v);return url;}
 let overlay=null,frame=null,opened=false,sourceFocus=null;
 function rankingUrl(){const u=new URL('/rankings.html',location.origin);u.searchParams.set('embed','app');const c=currentContext();for(const [k,v] of Object.entries(c))if(v)u.searchParams.set(k,v);u.searchParams.set('source',location.pathname);return u.pathname+u.search;}
 function ensureOverlay(){if(overlay)return;overlay=document.createElement('section');overlay.id='teoGlobalRankOverlay';overlay.className='teo-global-rank-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Bảng xếp hạng cộng đồng');overlay.innerHTML='<div class="teo-global-rank-shell"><header class="teo-global-rank-head"><div class="teo-global-rank-brand"><span class="teo-global-rank-mark">T</span><span><b>Bảng xếp hạng</b><small>TeoStudio Community</small></span></div><button type="button" class="teo-global-rank-close" aria-label="Đóng bảng xếp hạng">×</button></header><iframe title="Bảng xếp hạng TeoStudio" loading="lazy" referrerpolicy="same-origin"></iframe></div>';
 document.body.appendChild(overlay);frame=$('iframe',overlay);$('.teo-global-rank-close',overlay).addEventListener('click',closeRank);overlay.addEventListener('click',e=>{if(e.target===overlay)closeRank()});}
 function showRank(fromPop=false){ensureOverlay();if(overlay.hidden){overlay.hidden=false;body.classList.add('teo-global-rank-open');sourceFocus=document.activeElement;}if(!frame.src||!frame.src.includes('/rankings.html'))frame.src=rankingUrl();if(!fromPop&&location.hash!=='#teo-rankings'){opened=true;const u=new URL(location.href);const prev=history.state||{};history.pushState({...prev,teoRankOverlay:true,teoPrevHash:u.hash},'',u.pathname+u.search+'#teo-rankings');}$('.teo-global-rank-close',overlay)?.focus({preventScroll:true});}
 function hideRank(){if(!overlay)return;overlay.hidden=true;body.classList.remove('teo-global-rank-open');if(sourceFocus?.focus)sourceFocus.focus({preventScroll:true});opened=false;}
 function closeRank(){if(location.hash==='#teo-rankings'&&history.state?.teoRankOverlay){history.back();return;}if(location.hash==='#teo-rankings'){const u=new URL(location.href);u.hash='';history.replaceState(history.state,'',u.pathname+u.search);}hideRank();}
 function safeInternalReturn(value){if(!value)return '';try{const u=new URL(value,location.origin);if(!sameOrigin(u)||!u.pathname.startsWith('/')||u.pathname.startsWith('//'))return '';return u.pathname+u.search+u.hash;}catch{return '';}}
 function accountReturnTarget(){const explicit=safeInternalReturn(q.get('return'));if(explicit&&explicit!=='/account.html')return explicit;let remembered='';try{remembered=safeInternalReturn(sessionStorage.getItem('TEO_LAST_INTERNAL_ROUTE')||'')}catch{}if(remembered&&remembered!=='/account.html')return remembered;const c=currentContext();if(c.tenant)return '/share?tenant='+encodeURIComponent(c.tenant);return '/2';}
 if(/\/account(?:\.html)?\/?$/i.test(location.pathname)){const back=$('#accountBackShare');const brand=$('.account-brand');const target=accountReturnTarget();if(back)back.href=target;if(brand)brand.href=target;}
 function closeDrawerAfterOrdinaryNav(){/* Native navigation closes the drawer with the old document. */}
 document.addEventListener('click',e=>{
   const a=e.target.closest?.('a[href]');if(!a)return;
   if(a.hasAttribute('download')||a.target==='_blank'||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   let u;try{u=new URL(a.getAttribute('href'),location.href)}catch{return;}if(!sameOrigin(u))return;
   // Master logo is a dashboard shortcut, not an exit from the Admin shell.
   if(body.classList.contains('admin-body')&&/\/admin(?:\.html)?\/?$/i.test(location.pathname)&&a.matches('.admin-topbar .brand')){
     const dashboard=$('[data-panel="dashboard"]');if(dashboard){e.preventDefault();e.stopImmediatePropagation();dashboard.click();$('.admin-main')?.scrollTo?.({top:0,behavior:'smooth'});return;}
   }
   // Account pages must carry an explicit return route; otherwise their top-level
   // Back/brand links fall back to the public home and lose tenant/admin context.
   if(/\/account(?:\.html)?\/?$/i.test(u.pathname)){
     // Keep an explicitly requested tab, but strengthen its return route with
     // current tenant/AI IDs. Generic '/share' links must not lose the Studio slug.
     let ret;try{ret=new URL(u.searchParams.get('return')||location.pathname+location.search+location.hash,location.origin);}catch{ret=new URL(location.pathname+location.search+location.hash,location.origin);}
     if(sameOrigin(ret)&&ret.pathname!=='/account.html'){
       const c=currentContext();for(const [k,v] of Object.entries(c))if(v&&!ret.searchParams.has(k))ret.searchParams.set(k,v);
       u.searchParams.set('return',ret.pathname+ret.search+ret.hash);
     }else u.searchParams.set('return',location.pathname+location.search+location.hash);
   }
   // Keep stable account/studio/AI context on internal page changes.
   if(!u.hash||u.pathname!==location.pathname){const withCtx=addContext(u);if(withCtx.href!==u.href)a.href=withCtx.pathname+withCtx.search+withCtx.hash;u=withCtx;}
   if(isRankPath(u.pathname)){
     e.preventDefault();e.stopImmediatePropagation();showRank(false);return;
   }
   // Save the exact source route; detail and AI identifiers are not rewritten or discarded.
   try{sessionStorage.setItem('TEO_LAST_INTERNAL_ROUTE',location.pathname+location.search+location.hash);}catch{}
 },true);
 window.addEventListener('popstate',()=>{if(location.hash==='#teo-rankings'){showRank(true)}else hideRank()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay&&!overlay.hidden){e.preventDefault();closeRank()}});
 if(location.hash==='#teo-rankings')showRank(true);
 // Preserve query context when a menu/dock link is injected after DOMContentLoaded.
 document.querySelectorAll('a[href]').forEach(a=>{try{const u=new URL(a.href,location.href);if(sameOrigin(u)&&!isRankPath(u.pathname)){const n=addContext(u);if(n.href!==u.href)a.href=n.pathname+n.search+n.hash;}}catch{}});
})();
