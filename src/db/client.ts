import { v4 as uuidv4 } from 'uuid'
import type {
  Connection,
  ConnectionInput,
  ConnectionUpdate,
  Idea,
  IdeaInput,
  IdeaUpdate,
  SyncMeta,
} from '@/types'

// ─── DB-Client-Interface (Plattform-Agnostik) ────────────────────
// Desktop (Tauri) und Android (Capacitor) implementieren dies jeweils.
// Die Web-Dev-Umgebung nutzt einen In-Memory-Fallback.

export interface DBClient {
  // Ideas
  createIdea(input: IdeaInput): Promise<Idea>
  getIdea(id: string): Promise<Idea | null>
  getAllIdeas(includeDeleted?: boolean): Promise<Idea[]>
  updateIdea(id: string, update: IdeaUpdate): Promise<Idea>
  deleteIdea(id: string): Promise<void>
  // Connections
  createConnection(input: ConnectionInput): Promise<Connection>
  getConnectionsForIdea(ideaId: string): Promise<Connection[]>
  getAllConnections(): Promise<Connection[]>
  updateConnection(id: string, update: ConnectionUpdate): Promise<Connection>
  deleteConnection(id: string): Promise<void>
  // Sync
  getSyncMeta(deviceId: string): Promise<SyncMeta | null>
  upsertSyncMeta(meta: SyncMeta): Promise<void>
  // Bulk
  bulkUpsertIdeas(ideas: Idea[]): Promise<void>
  bulkUpsertConnections(connections: Connection[]): Promise<void>
  close(): Promise<void>
}

// ─── Helpers ─────────────────────────────────────────────────────

const now = (): number => Date.now()

export function newIdea(input: IdeaInput): Idea {
  return {
    id: uuidv4(),
    title: input.title,
    content: input.content ?? '',
    color: input.color ?? '#7c5cff',
    posX: input.posX ?? 0,
    posY: input.posY ?? 0,
    clusterId: input.clusterId ?? null,
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null,
    syncVersion: 1,
  }
}

export function newConnection(input: ConnectionInput): Connection {
  return {
    id: uuidv4(),
    sourceId: input.sourceId,
    targetId: input.targetId,
    type: input.type,
    weight: input.weight ?? 0.5,
    label: input.label ?? null,
    createdAt: now(),
    updatedAt: now(),
    syncVersion: 1,
  }
}

export function bumpSyncVersion(record: { syncVersion: number; updatedAt: number }): {
  syncVersion: number
  updatedAt: number
} {
  return {
    syncVersion: record.syncVersion + 1,
    updatedAt: now(),
  }
}
