(()=>{
  'use strict';
  const cfg=window.TEO_CONFIG||{}, api=p=>(cfg.API_BASE_URL||'').replace(/\/$/,'')+p;
  const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Math.max(0,Number(v)||0).toLocaleString('vi-VN')+'đ';
  function getTeoDeviceId(){try{let id=localStorage.getItem('TEO_DEVICE_ID')||'';if(!/^[A-Za-z0-9._:-]{12,100}$/.test(id)){id=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('TEO_DEVICE_ID',id)}return id}catch{return ''}}
  const readToken=()=>localStorage.getItem('TEO_BUYER_SESSION')||sessionStorage.getItem('TEO_BUYER_SESSION')||'';
  let token=readToken(),walletData=null,catalogData=null,toastTimer=null;
  const params=new URLSearchParams(location.search);
  const selectedProduct=params.get('product')||'',selectedScope=params.get('scope')||'',selectedTenant=params.get('tenant')||'';
  function notice(message,type='info'){
    const el=$('#sellerToast');if(!el)return;
    el.textContent=String(message||'');el.className='seller-toast show '+(type==='error'?'error':type==='success'?'success':'');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);
  }
  async function request(path,options={}){
    if(!token)throw new Error('Bạn cần đăng nhập tài khoản TeoStudio trước.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(api(path),{...options,signal:controller.signal,cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+token,'x-teo-device-id':getTeoDeviceId(),...(options.headers||{})}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        const messages={ACCOUNT_REQUIRED:'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',SELLER_PROGRAM_DISABLED:'Chương trình Seller đang tạm khóa.',SELLER_PAYOUTS_CLOSED:'Chức năng rút tiền hiện đang tạm khóa.',EMAIL_VERIFICATION_REQUIRED:'Hãy xác minh email tài khoản trước khi thực hiện thao tác này.',INSUFFICIENT_SELLER_BALANCE:'Số dư khả dụng không đủ cho yêu cầu rút.',PAYOUT_PROFILE_REQUIRED:'Hãy lưu thông tin nhận tiền trước khi rút.'};
        const err=new Error(messages[data.error]||data.message||'Không thể hoàn tất yêu cầu. Hãy thử lại.');err.code=data.error;err.status=response.status;err.retryAfter=Number(response.headers.get('retry-after')||data.retryAfter||0);throw err;
      }
      return data;
    }catch(error){if(error.name==='AbortError')throw new Error('Máy chủ phản hồi chậm. Hãy thử lại sau ít phút.');throw error}
    finally{clearTimeout(timer)}
  }
  function authPrompt(){
    $('#sellerAuth').innerHTML='<div class="seller-auth-icon">♙</div><div><b>Đăng nhập để tham gia Seller</b><p>Đăng nhập hoặc tạo một tài khoản TeoStudio. Phiên đăng nhập sẽ được dùng chung trên Share, Seller và Studio.</p><div class="seller-auth-actions"><a class="seller-btn seller-btn-primary" href="/account.html?auth=login&return=%2Fseller.html">Đăng nhập</a><a class="seller-btn seller-btn-secondary" href="/account.html?auth=register&return=%2Fseller.html">Đăng ký</a></div></div>';
    $('#sellerApp').hidden=true;
  }
  function selectedProductHint(products){
    const hint=$('#sellerSelectedHint');if(!hint)return;
    const exact=products.find(p=>String(p.productId)===selectedProduct&&(!selectedScope||p.scope===selectedScope)&&(!selectedTenant||p.tenantSlug===selectedTenant));
    if(selectedProduct){hint.hidden=false;hint.textContent=exact?'Đã chọn file từ trang chi tiết. Bạn có thể tạo link ngay bên dưới.':'File được chọn không còn bật Seller hoặc không thuộc danh sách bạn có quyền giới thiệu.';}
  }
  async function copyLink(link){
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);notice('Đã sao chép link Seller.','success');return}}
    catch{}
    const input=$('#sellerCreatedLink');
    if(input){input.value=link;input.focus();input.select();notice('Hãy nhấn giữ ô link để sao chép.');}
  }
  function showCreatedLink(link,title){
    let box=$('#sellerCreatedLinkBox');if(!box){box=document.createElement('div');box.id='sellerCreatedLinkBox';box.className='seller-created-link';$('#sellerCatalog').prepend(box)}
    box.innerHTML=`<div class="seller-created-head"><b>✓ Link riêng đã sẵn sàng</b><small>${esc(title)}</small></div><div class="seller-created-actions"><input id="sellerCreatedLink" readonly type="url" aria-label="Link Seller" value="${esc(link)}"><button class="seller-btn seller-btn-secondary" id="sellerCopyCreated" type="button">Sao chép</button><button class="seller-btn seller-btn-primary" id="sellerShareCreated" type="button">Chia sẻ</button></div>`;
    $('#sellerCopyCreated').onclick=()=>copyLink(link);
    $('#sellerShareCreated').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Chia sẻ file trên TeoStudio',text:'Xem file này qua link giới thiệu của mình.',url:link});else await copyLink(link)}catch(e){if(e?.name!=='AbortError')notice('Không mở được bảng chia sẻ. Bạn có thể sao chép link.','error')}};
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function renderCatalog(products){
    const root=$('#sellerCatalog');selectedProductHint(products);
    const sort=$('#sellerSort')?.value||'newest',query=String($('#sellerSearch')?.value||'').trim().toLocaleLowerCase('vi');
    const visible=products.filter(p=>!query||String(p.title||'').toLocaleLowerCase('vi').includes(query)||String(p.tenantName||'').toLocaleLowerCase('vi').includes(query));
    visible.sort((a,b)=>sort==='commission'?(Number(b.commissionPct||0)-Number(a.commissionPct||0)||Number(b.commissionVnd||0)-Number(a.commissionVnd||0)):sort==='earning'?(Number(b.commissionVnd||0)-Number(a.commissionVnd||0)||Number(b.priceVnd||0)-Number(a.priceVnd||0)):String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(!visible.length){root.innerHTML=products.length?'<div class="seller-empty">Không tìm thấy file phù hợp với bộ lọc.</div>':'<div class="seller-empty">Chưa có file nào đang bật Seller.<br>Chủ Studio / Admin có thể bật Seller trong phần chỉnh sửa file trả phí.</div>';return}
    root.innerHTML=visible.map((p,i)=>`<article class="seller-catalog-item"><div class="seller-product-icon">${p.scope==='tenant'?'▤':'✦'}</div><div class="seller-product-info"><b>${esc(p.title||'File không tên')}</b><small>${esc(p.tenantName||'TeoStudio')} · Giá ${money(p.priceVnd)}</small><small class="seller-commission-line">✦ ${Number(p.commissionPct||0)}% hoa hồng · dự kiến ${money(p.commissionVnd||0)}/đơn</small></div><button type="button" class="seller-btn seller-btn-secondary" data-seller-create="${i}">Tạo link riêng ↗</button></article>`).join('');
    root.querySelectorAll('[data-seller-create]').forEach(button=>button.addEventListener('click',async()=>{
      const p=visible[Number(button.dataset.sellerCreate)];if(!p)return;
      button.disabled=true;button.textContent='Đang tạo…';
      try{const result=await request('/api/account/seller/links',{method:'POST',body:JSON.stringify({productId:p.productId,scope:p.scope,tenant:p.tenantSlug||''})});showCreatedLink(result.link,p.title||'File');}
      catch(error){notice(error.message,'error')}
      finally{button.disabled=false;button.textContent='Tạo link riêng ↗'}
    }));
  }
  function renderLedger(rows){
    const root=$('#sellerLedger');
    if(!rows?.length){root.innerHTML='<p class="seller-muted">Chưa có phát sinh hoa hồng. Khi có giao dịch hợp lệ, lịch sử sẽ xuất hiện tại đây.</p>';return}
    const labels={seller_commission_pending:'Hoa hồng Seller',purchase_refund:'Đảo hoa hồng do hoàn tiền',withdrawal_reserve:'Giữ số dư chờ rút',withdrawal_reversal:'Hoàn số dư do yêu cầu rút bị từ chối'};
    root.innerHTML=rows.map(row=>`<div class="seller-ledger-row"><div><b>${esc(labels[row.kind]||row.kind||'Điều chỉnh')}</b><small>${esc(row.note||'')} · ${esc(row.created_at||'')}${row.available_at?' · Khả dụng: '+esc(row.available_at):''}</small></div><strong>${Number(row.amount_vnd)>=0?'+':''}${money(Math.abs(Number(row.amount_vnd)||0))}${Number(row.amount_vnd)<0?' · trừ':''}</strong></div>`).join('');
  }
  function renderWithdrawals(rows){
    const root=$('#sellerWithdrawals');
    if(!rows?.length){root.innerHTML='<p class="seller-muted">Chưa có yêu cầu rút tiền.</p>';return}
    const labels={pending:'Đang chờ duyệt',approved:'Đã duyệt · chờ thanh toán',paid:'Đã thanh toán',rejected:'Bị từ chối'};
    root.innerHTML=rows.map(row=>`<div class="seller-history-row"><div><b>${money(row.payout_vnd)} · ${esc(labels[row.status]||row.status)}</b><small>${esc(row.created_at||'')}${row.admin_note?' · '+esc(row.admin_note):''}</small></div><small>${esc(row.id||'').slice(0,8)}</small></div>`).join('');
  }
  function syncPayoutMethod(){
    const method=$('#sellerPayoutMethod')?.value||'bank';
    $('#sellerBankField').hidden=method!=='bank';$('#sellerWalletField').hidden=method!=='wallet';
    const bank=$('#sellerProfile [name="bank_name"]'),wallet=$('#sellerProfile [name="wallet_provider"]');
    if(bank)bank.required=method==='bank';if(wallet)wallet.required=method==='wallet';
  }
  async function load(){
    token=readToken();if(!token){authPrompt();return}
    $('#sellerAuth').textContent='Đang xác thực phiên đăng nhập và tải dữ liệu Seller…';
    try{
      const [me,w,c]=await Promise.all([request('/api/account/me'),request('/api/account/seller/wallet'),request('/api/account/seller/catalog')]);
      walletData=w;catalogData=c;
      if(c.enabled===false){$('#sellerAuth').textContent='Chương trình Seller đang tạm khóa trên hệ thống.';$('#sellerApp').hidden=true;return}
      $('#sellerAuth').innerHTML=`<div class="seller-auth-icon">✓</div><div><b>Xin chào, ${esc(me.user?.displayName||me.user?.loginId||'Seller')}!</b><p>${me.user?.emailVerified?'Email đã xác minh · bạn có thể tạo link giới thiệu.':'Email chưa xác minh · hãy hoàn tất xác minh trước khi yêu cầu rút tiền.'}</p></div>`;
      $('#sellerApp').hidden=false;
      $('#sellerPending').textContent=money(w.pendingVnd);$('#sellerAvailable').textContent=money(w.availableVnd);$('#sellerTotalCommission').textContent=money(w.totalCommissionVnd);$('#sellerReferredOrders').textContent=Number(w.referredOrders||0).toLocaleString('vi-VN');
      $('#sellerPayoutState').textContent=w.payoutEnabled?'Đã mở · Admin duyệt thủ công':'Tạm khóa · chưa nhận yêu cầu mới';
      const profile=w.profile||{};for(const [key,value] of Object.entries(profile)){const field=$(`#sellerProfile [name="${key}"]`);if(field)field.value=value||''}
      syncPayoutMethod();renderCatalog(c.products||[]);renderLedger(w.ledger||[]);renderWithdrawals(w.withdrawals||[]);
      const withdrawButton=$('#sellerWithdrawSubmit');withdrawButton.disabled=!w.payoutEnabled;
      const cardButton=$('#sellerCardWithdrawSubmit');if(cardButton)cardButton.disabled=!w.payoutEnabled||me.user?.emailVerified!==true;const cardResult=$('#sellerCardWithdrawResult');if(cardResult){try{const cx=await request('/api/account/seller/card-withdrawals');if(['paid','rejected'].includes(cx.redemptions?.[0]?.status))sessionStorage.removeItem('TEO_SELLER_CARD_WITHDRAW_KEY');cardResult.innerHTML=(cx.redemptions||[]).map(v=>`<div class="seller-history-row"><div><b>${esc(v.telco)} ${money(v.faceVnd)} · ${esc(({pending:'Chờ Admin duyệt',approved:'Đã duyệt · chờ gửi thẻ',paid:'Đã gửi thẻ',rejected:'Đã từ chối'}[v.status]||v.status))}</b><small>Đã giữ ${money(v.debitVnd)} · ${esc(v.createdAt||'')}</small>${v.cards?.length?v.cards.map(c=>`<small>Mã: <code>${esc(c.code)}</code> · Serial: <code>${esc(c.serial||'—')}</code></small>`).join(''):''}${v.adminNote?`<small>Ghi chú Admin: ${esc(v.adminNote)}</small>`:''}${v.error?`<small>${esc(v.error)}</small>`:''}</div><small>${esc(v.id).slice(0,8)}</small></div>`).join('')||'<p class="seller-muted">Chưa có giao dịch đổi thẻ.</p>'}catch{cardResult.textContent='Chưa tải được lịch sử đổi thẻ.'}}
      if(!w.payoutEnabled)withdrawButton.textContent='Rút tiền đang tạm khóa';
      if(me.user?.emailVerified!==true){withdrawButton.disabled=true;withdrawButton.textContent='Cần xác minh email để rút';}
    }catch(error){$('#sellerAuth').textContent=error.message;if(error.code==='ACCOUNT_REQUIRED'||error.status===401)authPrompt();else notice(error.message,'error')}
  }
  $('#sellerPayoutMethod')?.addEventListener('change',syncPayoutMethod);
  $('#sellerProfile')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');button.disabled=true;
    const data=Object.fromEntries(new FormData(form));
    try{await request('/api/account/seller/payout-profile',{method:'PUT',body:JSON.stringify(data)});notice('Đã lưu thông tin nhận tiền.','success');}
    catch(error){notice(error.message,'error')}
    finally{button.disabled=false}
  });
  $('#sellerWithdraw')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,button=$('#sellerWithdrawSubmit'),data=Object.fromEntries(new FormData(form));
    data.amountVnd=Number(data.amountVnd);data.termsAccepted=data.termsAccepted==='on';
    if(!data.termsAccepted){notice('Hãy xác nhận thông tin nhận tiền trước khi gửi.','error');return}
    if(!form.reportValidity())return;
    let requestKey=sessionStorage.getItem('TEO_SELLER_WITHDRAW_REQUEST_KEY');
    if(!requestKey){requestKey=(crypto.randomUUID?.()||('seller_'+Date.now()+'_'+Math.random().toString(36).slice(2))).replace(/-/g,'');sessionStorage.setItem('TEO_SELLER_WITHDRAW_REQUEST_KEY',requestKey)}
    data.requestKey=requestKey;button.disabled=true;button.textContent='Đang gửi yêu cầu…';
    try{const result=await request('/api/account/seller/withdrawals',{method:'POST',body:JSON.stringify(data)});sessionStorage.removeItem('TEO_SELLER_WITHDRAW_REQUEST_KEY');notice(result.message||'Đã tiếp nhận yêu cầu rút tiền.','success');form.reset();syncPayoutMethod();await load();}
    catch(error){notice(error.message,'error');}
    finally{button.disabled=!(walletData?.payoutEnabled);button.textContent=walletData?.payoutEnabled?'Gửi yêu cầu rút':'Rút tiền đang tạm khóa'}
  });
  const cardForm=$('#sellerCardWithdraw');cardForm?.addEventListener('submit',async event=>{event.preventDefault();const f=event.currentTarget,data=Object.fromEntries(new FormData(f));data.amountVnd=Number(data.amountVnd);data.termsAccepted=data.termsAccepted==='on';if(!data.termsAccepted)return notice('Hãy xác nhận điều khoản đổi thẻ.','error');const debit=data.amountVnd+Math.round(data.amountVnd*.05);if(!confirm(`Gửi yêu cầu rút thẻ ${money(data.amountVnd)}? Hệ thống tạm giữ ${money(debit)} (105%). Yêu cầu sẽ gửi Admin chính duyệt; Admin gửi mã thẻ/serial thủ công, không tự động mua thẻ. Tiếp tục?`))return;let key=sessionStorage.getItem('TEO_SELLER_CARD_WITHDRAW_KEY');if(!key){key=(crypto.randomUUID?.()||('card_'+Date.now()+'_'+Math.random().toString(36).slice(2))).replace(/-/g,'');sessionStorage.setItem('TEO_SELLER_CARD_WITHDRAW_KEY',key)}data.requestKey=key;const btn=$('#sellerCardWithdrawSubmit');btn.disabled=true;try{const x=await request('/api/account/seller/card-withdrawals',{method:'POST',body:JSON.stringify(data)});if(['paid','rejected'].includes(x.status))sessionStorage.removeItem('TEO_SELLER_CARD_WITHDRAW_KEY');const result=$('#sellerCardWithdrawResult');result.innerHTML=`<p class=\"seller-muted\">${esc(x.message||'Đã xử lý yêu cầu.')} · Trạng thái: ${esc(x.status||'')}</p>${x.cards?.length?x.cards.map(c=>`<div class=\"seller-history-row\"><div><b>${esc(c.type)} · ${money(c.amount)}</b><small>Mã thẻ: <code>${esc(c.code)}</code></small><small>Serial: <code>${esc(c.serial||'—')}</code></small></div></div>`).join(''):''}`;await load()}catch(error){notice(error.message,'error')}finally{btn.disabled=!walletData?.payoutEnabled}});
  const cardAmount=$('#sellerCardWithdraw [name="amountVnd"]'),cardPreview=$('#sellerCardDebitPreview');const updateCardPreview=()=>{if(cardAmount&&cardPreview){const n=Number(cardAmount.value)||0;cardPreview.textContent='Số dư cần có: '+money(n+Math.round(n*.05))+' (105% mệnh giá).'}};cardAmount?.addEventListener('change',updateCardPreview);updateCardPreview();
  $('#sellerSort')?.addEventListener('change',()=>renderCatalog(catalogData?.products||[]));$('#sellerSearch')?.addEventListener('input',()=>renderCatalog(catalogData?.products||[]));
  $('#sellerRefresh')?.addEventListener('click',load);
  window.addEventListener('storage',event=>{if(event.key==='TEO_BUYER_SESSION'){token=readToken();load()}});
  load();
})();
