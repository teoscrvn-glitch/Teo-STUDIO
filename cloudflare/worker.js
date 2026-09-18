const C={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type,Authorization","cache-control":"no-store"};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:C});const clean=(x,n=5000)=>String(x??'').trim().slice(0,n);const isAdmin=(r,e)=>(r.headers.get('authorization')||'')==='Bearer '+e.ADMIN_KEY;
async function settings(e){const a=(await e.DB.prepare('SELECT key,value FROM settings').all()).results||[];const s={};for(const x of a){try{s[x.key]=JSON.parse(x.value)}catch{s[x.key]=x.value}}return s}
async function tags(e){return (await e.DB.prepare('SELECT id,name,created_at FROM tags ORDER BY name COLLATE NOCASE').all()).results||[]}
async function products(e){const ps=(await e.DB.prepare('SELECT * FROM products WHERE visible=1 ORDER BY updated_at DESC').all()).results||[];return ps}
async function adminProducts(e){return (await e.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all()).results||[]}
export default{async fetch(r,e){if(r.method==='OPTIONS')return new Response(null,{headers:C});const u=new URL(r.url),p=u.pathname.replace(/\/$/,'');try{
if(p==='/api/health')return J({ok:true,service:'teo-studio-api-mini',version:'1.2'});
if(p==='/api/products'&&r.method==='GET')return J({ok:true,products:await products(e)});
if(p==='/api/tags'&&r.method==='GET')return J({ok:true,tags:await tags(e)});
if(p==='/api/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
if(!isAdmin(r,e))return J({ok:false,error:'ADMIN_REQUIRED'},401);
if(p==='/api/admin/products'&&r.method==='GET')return J({ok:true,products:await adminProducts(e)});
if(p==='/api/admin/products'&&r.method==='POST'){const b=await r.json();if(!b.title||!b.download_link)return J({ok:false,error:'title_and_download_link_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO products(id,title,game,description,thumb,download_link,warning,visible) VALUES(?,?,?,?,?,?,?,1)').bind(id,clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,10000),clean(b.download_link,10000),clean(b.warning)).run();return J({ok:true,id},201)}
let m=p.match(/^\/api\/admin\/products\/([^/]+)$/);if(m){const id=m[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE products SET title=?,game=?,description=?,thumb=?,download_link=?,warning=?,updated_at=datetime(\'now\') WHERE id=?').bind(clean(b.title,200),clean(b.game,100),clean(b.description),clean(b.thumb,10000),clean(b.download_link,10000),clean(b.warning),id).run();return J({ok:true})}}
if(p==='/api/admin/tags'&&r.method==='POST'){const b=await r.json(),name=clean(b.name,100);if(!name)return J({ok:false,error:'name_required'},400);const id=crypto.randomUUID();await e.DB.prepare('INSERT INTO tags(id,name) VALUES(?,?)').bind(id,name).run();return J({ok:true,id},201)}
let t=p.match(/^\/api\/admin\/tags\/([^/]+)$/);if(t){const id=t[1];if(r.method==='DELETE'){await e.DB.prepare('DELETE FROM tags WHERE id=?').bind(id).run();return J({ok:true})}if(r.method==='PUT'){const b=await r.json();await e.DB.prepare('UPDATE tags SET name=? WHERE id=?').bind(clean(b.name,100),id).run();return J({ok:true})}}
if(p==='/api/admin/settings'&&r.method==='GET')return J({ok:true,settings:await settings(e)});
if(p==='/api/admin/settings'&&r.method==='PUT'){const b=await r.json();for(const [k,v] of Object.entries(b)){if(!['siteName','studio','heroTitle','heroText','avatar','announcementTitle','announcementText','announcementEnabled','groupLink','adminContact'].includes(k))continue;await e.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,JSON.stringify(v)).run()}return J({ok:true})}
if(p==='/api/admin/products'&&r.method==='GET')return J({ok:true,products:await adminProducts(e)});
if(e.ASSETS)return e.ASSETS.fetch(r);
return J({ok:false,error:'NOT_FOUND'},404)
}catch(x){return J({ok:false,error:'SERVER_ERROR',detail:String(x.message||x)},500)}}};
