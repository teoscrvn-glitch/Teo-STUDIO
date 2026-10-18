import { connect } from 'cloudflare:sockets';

// OxMail SMTP sender. Configure credentials only as Cloudflare Worker secrets.
const EMAIL_RE=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
function b64utf8(value){const bytes=new TextEncoder().encode(String(value??''));let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary)}
function foldBase64(value,width=76){return String(value).match(new RegExp(`.{1,${width}}`,'g'))?.join('\r\n')||''}
async function sendOxMail(e,{to,subject,text}){
  const host=clean(e.OXMAIL_SMTP_HOST||'mail.teostudio.top',253),port=Number(e.OXMAIL_SMTP_PORT||465);
  const user=clean(e.OXMAIL_SMTP_USER||'teostudio@teostudio.top',320),pass=String(e.OXMAIL_SMTP_PASS||'');
  const from=clean(e.EMAIL_FROM||user,320);
  if(!pass)throw new Error('OXMAIL_SMTP_PASS secret is not configured');
  if(!EMAIL_RE.test(to)||!EMAIL_RE.test(from)||!EMAIL_RE.test(user))throw new Error('Invalid email address configuration');
  if(![465].includes(port))throw new Error('This SMTP implementation requires implicit TLS on port 465');
  const socket=connect({hostname:host,port},{secureTransport:'on'});
  const reader=socket.readable.getReader(),writer=socket.writable.getWriter(),decoder=new TextDecoder();let buf='';
  async function line(){while(true){const i=buf.indexOf('\r\n');if(i>=0){const out=buf.slice(0,i);buf=buf.slice(i+2);return out;}const {value,done}=await reader.read();if(done)throw new Error('SMTP connection closed unexpectedly');buf+=decoder.decode(value,{stream:true});if(buf.length>65536)throw new Error('SMTP response too large');}}
  async function reply(){const lines=[];let last='';for(let n=0;n<30;n++){last=await line();lines.push(last);if(/^\d{3} /.test(last))break;}if(!/^\d{3} /.test(last))throw new Error('Invalid SMTP response');return {code:Number(last.slice(0,3)),text:lines.join('\n')};}
  async function cmd(s,expected){await writer.write(new TextEncoder().encode(s+'\r\n'));const r=await reply();if(!expected.includes(r.code))throw new Error(`SMTP ${r.code}: ${r.text.slice(0,500)}`);return r;}
  try{
    let r=await reply();if(r.code!==220)throw new Error(`SMTP ${r.code}: ${r.text.slice(0,500)}`);
    await cmd('EHLO teostudio.top',[250]);
    await cmd('AUTH LOGIN',[334]);await cmd(btoa(user),[334]);await cmd(btoa(pass),[235]);
    await cmd(`MAIL FROM:<${from}>`,[250]);await cmd(`RCPT TO:<${to}>`,[250,251]);await cmd('DATA',[354]);
    const fromName='Téo Studio';const subj=`=?UTF-8?B?${b64utf8(subject)}?=`;
    const body=foldBase64(b64utf8(String(text??'')));
    const message=[`From: =?UTF-8?B?${b64utf8(fromName)}?= <${from}>`,`To: <${to}>`,`Subject: ${subj}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',body,''].join('\r\n').replace(/\r\n\./g,'\r\n..');
    await writer.write(new TextEncoder().encode(message+'.\r\n'));r=await reply();if(r.code!==250)throw new Error(`SMTP ${r.code}: ${r.text.slice(0,500)}`);
    try{await cmd('QUIT',[221])}catch{}return {ok:true,response:r.text};
  }finally{try{reader.releaseLock()}catch{}try{writer.releaseLock()}catch{}try{await socket.close()}catch{}}
}
function notifyEmail(e,{to,subject,text}){return sendOxMail(e,{to,subject,text}).catch(err=>({ok:false,error:String(err?.message||err)}));}
function validEmail(v){const x=clean(v,320);return EMAIL_RE.test(x)?x:'';}
async function ensureNotificationsSchema(e){
  await e.DB.prepare(`CREATE TABLE IF NOT EXISTS web_notifications (
    id TEXT PRIMARY KEY, recipient_type TEXT NOT NULL, recipient_id TEXT NOT NULL,
    title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'info',
    read_at TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now'))
  )`).run();
  await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_web_notifications_recipient ON web_notifications(recipient_type,recipient_id,created_at)`).run();
}
async function createNotification(e,{recipientType,recipientId,title,body='',kind='info'}){
  try{await ensureNotificationsSchema(e);await e.DB.prepare(`INSERT INTO web_notifications(id,recipient_type,recipient_id,title,body,kind) VALUES(?,?,?,?,?,?)`).bind(crypto.randomUUID(),recipientType, String(recipientId),clean(title,180),clean(body,2000),clean(kind,40)).run();return true}catch(err){return false}
}
async function notificationList(e,recipientType,recipientId){
  await ensureNotificationsSchema(e);
  const rows=(await e.DB.prepare(`SELECT id,title,body,kind,read_at,created_at FROM web_notifications WHERE recipient_type=? AND recipient_id=? ORDER BY created_at DESC LIMIT 50`).bind(recipientType,String(recipientId)).all()).results||[];
  return rows;
}

const PUBLIC_ORIGIN='https://teostudio.top';
const BUILD_VERSION='v56.8-tenant-login-ui-cta-fix';
function runtimeConfigStatus(e){
  const has=k=>String(e?.[k]??'').trim().length>0;
  const check=keys=>{const missing=keys.filter(k=>!has(k));return {configured:missing.length===0,missing};};
  const ai=check(['AI_API_URL','AI_API_KEY','AI_MODEL']);
  let aiEndpointValid=false;try{const u=new URL(String(e?.AI_API_URL||''));aiEndpointValid=u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password}catch{}
  ai.endpointValid=aiEndpointValid;ai.ready=ai.configured&&aiEndpointValid;
  const emailMissing=[];if(!has('OXMAIL_SMTP_PASS'))emailMissing.push('OXMAIL_SMTP_PASS');if(Number(e?.OXMAIL_SMTP_PORT||465)!==465)emailMissing.push('OXMAIL_SMTP_PORT (must be 465)');const smtpHost=String(e?.OXMAIL_SMTP_HOST||'mail.teostudio.top');if(!/^[a-z0-9.-]+$/i.test(smtpHost)||smtpHost.startsWith('.')||smtpHost.endsWith('.'))emailMissing.push('OXMAIL_SMTP_HOST');const smtpUser=String(e?.OXMAIL_SMTP_USER||'teostudio@teostudio.top'),smtpFrom=String(e?.EMAIL_FROM||smtpUser);if(!EMAIL_RE.test(smtpUser))emailMissing.push('OXMAIL_SMTP_USER');if(!EMAIL_RE.test(smtpFrom))emailMissing.push('EMAIL_FROM');const email={configured:emailMissing.length===0,missing:emailMissing,hostUsesDefault:!has('OXMAIL_SMTP_HOST'),userUsesDefault:!has('OXMAIL_SMTP_USER'),fromUsesDefault:!has('EMAIL_FROM')};
  return {database:{configured:!!e?.DB},ai,email,telegram:check(['TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID']),turnstile:check(['TURNSTILE_SITE_KEY','TURNSTILE_SECRET']),sepay:check(['SEPAY_API_KEY','SEPAY_BANK_CODE','SEPAY_ACCOUNT_NUMBER'])};
}
const C={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"https://teostudio.top","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type,Authorization,X-Requested-With,X-Tenant-Slug","vary":"Origin","cache-control":"no-store","x-content-type-options":"nosniff","x-frame-options":"SAMEORIGIN","referrer-policy":"strict-origin-when-cross-origin","permissions-policy":"camera=(),microphone=(),geolocation=()","x-permitted-cross-domain-policies":"none","cross-origin-opener-policy":"same-origin","strict-transport-security":"max-age=31536000","content-security-policy":"default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; worker-src 'self' blob: https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"};
const J=(x,s=200,extra={})=>new Response(JSON.stringify(x),{status:s,headers:{...C,...extra}});
const clean=(x,n=5000)=>String(x??'').trim().slice(0,n);
// Accept navigable web URLs only. Reject javascript:, data:, credentials-in-URL and malformed URLs.
function safeHttpUrl(value,max=10000){const raw=clean(value,max);if(!raw)return '';try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||!u.hostname||u.username||u.password)return '';return u.toString()}catch{return ''}}
function safeOptionalLink(value,max=4000){const raw=clean(value,max);if(!raw||raw==='#')return raw;return safeHttpUrl(raw,max)}
function allowedChannelHost(host){const h=String(host||'').toLowerCase().replace(/\.$/,'');return ['tiktok.com','youtube.com','youtu.be'].some(root=>h===root||h.endsWith('.'+root))}
async function safeChannelFetch(input,init={}){let u=new URL(input);for(let i=0;i<=3;i++){if(u.protocol!=='https:'||!allowedChannelHost(u.hostname))throw new Error('CHANNEL_REDIRECT_HOST_BLOCKED');const resp=await fetch(u.toString(),{...init,redirect:'manual'});if(resp.status>=300&&resp.status<400){const loc=resp.headers.get('location');if(!loc)return resp;u=new URL(loc,u);continue}return resp}throw new Error('CHANNEL_REDIRECT_LIMIT')}
async function readTextLimited(resp,maxBytes=1200000){const len=Number(resp.headers.get('content-length')||0);if(len>maxBytes){try{await resp.body?.cancel()}catch{}throw new Error('CHANNEL_RESPONSE_TOO_LARGE')}if(!resp.body)return '';const reader=resp.body.getReader(),chunks=[];let size=0;try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){try{await reader.cancel()}catch{}throw new Error('CHANNEL_RESPONSE_TOO_LARGE')}chunks.push(value)}}finally{try{reader.releaseLock()}catch{}}const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder().decode(all)}
// Image fields may use compressed data:image/... payloads generated by the UI; never allow data:text/html.
function safeImageValue(value,max=1500000){const raw=clean(value,max);if(!raw)return '';if(/^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\r\n]+$/i.test(raw))return raw;if(/^(?!\/\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_./?&=%#-]+$/.test(raw)&&!raw.includes('\\'))return raw;return safeHttpUrl(raw,max)}
function safeCommentImage(value){const raw=String(value||'');if(raw.length>450000||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(raw))return '';try{const payload=raw.slice(raw.indexOf(',')+1);const bin=atob(payload.slice(0,80));if(raw.startsWith('data:image/jpeg;')&&!(bin.charCodeAt(0)===0xff&&bin.charCodeAt(1)===0xd8&&bin.charCodeAt(2)===0xff))return '';if(raw.startsWith('data:image/png;')&&!(bin.charCodeAt(0)===0x89&&bin.slice(1,4)==='PNG'))return '';if(raw.startsWith('data:image/webp;')&&!(bin.slice(0,4)==='RIFF'&&bin.slice(8,12)==='WEBP'))return '';return raw}catch{return ''}}
const tokenFrom=r=>(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
const RL=new Map();
// Rate limiting can return HTTP 429 for a burst, but it never creates an IP ban.
// Persistent IP/email blocking is exclusively controlled by the Admin security_blocks list.
function clientIp(r){return clean(r.headers.get('CF-Connecting-IP')||'',80)}
let lastMapPruneAt=0;
function pruneMaps(now=Date.now()){
  if(now-lastMapPruneAt<30000 && RL.size<8000)return;
  lastMapPruneAt=now;
  for(const [k,v] of RL){if(!v.length||now-v[v.length-1]>300000)RL.delete(k)}
  if(RL.size>8000){let n=RL.size-6000;for(const k of RL.keys()){RL.delete(k);if(--n<=0)break}}
}
const SECURITY_BLOCK_CACHE=new Map();
async function securityBlocked(e,kind,value){
  const v=kind==='email'?String(value||'').trim().toLowerCase():String(value||'').trim();
  if(!v)return false;const now=Date.now(),cacheKey=kind+':'+v,cached=SECURITY_BLOCK_CACHE.get(cacheKey);
  if(cached&&cached.expiresAt>now)return cached.blocked;
  let blocked=false;try{await ensureV55Schema(e);blocked=!!(await e.DB.prepare('SELECT id FROM security_blocks WHERE kind=? AND value_normalized=? LIMIT 1').bind(kind,v).first())}catch{}
  if(SECURITY_BLOCK_CACHE.size>10000){for(const [k,x] of SECURITY_BLOCK_CACHE)if(x.expiresAt<=now)SECURITY_BLOCK_CACHE.delete(k);if(SECURITY_BLOCK_CACHE.size>10000)SECURITY_BLOCK_CACHE.clear()}
  SECURITY_BLOCK_CACHE.set(cacheKey,{blocked,expiresAt:now+5000});return blocked;
}
function blockedNotFound(r){const accept=String(r.headers.get('accept')||'').toLowerCase();if(accept.includes('text/html'))return new Response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Không tìm thấy trang</title><body style="font-family:system-ui;background:#0a0d16;color:#e5e7eb;padding:12vh 8vw"><h1>404 · Không tìm thấy trang</h1><p>Trang bạn yêu cầu không tồn tại hoặc không thể truy cập.</p></body></html>',{status:404,headers:{...C,'content-type':'text/html;charset=UTF-8','cache-control':'no-store'}});return J({ok:false,error:'NOT_FOUND'},404)}
function normalizeIpInput(value){const v=String(value||'').trim();if(!v||v.length>80||/[\s/,]/.test(v))return '';if(v.includes(':'))return /^[0-9a-f:.]+$/i.test(v)?v.toLowerCase():'';const parts=v.split('.');if(parts.length!==4||parts.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255))return '';return parts.map(x=>String(Number(x))).join('.')}
function rateLimit(r,key,limit=20,windowMs=60000){const now=Date.now(),ip=clientIp(r);if(!ip)return 0;const k=key+':'+ip;const a=RL.get(k)||[];const fresh=a.filter(t=>now-t<windowMs);if(fresh.length>=limit){RL.set(k,fresh);pruneMaps(now);return Math.max(1,Math.ceil((windowMs-(now-fresh[0]))/1000))}fresh.push(now);RL.set(k,fresh);pruneMaps(now);return 0}
function limited(r,key,limit,windowMs){const retry=rateLimit(r,key,limit,windowMs);return retry?new Response(JSON.stringify({ok:false,error:'RATE_LIMITED',retryAfter:retry}),{status:429,headers:{...C,'retry-after':String(retry),'cache-control':'no-store'}}):null}
function documentNavigation(r){return (r.method==='GET'||r.method==='HEAD')&&String(r.headers.get('accept')||'').toLowerCase().includes('text/html')&&!new URL(r.url).pathname.startsWith('/api/')}
function documentRateResponse(r){const retry=rateLimit(r,'document-nav',12,10000);if(!retry)return null;return new Response(JSON.stringify({ok:false,error:'NAVIGATION_RATE_LIMITED',message:'Bạn mở/chuyển trang quá nhanh. Vui lòng chờ một chút rồi thử lại.',retryAfter:retry}),{status:429,headers:{...C,'retry-after':String(retry),'cache-control':'no-store'}})}
function apiRateResponse(r){const retry=rateLimit(r,'api-burst',50,10000);if(!retry)return null;return new Response(JSON.stringify({ok:false,error:'API_RATE_LIMITED',message:'Quá nhiều yêu cầu trong thời gian ngắn. Hãy chờ rồi thử lại.',retryAfter:retry}),{status:429,headers:{...C,'retry-after':String(retry),'cache-control':'no-store'}})}
function commentRateResponse(r){const retry=rateLimit(r,'comment-post',3,60000);if(!retry)return null;return new Response(JSON.stringify({ok:false,error:'COMMENT_RATE_LIMITED',retryAfter:retry,message:'Bạn đã đăng quá nhiều bình luận trong thời gian ngắn.'}),{status:429,headers:{...C,'retry-after':String(retry),'cache-control':'no-store'}})}
let schemaReady=null;
let adminSessionSchemaReady=null;
let v55SchemaReady=null;
async function ensureAdminSessionSchema(e){
  if(adminSessionSchemaReady)return adminSessionSchemaReady;
  adminSessionSchemaReady=(async()=>{
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)`).run();
  })().catch(err=>{adminSessionSchemaReady=null;throw err});
  return adminSessionSchemaReady;
}
async function addColumnSafe(e,table,column,type){
  try{
    const rows=(await e.DB.prepare(`PRAGMA table_info(${table})`).all()).results||[];
    if(rows.some(x=>x.name===column))return;
    await e.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }catch{}
}

async function sha256(s){const b=new TextEncoder().encode(s);const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function ensureSchema(e){
  if(schemaReady)return schemaReady;
  schemaReady=(async()=>{
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_auth (id INTEGER PRIMARY KEY CHECK(id=1), password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now')), updated_at TEXT NOT NULL DEFAULT(datetime('now')))`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY,name TEXT NOT NULL,text TEXT NOT NULL,image TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')),visible INTEGER NOT NULL DEFAULT 1)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS view_daily (day TEXT NOT NULL,kind TEXT NOT NULL,product_id TEXT NOT NULL DEFAULT '',views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,kind,product_id))`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_view_daily_day ON view_daily(day)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS view_referrers_daily(day TEXT NOT NULL,kind TEXT NOT NULL,product_id TEXT NOT NULL DEFAULT '',domain TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,kind,product_id,domain))`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS product_payment_orders (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, payment_code TEXT NOT NULL UNIQUE,
      amount_vnd INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', transaction_id TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT(datetime('now')), expires_at INTEGER NOT NULL, paid_at TEXT DEFAULT NULL
    )`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_payment_orders(status,expires_at)`).run();
    await addColumnSafe(e,'product_payment_orders','transaction_id','TEXT');
    await addColumnSafe(e,'product_payment_orders','created_at','TEXT');
    await addColumnSafe(e,'product_payment_orders','expires_at','INTEGER');
    await addColumnSafe(e,'product_payment_orders','paid_at','TEXT');

    // Migrate legacy D1 tables in-place. These are additive only: no DROP/DELETE/reset.
    await addColumnSafe(e,'tags','parent_id','TEXT DEFAULT NULL');
    await addColumnSafe(e,'settings','value','TEXT');
    await addColumnSafe(e,'products','views','INTEGER');
    await addColumnSafe(e,'products','visible','INTEGER');
    await addColumnSafe(e,'products','created_at','TEXT');
    await addColumnSafe(e,'products','updated_at','TEXT');
    await addColumnSafe(e,'products','sale_mode',"TEXT DEFAULT 'free'");
    await addColumnSafe(e,'products','free_link_mode',"TEXT DEFAULT 'direct'");
    await addColumnSafe(e,'products','original_link','TEXT DEFAULT \"\"');
    await addColumnSafe(e,'products','price_vnd','INTEGER DEFAULT 0');
    await addColumnSafe(e,'comments','image','TEXT');
    await addColumnSafe(e,'comments','created_at','TEXT');
    await addColumnSafe(e,'comments','visible','INTEGER');

    // Backfill only NULL migration fields. Existing content is preserved.
    try{await e.DB.prepare(`UPDATE products SET views=0 WHERE views IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE products SET visible=1 WHERE visible IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE products SET created_at=datetime('now') WHERE created_at IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE products SET updated_at=datetime('now') WHERE updated_at IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE comments SET image='' WHERE image IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE comments SET visible=1 WHERE visible IS NULL`).run()}catch{}
    try{await e.DB.prepare(`UPDATE comments SET created_at=datetime('now') WHERE created_at IS NULL`).run()}catch{}

    // Do not seed a known default admin password. Master login uses the ADMIN_KEY secret;
    // legacy admin_auth table is preserved for compatibility but never initialized to a guessable credential.
  })().catch(err=>{schemaReady=null;throw err});
  return schemaReady;
}

