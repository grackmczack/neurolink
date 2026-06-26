import type { Database } from '@tauri-apps/plugin-sql'
import type {
  Connection,
  ConnectionInput,
  ConnectionUpdate,
  Idea,
  IdeaInput,
  IdeaUpdate,
  SyncMeta,
} from '@/types'
import { type DBClient, newConnection, newIdea, bumpSyncVersion } from './client'

// ─── Tauri SQLite DB-Client (Desktop) ────────────────────────────
// Nutzt @tauri-apps/plugin-sql für native SQLite-Zugriffe.
// Wird nur geladen, wenn __TAURI__ erkannt wird.

const loadTauriSQL = async (): Promise<typeof import('@tauri-apps/plugin-sql').default> => {
  const mod = await import('@tauri-apps/plugin-sql')
  return mod.default
}

export class TauriDB implements DBClient {
  private db: Database | null = null
  private ready: Promise<void> | null = null

  private async ensure(): Promise<Database> {
    if (!this.db) {
      if (!this.ready) {
        this.ready = (async () => {
          const Sql = await loadTauriSQL()
          this.db = await Sql.load('sqlite:neurolink.db')
          // Schema-Migration
          await this.db!.execute(`
            CREATE TABLE IF NOT EXISTS ideas (
              id TEXT PRIMARY KEY NOT NULL,
              title TEXT NOT NULL,
              content TEXT DEFAULT '',
              color TEXT DEFAULT '#7c5cff',
              pos_x REAL DEFAULT 0,
              pos_y REAL DEFAULT 0,
              cluster_id TEXT,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL,
              deleted_at INTEGER,
              sync_version INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS connections (
              id TEXT PRIMARY KEY NOT NULL,
              source_id TEXT NOT NULL,
              target_id TEXT NOT NULL,
              type TEXT NOT NULL DEFAULT 'associates',
              weight REAL NOT NULL DEFAULT 0.5,
              label TEXT,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL,
              sync_version INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS tags (
              id TEXT PRIMARY KEY NOT NULL,
              name TEXT NOT NULL UNIQUE,
              color TEXT,
              created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS idea_tags (
              idea_id TEXT NOT NULL,
              tag_id TEXT NOT NULL,
              PRIMARY KEY (idea_id, tag_id)
            );
            CREATE TABLE IF NOT EXISTS clusters (
              id TEXT PRIMARY KEY NOT NULL,
              name TEXT NOT NULL DEFAULT 'Unnamed Cluster',
              color TEXT,
              auto_generated INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sync_meta (
              device_id TEXT PRIMARY KEY NOT NULL,
              last_sync_at INTEGER,
              last_version INTEGER NOT NULL DEFAULT 0,
              cursor_token TEXT
            );
          `)
        })()
      }
      await this.ready
    }
    return this.db!
  }

  async createIdea(input: IdeaInput): Promise<Idea> {
    const db = await this.ensure()
    const idea = newIdea(input)
    await db.execute(
      `INSERT INTO ideas (id, title, content, color, pos_x, pos_y, cluster_id, created_at, updated_at, deleted_at, sync_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10)`,
      [idea.id, idea.title, idea.content, idea.color, idea.posX, idea.posY, idea.clusterId, idea.createdAt, idea.updatedAt, idea.syncVersion],
    )
    return idea
  }

  async getIdea(id: string): Promise<Idea | null> {
    const db = await this.ensure()
    const rows = await db.select('SELECT * FROM ideas WHERE id = $1', [id])
    if (!rows.length) return null
    return this.mapIdea(rows[0])
  }

  async getAllIdeas(includeDeleted = false): Promise<Idea[]> {
    const db = await this.ensure()
    const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL'
    const rows = await db.select(`SELECT * FROM ideas ${where}`)
    return rows.map(this.mapIdea)
  }

  async updateIdea(id: string, update: IdeaUpdate): Promise<Idea> {
    const db = await this.ensure()
    const existing = await this.getIdea(id)
    if (!existing) throw new Error(`Idea ${id} not found`)
    const bumped = bumpSyncVersion(existing)
    const updated = { ...existing, ...update, ...bumped }
    await db.execute(
      `UPDATE ideas SET title=$1, content=$2, color=$3, pos_x=$4, pos_y=$5, cluster_id$6, updated_at=$7, sync_version=$8 WHERE id=$9`,
      [updated.title, updated.content, updated.color, updated.posX, updated.posY, updated.clusterId, updated.updatedAt, updated.syncVersion, id],
    )
    return updated
  }

  async deleteIdea(id: string): Promise<void> {
    const db = await this.ensure()
    await db.execute(
      `UPDATE ideas SET deleted_at=$1, updated_at=$2 WHERE id=$3`,
      [Date.now(), Date.now(), id],
    )
  }

