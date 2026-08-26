-- Strategy ownership/moderation migration for the existing allneeds-db.
-- Production is expected to already have strategies.visibility and strategies.add_count
-- from the legacy feed migration.

ALTER TABLE strategies ADD COLUMN client_key TEXT;
ALTER TABLE strategies ADD COLUMN updated_at TEXT;
ALTER TABLE strategies ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE sessions ADD COLUMN verified_at TEXT;

UPDATE strategies
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_strategies_author_client_key
  ON strategies(author_did, client_key)
  WHERE client_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategies_public_moderation_created
  ON strategies(visibility, moderation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS strategy_needs (
  strategy_id INTEGER NOT NULL,
  need_id TEXT NOT NULL,
  PRIMARY KEY (strategy_id, need_id),
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_strategy_needs_need_strategy
  ON strategy_needs(need_id, strategy_id);

-- Backfill normalized need membership from the existing JSON-array column.
INSERT OR IGNORE INTO strategy_needs (strategy_id, need_id)
SELECT s.id, LOWER(TRIM(CAST(j.value AS TEXT)))
FROM strategies AS s, json_each(s.need_ids) AS j
WHERE s.need_ids IS NOT NULL
  AND json_valid(s.need_ids)
  AND TRIM(CAST(j.value AS TEXT)) <> '';
