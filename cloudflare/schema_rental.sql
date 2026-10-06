-- Rental schema for Teo Studio. The Worker also performs safe IF NOT EXISTS creation/migration.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS tenant_accounts (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now')), starts_at TEXT NOT NULL, expires_at TEXT NOT NULL, locked INTEGER NOT NULL DEFAULT 0, deleted_at TEXT DEFAULT NULL);
CREATE TABLE IF NOT EXISTS tenant_sessions (token TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tenant_products (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, game TEXT NOT NULL DEFAULT '', description TEXT DEFAULT '', thumb TEXT DEFAULT '', download_link TEXT NOT NULL, warning TEXT DEFAULT '', views INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT(datetime('now')), updated_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE IF NOT EXISTS tenant_tags (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE IF NOT EXISTS tenant_comments (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, image TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')), visible INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS tenant_settings (tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(tenant_id,key));
CREATE TABLE IF NOT EXISTS tenant_views (tenant_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, product_id TEXT NOT NULL DEFAULT '', views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(tenant_id,day,kind,product_id));
CREATE TABLE IF NOT EXISTS tenant_audit_log (id TEXT PRIMARY KEY, tenant_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT(datetime('now')));
