-- TeoStudio V57.0 legal consent + privacy-rights request tables
-- Safe to execute more than once. Worker also creates these lazily via ensureLegalSchema().
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  document_key TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
  acceptance_method TEXT NOT NULL DEFAULT 'web-registration',
  UNIQUE(account_id, document_key, document_version)
);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_account ON legal_acceptances(account_id, accepted_at);
CREATE TABLE IF NOT EXISTS privacy_rights_requests (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_rights_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_account ON privacy_rights_requests(account_id, created_at);
