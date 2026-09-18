-- Téo Studio / Lại Húp File — D1 schema v10
-- Run this after the v9 schema. All statements are idempotent.
CREATE TABLE IF NOT EXISTS user_profiles(
  user_id TEXT PRIMARY KEY,
  payout_method TEXT NOT NULL DEFAULT 'bank',
  payout_name TEXT NOT NULL DEFAULT '',
  payout_number TEXT NOT NULL DEFAULT '',
  payout_bank TEXT NOT NULL DEFAULT '',
  source_channel TEXT NOT NULL DEFAULT '',
  source_platform TEXT NOT NULL DEFAULT '',
  source_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity,entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_source ON user_profiles(source_status);

-- Default site settings. Admin can change these from Admin > Cài đặt.
INSERT OR IGNORE INTO settings(key,value) VALUES
('siteName','"Lại Húp File"'),
('studio','"Téo Studio"'),
('avatar','"assets/img/default-avatar.svg"'),
('heroTitle','"Téo Studio"'),
('heroText','"Kho code, script, tool và tài nguyên game được Téo cập nhật."'),
('announcementTitle','"Thông báo từ Téo Studio"'),
('announcementText','"Hãy đọc kỹ lưu ý trước khi tải và luôn kiểm tra file trước khi sử dụng."'),
('announcementEnabled','true'),
('bypassReward','400'),
('minWithdraw','100000'),
('groupLink','"#"'),
('adminContact','"#"'),
('adminZalo','"#"'),
('adminEmail','""'),
('avatarVideoUrl','""');

-- Make sure users created before v10 also get a profile row.
INSERT OR IGNORE INTO user_profiles(user_id)
SELECT id FROM users;

-- Keep the original v9 tags. Add Tất cả only in the UI, not as a D1 tag.
INSERT OR IGNORE INTO tags(name,slug) VALUES
('Roblox','roblox'),('Free Fire','free-fire'),('Làm game','lam-game'),
('HTML','html'),('Python','python'),('Tool','tool');