async function isAdmin(r,e){const t=tokenFrom(r);if(!t)return false;await ensureSchema(e);const x=await e.DB.prepare('SELECT token FROM admin_sessions WHERE token=? AND expires_at>?').bind(t,Date.now()).first();return !!x}
async function ensureV55Schema(e){
  if(v55SchemaReady)return v55SchemaReady;
  v55SchemaReady=(async()=>{
    await ensureSchema(e);await ensureTenantSchema(e);
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_accounts (
      id TEXT PRIMARY KEY,email TEXT NOT NULL,email_normalized TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,avatar TEXT NOT NULL DEFAULT '',password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_sessions(token TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_sessions_expiry ON buyer_sessions(expires_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_email_codes(id TEXT PRIMARY KEY,email_normalized TEXT NOT NULL,purpose TEXT NOT NULL,code_hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL,used_at TEXT DEFAULT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_codes_lookup ON buyer_email_codes(email_normalized,purpose,created_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_wallet_topups(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,payment_code TEXT NOT NULL UNIQUE,amount_vnd INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',transaction_id TEXT UNIQUE,expires_at INTEGER NOT NULL,paid_at TEXT DEFAULT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_topups_lookup ON buyer_wallet_topups(buyer_id,created_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_wallet_ledger(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_buyer_wallet_once ON buyer_wallet_ledger(buyer_id,kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_wallet_history ON buyer_wallet_ledger(buyer_id,created_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS buyer_purchases(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,scope TEXT NOT NULL,tenant_id TEXT DEFAULT NULL,product_id TEXT NOT NULL,title TEXT NOT NULL,amount_vnd INTEGER NOT NULL,seller_amount_vnd INTEGER NOT NULL DEFAULT 0,commission_vnd INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'paid',created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await addColumnSafe(e,'buyer_purchases','request_key','TEXT DEFAULT NULL');
    await e.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_buyer_purchase_idempotency ON buyer_purchases(buyer_id,request_key) WHERE request_key IS NOT NULL AND request_key<>''`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_purchases_buyer ON buyer_purchases(buyer_id,created_at)`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_buyer_purchases_tenant ON buyer_purchases(tenant_id,created_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS master_wallet_ledger(id TEXT PRIMARY KEY,amount_vnd INTEGER NOT NULL,kind TEXT NOT NULL,ref_type TEXT DEFAULT NULL,ref_id TEXT DEFAULT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_master_wallet_once ON master_wallet_ledger(kind,ref_type,ref_id) WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS support_reports(id TEXT PRIMARY KEY,buyer_id TEXT DEFAULT NULL,email TEXT DEFAULT '',display_name TEXT DEFAULT '',page TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT 'other',message TEXT NOT NULL,user_agent TEXT NOT NULL DEFAULT '',client_ip TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await addColumnSafe(e,'support_reports','client_ip',"TEXT NOT NULL DEFAULT ''");
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_support_reports_status ON support_reports(status,created_at)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS security_blocks(id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('ip','email')),value_normalized TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL DEFAULT 'admin',created_at TEXT NOT NULL DEFAULT(datetime('now')),UNIQUE(kind,value_normalized))`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_security_blocks_lookup ON security_blocks(kind,value_normalized)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS comment_rate_events(id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL,client_ip TEXT NOT NULL DEFAULT '',has_image INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_comment_rate_user_time ON comment_rate_events(buyer_id,created_at)`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_comment_rate_ip_time ON comment_rate_events(client_ip,created_at)`).run();
    for(const [table,column,type] of [['comments','buyer_id','TEXT DEFAULT NULL'],['comments','email_normalized',"TEXT NOT NULL DEFAULT ''"],['comments','client_ip',"TEXT NOT NULL DEFAULT ''"],['tenant_comments','buyer_id','TEXT DEFAULT NULL'],['tenant_comments','email_normalized',"TEXT NOT NULL DEFAULT ''"],['tenant_comments','client_ip',"TEXT NOT NULL DEFAULT ''"]]) await addColumnSafe(e,table,column,type);
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_site_layouts(tenant_id TEXT PRIMARY KEY,layout_json TEXT NOT NULL DEFAULT '[]',updated_at TEXT NOT NULL DEFAULT(datetime('now')))` ).run();
    await tenantAddColumn(e,'tenant_accounts','studio_name','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_accounts','owner_user_id','TEXT DEFAULT NULL');
  })().catch(err=>{v55SchemaReady=null;throw err});
  return v55SchemaReady;
}
async function hashPasswordV55(password){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(password)),'PBKDF2',false,['deriveBits']);
  const iterations=100000; // Cloudflare Workers WebCrypto currently rejects PBKDF2 iterations above 100000.
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
  const hex=a=>[...new Uint8Array(a)].map(v=>v.toString(16).padStart(2,'0')).join('');
  return `pbkdf2$${iterations}$${hex(salt)}$${hex(bits)}`;
}
async function verifyPasswordV55(password,stored){
  const x=String(stored||'').split('$');if(x.length!==4||x[0]!=='pbkdf2')return false;
  const fromHex=h=>Uint8Array.from((h.match(/.{2}/g)||[]).map(v=>parseInt(v,16)));
  const iterations=Number(x[1])||100000;
  // Match the runtime-supported ceiling; never silently change the iteration count for a stored hash.
  if(!Number.isInteger(iterations)||iterations<10000||iterations>100000)return false;
  try{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(password)),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromHex(x[2]),iterations},key,256);return safeEq([...new Uint8Array(bits)].map(v=>v.toString(16).padStart(2,'0')).join(''),x[3])}catch{return false}
}
async function buyerFromRequest(r,e){const tok=tokenFrom(r);if(!tok)return null;await ensureV55Schema(e);const row=await e.DB.prepare(`SELECT a.* FROM buyer_sessions s JOIN buyer_accounts a ON a.id=s.buyer_id WHERE s.token=? AND s.expires_at>? LIMIT 1`).bind(tok,Date.now()).first();if(!row||Number(row.locked)===1)return null;if(await securityBlocked(e,'email',row.email_normalized||row.email)){try{await e.DB.prepare('DELETE FROM buyer_sessions WHERE token=?').bind(tok).run()}catch{}return null}return row}
async function buyerBalance(e,buyerId){await ensureV55Schema(e);const x=await e.DB.prepare('SELECT COALESCE(SUM(amount_vnd),0) AS balance FROM buyer_wallet_ledger WHERE buyer_id=?').bind(buyerId).first();return Math.max(0,Number(x?.balance)||0)}
function buyerPublic(a){return a?{id:a.id,email:a.email,displayName:a.display_name,avatar:a.avatar||'',emailVerified:Number(a.email_verified)===1,createdAt:a.created_at}:null}
async function saveBuyerCode(e,email,purpose){
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
  const id=crypto.randomUUID(),expires=Date.now()+10*60*1000;
  await e.DB.prepare("INSERT INTO buyer_email_codes(id,email_normalized,purpose,code_hash,expires_at) VALUES(?,?,?,?,?)").bind(id,email,purpose,await sha256(`${email}|${purpose}|${code}`),expires).run();
  const to=validEmail(email);if(!to)return {ok:false};
  const sent=await sendOxMail(e,{to,subject:purpose==='verify'?'Xác minh tài khoản TeoStudio':'Đặt lại mật khẩu TeoStudio',text:`Mã xác minh của bạn: ${code}\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`}).catch(()=>({ok:false}));
  if(!sent?.ok){await e.DB.prepare('DELETE FROM buyer_email_codes WHERE id=?').bind(id).run();return {ok:false}}
  return {ok:true,expiresAt:expires};
}
function maskEmail(email){const [name,domain]=String(email||'').split('@');if(!domain)return '';return `${(name||'').slice(0,1)}${'*'.repeat(Math.min(5,Math.max(2,(name||'').length-1)))}@${domain}`;}
async function telegramSend(e,text){const token=String(e.TELEGRAM_BOT_TOKEN||''),chat=String(e.TELEGRAM_CHAT_ID||'');if(!token||!chat)return {ok:false,skipped:true};try{const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text:String(text||'').slice(0,3900),disable_web_page_preview:true}),signal:AbortSignal.timeout(10000)});const data=await r.json().catch(()=>null);return {ok:r.ok&&data?.ok===true,status:r.status}}catch{return {ok:false}}}
async function supportNotify(e,report){await telegramSend(e,`🚨 TeoStudio · Báo lỗi mới\nMã: ${report.id}\nLoại: ${report.category}\nTrang: ${report.page}\nIP: ${report.client_ip||'không xác định'}\nTài khoản: ${report.display_name||'Khách'} (${maskEmail(report.email)||'ẩn danh'})\nMô tả: ${report.message}`)}
function safeBuilderLayout(input){
  let blocks=Array.isArray(input)?input:[];if(blocks.length>40)throw new Error('TOO_MANY_BLOCKS');
  const allowed=new Set(['hero','text','button','image','video','product-grid','notice','footer','divider']);
  return blocks.map((b,i)=>{if(!b||typeof b!=='object'||!allowed.has(String(b.type)))throw new Error('INVALID_BLOCK_TYPE');const type=String(b.type);const item={id:clean(b.id||crypto.randomUUID(),80),type,title:clean(b.title||'',160),text:clean(b.text||'',1200),visible:b.visible!==false,style:{accent:/^#[0-9a-f]{6}$/i.test(String(b.style?.accent||''))?String(b.style.accent):'#8b5cf6',align:['left','center','right'].includes(b.style?.align)?b.style.align:'left',radius:Math.max(0,Math.min(32,Number(b.style?.radius)||16))}};if(type==='button'||type==='image'||type==='video') {const url=safeHttpUrl(b.url||'',4000);if(b.url&&!url)throw new Error('INVALID_BLOCK_URL');item.url=url;}return item})
}
async function accountApi(r,e,p){
  await ensureV55Schema(e);const method=r.method,b=method==='POST'||method==='PUT'?await r.json().catch(()=>({})):{};
  if(p==='/api/account/register'&&method==='POST'){
    const rl=limited(r,'account-register',3,60000);if(rl)return rl;
    const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi đăng ký.'},400);
    const email=validEmail(b.email||'').toLowerCase(),name=clean(b.displayName||b.name||'',80),password=String(b.password||'');
    if(email&&await securityBlocked(e,'email',email))return J({ok:false,error:'NOT_FOUND',message:'Không thể thực hiện yêu cầu.'},404);
    if(!email||name.length<2||password.length<8)return J({ok:false,error:'INVALID_REGISTER_DATA',message:'Nhập email hợp lệ, tên ít nhất 2 ký tự và mật khẩu tối thiểu 8 ký tự.'},400);
    const existing=await e.DB.prepare('SELECT id,email_verified FROM buyer_accounts WHERE email_normalized=?').bind(email).first();
    if(existing&&Number(existing.email_verified)===1)return J({ok:false,error:'ACCOUNT_EXISTS',message:'Email đã có tài khoản. Hãy đăng nhập hoặc đặt lại mật khẩu.'},409);
    if(existing)await e.DB.prepare('DELETE FROM buyer_email_codes WHERE email_normalized=? AND purpose=\'verify\'').bind(email).run();
    const id=existing?.id||crypto.randomUUID(),hash=await hashPasswordV55(password);
    if(existing)await e.DB.prepare("UPDATE buyer_accounts SET email=?,display_name=?,password_hash=?,email_verified=0,updated_at=datetime('now') WHERE id=?").bind(email,name,hash,id).run();
    else await e.DB.prepare('INSERT INTO buyer_accounts(id,email,email_normalized,display_name,password_hash) VALUES(?,?,?,?,?)').bind(id,email,email,name,hash).run();
    const sent=await saveBuyerCode(e,email,'verify');if(!sent.ok)return J({ok:false,error:'EMAIL_SEND_FAILED',message:'Chưa gửi được email xác minh. Kiểm tra cấu hình email hoặc thử lại.'},502);
    return J({ok:true,requiresVerification:true,message:'Đã gửi mã xác minh vào email.'},201);
  }
  if(p==='/api/account/verify-email'&&method==='POST'){
    const rl=limited(r,'account-verify-email',8,60000);if(rl)return rl;
    const email=validEmail(b.email||'').toLowerCase(),code=clean(b.code||'',6);if(email&&await securityBlocked(e,'email',email))return J({ok:false,error:'NOT_FOUND'},404);if(!email||!/^[0-9]{6}$/.test(code))return J({ok:false,error:'INVALID_CODE'},400);
    const row=await e.DB.prepare("SELECT * FROM buyer_email_codes WHERE email_normalized=? AND purpose='verify' AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 1").bind(email,Date.now()).first();if(!row||Number(row.attempts)>=5)return J({ok:false,error:'CODE_EXPIRED_OR_INVALID'},400);
    if(row.code_hash!==await sha256(`${email}|verify|${code}`)){await e.DB.prepare('UPDATE buyer_email_codes SET attempts=attempts+1 WHERE id=?').bind(row.id).run();return J({ok:false,error:'CODE_EXPIRED_OR_INVALID'},400)}
    await e.DB.batch([e.DB.prepare("UPDATE buyer_accounts SET email_verified=1,updated_at=datetime('now') WHERE email_normalized=?").bind(email),e.DB.prepare("UPDATE buyer_email_codes SET used_at=datetime('now') WHERE id=? AND used_at IS NULL").bind(row.id)]);return J({ok:true,message:'Email đã xác minh. Bạn có thể đăng nhập.'});
  }
  if(p==='/api/account/login'&&method==='POST'){
    const rl=limited(r,'account-login',8,60000);if(rl)return rl;const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi đăng nhập.'},400);
    const email=validEmail(b.email||'').toLowerCase(),password=String(b.password||'');if(email&&await securityBlocked(e,'email',email))return J({ok:false,error:'NOT_FOUND',message:'Không thể thực hiện yêu cầu.'},404);const row=email?await e.DB.prepare('SELECT * FROM buyer_accounts WHERE email_normalized=? LIMIT 1').bind(email).first():null;
    if(!row||Number(row.email_verified)!==1||!(await verifyPasswordV55(password,row.password_hash)))return J({ok:false,error:'INVALID_LOGIN',message:'Thông tin đăng nhập không đúng hoặc email chưa xác minh.'},401);if(Number(row.locked)===1)return J({ok:false,error:'ACCOUNT_LOCKED'},403);
    const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO buyer_sessions(token,buyer_id,expires_at) VALUES(?,?,?)').bind(token,row.id,Date.now()+14*86400000).run();return J({ok:true,token,user:buyerPublic(row),expiresIn:14*86400000});
  }
  if(p==='/api/account/logout'&&method==='POST'){const tok=tokenFrom(r);if(tok)await e.DB.prepare('DELETE FROM buyer_sessions WHERE token=?').bind(tok).run();return J({ok:true})}
  if(p==='/api/account/password/reset/start'&&method==='POST'){
    const rl=limited(r,'account-reset-start',3,60000);if(rl)return rl;const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED'},400);const email=validEmail(b.email||'').toLowerCase();if(email){const row=await e.DB.prepare('SELECT id FROM buyer_accounts WHERE email_normalized=? AND email_verified=1').bind(email).first();if(row)await saveBuyerCode(e,email,'reset')}
    return J({ok:true,message:'Nếu email có tài khoản hợp lệ, mã đặt lại mật khẩu sẽ được gửi.'});
  }
  if(p==='/api/account/password/reset/finish'&&method==='POST'){
    const rl=limited(r,'account-reset-finish',5,60000);if(rl)return rl;
    const email=validEmail(b.email||'').toLowerCase(),code=clean(b.code||'',6),password=String(b.password||'');if(email&&await securityBlocked(e,'email',email))return J({ok:false,error:'NOT_FOUND'},404);if(!email||!/^[0-9]{6}$/.test(code)||password.length<8)return J({ok:false,error:'INVALID_RESET_DATA'},400);
    const row=await e.DB.prepare("SELECT * FROM buyer_email_codes WHERE email_normalized=? AND purpose='reset' AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 1").bind(email,Date.now()).first();if(!row||Number(row.attempts)>=5||row.code_hash!==await sha256(`${email}|reset|${code}`)){if(row)await e.DB.prepare('UPDATE buyer_email_codes SET attempts=attempts+1 WHERE id=?').bind(row.id).run();return J({ok:false,error:'CODE_EXPIRED_OR_INVALID'},400)}
    await e.DB.batch([e.DB.prepare("UPDATE buyer_accounts SET password_hash=?,updated_at=datetime('now') WHERE email_normalized=?").bind(await hashPasswordV55(password),email),e.DB.prepare("UPDATE buyer_email_codes SET used_at=datetime('now') WHERE id=?").bind(row.id),e.DB.prepare('DELETE FROM buyer_sessions WHERE buyer_id=(SELECT id FROM buyer_accounts WHERE email_normalized=?)').bind(email)]);return J({ok:true,message:'Đổi mật khẩu thành công. Đăng nhập lại nhé.'});
  }
  const buyer=await buyerFromRequest(r,e);
  if(p==='/api/account/me'&&method==='GET'){if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);return J({ok:true,user:buyerPublic(buyer),balanceVnd:await buyerBalance(e,buyer.id),studios:await buyerStudios(e,buyer)})}
  if(p==='/api/account/profile'&&method==='PUT'){if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);const name=clean(b.displayName||'',80),avatar=b.avatar?safeImageValue(b.avatar,800000):'';if(name.length<2)return J({ok:false,error:'INVALID_DISPLAY_NAME',message:'Tên hiển thị cần ít nhất 2 ký tự.'},400);if(b.avatar&&!avatar)return J({ok:false,error:'INVALID_AVATAR'},400);await e.DB.prepare("UPDATE buyer_accounts SET display_name=?,avatar=?,updated_at=datetime('now') WHERE id=?").bind(name,avatar,buyer.id).run();const fresh=await e.DB.prepare('SELECT * FROM buyer_accounts WHERE id=?').bind(buyer.id).first();return J({ok:true,user:buyerPublic(fresh)})}
  if(p==='/api/account/studios'&&method==='GET'){if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);return J({ok:true,studios:await buyerStudios(e,buyer)})}
  if(p==='/api/account/studios/create'&&method==='POST'){
    const rl=limited(r,'account-studio-create',3,3600000);if(rl)return rl;if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);
    const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi tạo studio.'},400);
    const studioName=clean(b.studioName||'',80),slug=tenantSlug(b.slug||studioName),plan=String(b.planType||'free');
    if(studioName.length<2||!/^[a-z0-9_-]{2,60}$/.test(slug))return J({ok:false,error:'INVALID_STUDIO_NAME',message:'Tên studio ít nhất 2 ký tự; đường dẫn chỉ dùng chữ không dấu, số, gạch ngang hoặc gạch dưới.'},400);
    if(!['free','paid'].includes(plan))return J({ok:false,error:'INVALID_STUDIO_PLAN'},400);
    const existing=await e.DB.prepare("SELECT id,plan_type,locked,pending_order_id FROM tenant_accounts WHERE lower(slug)=lower(?) AND (deleted_at IS NULL OR deleted_at='') LIMIT 1").bind(slug).first();if(existing)return J({ok:false,error:'STUDIO_SLUG_EXISTS',message:'Đường dẫn studio đã được dùng. Hãy đổi tên studio.'},409);
    const owned=await e.DB.prepare("SELECT COUNT(*) AS n FROM tenant_accounts WHERE lower(email)=lower(?) AND (deleted_at IS NULL OR deleted_at='')").bind(buyer.email).first();if(Number(owned?.n||0)>=5)return J({ok:false,error:'STUDIO_LIMIT_REACHED',message:'Mỗi tài khoản hiện tạo tối đa 5 studio. Hãy nâng cấp/quản lý các studio hiện có.'},429);
    await ensureTenantSchema(e);const keyCol=await tenantAccountKeyColumn(e);if(!keyCol)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
    const id='t-'+slug+'-'+crypto.randomUUID().slice(0,8),now=isoSqlDate(),expires=now,passwordHash=await sha256(crypto.randomUUID()+crypto.randomUUID()),cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[],names=new Set(cols.map(v=>v.name));
    let order=null;
    if(plan==='paid'){
      const orderId=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),orderExpires=Date.now()+20*60*1000;
      const data={slug,password_hash:passwordHash,created_at:now,starts_at:now,expires_at:expires,locked:1,email:buyer.email,plan_type:'paid',pending_order_id:orderId,deleted_at:null,studio_name:studioName,owner_user_id:buyer.id,email_verified_at:now,free_bypass_count:0,free_admin_unlocked:0};
      data[keyCol]=id;if(names.has('id'))data.id=id;if(names.has('tenant_id'))data.tenant_id=id;const use=Object.entries(data).filter(([k])=>names.has(k));
      try{await e.DB.batch([e.DB.prepare(`INSERT INTO tenant_accounts(${use.map(([k])=>k).join(',')}) VALUES(${use.map(()=>'?').join(',')})`).bind(...use.map(([,v])=>v)),e.DB.prepare("INSERT INTO tenant_rental_orders(id,tenant_id,payment_code,amount_vnd,days,operation,referrer_tenant_id,status,expires_at) VALUES(?,?,?,50000,30,'new',NULL,'pending',?)").bind(orderId,id,code,orderExpires), ...[['siteName',studioName],['studio',studioName],['heroTitle','Kho share file · '+studioName],['heroText','Chào mừng đến với '+studioName]].map(([k,v])=>e.DB.prepare('INSERT OR IGNORE INTO tenant_settings(tenant_id,key,value) VALUES(?,?,?)').bind(id,k,JSON.stringify(v)))])}catch(err){return J({ok:false,error:'STUDIO_CREATE_FAILED',message:'Không tạo được studio. Hãy thử lại hoặc liên hệ Admin.'},500)}
      order={id:orderId,code,amount:50000,status:'pending',expiresAt:orderExpires,qrUrl:buildVietQr(e,50000,code),tenantId:slug,operation:'new'};
    }else{
      const data={slug,password_hash:passwordHash,created_at:now,starts_at:now,expires_at:expires,locked:0,email:buyer.email,plan_type:'free',pending_order_id:null,deleted_at:null,studio_name:studioName,owner_user_id:buyer.id,email_verified_at:now,free_bypass_count:0,free_admin_unlocked:0};
      data[keyCol]=id;if(names.has('id'))data.id=id;if(names.has('tenant_id'))data.tenant_id=id;const use=Object.entries(data).filter(([k])=>names.has(k));
      try{await e.DB.batch([e.DB.prepare(`INSERT INTO tenant_accounts(${use.map(([k])=>k).join(',')}) VALUES(${use.map(()=>'?').join(',')})`).bind(...use.map(([,v])=>v)), ...[['siteName',studioName],['studio',studioName],['heroTitle','Kho share file · '+studioName],['heroText','Chào mừng đến với '+studioName]].map(([k,v])=>e.DB.prepare('INSERT OR IGNORE INTO tenant_settings(tenant_id,key,value) VALUES(?,?,?)').bind(id,k,JSON.stringify(v)))])}catch(err){return J({ok:false,error:'STUDIO_CREATE_FAILED',message:'Không tạo được studio. Hãy thử lại hoặc liên hệ Admin.'},500)}
      await createNotification(e,{recipientType:'tenant',recipientId:id,title:'Studio Free đã tạo',body:'Studio đã liên kết với tài khoản TeoStudio của bạn. Gói Free vẫn cần hoàn thành xác minh truy cập Admin theo chính sách hiện tại.',kind:'welcome'});
    }
    await tenantLog(e,id,'buyer:'+buyer.id,'studio_created',`plan=${plan};slug=${slug}`);
    return J({ok:true,planType:plan,studio:{id,slug,studioName,planType:plan,adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}`},order,message:plan==='paid'?'Đã tạo đơn thuê VIP. Chỉ chuyển khoản theo QR này; studio sẽ mở khi SePay xác nhận.':'Đã tạo studio Free và liên kết với tài khoản hiện tại.'},201);
  }
  if(p==='/api/account/studios/upgrade'&&method==='POST'){
    const rl=limited(r,'account-studio-upgrade',3,3600000);if(rl)return rl;if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi nâng cấp.'},400);
    const slug=tenantSlug(b.slug||''),raw=await e.DB.prepare("SELECT * FROM tenant_accounts WHERE lower(slug)=lower(?) AND lower(email)=lower(?) AND (deleted_at IS NULL OR deleted_at='') LIMIT 1").bind(slug,buyer.email).first();if(!raw)return J({ok:false,error:'STUDIO_NOT_OWNED',message:'Không tìm thấy studio thuộc tài khoản này.'},404);if(String(raw.plan_type||'paid')==='paid'&&!Number(raw.locked))return J({ok:false,error:'ALREADY_PAID',message:'Studio đã ở gói trả phí.'},409);if(Number(raw.locked)===1&&raw.pending_order_id){const old=await e.DB.prepare("SELECT * FROM tenant_rental_orders WHERE id=? AND status='pending' AND expires_at>? LIMIT 1").bind(String(raw.pending_order_id),Date.now()).first();if(old)return J({ok:true,order:{id:old.id,code:old.payment_code,amount:Number(old.amount_vnd),status:'pending',expiresAt:old.expires_at,qrUrl:buildVietQr(e,old.amount_vnd,old.payment_code),tenantId:slug,operation:'new'},message:'Đã có đơn nâng cấp đang chờ. Dùng QR cũ, không chuyển lần hai.'})}
    await ensureTenantSchema(e);const pending=await e.DB.prepare("SELECT * FROM tenant_rental_orders WHERE tenant_id=? AND operation='renew' AND status='pending' AND expires_at>? ORDER BY created_at DESC LIMIT 1").bind(String(raw.id||raw.tenant_id||raw.slug),Date.now()).first();if(pending)return J({ok:true,order:{id:pending.id,code:pending.payment_code,amount:Number(pending.amount_vnd),status:'pending',expiresAt:pending.expires_at,qrUrl:buildVietQr(e,pending.amount_vnd,pending.payment_code),tenantId:slug,operation:'renew'},message:'Đơn gia hạn đang chờ. Dùng QR cũ, không chuyển lần hai.'});
    const orderId=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=Date.now()+20*60*1000,tid=String(raw.id||raw.tenant_id||raw.slug);try{await e.DB.prepare("INSERT INTO tenant_rental_orders(id,tenant_id,payment_code,amount_vnd,days,operation,referrer_tenant_id,status,expires_at) VALUES(?,?,?,50000,30,'renew',NULL,'pending',?)").bind(orderId,tid,code,expires).run()}catch{return J({ok:false,error:'UPGRADE_ORDER_FAILED'},500)}return J({ok:true,order:{id:orderId,code,amount:50000,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,50000,code),tenantId:slug,operation:'renew'},message:'Đã tạo QR nâng cấp. Studio chỉ chuyển sang VIP sau khi SePay xác nhận.'},201);
  }
  if(p==='/api/account/wallet'&&method==='GET'){if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);const bal=await buyerBalance(e,buyer.id);const rows=(await e.DB.prepare('SELECT id,amount_vnd,kind,ref_type,ref_id,note,created_at FROM buyer_wallet_ledger WHERE buyer_id=? ORDER BY created_at DESC LIMIT 100').bind(buyer.id).all()).results||[];const pending=(await e.DB.prepare("SELECT id,amount_vnd,status,created_at,expires_at FROM buyer_wallet_topups WHERE buyer_id=? ORDER BY created_at DESC LIMIT 30").bind(buyer.id).all()).results||[];return J({ok:true,balanceVnd:bal,ledger:rows,topups:pending})}
  if(p==='/api/account/topups/create'&&method==='POST'){
    const rl=limited(r,'wallet-topup-create',5,60000);if(rl)return rl;if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);if(Number(buyer.email_verified)!==1)return J({ok:false,error:'EMAIL_VERIFICATION_REQUIRED',message:'Hãy xác minh email trước khi nạp ví.'},403);const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi nạp.'},400);const amount=Math.floor(Number(b.amountVnd)||0);if(amount<10000||amount>5000000||amount%1000!==0)return J({ok:false,error:'INVALID_TOPUP_AMOUNT',message:'Số tiền nạp từ 10.000đ đến 5.000.000đ, bội số 1.000đ.'},400);const cfg=paymentConfig(e);if(!cfg.paymentsEnabled)return J({ok:false,error:'PAYMENT_NOT_CONFIGURED',missing:cfg.missing},503);const id=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=Date.now()+10*60*1000;await e.DB.prepare("INSERT INTO buyer_wallet_topups(id,buyer_id,payment_code,amount_vnd,status,expires_at) VALUES(?,?,?,?,'pending',?)").bind(id,buyer.id,code,amount,expires).run();return J({ok:true,topup:{id,code,amountVnd:amount,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,amount,code)}},201);
  }
  const topupStatus=p.match(/^\/api\/account\/topups\/([^/]+)$/);if(topupStatus&&method==='GET'){if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);const row=await e.DB.prepare('SELECT id,amount_vnd,status,expires_at,paid_at FROM buyer_wallet_topups WHERE id=? AND buyer_id=?').bind(clean(topupStatus[1],100),buyer.id).first();if(!row)return J({ok:false,error:'TOPUP_NOT_FOUND'},404);return J({ok:true,topup:{id:row.id,amountVnd:Number(row.amount_vnd),status:row.status,expiresAt:row.expires_at,paidAt:row.paid_at},balanceVnd:await buyerBalance(e,buyer.id)})}
  if(p==='/api/account/orders'&&method==='GET'){
    if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED'},401);const rows=(await e.DB.prepare('SELECT * FROM buyer_purchases WHERE buyer_id=? ORDER BY created_at DESC LIMIT 100').bind(buyer.id).all()).results||[];const orders=[];for(const row of rows){let downloadUrl='';try{if(row.scope==='main'){const x=await e.DB.prepare('SELECT * FROM products WHERE id=?').bind(row.product_id).first();downloadUrl=x?safeHttpUrl(x.original_link,10000)||safeHttpUrl(x.download_link,10000):''}else{const x=await e.DB.prepare('SELECT * FROM tenant_products WHERE tenant_id=? AND id=?').bind(row.tenant_id,row.product_id).first();const mode=String(x?.product_mode||'');downloadUrl=x?(mode==='both'?safeHttpUrl(x.original_link,10000):safeHttpUrl(x.download_link,10000)||safeHttpUrl(x.original_link,10000)):''}}catch{}orders.push({id:row.id,scope:row.scope,tenantId:row.tenant_id,productId:row.product_id,title:row.title,amountVnd:Number(row.amount_vnd),status:row.status,createdAt:row.created_at,downloadUrl})}return J({ok:true,orders});
  }
  if(p==='/api/account/purchase'&&method==='POST'){
    const rl=limited(r,'wallet-purchase',5,60000);if(rl)return rl;if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED',message:'Đăng nhập tài khoản trước khi mua file.'},401);if(Number(buyer.email_verified)!==1)return J({ok:false,error:'EMAIL_VERIFICATION_REQUIRED',message:'Hãy xác minh email trước khi mua file.'},403);const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi mua file.'},400);if(b.termsAccepted!==true||b.finalConfirmed!==true)return J({ok:false,error:'TERMS_CONFIRMATION_REQUIRED'},400);
    const scope=String(b.scope||'main'),productId=clean(b.productId||'',100),idempotencyKey=clean(b.idempotencyKey||'',80);if(!/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey))return J({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED',message:'Thiếu mã xác nhận giao dịch. Hãy mở lại bước mua.'},400);const prior=await e.DB.prepare("SELECT * FROM buyer_purchases WHERE buyer_id=? AND request_key=? AND status='paid' LIMIT 1").bind(buyer.id,idempotencyKey).first();if(prior){if(prior.scope!==String(b.scope||'main')||prior.product_id!==clean(b.productId||'',100))return J({ok:false,error:'IDEMPOTENCY_KEY_CONFLICT'},409);if(prior.scope==='tenant'){const repeatTenant=await tenantBySlug(e,clean(b.tenant||'',80));if(!repeatTenant||String(repeatTenant.id)!==String(prior.tenant_id||''))return J({ok:false,error:'IDEMPOTENCY_KEY_CONFLICT'},409)}let prevUrl='';if(prior.scope==='main'){const p0=await e.DB.prepare('SELECT * FROM products WHERE id=?').bind(prior.product_id).first();prevUrl=p0?safeHttpUrl(p0.original_link,10000)||safeHttpUrl(p0.download_link,10000):''}else{const p0=await e.DB.prepare('SELECT * FROM tenant_products WHERE tenant_id=? AND id=?').bind(prior.tenant_id,prior.product_id).first();const m0=String(p0?.product_mode||'');prevUrl=p0?(m0==='both'?safeHttpUrl(p0.original_link,10000):safeHttpUrl(p0.download_link,10000)||safeHttpUrl(p0.original_link,10000)):''}return J({ok:true,idempotent:true,purchase:{id:prior.id,title:prior.title,amountVnd:Number(prior.amount_vnd)},downloadUrl:prevUrl,balanceVnd:await buyerBalance(e,buyer.id)})}let title='',amount=0,tenantId='',downloadUrl='';
    if(scope==='main') {const x=await e.DB.prepare('SELECT * FROM products WHERE id=? AND visible=1').bind(productId).first();if(!x)return J({ok:false,error:'PRODUCT_NOT_FOUND'},404);if(!['paid','both'].includes(String(x.sale_mode))||Number(x.price_vnd)<1000)return J({ok:false,error:'PRODUCT_NOT_FOR_SALE'},400);title=clean(x.title,200);amount=Math.floor(Number(x.price_vnd));downloadUrl=safeHttpUrl(x.original_link,10000)||safeHttpUrl(x.download_link,10000)}
    else if(scope==='tenant') {const slug=clean(b.tenant||'',80),raw=await tenantBySlug(e,slug);const t=await normalizeTenantRow(e,raw);if(!t||tenantStatus(t)==='locked'||tenantStatus(t)==='deleted'||(tenantStatus(t)==='expired'&&String(t.plan_type||'paid')!=='free'))return J({ok:false,error:'TENANT_NOT_FOUND'},404);const k=tenantInSql(t);const x=await e.DB.prepare(`SELECT * FROM tenant_products WHERE ${k.clause} AND id=? AND visible=1`).bind(...k.vals,productId).first();if(!x)return J({ok:false,error:'PRODUCT_NOT_FOUND'},404);const mode=String(x.product_mode||'');if(!['paid','both'].includes(mode)||Number(x.price_vnd)<1000)return J({ok:false,error:'PRODUCT_NOT_FOR_SALE'},400);tenantId=String(t.id);title=clean(x.title,200);amount=Math.floor(Number(x.price_vnd));downloadUrl=mode==='both'?safeHttpUrl(x.original_link,10000):safeHttpUrl(x.download_link,10000)||safeHttpUrl(x.original_link,10000)}
    else return J({ok:false,error:'INVALID_SCOPE'},400);
    if(!downloadUrl)return J({ok:false,error:'DOWNLOAD_NOT_CONFIGURED',message:'Người bán chưa cấu hình link gốc.'},409);
    const fee=tenantId?Math.floor(amount*0.05):0,seller=tenantId?amount-fee:0,id=crypto.randomUUID(),note=`Mua file: ${title}`;
    const stmts=[
      e.DB.prepare(`INSERT OR IGNORE INTO buyer_purchases(id,buyer_id,scope,tenant_id,product_id,title,amount_vnd,seller_amount_vnd,commission_vnd,request_key,status) SELECT ?,?,?,?,?,?,?,?,?,?, 'paid' WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM buyer_wallet_ledger WHERE buyer_id=?)>=?`).bind(id,buyer.id,scope,tenantId||null,productId,title,amount,seller,fee,idempotencyKey,buyer.id,amount),
      e.DB.prepare(`INSERT INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,-?,'purchase','purchase',?,? WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')`).bind(crypto.randomUUID(),buyer.id,amount,id,note,id,buyer.id),
      e.DB.prepare(`INSERT OR IGNORE INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,?,'sale','buyer_purchase',?,? WHERE ?<>'' AND EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')`).bind(crypto.randomUUID(),tenantId,seller,id,`Bán file ${title} · trừ phí nền tảng 5%`,tenantId,id,buyer.id),
      e.DB.prepare(`INSERT OR IGNORE INTO master_wallet_ledger(id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,'platform_commission','buyer_purchase',?,? WHERE EXISTS(SELECT 1 FROM buyer_purchases WHERE id=? AND buyer_id=? AND status='paid')`).bind(crypto.randomUUID(),tenantId?fee:amount,id,tenantId?`Hoa hồng nền tảng 5% · ${title}`:`Doanh thu file chính · ${title}`,id,buyer.id)
    ];
    try{await e.DB.batch(stmts)}catch(err){return J({ok:false,error:'PURCHASE_PROCESSING_FAILED',message:'Giao dịch chưa hoàn tất. Số dư chưa được trừ nếu giao dịch bị rollback.'},500)}
    const done=await e.DB.prepare('SELECT id FROM buyer_purchases WHERE id=? AND buyer_id=?').bind(id,buyer.id).first();if(!done){const byKey=await e.DB.prepare("SELECT * FROM buyer_purchases WHERE buyer_id=? AND request_key=? AND status='paid' LIMIT 1").bind(buyer.id,idempotencyKey).first();if(byKey)return J({ok:false,error:'PURCHASE_ALREADY_PROCESSING',message:'Yêu cầu này đã được xử lý. Hãy làm mới lịch sử mua trước khi thử lại.'},409);return J({ok:false,error:'INSUFFICIENT_BALANCE',message:'Số dư không đủ. Hãy nạp tiền rồi thử lại.'},402);}
    if(tenantId){await createNotification(e,{recipientType:'tenant',recipientId:tenantId,title:'Có đơn bán file mới',body:`${title} · ${amount.toLocaleString('vi-VN')}đ · số dư nhận ${seller.toLocaleString('vi-VN')}đ`,kind:'sale'});await createNotification(e,{recipientType:'admin',recipientId:'master',title:'Có đơn mua file qua ví',body:`Studio ${tenantId} · ${title} · hoa hồng ${fee.toLocaleString('vi-VN')}đ`,kind:'sale'});}
    await telegramSend(e,`🛒 TeoStudio · Mua file thành công\nĐơn: ${id}\nPhạm vi: ${scope}\nFile: ${title}\nGiá: ${amount.toLocaleString('vi-VN')}đ\nPhí nền tảng: ${fee.toLocaleString('vi-VN')}đ`);
    return J({ok:true,purchase:{id,title,amountVnd:amount,sellerAmountVnd:seller,commissionVnd:fee,scope},balanceVnd:await buyerBalance(e,buyer.id),downloadUrl},201);
  }
  return J({ok:false,error:'ACCOUNT_ENDPOINT_NOT_FOUND'},404);
}
async function buyerStudios(e,buyer){
  await ensureTenantSchema(e);const rows=(await e.DB.prepare("SELECT id,slug,plan_type,starts_at,expires_at,created_at,studio_name FROM tenant_accounts WHERE lower(email)=lower(?) AND (deleted_at IS NULL OR deleted_at='') ORDER BY created_at DESC LIMIT 20").bind(buyer.email).all()).results||[];
  return rows.map(t=>({id:t.id,slug:t.slug,studioName:t.studio_name||t.slug,planType:String(t.plan_type||'free'),startsAt:t.starts_at,expiresAt:t.expires_at,adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(t.slug)}`}));
}
async function assistantChat(r,e){
  const rl=limited(r,'assistant-chat',15,60000);if(rl)return rl;await ensureV55Schema(e);const b=await r.json().catch(()=>({})),message=clean(b.message||'',1800);if(!message)return J({ok:false,error:'MESSAGE_REQUIRED'},400);
  const buyer=await buyerFromRequest(r,e);let context={site:'TeoStudio',path:clean(b.page||'',250),authenticated:!!buyer};if(buyer){context.account={displayName:buyer.display_name,email:maskEmail(buyer.email),emailVerified:Number(buyer.email_verified)===1,balanceVnd:await buyerBalance(e,buyer.id)};context.purchases=(await e.DB.prepare('SELECT title,amount_vnd,status,created_at,scope FROM buyer_purchases WHERE buyer_id=? ORDER BY created_at DESC LIMIT 5').bind(buyer.id).all()).results||[];context.studios=(await e.DB.prepare("SELECT studio_name,slug,plan_type,expires_at,locked FROM tenant_accounts WHERE lower(email)=lower(?) AND (deleted_at IS NULL OR deleted_at='') ORDER BY rowid DESC LIMIT 5").bind(buyer.email).all().catch(()=>({results:[]}))).results||[]}
  const apiUrl=String(e.AI_API_URL||''),key=String(e.AI_API_KEY||''),model=String(e.AI_MODEL||'');
  if(!apiUrl||!key||!model){const text=/mua|nạp|ví|số dư/i.test(message)?'Mình là trợ lý TeoStudio. Để mua file trả phí, bạn cần đăng nhập, xác minh chống bot và có đủ số dư. Nếu thiếu tiền, mở Tài khoản → Nạp tiền; mỗi mã QR chỉ dùng cho đơn tương ứng.':/lỗi|bug|error|không chạy|hỏng/i.test(message)?'Mình có thể giúp ghi nhận lỗi. Hãy bấm “Báo lỗi”, mô tả các bước gây lỗi và gửi mã đơn nếu có. Đừng gửi mật khẩu, Admin Key hoặc mã bí mật.':'Mình là trợ lý hỗ trợ TeoStudio. Hiện API AI chưa được cấu hình nên mình chỉ trả lời được một số câu hỏi cơ bản. Bạn vẫn có thể gửi báo cáo lỗi để Téo kiểm tra.';return J({ok:true,reply:text,mode:'fallback',aiConfigured:false})}
  let url;try{url=new URL(apiUrl);if(url.protocol!=='https:')throw new Error('HTTPS_REQUIRED')}catch{return J({ok:false,error:'AI_ENDPOINT_INVALID'},503)}
  try{const resp=await fetch(url.toString(),{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify({model,temperature:0.2,max_tokens:700,messages:[{role:'system',content:'Bạn là trợ lý hỗ trợ TeoStudio. Chỉ hướng dẫn cách sử dụng website, đọc thông tin tài khoản được máy chủ cung cấp và hướng dẫn lập báo cáo lỗi. Không được yêu cầu mật khẩu, API key, mã OTP, thông tin ngân hàng hoặc bí mật. Không tuyên bố đã thực hiện thao tác quan trọng; không thể tự sửa số dư, thanh toán, gói thuê hay trạng thái đơn. Nếu có sự cố, hướng dẫn dùng nút Báo lỗi. Dữ liệu website có thể thiếu; hãy nói rõ khi không biết. Ngữ cảnh an toàn: '+JSON.stringify(context).slice(0,1200)},{role:'user',content:message}]}) ,signal:AbortSignal.timeout(15000)});if(!resp.ok)return J({ok:true,reply:'AI đang bận hoặc hết hạn mức miễn phí. Bạn có thể thử lại hoặc bấm Báo lỗi.',mode:'fallback'});const data=await resp.json(),reply=clean(data.choices?.[0]?.message?.content||'',3000);return J({ok:true,reply:reply||'Mình chưa tạo được câu trả lời. Hãy thử hỏi lại.',mode:'ai'})}catch{return J({ok:true,reply:'Không kết nối được API AI lúc này. Bạn có thể thử lại hoặc gửi báo cáo lỗi.',mode:'fallback'})}
}
async function submitSupportReport(r,e){const rl=limited(r,'support-report',3,60000);if(rl)return rl;await ensureV55Schema(e);const b=await r.json().catch(()=>({}));if(clean(b.website||'',100))return J({ok:true,message:'Đã nhận báo cáo.'});const cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy hoàn thành xác minh chống bot trước khi gửi báo lỗi.'},400);const message=clean(b.message||'',1800);if(message.length<8)return J({ok:false,error:'REPORT_TOO_SHORT',message:'Mô tả lỗi ít nhất 8 ký tự.'},400);const buyer=await buyerFromRequest(r,e),email=buyer?.email||validEmail(b.email||'');if(email&&await securityBlocked(e,'email',email))return J({ok:false,error:'NOT_FOUND'},404);const id=crypto.randomUUID(),report={id,buyer_id:buyer?.id||null,email,display_name:buyer?.display_name||clean(b.name||'',80),page:clean(b.page||'',250),category:clean(b.category||'other',40),message,user_agent:clean(r.headers.get('user-agent')||'',400),client_ip:clientIp(r)||''};await e.DB.prepare('INSERT INTO support_reports(id,buyer_id,email,display_name,page,category,message,user_agent,client_ip) VALUES(?,?,?,?,?,?,?,?,?)').bind(report.id,report.buyer_id,report.email,report.display_name,report.page,report.category,report.message,report.user_agent,report.client_ip).run();await supportNotify(e,report);return J({ok:true,id,message:'Đã gửi báo cáo lỗi. Mã tiếp nhận: '+id},201)}
async function settings(e){const a=(await e.DB.prepare('SELECT key,value FROM settings').all()).results||[];const s={};for(const x of a){if(['adminPasswordHash'].includes(x.key))continue;try{s[x.key]=JSON.parse(x.value)}catch{s[x.key]=x.value}}for(const k of ['groupLink','adminContact','rentZalo','socialTikTokUrl','socialYoutubeUrl'])if(s[k])s[k]=safeHttpUrl(s[k],4000)||'#';for(const k of ['avatar','donateQr'])if(s[k])s[k]=safeImageValue(s[k],1500000)||'';return s}
async function tags(e){return (await e.DB.prepare('SELECT id,name,parent_id,created_at FROM tags ORDER BY CASE WHEN parent_id IS NULL OR parent_id=\'\' THEN 0 ELSE 1 END,name COLLATE NOCASE').all()).results||[]}
function safeProductRow(row){if(!row)return row;return {...row,sale_mode:['free','both','paid'].includes(String(row.sale_mode||''))?String(row.sale_mode):'free',free_link_mode:String(row.free_link_mode||'direct')==='unlock'?'unlock':'direct',price_vnd:Math.max(0,Number(row.price_vnd)||0),download_link:safeHttpUrl(row.download_link,10000),original_link:safeHttpUrl(row.original_link,10000),thumb:row.thumb?safeImageValue(row.thumb,1500000):''}}
function publicProductRow(row){const p=safeProductRow(row);if(!p)return p;const mode=p.sale_mode;if(mode==='paid'){p.download_link='';p.original_link='';}else if(mode==='both'){p.original_link='';}else{p.original_link='';}return p}
async function products(e){return ((await e.DB.prepare('SELECT * FROM products WHERE visible=1 ORDER BY updated_at DESC').all()).results||[]).map(publicProductRow)}
async function adminProducts(e){return ((await e.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all()).results||[]).map(safeProductRow)}
async function productById(e,id){return publicProductRow(await e.DB.prepare('SELECT * FROM products WHERE id=? AND visible=1').bind(id).first())}

let tenantSchemaReady=null;
async function tenantExec(e,sql){return e.DB.prepare(sql).run()}
async function tenantHasColumn(e,table,column){
  try{
    const rows=(await e.DB.prepare(`PRAGMA table_info(${table})`).all()).results||[];
    return rows.some(x=>x.name===column);
  }catch{return false}
}
async function tenantAddColumn(e,table,column,type){
  if(await tenantHasColumn(e,table,column))return;
  // SQLite does not allow non-constant defaults in ALTER TABLE ADD COLUMN.
  // Add nullable columns first, then backfill them separately.
  try{await tenantExec(e,`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)}catch{}
}

