const C={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type,Authorization","cache-control":"no-store"};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:C});
const clean=(x,n=5000)=>String(x??'').trim().slice(0,n);
const tokenFrom=r=>(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
let schemaReady=null;
let adminSessionSchemaReady=null;
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

    // Migrate legacy D1 tables in-place. These are additive only: no DROP/DELETE/reset.
    await addColumnSafe(e,'tags','parent_id','TEXT DEFAULT NULL');
    await addColumnSafe(e,'settings','value','TEXT');
    await addColumnSafe(e,'products','views','INTEGER');
    await addColumnSafe(e,'products','visible','INTEGER');
    await addColumnSafe(e,'products','created_at','TEXT');
    await addColumnSafe(e,'products','updated_at','TEXT');
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

    const row=await e.DB.prepare('SELECT id FROM admin_auth WHERE id=1').first();
    if(!row)await e.DB.prepare('INSERT INTO admin_auth(id,password_hash) VALUES(1,?)').bind(await sha256('123456')).run();
  })().catch(err=>{schemaReady=null;throw err});
  return schemaReady;
}

async function isAdmin(r,e){const t=tokenFrom(r);if(!t)return false;await ensureSchema(e);const x=await e.DB.prepare('SELECT token FROM admin_sessions WHERE token=? AND expires_at>?').bind(t,Date.now()).first();return !!x}
async function settings(e){const a=(await e.DB.prepare('SELECT key,value FROM settings').all()).results||[];const s={};for(const x of a){if(['adminPasswordHash'].includes(x.key))continue;try{s[x.key]=JSON.parse(x.value)}catch{s[x.key]=x.value}}return s}
async function tags(e){return (await e.DB.prepare('SELECT id,name,parent_id,created_at FROM tags ORDER BY CASE WHEN parent_id IS NULL OR parent_id=\'\' THEN 0 ELSE 1 END,name COLLATE NOCASE').all()).results||[]}
async function products(e){return (await e.DB.prepare('SELECT * FROM products WHERE visible=1 ORDER BY updated_at DESC').all()).results||[]}
async function adminProducts(e){return (await e.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all()).results||[]}
async function productById(e,id){return await e.DB.prepare('SELECT * FROM products WHERE id=? AND visible=1').bind(id).first()}

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
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_tags (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT(datetime('now'))
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_comments (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL,
      image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')), visible INTEGER NOT NULL DEFAULT 1
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY(tenant_id,key)
    )`);
    await tenantExec(e,`CREATE TABLE IF NOT EXISTS tenant_views (
      tenant_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, product_id TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(tenant_id,day,kind,product_id)
    )`);
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
  if(Number(x.locked))return 'locked';
  if(x.deleted_at)return 'deleted';
  const now=Date.now(), ex=tenantDateMs(x.expires_at);
  if(Number.isFinite(ex) && ex<now){const grace=ex+6*24*60*60*1000;return now<=grace?'expired_grace':'expired'}
  return 'active';
}
function tenantDaysLeft(x){
  const ex=tenantDateMs(x?.expires_at);
  return Number.isFinite(ex)?Math.max(0,Math.ceil((ex-Date.now())/86400000)):0;
}
function tenantInfo(x){return {id:x?.id??x?.tenant_id,slug:x?.slug??x?.tenant_id??x?.id,startsAt:x?.starts_at,expiresAt:x?.expires_at,daysLeft:tenantDaysLeft(x),status:tenantStatus(x),locked:!!x?.locked,createdAt:x?.created_at}}
async function tenantPasswordMatches(e,t,password){
  const raw=String(password??'');
  const hash=await sha256(raw);
  if(String(t?.password_hash||'')===hash)return true;
  // Compatibility with very old rental schemas that kept a legacy plaintext/password column.
  // If found, accept it once and immediately migrate it to SHA-256.
  try{
    const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
    const names=new Set(cols.map(x=>x.name));
    for(const col of ['password','pass']){
      if(names.has(col)&&String(t?.[col]??'')===raw){
        const key=await tenantAccountKeyColumn(e);
        if(key)await e.DB.prepare(`UPDATE tenant_accounts SET password_hash=? WHERE ${key}=?`).bind(hash,t.id).run();
        return true;
      }
    }
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
  const hash=await sha256(String(password??''));
  // Prefer the account whose stored password actually matches. This prevents a
  // legacy duplicate row from shadowing the real tenant after a migration/update.
  for(const row of rows){
    if(String(row?.password_hash||'')===hash)return row;
    try{
      const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
      const names=new Set(cols.map(x=>x.name));
      for(const col of ['password','pass']){
        if(names.has(col)&&String(row?.[col]??'')===String(password??''))return row;
      }
    }catch{}
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
  return e.DB.prepare(`SELECT * FROM tenant_accounts WHERE (${where.join(' OR ')})${deleted} LIMIT 1`).bind(...binds).first();
}
async function tenantFromSession(r,e){
  const tok=tokenFrom(r);if(!tok)return null;await ensureTenantSchema(e);
  const row=await e.DB.prepare('SELECT tenant_id FROM tenant_sessions WHERE token=? AND expires_at>?').bind(tok,Date.now()).first();
  if(!row?.tenant_id)return null;
  const cols=(await e.DB.prepare('PRAGMA table_info(tenant_accounts)').all()).results||[];
  const names=new Set(cols.map(x=>x.name));
  const where=[],vals=[]; const sid=clean(row.tenant_id,100);
  for(const col of ['id','tenant_id','slug']){
    if(!names.has(col))continue;
    where.push(`(${col}=? OR lower(${col})=lower(?))`);vals.push(sid,sid);
  }
  if(!where.length)return null;
  const a=await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE (${where.join(' OR ')}) AND (deleted_at IS NULL OR deleted_at='') ORDER BY rowid DESC LIMIT 1`).bind(...vals).first();
  return normalizeTenantRow(e,a);
}