  async createConnection(input: ConnectionInput): Promise<Connection> {
    const db = await this.ensure()
    const conn = newConnection(input)
    await db.execute(
      `INSERT INTO connections (id, source_id, target_id, type, weight, label, created_at, updated_at, sync_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [conn.id, conn.sourceId, conn.targetId, conn.type, conn.weight, conn.label, conn.createdAt, conn.updatedAt, conn.syncVersion],
    )
    return conn
  }

  async getConnectionsForIdea(ideaId: string): Promise<Connection[]> {
    const db = await this.ensure()
    const rows = await db.select(
      'SELECT * FROM connections WHERE source_id = $1 OR target_id = $1',
      [ideaId],
    )
    return rows.map(this.mapConnection)
  }

  async getAllConnections(): Promise<Connection[]> {
    const db = await this.ensure()
    const rows = await db.select('SELECT * FROM connections')
    return rows.map(this.mapConnection)
  }

  async updateConnection(id: string, update: ConnectionUpdate): Promise<Connection> {
    const db = await this.ensure()
    const rows = await db.select('SELECT * FROM connections WHERE id = $1', [id])
    if (!rows.length) throw new Error(`Connection ${id} not found`)
    const existing = this.mapConnection(rows[0])
    const bumped = bumpSyncVersion(existing)
    const updated = { ...existing, ...update, ...bumped }
    await db.execute(
      `UPDATE connections SET type=$1, weight=$2, label=$3, updated_at=$4, sync_version=$5 WHERE id=$6`,
      [updated.type, updated.weight, updated.label, updated.updatedAt, updated.syncVersion, id],
    )
    return updated
  }

  async deleteConnection(id: string): Promise<void> {
    const db = await this.ensure()
    await db.execute('DELETE FROM connections WHERE id = $1', [id])
  }

  async getSyncMeta(deviceId: string): Promise<SyncMeta | null> {
    const db = await this.ensure()
    const rows = await db.select('SELECT * FROM sync_meta WHERE device_id = $1', [deviceId])
    if (!rows.length) return null
    const row = rows[0] as Record<string, unknown>
    return {
      deviceId: row.device_id as string,
      lastSyncAt: row.last_sync_at as number | null,
      lastVersion: row.last_version as number,
      cursorToken: row.cursor_token as string | null,
    }
  }

  async upsertSyncMeta(meta: SyncMeta): Promise<void> {
    const db = await this.ensure()
    await db.execute(
      `INSERT INTO sync_meta (device_id, last_sync_at, last_version, cursor_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(device_id) DO UPDATE SET last_sync_at=$2, last_version=$3, cursor_token=$4`,
      [meta.deviceId, meta.lastSyncAt, meta.lastVersion, meta.cursorToken],
    )
  }

  async bulkUpsertIdeas(ideas: Idea[]): Promise<void> {
    const db = await this.ensure()
    for (const idea of ideas) {
      await db.execute(
        `INSERT INTO ideas (id, title, content, color, pos_x, pos_y, cluster_id, created_at, updated_at, deleted_at, sync_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, content=excluded.content, color=excluded.color,
           pos_x=excluded.pos_x, pos_y=excluded.pos_y, cluster_id=excluded.cluster_id,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at,
           sync_version=excluded.sync_version`,
        [idea.id, idea.title, idea.content, idea.color, idea.posX, idea.posY, idea.clusterId, idea.createdAt, idea.updatedAt, idea.deletedAt, idea.syncVersion],
      )
    }
  }

  async bulkUpsertConnections(connections: Connection[]): Promise<void> {
    const db = await this.ensure()
    for (const conn of connections) {
      await db.execute(
        `INSERT INTO connections (id, source_id, target_id, type, weight, label, created_at, updated_at, sync_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT(id) DO UPDATE SET
           source_id=excluded.source_id, target_id=excluded.target_id,
           type=excluded.type, weight=excluded.weight, label=excluded.label,
           updated_at=excluded.updated_at, sync_version=excluded.sync_version`,
        [conn.id, conn.sourceId, conn.targetId, conn.type, conn.weight, conn.label, conn.createdAt, conn.updatedAt, conn.syncVersion],
      )
    }
  }

  async close(): Promise<void> {
    await this.db?.close()
    this.db = null
  }

  // ─── Mapper ────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapIdea(row: any): Idea {
    return {
      id: row.id,
      title: row.title,
      content: row.content ?? '',
      color: row.color ?? '#7c5cff',
      posX: row.pos_x ?? 0,
      posY: row.pos_y ?? 0,
      clusterId: row.cluster_id ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? null,
      syncVersion: row.sync_version ?? 1,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapConnection(row: any): Connection {
    return {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type,
      weight: row.weight,
      label: row.label ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncVersion: row.sync_version ?? 1,
    }
  }
}

// Helper factory
export async function createTauriDB(): Promise<TauriDB> {
  const db = new TauriDB()
  await (db as unknown as { ensure: () => Promise<Database> }).ensure()
  return db
}
