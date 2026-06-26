-- ─── NeuroLink SQLite Schema v1 ──────────────────────────────────
-- Idea Graph Datenmodell: Knoten (Ideen), Kanten (Connections), Tags, Cluster

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── IDEA (Knoten) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
  id            TEXT    PRIMARY KEY NOT NULL,
  title         TEXT    NOT NULL,
  content       TEXT    DEFAULT '',
  color         TEXT    DEFAULT '#7c5cff',
  pos_x         REAL    DEFAULT 0,
  pos_y         REAL    DEFAULT 0,
  cluster_id    TEXT    REFERENCES clusters(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  deleted_at    INTEGER,          -- NULL = aktiv, Timestamp = Tombstone
  sync_version  INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ideas_cluster ON ideas(cluster_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ideas_sync    ON ideas(sync_version);
CREATE INDEX IF NOT EXISTS idx_ideas_updated ON ideas(updated_at);

-- ─── CONNECTION (gerichtete Kante / Synapse) ──────────────────────
CREATE TABLE IF NOT EXISTS connections (
  id            TEXT    PRIMARY KEY NOT NULL,
  source_id     TEXT    NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  target_id     TEXT    NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  type          TEXT    NOT NULL DEFAULT 'associates'
                  CHECK (type IN ('associates','extends','contradicts','inspires','refines','custom')),
  weight        REAL    NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  label         TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  sync_version  INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_conn_source ON connections(source_id);
CREATE INDEX IF NOT EXISTS idx_conn_target ON connections(target_id);
CREATE INDEX IF NOT EXISTS idx_conn_sync    ON connections(sync_version);

-- ─── TAG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id          TEXT    PRIMARY KEY NOT NULL,
  name        TEXT    NOT NULL UNIQUE,
  color       TEXT,
  created_at  INTEGER NOT NULL
);

-- ─── IDEA_TAG (M:N) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_tags (
  idea_id  TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_id)
);

-- ─── CLUSTER ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clusters (
  id             TEXT    PRIMARY KEY NOT NULL,
  name           TEXT    NOT NULL DEFAULT 'Unnamed Cluster',
  color          TEXT,
  auto_generated INTEGER NOT NULL DEFAULT 0,  -- 0 = manual, 1 = auto
  created_at     INTEGER NOT NULL
);

-- ─── SYNC_META (Cloud-Sync-Zustand pro Gerät) ─────────────────────
CREATE TABLE IF NOT EXISTS sync_meta (
  device_id      TEXT    PRIMARY KEY NOT NULL,
  last_sync_at   INTEGER,
  last_version   INTEGER NOT NULL DEFAULT 0,
  cursor_token   TEXT
);