async function tenantSettings(e,t){const k=tenantInSql(t);const rows=(await e.DB.prepare(`SELECT key,value FROM tenant_settings WHERE ${k.clause}`).bind(...k.vals).all()).results||[];const out={siteName:'Lại Húp File',studio:'Téo Studio',heroTitle:'Kho Share File riêng',heroText:'Kho file riêng của bạn.',avatar:'assets/img/default-avatar.svg',avatarVideoUrl:'',groupLink:'#',adminContact:'#',announcementEnabled:true,announcementTitle:'Thông báo từ Téo Studio',announcementText:'Hãy đọc kỹ thông báo trước khi vào web.',donateTitle:'Ủng hộ Téo',donateText:'Nếu thấy web hữu ích, bạn có thể donate để Téo có thêm động lực duy trì và nâng cấp web.',donateQr:'',ownerName:'Téo Studio',ownerText:'Kho Share File được vận hành bởi Téo Studio.',adText:'',adLink:'#',heroBackground:''};for(const x of rows){try{out[x.key]=JSON.parse(x.value)}catch{out[x.key]=x.value}}return out}
async function tenantProducts(e,t,admin=false){const k=tenantInSql(t);return (await e.DB.prepare(`SELECT * FROM tenant_products WHERE ${k.clause} ${admin?'':'AND visible=1'} ORDER BY updated_at DESC`).bind(...k.vals).all()).results||[]}
async function tenantTags(e,t){const k=tenantInSql(t);return (await e.DB.prepare(`SELECT id,name,parent_id,created_at FROM tenant_tags WHERE ${k.clause} ORDER BY name COLLATE NOCASE`).bind(...k.vals).all()).results||[]}
async function tenantComments(e,t,admin=false){const k=tenantInSql(t);return (await e.DB.prepare(`SELECT id,name,text,image,created_at,visible FROM tenant_comments WHERE ${k.clause} ${admin?'':'AND visible=1'} ORDER BY created_at DESC`).bind(...k.vals).all()).results||[]}
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
async function tenantBump(e,t,kind,pid=''){const day=dayVN();const keys=tenantKeyValues(t);const tid=t.id;await e.DB.prepare(`INSERT INTO tenant_views(tenant_id,day,kind,product_id,views) VALUES(?,?,?,?,1) ON CONFLICT(tenant_id,day,kind,product_id) DO UPDATE SET views=views+1`).bind(tid,day,kind,pid).run();if(kind==='product'&&pid){const k=tenantInSql(t);await e.DB.prepare(`UPDATE tenant_products SET views=COALESCE(views,0)+1 WHERE ${k.clause} AND id=?`).bind(...k.vals,pid).run()}}
async function tenantStats(e,tid,days=30,month=''){let rows=[];if(/^\d{4}-\d{2}$/.test(String(month||''))){const start=String(month)+'-01';rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM tenant_views WHERE tenant_id=? AND day>=? AND day<date(?, '+1 month') ORDER BY day ASC`).bind(tid,start,start).all()).results||[];return {days:rows.length,month,start,rows,products:await tenantProducts(e,tid,true),today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)}}const n=Math.max(1,Math.min(Number(days)||30,3650));rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM tenant_views WHERE tenant_id=? AND day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(tid,dayVN(),n-1).all()).results||[];return {days:n,rows,products:await tenantProducts(e,tid,true),today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)}}
async function purgeExpired(e){
  await ensureTenantSchema(e);
  const rows=(await e.DB.prepare('SELECT * FROM tenant_accounts').all()).results||[];
  const key=await tenantAccountKeyColumn(e);
  const now=Date.now();
  for(const raw of rows){const x=await normalizeTenantRow(e,raw);
    if(x.deleted_at)continue;
    const ex=Date.parse(String(x.expires_at||'').replace(' ','T')+'Z');
    if(Number.isFinite(ex)&&now>ex+6*86400000){
      // Delete the whole tenant dataset after the 6-day grace period.
      try{await tenantLog(e,x.id,'system','auto_delete','Hết hạn gia hạn 6 ngày — xóa toàn bộ dữ liệu')}catch{}
      for(const table of ['tenant_sessions','tenant_products','tenant_tags','tenant_comments','tenant_settings','tenant_views','tenant_audit_log']){
        try{await e.DB.prepare(`DELETE FROM ${table} WHERE tenant_id=?`).bind(x.id).run()}catch{}
      }
      try{await e.DB.prepare(`DELETE FROM tenant_accounts WHERE ${key}=?`).bind(x.id).run()}catch{}
    }
  }
}

async function handleTenantPublic(r,e){
  await ensureTenantSchema(e);
  const u=new URL(r.url),parts=u.pathname.split('/').filter(Boolean);
  const slug=clean(parts[2]||'',80),rawTenant=await tenantBySlug(e,slug),t=await normalizeTenantRow(e,rawTenant);
  if(!t||tenantStatus(t)==='deleted'||tenantStatus(t)==='expired')return J({ok:false,error:'TENANT_NOT_FOUND'},404);
  if(tenantStatus(t)==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
  if(r.method==='GET'&&parts.length===3)return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t),tags:await tenantTags(e,t),products:await tenantProducts(e,t)});
  if(parts[3]==='product'&&parts[4]&&r.method==='GET'){
    const id=decodeURIComponent(parts[4]);
    const pk=tenantInSql(t);const p=await e.DB.prepare(`SELECT * FROM tenant_products WHERE ${pk.clause} AND id=? AND visible=1 ORDER BY updated_at DESC LIMIT 1`).bind(...pk.vals,id).first();
    if(!p)return J({ok:false,error:'NOT_FOUND'},404);
    await tenantBump(e,t,'product',id);
    return J({ok:true,product:p,tenant:tenantInfo(t)});
  }
  if(parts[3]==='comments'&&r.method==='GET'){const ck=tenantInSql(t);return J({ok:true,comments:(await e.DB.prepare(`SELECT id,name,text,image,created_at FROM tenant_comments WHERE ${ck.clause} AND visible=1 ORDER BY created_at DESC LIMIT 5`).bind(...ck.vals).all()).results||[]});}
  if(parts[3]==='comments'&&r.method==='POST'){
    try{const b=await r.json().catch(()=>({})),text=clean(b.text,700),name=clean(b.name,40)||'Ẩn danh',image=clean(b.image,600000);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tenant_comments(id,tenant_id,name,text,image) VALUES(?,?,?,?,?)').bind(id,t.id,name,text,image).run();return J({ok:true,id},201)}catch(x){return J({ok:false,error:'TENANT_COMMENT_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  return J({ok:false,error:'NOT_FOUND'},404)
}
async function handleTenantAdmin(r,e){
  await ensureTenantSchema(e);
  const t=await tenantFromSession(r,e);
  if(!t)return J({ok:false,error:'TENANT_REQUIRED'},401);
  const status=tenantStatus(t);
  if(status==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
  if(status==='expired')return J({ok:false,error:'TENANT_EXPIRED'},403);
  const u=new URL(r.url),p=u.pathname;
  if(p==='/api/tenant/me')return J({ok:true,tenant:tenantInfo(t),settings:await tenantSettings(e,t)});
  if(p==='/api/tenant/products'&&r.method==='GET')return J({ok:true,products:await tenantProducts(e,t,true)});
  if(p==='/api/tenant/products'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));
    if(!b.title||!b.download_link)return J({ok:false,error:'title_and_download_link_required'},400);
    const id=crypto.randomUUID();
    await e.DB.prepare('INSERT INTO tenant_products(id,tenant_id,title,game,description,thumb,download_link,warning,visible) VALUES(?,?,?,?,?,?,?,?,1)').bind(id,t.id,clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning)).run();
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
      await e.DB.prepare('UPDATE tenant_products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,visible=?,updated_at=datetime(\'now\') WHERE tenant_id=? AND id=?').bind(clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,1500000),clean(b.download_link,10000),clean(b.warning),b.visible===false?0:1,t.id,id).run();
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
  if(p==='/api/tenant/settings'&&r.method==='PUT'){const b=await r.json().catch(()=>({}));const keys=tenantKeyValues(t);for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','heroBackground','avatarVideoUrl','groupLink','adminContact','announcementEnabled','announcementTitle','announcementText','donateTitle','donateText','donateQr','ownerName','ownerText','adText','adLink'].includes(k))continue;for(const tid of keys){await e.DB.prepare('INSERT INTO tenant_settings(tenant_id,key,value) VALUES(?,?,?) ON CONFLICT(tenant_id,key) DO UPDATE SET value=excluded.value').bind(tid,k,JSON.stringify(v)).run()}}return J({ok:true})}
  if(p==='/api/tenant/confirm-status'&&r.method==='GET'){
    return J({ok:true,configured:!!String(t.admin_confirm_password_hash||'')});
  }
  if(p==='/api/tenant/confirm-password'&&r.method==='POST'){
    const b=await r.json().catch(()=>({}));const np=String(b.newPassword||'');
    if(np.length<6)return J({ok:false,error:'CONFIRM_PASSWORD_TOO_SHORT'},400);
    if(String(t.admin_confirm_password_hash||''))return J({ok:false,error:'CONFIRM_PASSWORD_ALREADY_SET'},409);
    const key=await tenantAccountKeyColumn(e);if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
    const hash=await sha256(np);await e.DB.prepare(`UPDATE tenant_accounts SET admin_confirm_password_hash=? WHERE ${key}=?`).bind(hash,t.id).run();
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
    if(!String(t.admin_confirm_password_hash||''))return J({ok:false,error:'CONFIRM_PASSWORD_NOT_SET'},409);
    if(String(t.admin_confirm_password_hash)!==await sha256(old))return J({ok:false,error:'INVALID_CONFIRM_PASSWORD'},401);
    const key=await tenantAccountKeyColumn(e);if(!key)return J({ok:false,error:'TENANT_SCHEMA_KEY_MISSING'},500);
    await e.DB.prepare(`UPDATE tenant_accounts SET admin_confirm_password_hash=? WHERE ${key}=?`).bind(await sha256(np),t.id).run();
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
    const id=clean(b.id??b.tenantId??b.username??b.slug,80),slug=tenantSlug(id),password=String(b.password??b.pass??''),days=Math.max(1,Math.min(3650,Number(b.days)||30));
    if(!slug)return J({ok:false,error:'ID_REQUIRED'},400);
    if(password.length<6)return J({ok:false,error:'PASSWORD_TOO_SHORT'},400);
    try{
      const exists=await e.DB.prepare('SELECT * FROM tenant_accounts WHERE slug=?').bind(slug).first();
      if(exists&&!exists.deleted_at)return J({ok:false,error:'TENANT_EXISTS'},409);
      const tid='t-'+slug+'-'+crypto.randomUUID().slice(0,8);
      const st=new Date(),ex=new Date(Date.now()+days*86400000);
      const starts=st.toISOString().slice(0,19).replace('T',' '),expires=ex.toISOString().slice(0,19).replace('T',' ');
      let row;
      const hash=await sha256(password);
      // Write using the detected live key. If a deployed/legacy D1 still rejects
      // the first shape, retry once against tenant_id; this makes the migration
      // tolerant of old schemas without deleting or rebuilding tenant data.
      try{
        if(key==='id'){
          await e.DB.prepare('INSERT INTO tenant_accounts(id,slug,password_hash,starts_at,expires_at) VALUES(?,?,?,?,?)').bind(tid,slug,hash,starts,expires).run();
        }else{
          await e.DB.prepare('INSERT INTO tenant_accounts(tenant_id,slug,password_hash,starts_at,expires_at) VALUES(?,?,?,?,?)').bind(tid,slug,hash,starts,expires).run();
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
      row=await e.DB.prepare(`SELECT * FROM tenant_accounts WHERE ${finalKey}=?`).bind(tid).first();
      row=await normalizeTenantRow(e,row);
      if(!row)return J({ok:false,error:'TENANT_CREATE_FAILED'},500);
      try{await tenantLog(e,row.id,'master','create',`days=${days}`)}catch{}
      return J({ok:true,tenant:tenantInfo(row),adminUrl:`/tenant-admin.html?tenant=${encodeURIComponent(slug)}`,shareUrl:`/share.html?tenant=${encodeURIComponent(slug)}`},201);
    }catch(x){return J({ok:false,error:'TENANT_CREATE_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  let m=p.match(/^\/api\/admin\/tenants\/([^/]+)$/);
  if(m){
    const tid=clean(decodeURIComponent(m[1]),100),t=await normalizeTenantRow(e,await tenantByIdentifier(e,tid));
    if(!t)return J({ok:false,error:'TENANT_NOT_FOUND'},404);
    const canonicalId=t.id;
    if(r.method==='DELETE'){
      try{await tenantLog(e,canonicalId,'master','delete','Xóa thủ công toàn bộ tenant')}catch{}
      const dk=tenantInSql(t);
      for(const table of ['tenant_sessions','tenant_products','tenant_tags','tenant_comments','tenant_settings','tenant_views','tenant_audit_log']){try{await e.DB.prepare(`DELETE FROM ${table} WHERE ${dk.clause}`).bind(...dk.vals).run()}catch{}}
      await e.DB.prepare(`DELETE FROM tenant_accounts WHERE ${key}=?`).bind(canonicalId).run();
      try{if(await tenantHasColumn(e,'tenant_accounts','tenant_id'))await e.DB.prepare('DELETE FROM tenant_accounts WHERE tenant_id=?').bind(t.tenant_id??canonicalId).run()}catch{}
      return J({ok:true})
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
async function bumpView(e,kind,productId=''){
  const day=dayVN();
  await e.DB.prepare(`INSERT INTO view_daily(day,kind,product_id,views) VALUES(?,?,?,1) ON CONFLICT(day,kind,product_id) DO UPDATE SET views=views+1`).bind(day,kind,productId).run();
  if(kind==='product'&&productId)await e.DB.prepare('UPDATE products SET views=COALESCE(views,0)+1 WHERE id=?').bind(productId).run();
}
async function comments(e){return (await e.DB.prepare('SELECT id,name,text,image,created_at FROM comments WHERE visible=1 ORDER BY created_at DESC LIMIT 50').all()).results||[]}
async function stats(e,days=30){const n=Math.max(7,Math.min(Number(days)||30,365));const rows=(await e.DB.prepare(`SELECT day,kind,product_id,views FROM view_daily WHERE day>=date(?, '-'||?||' days') ORDER BY day ASC`).bind(dayVN(),n-1).all()).results||[];const prods=await e.DB.prepare('SELECT id,title,views FROM products ORDER BY views DESC,updated_at DESC').all();return {days:n,rows,products:prods.results||[],today:rows.filter(x=>x.day===dayVN()).reduce((a,x)=>a+Number(x.views||0),0)} }
export default{async scheduled(_controller,e){try{await purgeExpired(e)}catch{}},async fetch(r,e){if(r.method==='OPTIONS')return new Response(null,{headers:C});const u=new URL(r.url),p=u.pathname.replace(/\/$/,'');try{
  if(p==='/api/health')return J({ok:true,service:'teo-studio-api-mini',version:'rental-v29-safe',auth:'admin-key-session'});
  if(p==='/api/admin/login'&&r.method==='POST'){await ensureAdminSessionSchema(e);const b=await r.json().catch(()=>({}));const supplied=clean(b.adminKey??b.password??'',500);const expected=clean(e.ADMIN_KEY??'',500);if(!expected)return J({ok:false,error:'ADMIN_KEY_MISSING'},500);if(!supplied||supplied!==expected)return J({ok:false,error:'INVALID_ADMIN_KEY'},401);const token=crypto.randomUUID()+crypto.randomUUID();await e.DB.prepare('INSERT INTO admin_sessions(token,expires_at) VALUES(?,?)').bind(token,Date.now()+7*24*60*60*1000).run();return J({ok:true,token,expiresIn:7*24*60*60*1000})}
  await ensureSchema(e);
  if(p==='/api/products'&&r.method==='GET')return J({ok:true,products:await products(e)});
  if(p.match(/^\/api\/products\/[^/]+$/)&&r.method==='GET'){const id=decodeURIComponent(p.split('/').pop());const product=await productById(e,id);return product?J({ok:true,product}):J({ok:false,error:'NOT_FOUND'},404)}
  if(p==='/api/tags'&&r.method==='GET')return J({ok:true,tags:await tags(e)});
  if(p==='/api/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
  if(p==='/api/comments'&&r.method==='GET')return J({ok:true,comments:await comments(e)});
  if(p==='/api/comments'&&r.method==='POST'){const b=await r.json().catch(()=>({}));const name=clean(b.name,40)||'Ẩn danh';const text=clean(b.text,700);const image=clean(b.image,1000000);if(!text&&!image)return J({ok:false,error:'COMMENT_EMPTY'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO comments(id,name,text,image) VALUES(?,?,?,?)').bind(id,name,text,image).run();return J({ok:true,id},201)}
  if(p==='/api/track/site'&&r.method==='POST'){await bumpView(e,'site');return J({ok:true})}
  let tv=p.match(/^\/api\/track\/product\/([^/]+)$/);if(tv&&r.method==='POST'){const id=decodeURIComponent(tv[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'product',id);return J({ok:true,views:Number(product.views||0)+1})}
  let to=p.match(/^\/api\/track\/outbound\/([^/]+)$/);if(to&&r.method==='POST'){const id=decodeURIComponent(to[1]);const product=await productById(e,id);if(!product)return J({ok:false,error:'NOT_FOUND'},404);await bumpView(e,'outbound',id);return J({ok:true})}
  if(p==='/api/tenant/login'&&r.method==='POST'){
    try{
      await ensureTenantSchema(e);
      const b=await r.json().catch(()=>({}));
      const identifier=b.tenant||b.id||b.slug||'';
      const t0=await tenantByLogin(e,identifier,b.password);
      if(!t0)return J({ok:false,error:'INVALID_LOGIN'},401);
      const t=await normalizeTenantRow(e,t0);
      const st=tenantStatus(t);
      if(st==='locked')return J({ok:false,error:'TENANT_LOCKED'},403);
      if(st==='expired')return J({ok:false,error:'TENANT_EXPIRED'},403);
      if(!(await tenantPasswordMatches(e,t,b.password)))return J({ok:false,error:'INVALID_LOGIN'},401);
      const token=crypto.randomUUID()+crypto.randomUUID();
      const sessionTenantId=clean(t?.id??t?.tenant_id??t?.slug,100);
      if(!sessionTenantId)return J({ok:false,error:'TENANT_KEY_MISSING'},500);
      await e.DB.prepare('INSERT INTO tenant_sessions(token,tenant_id,expires_at) VALUES(?,?,?)').bind(token,sessionTenantId,Date.now()+7*86400000).run();
      return J({ok:true,token,tenant:tenantInfo(t),adminUrl:`/tenant-admin.html?tenant=${encodeURIComponent(t.slug)}`,shareUrl:`/share.html?tenant=${encodeURIComponent(t.slug)}`});
    }catch(x){return J({ok:false,error:'TENANT_LOGIN_DB_ERROR',detail:String(x?.message||x)},500)}
  }
  if(p.startsWith('/api/public-tenant/'))return await handleTenantPublic(r,e);
  if(p.startsWith('/api/tenant/')&&p!=='/api/tenant/login')return await handleTenantAdmin(r,e);
  if(p.startsWith('/api/admin/tenants'))return await handleMasterTenant(r,e);
  if(p==='/api/admin/logout'&&r.method==='POST'){const t=tokenFrom(r);if(t)await e.DB.prepare('DELETE FROM admin_sessions WHERE token=?').bind(t).run();return J({ok:true})}
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
  if(p==='/api/admin/settings'&&r.method==='PUT'){const b=await r.json();for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','heroBackground','announcementTitle','announcementText','announcementEnabled','groupLink','adminContact','rentZalo','donateTitle','donateText','donateQr'].includes(k))continue;await e.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,JSON.stringify(v)).run()}return J({ok:true})}
  if(e.ASSETS)return e.ASSETS.fetch(r);return J({ok:false,error:'NOT_FOUND'},404)
}catch(x){return J({ok:false,error:'SERVER_ERROR',detail:String(x.message||x)},500)}}};
