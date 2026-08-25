-- Short-lived AT Protocol OAuth transaction state and temporary OAuth sessions.
-- These records contain the DPoP material required by the official OAuth client.
-- The OAuth session is revoked/deleted immediately after allneeds establishes its own
-- verified HttpOnly session cookie; it is not used as long-term profile storage.

CREATE TABLE IF NOT EXISTS oauth_states (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires
  ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS oauth_sessions (
  did TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
