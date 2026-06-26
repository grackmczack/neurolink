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

// ─── In-Memory DB (Web-Dev Fallback) ─────────────────────────────
// Wird in der Vite-Dev-Umgebung verwendet.
// Tauri/Android ersetzen dies durch ihre SQLite-Implementierung.

class InMemoryDB implements DBClient {
  private ideas = new Map<string, Idea>()
  private connections = new Map<string, Connection>()
  private syncMeta = new Map<string, { lastSyncAt: number | null; lastVersion: number; cursorToken: string | null }>()

  async createIdea(input: IdeaInput): Promise<Idea> {
    const idea = newIdea(input)
    this.ideas.set(idea.id, idea)
    return idea
  }

  async getIdea(id: string): Promise<Idea | null> {
    return this.ideas.get(id) ?? null
  }

  async getAllIdeas(includeDeleted = false): Promise<Idea[]> {
    return [...this.ideas.values()].filter((i) => includeDeleted || i.deletedAt === null)
  }

  async updateIdea(id: string, update: IdeaUpdate): Promise<Idea> {
    const existing = this.ideas.get(id)
    if (!existing) throw new Error(`Idea ${id} not found`)
    const bumped = bumpSyncVersion(existing)
    const updated: Idea = { ...existing, ...update, ...bumped }
    this.ideas.set(id, updated)
    return updated
  }

  async deleteIdea(id: string): Promise<void> {
    const existing = this.ideas.get(id)
    if (!existing) return
    const bumped = bumpSyncVersion(existing)
    this.ideas.set(id, { ...existing, deletedAt: Date.now(), ...bumped })
  }

  async createConnection(input: ConnectionInput): Promise<Connection> {
    const conn = newConnection(input)
    this.connections.set(conn.id, conn)
    return conn
  }

  async getConnectionsForIdea(ideaId: string): Promise<Connection[]> {
    return [...this.connections.values()].filter(
      (c) => c.sourceId === ideaId || c.targetId === ideaId,
    )
  }

  async getAllConnections(): Promise<Connection[]> {
    return [...this.connections.values()]
  }

  async updateConnection(id: string, update: ConnectionUpdate): Promise<Connection> {
    const existing = this.connections.get(id)
    if (!existing) throw new Error(`Connection ${id} not found`)
    const bumped = bumpSyncVersion(existing)
    const updated: Connection = { ...existing, ...update, ...bumped }
    this.connections.set(id, updated)
    return updated
  }

  async deleteConnection(id: string): Promise<void> {
    this.connections.delete(id)
  }

  async getSyncMeta(deviceId: string) {
    const m = this.syncMeta.get(deviceId)
    if (!m) return null
    return { deviceId, ...m }
  }

  async upsertSyncMeta(meta: SyncMeta): Promise<void> {
    this.syncMeta.set(meta.deviceId, {
      lastSyncAt: meta.lastSyncAt,
      lastVersion: meta.lastVersion,
      cursorToken: meta.cursorToken,
    })
  }

  async bulkUpsertIdeas(ideas: Idea[]): Promise<void> {
    for (const idea of ideas) this.ideas.set(idea.id, idea)
  }

  async bulkUpsertConnections(connections: Connection[]): Promise<void> {
    for (const conn of connections) this.connections.set(conn.id, conn)
  }

  async close(): Promise<void> {}
}

// ─── Factory: liefert die passende Implementierung ───────────────

let _instance: DBClient | null = null

export async function getDB(): Promise<DBClient> {
  if (_instance) return _instance

  // Tauri-Erkennung
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    // Phase 5: import('@/db/tauri-db') → dynamischer Import
    // Vorerst Fallback auf In-Memory
    _instance = new InMemoryDB()
    return _instance
  }

  // Capacitor-Erkennung
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    // Phase 5: import('@/db/capacitor-db')
    _instance = new InMemoryDB()
    return _instance
  }

  // Web-Dev
  _instance = new InMemoryDB()
  return _instance
}
