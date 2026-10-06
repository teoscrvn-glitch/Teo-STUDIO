const C={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type,Authorization","cache-control":"no-store"};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:C});
const clean=(x,n=5000)=>String(x??'').trim().slice(0,n);
const tokenFrom=r=>(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
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

let tenantSchemaReady=null;
async function ensureTenantSchema(e){
  if(tenantSchemaReady)return tenantSchemaReady;
  tenantSchemaReady=(async()=>{
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_accounts (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT(datetime('now')), starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL, locked INTEGER NOT NULL DEFAULT 0, deleted_at TEXT DEFAULT NULL
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_sessions (
      token TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, expires_at INTEGER NOT NULL
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_products (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, game TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '', thumb TEXT DEFAULT '', download_link TEXT NOT NULL,
      warning TEXT DEFAULT '', views INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT(datetime('now')), updated_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_tags (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_comments (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL,
      image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')), visible INTEGER NOT NULL DEFAULT 1
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY(tenant_id,key)
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_views (
      tenant_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, product_id TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(tenant_id,day,kind,product_id)
    )`).run();
    await e.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_audit_log (
      id TEXT PRIMARY KEY, tenant_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL,
      detail TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON tenant_products(tenant_id,updated_at)`).run();
    await e.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tenant_views_tenant_day ON tenant_views(tenant_id,day)`).run();
  })();
  return tenantSchemaReady;
}
function tenantSlug(v){return clean(v,80).toLowerCase().replace(/[^a-z0-9_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
function tenantStatus(x){
  if(!x)return 'not_found';
  if(Number(x.locked))return 'locked';
  if(x.deleted_at)return 'deleted';
  const now=Date.now(), ex=Date.parse(String(x.expires_at).replace(' ','T')+'Z');
  if(Number.isFinite(ex) && ex<now){const grace=ex+6*24*60*60*1000;return now<=grace?'expired_grace':'expired'}
  return 'active';
}
function tenantDaysLeft(x){
  const ex=Date.parse(String(x?.expires_at||'').replace(' ','T')+'Z');
  return Number.isFinite(ex)?Math.max(0,Math.ceil((ex-Date.now())/86400000)):0;
}
function tenantInfo(x){return {id:x.id,slug:x.slug,startsAt:x.starts_at,expiresAt:x.expires_at,daysLeft:tenantDaysLeft(x),status:tenantStatus(x),locked:!!x.locked,createdAt:x.created_at}}
async function tenantBySlug(e,slug){await ensureTenantSchema(e);return e.DB.prepare('SELECT * FROM tenant_accounts WHERE slug=? AND deleted_at IS NULL').bind(tenantSlug(slug)).first()}
async function tenantFromSession(r,e){const t=tokenFrom(r);if(!t)return null;await ensureTenantSchema(e);const row=await e.DB.prepare('SELECT a.* FROM tenant_sessions s JOIN tenant_accounts a ON a.id=s.tenant_id WHERE s.token=? AND s.expires_at>? AND a.deleted_at IS NULL').bind(t,Date.now()).first();return row||null}
async function tenantSettings(e,tid){const rows=(await e.DB.prepare('SELECT key,value FROM tenant_settings WHERE tenant_id=?').bind(tid).all()).results||[];const out={siteName:'Lại Húp File',studio:'Téo Studio',heroTitle:'Kho Share File riêng',heroText:'Kho file riêng của bạn.',avatar:'assets/img/default-avatar.svg',groupLink:'#',adminContact:'#',announcementEnabled:false,announcementTitle:'Thông báo',announcementText:''};for(const x of rows){try{out[x.key]=JSON.parse(x.value)}catch{out[x.key]=x.value}}return out}
async function tenantProducts(e,tid,admin=false){return (await e.DB.prepare(`SELECT * FROM tenant_products WHERE tenant_id=? ${admin?'':'AND visible=1'} ORDER BY updated_at DESC`).bind(tid).all()).results||[]}
async function tenantTags(e,tid){return (await e.DB.prepare('SELECT id,name,parent_id,created_at FROM tenant_tags WHERE tenant_id=? ORDER BY name COLLATE NOCASE').bind(tid).all()).results||[]}
async function tenantAudit(e,tid){return (await e.DB.prepare('SELECT actor,action,detail,created_at FROM tenant_audit_log WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(tid).all()).results||[]}
async function tenantLog(e,tid,actor,action,detail=''){await e.DB.prepare('INSERT INTO tenant_audit_log(id,tenant_id,actor,action,detail) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),tid,actor,action,clean(detail,1000)).run()}
async function tenantBump(e,tid,kind,pid=''){const day=dayVN();await e.DB.prepare(`INSERT INTO tenant_views(tenant_id,day,kind,product_id,views) VALUES(?,?,?,?,1) ON CONFLICT(tenant_id,day,kind,product_id) DO UPDATE SET views=views+1`).bind(tid,day,kind,pid).run();if(kind==='product'&&pid)await e.DB.prepare('UPDATE tenant_products SET views=COALESCE(views,0)+1 WHERE tenant_id=? AND id=?').bind(tid,pid).run()}
async function tenantStats(e,tid,days=30){const n=Math.max(7,Math.min(Number(days)||30,365));const rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM tenant_views WHERE tenant_id=? AND day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(tid,dayVN(),n-1).all()).results||[];return {days:n,rows,products:await tenantProducts(e,tid,true),today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)}}
async function purgeExpired(e){await ensureTenantSchema(e);const rows=(await e.DB.prepare('SELECT * FROM tenant_accounts WHERE deleted_at IS NULL').all()).results||[];const now=Date.now();for(const x of rows){const ex=Date.parse(String(x.expires_at).replace(' ','T')+'Z');if(Number.isFinite(ex)&&now>ex+6*86400000){await e.DB.prepare("UPDATE tenant_accounts SET deleted_at=datetime('now') WHERE id=?").bind(x.id).run();await e.DB.prepare('DELETE FROM tenant_sessions WHERE tenant_id=?').bind(x.id).run();await tenantLog(e,x.id,'system','auto_delete','Hết hạn gia hạn 6 ngày')}}}
async function handleTenantPublic(r,e){
  await ensureTenantSchema(e);
  const u=new URL(r.url),parts=u.pathname.split('/').filter(Boolean);
  const slug=clean(parts[2]||'',80),t=await tenantBySlug(e,slug);
  if(!t||tenantStatus(t)==='deleted'||tenantStatus(t)==='expired')return J({ok:false,error:'TENANT_NOT_FOUND'},404);
  if(tenantStatus(t)==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
  if(r.method==='GET'&&parts.length===3)return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t.id),tags:await tenantTags(e,t.id),products:await tenantProducts(e,t.id)});
  if(parts[3]==='product'&&parts[4]&&r.method==='GET'){
    const id=decodeURIComponent(parts[4]);
    const p=await e.DB.prepare('SELECT * FROM tenant_products WHERE tenant_id=? AND id=? AND visible=1').bind(t.id,id).first();
    if(!p)return J({ok:false,error:'NOT_FOUND'},404);
    await tenantBump(e,t.id,'product',id);
    return J({ok:true,product:p,tenant:tenantInfo(t)});
  }
  if(parts[3]==='comments'&&r.method==='GET')return J({ok:true,comments:(await e.DB.prepare('SELECT id,name,text,image,created_at FROM tenant_comments WHERE tenant_id=? AND visible=1 ORDER BY created_at DESC LIMIT 50').bind(t.id).all()).results||[]});
  if(parts[3]==='comments'&&r.method==='POST'){
    const b=await r.json().catch(()=>({})),text=clean(b.text,700),name=clean(b.name,40)||'Ẩn danh',image=clean(b.image,1000000);
    if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);
    const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_comments(id,tenant_id,name,text,image) VALUES(?,?,?,?,?)').bind(id,t.id,name,text,image).run();return J({ok:true,id},201)
  }
  return J({ok:false,error:'NOT_FOUND'},404)
}
async function handleTenantAdmin(r,e){await ensureTenantSchema(e);const t=await tenantFromSession(r,e);if(!t)return J({ok:false,error:'TENANT_REQUIRED'},401);const status=tenantStatus(t);if(status==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);if(status==='expired')return J({ok:false,error:'TENANT_EXPIRED'},403);const u=new URL(r.url),p=u.pathname;if(p==='/api/tenant/me')return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t.id)});if(p==='/api/tenant/products'&&r.method==='GET')return J({ok:true,products:await tenantProducts(e,t.id,true)});if(p==='/api/tenant/products'&&r.method==='POST'){const b=await r.json();if(!b.title||!b.download_link)return J({ok:false,error:'title_and_download_link_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_products(id,tenant_id,title,game,description,thumb,download_link,warning,visible) VALUES(?,?,?,?,?,?,?,?,1)').bind(id,t.id,clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning)).run();await tenantLog(e,t.id,t.id,'product_create',id);return J({ok:true,id},201)}let m=p.match(/^\/api\/tenant\/products\/([^/]+)$/);if(m){const id=m[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM tenant_products WHERE tenant_id=? AND id=?').bind(t.id,id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE tenant_products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,visible=?,updated_at=datetime(\'now\') WHERE tenant_id=? AND id=?').bind(clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning),b.visible===false?0:1,t.id,id).run();return J({ok:true})}}if(p==='/api/tenant/tags'&&r.method==='GET')return J({ok:true,tags:await tenantTags(e,t.id)});if(p==='/api/tenant/tags'&&r.method==='POST'){const b=await r.json(),name=clean(b.name,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_tags(id,tenant_id,name,parent_id) VALUES(?,?,?,?)').bind(id,t.id,name,clean(b.parent_id,100)||null).run();return J({ok:true,id},201)}let tg=p.match(/^\/api\/tenant\/tags\/([^/]+)$/);if(tg&&r.method==='DELETE'){await e.DB.prepare('DELETE FROM tenant_tags WHERE tenant_id=? AND (id=? OR parent_id=?)').bind(t.id,tg[1],tg[1]).run();return J({ok:true})}if(p==='/api/tenant/settings'&&r.method==='GET')return J({ok:true,settings:await tenantSettings(e,t.id)});if(p==='/api/tenant/settings'&&r.method==='PUT'){const b=await r.json();for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','groupLink','adminContact','announcementEnabled','announcementTitle','announcementText'].includes(k))continue;await e.DB.prepare('INSERT INTO tenant_settings(tenant_id,key,value) VALUES(?,?,?) ON CONFLICT(tenant_id,key) DO UPDATE SET value=excluded.value').bind(t.id,k,JSON.stringify(v)).run()}return J({ok:true})}if(p==='/api/tenant/password'&&r.method==='PUT'){const b=await r.json();if(String(b.newPassword||'').length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE id=?').bind(await sha256(String(b.newPassword)),t.id).run();await tenantLog(e,t.id,t.id,'password_change');return J({ok:true})}if(p==='/api/tenant/stats'&&r.method==='GET')return J({ok:true,...await tenantStats(e,t.id,u.searchParams.get('days')||30)});if(p==='/api/tenant/audit'&&r.method==='GET')return J({ok:true,logs:await tenantAudit(e,t.id)});if(p==='/api/tenant/logout'&&r.method==='POST'){const tok=tokenFrom(r);await e.DB.prepare('DELETE FROM tenant_sessions WHERE token=?').bind(tok).run();return J({ok:true})}return J({ok:false,error:'NOT_FOUND'},404)}
async function handleMasterTenant(r,e){if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);await ensureTenantSchema(e);const u=new URL(r.url),p=u.pathname;if(p==='/api/admin/tenants'&&r.method==='GET'){await purgeExpired(e);const q=clean(u.searchParams.get('q')||'',80);const rows=(await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE deleted_at IS NULL ${q?'AND (id LIKE ? OR slug LIKE ?)':''} ORDER BY created_at DESC`).bind(...(q?[`%${q}%`,`%${q}%`]:[])).all()).results||[];return J({ok:true,tenants:rows.map(tenantInfo)})}if(p==='/api/admin/tenants'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));
    const id=clean(b.id??b.tenantId??b.username??b.slug,80),slug=tenantSlug(id),password=String(b.password??b.pass??''),days=Math.max(1,Math.min(3650,Number(b.days)||30));
    if(!slug)return J({ok:false,error:'ID_REQUIRED'},400);
    if(password.length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);
    try{
      const exists=await e.DB.prepare('SELECT id FROM tenant_accounts WHERE slug=? AND deleted_at IS NULL').bind(slug).first();
      if(exists)return J({ok:false,error:'TENANT_EXISTS'},409);
      const tid='t-'+slug+'-'+crypto.randomUUID().slice(0,8);
      const st=new Date(),ex=new Date(Date.now()+days*86400000);
      const starts=st.toISOString().slice(0,19).replace('T',' '),expires=ex.toISOString().slice(0,19).replace('T',' ');
      await e.DB.prepare('INSERT INTO tenant_accounts(id,slug,password_hash,starts_at,expires_at) VALUES(?,?,?,?,?)').bind(tid,slug,await sha256(password),starts,expires).run();
      try{await tenantLog(e,tid,'master','create',`days=${days}`)}catch{}
      const row=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE id=?').bind(tid).first();
      if(!row)return J({ok:false,error:'TENANT_CREATE_FAILED'},500);
      return J({ok:true,tenant:tenantInfo(row),adminUrl:`/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`/share.html?tenant=${encodeURIComponent(slug)}`},201);
    }catch(x){return J({ok:false,error:'TENANT_CREATE_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  let m=p.match(/^\/api\/admin\/tenants\/([^/]+)$/);if(m){const tid=m[1],t=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE id=?').bind(tid).first();if(!t)return J({ok:false,error:'TENANT_NOT_FOUND'},404);if(r.method==='DELETE'){await e.DB.prepare('UPDATE tenant_accounts SET deleted_at=datetime(\'now\') WHERE id=?').bind(tid).run();await e.DB.prepare('DELETE FROM tenant_sessions WHERE tenant_id=?').bind(tid).run();await tenantLog(e,tid,'master','delete');return J({ok:true})}if(r.method==='PUT'){const b=await r.json();if(b.days!==undefined){const d=Math.max(1,Math.min(3650,Number(b.days)||1));const base=Math.max(Date.now(),Date.parse(String(t.expires_at).replace(' ','T')+'Z'));const ex=new Date(base+d*86400000);await e.DB.prepare('UPDATE tenant_accounts SET expires_at=?,locked=0 WHERE id=?').bind(ex.toISOString().slice(0,19).replace('T',' '),tid).run();await tenantLog(e,tid,'master','renew',`days=${d}`)}if(b.password){if(String(b.password).length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);await e.DB.prepare('UPDATE tenant_accounts SET password_hash=? WHERE id=?').bind(await sha256(String(b.password)),tid).run();await tenantLog(e,tid,'master','password_change')}if(typeof b.locked==='boolean'){await e.DB.prepare('UPDATE tenant_accounts SET locked=? WHERE id=?').bind(b.locked?1:0,tid).run();await e.DB.prepare('DELETE FROM tenant_sessions WHERE tenant_id=?').bind(tid).run();await tenantLog(e,tid,'master',b.locked?'lock':'unlock')}return J({ok:true,tenant:tenantInfo(await e.DB.prepare('SELECT * FROM tenant_accounts WHERE id=?').bind(tid).first())})}}return J({ok:false,error:'NOT_FOUND'},404)}
function dayVN(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
async function bumpView(e,kind,productId=''){
  const day=dayVN();
  await e.DB.prepare(`INSERT INTO view_daily(day,kind,product_id,views) VALUES(?,?,?,1) ON CONFLICT(day,kind,product_id) DO UPDATE SET views=views+1`).bind(day,kind,productId).run();
  if(kind==='product'&&productId)await e.DB.prepare('UPDATE products SET views=COALESCE(views,0)+1 WHERE id=?').bind(productId).run();
}
async function comments(e){return (await e.DB.prepare('SELECT id,name,text,image,created_at FROM comments WHERE visible=1 ORDER BY created_at DESC LIMIT 50').all()).results||[]}
async function stats(e,days=30){const n=Math.max(7,Math.min(Number(days)||30,365));const rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM view_daily WHERE day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(dayVN(),n-1).all()).results||[];const prods=await e.DB.prepare('SELECT id,title,views FROM products ORDER BY views DESC,updated_at DESC').all();return {days:n,rows,products:prods.results||[],today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)} }
export default{async scheduled(_controller,e){try{await purgeExpired(e)}catch{}},async fetch(r,e){if(r.method==='OPTIONS')return new Response(null,{headers:C});const u=new URL(r.url),p=u.pathname.replace(/\/$/,'');try{
  await ensureSchema(e);
  if(p==='/api/health')return J({ok:true,service:'teo-studio-api-mini',version:'rental-1-safe',auth:'d1-session'});
  if(p==='/api/products'&&r.method==='GET')return J({ok:true,products:await products(e)});
  if(p.match(/^\/api\/products\/[^/]+$/)&&r.method==='GET'){const id=decodeURIComponent(p.split('/').pop());const product=await productById(e,id);return product?J({ok:true,product}):J({ok:false,error:'NOT_FOUND'},404)}
  if(p==='/api/tags'&&r.method==='GET')return J({ok:true,tags:await tags(e)});
  if(p==='/api/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/comments'&&r.method==='GET')return J({ok:true,comments:await comments(e)});
  if(p==='/api/comments'&&r.method==='POST'){const b=await r.json().catch(()=>({}));const name=clean(b.name,40)||'Ẩn danh';const text=clean(b.text,700);const image=clean(b.image,1000000);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO comments(id,name,text,image) VALUES(?,?,?,?)').bind(id,name,text,image).run();return J({ok:true,id},201)}
  if(p==='/api/track/site'&&r.method==='POST'){await bumpView(e,'site');return J({ok:true})}
  let tv=p.match(/^\/api\/track\/product\/([^/]+)$/);if(tv&&r.method==='POST'){const id=decodeURIComponent(tv[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'product',id);return J({ok:true,views:Number(product.views||0)+1})}
  let to=p.match(/^\/api\/track\/outbound\/([^/]+)$/);if(to&&r.method==='POST'){const id=decodeURIComponent(to[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'outbound',id);return J({ok:true})}
  if(p==='/api/tenant/login'&&r.method==='POST'){await ensureTenantSchema(e);const b=await r.json().catch(()=>({}));const t=await tenantBySlug(e,b.tenant||b.id);if(!t)return J({ok:false,error:'INVALID_LOGIN'},401);const st=tenantStatus(t);if(st==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);if(st==='expired')return J({ok:false,error:'TENANT_EXPIRED'},403);if((await sha256(String(b.password||'')))!==t.password_hash)return J({ok:false,error:'INVALID_LOGIN'},401);const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_sessions(token,tenant_id,expires_at) VALUES(?,?,?)').bind(token,t.id,Date.now()+7*86400000).run();return J({ok:true,token,tenant:tenantInfo(t),adminUrl:`/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`/share.html?tenant=${encodeURIComponent(t.slug)}`})}
  if(p.startsWith('/api/public-tenant/'))return await handleTenantPublic(r,e);
  if(p.startsWith('/api/tenant/')&&p!=='/api/tenant/login')return await handleTenantAdmin(r,e);
  if(p.startsWith('/api/admin/tenants'))return await handleMasterTenant(r,e);
  if(p==='/api/admin/login'&&r.method==='POST'){await ensureSchema(e);const b=await r.json().catch(()=>({}));const ok=(await sha256(clean(b.password,200)))===(await e.DB.prepare('SELECT password_hash FROM admin_auth WHERE id=1').first()).password_hash;if(!ok)return J({ok:false,error:'INVALID_PASSWORD'},401);const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO admin_sessions(token,expires_at) VALUES(?,?)').bind(token,Date.now()+7*24*60*60*1000).run();return J({ok:true,token,expiresIn:7*24*60*60*1000})}
  if(p==='/api/admin/logout'&&r.method==='POST'){const t=tokenFrom(r);if(t)await e.DB.prepare('DELETE FROM admin_sessions WHERE token=?').bind(t).run();return J({ok:true})}
  if(p==='/api/admin/change-password'&&r.method==='POST'){if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);const b=await r.json().catch(()=>({}));if(!b.newPassword||String(b.newPassword).length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);await e.DB.prepare('UPDATE admin_auth SET password_hash=?,updated_at=datetime(\'now\') WHERE id=1').bind(await sha256(String(b.newPassword))).run();return J({ok:true})}
  if(!(await isAdmin(r,e)))return J({ok:false,error:'ADMIN_REQUIRED'},401);
  if(p==='/api/admin/stats'&&r.method==='GET')return J({ok:true,...await stats(e,new URL(r.url).searchParams.get('days')||30)});
  if(p==='/api/admin/comments'&&r.method==='GET')return J({ok:true,comments:(await e.DB.prepare('SELECT id,name,text,image,created_at,visible FROM comments ORDER BY created_at DESC').all()).results||[]});
  let cm=p.match(/^\/api\/admin\/comments\/([^/]+)$/);if(cm){const id=cm[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json().catch(()=>({}));if(typeof b.visible!=='boolean')return J({ok:false,error:'VISIBLE_REQUIRED'},400);await e.DB.prepare('UPDATE comments SET visible=? WHERE id=?').bind(b.visible?1:0,id).run();return J({ok:true,visible:b.visible})}}
  if(p==='/api/admin/products'&&r.method==='GET')return J({ok:true,products:await adminProducts(e)});
  if(p==='/api/admin/products'&&r.method==='POST'){const b=await r.json();if(!b.title||!b.download_link)return J({ok:false,error:'title_and_download_link_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO products(id,title,game,description,thumb,download_link,warning,visible) VALUES(?,?,?,?,?,?,?,1)').bind(id,clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning)).run();return J({ok:true,id},201)}
  let m=p.match(/^\/api\/admin\/products\/([^/]+)$/);if(m){const id=m[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json().catch(()=>({}));if(Object.keys(b).length===1&&typeof b.visible==='boolean'){await e.DB.prepare(`UPDATE products SET visible=?,updated_at=datetime('now') WHERE id=?`).bind(b.visible?1:0,id).run();return J({ok:true,visible:b.visible})}await e.DB.prepare(`UPDATE products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,visible=COALESCE(?,visible),updated_at=datetime('now') WHERE id=?`).bind(clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning),typeof b.visible==='boolean'?(b.visible?1:0):null,id).run();return J({ok:true})}}
  if(p==='/api/admin/tags'&&r.method==='POST'){const b=await r.json(),name=clean(b.name,100),parentId=clean(b.parent_id,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tags(id,name,parent_id) VALUES(?,?,?)').bind(id,name,parentId||null).run();return J({ok:true,id},201)}
  let t=p.match(/^\/api\/admin\/tags\/([^/]+)$/);if(t){const id=t[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM tags WHERE id=? OR parent_id=?').bind(id,id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE tags SET name=?,parent_id=? WHERE id=?').bind(clean(b.name,100),clean(b.parent_id,100)||null,id).run();return J({ok:true})}}
  if(p==='/api/admin/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/admin/settings'&&r.method==='PUT'){const b=await r.json();for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','announcementTitle','announcementText','announcementEnabled','groupLink','adminContact','rentZalo','donateTitle','donateText','donateQr'].includes(k))continue;await e.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,JSON.stringify(v)).run()}return J({ok:true})}
  if(e.ASSETS)return e.ASSETS.fetch(r);return J({ok:false,error:'NOT_FOUND'},404)
}catch(x){return J({ok:false,error:'SERVER_ERROR',detail:String(x.message||x)},500)}}};
