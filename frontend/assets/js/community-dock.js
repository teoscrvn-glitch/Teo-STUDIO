(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const legacyIconMap={[String.fromCodePoint(0x1F6DF)]:'lifebuoy',[String.fromCodePoint(0x1F465)]:'users',[String.fromCodePoint(0x2601,0xFE0F)]:'cloud',[String.fromCodePoint(0x2601)]:'cloud',[String.fromCodePoint(0x1F4AC)]:'message',[String.fromCodePoint(0x1F464)]:'user',[String.fromCodePoint(0x2726)]:'star',[String.fromCodePoint(0x1F3C6)]:'crown',[String.fromCodePoint(0x2197)]:'link'};const spriteNames=new Set(['home','grid','folder','download','upload','link','wallet','card','bell','shield','settings','users','chart','search','menu','close','crown','star','qr','message','lifebuoy','megaphone','check','arrow-right','cloud','zap','lock','store','logout','user','more','gamepad','code','calendar','eye','heart','play','volume-2','volume-x']);const renderIcon=value=>{const raw=String(value||'link'),name=legacyIconMap[raw]||(spriteNames.has(raw)?raw:'');return name?`<svg class="i" aria-hidden="true"><use href="/assets/icons.svg#${name}"></use></svg>`:esc(raw)};
const api=p=>(window.TEO_CONFIG?.API_BASE_URL||location.origin).replace(/\/$/,'')+p;
const safeUrl=v=>{try{const raw=String(v??'').trim();if(!raw||raw==='#')return '';const u=new URL(raw,location.origin);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
const tenantSlug=()=>{const q=new URLSearchParams(location.search);return String(q.get('tenant')||((/tenant-admin/i.test(location.pathname))?localStorage.getItem('TEO_TENANT_ID')||'':'' )).trim()};
async function getSettings(){const slug=tenantSlug();const path=slug?'/api/public-tenant/'+encodeURIComponent(slug):'/api/settings';try{const r=await fetch(api(path),{cache:'no-store',headers:{accept:'application/json'}});const x=await r.json().catch(()=>({}));return r.ok?(x.settings||{}):{}}catch{return {}}}
function renderDock(settings){
 if($('#teoCommunityDock'))return;
 const root=document.createElement('aside');root.id='teoCommunityDock';root.className='teo-community-dock';
 root.innerHTML=`<section class="tcd-panel" id="tcdPanel" aria-label="Trung tâm hỗ trợ" aria-hidden="true">
 <div class="tcd-panel-head"><div><b>Trung tâm hỗ trợ</b><small>Liên hệ · Cộng đồng · Tiện ích</small></div><button class="tcd-close" type="button" aria-label="Đóng">×</button></div>
 <div class="tcd-links" id="tcdLinks"></div><div class="tcd-player" id="tcdPlayer" hidden></div>
 <div class="tcd-divider"></div><div class="tcd-tools"><button class="tcd-tool" type="button" id="tcdMusic">♫ Nhạc nền</button><button class="tcd-tool" type="button" id="tcdClick">Âm click: Bật</button></div>
 <p class="tcd-footnote">Nhạc chỉ phát khi bạn chủ động bật. Các liên kết ngoài sẽ mở ở tab mới.</p>
 </section>
 <button class="tcd-launcher" id="tcdLauncher" type="button" aria-label="Mở trung tâm hỗ trợ và tiện ích" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.8 14.6 8l5.6.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4L9.4 8 12 2.8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m4 19 3-1.2M20 19l-3-1.2M12 21v-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><i class="tcd-dot"></i></button>`;
 document.body.appendChild(root);
 const panel=$('#tcdPanel',root),launcher=$('#tcdLauncher',root),links=$('#tcdLinks',root),player=$('#tcdPlayer',root),musicBtn=$('#tcdMusic',root),clickBtn=$('#tcdClick',root);
 const items=[];
 const add=(label,url,icon,desc='',wide=false,group='support')=>{const href=safeUrl(url);if(!label||!href||href==='#')return;items.push({label,url:href,icon:icon||'link',description:desc,wide,group})};
 add('Admin liên hệ',settings.adminContact,'lifebuoy','Cần hỗ trợ hoặc báo lỗi',false,'support');
 add('Nhóm cộng đồng',settings.groupLink,'users','Trao đổi và nhận cập nhật',false,'support');
 add('Thuê Share File','/rent.html','cloud','Tạo hoặc quản lý Studio',false,'support');
 add('Zalo tư vấn thuê',settings.rentZalo,'message','Liên hệ tư vấn gói Studio',false,'support');
 (Array.isArray(settings.communityBoxes)?settings.communityBoxes:[]).slice(0,12).forEach((b)=>add(String(b.label||b.title||'').slice(0,48),b.url,b.icon||'link',String(b.description||'').slice(0,100),false,'custom'));
 add('Tài khoản TeoStudio','/account.html','user','Đơn mua · Ví · Bảo mật',false,'account');
 add('Hội viên của tôi','/account.html?tab=memberships','star','Gói hội viên đã mua',false,'account');
 const slugForRank=tenantSlug(),rankReturn=slugForRank?'/rankings.html?tenant='+encodeURIComponent(slugForRank):(location.pathname==='/'||location.pathname==='/intro'||location.pathname==='/intro.html'?'/rankings.html?return=%2F':location.pathname==='/2'||location.pathname==='/index.html'?'/rankings.html?return=%2F2':'/rankings.html?return='+encodeURIComponent(location.pathname+location.search));add('Bảng xếp hạng',rankReturn,'crown','Thành tích cộng đồng',false,'account');
 const actionHtml=it=>`<a class=\"tcd-action ${it.wide?'tcd-wide':''}\" href=\"${esc(it.url)}\" ${new URL(it.url).origin!==location.origin?'target=\"_blank\" rel=\"noopener noreferrer\"':''}><span class=\"tcd-icon\">${renderIcon(it.icon)}</span><span class=\"tcd-copy\"><b>${esc(it.label)}</b>${it.description?`<small>${esc(it.description)}</small>`:''}</span></a>`;const groups=[['support','LIÊN HỆ & CỘNG ĐỒNG'],['custom','TIỆN ÍCH STUDIO'],['account','TÀI KHOẢN & THÀNH TÍCH']];links.innerHTML=groups.map(([key,title])=>{const groupItems=items.filter(it=>it.group===key);return groupItems.length?`<div class=\"tcd-group\"><div class=\"tcd-group-title\">${title}</div>${groupItems.map(actionHtml).join('')}</div>`:''}).join('')||'<div class=\"tcd-editor-empty\">Chưa có liên kết hỗ trợ. Chủ Studio có thể thêm trong phần Cài đặt.</div>';
 const aiWrap=()=>document.getElementById('teoAiWrap');const syncAiPosition=()=>{const ai=aiWrap();if(!ai)return;if(!root.classList.contains('is-open')){ai.style.removeProperty('--tcd-ai-bottom');return}requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!root.classList.contains('is-open'))return;const rect=panel.getBoundingClientRect(),bottom=Math.max(88,Math.min(window.innerHeight-80,window.innerHeight-rect.top+12));ai.style.setProperty('--tcd-ai-bottom',bottom+'px')}))};const closeDock=()=>{root.classList.remove('is-open');document.body.classList.remove('teo-community-open');launcher.setAttribute('aria-expanded','false');panel.setAttribute('aria-hidden','true');syncAiPosition()};const toggle=()=>{const open=!root.classList.contains('is-open');root.classList.toggle('is-open',open);document.body.classList.toggle('teo-community-open',open);launcher.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));if(open)stopMusicIfPlayerHidden(false);syncAiPosition()};
 launcher.addEventListener('click',toggle);$('.tcd-close',root).addEventListener('click',toggle);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('is-open'))closeDock()});window.addEventListener('resize',syncAiPosition,{passive:true});
 document.addEventListener('click',e=>{if(root.classList.contains('is-open')&&!root.contains(e.target))closeDock()},{capture:true});
 // Lightweight click sound is generated locally; opt-out persists on this device.
 let clickEnabled=true;try{clickEnabled=localStorage.getItem('teo:clickSound')!=='0'}catch{}
 let audioCtx=null,ambientNodes=[],audioEl=null;
 const context=()=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{audioCtx||=new C();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}};
 const tone=(hz=580)=>{if(!clickEnabled)return;const c=context();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.018,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.038);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.045)};
 document.addEventListener('click',e=>{if(e.target.closest('button,.btn,.tcd-action,[role="button"]')&&!e.target.closest('#tcdClick,#tcdMusic'))tone()},{capture:true});
 const updateClick=()=>{clickBtn.textContent='Âm click: '+(clickEnabled?'Bật':'Tắt');clickBtn.setAttribute('aria-pressed',String(clickEnabled))};
 clickBtn.addEventListener('click',()=>{clickEnabled=!clickEnabled;try{localStorage.setItem('teo:clickSound',clickEnabled?'1':'0')}catch{}updateClick();if(clickEnabled)tone(720)});
 const stopMusic=()=>{ambientNodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch{}});ambientNodes=[];if(audioEl){try{audioEl.pause();audioEl.remove()}catch{}audioEl=null}player.hidden=true;player.innerHTML='';musicBtn.textContent='♫ Nhạc nền'};
 function stopMusicIfPlayerHidden(){if(player.hidden)stopMusic()}
 const startAmbient=()=>{const c=context();if(!c)return;stopMusic();player.hidden=false;player.innerHTML='<small>Âm nền TeoStudio · tạo trực tiếp trên thiết bị</small><span style="font-size:11px;color:#e6f2f2">Đang phát âm thanh nền nhẹ.</span>';musicBtn.textContent='♫ Tắt nhạc';const master=c.createGain();master.gain.value=.035;master.connect(c.destination);ambientNodes.push(master);[174.61,220,261.63,329.63].forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=[.14,.09,.06,.035][i];o.connect(g);g.connect(master);o.start();ambientNodes.push(o,g)});const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.07;lg.gain.value=.009;lfo.connect(lg);lg.connect(master.gain);lfo.start();ambientNodes.push(lfo,lg)};
 const youtubeId=raw=>{try{const u=new URL(raw),h=u.hostname.replace(/^www\./,'').replace(/^m\./,'');if(h==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||'';if(['youtube.com','youtube-nocookie.com'].includes(h))return u.searchParams.get('v')||((u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)||[])[1]||'')}catch{}return ''};
 const musicUrl=safeUrl(settings.backgroundMusicUrl||'');
 const playMusic=()=>{
  if(!musicUrl){if(ambientNodes.length||audioEl){stopMusic();return}startAmbient();return}
  if(!player.hidden||audioEl||ambientNodes.length){stopMusic();return}
  player.hidden=false;musicBtn.textContent='♫ Tắt nhạc';
  const yt=youtubeId(musicUrl);
  if(yt&&/^[A-Za-z0-9_-]{6,20}$/.test(yt)){player.innerHTML='<small>Trình phát nhạc</small><iframe title="Nhạc nền TeoStudio" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(yt)+'?autoplay=1&playsinline=1"></iframe>';return}
  if(/tiktok\.com$/i.test(new URL(musicUrl).hostname)){player.innerHTML='<small>Nhạc được cấu hình từ TikTok</small><a class="tcd-action tcd-wide" target="_blank" rel="noopener noreferrer" href="'+esc(musicUrl)+'">Mở TikTok để phát ↗</a>';return}
  player.innerHTML='<small>Trình phát nhạc</small>';
  audioEl=document.createElement('audio');audioEl.controls=true;audioEl.preload='none';audioEl.src=musicUrl;audioEl.playsInline=true;player.appendChild(audioEl);audioEl.play().catch(()=>{player.insertAdjacentHTML('beforeend','<small>Trình duyệt yêu cầu nhấn nút Play trên trình phát.</small>')});
 };
 musicBtn.addEventListener('click',playMusic);updateClick();
}
function setupCommunityEditor(settings){
 const path=location.pathname.toLowerCase(),isMaster=path.includes('/admin.html'),isTenant=path.includes('/tenant-admin.html');if(!isMaster&&!isTenant)return;
 const form=$(isMaster?'#settingsForm':'#settings');if(!form||$('#tcdCommunityEditor'))return;
 let rows=Array.isArray(settings.communityBoxes)?settings.communityBoxes.slice(0,12).map(x=>({...x})): [];
 const hidden=document.createElement('input');hidden.type='hidden';hidden.name='communityBoxes';hidden.value='[]';form.appendChild(hidden);
 const editor=document.createElement('section');editor.className='tcd-editor';editor.id='tcdCommunityEditor';
 editor.innerHTML='<div class="tcd-editor-head"><b>Liên kết trong bong bóng đa năng</b><button type="button" id="tcdAddBox">＋ Tạo thêm nút</button></div><p>Admin liên hệ và Nhóm cộng đồng lấy từ hai ô cài đặt phía trên. Tại đây bạn tạo thêm các nút tùy chỉnh: tên nút, biểu tượng và đường dẫn. Tối đa 12 nút.</p><div class="tcd-editor-list" id="tcdEditorList"></div>';
 const anchor=form.querySelector('[name="backgroundMusicUrl"]')?.closest('label')||form.querySelector('[name="groupLink"]')?.closest('label');
 if(anchor?.parentNode)anchor.parentNode.insertBefore(editor,anchor.nextSibling);else form.appendChild(editor);
 const list=$('#tcdEditorList',editor);
 const sync=()=>{hidden.value=JSON.stringify(rows.map(x=>({id:String(x.id||''),label:String(x.label||'').trim(),icon:String(x.icon||'link').trim().slice(0,8),url:safeUrl(x.url),description:String(x.description||'').trim()})).filter(x=>x.label&&x.url))};
 const render=()=>{list.innerHTML='';if(!rows.length){list.innerHTML='<div class="tcd-editor-empty">Chưa có nút tùy chỉnh. Bấm “Tạo thêm nút” để thêm link vào bong bóng.</div>';sync();return}
 rows.forEach((row,index)=>{const el=document.createElement('div');el.className='tcd-editor-row';el.innerHTML='<input aria-label="Biểu tượng nút" maxlength="8" placeholder="Icon" value="'+esc(row.icon||'link')+'"><div class="tcd-row-main"><input aria-label="Tên nút" maxlength="48" required placeholder="Ví dụ: Kênh YouTube" value="'+esc(row.label||'')+'"><input aria-label="Đường dẫn nút" maxlength="2000" required type="text" inputmode="url" placeholder="/duong-dan hoặc https://..." value="'+esc(row.url||'')+'"><input aria-label="Mô tả nút (không bắt buộc)" maxlength="100" placeholder="Mô tả ngắn" value="'+esc(row.description||'')+'"></div><button type="button" aria-label="Xóa nút" title="Xóa">×</button>';
 const inputs=el.querySelectorAll('input');inputs.forEach((input,i)=>input.addEventListener('input',()=>{if(i===0)row.icon=input.value;else if(i===1)row.label=input.value;else if(i===2)row.url=input.value;else row.description=input.value;sync()}));el.querySelector('button').addEventListener('click',()=>{rows.splice(index,1);render()});list.appendChild(el)});
 sync()};
 $('#tcdAddBox',editor).addEventListener('click',()=>{if(rows.length>=12){alert('Tối đa 12 nút tùy chỉnh.');return}rows.push({id:'',label:'',icon:'link',url:'',description:''});render();list.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'})});
 render();
 window.addEventListener('teo:community-settings',event=>{const next=event.detail?.communityBoxes;if(Array.isArray(next)){rows=next.slice(0,12).map(x=>({...x}));render()}});
}
async function init(){setupCommunityEditor({communityBoxes:[]});const settings=await getSettings();renderDock(settings);window.dispatchEvent(new CustomEvent('teo:community-settings',{detail:settings}));document.body.dataset.teoCommunity='60'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();