async function tenantAccountKeyColumn(e){
  // Prefer the key that actually exists in the live D1. Never assume `id`
  // because older rental databases used `tenant_id`.
  if(await tenantHasColumn(e,'tenant_accounts','id'))return 'id';
  if(await tenantHasColumn(e,'tenant_accounts','tenant_id'))return 'tenant_id';
  // If the table is somehow incomplete, let the caller return a clear DB error
  // instead of generating an INSERT against a non-existent column.
  return null;
}
async function normalizeTenantRow(e,x){
  if(!x)return null;
  const key=x.id ?? x.tenant_id ?? x.slug;
  return {...x,id:key,slug:x.slug ?? x.tenant_id ?? key};
}
function tenantKeyValues(t){const vals=[t?.id,t?.tenant_id,t?.slug].map(v=>clean(v,100)).filter(Boolean);return [...new Set(vals)];}
function tenantInSql(t){const vals=tenantKeyValues(t);return {clause:vals.length?`tenant_id IN (${vals.map(()=>'?').join(',')})`:'tenant_id=?',vals:vals.length?vals:['']};}
async function ensureTenantSchema(e){
  if(tenantSchemaReady)return tenantSchemaReady;
  tenantSchemaReady=(async()=>{
    // Create each object independently so a pre-existing/partially-created tenant schema
    // cannot poison the whole Worker isolate with one rejected cached promise.
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_accounts (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT(datetime('now')), starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL, locked INTEGER NOT NULL DEFAULT 0, deleted_at TEXT DEFAULT NULL
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_sessions (
      token TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, expires_at INTEGER NOT NULL
    )`);
    // Legacy rental builds may already have tenant_sessions with a different/older
    // shape. CREATE TABLE IF NOT EXISTS does not migrate an existing table, so make
    // the three fields used by the current auth flow available additively.
    await tenantAddColumn(e,'tenant_sessions','token','TEXT');
    await tenantAddColumn(e,'tenant_sessions','tenant_id','TEXT');
    await tenantAddColumn(e,'tenant_sessions','expires_at','INTEGER');
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_products (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, game TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '', thumb TEXT DEFAULT '', download_link TEXT NOT NULL,
      warning TEXT DEFAULT '', views INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT(datetime('now')), updated_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    // Additive pricing migration and payment orders; never reset existing D1 data.
    await tenantAddColumn(e,'tenant_products','price_vnd','INTEGER DEFAULT 0');
    await tenantAddColumn(e,'tenant_products','sale_enabled','INTEGER DEFAULT 0');
    await tenantAddColumn(e,'tenant_products','product_mode',"TEXT DEFAULT 'free'");
    await tenantAddColumn(e,'tenant_products','original_link','TEXT DEFAULT ""');
    await tenantAddColumn(e,'tenant_withdrawals','terms_accepted_at','TEXT DEFAULT NULL');
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_payment_orders (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, product_id TEXT NOT NULL,
      payment_code TEXT NOT NULL UNIQUE, amount_vnd INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', transaction_id TEXT UNIQUE,
      buyer_ref TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')),
      expires_at INTEGER NOT NULL, paid_at TEXT DEFAULT NULL
    )`);
    // Older live payment-order tables may predate the referral column or paid timestamp.
    // Migrate only by adding columns; never rebuild the table or discard orders.
    await tenantAddColumn(e,'tenant_payment_orders','transaction_id','TEXT');
    await tenantAddColumn(e,'tenant_payment_orders','buyer_ref',"TEXT DEFAULT ''");
    await tenantAddColumn(e,'tenant_payment_orders','created_at','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_payment_orders','expires_at','INTEGER');
    await tenantAddColumn(e,'tenant_payment_orders','paid_at','TEXT DEFAULT NULL');
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_tenant_payment_orders_lookup ON tenant_payment_orders(tenant_id,product_id,status)`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_rental_orders (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, payment_code TEXT NOT NULL UNIQUE, amount_vnd INTEGER NOT NULL,
      days INTEGER NOT NULL DEFAULT 30, operation TEXT NOT NULL DEFAULT 'new', referrer_tenant_id TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'pending', transaction_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT(datetime('now')),
      expires_at INTEGER NOT NULL, paid_at TEXT DEFAULT NULL
    )`);
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_rental_orders_status ON tenant_rental_orders(status,expires_at)`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_view_dedup (event_key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)`);
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_tenant_view_dedup_expiry ON tenant_view_dedup(expires_at)`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS sepay_webhook_events (
      transaction_id TEXT PRIMARY KEY, order_code TEXT NOT NULL, amount_vnd INTEGER NOT NULL,
      received_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    // Tenant wallet is an additive ledger; never store a mutable balance as the source of truth.
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_wallet_ledger (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, amount_vnd INTEGER NOT NULL,
      kind TEXT NOT NULL, ref_type TEXT NOT NULL, ref_id TEXT NOT NULL,
      note TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')),
      UNIQUE(ref_type,ref_id,kind)
    )`);
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_wallet_ledger_tenant ON tenant_wallet_ledger(tenant_id,created_at)`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_payout_profiles (
      tenant_id TEXT PRIMARY KEY, method TEXT NOT NULL, bank_name TEXT DEFAULT '', account_number TEXT NOT NULL,
      account_holder TEXT NOT NULL, wallet_provider TEXT DEFAULT '', updated_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_withdrawals (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, gross_vnd INTEGER NOT NULL, fee_vnd INTEGER NOT NULL DEFAULT 0,
      payout_vnd INTEGER NOT NULL, method TEXT NOT NULL, payout_snapshot TEXT NOT NULL,
      speed TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT(datetime('now')), reviewed_at TEXT DEFAULT NULL, paid_at TEXT DEFAULT NULL
    )`);
    // This column is required when creating withdrawal requests and must also exist on brand-new D1.
    await tenantAddColumn(e,'tenant_withdrawals','terms_accepted_at','TEXT DEFAULT NULL');
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON tenant_withdrawals(status,created_at)`);

    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_tags (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_comments (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL,
      image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')), visible INTEGER NOT NULL DEFAULT 1
    )`);
    await tenantAddColumn(e,'tenant_comments','buyer_id','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_comments','email_normalized',"TEXT NOT NULL DEFAULT ''");
    await tenantAddColumn(e,'tenant_comments','client_ip',"TEXT NOT NULL DEFAULT ''");
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY(tenant_id,key)
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_views (
      tenant_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, product_id TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(tenant_id,day,kind,product_id)
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_referrers_daily (day TEXT NOT NULL,tenant_id TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'visit',domain TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,tenant_id,kind,domain))`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_audit_log (
      id TEXT PRIMARY KEY, tenant_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL,
      detail TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);

    // Safe migrations for databases created by earlier rental builds.
    // Use constant/nullable ALTER TABLE definitions; SQLite rejects expressions such as
    // DEFAULT(datetime('now')) when adding a column to an existing table.
    //
    // IMPORTANT: some early rental builds used `tenant_id` as the account key instead
    // of `id`. CREATE TABLE IF NOT EXISTS cannot change that existing table, so newer
    // INSERT/SELECT statements would fail with `no column named id`. Add the new `id`
    // column in-place and preserve the old key values. This is additive and does not
    // reset or delete any existing tenant data.
    const tenantAccountHasId=await tenantHasColumn(e,'tenant_accounts','id');
    const tenantAccountHasTenantId=await tenantHasColumn(e,'tenant_accounts','tenant_id');
    // Older rental builds may have tenant_id as the primary key and may also lack
    // some newer account fields. Add only nullable columns; never rebuild/drop the table.
    await tenantAddColumn(e,'tenant_accounts','slug','TEXT');
    await tenantAddColumn(e,'tenant_accounts','password_hash','TEXT');
    await tenantAddColumn(e,'tenant_accounts','admin_confirm_password_hash','TEXT');
    await tenantAddColumn(e,'tenant_accounts','starts_at','TEXT');
    await tenantAddColumn(e,'tenant_accounts','expires_at','TEXT');
    await tenantAddColumn(e,'tenant_accounts','email','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_accounts','plan_type',"TEXT DEFAULT 'paid'");
    await tenantAddColumn(e,'tenant_accounts','referrer_tenant_id','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_accounts','pending_order_id','TEXT DEFAULT NULL');
    await tenantAddColumn(e,'tenant_accounts','free_bypass_count','INTEGER DEFAULT 0');
    await tenantAddColumn(e,'tenant_accounts','free_admin_unlocked','INTEGER DEFAULT 0');
    await tenantAddColumn(e,'tenant_accounts','email_verified_at','TEXT DEFAULT NULL');
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS rental_email_verifications (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL, token_hash TEXT DEFAULT NULL,
      attempts INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL, verified_at TEXT DEFAULT NULL,
      used_at TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_rental_email_verifications_email ON rental_email_verifications(email,created_at)`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS free_bypass_attempts (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, step INTEGER NOT NULL, state_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT(datetime('now')),
      verified_at TEXT DEFAULT NULL
    )`);
    if(!tenantAccountHasId){
      await tenantAddColumn(e,'tenant_accounts','id','TEXT');
      if(tenantAccountHasTenantId){
        try{await tenantExec(e,"UPDATE tenant_accounts SET id=tenant_id WHERE id IS NULL OR id=''")}catch{}
      }
      if(!tenantAccountHasTenantId){
        try{await tenantExec(e,"UPDATE tenant_accounts SET id=slug WHERE id IS NULL OR id=''")}catch{}
      }
    }
    if(await tenantHasColumn(e,'tenant_accounts','tenant_id')){
      try{await tenantExec(e,"UPDATE tenant_accounts SET slug=tenant_id WHERE (slug IS NULL OR slug='') AND tenant_id IS NOT NULL")}catch{}
    }
    await tenantAddColumn(e,'tenant_accounts','locked','INTEGER');
    await tenantAddColumn(e,'tenant_accounts','deleted_at','TEXT');
    await tenantAddColumn(e,'tenant_accounts','created_at','TEXT');
    await tenantAddColumn(e,'tenant_products','views','INTEGER');
    await tenantAddColumn(e,'tenant_products','visible','INTEGER');
    await tenantAddColumn(e,'tenant_products','created_at','TEXT');
    await tenantAddColumn(e,'tenant_products','updated_at','TEXT');
    await tenantAddColumn(e,'tenant_comments','image','TEXT');
    await tenantAddColumn(e,'tenant_comments','visible','INTEGER');
    await tenantAddColumn(e,'tenant_comments','created_at','TEXT');
    await tenantAddColumn(e,'tenant_tags','parent_id','TEXT');
    await tenantAddColumn(e,'tenant_tags','created_at','TEXT');
    await tenantAddColumn(e,'tenant_audit_log','detail','TEXT');
    await tenantAddColumn(e,'tenant_audit_log','created_at','TEXT');

    // Backfill nullable migration columns. These statements are idempotent.
    try{await tenantExec(e,"UPDATE tenant_accounts SET locked=0 WHERE locked IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_accounts SET deleted_at=NULL WHERE deleted_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_accounts SET created_at=datetime('now') WHERE created_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_accounts SET free_bypass_count=0 WHERE free_bypass_count IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_accounts SET free_admin_unlocked=0 WHERE free_admin_unlocked IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_products SET views=0 WHERE views IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_products SET visible=1 WHERE visible IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_products SET created_at=datetime('now') WHERE created_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_products SET updated_at=datetime('now') WHERE updated_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_comments SET image='' WHERE image IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_comments SET visible=1 WHERE visible IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_comments SET created_at=datetime('now') WHERE created_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_tags SET created_at=datetime('now') WHERE created_at IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_audit_log SET detail='' WHERE detail IS NULL")}catch{}
    try{await tenantExec(e,"UPDATE tenant_audit_log SET created_at=datetime('now') WHERE created_at IS NULL")}catch{}

    // Index creation is non-critical; don't make an existing index name break tenant pages.
    try{await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON tenant_products(tenant_id,updated_at)`)}catch{}
    try{await tenantExec(e,`CREATE INDEX IF NOT EXISTS idx_tenant_views_tenant_day ON tenant_views(tenant_id,day)`)}catch{}
  })().catch(err=>{tenantSchemaReady=null;throw err});
  return tenantSchemaReady;
}
function tenantSlug(v){return clean(v,80).toLowerCase().replace(/[^a-z0-9_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
function tenantDateMs(v){
  if(v===null||v===undefined||v==='')return NaN;
  if(typeof v==='number' || /^\d{10,14}$/.test(String(v).trim())){
    const n=Number(v);
    if(Number.isFinite(n))return n<100000000000?n*1000:n;
  }
  const t=Date.parse(String(v).replace(' ','T')+'Z');
  return Number.isFinite(t)?t:NaN;
}
function tenantStatus(x){
  if(!x)return 'not_found';
  if(x.deleted_at)return 'deleted';
  if(Number(x.locked))return 'locked';
  const now=Date.now(), ex=tenantDateMs(x.expires_at);
  if(Number.isFinite(ex) && ex<now){const grace=ex+6*24*60*60*1000;return now<=grace?'expired_grace':'expired'}
  return 'active';
}
function tenantDaysLeft(x){
  const ex=tenantDateMs(x?.expires_at);
  return Number.isFinite(ex)?Math.max(0,Math.ceil((ex-Date.now())/86400000)):0;
}
function tenantInfo(x){const freeGate=String(x?.plan_type||'paid')==='free'&&Number(x?.free_admin_unlocked||0)!==1&&!x?.deleted_at&&!Number(x?.locked);return {id:x?.id??x?.tenant_id,slug:x?.slug??x?.tenant_id??x?.id,startsAt:x?.starts_at,expiresAt:x?.expires_at,daysLeft:tenantDaysLeft(x),status:freeGate?'free_bypass_required':tenantStatus(x),locked:!!x?.locked,deleted:!!x?.deleted_at,planType:String(x?.plan_type||'paid'),freeBypassCount:Number(x?.free_bypass_count||0),freeAdminUnlocked:Number(x?.free_admin_unlocked||0)===1,referralCode:String(x?.slug||x?.id||x?.tenant_id||''),createdAt:x?.created_at}}
async function tenantPasswordMatches(e,t,password){
  const raw=String(password??'');
  const stored=String(t?.password_hash||'');
  const hash=await sha256(raw);
  if(stored===hash)return true;
  // Tenant accounts created by V55+ use PBKDF2. Verify this format before
  // considering legacy SHA-256/plaintext records; otherwise valid older rentals
  // appear to reload the login form without ever opening the admin panel.
  if(stored.startsWith('pbkdf2$') && await verifyPasswordV55(raw,stored))return true;
  // Legacy rental deployments may have stored the password directly in password_hash,
  // or in password/pass columns. Accept only an exact match and migrate it immediately.
  try{
    const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
    const names=new Set(cols.map(x=>x.name));
    const legacyPlain=(stored && stored===raw) || ['password','pass'].some(col=>names.has(col)&&String(t?.[col]??'')===raw);
    if(legacyPlain){
      const keys=[];
      if(names.has('id')&&t?.id!=null)keys.push(['id',t.id]);
      if(names.has('tenant_id')&&t?.tenant_id!=null)keys.push(['tenant_id',t.tenant_id]);
      if(names.has('slug')&&t?.slug)keys.push(['slug',t.slug]);
      for(const [col,value] of keys)await e.DB.prepare(`UPDATE tenant_accounts SET password_hash=? WHERE ${col}=?`).bind(hash,value).run();
      return true;
    }
    // Legacy hash formats are intentionally not guessed: a wrong migration could lock out tenants.
  }catch{}
  return false;
}
async function tenantCandidates(e,value){
  await ensureTenantSchema(e);
  const raw=clean(value,100);
  const normalized=tenantSlug(raw);
  const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
  const names=new Set(cols.map(x=>x.name));
  const where=[],binds=[];
  if(names.has('slug')){where.push("(slug=? OR lower(slug)=lower(?))");binds.push(normalized,raw)}
  if(names.has('id')){where.push("(id=? OR lower(id)=lower(?))");binds.push(raw,normalized)}
  if(names.has('tenant_id')){where.push("(tenant_id=? OR lower(tenant_id)=lower(?))");binds.push(raw,normalized)}
  if(!where.length)return [];
  const deleted=names.has('deleted_at')?" AND (deleted_at IS NULL OR deleted_at='')":"";
  return (await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE (${where.join(' OR ')})${deleted} ORDER BY rowid DESC`).bind(...binds).all()).results||[];
}
async function tenantBySlug(e,slug){
  const rows=await tenantCandidates(e,slug);
  return rows[0]||null;
}
async function tenantByLogin(e,identifier,password){
  const rows=await tenantCandidates(e,identifier);
  // Match the password using every supported stored format. Do not select the
  // newest duplicate row blindly: older rental records may share an ID/slug.
  for(const row of rows){
    if(await tenantPasswordMatches(e,row,password))return row;
  }
  return rows[0]||null;
}
async function tenantByIdentifier(e,value){
  const raw=clean(value,100);
  if(!raw)return null;
  await ensureTenantSchema(e);
  const normalized=tenantSlug(raw);
  const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
  const names=new Set(cols.map(x=>x.name));
  const where=[],binds=[];
  for(const col of ['id','tenant_id','slug']){
    if(!names.has(col))continue;
    where.push(`(${col}=? OR lower(${col})=lower(?))`);
    binds.push(raw,normalized);
  }
  if(!where.length)return null;
  const deleted=names.has('deleted_at')?" AND (deleted_at IS NULL OR deleted_at='')":'';
  const rows=(await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE (${where.join(' OR ')})${deleted} ORDER BY rowid DESC`).bind(...binds).all()).results||[];
  return rows.find(x=>String(x.admin_confirm_password_hash||''))||rows.find(x=>String(x.password_hash||''))||rows[0]||null;
}
async function tenantFromSession(r,e){
  const tok=tokenFrom(r);if(!tok)return null;await ensureTenantSchema(e);
  const row=await e.DB.prepare('SELECT tenant_id FROM tenant_sessions WHERE token=? AND expires_at>?').bind(tok,Date.now()).first();
  if(!row?.tenant_id){
    // Unified buyer session can open a studio owned by the same verified email.
    const buyer=await buyerFromRequest(r,e),slug=clean(r.headers.get('x-tenant-slug')||new URL(r.url).searchParams.get('tenant')||'',80);
    if(!buyer||!slug)return null;
    const owner=await e.DB.prepare("SELECT * FROM tenant_accounts WHERE lower(email)=lower(?) AND lower(slug)=lower(?) AND (deleted_at IS NULL OR deleted_at='') LIMIT 1").bind(buyer.email,slug).first();
    if(!owner)return null;
    return normalizeTenantRow(e,owner);
  }
  const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
  const names=new Set(cols.map(x=>x.name));
  const where=[],vals=[]; const sid=clean(row.tenant_id,100);
  for(const col of ['id','tenant_id','slug']){
    if(!names.has(col))continue;
    where.push(`(${col}=? OR lower(${col})=lower(?))`);vals.push(sid,sid);
  }
  if(!where.length)return null;
  const rows=(await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE (${where.join(' OR ')}) AND (deleted_at IS NULL OR deleted_at='') ORDER BY rowid DESC`).bind(...vals).all()).results||[];
  // If legacy migrations left duplicate rows, prefer the row carrying the security
  // password instead of an older shadow row that makes Settings show "not set".
  const a=rows.find(x=>String(x.admin_confirm_password_hash||''))||rows.find(x=>String(x.password_hash||''))||rows[0]||null;
  return normalizeTenantRow(e,a);
}

async function tenantSettings(e,t){const k=tenantInSql(t);const rows=(await e.DB.prepare(`SELECT key,value FROM tenant_settings WHERE ${k.clause}`).bind(...k.vals).all()).results||[];const out={siteName:'Lại Húp File',studio:'Téo Studio',heroTitle:'Kho Share File riêng',heroText:'Kho file riêng của bạn.',avatar:'assets/img/default-avatar.svg',avatarVideoUrl:'',groupLink:'#',adminContact:'#',announcementEnabled:true,announcementTitle:'Thông báo từ Téo Studio',announcementText:'Hãy đọc kỹ thông báo trước khi vào web.',donateTitle:'Ủng hộ Téo',donateText:'Nếu thấy web hữu ích, bạn có thể donate để Téo có thêm động lực duy trì và nâng cấp web.',donateQr:'',ownerName:'Téo Studio',ownerText:'Kho Share File được vận hành bởi Téo Studio.',adText:'',adLink:'#',heroBackground:''};for(const x of rows){try{out[x.key]=JSON.parse(x.value)}catch{out[x.key]=x.value}}for(const key of ['groupLink','adminContact','adLink','avatarVideoUrl','socialTikTokUrl','socialYoutubeUrl'])if(out[key]&&out[key]!=='#')out[key]=safeHttpUrl(out[key],4000)||'#';for(const key of ['avatar','donateQr'])if(out[key])out[key]=safeImageValue(out[key],1500000)||'';out.ownerName='Téo Studio';out.ownerText='Kho Share File được vận hành bởi Téo Studio.';return out}
async function tenantProducts(e,t,admin=false){
  const k=tenantInSql(t);
  const rows=((await e.DB.prepare(`SELECT * FROM tenant_products WHERE ${k.clause} ${admin?'':'AND visible=1'} ORDER BY updated_at DESC`).bind(...k.vals).all()).results||[]);
  return rows.map(row=>{
    const mode=['free','unlock','paid','both'].includes(String(row.product_mode||''))?String(row.product_mode):(Number(row.sale_enabled)===1?'paid':'free');
    const price=Math.max(0,Number(row.price_vnd)||0);
    const out={...row,product_mode:mode,price_vnd:price,sale_enabled:['paid','both'].includes(mode)&&price>=1000?1:0,
      download_link:safeHttpUrl(row.download_link,10000),original_link:safeHttpUrl(row.original_link,10000),thumb:row.thumb?safeImageValue(row.thumb,1500000):''};
    // Public Share list must never serialize the paid/original URL. A client-side hide is not protection.
    // Admin API gets full URLs for editing; public mode returns only the link appropriate to the sale mode.
    if(!admin){
      if(mode==='paid'){out.download_link='';out.original_link='';}
      else if(mode==='both'||mode==='unlock'){out.original_link='';}
      else {out.original_link='';}
    }
    return out;
  });
}
async function tenantTags(e,t){const k=tenantInSql(t);return (await e.DB.prepare(`SELECT id,name,parent_id,created_at FROM tenant_tags WHERE ${k.clause} ORDER BY name COLLATE NOCASE`).bind(...k.vals).all()).results||[]}
async function tenantComments(e,t,admin=false){const k=tenantInSql(t);return ((await e.DB.prepare(`SELECT id,name,text,image,created_at,visible FROM tenant_comments WHERE ${k.clause} ${admin?'':'AND visible=1'} ORDER BY created_at DESC`).bind(...k.vals).all()).results||[]).map(x=>({...x,image:x.image?safeImageValue(x.image,600000):''}))}
async function tenantAuditColumns(e){
  try{return ((await e.DB.prepare('PRAGMA table_info(tenant_audit_log)').all()).results||[]).map(x=>x.name)}catch{return []}
}
async function tenantAudit(e,tid){
  const cols=await tenantAuditColumns(e);
  if(!cols.includes('tenant_id'))return [];
  const select=[];
  if(cols.includes('actor'))select.push('actor'); else if(cols.includes('user'))select.push('user AS actor'); else select.push("'system' AS actor");
  if(cols.includes('action'))select.push('action'); else select.push("'activity' AS action");
  if(cols.includes('detail'))select.push('detail'); else select.push("'' AS detail");
  if(cols.includes('created_at'))select.push('created_at'); else select.push("'' AS created_at");
  try{return (await e.DB.prepare(`SELECT ${select.join(',')} FROM tenant_audit_log WHERE tenant_id=? ORDER BY ${cols.includes('created_at')?'created_at':'rowid'} DESC LIMIT 100`).bind(tid).all()).results||[]}catch{return []}
}
async function tenantLog(e,tid,actor,action,detail=''){
  try{
    const cols=await tenantAuditColumns(e);
    const names=['id']; const vals=[crypto.randomUUID()]; const qs=['?'];
    if(cols.includes('tenant_id')){names.push('tenant_id');vals.push(tid);qs.push('?')}
    if(cols.includes('actor')){names.push('actor');vals.push(actor);qs.push('?')}
    else if(cols.includes('user')){names.push('user');vals.push(actor);qs.push('?')}
    if(cols.includes('action')){names.push('action');vals.push(action);qs.push('?')}
    if(cols.includes('detail')){names.push('detail');vals.push(clean(detail,1000));qs.push('?')}
    if(cols.includes('created_at')){names.push('created_at');vals.push(new Date().toISOString().slice(0,19).replace('T',' '));qs.push('?')}
    await e.DB.prepare(`INSERT INTO tenant_audit_log(${names.join(',')}) VALUES(${qs.join(',')})`).bind(...vals).run();
  }catch{}
}
let lastViewDedupPruneAt=0;
async function tenantBump(e,t,kind,pid='',request=null,source=''){
  const day=dayVN(),tid=t.id;
  if(request){
    const now=Date.now(),ip=clientIp(request)||'unknown',ua=clean(request.headers.get('user-agent')||'',180);
    const key=await sha256(`${ip}|${ua}|${tid}|${kind}|${pid}|${Math.floor(now/900000)}`);
    // Cleanup is amortized to avoid making every page view perform an extra D1 write.
    if(now-lastViewDedupPruneAt>600000){lastViewDedupPruneAt=now;try{await e.DB.prepare('DELETE FROM tenant_view_dedup WHERE expires_at<=?').bind(now).run()}catch{}
  try{await e.DB.prepare("DELETE FROM comment_rate_events WHERE created_at < datetime('now','-7 days')").run()}catch{}}
    try{await e.DB.prepare('INSERT INTO tenant_view_dedup(event_key,expires_at) VALUES(?,?)').bind(key,now+20*60*1000).run()}catch{return false}
  }
  await e.DB.prepare(`INSERT INTO tenant_views(tenant_id,day,kind,product_id,views) VALUES(?,?,?,?,1) ON CONFLICT(tenant_id,day,kind,product_id) DO UPDATE SET views=views+1`).bind(tid,day,kind,pid).run();
  const domain=safeReferrerDomain(source||(request?.headers?.get('referer')||''));if(domain&&(kind==='visit'||kind==='outbound')){try{await e.DB.prepare(`INSERT INTO tenant_referrers_daily(day,tenant_id,kind,domain,views) VALUES(?,?,?, ?,1) ON CONFLICT(day,tenant_id,kind,domain) DO UPDATE SET views=views+1`).bind(day,tid,kind,domain).run()}catch{}}
  if(kind==='product'&&pid){const k=tenantInSql(t);await e.DB.prepare(`UPDATE tenant_products SET views=COALESCE(views,0)+1 WHERE ${k.clause} AND id=?`).bind(...k.vals,pid).run()}
  return true;
}
async function tenantStats(e,tid,days=30,month=''){
  let rows=[],sales={orders:0,revenueVnd:0,views:0,conversionRate:0,byDay:[]},start='';
  if(/^\d{4}-\d{2}$/.test(String(month||''))){start=String(month)+'-01';rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM tenant_views WHERE tenant_id=? AND day>=? AND day<date(?, '+1 month') ORDER BY day ASC`).bind(tid,start,start).all()).results||[];
    const paid=(await e.DB.prepare(`SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenue FROM tenant_payment_orders WHERE tenant_id=? AND status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<date(?, '+1 month')`).bind(tid,start,start).first())||{};
    sales.orders=Number(paid.orders||0);sales.revenueVnd=Number(paid.revenue||0);sales.views=rows.filter(x=>x.kind==='product').reduce((a,x)=>a+Number(x.views||0),0);sales.siteVisits=rows.filter(x=>x.kind==='visit').reduce((a,x)=>a+Number(x.views||0),0);sales.conversionRate=sales.views?Math.round(sales.orders/sales.views*10000)/100:0;
    sales.byDay=(await e.DB.prepare(`SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenue FROM tenant_payment_orders WHERE tenant_id=? AND status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<date(?, '+1 month') GROUP BY date(paid_at,'+7 hours') ORDER BY day`).bind(tid,start,start).all()).results||[];
    const referrers=(await e.DB.prepare("SELECT domain,SUM(views) AS views FROM tenant_referrers_daily WHERE tenant_id=? AND day>=? AND day<date(?, '+1 month') GROUP BY domain ORDER BY views DESC LIMIT 50").bind(tid,start,start).all()).results||[];
    return {days:rows.length,month,start,rows,products:await tenantProducts(e,tid,true),referrers,today:rows.filter(x=>x.day===dayVN()&&x.kind==='visit').reduce((a,x)=>a+Number(x.views||0),0),sales};
  }
  const n=Math.max(1,Math.min(Number(days)||30,3650));rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM tenant_views WHERE tenant_id=? AND day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(tid,dayVN(),n-1).all()).results||[];
  const from=(await e.DB.prepare(`SELECT date(?, '-'||?||' days') AS d`).bind(dayVN(),n-1).first())?.d||dayVN();
  const referrers=(await e.DB.prepare("SELECT domain,SUM(views) AS views FROM tenant_referrers_daily WHERE tenant_id=? AND day>=? GROUP BY domain ORDER BY views DESC LIMIT 50").bind(tid,from).all()).results||[];
  const paid=(await e.DB.prepare(`SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenue FROM tenant_payment_orders WHERE tenant_id=? AND status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<=?`).bind(tid,from,dayVN()).first())||{};
  sales.orders=Number(paid.orders||0);sales.revenueVnd=Number(paid.revenue||0);sales.views=rows.filter(x=>x.kind==='product').reduce((a,x)=>a+Number(x.views||0),0);sales.siteVisits=rows.filter(x=>x.kind==='visit').reduce((a,x)=>a+Number(x.views||0),0);sales.conversionRate=sales.views?Math.round(sales.orders/sales.views*10000)/100:0;
  sales.byDay=(await e.DB.prepare(`SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenue FROM tenant_payment_orders WHERE tenant_id=? AND status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<=? GROUP BY date(paid_at,'+7 hours') ORDER BY day`).bind(tid,from,dayVN()).all()).results||[];
  return {days:n,rows,products:await tenantProducts(e,tid,true),referrers,today:rows.filter(x=>x.day===dayVN()&&x.kind==='visit').reduce((a,x)=>a+Number(x.views||0),0),sales};
}
async function purgeExpired(e){
  // Expiry changes access/plan state; it must never erase user content or financial history.
  // Keep this maintenance path additive and limited to expired ephemeral sessions/verification attempts.
  await ensureTenantSchema(e);
  const now=Date.now();
  try{await e.DB.prepare("DELETE FROM tenant_sessions WHERE typeof(expires_at)='integer' AND expires_at<=?").bind(now).run()}catch{}
  try{await e.DB.prepare("UPDATE tenant_rental_orders SET status='expired' WHERE status='pending' AND expires_at<=?").bind(now).run()}catch{}
  try{await e.DB.prepare("DELETE FROM rental_email_verifications WHERE expires_at<=? OR (used_at IS NOT NULL AND created_at < datetime('now', '-7 days'))").bind(now).run()}catch{}
  try{await e.DB.prepare("DELETE FROM free_bypass_attempts WHERE expires_at<=? OR (status='verified' AND verified_at < datetime('now','-30 days'))").bind(now).run()}catch{}
  try{await e.DB.prepare('DELETE FROM tenant_view_dedup WHERE expires_at<=?').bind(now).run()}catch{}
  try{await e.DB.prepare("DELETE FROM comment_rate_events WHERE created_at < datetime('now','-7 days')").run()}catch{}
}

