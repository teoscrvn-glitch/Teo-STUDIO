import sqlite3
con=sqlite3.connect(':memory:')
con.executescript('''
CREATE TABLE buyer_purchases(product_id TEXT, buyer_id TEXT, tenant_id TEXT, scope TEXT, status TEXT, title TEXT);
CREATE TABLE tenant_products(id TEXT, tenant_id TEXT, title TEXT);
INSERT INTO tenant_products VALUES ('same-product','tenant-A','A file'),('same-product','tenant-B','B file');
INSERT INTO buyer_purchases VALUES ('same-product','buyer-1','tenant-A','tenant','paid','A file purchase'),('same-product','buyer-2','tenant-B','tenant','paid','B file purchase');
''')
rows=con.execute('''SELECT p.tenant_id,p.title,tp.title FROM buyer_purchases p JOIN tenant_products tp ON tp.id=p.product_id AND tp.tenant_id=p.tenant_id AND tp.tenant_id IN (?) WHERE p.tenant_id IN (?) AND p.scope='tenant' AND p.status='paid' ''',('tenant-A','tenant-A')).fetchall()
assert len(rows)==1 and rows[0][0]=='tenant-A' and rows[0][2]=='A file', rows
print('PASS tenant sales isolation: colliding product IDs do not leak cross-tenant purchases.')
