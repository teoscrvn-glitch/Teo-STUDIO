const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const cfg=window.TEO_CONFIG||{};const api=p=>(cfg.API_BASE_URL||'').replace(/\/$/,'')+p;
function key(){return sessionStorage.getItem('TEO_ADMIN_SESSION')||''}
function setLocked(v){document.body.classList.toggle('admin-locked',v);const g=$('#adminLoginGate');if(g)g.style.display=v?'flex':'none'}
function loginMessage(t){const x=$('#adminLoginMsg');if(x)x.textContent=t||''}
async function validateToken(t){
  if(!t)return false;
  try{
    const r=await fetch(api('/api/admin/stats?days=1'),{headers:{authorization:'Bearer '+t},cache:'no-store'});
    return r.ok;
  }catch{return false}
}
async function doLogin(password){
  const r=await fetch(api('/api/admin/login'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok||!x.token)throw Error(x.error||'LOGIN_FAILED');
  sessionStorage.setItem('TEO_ADMIN_SESSION',x.token);
  return x.token;
}
async function login(){
  // Never silently trust a stale session. If it is invalid, the visible login gate is mandatory.
  setLocked(true);
  const old=key();
  if(old&&await validateToken(old)){setLocked(false);return old}
  sessionStorage.removeItem('TEO_ADMIN_SESSION');
  const form=$('#adminLoginForm'),input=$('#adminLoginPassword');
  if(!form||!input)throw Error('LOGIN_UI_MISSING');
  return await new Promise((resolve,reject)=>{
    let busy=false;
    form.onsubmit=async e=>{
      e.preventDefault();
      if(busy)return;
      const password=input.value;
      if(!password){loginMessage('Vui lòng nhập mật khẩu Admin.');return}
      busy=true;input.disabled=true;$('#adminLoginButton').disabled=true;loginMessage('Đang kết nối máy chủ...');
      try{
        const token=await doLogin(password);
        setLocked(false);loginMessage('');resolve(token);
      }catch(err){
        loginMessage(err.message==='INVALID_PASSWORD'?'Sai mật khẩu Admin.':'Không kết nối được máy chủ Admin.');
        input.value='';input.focus();
      }finally{busy=false;input.disabled=false;$('#adminLoginButton').disabled=false}
    };
    input.focus();
  });
}
async function req(p,o={}){const h={'content-type':'application/json',...(o.headers||{}),authorization:'Bearer '+key()};const r=await fetch(api(p),{...o,headers:h,cache:'no-store'});let x={};try{x=await r.json()}catch{}if(r.status===401){sessionStorage.removeItem('TEO_ADMIN_SESSION');setLocked(true);throw Error('ADMIN_REQUIRED')}if(!r.ok)throw Error(x.error||`API ${r.status}`);return x}
let state={products:[],tags:[],settings:{},productLimit:20,commentLimit:20,showHiddenProducts:false,showHiddenComments:false};
window.openPanel=id=>{document.querySelectorAll('.admin-panel').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('.admin-nav').forEach(x=>x.classList.toggle('active',x.dataset.panel===id));if(id==='products')loadProducts();if(id==='comments')loadComments();if(id==='notices'||id==='settings')loadSettings();if(id==='dashboard')loadStats()};
document.querySelectorAll('.admin-nav').forEach(n=>n.addEventListener('click',()=>openPanel(n.dataset.panel)));
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2500)}
async function compress(file,max=600,q=.72){return new Promise(resolve=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',q))};i.src=r.result};r.readAsDataURL(file)})}
function fmt(v){if(!v)return '';const d=new Date(String(v).replace(' ','T')+'Z');return Number.isNaN(d.getTime())?String(v):d.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function buildGameOptions(){const parents=state.tags.filter(t=>!t.parent_id);$('#gameSelect').innerHTML=parents.map(p=>{const kids=state.tags.filter(t=>t.parent_id===p.id);return `<option value="${esc(p.name)}">${esc(p.name)}</option>${kids.map(k=>`<option value="${esc(k.name)}">↳ ${esc(k.name)}</option>`).join('')}`}).join('')||'<option value="">Chưa có tag</option>'}
async function loadProducts(){const [a,b]=await Promise.all([req('/api/admin/products'),req('/api/tags')]);state.products=a.products||[];state.tags=b.tags||[];$('#statProducts').textContent=state.products.filter(x=>Number(x.visible)!==0).length;$('#statTags').textContent=state.tags.filter(x=>!x.parent_id).length;buildGameOptions();renderTagManager();renderProducts()}
function renderProducts(){const all=state.products.filter(p=>state.showHiddenProducts?Number(p.visible)===0:Number(p.visible)!==0),shown=all.slice(0,state.productLimit);$('#productTable').innerHTML=shown.map(p=>`<tr><td><img class="admin-thumb" src="${esc(p.thumb||'assets/img/default-avatar.svg')}" onerror="this.onerror=null;this.src='assets/img/default-avatar.svg'"></td><td><b>${esc(p.title)}</b><small>${esc(p.description||'')}</small><small>${fmt(p.created_at)}</small></td><td>${esc(p.game||'')}</td><td>👁 ${Number(p.views||0).toLocaleString('vi-VN')}</td><td><a class="table-link" href="${esc(p.download_link||'#')}" target="_blank">Mở ↗</a></td><td><button class="table-btn" onclick="editProduct('${esc(p.id)}')">Sửa</button><button class="table-btn" onclick="toggleProductVisibility('${esc(p.id)}',${Number(p.visible)!==0})">${Number(p.visible)!==0?'Ẩn':'Hiện'}</button><button class="table-btn danger" onclick="deleteProduct('${esc(p.id)}')">Xóa</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Không có file trong mục này.</td></tr>';const more=all.length>state.productLimit;$('#productMore').innerHTML=more?`<button class="btn ghost" onclick="state.productLimit+=20;renderProducts()">Mở thêm 20 (${state.productLimit}/${all.length})</button>`:''}
window.toggleProductVisibility=async(id,visible)=>{try{await req('/api/admin/products/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({visible:!visible})});toast(visible?'Đã ẩn file.':'Đã hiện file.');await loadProducts()}catch(e){toast(e.message)}};

function renderTagManager(){const parents=state.tags.filter(t=>!t.parent_id);$('#tagParent').innerHTML='<option value="">+ Tạo tag chính</option>'+parents.map(t=>`<option value="${esc(t.id)}">↳ ${esc(t.name)} (tạo tag phụ)</option>`).join('');$('#tagAdminGrid').innerHTML=parents.map(p=>`<div class="tag-tree-item"><div class="tag-admin parent"><span>🏷️ <b>${esc(p.name)}</b></span><div><button class="table-btn" onclick="editTag('${esc(p.id)}','${esc(p.name)}','')">Sửa</button><button class="table-btn danger" onclick="deleteTag('${esc(p.id)}','${esc(p.name)}')">Xóa</button></div></div>${state.tags.filter(t=>t.parent_id===p.id).map(c=>`<div class="tag-admin child"><span>↳ ${esc(c.name)}</span><div><button class="table-btn" onclick="editTag('${esc(c.id)}','${esc(c.name)}','${esc(p.id)}')">Sửa</button><button class="table-btn danger" onclick="deleteTag('${esc(c.id)}','${esc(c.name)}')">Xóa</button></div></div>`).join('')}</div>`).join('')||'<p class="muted">Chưa có tag. Hãy tạo tag chính ngay tại đây.</p>'}
window.focusTagBox=()=>{openPanel('products');setTimeout(()=>$('#tagManager')?.scrollIntoView({behavior:'smooth',block:'center'}),50)};
window.newProductForm=()=>{$('#productForm').reset();$('#productForm [name=id]').value='';$('#productFormCard').classList.remove('hidden');openPanel('products')};window.cancelProduct=()=>$('#productFormCard').classList.add('hidden');
window.editProduct=id=>{const p=state.products.find(x=>x.id===id);if(!p)return;openPanel('products');$('#productFormCard').classList.remove('hidden');for(const k of ['id','title','game','description','downloadLink','warning']){const e=$(`#productForm [name="${k}"]`);if(e)e.value=p[k]??p[k==='downloadLink'?'download_link':k]??''}$('#productForm [name=thumb]').value=p.thumb||'';window.scrollTo({top:0,behavior:'smooth'})};
window.deleteProduct=async id=>{if(!confirm('Xóa file này?'))return;try{await req('/api/admin/products/'+id,{method:'DELETE'});toast('Đã xóa file và đồng bộ.');loadProducts();loadStats()}catch(e){toast(e.message)}};
$('#productForm').addEventListener('change',async e=>{if(e.target.name==='thumbFile'&&e.target.files[0]){$('#productForm [name=thumb]').value=await compress(e.target.files[0]);toast('Đã lấy ảnh từ thư viện.')}});
$('#productForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),id=f.get('id'),body={title:f.get('title'),game:f.get('game'),description:f.get('description'),thumb:f.get('thumb'),download_link:f.get('downloadLink'),warning:f.get('warning'),visible:true};try{await req(id?'/api/admin/products/'+id:'/api/admin/products',{method:id?'PUT':'POST',body:JSON.stringify(body)});$('#productFormCard').classList.add('hidden');toast(id?'Đã sửa file và đồng bộ.':'Đã thêm file và đồng bộ.');loadProducts();loadStats()}catch(e){toast(e.message)}};
window.editTag=async(id,name,parent)=>{const n=prompt('Tên tag mới:',name);if(n===null||!n.trim())return;let parentId=parent||'';try{await req('/api/admin/tags/'+id,{method:'PUT',body:JSON.stringify({name:n.trim(),parent_id:parentId})});toast('Đã sửa tag.');loadProducts()}catch(e){toast(e.message)}};
window.deleteTag=async(id,name)=>{if(!confirm(`Xóa tag "${name}" và các tag phụ của nó?`))return;try{await req('/api/admin/tags/'+id,{method:'DELETE'});toast('Đã xóa tag.');loadProducts()}catch(e){toast(e.message)}};
$('#tagForm').onsubmit=async e=>{e.preventDefault();const n=e.target.tag.value.trim(),parent=e.target.parent_id.value;if(!n)return;try{await req('/api/admin/tags',{method:'POST',body:JSON.stringify({name:n,parent_id:parent})});e.target.reset();toast(parent?'Đã thêm tag phụ.':'Đã thêm tag chính.');loadProducts()}catch(e){toast(e.message)}};
async function loadComments(){try{const x=await req('/api/admin/comments');state.comments=x.comments||[];renderComments()}catch(e){toast(e.message)}}
function renderComments(){const all=state.comments.filter(c=>state.showHiddenComments?Number(c.visible)===0:Number(c.visible)!==0),shown=all.slice(0,state.commentLimit);$('#adminComments').innerHTML=shown.map(c=>`<div class="admin-comment"><div><b>${esc(c.name||'Ẩn danh')}</b><small>${fmt(c.created_at)}</small></div>${c.text?`<p>${esc(c.text)}</p>`:''}${c.image?`<img class="comment-image-admin" src="${esc(c.image)}">`:''}<button class="table-btn" onclick="toggleCommentVisibility('${esc(c.id)}',${Number(c.visible)!==0})">${Number(c.visible)!==0?'Ẩn':'Hiện'}</button><button class="table-btn danger" onclick="deleteComment('${esc(c.id)}')">Xóa</button></div>`).join('')||'<p class="muted">Không có bình luận trong mục này.</p>';const more=all.length>state.commentLimit;$('#commentMore').innerHTML=more?`<button class="btn ghost" onclick="state.commentLimit+=20;renderComments()">Mở thêm 20 (${state.commentLimit}/${all.length})</button>`:''}
window.toggleCommentVisibility=async(id,visible)=>{try{await req('/api/admin/comments/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({visible:!visible})});toast(visible?'Đã ẩn bình luận.':'Đã hiện bình luận.');await loadComments()}catch(e){toast(e.message)}};
window.deleteComment=async id=>{if(!confirm('Xóa bình luận này?'))return;try{await req('/api/admin/comments/'+id,{method:'DELETE'});toast('Đã xóa bình luận.');loadComments()}catch(e){toast(e.message)}};
$('#settingsForm').addEventListener('change',async e=>{if(e.target.name==='avatarFile'&&e.target.files[0]){$('#settingsForm [name=avatar]').value=await compress(e.target.files[0]);toast('Đã lấy avatar từ thư viện.')}});
$('#donateForm').addEventListener('change',async e=>{if(e.target.name==='donateQrFile'&&e.target.files[0]){$('#donateForm [name=donateQr]').value=await compress(e.target.files[0]);$('#donatePreview').src=$('#donateForm [name=donateQr]').value;$('#donatePreview').classList.remove('hidden');toast('Đã lấy QR Donate.')}});
async function saveSettings(data,msg){try{await req('/api/admin/settings',{method:'PUT',body:JSON.stringify(data)});toast(msg);loadSettings()}catch(e){toast(e.message)}}
$('#noticeForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);saveSettings({announcementTitle:f.get('announcementTitle'),announcementText:f.get('announcementText'),announcementEnabled:f.get('announcementEnabled')==='true'},'Đã cập nhật thông báo toàn web.')};
$('#settingsForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);saveSettings({siteName:f.get('siteName'),studio:f.get('studio'),heroTitle:f.get('heroTitle'),heroText:f.get('heroText'),avatar:f.get('avatar'),groupLink:f.get('groupLink'),adminContact:f.get('adminContact'),rentZalo:f.get('rentZalo')},'Đã cập nhật giao diện toàn web.')};
$('#donateForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);saveSettings({donateTitle:f.get('donateTitle'),donateText:f.get('donateText'),donateQr:f.get('donateQr')},'Đã cập nhật Donate Téo.')};
$('#showVisibleProducts').onclick=()=>{state.showHiddenProducts=false;state.productLimit=20;renderProducts()};$('#showHiddenProducts').onclick=()=>{state.showHiddenProducts=true;state.productLimit=20;renderProducts()};$('#showVisibleComments').onclick=()=>{state.showHiddenComments=false;state.commentLimit=20;renderComments()};$('#showHiddenComments').onclick=()=>{state.showHiddenComments=true;state.commentLimit=20;renderComments()};
$('#statsRange').onchange=loadStats;$('#refreshStats').onclick=loadStats;$('#refreshComments').onclick=loadComments;$('#passwordForm').onsubmit=async e=>{e.preventDefault();const p=e.target.newPassword.value;try{await req('/api/admin/change-password',{method:'POST',body:JSON.stringify({newPassword:p})});e.target.reset();toast('Đã đổi mật khẩu Admin.')}catch(x){toast(x.message)}};
(async()=>{try{await login();await req('/api/health');await loadProducts();await loadSettings();await loadStats();await loadComments();setInterval(loadStats,180000);toast('Admin đã kết nối Cloud.')}catch(e){toast(e.message)}})();