async function walletBalance(e,tenantId){
  const row=await e.DB.prepare('SELECT COALESCE(SUM(amount_vnd),0) AS balance FROM tenant_wallet_ledger WHERE tenant_id=?').bind(tenantId).first();
  return Math.max(0,Number(row?.balance||0));
}
async function walletCreditSale(e,order,txId,amount){
  // Idempotent credit: a paid order can only create one sale ledger row.
  try{await e.DB.prepare("INSERT INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) VALUES(?,?,?,'sale','order',?,?)").bind(crypto.randomUUID(),order.tenant_id,Math.floor(amount),String(order.id),`SePay ${txId}`).run();return true}catch{return false}
}
function buildVietQr(e,amount,code){const bank=encodeURIComponent(clean(e.SEPAY_BANK_CODE,40)),account=encodeURIComponent(clean(e.SEPAY_ACCOUNT_NUMBER,40)),name=encodeURIComponent(clean(e.SEPAY_ACCOUNT_NAME||'',100));return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${Math.floor(amount)}&addInfo=${encodeURIComponent(code)}${name?'&accountName='+name:''}`}
function safeEq(a,b){const x=new TextEncoder().encode(String(a??'')),y=new TextEncoder().encode(String(b??''));if(x.length!==y.length)return false;let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0}
async function verifyTurnstile(e,token,r){if(!e.TURNSTILE_SECRET||!e.TURNSTILE_SITE_KEY)return {ok:false,enabled:true,reason:'TURNSTILE_NOT_CONFIGURED'};if(!token)return {ok:false,enabled:true};try{const body=new URLSearchParams({secret:String(e.TURNSTILE_SECRET),response:String(token),remoteip:clientIp(r)});const resp=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});const data=await resp.json();const host=String(data.hostname||'').toLowerCase();return {ok:!!data.success&&['teostudio.top','www.teostudio.top'].includes(host),enabled:true}}catch{return {ok:false,enabled:true}}}
function paymentConfig(e){return {paymentsEnabled:!!(e.SEPAY_API_KEY&&e.SEPAY_BANK_CODE&&e.SEPAY_ACCOUNT_NUMBER),missing:['SEPAY_API_KEY','SEPAY_BANK_CODE','SEPAY_ACCOUNT_NUMBER'].filter(k=>!e[k]),turnstileEnabled:true,turnstileConfigured:!!(e.TURNSTILE_SECRET&&e.TURNSTILE_SITE_KEY),turnstileSiteKey:clean(e.TURNSTILE_SITE_KEY||'',200),turnstileMissing:['TURNSTILE_SECRET','TURNSTILE_SITE_KEY'].filter(k=>!e[k]),rentalPriceVnd:50000,rentalDays:30}}
async function handleSePayWebhook(r,e){
  // SePay expects a 2xx response with {"success":true}. Acknowledged ignored events are safe to retry.
  if(r.method!=='POST')return J({success:false,error:'METHOD_NOT_ALLOWED'},405);
  const expected=String(e.SEPAY_API_KEY||'');
  const auth=String(r.headers.get('authorization')||'');
  const supplied=(auth.match(/^Apikey\s+(.+)$/i)||[])[1]?.trim()||String(r.headers.get('x-sepay-api-key')||'').trim();
  if(!expected||!supplied||!safeEq(supplied,expected))return J({success:false,error:'UNAUTHORIZED'},401);
  let b;try{b=await r.json()}catch{return J({success:false,error:'INVALID_PAYLOAD'},400)}
  if(!b||typeof b!=='object'||Array.isArray(b))return J({success:false,error:'INVALID_PAYLOAD'},400);
  const txId=String(b.id??b.transaction_id??'').trim();
  const amount=Math.floor(Number(b.transferAmount??b.transfer_amount??b.amount??0));
  const direction=String(b.transferType??b.transfer_type??b.type??'').trim().toLowerCase();
  const content=String(b.content??b.description??b.transferContent??b.transactionContent??b.transaction_content??'').toUpperCase();
  if(!txId||txId.length>200||!Number.isFinite(amount)||amount<=0)return J({success:false,error:'INVALID_TRANSACTION'},400);
  if(direction&&!['in','income','credit','incoming','deposit'].includes(direction))return J({success:true,ignored:true,reason:'NOT_INCOMING'});
  const configuredAccount=String(e.SEPAY_ACCOUNT_NUMBER||'').replace(/\s+/g,'');
  const payloadAccount=String(b.accountNumber??b.account_number??'').replace(/\s+/g,'');
  if(configuredAccount&&payloadAccount&&configuredAccount!==payloadAccount)return J({success:true,ignored:true,reason:'WRONG_ACCOUNT'});
  const match=content.match(/TEO[A-Z0-9]{10}/);
  if(!match)return J({success:true,ignored:true,reason:'NO_ORDER_CODE'});
  const code=match[0];
  await ensureTenantSchema(e);await ensureV55Schema(e);

  // Wallet top-ups: one SePay transfer credits one buyer ledger entry; retries are idempotent.
  const topup=await e.DB.prepare("SELECT * FROM buyer_wallet_topups WHERE payment_code=? AND status='pending' AND expires_at>? LIMIT 1").bind(code,Date.now()).first();
  if(topup){
    if(amount<Number(topup.amount_vnd))return J({success:false,error:'AMOUNT_TOO_LOW'},400);
    try{await e.DB.prepare('INSERT INTO sepay_webhook_events(transaction_id,order_code,amount_vnd) VALUES(?,?,?)').bind(txId,code,amount).run()}catch{return J({success:true,duplicate:true})}
    const upd=await e.DB.prepare("UPDATE buyer_wallet_topups SET status='paid',transaction_id=?,paid_at=datetime('now') WHERE id=? AND status='pending' AND amount_vnd<=?").bind(txId,topup.id,amount).run();
    if(!upd?.meta?.changes){try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:true,ignored:true,reason:'TOPUP_ALREADY_PROCESSED'})}
    try{await e.DB.prepare("INSERT OR IGNORE INTO buyer_wallet_ledger(id,buyer_id,amount_vnd,kind,ref_type,ref_id,note) VALUES(?,?,?,'topup','topup',?,?)").bind(crypto.randomUUID(),topup.buyer_id,Number(topup.amount_vnd),topup.id,`Nạp ví qua SePay · ${txId}`).run();const exists=await e.DB.prepare("SELECT id FROM buyer_wallet_ledger WHERE buyer_id=? AND kind='topup' AND ref_type='topup' AND ref_id=?").bind(topup.buyer_id,topup.id).first();if(!exists)throw new Error('TOPUP_LEDGER_FAILED')}
    catch(err){try{await e.DB.prepare("UPDATE buyer_wallet_topups SET status='pending',transaction_id=NULL,paid_at=NULL WHERE id=? AND transaction_id=?").bind(topup.id,txId).run()}catch{};try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:false,error:'TOPUP_LEDGER_FAILED'},500)}
    await createNotification(e,{recipientType:'buyer',recipientId:topup.buyer_id,title:'Nạp ví thành công',body:`Ví đã được cộng ${Number(topup.amount_vnd).toLocaleString('vi-VN')}đ.`,kind:'payment'});
    await telegramSend(e,`💰 TeoStudio · Nạp ví thành công\nMã đơn: ${topup.id}\nSố tiền nạp: ${Number(topup.amount_vnd).toLocaleString('vi-VN')}đ\nMã giao dịch SePay: ${txId}`);
    return J({success:true,paid:true,order_id:topup.id,kind:'buyer_wallet_topup'});
  }
  // Rental purchase/renewal orders are processed separately from seller file sales.
  const rental=await e.DB.prepare("SELECT * FROM tenant_rental_orders WHERE payment_code=? AND status='pending' AND expires_at>? LIMIT 1").bind(code,Date.now()).first();
  if(rental){
    if(amount<Number(rental.amount_vnd))return J({success:false,error:'AMOUNT_TOO_LOW'},400);
    const key=await tenantAccountKeyColumn(e);if(!key)return J({success:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
    const rawAccount=await tenantByIdentifier(e,rental.tenant_id);
    if(!rawAccount)return J({success:false,error:'RENTAL_ACCOUNT_NOT_FOUND'},500);
    const account=await normalizeTenantRow(e,rawAccount);
    if(rental.operation==='new'&&String(account.pending_order_id||'')!==String(rental.id))return J({success:false,error:'RENTAL_ORDER_ACCOUNT_MISMATCH'},409);
    try{await e.DB.prepare('INSERT INTO sepay_webhook_events(transaction_id,order_code,amount_vnd) VALUES(?,?,?)').bind(txId,code,amount).run()}
    catch{return J({success:true,duplicate:true})}
    const upd=await e.DB.prepare("UPDATE tenant_rental_orders SET status='paid',transaction_id=?,paid_at=datetime('now') WHERE id=? AND status='pending' AND amount_vnd<=?").bind(txId,rental.id,amount).run();
    if(!upd?.meta?.changes){try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:true,ignored:true,reason:'ORDER_ALREADY_PROCESSED'})}
    try{
      const now=new Date(),nowText=now.toISOString().slice(0,19).replace('T',' ');
      if(rental.operation==='new'){
        const ex=new Date(Date.now()+Number(rental.days||30)*86400000).toISOString().slice(0,19).replace('T',' ');
        const acc=await e.DB.prepare(`UPDATE tenant_accounts SET locked=0,plan_type='paid',starts_at=?,expires_at=?,pending_order_id=NULL WHERE ${key}=? AND pending_order_id=? AND (deleted_at IS NULL OR deleted_at='')`).bind(nowText,ex,account.id,rental.id).run();
        if(!acc?.meta?.changes)throw new Error('RENTAL_ACCOUNT_ACTIVATION_FAILED');
      }else{
        const oldExp=tenantDateMs(account.expires_at),base=Math.max(Date.now(),Number.isFinite(oldExp)?oldExp:Date.now());
        const ex=new Date(base+Number(rental.days||30)*86400000).toISOString().slice(0,19).replace('T',' ');
        const acc=await e.DB.prepare(`UPDATE tenant_accounts SET expires_at=?,locked=0,plan_type='paid' WHERE ${key}=? AND (deleted_at IS NULL OR deleted_at='')`).bind(ex,account.id).run();
        if(!acc?.meta?.changes)throw new Error('RENTAL_ACCOUNT_RENEW_FAILED');
      }
    }catch(err){
      // Make SePay retries safe if activation failed before any money-ledger side effect.
      try{await e.DB.prepare("UPDATE tenant_rental_orders SET status='pending',transaction_id=NULL,paid_at=NULL WHERE id=? AND transaction_id=?").bind(rental.id,txId).run()}catch{}
      try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{}
      return J({success:false,error:'RENTAL_ACTIVATION_FAILED'},500);
    }
    // 10% rental referral commission is credited once to the referring tenant wallet.
    if(rental.referrer_tenant_id&&String(rental.referrer_tenant_id)!==String(account.id)){
      const commission=Math.floor(Number(rental.amount_vnd)*0.10);
      if(commission>0){try{await e.DB.prepare("INSERT OR IGNORE INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) VALUES(?,?,?,'referral_commission','rental_order',?,?)").bind(crypto.randomUUID(),rental.referrer_tenant_id,commission,rental.id,`Hoa hồng giới thiệu thuê trang · ${txId}`).run()}catch{}}
    }
    try{await tenantLog(e,account.id,'system',rental.operation==='new'?'rental_paid':'rental_renewed',`${rental.id}:${code}:${amount}`)}catch{}
    const adminTo=validEmail(e.EMAIL_ADMIN_TO||'teostudio@teostudio.top');
    if(adminTo)await notifyEmail(e,{to:adminTo,subject:'Téo Studio: Thanh toán thuê trang thành công',text:`Đơn thuê: ${rental.id}\nTenant: ${account.slug}\nSố tiền nhận: ${amount.toLocaleString('vi-VN')} VND\nSố ngày: ${rental.days}\nTình trạng: đã kích hoạt.`});
    await createNotification(e,{recipientType:'admin',recipientId:'master',title:'Thanh toán thuê trang thành công',body:`Tenant ${account.slug} · ${amount.toLocaleString('vi-VN')}đ · mã ${rental.id}`,kind:'payment'});
    await createNotification(e,{recipientType:'tenant',recipientId:account.id,title:'Thuê trang đã được kích hoạt',body:`Thanh toán ${amount.toLocaleString('vi-VN')}đ đã được xác nhận. Bạn có thể mở Admin riêng và Share File.`,kind:'payment'});
    return J({success:true,paid:true,order_id:rental.id,kind:'rental'});
  }

  const order=await e.DB.prepare("SELECT * FROM tenant_payment_orders WHERE payment_code=? AND status='pending' AND expires_at>? LIMIT 1").bind(code,Date.now()).first();
  if(!order){
    await ensureSchema(e);
    const mainOrder=await e.DB.prepare("SELECT * FROM product_payment_orders WHERE payment_code=? AND status='pending' AND expires_at>? LIMIT 1").bind(code,Date.now()).first();
    if(!mainOrder)return J({success:true,ignored:true,reason:'ORDER_NOT_PENDING'});
    if(amount<Number(mainOrder.amount_vnd))return J({success:false,error:'AMOUNT_TOO_LOW'},400);
    try{await e.DB.prepare('INSERT INTO sepay_webhook_events(transaction_id,order_code,amount_vnd) VALUES(?,?,?)').bind(txId,code,amount).run()}catch{return J({success:true,duplicate:true})}
    const updMain=await e.DB.prepare("UPDATE product_payment_orders SET status='paid',transaction_id=?,paid_at=datetime('now') WHERE id=? AND status='pending' AND amount_vnd<=?").bind(txId,mainOrder.id,amount).run();
    if(!updMain?.meta?.changes){try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:true,ignored:true,reason:'ORDER_ALREADY_PROCESSED'})}
    await createNotification(e,{recipientType:'admin',recipientId:'master',title:'Đã nhận thanh toán file trên web chính',body:`Đơn ${mainOrder.id} · file ${mainOrder.product_id} · ${amount.toLocaleString('vi-VN')}đ`,kind:'payment'});
    const adminTo=validEmail(e.EMAIL_ADMIN_TO||'teostudio@teostudio.top');if(adminTo)await notifyEmail(e,{to:adminTo,subject:'Téo Studio: Đã nhận thanh toán file',text:`Đơn file web chính: ${mainOrder.id}\nMã: ${code}\nSố tiền: ${amount.toLocaleString('vi-VN')} VND\nTình trạng: đã xác nhận.`});
    return J({success:true,paid:true,order_id:mainOrder.id,kind:'main_product'});
  }
  if(amount<Number(order.amount_vnd))return J({success:false,error:'AMOUNT_TOO_LOW'},400);
  try{await e.DB.prepare('INSERT INTO sepay_webhook_events(transaction_id,order_code,amount_vnd) VALUES(?,?,?)').bind(txId,code,amount).run()}
  catch{return J({success:true,duplicate:true})}
  const upd=await e.DB.prepare("UPDATE tenant_payment_orders SET status='paid',transaction_id=?,paid_at=datetime('now') WHERE id=? AND status='pending' AND amount_vnd<=?").bind(txId,order.id,amount).run();
  if(!upd?.meta?.changes){try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:true,ignored:true,reason:'ORDER_ALREADY_PROCESSED'})}
  const refId=String(order.buyer_ref||'');
  const referrer=refId&&refId!==String(order.tenant_id)?await tenantByIdentifier(e,refId).catch(()=>null):null;
  const commission=referrer?Math.floor(Number(order.amount_vnd)*0.10):0;
  const sellerAmount=Math.max(0,Math.min(Number(order.amount_vnd),amount)-commission);
  const creditOk=await walletCreditSale(e,order,txId,sellerAmount);
  if(!creditOk){
    const existing=await e.DB.prepare("SELECT id FROM tenant_wallet_ledger WHERE ref_type='order' AND ref_id=? AND kind='sale' LIMIT 1").bind(String(order.id)).first().catch(()=>null);
    if(!existing){try{await e.DB.prepare("UPDATE tenant_payment_orders SET status='pending',transaction_id=NULL,paid_at=NULL WHERE id=? AND transaction_id=?").bind(order.id,txId).run()}catch{};try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{};return J({success:false,error:'WALLET_CREDIT_FAILED'},500)}
  }
  if(referrer&&commission>0){
    try{await e.DB.prepare("INSERT OR IGNORE INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) VALUES(?,?,?,'referral_commission','file_order',?,?)").bind(crypto.randomUUID(),String(referrer.id??referrer.tenant_id??referrer.slug),commission,String(order.id),`Hoa hồng giới thiệu file · ${txId}`).run()}
    catch(err){
      // Roll back the seller credit before asking SePay to retry, to avoid an unpaired commission.
      try{await e.DB.prepare("DELETE FROM tenant_wallet_ledger WHERE ref_type='order' AND ref_id=? AND kind='sale'").bind(String(order.id)).run()}catch{}
      try{await e.DB.prepare("UPDATE tenant_payment_orders SET status='pending',transaction_id=NULL,paid_at=NULL WHERE id=? AND transaction_id=?").bind(order.id,txId).run()}catch{}
      try{await e.DB.prepare('DELETE FROM sepay_webhook_events WHERE transaction_id=?').bind(txId).run()}catch{}
      return J({success:false,error:'REFERRAL_CREDIT_FAILED'},500);
    }
  }
  try{await tenantLog(e,order.tenant_id,'system','payment_paid',`${order.id}:${code}:${amount}`)}catch{}
  return J({success:true,paid:true,order_id:order.id,kind:'file'});
}

function isoSqlDate(ms=Date.now()){return new Date(ms).toISOString().slice(0,19).replace('T',' ')}
async function refreshTenantPlan(e,t){
  if(!t)return t;const expiry=tenantDateMs(t.expires_at),now=Date.now(),key=await tenantAccountKeyColumn(e);if(!key)return t;
  if(String(t.plan_type||'paid')==='paid'&&Number.isFinite(expiry)&&expiry<=now){
    // Paid rental automatically falls back to Free. The Free admin remains locked until the
    // two server-verified bypass steps are completed; public Share links can remain addressable.
    await e.DB.prepare(`UPDATE tenant_accounts SET plan_type='free',free_bypass_count=0,free_admin_unlocked=0,expires_at=? WHERE ${key}=? AND plan_type='paid'`).bind(isoSqlDate(now),t.id).run();
    const raw=await tenantByIdentifier(e,t.id);return await normalizeTenantRow(e,raw)||{...t,plan_type:'free',free_bypass_count:0,free_admin_unlocked:0,expires_at:isoSqlDate(now)};
  }
  if(String(t.plan_type||'paid')==='free'&&Number(t.free_admin_unlocked)===1&&Number.isFinite(expiry)&&expiry<=now){
    // A Free access period has ended: require both verification steps again before re-entering Admin.
    await e.DB.prepare(`UPDATE tenant_accounts SET free_bypass_count=0,free_admin_unlocked=0,expires_at=? WHERE ${key}=? AND plan_type='free' AND free_admin_unlocked=1`).bind(isoSqlDate(now),t.id).run();
    const raw=await tenantByIdentifier(e,t.id);return await normalizeTenantRow(e,raw)||{...t,free_bypass_count:0,free_admin_unlocked:0,expires_at:isoSqlDate(now)};
  }
  return t;
}
async function startRentalEmailVerification(r,e){
  const rl=limited(r,'rental-email-verify',3,60000);if(rl)return rl;await ensureTenantSchema(e);
  const b=await r.json().catch(()=>({})),email=validEmail(b.email||''),id=tenantSlug(b.id||''),operation=b.operation==='renew'?'renew':'new';if(operation==='new')return J({ok:false,error:'UNIFIED_ACCOUNT_REQUIRED',message:'Đăng ký studio mới cần đăng nhập tài khoản TeoStudio rồi vào Tài khoản → Tạo/thuê website.'},410);
  if(!e.OXMAIL_SMTP_PASS)return J({ok:false,error:'EMAIL_NOT_CONFIGURED',message:'Email xác minh chưa được cấu hình. Vui lòng liên hệ Admin.'},503);
  const proof=await verifyTurnstile(e,b.turnstileToken,r);if(!proof.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy hoàn thành xác minh chống bot trước khi gửi email.'},400);
  if(!email)return J({ok:false,error:'INVALID_EMAIL'},400);
  if(!/^[a-z0-9_-]{2,60}$/.test(id))return J({ok:false,error:'INVALID_TENANT_ID',message:'ID từ 2–60 ký tự, chỉ chữ, số, gạch ngang hoặc gạch dưới.'},400);
  const exists=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE lower(slug)=lower(?) LIMIT 1').bind(id).first();
  if(operation==='new'&&exists){const retryable=Number(exists.locked)===1&&!exists.deleted_at&&String(exists.plan_type||'paid')==='paid'&&String(exists.pending_order_id||'')!==''&&String(exists.email||'').toLowerCase()===email.toLowerCase();if(!retryable)return J({ok:false,error:'TENANT_EXISTS',message:'ID đã được sử dụng; hãy chọn ID khác hoặc đăng nhập/gia hạn tài khoản hiện có.'},409);}
  if(operation==='renew'&&(!exists||String(exists.email||'').toLowerCase()!==email.toLowerCase()))return J({ok:false,error:'RENEW_EMAIL_MISMATCH',message:'ID không tồn tại hoặc email không khớp email tài khoản đã đăng ký.'},400);
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0'),challengeId=crypto.randomUUID(),expires=Date.now()+10*60*1000;
  await e.DB.prepare("UPDATE rental_email_verifications SET used_at=datetime('now') WHERE lower(email)=lower(?) AND used_at IS NULL").bind(email).run();
  await e.DB.prepare("INSERT INTO rental_email_verifications(id,email,code_hash,attempts,expires_at) VALUES(?,?,?,0,?)").bind(challengeId,email,await sha256(code),expires).run();
  const sent=await notifyEmail(e,{to:email,subject:'Mã xác minh email — Téo Studio',text:`Mã xác minh email thuê Share File của bạn là: ${code}\n\nMã hết hạn sau 10 phút và chỉ dùng một lần. Nếu bạn không yêu cầu thư này, hãy bỏ qua.`});
  if(!sent.ok){await e.DB.prepare('DELETE FROM rental_email_verifications WHERE id=?').bind(challengeId).run();return J({ok:false,error:'EMAIL_SEND_FAILED',message:'Không gửi được mã xác minh. Kiểm tra email hoặc liên hệ Admin.'},502)}
  return J({ok:true,challengeId,expiresAt:expires,message:'Đã gửi mã 6 số tới email. Kiểm tra cả thư rác.'},201);
}
async function verifyRentalEmail(r,e){
  const rl=limited(r,'rental-email-verify-code',6,60000);if(rl)return rl;await ensureTenantSchema(e);const b=await r.json().catch(()=>({})),email=validEmail(b.email||''),code=clean(b.code||'',6);
  if(!email||!/^\d{6}$/.test(code))return J({ok:false,error:'INVALID_VERIFICATION_INPUT'},400);
  const challengeId=clean(b.challengeId||'',100);const row=challengeId?await e.DB.prepare('SELECT * FROM rental_email_verifications WHERE id=? AND lower(email)=lower(?) AND used_at IS NULL LIMIT 1').bind(challengeId,email).first():await e.DB.prepare('SELECT * FROM rental_email_verifications WHERE lower(email)=lower(?) AND used_at IS NULL ORDER BY created_at DESC LIMIT 1').bind(email).first();
  if(!row||Number(row.expires_at)<=Date.now())return J({ok:false,error:'VERIFICATION_EXPIRED',message:'Mã đã hết hạn. Hãy gửi mã mới.'},400);
  if(Number(row.attempts)>=5)return J({ok:false,error:'VERIFICATION_ATTEMPTS_EXCEEDED',message:'Đã nhập sai quá nhiều lần. Hãy gửi mã mới.'},429);
  if(String(row.code_hash)!==await sha256(code)){await e.DB.prepare('UPDATE rental_email_verifications SET attempts=attempts+1 WHERE id=?').bind(row.id).run();return J({ok:false,error:'INVALID_VERIFICATION_CODE',message:'Mã xác minh không đúng.'},400)}
  const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare("UPDATE rental_email_verifications SET verified_at=datetime('now'),token_hash=? WHERE id=? AND used_at IS NULL").bind(await sha256(token),row.id).run();
  return J({ok:true,verificationToken:token,expiresAt:row.expires_at,message:'Email đã xác minh. Hoàn tất tạo tài khoản trong 10 phút.'});
}
async function createFreeRentalAccount(r,e){
  const rl=limited(r,'rental-free-create',3,60000);if(rl)return rl;
  return J({ok:false,error:'UNIFIED_ACCOUNT_REQUIRED',message:'Tạo studio Free cần tài khoản TeoStudio. Hãy đăng nhập rồi vào Tài khoản → Tạo/thuê website.'},410);
}

async function startFreeBypass(r,e){
  const rl=limited(r,'free-bypass-start',6,60000);if(rl)return rl;await ensureTenantSchema(e);const b=await r.json().catch(()=>({})),identifier=clean(b.id||'',100),password=String(b.password||'');
  if(!(e.FREE_BYPASS_TEMPLATE_1&&e.FREE_BYPASS_TEMPLATE_2&&e.FREE_BYPASS_VERIFY_URL&&e.FREE_BYPASS_API_KEY))return J({ok:false,error:'FREE_BYPASS_NOT_CONFIGURED',message:'Admin chưa cấu hình API xác minh vượt link; không thể cộng ngày chỉ dựa vào chuyển hướng trình duyệt.'},503);
  let t=await tenantFromSession(r,e);if(t&&identifier&&String(t.slug||'').toLowerCase()!==String(identifier).toLowerCase())t=null;
  if(!t){
    const buyer=await buyerFromRequest(r,e);const ownerRaw=buyer?await tenantBySlug(e,identifier):null;
    if(ownerRaw&&String(ownerRaw.email||'').toLowerCase()===String(buyer.email||'').toLowerCase())t=await normalizeTenantRow(e,ownerRaw);
    else {const raw=await tenantByLogin(e,identifier,password);if(!raw||!(await tenantPasswordMatches(e,await normalizeTenantRow(e,raw),password)))return J({ok:false,error:'INVALID_LOGIN',message:'ID hoặc mật khẩu không đúng.'},401);t=await normalizeTenantRow(e,raw)}
  }
  t=await refreshTenantPlan(e,t);if(String(t.plan_type||'paid')!=='free')return J({ok:false,error:'FREE_PLAN_REQUIRED'},400);if(t.locked||t.deleted_at)return J({ok:false,error:'TENANT_LOCKED'},403);
  const count=Number(t.free_bypass_count||0);if(count>=2&&Number(t.free_admin_unlocked)===1)return J({ok:true,complete:true,count:2,adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`});
  const step=count+1;if(step>2)return J({ok:false,error:'BYPASS_STATE_INVALID'},409);const state=crypto.randomUUID()+crypto.randomUUID(),attemptId=crypto.randomUUID(),expires=Date.now()+20*60*1000;
  await e.DB.prepare("INSERT INTO free_bypass_attempts(id,tenant_id,step,state_hash,expires_at,status) VALUES(?,?,?,?,?,'pending')").bind(attemptId,t.id,step,await sha256(state),expires).run();
  const template=String(step===1?e.FREE_BYPASS_TEMPLATE_1:e.FREE_BYPASS_TEMPLATE_2);const returnUrl=`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}&bypass=${encodeURIComponent(state)}`;
  const redirectUrl=template.replaceAll('{state}',encodeURIComponent(state)).replaceAll('{return_url}',encodeURIComponent(returnUrl)).replaceAll('{step}',String(step));const checked=safeHttpUrl(redirectUrl,4000);if(!checked)return J({ok:false,error:'FREE_BYPASS_TEMPLATE_INVALID'},500);
  return J({ok:true,step,count,attemptId,state,redirectUrl:checked,returnUrl,expiresAt:expires,message:`Bắt đầu bước ${step}/2. Sau khi hoàn tất, quay lại trang này để xác minh.`},201);
}
async function completeFreeBypass(r,e){
  const rl=limited(r,'free-bypass-complete',10,60000);if(rl)return rl;await ensureTenantSchema(e);const b=await r.json().catch(()=>({})),state=clean(b.state||'',200);if(!state)return J({ok:false,error:'BYPASS_STATE_REQUIRED'},400);
  if(!(e.FREE_BYPASS_VERIFY_URL&&e.FREE_BYPASS_API_KEY))return J({ok:false,error:'FREE_BYPASS_NOT_CONFIGURED'},503);
  const hash=await sha256(state),attempt=await e.DB.prepare("SELECT * FROM free_bypass_attempts WHERE state_hash=? AND status='pending' AND expires_at>? LIMIT 1").bind(hash,Date.now()).first();if(!attempt)return J({ok:false,error:'BYPASS_STATE_EXPIRED_OR_USED',message:'Phiên vượt link hết hạn hoặc đã dùng. Hãy bắt đầu lại.'},400);
  let verifyUrl;try{verifyUrl=new URL(String(e.FREE_BYPASS_VERIFY_URL));verifyUrl.searchParams.set('state',state);verifyUrl.searchParams.set('step',String(attempt.step));}catch{return J({ok:false,error:'FREE_BYPASS_VERIFY_URL_INVALID'},500)}
  let verified=false;try{const resp=await fetch(verifyUrl.toString(),{headers:{authorization:'Bearer '+String(e.FREE_BYPASS_API_KEY),'x-teo-bypass-state':state,'accept':'application/json'},redirect:'error',signal:AbortSignal.timeout(8000)});const data=await resp.json();verified=resp.ok&&data?.success===true&&data?.completed===true&&String(data?.state||'')===state;}catch{}
  if(!verified)return J({ok:false,error:'BYPASS_NOT_VERIFIED',message:'API nhà cung cấp chưa xác nhận lượt vượt. Không cộng ngày; hãy thử lại hoặc liên hệ Admin.'},400);
  const raw=await tenantByIdentifier(e,attempt.tenant_id);if(!raw)return J({ok:false,error:'TENANT_NOT_FOUND'},404);const t=await normalizeTenantRow(e,raw);if(String(t.plan_type||'paid')!=='free')return J({ok:false,error:'FREE_PLAN_REQUIRED'},409);
  const count=Number(t.free_bypass_count||0);if(Number(attempt.step)!==count+1)return J({ok:false,error:'BYPASS_STEP_MISMATCH',message:'Lượt này không còn đúng thứ tự. Hãy bắt đầu bước hiện tại từ Admin Free.'},409);
  const expiry=tenantDateMs(t.expires_at),base=Math.max(Date.now(),Number.isFinite(expiry)?expiry:Date.now()),newExpiry=base+2*86400000,key=await tenantAccountKeyColumn(e);if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
  const done=await e.DB.prepare(`UPDATE free_bypass_attempts SET status='verified',verified_at=datetime('now') WHERE id=? AND status='pending'`).bind(attempt.id).run();if(!done?.meta?.changes)return J({ok:false,error:'BYPASS_ALREADY_USED'},409);
  await e.DB.prepare(`UPDATE tenant_accounts SET free_bypass_count=?,free_admin_unlocked=?,expires_at=?,starts_at=COALESCE(starts_at,?) WHERE ${key}=?`).bind(count+1,count+1>=2?1:0,isoSqlDate(newExpiry),isoSqlDate(Date.now()),t.id).run();
  const next=count+1>=2,adminUrl=`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`;try{await tenantLog(e,t.id,'system','free_bypass_verified',`step=${attempt.step}; count=${count+1}`)}catch{};
  return J({ok:true,step:Number(attempt.step),count:count+1,complete:next,expiresAt:isoSqlDate(newExpiry),adminUrl,message:next?'Đã xác minh đủ 2/2 lần. Admin Free được mở và cộng tổng cộng 4 ngày.':'Đã xác minh 1/2 lần, cộng 2 ngày. Tiếp tục vượt link lần 2.'});
}

