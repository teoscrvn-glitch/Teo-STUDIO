/* TeoStudio V60.8 — keep Admin context while opening the community leaderboard. */
(()=>{'use strict';
 const isAdmin=document.body.classList.contains('admin-body')||!!document.querySelector('.tenant-tabs');
 if(!isAdmin)return;
 const HASH='#teo-rankings';let overlay=null,frame=null,openedByThisPage=false;
 const safePath=()=>location.pathname+location.search;
 function ensure(){if(overlay)return;overlay=document.createElement('section');overlay.id='teoAdminRankingsOverlay';overlay.className='teo-admin-rankings-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Bảng xếp hạng');overlay.innerHTML='<div class="teo-admin-rankings-shell"><header class="teo-admin-rankings-head"><div><b>🏆 Bảng xếp hạng</b><small>Đang mở trong khu vực quản trị · URL và phiên Admin được giữ nguyên</small></div><button type="button" class="teo-admin-rankings-close" aria-label="Đóng bảng xếp hạng">×</button></header><iframe title="Bảng xếp hạng TeoStudio" loading="lazy" referrerpolicy="same-origin"></iframe></div>';document.body.append(overlay);frame=overlay.querySelector('iframe');overlay.querySelector('.teo-admin-rankings-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});}
 function rankingUrl(){const p=new URLSearchParams();p.set('embed','admin');if(document.querySelector('.tenant-tabs')){const q=new URLSearchParams(location.search);const slug=q.get('tenant')||localStorage.getItem('TEO_TENANT_ID')||'';if(slug)p.set('tenant',slug);}return '/rankings.html?'+p.toString();}
 function show(fromHistory=false){ensure();overlay.hidden=false;document.body.classList.add('teo-admin-rankings-open');if(!frame.src||!frame.src.includes('/rankings.html'))frame.src=rankingUrl();if(!fromHistory){openedByThisPage=true;const u=new URL(location.href);u.hash='teo-rankings';history.pushState({...(history.state||{}),teoAdminRankings:true},'',u.pathname+u.search+u.hash);}}
 function hide(){if(!overlay)return;overlay.hidden=true;document.body.classList.remove('teo-admin-rankings-open');}
 function close(){if(openedByThisPage&&history.state?.teoAdminRankings){history.back();return;}const u=new URL(location.href);if(u.hash==='#teo-rankings'){u.hash='';history.replaceState(history.state,'',u.pathname+u.search);}hide();openedByThisPage=false;}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;let u;try{u=new URL(a.href,location.href)}catch{return;}if(u.origin!==location.origin||!(/\/rankings\.html?$/.test(u.pathname)))return;e.preventDefault();show(false);});
 window.addEventListener('popstate',()=>{if(location.hash===HASH){show(true);openedByThisPage=false;}else{hide();openedByThisPage=false;}});
 if(location.hash===HASH){show(true);openedByThisPage=false;}
})();
