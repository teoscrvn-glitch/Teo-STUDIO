(()=>{'use strict';
const $=s=>document.querySelector(s),cfg=window.TEO_CONFIG||{},api=p=>(cfg.API_BASE_URL||location.origin).replace(/\/$/,'')+p;
const RETURN_STORE='TEO_FREE_BYPASS_ACTIVE_RETURN',q=new URLSearchParams(location.search);
const incoming={tenant:q.get('tenant')||'',state:q.get('state')||'',proof:q.get('proof')||'',exp:Number(q.get('exp')||0)};
let pending=null;
try{
 if(incoming.tenant&&incoming.state&&incoming.proof&&incoming.exp){
  pending=incoming;
  localStorage.setItem(RETURN_STORE,JSON.stringify(pending));
  try{sessionStorage.setItem(RETURN_STORE,JSON.stringify(pending))}catch{}
  history.replaceState({},'',location.pathname);
 }else{
  const raw=localStorage.getItem(RETURN_STORE)||sessionStorage.getItem(RETURN_STORE)||'';
  if(raw)pending=JSON.parse(raw);
 }
}catch{}
let tenant=String(pending?.tenant||incoming.tenant||'').toLowerCase();
let state=String(pending?.state||''),clientProof=String(pending?.proof||''),linkExpiresAt=Number(pending?.exp||0);
const proofKey='TEO_FREE_BYPASS_PROOF:'+tenant;
let issuedKey='',expiresAt=0,tick=null,linkTick=null,stateInvalidated=false,claimInFlight=false;
const status=$('#freeKeyStatus'),create=$('#createFreeKey'),createBox=$('#freeKeyCreateBox'),result=$('#freeKeyResult'),input=$('#freeKeyValue'),copy=$('#copyFreeKey'),back=$('#backToAdmin'),loader=$('#freeKeyLoading');
if(tenant&&back)back.href='/tenant-admin.html?tenant='+encodeURIComponent(tenant);
function cleanReturnUrl(){try{history.replaceState({},'',location.pathname)}catch{}}
function clearReturnData(){try{localStorage.removeItem(RETURN_STORE);sessionStorage.removeItem(RETURN_STORE);localStorage.removeItem(proofKey);sessionStorage.removeItem(proofKey)}catch{}}
function show(msg,type='info'){if(status){status.textContent=msg;if(status.dataset)status.dataset.state=type}}
function format(ms){const sec=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
function setLoading(on){if(loader)loader.hidden=!on;if(createBox&&on)createBox.hidden=true}
function fail(message,{retry=false,clear=false}={}){setLoading(false);if(createBox)createBox.hidden=!retry;if(create){create.disabled=!retry;create.textContent='↻ Thử xác nhận lại'}if(clear){stateInvalidated=true;clearReturnData();cleanReturnUrl()}show(message,'error')}
function expireKey(){if(tick)clearInterval(tick);tick=setInterval(()=>{const left=expiresAt-Date.now(),el=$('#freeKeyCountdown');if(el)el.textContent=left>0?'Mã còn hiệu lực '+format(left):'Mã đã hết hạn. Hãy quay lại Admin để bắt đầu lượt mới.';if(left<=0){clearInterval(tick);issuedKey='';if(input)input.value='';if(result)result.hidden=true;if(copy)copy.disabled=true;show('Mã đã hết hạn. Quay lại Admin để tạo lượt mới.','error')}},1000)}
function expireReturnLink(){if(linkTick)clearInterval(linkTick);if(!linkExpiresAt)return false;const update=()=>{const left=linkExpiresAt-Date.now();if(left<=0){clearInterval(linkTick);fail('Liên kết đã hết hạn. Quay lại Admin để bắt đầu lượt mới.',{clear:true});return false}return true};const valid=update();if(valid)linkTick=setInterval(update,1000);return valid}
function friendlyError(x){const code=String(x?.error||'');if(code==='BYPASS_SESSION_MISMATCH'||code==='TENANT_SESSION_REQUIRED')return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại Admin rồi bắt đầu lượt mới.';if(code==='BYPASS_TENANT_SESSION_MISMATCH')return 'Phiên đăng nhập không khớp Studio. Hãy mở đúng Admin của Studio rồi thử lại.';if(code==='BYPASS_CLIENT_PROOF_MISMATCH')return 'Liên kết không còn khớp với lượt hiện tại. Hãy quay lại Admin và tạo lượt mới.';if(code==='BYPASS_STATE_EXPIRED_OR_USED'||code==='BYPASS_KEY_ALREADY_ISSUED')return 'Liên kết đã hết hạn hoặc đã được sử dụng. Hãy quay lại Admin để bắt đầu lượt mới.';return x?.message||'Chưa thể tạo mã lúc này. Vui lòng thử lại.'}
async function issueKey(){if(claimInFlight||stateInvalidated||issuedKey)return;
 if(!state||!tenant||!clientProof||!/^\d+$/.test(String(linkExpiresAt))){fail('Liên kết không hợp lệ hoặc đã hết hạn. Hãy bắt đầu lại từ Admin.',{clear:true});return}
 let storedProof='';try{storedProof=sessionStorage.getItem(proofKey)||localStorage.getItem(proofKey)||''}catch{}
 if(storedProof!==clientProof){fail('Không tìm thấy phiên bắt đầu lượt này trên trình duyệt. Hãy quay lại Admin, tạo link mới và mở bằng cùng trình duyệt.',{clear:false});return}
 let tenantToken='';try{tenantToken=localStorage.getItem('TEO_TENANT_SESSION')||sessionStorage.getItem('TEO_TENANT_SESSION')||''}catch{}
 if(!tenantToken){fail('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại Admin rồi bắt đầu lượt mới.',{clear:false});return}
 if(Date.now()>=linkExpiresAt){fail('Liên kết đã hết hạn. Quay lại Admin để bắt đầu lượt mới.',{clear:true});return}
 claimInFlight=true;setLoading(true);show('Đang xác nhận liên kết và tạo mã cho Studio của bạn…');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const r=await fetch(api('/api/rental/free/bypass/issue'),{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tenantToken,'x-tenant-slug':tenant},body:JSON.stringify({state,clientProof}),cache:'no-store',signal:controller.signal});
  const x=await r.json().catch(()=>({}));
  if(!r.ok){const terminal=['BYPASS_STATE_EXPIRED_OR_USED','BYPASS_KEY_ALREADY_ISSUED','BYPASS_CLIENT_PROOF_MISMATCH','BYPASS_SESSION_MISMATCH','BYPASS_TENANT_SESSION_MISMATCH'].includes(String(x.error||''));if(terminal)fail(friendlyError(x),{clear:true});else fail(friendlyError(x),{retry:true});return}
  issuedKey=String(x.key||'');
  if(!/^TEO-[A-HJ-NP-Z2-9]{20}$/.test(issuedKey)){issuedKey='';fail('Máy chủ chưa trả về mã hợp lệ. Hãy thử lại.',{retry:true});return}
  expiresAt=Number(x.expiresAt)||Date.now()+300000;
  clearReturnData();if(linkTick)clearInterval(linkTick);cleanReturnUrl();setLoading(false);
  if(input)input.value=issuedKey;if(result)result.hidden=false;if(createBox)createBox.hidden=true;
  const step=Number(x.step||1),provider=String(x.provider||'');
  const title=$('#freeKeyTitle'),lead=$('#freeKeyLead'),badge=$('#freeKeyProvider');
  if(title)title.textContent='Bạn đã nhận được mã Free!';
  if(lead)lead.textContent='Sao chép mã bên dưới, quay lại Admin và nhập trong 5 phút để nhận thêm 7 ngày Free.';
  if(badge)badge.textContent=provider?`${provider} · Lượt ${step}/2`:`Lượt ${step}/2`;
  show('Mã đã sẵn sàng. Hãy sao chép và nhập vào Admin ngay nhé.','success');
  if(copy)copy.disabled=false;expireKey();
 }catch(e){fail(e?.name==='AbortError'?'Kết nối đang chậm. Kiểm tra mạng rồi thử lại.':'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',{retry:true})}
 finally{clearTimeout(timeout);claimInFlight=false}
}
create?.addEventListener('click',issueKey);
copy?.addEventListener('click',async()=>{if(!issuedKey||Date.now()>=expiresAt)return show('Mã đã hết hạn. Hãy quay lại Admin để tạo lượt mới.','error');let ok=false;try{await navigator.clipboard.writeText(issuedKey);ok=true}catch{}if(!ok){try{input.focus();input.select();ok=document.execCommand('copy')}catch{}}if(!ok)return show('Không thể sao chép tự động. Hãy nhấn giữ mã để sao chép thủ công.','error');show('Đã sao chép mã. Quay lại Admin và dán vào ô nhận key nhé.','success')});
if(!state||!tenant||!clientProof||!linkExpiresAt){fail('Liên kết không hợp lệ hoặc đã hết hạn. Hãy quay lại Admin để bắt đầu lượt mới.',{clear:false})}
else if(expireReturnLink())issueKey();
})();