async function handleRentalOrderCreate(r,e){
  const rl=limited(r,'rental-order-create',4,60000);if(rl)return rl;
  await ensureTenantSchema(e);
  const b=await r.json().catch(()=>({}));
  const proof=await verifyTurnstile(e,b.turnstileToken,r);if(!proof.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Xác minh chống bot chưa thành công. Hãy thử lại.'},400);
  const cfg=paymentConfig(e);
  if(!cfg.paymentsEnabled)return J({ok:false,error:'PAYMENT_NOT_CONFIGURED',missing:cfg.missing,message:`Chưa bật thanh toán. Cần cấu hình: ${cfg.missing.join(', ')} trong Cloudflare Worker Secrets/Variables.`},503);
  const rawId=clean(b.id||b.tenant||'',60),slug=tenantSlug(rawId),password=String(b.password||''),email=validEmail(b.email||''),operation=b.operation==='renew'?'renew':'new';
  if(operation==='new')return J({ok:false,error:'UNIFIED_ACCOUNT_REQUIRED',message:'Tạo studio mới cần tài khoản TeoStudio. Hãy đăng nhập rồi vào Tài khoản → Tạo/thuê website.'},410);
  if(!/^[a-z0-9_-]{2,60}$/.test(slug))return J({ok:false,error:'INVALID_TENANT_ID',message:'ID chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới; dài 2–60 ký tự.'},400);
  if(password.length<8||password.length>128)return J({ok:false,error:'PASSWORD_POLICY',message:'Mật khẩu cần từ 8 đến 128 ký tự.'},400);
  if(!email)return J({ok:false,error:'EMAIL_REQUIRED',message:'Vui lòng nhập email hợp lệ.'},400);
  const emailProof=String(b.verificationToken||'');if(!emailProof)return J({ok:false,error:'EMAIL_VERIFICATION_REQUIRED',message:'Hãy xác minh email trước khi tạo đơn thuê hoặc gia hạn.'},400);
  const verifiedEmail=await e.DB.prepare('SELECT * FROM rental_email_verifications WHERE lower(email)=lower(?) AND token_hash=? AND verified_at IS NOT NULL AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 1').bind(email,await sha256(emailProof),Date.now()).first();
  if(!verifiedEmail)return J({ok:false,error:'EMAIL_VERIFICATION_INVALID',message:'Mã xác minh email không hợp lệ hoặc hết hạn. Hãy xác minh lại.'},400);
  const key=await tenantAccountKeyColumn(e);if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
  let tenantId='',account=null,hash=await sha256(password);
  if(operation==='new'){
    const prior=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE lower(slug)=lower(?) LIMIT 1').bind(slug).first();
    if(prior){
      const normalized=await normalizeTenantRow(e,prior);
      const retryable=Number(prior.locked)===1&&!prior.deleted_at&&String(prior.plan_type||'paid')==='paid'&&String(prior.email||'').toLowerCase()===email.toLowerCase()&&String(prior.pending_order_id||'')!==''&&await tenantPasswordMatches(e,normalized,password);
      if(!retryable)return J({ok:false,error:'TENANT_EXISTS',message:prior.deleted_at?'ID này đã được lưu trữ để giữ lịch sử tài chính, không thể tái sử dụng. Hãy chọn ID khác.':'ID này đã được sử dụng. Hãy đăng nhập hoặc chọn một ID khác.'},409);
      const tenantId=String(normalized.id),pending=await e.DB.prepare("SELECT * FROM tenant_rental_orders WHERE id=? AND tenant_id=? AND operation='new' AND status='pending' LIMIT 1").bind(String(prior.pending_order_id),tenantId).first();
      if(pending&&Number(pending.expires_at)>Date.now()){
        await e.DB.prepare("UPDATE rental_email_verifications SET used_at=datetime('now') WHERE id=? AND used_at IS NULL").bind(verifiedEmail.id).run();
        return J({ok:true,order:{id:pending.id,code:pending.payment_code,amount:Number(pending.amount_vnd),status:'pending',expiresAt:pending.expires_at,qrUrl:buildVietQr(e,pending.amount_vnd,pending.payment_code),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}`,tenantId:slug,operation:'new'},message:'Đơn đang còn hiệu lực; dùng QR và nội dung chuyển khoản cũ. Không chuyển tiền lần hai.'});
      }
      if(pending)await e.DB.prepare("UPDATE tenant_rental_orders SET status='expired' WHERE id=? AND status='pending'").bind(pending.id).run();
      const referrer=String(normalized.referrer_tenant_id||''),orderId=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=Date.now()+20*60*1000;
      try{await e.DB.batch([
        e.DB.prepare("INSERT INTO tenant_rental_orders(id,tenant_id,payment_code,amount_vnd,days,operation,referrer_tenant_id,status,expires_at) VALUES(?,?,?,?,30,'new',?,'pending',?)").bind(orderId,tenantId,code,50000,referrer||null,expires),
        e.DB.prepare(`UPDATE tenant_accounts SET pending_order_id=? WHERE ${key}=? AND locked=1 AND deleted_at IS NULL`).bind(orderId,tenantId),
        e.DB.prepare("UPDATE rental_email_verifications SET used_at=datetime('now') WHERE id=? AND used_at IS NULL").bind(verifiedEmail.id)
      ])}catch{return J({ok:false,error:'RENTAL_ORDER_RETRY_FAILED',message:'Không tạo lại được đơn. Liên hệ Admin và không chuyển tiền vào QR cũ.'},500)}
      return J({ok:true,order:{id:orderId,code,amount:50000,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,50000,code),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}`,tenantId:slug,operation:'new'},message:'Đã tạo QR mới cho tài khoản đang chờ thanh toán. Chỉ chuyển tiền theo QR hiện tại.'},201);
    }
    const refSlug=tenantSlug(b.ref||b.referrer||''),refRaw=refSlug?await tenantBySlug(e,refSlug):null,ref=refRaw?await normalizeTenantRow(e,refRaw):null;
    const referrer=ref&&ref.status!=='deleted'&&String(ref.slug||'').toLowerCase()!==slug?String(ref.id):'';
    const id='t-'+slug+'-'+crypto.randomUUID().slice(0,8),orderId=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),now=Date.now(),expires=now+20*60*1000;
    const st=new Date().toISOString().slice(0,19).replace('T',' '),expiresText=st;
    const names=new Set(((await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[]).map(x=>x.name));
    const cols=[],vals=[];
    const add=(name,value)=>{if(names.has(name)){cols.push(name);vals.push(value)}};
    add(key,id);if(names.has('id')&&key!=='id')add('id',id);if(names.has('tenant_id')&&key!=='tenant_id')add('tenant_id',id);
    add('slug',slug);add('password_hash',hash);add('created_at',st);add('starts_at',st);add('expires_at',expiresText);add('locked',1);add('email',email);add('plan_type','paid');add('referrer_tenant_id',referrer||null);add('pending_order_id',orderId);add('deleted_at',null);
    const placeholders=cols.map(()=>'?').join(',');
    try{
      await e.DB.batch([
        e.DB.prepare(`INSERT INTO tenant_accounts(${cols.join(',')}) VALUES(${placeholders})`).bind(...vals),
        e.DB.prepare("INSERT INTO tenant_rental_orders(id,tenant_id,payment_code,amount_vnd,days,operation,referrer_tenant_id,status,expires_at) VALUES(?,?,?,?,30,'new',?,'pending',?)").bind(orderId,id,code,50000,referrer||null,expires),
        e.DB.prepare("UPDATE rental_email_verifications SET used_at=datetime('now') WHERE id=? AND used_at IS NULL").bind(verifiedEmail.id)
      ]);
    }catch(err){return J({ok:false,error:'RENTAL_ORDER_CREATE_FAILED',message:'Không tạo được đơn thuê. Kiểm tra ID/email và thử lại.'},500)}
    tenantId=id;account={id,slug,email,referrer_tenant_id:referrer,plan_type:'paid'};
    return J({ok:true,order:{id:orderId,code,amount:50000,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,50000,code),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}`,tenantId:slug,operation:'new'},message:'Quét QR và chuyển đúng 50.000đ, nội dung chuyển khoản phải giữ nguyên. Tài khoản sẽ mở sau khi SePay xác nhận.'},201);
  }
  const match=await tenantByLogin(e,rawId,password);
  if(!match||!(await tenantPasswordMatches(e,await normalizeTenantRow(e,match),password)))return J({ok:false,error:'INVALID_LOGIN',message:'ID hoặc mật khẩu không đúng.'},401);
  account=await normalizeTenantRow(e,match);if(account.deleted_at||account.locked)return J({ok:false,error:'TENANT_LOCKED',message:'Tài khoản đã bị khóa hoặc xóa, không thể gia hạn tự động.'},403);if(String(account.email||'').toLowerCase()!==email.toLowerCase())return J({ok:false,error:'RENEW_EMAIL_MISMATCH',message:'Email phải trùng email đã xác minh của tài khoản thuê.'},400);
  tenantId=String(account.id);const referrer=String(account.referrer_tenant_id||'');
  const prior=await e.DB.prepare("SELECT id,payment_code,amount_vnd,status,expires_at FROM tenant_rental_orders WHERE tenant_id=? AND operation='renew' AND status='pending' AND expires_at>? ORDER BY created_at DESC LIMIT 1").bind(tenantId,Date.now()).first();
  if(prior)return J({ok:true,order:{...prior,code:prior.payment_code,amount:prior.amount_vnd,qrUrl:buildVietQr(e,prior.amount_vnd,prior.payment_code),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(account.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(account.slug)}`,tenantId:account.slug,operation:'renew'}});
  const orderId=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=Date.now()+20*60*1000;
  await e.DB.batch([e.DB.prepare("INSERT INTO tenant_rental_orders(id,tenant_id,payment_code,amount_vnd,days,operation,referrer_tenant_id,status,expires_at) VALUES(?,?,?,?,30,'renew',?,'pending',?)").bind(orderId,tenantId,code,50000,referrer||null,expires),e.DB.prepare("UPDATE rental_email_verifications SET used_at=datetime('now') WHERE id=? AND used_at IS NULL").bind(verifiedEmail.id)]);
  return J({ok:true,order:{id:orderId,code,amount:50000,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,50000,code),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(account.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(account.slug)}`,tenantId:account.slug,operation:'renew'},message:'Quét QR, chuyển đúng 50.000đ và giữ nguyên nội dung chuyển khoản. Hạn thuê được cộng dồn sau khi SePay xác nhận.'},201);
}
async function handleRentalOrderStatus(r,e,id){
  await ensureTenantSchema(e);const order=await e.DB.prepare('SELECT * FROM tenant_rental_orders WHERE id=?').bind(clean(id,100)).first();if(!order)return J({ok:false,error:'ORDER_NOT_FOUND'},404);
  if(order.status==='pending'&&Number(order.expires_at)<=Date.now()){
    await e.DB.prepare("UPDATE tenant_rental_orders SET status='expired' WHERE id=? AND status='pending'").bind(order.id).run();
    if(order.operation==='new')try{await e.DB.prepare("UPDATE tenant_accounts SET locked=1,deleted_at=datetime('now') WHERE pending_order_id=? AND locked=1").bind(order.id).run()}catch{}
    order.status='expired';
  }
  let links=null;if(order.status==='paid'){const row=await tenantByIdentifier(e,order.tenant_id);if(row){const t=await normalizeTenantRow(e,row);links={tenantId:t.slug,adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(t.slug)}`,expiresAt:t.expires_at,planType:t.plan_type||'paid'}}}
  return J({ok:true,order:{id:order.id,amount:Number(order.amount_vnd),status:order.status,expiresAt:order.expires_at,paidAt:order.paid_at,operation:order.operation,links}});
}
async function handleTenantPublic(r,e){
  await ensureTenantSchema(e);
  const u=new URL(r.url),parts=u.pathname.split('/').filter(Boolean);
  const slug=clean(parts[2]||'',80),rawTenant=await tenantBySlug(e,slug);let t=await normalizeTenantRow(e,rawTenant);t=await refreshTenantPlan(e,t);
  if(!t||tenantStatus(t)==='deleted'||(tenantStatus(t)==='expired'&&String(t.plan_type||'paid')!=='free'))return J({ok:false,error:'TENANT_NOT_FOUND'},404);
  if(tenantStatus(t)==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
  if(r.method==='GET'&&parts.length===3){await tenantBump(e,t,'visit','',r,u.searchParams.get('source')||'');let layout=[];try{await ensureV55Schema(e);const ll=await e.DB.prepare('SELECT layout_json FROM tenant_site_layouts WHERE tenant_id=?').bind(String(t.id)).first();layout=JSON.parse(ll?.layout_json||'[]')}catch{}return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t),tags:await tenantTags(e,t),products:await tenantProducts(e,t),layout})}
  if(parts[3]==='recent-sales'&&r.method==='GET'){await ensureV55Schema(e);const rows=(await e.DB.prepare("SELECT p.title,p.amount_vnd,p.created_at,a.display_name,a.email FROM buyer_purchases p LEFT JOIN buyer_accounts a ON a.id=p.buyer_id WHERE p.tenant_id=? AND p.scope='tenant' AND p.status='paid' ORDER BY p.created_at DESC LIMIT 12").bind(String(t.id)).all()).results||[];return J({ok:true,sales:rows.map(x=>({title:clean(x.title,100),amountVnd:Number(x.amount_vnd||0),createdAt:x.created_at,name:clean(x.display_name||'Khách',60),emailMasked:maskEmail(x.email)}))})}
  if(parts[3]==='product'&&parts[4]&&r.method==='GET'){
    const id=decodeURIComponent(parts[4]);
    const pk=tenantInSql(t);const p=await e.DB.prepare(`SELECT * FROM tenant_products WHERE ${pk.clause} AND id=? AND visible=1 ORDER BY updated_at DESC LIMIT 1`).bind(...pk.vals,id).first();
    if(!p)return J({ok:false,error:'NOT_FOUND'},404);
    await tenantBump(e,t,'product',id,r);
    const mode=['free','unlock','paid','both'].includes(String(p.product_mode||''))?String(p.product_mode):(Number(p.sale_enabled)===1?'paid':'free');
    const paid=['paid','both'].includes(mode)&&Number(p.price_vnd)>0;
    const pub={...p,download_link:safeHttpUrl(p.download_link,10000),original_link:safeHttpUrl(p.original_link,10000),thumb:p.thumb?safeImageValue(p.thumb,1500000):'',product_mode:mode,price_vnd:Number(p.price_vnd)||0,sale_enabled:paid?1:0};
    // Never disclose a paid original URL before the order is paid. In `both`, only the bypass URL is public.
    if(mode==='paid'){delete pub.download_link;delete pub.original_link;}
    else if(mode==='both'){delete pub.original_link;}
    else if(mode==='unlock'){delete pub.original_link;}
    else {pub.download_link=p.original_link||p.download_link;delete pub.original_link;}
    return J({ok:true,product:pub,tenant:tenantInfo(t),settings:await tenantSettings(e,t)});
  }
  if(parts[3]==='track-outbound'&&parts[4]&&r.method==='POST'){
    const rl=limited(r,'tenant-outbound-click',30,60000);if(rl)return rl;
    const id=decodeURIComponent(parts[4]),pk=tenantInSql(t),product=await e.DB.prepare(`SELECT id FROM tenant_products WHERE ${pk.clause} AND id=? AND visible=1 LIMIT 1`).bind(...pk.vals,id).first();
    if(!product)return J({ok:false,error:'PRODUCT_NOT_FOUND'},404);
    await tenantBump(e,t,'outbound',id,r,u.searchParams.get('source')||'');return J({ok:true});
  }
  if(parts[3]==='orders'&&parts[4]==='create'&&r.method==='POST'){
    return J({ok:false,error:'WALLET_PURCHASE_REQUIRED',message:'Đăng nhập tài khoản và dùng số dư ví để mua file.'},410);
    const rl=limited(r,'tenant-file-order',4,60000);if(rl)return rl;
    const b=await r.json().catch(()=>({})),productId=clean(b.product_id,100);const k=tenantInSql(t);
    const proof=await verifyTurnstile(e,b.turnstileToken,r);if(!proof.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Xác minh chống bot chưa thành công. Hãy thử lại.'},400);
    const prod=await e.DB.prepare(`SELECT id,title,price_vnd,sale_enabled,visible,product_mode FROM tenant_products WHERE ${k.clause} AND id=? AND visible=1 LIMIT 1`).bind(...k.vals,productId).first();
    if(!prod)return J({ok:false,error:'PRODUCT_NOT_FOUND'},404);
    const amount=Math.floor(Number(prod.price_vnd)||0);if(Number(prod.sale_enabled)!==1||amount<1000||!['paid','both'].includes(String(prod.product_mode||'paid')))return J({ok:false,error:'PRODUCT_NOT_FOR_SALE'},400);
    const cfg=paymentConfig(e);if(!cfg.paymentsEnabled)return J({ok:false,error:'PAYMENT_NOT_CONFIGURED',missing:cfg.missing,message:`Chưa thể thanh toán. Worker còn thiếu: ${cfg.missing.join(', ')}.`},503);
    const now=Date.now();
    const refSlug=tenantSlug(b.referrer||b.ref||''),refRaw=refSlug?await tenantBySlug(e,refSlug):null,ref=refRaw?await normalizeTenantRow(e,refRaw):null;
    const referrer=ref&&String(ref.id)!==String(t.id)&&ref.status!=='deleted'?String(ref.id):'';
    const id=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=now+10*60*1000;
    await e.DB.prepare("INSERT INTO tenant_payment_orders(id,tenant_id,product_id,payment_code,amount_vnd,status,buyer_ref,expires_at) VALUES(?,?,?,?,?,'pending',?,?)").bind(id,t.id,productId,code,amount,referrer,expires).run();
    return J({ok:true,order:{id,code,amount,status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,amount,code)}},201)
  }
  if(parts[3]==='orders'&&parts[4]&&r.method==='GET'){
    const order=await e.DB.prepare('SELECT id,tenant_id,product_id,payment_code,amount_vnd,status,expires_at,paid_at FROM tenant_payment_orders WHERE id=? AND tenant_id=?').bind(clean(parts[4],100),t.id).first();
    if(!order)return J({ok:false,error:'ORDER_NOT_FOUND'},404);
    if(order.status==='pending'&&Number(order.expires_at)<=Date.now()){await e.DB.prepare("UPDATE tenant_payment_orders SET status='expired' WHERE id=? AND status='pending'").bind(order.id).run();order.status='expired'}
    return J({ok:true,order:{id:order.id,code:order.payment_code,amount:order.amount_vnd,status:order.status,expiresAt:order.expires_at,paidAt:order.paid_at,downloadUrl:null,legacy:true,message:'Đơn trực tiếp cũ không trả link gốc qua API công khai.'}})
  }
  if(parts[3]==='comments'&&r.method==='GET'){const ck=tenantInSql(t);const rows=(await e.DB.prepare(`SELECT id,name,text,image,created_at FROM tenant_comments WHERE ${ck.clause} AND visible=1 ORDER BY created_at DESC LIMIT 50`).bind(...ck.vals).all()).results||[];return J({ok:true,comments:rows.map(x=>({...x,image:x.image?safeImageValue(x.image,450000):''}))});}
  if(parts[3]==='comments'&&r.method==='POST'){
    const rl=commentRateResponse(r);if(rl)return rl;const buyer=await buyerFromRequest(r,e);if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED',message:'Đăng nhập tài khoản TeoStudio để bình luận.'},401);if(Number(buyer.email_verified)!==1)return J({ok:false,error:'EMAIL_VERIFICATION_REQUIRED',message:'Hãy xác minh email trước khi bình luận.'},403);
    try{const b=await r.json().catch(()=>({})),cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi bình luận.'},400);const text=clean(b.text,700),image=b.image?safeCommentImage(b.image):'';if(b.image&&!image)return J({ok:false,error:'INVALID_COMMENT_IMAGE',message:'Ảnh không hợp lệ hoặc quá lớn. Chỉ nhận ảnh JPEG/PNG/WebP đã nén.'},400);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);
      const id=crypto.randomUUID(),eventId=crypto.randomUUID(),ip=clientIp(r)||'unknown',email=String(buyer.email_normalized||buyer.email).toLowerCase(),visible=image?0:1,withImage=image?1:0;
      await e.DB.batch([
        e.DB.prepare(`INSERT INTO comment_rate_events(id,buyer_id,client_ip,has_image) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND created_at>=datetime('now','-60 seconds'))<2 AND (SELECT COUNT(*) FROM comment_rate_events WHERE client_ip=? AND created_at>=datetime('now','-60 seconds'))<5 AND (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND created_at>=datetime('now','+7 hours','start of day','-7 hours'))<10 AND (?=0 OR (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND has_image=1 AND created_at>=datetime('now','+7 hours','start of day','-7 hours'))<5)`).bind(eventId,buyer.id,ip,withImage,buyer.id,ip,buyer.id,withImage,buyer.id),
        e.DB.prepare(`INSERT INTO tenant_comments(id,tenant_id,name,text,image,visible,buyer_id,email_normalized,client_ip) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM comment_rate_events WHERE id=?)`).bind(id,t.id,clean(buyer.display_name,80),text,image,visible,buyer.id,email,ip,eventId)
      ]);
      const ev=await e.DB.prepare('SELECT id FROM comment_rate_events WHERE id=?').bind(eventId).first();if(!ev)return J({ok:false,error:'COMMENT_RATE_LIMITED',message:'Giới hạn 2 bình luận/phút, 10 bình luận/ngày và tối đa 5 ảnh/ngày.'},429);const saved=await e.DB.prepare('SELECT id FROM tenant_comments WHERE id=?').bind(id).first();if(!saved)return J({ok:false,error:'COMMENT_SAVE_FAILED'},500);return J({ok:true,id,requiresModeration:!!image,message:image?'Đã nhận bình luận; ảnh đang chờ chủ studio/Admin duyệt trước khi công khai.':'Đã đăng bình luận.'},201)
    }catch{return J({ok:false,error:'TENANT_COMMENT_DB_ERROR',message:'Chưa lưu được bình luận. Hãy thử lại sau.'},500)}
  }
  return J({ok:false,error:'NOT_FOUND'},404)
}
async function handleTenantAdmin(r,e){
  await ensureTenantSchema(e);
  let t=await tenantFromSession(r,e);
  if(!t)return J({ok:false,error:'TENANT_REQUIRED'},401);
  t=await refreshTenantPlan(e,t);
  const status=tenantStatus(t);
  if(status==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
  if(status==='expired'&&!(String(t.plan_type||'paid')==='free'&&Number(t.free_admin_unlocked)!==1))return J({ok:false,error:'TENANT_EXPIRED'},403);
  const u=new URL(r.url),p=u.pathname;
  if(String(t.plan_type||'paid')==='free'&&Number(t.free_admin_unlocked)!==1){return J({ok:false,error:'FREE_BYPASS_REQUIRED',message:'Gói Free cần hoàn thành 2 lần vượt link được máy chủ xác minh để mở Admin.',tenant:tenantInfo(t),bypassConfigured:!!(e.FREE_BYPASS_TEMPLATE_1&&e.FREE_BYPASS_TEMPLATE_2&&e.FREE_BYPASS_VERIFY_URL&&e.FREE_BYPASS_API_KEY)},403)}
  if(String(t.plan_type||'paid')==='free'&&(/^\/api\/tenant\/(wallet|payout-profile|withdrawals)(?:\/|$)/.test(p)||p.includes('/orders/'))){return J({ok:false,error:'VIP_REQUIRED',message:'Tính năng kiếm tiền, bán file và rút tiền chỉ có ở gói VIP.'},403)}
  if(p==='/api/tenant/notifications'&&r.method==='GET'){
    const notifications=await notificationList(e,'tenant',t.id);
    return J({ok:true,notifications,unread:notifications.filter(x=>!x.read_at).length});
  }
  if(p==='/api/tenant/notifications/read'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));await ensureNotificationsSchema(e);
    if(b.all===true)await e.DB.prepare("UPDATE web_notifications SET read_at=datetime('now') WHERE recipient_type='tenant' AND recipient_id=? AND read_at IS NULL").bind(String(t.id)).run();
    else if(b.id)await e.DB.prepare("UPDATE web_notifications SET read_at=datetime('now') WHERE id=? AND recipient_type='tenant' AND recipient_id=? AND read_at IS NULL").bind(clean(b.id,100),String(t.id)).run();
    return J({ok:true});
  }
  if(p==='/api/tenant/builder'&&r.method==='GET'){
    await ensureV55Schema(e);const row=await e.DB.prepare('SELECT layout_json,updated_at FROM tenant_site_layouts WHERE tenant_id=?').bind(String(t.id)).first();let blocks=[];try{blocks=JSON.parse(row?.layout_json||'[]')}catch{}return J({ok:true,layout:blocks,updatedAt:row?.updated_at||null,tenant:{id:t.id,slug:t.slug,planType:t.plan_type}});
  }
  if(p==='/api/tenant/builder'&&r.method==='PUT'){
    await ensureV55Schema(e);if(String(t.plan_type||'free')==='free')return J({ok:false,error:'VIP_REQUIRED',message:'Trình thiết kế website nâng cao dành cho gói trả phí.'},403);const b=await r.json().catch(()=>({}));let layout;try{layout=safeBuilderLayout(b.layout)}catch(err){return J({ok:false,error:String(err.message||err)},400)}
    await e.DB.prepare("INSERT INTO tenant_site_layouts(tenant_id,layout_json,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(tenant_id) DO UPDATE SET layout_json=excluded.layout_json,updated_at=datetime('now')").bind(String(t.id),JSON.stringify(layout)).run();await tenantLog(e,t.id,'owner','builder_saved',`${layout.length} blocks`);return J({ok:true,layout,updatedAt:isoSqlDate()});
  }
  if(p==='/api/tenant/me')return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t)});
  if(p==='/api/tenant/products'&&r.method==='GET')return J({ok:true,products:await tenantProducts(e,t,true)});
  if(p==='/api/tenant/products'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));
    if(!clean(b.title,200))return J({ok:false,error:'title_required'},400);
    const mode=['free','unlock','paid','both'].includes(String(b.product_mode))?String(b.product_mode):'free';
    if(String(t.plan_type||'paid')==='free'&&['paid','both'].includes(mode))return J({ok:false,error:'VIP_REQUIRED',message:'Gói Free chỉ được chia sẻ file miễn phí. Nâng VIP để bật bán file.'},403);
    const downloadLink=safeHttpUrl(b.download_link,10000),originalLink=safeHttpUrl(b.original_link,10000);
    if(!downloadLink)return J({ok:false,error:'INVALID_DOWNLOAD_URL',message:'Link lấy file phải là URL http:// hoặc https:// hợp lệ.'},400);
    if(mode==='both'&&!originalLink)return J({ok:false,error:'INVALID_ORIGINAL_URL',message:'Chế độ miễn phí hoặc mua cần link gốc http(s) riêng.'},400);
    const price=Math.max(0,Math.min(100000000,Math.floor(Number(b.price_vnd)||0)));
    if(['paid','both'].includes(mode)&&price<1000)return J({ok:false,error:'PRICE_TOO_LOW',message:'Giá file trả phí tối thiểu là 1.000đ.'},400);
    const sale=['paid','both'].includes(mode)&&price>0?1:0;
    const thumb=safeImageValue(b.thumb,1500000);if(b.thumb&&!thumb)return J({ok:false,error:'INVALID_THUMB_URL'},400);
    const id=crypto.randomUUID();
    await e.DB.prepare('INSERT INTO tenant_products(id,tenant_id,title,game,description,thumb,download_link,warning,visible,price_vnd,sale_enabled,product_mode,original_link) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?)').bind(id,t.id,clean(b.title,200),clean(b.game,100),clean(b.description),thumb,downloadLink,clean(b.warning),price,sale,mode,mode==='both'?originalLink:'').run();
    await tenantLog(e,t.id,t.id,'product_create',id);
    return J({ok:true,id},201)
  }
  let m=p.match(/^\/api\/tenant\/products\/([^/]+)$/);
  if(m){
    const id=decodeURIComponent(m[1]);
    if(r.method==='DELETE'){{const k=tenantInSql(t);await e.DB.prepare(`DELETE FROM tenant_products WHERE ${k.clause} AND id=?`).bind(...k.vals,id).run()};await tenantLog(e,t.id,t.id,'product_delete',id);return J({ok:true})}
    if(r.method==='PUT'){
      const b=await r.json().catch(()=>({}));
      if(Object.keys(b).length===1&&typeof b.visible==='boolean'){await e.DB.prepare('UPDATE tenant_products SET visible=?,updated_at=datetime(\'now\') WHERE tenant_id=? AND id=?').bind(b.visible?1:0,t.id,id).run();await tenantLog(e,t.id,t.id,b.visible?'product_show':'product_hide',id);return J({ok:true,visible:b.visible})}
      if(!clean(b.title,200))return J({ok:false,error:'title_required'},400);
      const mode=['free','unlock','paid','both'].includes(String(b.product_mode))?String(b.product_mode):'free';
      if(String(t.plan_type||'paid')==='free'&&['paid','both'].includes(mode))return J({ok:false,error:'VIP_REQUIRED',message:'Gói Free chỉ được chia sẻ file miễn phí. Nâng VIP để bật bán file.'},403);
      const downloadLink=safeHttpUrl(b.download_link,10000),originalLink=safeHttpUrl(b.original_link,10000);
      if(!downloadLink)return J({ok:false,error:'INVALID_DOWNLOAD_URL',message:'Link lấy file phải là URL http:// hoặc https:// hợp lệ.'},400);
      if(mode==='both'&&!originalLink)return J({ok:false,error:'INVALID_ORIGINAL_URL',message:'Chế độ miễn phí hoặc mua cần link gốc http(s) riêng.'},400);
      const price=Math.max(0,Math.min(100000000,Math.floor(Number(b.price_vnd)||0)));
      if(['paid','both'].includes(mode)&&price<1000)return J({ok:false,error:'PRICE_TOO_LOW',message:'Giá file trả phí tối thiểu là 1.000đ.'},400);
      const sale=['paid','both'].includes(mode)&&price>0?1:0;
      const thumb=safeImageValue(b.thumb,1500000);if(b.thumb&&!thumb)return J({ok:false,error:'INVALID_THUMB_URL'},400);
      await e.DB.prepare('UPDATE tenant_products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,visible=?,price_vnd=?,sale_enabled=?,product_mode=?,original_link=?,updated_at=datetime(\'now\') WHERE tenant_id=? AND id=?').bind(clean(b.title,200),clean(b.game,100),clean(b.description),thumb,downloadLink,clean(b.warning),b.visible===false?0:1,price,sale,mode,mode==='both'?originalLink:'',t.id,id).run();
      return J({ok:true})
    }
  }
  if(p==='/api/tenant/tags'&&r.method==='GET')return J({ok:true,tags:await tenantTags(e,t)});
  if(p==='/api/tenant/tags'&&r.method==='POST'){const b=await r.json().catch(()=>({})),name=clean(b.name,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_tags(id,tenant_id,name,parent_id) VALUES(?,?,?,?)').bind(id,t.id,name,clean(b.parent_id,100)||null).run();return J({ok:true,id},201)}
  let tg=p.match(/^\/api\/tenant\/tags\/([^/]+)$/);
  if(tg&&r.method==='DELETE'){{const k=tenantInSql(t);await e.DB.prepare(`DELETE FROM tenant_tags WHERE ${k.clause} AND (id=? OR parent_id=?)`).bind(...k.vals,tg[1],tg[1]).run()};return J({ok:true})}
  if(p==='/api/tenant/comments'&&r.method==='GET')return J({ok:true,comments:await tenantComments(e,t,true)});
  let tc=p.match(/^\/api\/tenant\/comments\/([^/]+)$/);
  if(tc){const id=decodeURIComponent(tc[1]);if(r.method==='DELETE'){{const k=tenantInSql(t);await e.DB.prepare(`DELETE FROM tenant_comments WHERE ${k.clause} AND id=?`).bind(...k.vals,id).run()};return J({ok:true})}if(r.method==='PUT'){const b=await r.json().catch(()=>({}));if(typeof b.visible!=='boolean')return J({ok:false,error:'VISIBLE_REQUIRED'},400);{const k=tenantInSql(t);await e.DB.prepare(`UPDATE tenant_comments SET visible=? WHERE ${k.clause} AND id=?`).bind(b.visible?1:0,...k.vals,id).run()};await tenantLog(e,t.id,t.id,b.visible?'comment_show':'comment_hide',id);return J({ok:true,visible:b.visible})}}
  if(p==='/api/tenant/settings'&&r.method==='GET')return J({ok:true,settings:await tenantSettings(e,t)});
  if(p==='/api/tenant/settings'&&r.method==='PUT'){const b=await r.json().catch(()=>({}));const keys=tenantKeyValues(t);for(const [k,v0] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','heroBackground','avatarVideoUrl','groupLink','adminContact','announcementEnabled','announcementTitle','announcementText','donateTitle','donateText','donateQr','adText','adLink','socialTikTokUrl','socialYoutubeUrl','socialTikTokMeta','socialYoutubeMeta','themeConfig'].includes(k))continue;let v=v0;if(['groupLink','adminContact','avatarVideoUrl','adLink','socialTikTokUrl','socialYoutubeUrl'].includes(k)){v=safeOptionalLink(v0,4000);if(v0&&v0!=='#'&&!v)return J({ok:false,error:'INVALID_SETTING_URL',field:k,message:'Liên kết phải bắt đầu bằng http:// hoặc https://.'},400)}if(['avatar','donateQr'].includes(k)&&v0){v=safeImageValue(v0,1500000);if(!v)return J({ok:false,error:'INVALID_IMAGE',field:k},400)}for(const tid of keys){await e.DB.prepare('INSERT INTO tenant_settings(tenant_id,key,value) VALUES(?,?,?) ON CONFLICT(tenant_id,key) DO UPDATE SET value=excluded.value').bind(tid,k,JSON.stringify(v)).run()}}return J({ok:true})}
  if(p==='/api/tenant/confirm-status'&&r.method==='GET'){
    const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];const names=new Set(cols.map(x=>x.name));
    const where=[],vals=[];for(const col of ['id','tenant_id','slug']){if(!names.has(col))continue;where.push(`${col} IN (${tenantKeyValues(t).map(()=>'?').join(',')})`);vals.push(...tenantKeyValues(t))}
    const rows=where.length?((await e.DB.prepare(`SELECT admin_confirm_password_hash FROM tenant_accounts WHERE ${where.join(' OR ')} ORDER BY rowid DESC`).bind(...vals).all()).results||[]):[];
    return J({ok:true,configured:rows.some(x=>String(x.admin_confirm_password_hash||''))});
  }
  if(p==='/api/tenant/confirm-password'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));const np=String(b.newPassword||'');
    if(np.length<6)return J({ok:false,error:'CONFIRM_PASSWORD_TOO_SHORT'},400);
    const keys=tenantKeyValues(t);const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];const names=new Set(cols.map(x=>x.name));
    const where=[],vals=[];for(const col of ['id','tenant_id','slug']){if(!names.has(col))continue;where.push(`${col} IN (${keys.map(()=>'?').join(',')})`);vals.push(...keys)}
    const existing=where.length?((await e.DB.prepare(`SELECT admin_confirm_password_hash FROM tenant_accounts WHERE ${where.join(' OR ')}`).bind(...vals).all()).results||[]):[];
    if(existing.some(x=>String(x.admin_confirm_password_hash||'')))return J({ok:false,error:'CONFIRM_PASSWORD_ALREADY_SET'},409);
    const hash=await sha256(np);if(where.length)await e.DB.prepare(`UPDATE tenant_accounts SET admin_confirm_password_hash=? WHERE ${where.join(' OR ')}`).bind(hash,...vals).run();
    return J({ok:true,configured:true});
  }
  if(p==='/api/tenant/verify-confirm-password'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));const pass=String(b.password||'');
    if(!String(t.admin_confirm_password_hash||''))return J({ok:false,error:'CONFIRM_PASSWORD_NOT_SET'},409);
    if(!pass)return J({ok:false,error:'PASSWORD_REQUIRED'},400);
    const ok=String(t.admin_confirm_password_hash)===await sha256(pass);
    if(!ok)return J({ok:false,error:'INVALID_CONFIRM_PASSWORD'},401);
    return J({ok:true,verified:true});
  }
  if(p==='/api/tenant/confirm-password'&&r.method==='PUT'){
    const b=await r.json().catch(()=>({}));const old=String(b.oldPassword||''),np=String(b.newPassword||'');
    if(np.length<6)return J({ok:false,error:'CONFIRM_PASSWORD_TOO_SHORT'},400);
    const keys=tenantKeyValues(t);const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];const names=new Set(cols.map(x=>x.name));
    const where=[],vals=[];for(const col of ['id','tenant_id','slug']){if(!names.has(col))continue;where.push(`${col} IN (${keys.map(()=>'?').join(',')})`);vals.push(...keys)}
    const rows=where.length?((await e.DB.prepare(`SELECT admin_confirm_password_hash FROM tenant_accounts WHERE ${where.join(' OR ')}`).bind(...vals).all()).results||[]):[];
    const stored=rows.find(x=>String(x.admin_confirm_password_hash||''))?.admin_confirm_password_hash||'';
    if(!stored)return J({ok:false,error:'CONFIRM_PASSWORD_NOT_SET'},409);
    if(String(stored)!==await sha256(old))return J({ok:false,error:'INVALID_CONFIRM_PASSWORD'},401);
    if(where.length)await e.DB.prepare(`UPDATE tenant_accounts SET admin_confirm_password_hash=? WHERE ${where.join(' OR ')}`).bind(await sha256(np),...vals).run();
    return J({ok:true,configured:true});
  }
  if(p==='/api/tenant/password'&&r.method==='PUT'){
    const b=await r.json().catch(()=>({})),np=String(b.newPassword||'');
    if(np.length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);
    const hash=await sha256(np),key=await tenantAccountKeyColumn(e);
    if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
    await e.DB.prepare(`UPDATE tenant_accounts SET password_hash=? WHERE ${key}=?`).bind(hash,t.id).run();
    // Synchronize every legacy key that identifies this same tenant. This is important
    // for old databases where tenant_id, id and slug were introduced at different times.
    try{if(await tenantHasColumn(e,'tenant_accounts','tenant_id'))await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE tenant_id=? OR tenant_id=?').bind(hash,t.id,t.tenant_id??t.id).run()}catch{}
    try{if(await tenantHasColumn(e,'tenant_accounts','id'))await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE id=? OR id=?').bind(hash,t.id,t.tenant_id??t.id).run()}catch{}
    try{if(await tenantHasColumn(e,'tenant_accounts','slug') && t.slug)await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE lower(slug)=lower(?)').bind(hash,t.slug).run()}catch{}
    const fresh=await e.DB.prepare(`SELECT password_hash FROM tenant_accounts WHERE ${key}=?`).bind(t.id).first();
    if(String(fresh?.password_hash||'')!==hash)return J({ok:false,error:'PASSWORD_UPDATE_FAILED'},500);
    await tenantLog(e,t.id,t.id,'password_change');return J({ok:true})
  }
  if(p==='/api/tenant/wallet'&&r.method==='GET'){
    const balance=await walletBalance(e,t.id);
    const profile=await e.DB.prepare('SELECT method,bank_name,account_number,account_holder,wallet_provider,updated_at FROM tenant_payout_profiles WHERE tenant_id=?').bind(t.id).first();
    const ledger=(await e.DB.prepare('SELECT id,amount_vnd,kind,ref_type,ref_id,note,created_at FROM tenant_wallet_ledger WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(t.id).all()).results||[];
    const withdrawals=(await e.DB.prepare('SELECT id,gross_vnd,fee_vnd,payout_vnd,method,speed,status,admin_note,created_at,reviewed_at,paid_at FROM tenant_withdrawals WHERE tenant_id=? ORDER BY created_at DESC LIMIT 50').bind(t.id).all()).results||[];
    const sales=(await e.DB.prepare("SELECT COALESCE(SUM(amount_vnd),0) AS total FROM tenant_wallet_ledger WHERE tenant_id=? AND kind='sale'").bind(t.id).first())?.total||0;
    return J({ok:true,balanceVnd:balance,totalSalesVnd:Number(sales),profile,ledger,withdrawals,minimumWithdrawalVnd:100000});
  }
  if(p==='/api/tenant/payout-profile'&&r.method==='PUT'){
    const b=await r.json().catch(()=>({})),method=clean(b.method,20),holder=clean(b.account_holder,120),account=clean(b.account_number,120),bank=clean(b.bank_name,120),wallet=clean(b.wallet_provider,80);
    if(!['bank','wallet'].includes(method)||!holder||!account||(method==='bank'&&!bank)||(method==='wallet'&&!wallet))return J({ok:false,error:'PAYOUT_DETAILS_REQUIRED'},400);
    if(account.length<4||holder.length<2)return J({ok:false,error:'PAYOUT_DETAILS_INVALID'},400);
    await e.DB.prepare("INSERT INTO tenant_payout_profiles(tenant_id,method,bank_name,account_number,account_holder,wallet_provider,updated_at) VALUES(?,?,?,?,?,?,datetime('now')) ON CONFLICT(tenant_id) DO UPDATE SET method=excluded.method,bank_name=excluded.bank_name,account_number=excluded.account_number,account_holder=excluded.account_holder,wallet_provider=excluded.wallet_provider,updated_at=datetime('now')").bind(t.id,method,bank,account,holder,wallet).run();
    await tenantLog(e,t.id,t.id,'payout_profile_updated',method);
    return J({ok:true});
  }
  if(p==='/api/tenant/withdrawals'&&r.method==='POST'){
    const rl=limited(r,'tenant-withdrawal',3,60000);if(rl)return rl;
    const termsBody=await r.clone().json().catch(()=>({}));if(termsBody.termsAccepted!==true)return J({ok:false,error:'TERMS_ACCEPTANCE_REQUIRED',message:'Bạn cần đồng ý điều khoản rút tiền.'},400);
    const b=await r.json().catch(()=>({})),gross=Math.floor(Number(b.amount_vnd)||0),speed=clean(b.speed,20);
    if(gross<100000)return J({ok:false,error:'MINIMUM_WITHDRAWAL_100K'},400);
    if(!['normal','priority'].includes(speed))return J({ok:false,error:'INVALID_WITHDRAWAL_SPEED'},400);
    const profile=await e.DB.prepare('SELECT method,bank_name,account_number,account_holder,wallet_provider FROM tenant_payout_profiles WHERE tenant_id=?').bind(t.id).first();
    if(!profile)return J({ok:false,error:'PAYOUT_PROFILE_REQUIRED'},400);
    const balance=await walletBalance(e,t.id);if(gross>balance)return J({ok:false,error:'INSUFFICIENT_BALANCE',balanceVnd:balance},400);
    const fee=speed==='priority'?Math.floor(gross*0.10):0,payout=gross-fee,id=crypto.randomUUID();
    // Reserve funds immediately using a unique ledger reference; repeat submissions cannot spend the same balance.
    const snapshot=JSON.stringify(profile);
    try{
      // D1 batch runs transactionally: the balance check, withdrawal row and reserve ledger entry
      // commit together, preventing parallel requests from spending the same available balance.
      await e.DB.batch([
        e.DB.prepare("INSERT INTO tenant_withdrawals(id,tenant_id,gross_vnd,fee_vnd,payout_vnd,method,payout_snapshot,speed,status,terms_accepted_at) SELECT ?,?,?,?,?,?,?,?,'pending',datetime('now') WHERE (SELECT COALESCE(SUM(amount_vnd),0) FROM tenant_wallet_ledger WHERE tenant_id=?)>=?").bind(id,t.id,gross,fee,payout,profile.method,snapshot,speed,t.id,gross),
        e.DB.prepare("INSERT INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) SELECT ?,?,?, 'withdrawal_reserve','withdrawal',?,? WHERE EXISTS(SELECT 1 FROM tenant_withdrawals WHERE id=? AND status='pending')").bind(crypto.randomUUID(),t.id,-gross,id,`Rút tiền ${speed}`,id)
      ]);
      const created=await e.DB.prepare('SELECT id FROM tenant_withdrawals WHERE id=?').bind(id).first();
      if(!created)return J({ok:false,error:'INSUFFICIENT_BALANCE',balanceVnd:await walletBalance(e,t.id)},400);
    }catch(x){return J({ok:false,error:'WITHDRAWAL_CREATE_FAILED',detail:String(x?.message||x)},500)}
    await tenantLog(e,t.id,t.id,'withdrawal_requested',`${id}:${gross}:${speed}`);
    const moneyForNotice=n=>Number(n||0).toLocaleString('vi-VN')+' ₫';
    await createNotification(e,{recipientType:'admin',recipientId:'master',title:'Có yêu cầu rút tiền mới',body:`Tenant ${t.slug} gửi yêu cầu ${moneyForNotice(gross)}. Mã: ${id}. Trạng thái: Chờ duyệt.`,kind:'withdrawal'});
    await createNotification(e,{recipientType:'tenant',recipientId:t.id,title:'Đã nhận yêu cầu rút tiền',body:`Yêu cầu ${moneyForNotice(gross)} đã được ghi nhận. Mã: ${id}. Trạng thái: Chờ duyệt.`,kind:'withdrawal'});
    const tenantEmailRow=await e.DB.prepare('SELECT email FROM tenant_accounts WHERE id=? OR slug=? LIMIT 1').bind(t.id,t.slug).first().catch(()=>null);
    const money=n=>Number(n||0).toLocaleString('vi-VN')+' ₫';
    const notifyText=`Có yêu cầu rút tiền mới trên Téo Studio.\nTenant: ${t.slug} (${t.id})\nMã yêu cầu: ${id}\nSố tiền gốc: ${money(gross)}\nPhí: ${money(fee)}\nThực nhận: ${money(payout)}\nHình thức: ${speed==='priority'?'Ưu tiên (mục tiêu xử lý 24 giờ)':'Thông thường (mục tiêu xử lý 7–10 ngày)'}\nTrạng thái: Chờ duyệt.`;
    if(validEmail(e.EMAIL_ADMIN_TO||'teostudio@teostudio.top'))await notifyEmail(e,{to:validEmail(e.EMAIL_ADMIN_TO||'teostudio@teostudio.top'),subject:'Téo Studio: Có yêu cầu rút tiền mới',text:notifyText});
    if(validEmail(tenantEmailRow?.email))await notifyEmail(e,{to:tenantEmailRow.email,subject:'Téo Studio: Đã nhận yêu cầu rút tiền',text:`Téo Studio đã nhận yêu cầu rút tiền của bạn.\n\n${notifyText}\n\nThời gian xử lý là mục tiêu dự kiến, không phải cam kết thanh toán.`});
    return J({ok:true,withdrawal:{id,grossVnd:gross,feeVnd:fee,payoutVnd:payout,speed,status:'pending'},message:'Đã gửi yêu cầu rút tiền để Admin duyệt.'},201);
  }
  if(p==='/api/tenant/stats'&&r.method==='GET')return J({ok:true,...await tenantStats(e,t.id,u.searchParams.get('days')||30,u.searchParams.get('month')||'')});
  if(p==='/api/tenant/audit'&&r.method==='GET')return J({ok:true,logs:await tenantAudit(e,t.id)});
  if(p==='/api/tenant/logout'&&r.method==='POST'){const tok=tokenFrom(r);await e.DB.prepare('DELETE FROM tenant_sessions WHERE token=?').bind(tok).run();return J({ok:true})}
  return J({ok:false,error:'NOT_FOUND'},404)
}

async function handleMasterTenant(r,e){
  if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
  await ensureTenantSchema(e);
  const u=new URL(r.url),p=u.pathname,key=await tenantAccountKeyColumn(e);
  if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING',detail:'tenant_accounts must contain id or tenant_id'},500);
  if(p==='/api/admin/tenants'&&r.method==='GET'){
    try{await purgeExpired(e)}catch{}
    const q=clean(u.searchParams.get('q')||'',80);
    const rows=(await e.DB.prepare('SELECT * FROM tenant_accounts ORDER BY rowid DESC').all()).results||[];
    const filtered=rows.filter(x=>{const n=tenantInfo(x);return !x.deleted_at&&(!q||String(n.id||'').includes(q)||String(n.slug||'').includes(q))});
    return J({ok:true,tenants:filtered.map(tenantInfo)})
  }
  if(p==='/api/admin/tenants'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));
    const id=clean(b.id??b.tenantId??b.username??b.slug,80),slug=tenantSlug(id),password=String(b.password??b.pass??''),days=Math.max(1,Math.min(3650,Number(b.days)||30)),planType=b.planType==='free'?'free':'paid',email=validEmail(b.email||'');
    if(b.email && !email)return J({ok:false,error:'INVALID_EMAIL'},400);
    if(!slug)return J({ok:false,error:'ID_REQUIRED'},400);
    if(password.length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);
    try{
      const exists=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE slug=?').bind(slug).first();
      if(exists&&!exists.deleted_at)return J({ok:false,error:'TENANT_EXISTS'},409);
      const tid='t-'+slug+'-'+crypto.randomUUID().slice(0,8);
      const st=new Date(),ex=new Date(Date.now()+days*86400000);
      const starts=st.toISOString().slice(0,19).replace('T',' '),expires=(planType==='free'?starts:ex.toISOString().slice(0,19).replace('T',' '));
      let row;
      const hash=await sha256(password);
      // Write using the detected live key. If a deployed/legacy D1 still rejects
      // the first shape, retry once against tenant_id; this makes the migration
      // tolerant of old schemas without deleting or rebuilding tenant data.
      try{
        if(key==='id'){
          await e.DB.prepare("INSERT INTO tenant_accounts(id,slug,password_hash,starts_at,expires_at,plan_type) VALUES(?,?,?,?,?,'paid')").bind(tid,slug,hash,starts,expires).run();
        }else{
          await e.DB.prepare("INSERT INTO tenant_accounts(tenant_id,slug,password_hash,starts_at,expires_at,plan_type) VALUES(?,?,?,?,?,'paid')").bind(tid,slug,hash,starts,expires).run();
        }
      }catch(firstErr){
        if(key==='id' && await tenantHasColumn(e,'tenant_accounts','tenant_id')){
          await e.DB.prepare('INSERT INTO tenant_accounts(tenant_id,slug,password_hash,starts_at,expires_at) VALUES(?,?,?,?,?)').bind(tid,slug,hash,starts,expires).run();
        }else if(key==='tenant_id' && await tenantHasColumn(e,'tenant_accounts','id')){
          await e.DB.prepare('INSERT INTO tenant_accounts(id,slug,password_hash,starts_at,expires_at) VALUES(?,?,?,?,?)').bind(tid,slug,hash,starts,expires).run();
        }else{
          throw firstErr;
        }
      }
      const finalKey=await tenantAccountKeyColumn(e)||key;
      await e.DB.prepare(`UPDATE tenant_accounts SET plan_type=?,free_bypass_count=0,free_admin_unlocked=0,expires_at=?,starts_at=? WHERE ${finalKey}=?`).bind(planType,expires,starts,tid).run();
      row=await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE ${finalKey}=?`).bind(tid).first();
      row=await normalizeTenantRow(e,row);
      if(!row)return J({ok:false,error:'TENANT_CREATE_FAILED'},500);
      if(email){await e.DB.prepare(`UPDATE tenant_accounts SET email=? WHERE ${finalKey}=?`).bind(email,tid).run();row.email=email;}
      try{await tenantLog(e,row.id,'master','create',`plan=${planType};days=${planType==='free'?4:days}`)}catch{}
      await createNotification(e,{recipientType:'admin',recipientId:'master',title:'Đã tạo tenant mới',body:planType==='free'?`Tài khoản ${slug} thuộc gói Free. Admin cần xác minh 2 lượt vượt link; mỗi lượt cộng 2 ngày.`:`Tài khoản ${slug} đã được tạo với thời hạn ${days} ngày.`,kind:'tenant'});
      await createNotification(e,{recipientType:'tenant',recipientId:row.id,title:'Chào mừng đến với Téo Studio',body:planType==='free'?'Tài khoản Free đã được tạo. Hãy hoàn thành 2 lượt vượt link được máy chủ xác minh để mở Admin trong 4 ngày.':`Tài khoản ${slug} đã được tạo. Hãy đăng nhập trang quản trị tenant để bắt đầu.`,kind:'welcome'});
      let welcomeEmail=null;
      if(email){welcomeEmail=await notifyEmail(e,{to:email,subject:'Chào mừng bạn đến với Téo Studio',text:`Xin chào ${slug}!

Tài khoản Share File của bạn đã được tạo.
ID: ${slug}
Admin riêng: ${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}
Trang Share: ${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}
Thời hạn: ${days} ngày.

Vì lý do bảo mật, mật khẩu ban đầu được gửi riêng bởi quản trị viên; email này không chứa mật khẩu.`});}
      const adminUrl=`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl=`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(slug)}`;
      return J({ok:true,tenant:tenantInfo(row),adminUrl,shareUrl,emailSent:welcomeEmail?.ok===true,emailWarning:welcomeEmail&&!welcomeEmail.ok?'Không gửi được email chào mừng; kiểm tra cấu hình SMTP.':undefined},201);
    }catch(x){return J({ok:false,error:'TENANT_CREATE_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  let m=p.match(/^\/api\/admin\/tenants\/([^/]+)$/);
  if(m){
    const tid=clean(decodeURIComponent(m[1]),100),t=await normalizeTenantRow(e,await tenantByIdentifier(e,tid));
    if(!t)return J({ok:false,error:'TENANT_NOT_FOUND'},404);
    const canonicalId=t.id;
    if(r.method==='DELETE'){
      // Financially safe archive: preserve files, orders, ledger, referral credits and withdrawals for audit.
      await e.DB.prepare(`UPDATE tenant_accounts SET locked=1,deleted_at=datetime('now') WHERE ${key}=?`).bind(canonicalId).run();
      const sk=tenantKeyValues(t);for(const sid of sk){try{await e.DB.prepare('DELETE FROM tenant_sessions WHERE tenant_id=?').bind(sid).run()}catch{}}
      try{await tenantLog(e,canonicalId,'master','archive','Tài khoản đã được lưu trữ; dữ liệu tài chính được giữ nguyên')}catch{}
      return J({ok:true,archived:true,message:'Đã khóa và lưu trữ tenant. Lịch sử tài chính được giữ nguyên.'})
    }
    if(r.method==='PUT'){
      const b=await r.json().catch(()=>({}));
      if(b.days!==undefined){const d=Math.max(1,Math.min(3650,Number(b.days)||1));const base=Math.max(Date.now(),tenantDateMs(t.expires_at)||Date.now());const ex=new Date(base+d*86400000);await e.DB.prepare(`UPDATE tenant_accounts SET expires_at=?,locked=0 WHERE ${key}=?`).bind(ex.toISOString().slice(0,19).replace('T',' '),canonicalId).run();await tenantLog(e,canonicalId,'master','renew',`days=${d}`)}
      if(b.password){if(String(b.password).length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);const hash=await sha256(String(b.password));await e.DB.prepare(`UPDATE tenant_accounts SET password_hash=? WHERE ${key}=?`).bind(hash,canonicalId).run();try{if(await tenantHasColumn(e,'tenant_accounts','tenant_id'))await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE tenant_id=?').bind(hash,t.tenant_id??canonicalId).run()}catch{}try{if(await tenantHasColumn(e,'tenant_accounts','id'))await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE id=?').bind(hash,t.id).run()}catch{}try{if(await tenantHasColumn(e,'tenant_accounts','slug'))await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE lower(slug)=lower(?)').bind(hash,t.slug).run()}catch{}await tenantLog(e,canonicalId,'master','password_change')}
      if(typeof b.locked==='boolean'){await e.DB.prepare(`UPDATE tenant_accounts SET locked=? WHERE ${key}=?`).bind(b.locked?1:0,canonicalId).run();const sk=tenantKeyValues(t);for(const sid of sk){try{await e.DB.prepare('DELETE FROM tenant_sessions WHERE tenant_id=?').bind(sid).run()}catch{}}await tenantLog(e,canonicalId,'master',b.locked?'lock':'unlock')}
      const fresh=await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE ${key}=?`).bind(canonicalId).first();
      return J({ok:true,tenant:tenantInfo(await normalizeTenantRow(e,fresh))})
    }
  }
  return J({ok:false,error:'NOT_FOUND'},404)
}

function dayVN(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function safeReferrerDomain(raw){try{const u=new URL(String(raw||''));if(!['http:','https:'].includes(u.protocol))return '';const h=u.hostname.toLowerCase().replace(/^www\./,'');if(!h||h==='teostudio.top'||h.endsWith('.teostudio.top'))return '';return h.slice(0,253)}catch{return ''}}
async function bumpView(e,kind,productId='',source=''){
  const day=dayVN();
  await e.DB.prepare(`INSERT INTO view_daily(day,kind,product_id,views) VALUES(?,?,?,1) ON CONFLICT(day,kind,product_id) DO UPDATE SET views=views+1`).bind(day,kind,productId).run();
  const domain=safeReferrerDomain(source);if(domain){try{await e.DB.prepare(`INSERT INTO view_referrers_daily(day,kind,product_id,domain,views) VALUES(?,?,?,?,1) ON CONFLICT(day,kind,product_id,domain) DO UPDATE SET views=views+1`).bind(day,kind,productId,domain).run()}catch{}}
  if(kind==='product'&&productId)await e.DB.prepare('UPDATE products SET views=COALESCE(views,0)+1 WHERE id=?').bind(productId).run();
}
async function comments(e){return ((await e.DB.prepare('SELECT id,name,text,image,created_at FROM comments WHERE visible=1 ORDER BY created_at DESC LIMIT 50').all()).results||[]).map(x=>({...x,image:x.image?safeImageValue(x.image,1000000):''}))}
async function stats(e,days=30){const n=Math.max(1,Math.min(Number(days)||30,365));const today=dayVN(),month=today.slice(0,7),from=today;const rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM view_daily WHERE day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(today,n-1).all()).results||[];const prods=await e.DB.prepare('SELECT id,title,views,sale_mode,price_vnd FROM products ORDER BY views DESC,updated_at DESC').all();let daily={orders:0,revenueVnd:0,views:0},monthly={orders:0,revenueVnd:0,byDay:[]};try{daily=await e.DB.prepare("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenueVnd FROM product_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')=?").bind(today).first()||daily;monthly=await e.DB.prepare("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenueVnd FROM product_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<date(?,'+1 month')").bind(month+'-01',month+'-01').first()||monthly;monthly.byDay=(await e.DB.prepare("SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS revenueVnd FROM product_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<date(?,'+1 month') GROUP BY date(paid_at,'+7 hours') ORDER BY day").bind(month+'-01',month+'-01').all()).results||[]}catch{}let referrers=[],paidViewsByDay=[];try{referrers=(await e.DB.prepare(`SELECT domain,SUM(views) AS views FROM view_referrers_daily WHERE day>=date(?, '-'||?||' days') GROUP BY domain ORDER BY views DESC LIMIT 50`).bind(today,n-1).all()).results||[]}catch{}try{paidViewsByDay=(await e.DB.prepare(`SELECT v.day,v.product_id,p.title,SUM(v.views) AS views FROM view_daily v JOIN products p ON p.id=v.product_id WHERE v.day>=date(?, '-'||?||' days') AND p.sale_mode IN ('paid','both') AND v.kind IN ('product','outbound') GROUP BY v.day,v.product_id,p.title ORDER BY v.day DESC,views DESC`).bind(today,Math.max(n-1,29)).all()).results||[]}catch{}return {days:n,rows,products:prods.results||[],referrers,paidViewsByDay,today:rows.filter(x=>x.day===today).reduce((a,x)=>a+Number(x.views||0),0),sales:{today:{orders:Number(daily.orders||0),revenueVnd:Number(daily.revenueVnd||0)},month:{orders:Number(monthly.orders||0),revenueVnd:Number(monthly.revenueVnd||0),byDay:monthly.byDay||[]}}} }
export default{async scheduled(_controller,e){try{await purgeExpired(e)}catch{}},async fetch(r,e){const u=new URL(r.url),p=u.pathname.replace(/\/$/,'');const host=u.hostname.toLowerCase();const wrongHost=host.endsWith('.workers.dev')||host==='www.teostudio.top';if(wrongHost&&p!=='/api/webhook/sepay'){const canonical=PUBLIC_ORIGIN+(p||'/')+u.search;if(!p.startsWith('/api/')&&['GET','HEAD'].includes(r.method))return Response.redirect(canonical,302);if(p.startsWith('/api/'))return J({ok:false,error:'CANONICAL_HOST_REQUIRED',message:'Bạn đang mở địa chỉ thử nghiệm hoặc tên miền phụ. Hãy mở https://teostudio.top để đăng nhập và sử dụng các chức năng.'},421);return J({ok:false,error:'CANONICAL_HOST_REQUIRED',message:'Hãy mở https://teostudio.top.'},421)}if(r.method==='OPTIONS')return new Response(null,{headers:C});try{
  if(u.pathname.length>2048||u.search.length>4096)return J({ok:false,error:'URI_TOO_LARGE'},414);
  // Reject cross-site browser writes to cookie/session-backed APIs. SePay server webhook is exempt.
  if(p.startsWith('/api/')&&!['GET','HEAD','OPTIONS'].includes(r.method)&&p!='/api/webhook/sepay'){
    const origin=r.headers.get('origin')||'',site=String(r.headers.get('sec-fetch-site')||'').toLowerCase();
    const allowedOrigins=new Set([PUBLIC_ORIGIN,'https://www.teostudio.top']);
    if(origin){let good=false;try{good=allowedOrigins.has(new URL(origin).origin)}catch{}if(!good)return J({ok:false,error:'CROSS_SITE_REQUEST_BLOCKED'},403)}
    else if(site==='cross-site')return J({ok:false,error:'CROSS_SITE_REQUEST_BLOCKED'},403);
  }
  // Only an exact IP explicitly added by Admin to security_blocks is denied. No automatic IP ban.
  const requesterIp=clientIp(r);if(requesterIp&&await securityBlocked(e,'ip',requesterIp))return blockedNotFound(r);
  // Count only actual HTML navigations, not CSS/JS/images; this avoids blocking normal page loads.
  if(documentNavigation(r)){const navLimited=documentRateResponse(r);if(navLimited)return navLimited;}
  // Broad API burst guard is intentionally higher than the navigation threshold because one page load calls multiple APIs.
  if(p.startsWith('/api/')&&r.method!=='OPTIONS'){const apiLimited=apiRateResponse(r);if(apiLimited)return apiLimited;}
  const hardHeaders={'x-content-type-options':'nosniff','x-frame-options':'SAMEORIGIN','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(),microphone=(),geolocation=()','x-permitted-cross-domain-policies':'none','cross-origin-opener-policy':'same-origin','strict-transport-security':'max-age=31536000','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; worker-src 'self' blob: https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"};
  if(p.startsWith('/api/') && r.method!=='GET' && r.method!=='HEAD'){
    const len=Number(r.headers.get('content-length')||0);if(len>2_000_000)return J({ok:false,error:'REQUEST_TOO_LARGE'},413,hardHeaders);
  }
  const ua=r.headers.get('user-agent')||'';
  const crawler=/facebookexternalhit|Facebot|Twitterbot|TelegramBot|WhatsApp|Discordbot|Slackbot|Googlebot|Zalo(?:Bot)?|ZaloPC|LinkedInBot|Pinterestbot|Viber|Line\//i.test(ua);
  if(crawler && (p==='/'||p==='/index.html') && e.ASSETS){try{
    const base=u.origin;
    const title='Lại Húp File — Téo Studio', desc='Kho file, code, script và tài nguyên của Téo Studio.';
    const img=PUBLIC_ORIGIN+'/assets/img/og-preview.png';
    const rr=await e.ASSETS.fetch(new Request(new URL('/index.html',r.url),r));
    let html=await rr.text();
    const meta=`<meta name="description" content="${desc}"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${img}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${base}/"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${img}">`;
    html=html.replace(/<meta property="og:image"[^>]*>/i,'').replace('</head>',meta+'</head>');
    return new Response(html,{status:rr.status,headers:{'content-type':'text/html;charset=UTF-8','cache-control':'public, max-age=60'}});
  }catch{}}
  if(p==='/api/webhook/sepay')return await handleSePayWebhook(r,e);
  if(p==='/api/public-config'&&r.method==='GET')return J(paymentConfig(e));
  if(p==='/api/rental/config'&&r.method==='GET')return J({...paymentConfig(e),freeBypassConfigured:!!(e.FREE_BYPASS_TEMPLATE_1&&e.FREE_BYPASS_TEMPLATE_2&&e.FREE_BYPASS_VERIFY_URL&&e.FREE_BYPASS_API_KEY),emailConfigured:!!e.OXMAIL_SMTP_PASS});
  if(p==='/api/rental/email/start'&&r.method==='POST')return await startRentalEmailVerification(r,e);
  if(p==='/api/rental/email/verify'&&r.method==='POST')return await verifyRentalEmail(r,e);
  if(p==='/api/rental/free/create'&&r.method==='POST')return await createFreeRentalAccount(r,e);
  if(p==='/api/rental/free/bypass/start'&&r.method==='POST')return await startFreeBypass(r,e);
  if(p==='/api/rental/free/bypass/complete'&&r.method==='POST')return await completeFreeBypass(r,e);
  if(p==='/api/rental/orders/create'&&r.method==='POST')return await handleRentalOrderCreate(r,e);
  const rentalOrderMatch=p.match(/^\/api\/rental\/orders\/([^/]+)$/);if(rentalOrderMatch&&r.method==='GET')return await handleRentalOrderStatus(r,e,rentalOrderMatch[1]);
  if(p==='/api/health'){const cs=runtimeConfigStatus(e);return J({ok:true,service:'teo-studio-api',version:BUILD_VERSION,frontendVersion:BUILD_VERSION,auth:'admin-key-session',payment:paymentConfig(e),config:{d1:cs.database.configured,aiConfigured:cs.ai.ready,emailConfigured:cs.email.configured,telegramConfigured:cs.telegram.configured,turnstileConfigured:cs.turnstile.configured,sepayConfigured:cs.sepay.configured}})}
  if(p.startsWith('/api/account/'))return await accountApi(r,e,p);
  if(p==='/api/assistant/chat'&&r.method==='POST')return await assistantChat(r,e);
  if(p==='/api/support/report'&&r.method==='POST')return await submitSupportReport(r,e);
  if(p==='/api/support/config'&&r.method==='GET'){const cs=runtimeConfigStatus(e);return J({turnstileEnabled:true,turnstileConfigured:cs.turnstile.configured,turnstileSiteKey:clean(e.TURNSTILE_SITE_KEY||'',200),aiConfigured:cs.ai.ready})}
  if(p==='/api/admin/analytics'&&r.method==='GET'){
    if(!await isAdmin(r,e))return J({ok:false,error:'ADMIN_REQUIRED'},401);await ensureV55Schema(e);
    const rawMonth=clean(u.searchParams.get('month')||dayVN().slice(0,7),7),m=/^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)?rawMonth:dayVN().slice(0,7),start=m+'-01',end=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7)),1)).toISOString().slice(0,10);
    const sale=await e.DB.prepare("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross,COALESCE(SUM(commission_vnd),0) AS commission,COALESCE(SUM(CASE WHEN scope='main' THEN amount_vnd ELSE commission_vnd END),0) AS platform,COALESCE(SUM(seller_amount_vnd),0) AS sellerNet FROM buyer_purchases WHERE status='paid' AND date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<?").bind(start,end).first();
    const legacyMain=await e.DB.prepare("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross FROM product_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<?").bind(start,end).first().catch(()=>({orders:0,gross:0}));
    const legacyTenant=await e.DB.prepare("SELECT COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross FROM tenant_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<?").bind(start,end).first().catch(()=>({orders:0,gross:0}));
    const legacyTenantByDay=(await e.DB.prepare("SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross FROM tenant_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<? GROUP BY date(paid_at,'+7 hours')").bind(start,end).all().catch(()=>({results:[]}))).results||[];
    const legacySellers=(await e.DB.prepare("SELECT o.tenant_id,COUNT(*) AS orders,COALESCE(SUM(o.amount_vnd),0) AS gross FROM tenant_payment_orders o WHERE o.status='paid' AND date(o.paid_at,'+7 hours')>=? AND date(o.paid_at,'+7 hours')<? GROUP BY o.tenant_id").bind(start,end).all().catch(()=>({results:[]}))).results||[];
    const topups=await e.DB.prepare("SELECT COUNT(*) AS count,COALESCE(SUM(amount_vnd),0) AS amount FROM buyer_wallet_topups WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<?").bind(start,end).first();
    const rentalIncome=await e.DB.prepare("SELECT COUNT(*) AS count,COALESCE(SUM(amount_vnd),0) AS amount FROM tenant_rental_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<?").bind(start,end).first().catch(()=>({count:0,amount:0}));
    const rentalByDay=(await e.DB.prepare("SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS amount FROM tenant_rental_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<? GROUP BY date(paid_at,'+7 hours')").bind(start,end).all().catch(()=>({results:[]}))).results||[];
    const rentalReferral=await e.DB.prepare("SELECT COALESCE(SUM(amount_vnd),0) AS amount FROM tenant_wallet_ledger WHERE kind='referral_commission' AND ref_type='rental_order' AND date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<?").bind(start,end).first().catch(()=>({amount:0}));
    const purchasesByDay=(await e.DB.prepare("SELECT date(created_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross,COALESCE(SUM(commission_vnd),0) AS commission FROM buyer_purchases WHERE status='paid' AND date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<? GROUP BY date(created_at,'+7 hours') ORDER BY day").bind(start,end).all()).results||[];
    const views=(await e.DB.prepare('SELECT day,kind,SUM(views) AS views FROM view_daily WHERE day>=? AND day<? GROUP BY day,kind ORDER BY day').bind(start,end).all()).results||[];
    const sellers=(await e.DB.prepare("SELECT tenant_id,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross,COALESCE(SUM(seller_amount_vnd),0) AS sellerNet,COALESCE(SUM(commission_vnd),0) AS commission FROM buyer_purchases WHERE scope='tenant' AND status='paid' AND date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<? GROUP BY tenant_id ORDER BY gross DESC LIMIT 50").bind(start,end).all()).results||[];
    const sellerMap=new Map(sellers.map(v=>[String(v.tenant_id),{...v,orders:Number(v.orders||0),gross:Number(v.gross||0),sellerNet:Number(v.sellerNet||0),commission:Number(v.commission||0)}]));for(const v of legacySellers){const k=String(v.tenant_id),row=sellerMap.get(k)||{tenant_id:k,orders:0,gross:0,sellerNet:0,commission:0};row.orders+=Number(v.orders||0);row.gross+=Number(v.gross||0);row.sellerNet+=Number(v.gross||0);sellerMap.set(k,row)}const allSellers=[...sellerMap.values()].sort((a,b)=>b.gross-a.gross).slice(0,50);
    const days=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7)),0)).getUTCDate(),dayMap=new Map(purchasesByDay.map(x=>[x.day,{...x,fileSalesVnd:Number(x.gross||0),rentalVnd:0}]));for(const v of legacyTenantByDay){const row=dayMap.get(v.day)||{day:v.day,orders:0,gross:0,commission:0,fileSalesVnd:0,rentalVnd:0};row.orders=Number(row.orders||0)+Number(v.orders||0);row.gross=Number(row.gross||0)+Number(v.gross||0);row.fileSalesVnd=Number(row.fileSalesVnd||0)+Number(v.gross||0);dayMap.set(v.day,row)}const legacyMainByDay=(await e.DB.prepare("SELECT date(paid_at,'+7 hours') AS day,COUNT(*) AS orders,COALESCE(SUM(amount_vnd),0) AS gross FROM product_payment_orders WHERE status='paid' AND date(paid_at,'+7 hours')>=? AND date(paid_at,'+7 hours')<? GROUP BY date(paid_at,'+7 hours')").bind(start,end).all().catch(()=>({results:[]}))).results||[];for(const v of legacyMainByDay){const row=dayMap.get(v.day)||{day:v.day,orders:0,gross:0,commission:0,fileSalesVnd:0,rentalVnd:0};row.orders=Number(row.orders||0)+Number(v.orders||0);row.gross=Number(row.gross||0)+Number(v.gross||0);row.fileSalesVnd=Number(row.fileSalesVnd||0)+Number(v.gross||0);dayMap.set(v.day,row)}for(const v of rentalByDay){const row=dayMap.get(v.day)||{day:v.day,orders:0,gross:0,commission:0,fileSalesVnd:0,rentalVnd:0};row.orders=Number(row.orders||0)+Number(v.orders||0);row.gross=Number(row.gross||0)+Number(v.amount||0);row.rentalVnd=Number(row.rentalVnd||0)+Number(v.amount||0);dayMap.set(v.day,row)}const byDay=[];for(let n=1;n<=days;n++){const d=`${m}-${String(n).padStart(2,'0')}`,v=dayMap.get(d)||{};byDay.push({day:d,orders:Number(v.orders||0),grossVnd:Number(v.gross||0),fileSalesVnd:Number(v.fileSalesVnd||0),rentalVnd:Number(v.rentalVnd||0),commissionVnd:Number(v.commission||0)})}
    const allFileOrders=Number(sale?.orders||0)+Number(legacyMain?.orders||0)+Number(legacyTenant?.orders||0),allOrders=allFileOrders+Number(rentalIncome?.count||0),fileGross=Number(sale?.gross||0)+Number(legacyMain?.gross||0)+Number(legacyTenant?.gross||0),rentalGross=Number(rentalIncome?.amount||0),gross=fileGross+rentalGross,platformVnd=Number(sale?.platform||0)+Number(legacyMain?.gross||0)+rentalGross-Number(rentalReferral?.amount||0),sellerNetVnd=Number(sale?.sellerNet||0)+Number(legacyTenant?.gross||0);
    return J({ok:true,month:m,summary:{orders:allOrders,fileOrders:allFileOrders,grossVnd:gross,fileSalesVnd:fileGross,rentalRevenueVnd:rentalGross,rentalOrders:Number(rentalIncome?.count||0),platformRevenueVnd:Math.max(0,platformVnd),commissionVnd:Number(sale?.commission||0),sellerNetVnd:Math.max(0,sellerNetVnd),topupsVnd:Number(topups?.amount||0),topupCount:Number(topups?.count||0)},byDay,views,sellers:allSellers,recent:(await e.DB.prepare("SELECT id,title,scope,tenant_id,amount_vnd,commission_vnd,status,created_at FROM buyer_purchases WHERE date(created_at,'+7 hours')>=? AND date(created_at,'+7 hours')<? ORDER BY created_at DESC LIMIT 100").bind(start,end).all()).results||[]});
  }
  if(p==='/api/admin/support/reports'&&(r.method==='GET'||r.method==='PUT')){
    if(!await isAdmin(r,e))return J({ok:false,error:'ADMIN_REQUIRED'},401);await ensureV55Schema(e);
    if(r.method==='GET'){const rows=(await e.DB.prepare('SELECT id,email,display_name,page,category,message,client_ip,status,created_at,updated_at FROM support_reports ORDER BY CASE status WHEN \'open\' THEN 0 WHEN \'reviewing\' THEN 1 ELSE 2 END,created_at DESC LIMIT 200').all()).results||[];return J({ok:true,reports:rows})}
    const b=await r.json().catch(()=>({})),id=clean(b.id||'',100),status=['open','reviewing','resolved','rejected'].includes(String(b.status))?String(b.status):'';if(!id||!status)return J({ok:false,error:'INVALID_REPORT_UPDATE'},400);const up=await e.DB.prepare("UPDATE support_reports SET status=?,updated_at=datetime('now') WHERE id=?").bind(status,id).run();return J({ok:true,updated:Number(up.meta?.changes||0)});
  }
  if(p==='/api/admin/login'&&r.method==='POST'){const rl=limited(r,'admin-login',8,60000);if(rl)return rl;await ensureAdminSessionSchema(e);const b=await r.json().catch(()=>({}));const supplied=clean(b.adminKey??b.password??'',500);const expected=clean(e.ADMIN_KEY??'',500);if(!expected)return J({ok:false,error:'ADMIN_KEY_MISSING'},500);if(!supplied||!safeEq(supplied,expected))return J({ok:false,error:'INVALID_ADMIN_KEY'},401);const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO admin_sessions(token,expires_at) VALUES(?,?)').bind(token,Date.now()+7*24*60*60*1000).run();return J({ok:true,token,expiresIn:7*24*60*60*1000})}
  await ensureSchema(e);
  if(p==='/api/products'&&r.method==='GET')return J({ok:true,products:await products(e)});
  if(p.match(/^\/api\/products\/[^/]+$/)&&r.method==='GET'){const id=decodeURIComponent(p.split('/').pop());const product=await productById(e,id);return product?J({ok:true,product}):J({ok:false,error:'NOT_FOUND'},404)}
  const publicProductOrderCreate=p.match(/^\/api\/products\/([^/]+)\/orders\/create$/);
  if(publicProductOrderCreate&&r.method==='POST'){
    return J({ok:false,error:'WALLET_PURCHASE_REQUIRED',message:'Đăng nhập và nạp ví để mua file. QR cũ theo từng đơn đã được thay bằng thanh toán qua ví.'},410);
    const rl=limited(r,'main-product-order',4,60000);if(rl)return rl;const id=decodeURIComponent(publicProductOrderCreate[1]);
    const raw=await e.DB.prepare('SELECT * FROM products WHERE id=? AND visible=1 LIMIT 1').bind(id).first();if(!raw)return J({ok:false,error:'NOT_FOUND'},404);const prod=safeProductRow(raw);
    if(!['paid','both'].includes(prod.sale_mode)||Number(prod.price_vnd)<1000)return J({ok:false,error:'PRODUCT_NOT_FOR_SALE'},400);
    const cfg=paymentConfig(e);if(!cfg.paymentsEnabled)return J({ok:false,error:'PAYMENT_NOT_CONFIGURED',missing:cfg.missing},503);
    const b=await r.json().catch(()=>({}));if(cfg.turnstileEnabled){const proof=await verifyTurnstile(e,b.turnstileToken,r);if(!proof.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Xác minh chống bot chưa thành công.'},400)}
    const oid=crypto.randomUUID(),code='TEO'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),expires=Date.now()+10*60*1000;
    await e.DB.prepare("INSERT INTO product_payment_orders(id,product_id,payment_code,amount_vnd,status,expires_at) VALUES(?,?,?,?,'pending',?)").bind(oid,id,code,Number(prod.price_vnd),expires).run();
    return J({ok:true,order:{id:oid,productId:id,code,amount:Number(prod.price_vnd),status:'pending',expiresAt:expires,qrUrl:buildVietQr(e,prod.price_vnd,code)}},201);
  }
  const publicProductOrderStatus=p.match(/^\/api\/products\/([^/]+)\/orders\/([^/]+)$/);
  if(publicProductOrderStatus&&r.method==='GET'){const productId=decodeURIComponent(publicProductOrderStatus[1]),orderId=clean(decodeURIComponent(publicProductOrderStatus[2]),100);const order=await e.DB.prepare('SELECT * FROM product_payment_orders WHERE id=? AND product_id=?').bind(orderId,productId).first();if(!order)return J({ok:false,error:'ORDER_NOT_FOUND'},404);if(order.status==='pending'&&Number(order.expires_at)<=Date.now()){await e.DB.prepare("UPDATE product_payment_orders SET status='expired' WHERE id=? AND status='pending'").bind(order.id).run();order.status='expired'}return J({ok:true,order:{id:order.id,status:order.status,amount:Number(order.amount_vnd),expiresAt:order.expires_at,paidAt:order.paid_at,downloadUrl:null,legacy:true,message:'Link gốc không còn trả qua trạng thái đơn công khai. Đăng nhập tài khoản để xem đơn đã mua.'}})}
  if(p==='/api/tags'&&r.method==='GET')return J({ok:true,tags:await tags(e)});
  if(p==='/api/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/channel/preview'&&r.method==='GET') {const rl=limited(r,'channel-preview',8,60000);if(rl)return rl;}
  if(p==='/api/channel/preview'&&r.method==='GET'){
    const raw0=new URL(r.url).searchParams.get('url')||'';
    const raw=/^https?:\/\//i.test(raw0.trim())?raw0.trim():'https://'+raw0.trim();
    let u;try{u=new URL(raw)}catch{return J({ok:false,error:'INVALID_CHANNEL_URL'},400)}
    const host=u.hostname.toLowerCase().replace(/^www\./,'');
    if(!['tiktok.com','youtube.com','m.youtube.com','youtu.be'].includes(host))return J({ok:false,error:'CHANNEL_HOST_NOT_ALLOWED'},400);
    const decode=s=>String(s||'').replace(/\\u002F/g,'/').replace(/\\u0026/g,'&').replace(/\\\//g,'/').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim();
    const pick=(html,re)=>{const m=String(html||'').match(re);return m?decode(m[1]):''};
    const cleanCount=v=>String(v||'').replace(/\\s+/g,' ').trim();
    try{
      const rr=await safeChannelFetch(u.toString(),{headers:{'user-agent':'Mozilla/5.0 (compatible; TeoStudioBot/1.0)','accept':'text/html,application/xhtml+xml'},redirect:'follow'});
      const html=await readTextLimited(rr,1200000);
      let title='',image='',followers='',handle='';
      if(host==='tiktok.com'){
        const profileHandle=decode((u.pathname.match(/@[^/]+/)||[])[0]||'').replace(/^@/,'');
        try{const oe=await safeChannelFetch('https://www.tiktok.com/oembed?url='+encodeURIComponent(u.toString()),{headers:{'user-agent':'Mozilla/5.0','accept':'application/json'},redirect:'follow'});if(oe.ok){const j=await oe.json();title=j.author_name||'';image=j.thumbnail_url||'';handle=j.author_url?((String(j.author_url).match(/@[^/?#]+/)||[])[0]||''):'';}}catch{}
        if (profileHandle) {
          const apiUrls = [
            'https://www.tiktok.com/node/share/user/@' + encodeURIComponent(profileHandle),
            'https://www.tiktok.com/api/user/detail/?unique_id=' + encodeURIComponent(profileHandle)
          ];
          for (const endpoint of apiUrls) {
            if (title && image && followers) break;
            try {
              const ar = await safeChannelFetch(endpoint, {
                headers: { 'user-agent': 'Mozilla/5.0 (compatible; TeoStudioBot/1.0)', 'accept': 'application/json,text/plain,*/*' },
                redirect: 'follow'
              });
              if (!ar.ok) continue;
              const aj = await ar.text();
              title = title || pick(aj, /["']nickname["']\s*[:=]\s*["']([^"']+)/i);
              handle = handle || pick(aj, /["']unique[_-]?id["']\s*[:=]\s*["']([^"']+)/i);
              followers = followers || pick(aj, /["']follower[_-]?count["']\s*[:=]\s*([0-9]+)/i);
              image = image || pick(aj, /["']avatar(?:Larger|Medium|Thumb)?["']\s*[:=]\s*["']([^"']+)/i);
            } catch (lookupError) { /* Ignore this endpoint and try the next one. */ }
          }
        }
        title=title||pick(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i)||pick(html,/<title[^>]*>([^<]+)<\/title>/i);
        image=image||pick(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i);
        title=title||pick(html,/["']nickname["']\s*[:=]\s*["']([^"']+)/i);
        handle=handle||pick(html,/["']unique[_-]?id["']\s*[:=]\s*["']([^"']+)/i);
        image=image||pick(html,/["']avatar(?:Larger|Medium|Thumb)?["']\s*[:=]\s*["'](https?:\/\/[^"']+)/i);
        followers=cleanCount(followers||pick(html,/["']follower[_-]?count["']\s*[:=]\s*([0-9]+)/i)||pick(html,/(?:followers|followerCount|follower_count)[^0-9]{0,160}([0-9][0-9.,KMB]*)/i));
        if(handle&&!/^@/.test(handle))handle='@'+handle;
        title=String(title||profileHandle||'TikTok').replace(/\s*\|\s*TikTok.*$/i,'').trim();
        return J({ok:true,platform:'tiktok',url:u.toString(),title,image,description:'',followers,handle});
      }
      title=pick(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i)||pick(html,/<title[^>]*>([^<]+)<\/title>/i);
      image=pick(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i);
      const channelName=pick(html,/["']channelName["']\s*[:=]\s*["']([^"']+)\s*["']/i)||pick(html,/["']title["']\s*:\s*\{\s*["']runs["']\s*:\s*\[\s*\{\s*["']text["']\s*:\s*["']([^"']+)/i);
      title=channelName||title;
      followers=cleanCount(pick(html,/["']subscriberCountText["'][^{}]{0,160}["']simpleText["']\s*:\s*["']([^"']+)["']/i)||pick(html,/["']subscriberCountText["'][^{}]{0,160}["']text["']\s*:\s*["']([^"']+)["']/i)||pick(html,/(?:subscribers|subscriberCount)[^0-9]{0,160}([0-9][0-9.,KMB]*\s*(?:subscribers|người đăng ký)?)/i));
      handle=decode((u.pathname.match(/@[^/]+/)||[])[0]||'');
      return J({ok:true,platform:'youtube',url:u.toString(),title,image,description:pick(html,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),followers,handle});
    }catch(x){return J({ok:false,error:'CHANNEL_LOOKUP_FAILED',detail:String(x?.message||x)},502)}
  }
  if(p==='/api/comments'&&r.method==='GET')return J({ok:true,comments:await comments(e)});
  if(p==='/api/comments'&&r.method==='POST'){
    const rl=commentRateResponse(r);if(rl)return rl;const buyer=await buyerFromRequest(r,e);if(!buyer)return J({ok:false,error:'ACCOUNT_REQUIRED',message:'Đăng nhập tài khoản TeoStudio để bình luận.'},401);if(Number(buyer.email_verified)!==1)return J({ok:false,error:'EMAIL_VERIFICATION_REQUIRED',message:'Hãy xác minh email trước khi bình luận.'},403);
    const b=await r.json().catch(()=>({})),cap=await verifyTurnstile(e,b.turnstileToken,r);if(!cap.ok)return J({ok:false,error:'TURNSTILE_REQUIRED',message:'Hãy xác minh chống bot trước khi bình luận.'},400);
    const text=clean(b.text,700),image=b.image?safeCommentImage(b.image):'';if(b.image&&!image)return J({ok:false,error:'INVALID_COMMENT_IMAGE',message:'Ảnh không hợp lệ hoặc quá lớn. Chỉ nhận ảnh JPEG/PNG/WebP đã nén, tối đa khoảng 330 KB.'},400);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);
    const id=crypto.randomUUID(),eventId=crypto.randomUUID(),ip=clientIp(r)||'unknown',email=String(buyer.email_normalized||buyer.email).toLowerCase(),visible=image?0:1,withImage=image?1:0;
    try{await e.DB.batch([
      e.DB.prepare(`INSERT INTO comment_rate_events(id,buyer_id,client_ip,has_image) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND created_at>=datetime('now','-60 seconds'))<2 AND (SELECT COUNT(*) FROM comment_rate_events WHERE client_ip=? AND created_at>=datetime('now','-60 seconds'))<5 AND (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND created_at>=datetime('now','+7 hours','start of day','-7 hours'))<10 AND (?=0 OR (SELECT COUNT(*) FROM comment_rate_events WHERE buyer_id=? AND has_image=1 AND created_at>=datetime('now','+7 hours','start of day','-7 hours'))<5)`).bind(eventId,buyer.id,ip,withImage,buyer.id,ip,buyer.id,withImage,buyer.id),
      e.DB.prepare(`INSERT INTO comments(id,name,text,image,visible,buyer_id,email_normalized,client_ip) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM comment_rate_events WHERE id=?)`).bind(id,clean(buyer.display_name,80),text,image,visible,buyer.id,email,ip,eventId)
    ]);
    const ev=await e.DB.prepare('SELECT id FROM comment_rate_events WHERE id=?').bind(eventId).first();if(!ev)return J({ok:false,error:'COMMENT_RATE_LIMITED',message:image?'Mỗi tài khoản được đăng tối đa 5 ảnh/ngày, 2 bình luận/phút và 10 bình luận/ngày.':'Bạn đã bình luận quá nhiều. Hãy thử lại sau.'},429);
    const exists=await e.DB.prepare('SELECT id FROM comments WHERE id=?').bind(id).first();if(!exists)return J({ok:false,error:'COMMENT_SAVE_FAILED'},500);
    return J({ok:true,id,requiresModeration:!!image,message:image?'Đã nhận bình luận; ảnh đang chờ Admin kiểm duyệt trước khi công khai.':'Đã đăng bình luận.'},201)
    }catch{return J({ok:false,error:'COMMENT_SAVE_FAILED',message:'Chưa lưu được bình luận. Hãy thử lại sau.'},500)}
  }
  if(p==='/api/track/site'&&r.method==='POST'){await bumpView(e,'site','',u.searchParams.get('source')||'');return J({ok:true})}
  let tv=p.match(/^\/api\/track\/product\/([^/]+)$/);if(tv&&r.method==='POST'){const id=decodeURIComponent(tv[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'product',id,u.searchParams.get('source')||'');return J({ok:true,views:Number(product.views||0)+1})}
  let to=p.match(/^\/api\/track\/outbound\/([^/]+)$/);if(to&&r.method==='POST'){const id=decodeURIComponent(to[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'outbound',id,u.searchParams.get('source')||'');return J({ok:true})}
  if(p==='/api/tenant/security-login'&&r.method==='POST'){const rl=limited(r,'tenant-security-login',8,60000);if(rl)return rl;
    try{
      await ensureTenantSchema(e);
      const b=await r.json().catch(()=>({}));
      const identifier=clean(b.tenant||b.id||b.slug||'',100), pass=String(b.password||'');
      if(!identifier||!pass)return J({ok:false,error:'SECURITY_PASSWORD_REQUIRED'},400);
      const raw=await tenantByIdentifier(e,identifier);
      if(!raw)return J({ok:false,error:'INVALID_SECURITY_LOGIN'},401);
      let t=await normalizeTenantRow(e,raw);t=await refreshTenantPlan(e,t);const st=tenantStatus(t);
      if(st==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
      if(st==='expired'&&String(t.plan_type||'paid')!=='free')return J({ok:false,error:'TENANT_EXPIRED'},403);
      if(!String(t.admin_confirm_password_hash||''))return J({ok:false,error:'SECURITY_PASSWORD_NOT_SET'},409);
      if(String(t.admin_confirm_password_hash)!==await sha256(pass))return J({ok:false,error:'INVALID_SECURITY_PASSWORD'},401);
      const token=crypto.randomUUID()+crypto.randomUUID();
      const sessionTenantId=clean(t?.id??t?.tenant_id??t?.slug,100);
      if(!sessionTenantId)return J({ok:false,error:'TENANT_KEY_MISSING'},500);
      await e.DB.prepare('INSERT INTO tenant_sessions(token,tenant_id,expires_at) VALUES(?,?,?)').bind(token,sessionTenantId,Date.now()+7*86400000).run();
      return J({ok:true,token,tenant:tenantInfo(t),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(t.slug)}`});
    }catch(x){return J({ok:false,error:'TENANT_SECURITY_LOGIN_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  if(p==='/api/tenant/login'&&r.method==='POST'){const rl=limited(r,'tenant-login',8,60000);if(rl)return rl;
    try{
      await ensureTenantSchema(e);
      const b=await r.json().catch(()=>({}));
      const identifier=b.tenant||b.id||b.slug||'';
      const t0=await tenantByLogin(e,identifier,b.password);
      if(!t0)return J({ok:false,error:'INVALID_LOGIN'},401);
      let t=await normalizeTenantRow(e,t0);t=await refreshTenantPlan(e,t);
      const st=tenantStatus(t);
      if(st==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
      if(st==='expired'&&String(t.plan_type||'paid')!=='free')return J({ok:false,error:'TENANT_EXPIRED'},403);
      if(!(await tenantPasswordMatches(e,t,b.password)))return J({ok:false,error:'INVALID_LOGIN'},401);
      const token=crypto.randomUUID()+crypto.randomUUID();
      const sessionTenantId=clean(t?.id??t?.tenant_id??t?.slug,100);
      if(!sessionTenantId)return J({ok:false,error:'TENANT_KEY_MISSING'},500);
      await e.DB.prepare('INSERT INTO tenant_sessions(token,tenant_id,expires_at) VALUES(?,?,?)').bind(token,sessionTenantId,Date.now()+7*86400000).run();
      return J({ok:true,token,tenant:tenantInfo(t),adminUrl:`${PUBLIC_ORIGIN}/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`${PUBLIC_ORIGIN}/share.html?tenant=${encodeURIComponent(t.slug)}`});
    }catch(x){return J({ok:false,error:'TENANT_LOGIN_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  if(p.match(/^\/api\/og\/tenant\/[^/]+$/)&&r.method==='GET'){
    try{
      await ensureTenantSchema(e);const slug=clean(p.split('/').pop(),80),raw=await tenantBySlug(e,slug),t=await normalizeTenantRow(e,raw);
      if(!t)return new Response('Not found',{status:404});
      const s=await tenantSettings(e,t);const src=String(s.avatar||s.heroBackground||'');
      if(/^https?:\/\//i.test(src))return Response.redirect(src,302);
      const m=src.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if(m){const bin=atob(m[2]);if(bin.length>4000000)return new Response('Image too large',{status:413});const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Response(bytes,{headers:{'content-type':m[1],'cache-control':'public, max-age=300'}})}
      if(e.ASSETS&&src&&!/^https?:/i.test(src)){try{const ar=await e.ASSETS.fetch(new Request(new URL(src.replace(/^\//,''),r.url)));if(ar.ok&&String(ar.headers.get('content-type')||'').startsWith('image/'))return new Response(ar.body,{status:200,headers:{'content-type':ar.headers.get('content-type')||'image/png','cache-control':'public, max-age=300'}})}catch{}}
      const svg=`<svg xmlns=\"http://www.w3.org/2000/svg\" width=1200 height=630 viewBox=\"0 0 1200 630\"><rect width=\"1200\" height=\"630\" fill=\"#0b0b12\"/><text x=\"70\" y=\"270\" fill=\"#fff\" font-size=\"72\" font-family=\"Arial,sans-serif\" font-weight=\"700\">${String(t.slug).replace(/[&<>]/g,'')}</text><text x=\"70\" y=\"345\" fill=\"#a78bfa\" font-size=\"34\" font-family=\"Arial,sans-serif\">Téo Studio · Share File</text></svg>`;
      return new Response(svg,{headers:{'content-type':'image/svg+xml;charset=utf-8','cache-control':'public, max-age=300'}});
    }catch{return new Response('Not found',{status:404})}
  }
  if(p==='/share.html'&&r.method==='GET'){
    const crawler=/facebookexternalhit|Facebot|Twitterbot|TelegramBot|WhatsApp|Discordbot|Slackbot|Googlebot|Zalo(?:Bot)?|ZaloPC|LinkedInBot|Pinterestbot|Viber|Line\//i.test(ua);
    if(crawler && e.ASSETS){try{await ensureTenantSchema(e);const slug=clean(new URL(r.url).searchParams.get('tenant')||'',80);const raw=await tenantBySlug(e,slug),t=await normalizeTenantRow(e,raw);const s=t?await tenantSettings(e,t):{};const base=PUBLIC_ORIGIN;const title=String(s.heroTitle||s.siteName||t?.slug||'Share File — Téo Studio').replace(/[<>]/g,'');const desc=String(s.heroText||'Kho file riêng của bạn.').replace(/[<>]/g,'');const img=base+'/api/og/tenant/'+encodeURIComponent(slug);let rr=await e.ASSETS.fetch(new Request(new URL('/share.html',r.url),r));let html=await rr.text();const meta=`<meta name=\"description\" content=\"${desc.replace(/\"/g,'&quot;')}\"><meta property=\"og:type\" content=\"website\"><meta property=\"og:title\" content=\"${title.replace(/\"/g,'&quot;')}\"><meta property=\"og:description\" content=\"${desc.replace(/\"/g,'&quot;')}\"><meta property=\"og:image\" content=\"${img}\"><meta property=\"og:url\" content=\"${r.url}\"><meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\"${title.replace(/\"/g,'&quot;')}\"><meta name=\"twitter:description\" content=\"${desc.replace(/\"/g,'&quot;')}\"><meta name=\"twitter:image\" content=\"${img}\">`;html=html.replace('</head>',meta+'</head>');return new Response(html,{status:rr.status,headers:{'content-type':'text/html;charset=UTF-8','cache-control':'public, max-age=60'}})}catch{}}
  }
  if(p.startsWith('/api/public-tenant/'))return await handleTenantPublic(r,e);
  if(p==='/api/admin/notifications'||p==='/api/admin/notifications/read'){
    if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
    await ensureNotificationsSchema(e);
    if(p==='/api/admin/notifications'&&r.method==='GET'){
      const notifications=await notificationList(e,'admin','master');
      return J({ok:true,notifications,unread:notifications.filter(x=>!x.read_at).length});
    }
    if(p==='/api/admin/notifications/read'&&r.method==='POST'){
      const b=await r.json().catch(()=>({}));
      if(b.all===true)await e.DB.prepare("UPDATE web_notifications SET read_at=datetime('now') WHERE recipient_type='admin' AND recipient_id='master' AND read_at IS NULL").run();
      else if(b.id)await e.DB.prepare("UPDATE web_notifications SET read_at=datetime('now') WHERE id=? AND recipient_type='admin' AND recipient_id='master' AND read_at IS NULL").bind(clean(b.id,100)).run();
      return J({ok:true});
    }
  }
  if(p.startsWith('/api/tenant/')&&p!=='/api/tenant/login')return await handleTenantAdmin(r,e);
  if(p.startsWith('/api/admin/tenants'))return await handleMasterTenant(r,e);
  if(p.startsWith('/api/admin/withdrawals')){
    if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
    await ensureTenantSchema(e);
    if(p==='/api/admin/withdrawals'&&r.method==='GET'){
      const status=clean(new URL(r.url).searchParams.get('status')||'',20);const where=status? 'WHERE w.status=?':'';
      const rows=(await e.DB.prepare(`SELECT w.*,a.slug,a.id AS tenant_key FROM tenant_withdrawals w LEFT JOIN tenant_accounts a ON (a.id=w.tenant_id OR a.slug=w.tenant_id) ${where} ORDER BY CASE w.speed WHEN 'priority' THEN 0 ELSE 1 END,w.created_at ASC LIMIT 300`).bind(...(status?[status]:[])).all()).results||[];
      return J({ok:true,withdrawals:rows.map(x=>({...x,payout:JSON.parse(x.payout_snapshot||'{}')}))});
    }
    const mm=p.match(/^\/api\/admin\/withdrawals\/([^/]+)\/(approve|paid|reject)$/);
    if(mm&&r.method==='POST'){
      const id=decodeURIComponent(mm[1]),action=mm[2],b=await r.json().catch(()=>({}));const w=await e.DB.prepare('SELECT * FROM tenant_withdrawals WHERE id=?').bind(id).first();if(!w)return J({ok:false,error:'WITHDRAWAL_NOT_FOUND'},404);
      if(action==='approve'){
        if(w.status!=='pending')return J({ok:false,error:'INVALID_WITHDRAWAL_STATUS'},409);
        const actionResult=await e.DB.prepare("UPDATE tenant_withdrawals SET status='approved',admin_note=?,reviewed_at=datetime('now') WHERE id=? AND status='pending'").bind(clean(b.note,500),id).run();if(!actionResult?.meta?.changes)return J({ok:false,error:'WITHDRAWAL_STATUS_RACE'},409);
      }else if(action==='paid'){
        if(!['approved','pending'].includes(w.status))return J({ok:false,error:'INVALID_WITHDRAWAL_STATUS'},409);
        const actionResult=await e.DB.prepare("UPDATE tenant_withdrawals SET status='paid',admin_note=?,paid_at=datetime('now'),reviewed_at=COALESCE(reviewed_at,datetime('now')) WHERE id=? AND status IN ('approved','pending')").bind(clean(b.note,500),id).run();if(!actionResult?.meta?.changes)return J({ok:false,error:'WITHDRAWAL_STATUS_RACE'},409);
      }else{
        if(['paid','rejected'].includes(w.status))return J({ok:false,error:'INVALID_WITHDRAWAL_STATUS'},409);
        const actionResult=await e.DB.prepare("UPDATE tenant_withdrawals SET status='rejected',admin_note=?,reviewed_at=datetime('now') WHERE id=? AND status IN ('pending','approved')").bind(clean(b.note,500),id).run();if(!actionResult?.meta?.changes)return J({ok:false,error:'WITHDRAWAL_STATUS_RACE'},409);
        await e.DB.prepare("INSERT OR IGNORE INTO tenant_wallet_ledger(id,tenant_id,amount_vnd,kind,ref_type,ref_id,note) VALUES(?,?,?,'withdrawal_refund','withdrawal',?,'Hoàn số dư do yêu cầu rút bị từ chối')").bind(crypto.randomUUID(),w.tenant_id,Number(w.gross_vnd),id).run();
      }
      const updated=await e.DB.prepare('SELECT * FROM tenant_withdrawals WHERE id=?').bind(id).first();
      const account=await e.DB.prepare('SELECT email,slug FROM tenant_accounts WHERE id=? OR slug=? LIMIT 1').bind(w.tenant_id,w.tenant_id).first().catch(()=>null);
      const recipient=validEmail(account?.email);
      const label=action==='approve'?'đã được duyệt':action==='paid'?'đã được đánh dấu thanh toán':'bị từ chối';
      const body=`Yêu cầu rút tiền ${id} ${label}.\nTenant: ${account?.slug||w.tenant_id}\nSố tiền gốc: ${Number(w.gross_vnd||0).toLocaleString('vi-VN')} ₫\nPhí: ${Number(w.fee_vnd||0).toLocaleString('vi-VN')} ₫\nThực nhận: ${Number(w.payout_vnd||0).toLocaleString('vi-VN')} ₫\nTrạng thái: ${updated?.status||action}\n${updated?.admin_note?`Ghi chú: ${updated.admin_note}`:''}`;
      await createNotification(e,{recipientType:'tenant',recipientId:w.tenant_id,title:`Yêu cầu rút tiền ${label}`,body:`Mã: ${id}. Số tiền: ${Number(w.gross_vnd||0).toLocaleString('vi-VN')} ₫. Trạng thái: ${updated?.status||action}. ${updated?.admin_note?`Ghi chú: ${updated.admin_note}`:''}`,kind:'withdrawal'});
      await createNotification(e,{recipientType:'admin',recipientId:'master',title:`Yêu cầu rút tiền ${label}`,body:`Tenant ${account?.slug||w.tenant_id}, mã ${id}, số tiền ${Number(w.gross_vnd||0).toLocaleString('vi-VN')} ₫.`,kind:'withdrawal'});
      if(recipient)await notifyEmail(e,{to:recipient,subject:`Téo Studio: Yêu cầu rút tiền ${label}`,text:body});
      const adminTo=validEmail(e.EMAIL_ADMIN_TO||'teostudio@teostudio.top');
      if(adminTo)await notifyEmail(e,{to:adminTo,subject:`Téo Studio: Rút tiền ${label}`,text:body});
      return J({ok:true,emailNotified:!!recipient});
    }
    return J({ok:false,error:'NOT_FOUND'},404);
  }
  if(p==='/api/admin/logout'&&r.method==='POST'){const t=tokenFrom(r);if(t)await e.DB.prepare('DELETE FROM admin_sessions WHERE token=?').bind(t).run();return J({ok:true})}
  if(p.startsWith('/api/admin/')&&!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
  if(p==='/api/admin/config-status'&&r.method==='GET'){const status=runtimeConfigStatus(e);return J({ok:true,version:BUILD_VERSION,checkedAt:new Date().toISOString(),config:status})}
  if(p==='/api/admin/ai/test'&&r.method==='POST'){const rl=limited(r,'admin-ai-test',2,60000);if(rl)return rl;const status=runtimeConfigStatus(e).ai;if(!status.configured||!status.endpointValid)return J({ok:false,error:'AI_NOT_READY',message:'Thiếu cấu hình AI hoặc AI_API_URL không phải HTTPS hợp lệ.',missing:status.missing},503);try{const u=new URL(String(e.AI_API_URL));const resp=await fetch(u.toString(),{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+String(e.AI_API_KEY)},body:JSON.stringify({model:String(e.AI_MODEL),temperature:0,max_tokens:8,messages:[{role:'system',content:'Reply with exactly OK.'},{role:'user',content:'health-check'}]}),signal:AbortSignal.timeout(12000)});if(!resp.ok){try{await resp.body?.cancel()}catch{}return J({ok:false,error:'AI_PROVIDER_HTTP_ERROR',status:resp.status,message:'Nhà cung cấp AI từ chối yêu cầu. Kiểm tra URL, model, API key và hạn mức; response body không được ghi ra log.'},502)}const data=await resp.json().catch(()=>null);if(!data?.choices?.[0]?.message?.content)return J({ok:false,error:'AI_RESPONSE_FORMAT',message:'API phản hồi nhưng không đúng định dạng Chat Completions dự kiến.'},502);return J({ok:true,message:'Kết nối AI thành công.',version:BUILD_VERSION})}catch(err){return J({ok:false,error:err?.name==='TimeoutError'?'AI_PROVIDER_TIMEOUT':'AI_PROVIDER_UNREACHABLE',message:'Không kết nối được AI hoặc đã hết thời gian chờ. Kiểm tra endpoint và nhà cung cấp.'},502)}}
  if(p==='/api/admin/telegram/test'&&r.method==='POST'){const rl=limited(r,'admin-telegram-test',2,60000);if(rl)return rl;const status=runtimeConfigStatus(e).telegram;if(!status.configured)return J({ok:false,error:'TELEGRAM_NOT_CONFIGURED',message:'Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.',missing:status.missing},503);const sent=await telegramSend(e,'✅ Kiểm tra kết nối TeoStudio Telegram thành công. Version '+BUILD_VERSION);if(!sent.ok)return J({ok:false,error:'TELEGRAM_SEND_FAILED',message:'Telegram không nhận được tin nhắn. Kiểm tra bot token, chat ID và quyền gửi tin.'},502);return J({ok:true,message:'Đã gửi tin kiểm tra tới Telegram.'})}
  if(p==='/api/admin/security/blocks'&&r.method==='GET'){await ensureV55Schema(e);const rows=(await e.DB.prepare('SELECT id,kind,value_normalized,reason,created_by,created_at FROM security_blocks ORDER BY created_at DESC LIMIT 500').all()).results||[];return J({ok:true,blocks:rows})}
  if(p==='/api/admin/security/blocks'&&r.method==='POST'){
    const rl=limited(r,'admin-security-block-create',15,60000);if(rl)return rl;await ensureV55Schema(e);const b=await r.json().catch(()=>({}));const kind=String(b.kind||'').toLowerCase();let value='';if(kind==='ip')value=normalizeIpInput(b.value||'');else if(kind==='email')value=validEmail(b.value||'').toLowerCase();else return J({ok:false,error:'INVALID_BLOCK_KIND',message:'Chọn loại IP hoặc email.'},400);if(!value)return J({ok:false,error:'INVALID_BLOCK_VALUE',message:kind==='ip'?'Địa chỉ IP không hợp lệ.':'Email không hợp lệ.'},400);const id=crypto.randomUUID();try{await e.DB.prepare('INSERT INTO security_blocks(id,kind,value_normalized,reason,created_by) VALUES(?,?,?,?,?)').bind(id,kind,value,clean(b.reason||'',300),'admin').run()}catch(err){if(await e.DB.prepare('SELECT id FROM security_blocks WHERE kind=? AND value_normalized=?').bind(kind,value).first())return J({ok:false,error:'BLOCK_ALREADY_EXISTS',message:'Mục này đã bị chặn rồi.'},409);return J({ok:false,error:'BLOCK_SAVE_FAILED'},500)}SECURITY_BLOCK_CACHE.delete(kind+':'+value);return J({ok:true,id,kind,value,permanent:true,message:'Đã chặn vĩnh viễn. Gỡ chặn bằng nút Xóa trong danh sách.'},201)
  }
  const blockedEntry=p.match(/^\/api\/admin\/security\/blocks\/([^/]+)$/);if(blockedEntry&&r.method==='DELETE'){await ensureV55Schema(e);const id=clean(decodeURIComponent(blockedEntry[1]),100),row=await e.DB.prepare('SELECT kind,value_normalized FROM security_blocks WHERE id=?').bind(id).first();if(!row)return J({ok:false,error:'BLOCK_NOT_FOUND'},404);await e.DB.prepare('DELETE FROM security_blocks WHERE id=?').bind(id).run();SECURITY_BLOCK_CACHE.delete(row.kind+':'+row.value_normalized);return J({ok:true,removed:true})}
  if(p==='/api/admin/email/test'&&r.method==='POST'){
    const rl=limited(r,'admin-email-test',3,60000);if(rl)return rl;
    const b=await r.json().catch(()=>({})),to=validEmail(b.to||e.EMAIL_ADMIN_TO||'teostudio@teostudio.top');
    if(!to)return J({ok:false,error:'INVALID_EMAIL'},400);
    const result=await notifyEmail(e,{to,subject:'Kiểm tra email Téo Studio',text:`Email kiểm tra gửi từ Téo Studio đã được gửi lúc ${new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}.\n\nNếu bạn nhận được thư này, cấu hình SMTP của Worker đã gửi thư thành công.`});
    if(!result.ok)return J({ok:false,error:'EMAIL_SEND_FAILED',detail:result.error},502);
    return J({ok:true,message:'SMTP đã chấp nhận email kiểm tra.',to});
  }
  if(p==='/api/admin/stats'&&r.method==='GET')return J({ok:true,...await stats(e,new URL(r.url).searchParams.get('days')||30)});
  if(p==='/api/admin/comments'&&r.method==='GET')return J({ok:true,comments:(await e.DB.prepare('SELECT id,name,text,image,created_at,visible FROM comments ORDER BY created_at DESC').all()).results||[]});
  let cm=p.match(/^\/api\/admin\/comments\/([^/]+)$/);if(cm){const id=cm[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json().catch(()=>({}));if(typeof b.visible!=='boolean')return J({ok:false,error:'VISIBLE_REQUIRED'},400);await e.DB.prepare('UPDATE comments SET visible=? WHERE id=?').bind(b.visible?1:0,id).run();return J({ok:true,visible:b.visible})}}
  if(p==='/api/admin/products'&&r.method==='GET')return J({ok:true,products:await adminProducts(e)});
  async function readMasterProductBody(b){const mode=['free','both','paid'].includes(String(b.sale_mode||'free'))?String(b.sale_mode||'free'):'free',freeMode=String(b.free_link_mode||'direct')==='unlock'?'unlock':'direct';const dl0=safeHttpUrl(b.download_link,10000),original0=safeHttpUrl(b.original_link,10000);const thumb=safeImageValue(b.thumb,1500000);const price=Math.max(0,Math.min(100000000,Math.floor(Number(b.price_vnd)||0)));if(!clean(b.title,200))throw new Error('title_required');if(b.thumb&&!thumb)throw new Error('INVALID_THUMB_URL');if(mode==='free'&&!dl0)throw new Error('INVALID_DOWNLOAD_URL');if(mode==='both'&&(!dl0||!original0))throw new Error('FREE_AND_PAID_LINKS_REQUIRED');if(mode==='paid'&&!((original0||dl0)))throw new Error('PAID_LINK_REQUIRED');if(mode!=='free'&&price<1000)throw new Error('PRICE_TOO_LOW');return {title:clean(b.title,200),game:clean(b.game,100),description:clean(b.description),thumb,download_link:mode==='paid'?(original0||dl0):dl0,original_link:mode==='free'?'':(original0||dl0),warning:clean(b.warning),sale_mode:mode,free_link_mode:freeMode,price_vnd:mode==='free'?0:price}}
  if(p==='/api/admin/products'&&r.method==='POST'){const b=await r.json().catch(()=>({}));let d;try{d=await readMasterProductBody(b)}catch(err){return J({ok:false,error:String(err.message||err)},400)}const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO products(id,title,game,description,thumb,download_link,warning,visible,sale_mode,free_link_mode,original_link,price_vnd) VALUES(?,?,?,?,?,?,?,1,?,?,?,?)').bind(id,d.title,d.game,d.description,d.thumb,d.download_link,d.warning,d.sale_mode,d.free_link_mode,d.original_link,d.price_vnd).run();return J({ok:true,id},201)}
  let m=p.match(/^\/api\/admin\/products\/([^/]+)$/);if(m){const id=m[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json().catch(()=>({}));if(Object.keys(b).length===1&&typeof b.visible==='boolean'){await e.DB.prepare(`UPDATE products SET visible=?,updated_at=datetime('now') WHERE id=?`).bind(b.visible?1:0,id).run();return J({ok:true,visible:b.visible})}let d;try{d=await readMasterProductBody(b)}catch(err){return J({ok:false,error:String(err.message||err)},400)}await e.DB.prepare(`UPDATE products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,sale_mode=?,free_link_mode=?,original_link=?,price_vnd=?,visible=COALESCE(?,visible),updated_at=datetime('now') WHERE id=?`).bind(d.title,d.game,d.description,d.thumb,d.download_link,d.warning,d.sale_mode,d.free_link_mode,d.original_link,d.price_vnd,typeof b.visible==='boolean'?(b.visible?1:0):null,id).run();return J({ok:true})}}
  if(p==='/api/admin/tags'&&r.method==='POST'){const b=await r.json(),name=clean(b.name,100),parentId=clean(b.parent_id,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tags(id,name,parent_id) VALUES(?,?,?)').bind(id,name,parentId||null).run();return J({ok:true,id},201)}
  let t=p.match(/^\/api\/admin\/tags\/([^/]+)$/);if(t){const id=t[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM tags WHERE id=? OR parent_id=?').bind(id,id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE tags SET name=?,parent_id=? WHERE id=?').bind(clean(b.name,100),clean(b.parent_id,100)||null,id).run();return J({ok:true})}}
  if(p==='/api/admin/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/admin/settings'&&r.method==='PUT'){const b=await r.json().catch(()=>({}));for(const [k,v0] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','heroBackground','announcementTitle','announcementText','announcementEnabled','groupLink','adminContact','rentZalo','donateTitle','donateText','donateQr','socialTikTokUrl','socialYoutubeUrl','socialTikTokMeta','socialYoutubeMeta','themeConfig'].includes(k))continue;let v=v0;if(['groupLink','adminContact','rentZalo','socialTikTokUrl','socialYoutubeUrl'].includes(k)){v=safeOptionalLink(v0,4000);if(v0&&v0!=='#'&&!v)return J({ok:false,error:'INVALID_SETTING_URL',field:k},400)}if(['avatar','donateQr'].includes(k)&&v0){v=safeImageValue(v0,1500000);if(!v)return J({ok:false,error:'INVALID_IMAGE',field:k},400)}await e.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,JSON.stringify(v)).run()}return J({ok:true})}
  if(e.ASSETS){const asset=await e.ASSETS.fetch(r);const headers=new Headers(asset.headers);for(const [k,v] of Object.entries({'x-content-type-options':'nosniff','x-frame-options':'SAMEORIGIN','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(),microphone=(),geolocation=()','x-permitted-cross-domain-policies':'none','cross-origin-opener-policy':'same-origin'}))headers.set(k,v);if(/\.html?$/i.test(p)||!p.includes('.'))headers.set('cache-control','no-store');else if(p.startsWith('/assets/'))headers.set('cache-control','public, max-age=3600, stale-while-revalidate=86400');return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers})}return J({ok:false,error:'NOT_FOUND'},404)
}catch(x){console.error('TeoStudio Worker request failed',String(x?.name||'Error'),String(x?.message||'unknown'));return J({ok:false,error:'SERVER_ERROR'},500)}}};
