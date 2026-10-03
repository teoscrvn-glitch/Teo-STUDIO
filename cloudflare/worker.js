const C={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type,Authorization","cache-control":"no-store"};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:C});
const clean=(x,n=5000)=>String(x??'').trim().slice(0,n);
const tokenFrom=r=>(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();

const BOT_COOKIE='teo_bot_verified';
const BOT_ACTION='site-access';
const BOT_TTL=24*60*60*1000;

async function hmacHex(secret,message){
  const key=await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},
    false,
    ['sign']
  );
  const sig=await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function botCookieValid(r,e){
  const secret=String(e.TURNSTILE_SECRET||'');
  if(!secret)return false;

  const raw=(r.headers.get('cookie')||'')
    .split(';')
    .map(x=>x.trim())
    .find(x=>x.startsWith(BOT_COOKIE+'='));

  if(!raw)return false;

  const v=raw.slice(BOT_COOKIE.length+1);
  const [exp,sig]=v.split('.');
  const n=Number(exp);

  if(!Number.isFinite(n)||n<Date.now()||!sig)return false;

  return sig===(await hmacHex(secret,String(exp)));
}

function escHtml(x){
  return String(x??'').replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

function challengeResponse(r,e){
  const u=new URL(r.url);
  const redirect=u.pathname+u.search+u.hash||'/';
  const siteKey=escHtml(e.TURNSTILE_SITE_KEY||'');

  const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Xác minh truy cập</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d12;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.box{width:min(92vw,430px);padding:30px 24px;border:1px solid #252a35;border-radius:20px;background:#11151d;text-align:center;box-shadow:0 20px 60px #0008}h1{margin:0 0 10px;font-size:24px}p{margin:0 0 22px;color:#aeb5c2;line-height:1.5}.cf-turnstile{display:flex;justify-content:center;min-height:65px}.status{margin-top:16px;color:#aeb5c2;font-size:14px}.err{color:#ff7474}</style></head><body><main class="box"><h1>🛡️ Xác minh truy cập</h1><p>Vui lòng hoàn thành kiểm tra bảo mật để vào Téo Studio.</p>'+(!siteKey?'<div class="status err">Turnstile chưa được cấu hình.</div>':'<div class="cf-turnstile" data-sitekey="'+siteKey+'" data-action="'+BOT_ACTION+'" data-callback="onTurnstile"></div><div id="status" class="status">Đang chờ xác minh...</div>')+'</main><script>const redirect='+JSON.stringify(redirect)+';async function onTurnstile(token){const s=document.getElementById("status");if(s)s.textContent="Đang xác minh...";try{const r=await fetch("/api/verify-turnstile",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});const x=await r.json().catch(()=>({}));if(r.ok&&x.ok){location.replace(redirect);return}if(s){s.className="status err";s.textContent="Xác minh thất bại, hãy thử lại."}if(window.turnstile)window.turnstile.reset()}catch{if(s){s.className="status err";s.textContent="Không thể kết nối máy chủ. Hãy thử lại."}if(window.turnstile)window.turnstile.reset()}}</script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></body></html>';

  return new Response(html,{
    status:403,
    headers:{
      'content-type':'text/html;charset=utf-8',
      'cache-control':'no-store'
    }
  });
}

async function verifyTurnstile(r,e){
  const secret=String(e.TURNSTILE_SECRET||'');
  const siteKey=String(e.TURNSTILE_SITE_KEY||'');

  if(!secret||!siteKey){
    return J({ok:false,error:'TURNSTILE_NOT_CONFIGURED'},500);
  }

  const b=await r.json().catch(()=>({}));
  const token=typeof b.token==='string'?b.token.trim():'';

  if(!token||token.length>2048){
    return J({ok:false,error:'INVALID_TURNSTILE_TOKEN'},400);
  }

  try{
    const vr=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        secret,
        response:token,
        remoteip:r.headers.get('CF-Connecting-IP')||''
      })
    });

    const result=await vr.json().catch(()=>({success:false}));
    const hostname=new URL(r.url).hostname;

    if(!vr.ok||!result.success||result.action!==BOT_ACTION||result.hostname!==hostname){
      return J({ok:false,error:'TURNSTILE_FAILED'},403);
    }

    const exp=Date.now()+BOT_TTL;
    const sig=await hmacHex(secret,String(exp));

    return new Response(
      JSON.stringify({ok:true,expiresIn:BOT_TTL}),
      {
        headers:{
          ...C,
          'set-cookie':BOT_COOKIE+'='+exp+'.'+sig+'; Max-Age='+Math.floor(BOT_TTL/1000)+'; Path=/; Secure; HttpOnly; SameSite=Lax'
        }
      }
    );
  }catch{
    return J({ok:false,error:'TURNSTILE_VERIFY_ERROR'},502);
  }
}
let schemaReady=null;
async function sha256(s){const b=new TextEncoder().encode(s);const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function ensureSchema(e){
  if(schemaReady)return schemaReady;
  schemaReady=(async()=>{
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_auth (id INTEGER PRIMARY KEY CHECK(id=1), password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now')), updated_at TEXT NOT NULL DEFAULT(datetime('now')))`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, name TEXT NOT NULL, text TEXT NOT NULL, image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')), visible INTEGER NOT NULL DEFAULT 1)`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS view_daily (day TEXT NOT NULL, kind TEXT NOT NULL, product_id TEXT NOT NULL DEFAULT '', views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,kind,product_id))`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_view_daily_day ON view_daily(day)`).run();
    try{await e.DB.prepare(`ALTER TABLE tags ADD COLUMN parent_id TEXT DEFAULT NULL`).run()}catch{}
    try{await e.DB.prepare(`ALTER TABLE settings ADD COLUMN value TEXT`).run()}catch{}
    const row=await e.DB.prepare('SELECT id FROM admin_auth WHERE id=1').first();
    if(!row)await e.DB.prepare('INSERT INTO admin_auth(id,password_hash) VALUES(1,?)').bind(await sha256('123456')).run();
  })();
  return schemaReady;
}
async function isAdmin(r,e){const t=tokenFrom(r);if(!t)return false;await ensureSchema(e);const x=await e.DB.prepare('SELECT token FROM admin_sessions WHERE token=? AND expires_at>?').bind(t,Date.now()).first();return !!x}
async function settings(e){const a=(await e.DB.prepare('SELECT key,value FROM settings').all()).results||[];const s={};for(const x of a){if(['adminPasswordHash'].includes(x.key))continue;try{s[x.key]=JSON.parse(x.value)}catch{s[x.key]=x.value}}return s}
async function tags(e){return (await e.DB.prepare('SELECT id,name,parent_id,created_at FROM tags ORDER BY CASE WHEN parent_id IS NULL OR parent_id=\'\' THEN 0 ELSE 1 END,name COLLATE NOCASE').all()).results||[]}
async function products(e){return (await e.DB.prepare('SELECT * FROM products WHERE visible=1 ORDER BY updated_at DESC').all()).results||[]}
async function adminProducts(e){return (await e.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all()).results||[]}
async function productById(e,id){return await e.DB.prepare('SELECT * FROM products WHERE id=? AND visible=1').bind(id).first()}
function dayVN(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
async function bumpView(e,kind,productId=''){
  const day=dayVN();
  await e.DB.prepare(`INSERT INTO view_daily(day,kind,product_id,views) VALUES(?,?,?,1) ON CONFLICT(day,kind,product_id) DO UPDATE SET views=views+1`).bind(day,kind,productId).run();
  if(kind==='product'&&productId)await e.DB.prepare('UPDATE products SET views=COALESCE(views,0)+1 WHERE id=?').bind(productId).run();
}
async function comments(e){return (await e.DB.prepare('SELECT id,name,text,image,created_at FROM comments WHERE visible=1 ORDER BY created_at DESC LIMIT 50').all()).results||[]}
async function stats(e,days=30){const n=Math.max(7,Math.min(Number(days)||30,365));const rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM view_daily WHERE day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(dayVN(),n-1).all()).results||[];const prods=await e.DB.prepare('SELECT id,title,views FROM products ORDER BY views DESC,updated_at DESC').all();return {days:n,rows,products:prods.results||[],today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)} }
export default{async fetch(r,e){if(r.method==='OPTIONS')return new Response(null,{headers:C});const u=new URL(r.url),p=u.pathname.replace(/\/$/,'');try{

    if(p==='/api/verify-turnstile'&&r.method==='POST'){
      return await verifyTurnstile(r,e);
    }

    // Health stays public so it can be used for a basic uptime check.
    if(p!=='/api/health'&&!(await botCookieValid(r,e))){
      return challengeResponse(r,e);
    }
  await ensureSchema(e);
  if(p==='/api/health')return J({ok:true,service:'teo-studio-api-mini',version:'3.0',auth:'d1-session'});
  if(p==='/api/products'&&r.method==='GET')return J({ok:true,products:await products(e)});
  if(p.match(/^\/api\/products\/[^/]+$/)&&r.method==='GET'){const id=decodeURIComponent(p.split('/').pop());const product=await productById(e,id);return product?J({ok:true,product}):J({ok:false,error:'NOT_FOUND'},404)}
  if(p==='/api/tags'&&r.method==='GET')return J({ok:true,tags:await tags(e)});
  if(p==='/api/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/comments'&&r.method==='GET')return J({ok:true,comments:await comments(e)});
  if(p==='/api/comments'&&r.method==='POST'){const b=await r.json().catch(()=>({}));const name=clean(b.name,40)||'Ẩn danh';const text=clean(b.text,700);const image=clean(b.image,1000000);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO comments(id,name,text,image) VALUES(?,?,?,?)').bind(id,name,text,image).run();return J({ok:true,id},201)}
  if(p==='/api/track/site'&&r.method==='POST'){await bumpView(e,'site');return J({ok:true})}
  let tv=p.match(/^\/api\/track\/product\/([^/]+)$/);if(tv&&r.method==='POST'){const id=decodeURIComponent(tv[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'product',id);return J({ok:true,views:Number(product.views||0)+1})}
  let to=p.match(/^\/api\/track\/outbound\/([^/]+)$/);if(to&&r.method==='POST'){const id=decodeURIComponent(to[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'outbound',id);return J({ok:true})}
  if(p==='/api/admin/login'&&r.method==='POST'){const b=await r.json().catch(()=>({}));const ok=(await sha256(clean(b.password,200)))===(await e.DB.prepare('SELECT password_hash FROM admin_auth WHERE id=1').first()).password_hash;if(!ok)return J({ok:false,error:'INVALID_PASSWORD'},401);const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO admin_sessions(token,expires_at) VALUES(?,?)').bind(token,Date.now()+7*24*60*60*1000).run();return J({ok:true,token,expiresIn:7*24*60*60*1000})}
  if(p==='/api/admin/logout'&&r.method==='POST'){const t=tokenFrom(r);if(t)await e.DB.prepare('DELETE FROM admin_sessions WHERE token=?').bind(t).run();return J({ok:true})}
  if(p==='/api/admin/change-password'&&r.method==='POST'){if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);const b=await r.json().catch(()=>({}));if(!b.newPassword||String(b.newPassword).length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);await e.DB.prepare('UPDATE admin_auth SET password_hash=?,updated_at=datetime(\'now\') WHERE id=1').bind(await sha256(String(b.newPassword))).run();return J({ok:true})}
  if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
  if(p==='/api/admin/stats'&&r.method==='GET')return J({ok:true,...await stats(e,new URL(r.url).searchParams.get('days')||30)});
  if(p==='/api/admin/comments'&&r.method==='GET')return J({ok:true,comments:await comments(e)});
  let cm=p.match(/^\/api\/admin\/comments\/([^/]+)$/);if(cm){const id=cm[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();return J({ok:true})}}
  if(p==='/api/admin/products'&&r.method==='GET')return J({ok:true,products:await adminProducts(e)});
  if(p==='/api/admin/products'&&r.method==='POST'){const b=await r.json();if(!b.title||!b.download_link)return J({ok:false,error:'title_and_download_link_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO products(id,title,game,description,thumb,download_link,warning,visible) VALUES(?,?,?,?,?,?,?,1)').bind(id,clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning)).run();return J({ok:true,id},201)}
  let m=p.match(/^\/api\/admin\/products\/([^/]+)$/);if(m){const id=m[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,updated_at=datetime(\'now\') WHERE id=?').bind(clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning),id).run();return J({ok:true})}}
  if(p==='/api/admin/tags'&&r.method==='POST'){const b=await r.json(),name=clean(b.name,100),parentId=clean(b.parent_id,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tags(id,name,parent_id) VALUES(?,?,?)').bind(id,name,parentId||null).run();return J({ok:true,id},201)}
  let t=p.match(/^\/api\/admin\/tags\/([^/]+)$/);if(t){const id=t[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM tags WHERE id=? OR parent_id=?').bind(id,id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE tags SET name=?,parent_id=? WHERE id=?').bind(clean(b.name,100),clean(b.parent_id,100)||null,id).run();return J({ok:true})}}
  if(p==='/api/admin/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/admin/settings'&&r.method==='PUT'){const b=await r.json();for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','announcementTitle','announcementText','announcementEnabled','groupLink','adminContact','donateTitle','donateText','donateQr'].includes(k))continue;await e.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,JSON.stringify(v)).run()}return J({ok:true})}
  if(e.ASSETS)return e.ASSETS.fetch(r);return J({ok:false,error:'NOT_FOUND'},404)
}catch(x){return J({ok:false,error:'SERVER_ERROR',detail:String(x.message||x)},500)}}};
