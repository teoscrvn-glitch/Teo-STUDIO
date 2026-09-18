PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tags(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,title TEXT NOT NULL,game TEXT NOT NULL DEFAULT '',description TEXT DEFAULT '',thumb TEXT DEFAULT '',download_link TEXT NOT NULL,warning TEXT DEFAULT '',views INTEGER NOT NULL DEFAULT 0,visible INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')));
INSERT OR IGNORE INTO settings(key,value) VALUES
('siteName','Lại Húp File'),('studio','Téo Studio'),('heroTitle','Téo Studio'),('heroText','Kho file, code, script và tài nguyên được Téo cập nhật.'),('avatar','assets/img/default-avatar.svg'),('announcementTitle','Thông báo từ Téo Studio'),('announcementText','Hãy đọc kỹ lưu ý trước khi tải và luôn kiểm tra file trước khi sử dụng.'),('announcementEnabled','true'),('groupLink','#'),('adminContact','#');
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
