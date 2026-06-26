import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Cluster, Connection, Idea, IdeaGraph, Tag } from '@/types'
import type { DBClient } from '@/db/client'
import { getDB } from '@/db/memory-db'

// ─── Store State ─────────────────────────────────────────────────

interface GraphState {
  ideas: Idea[]
  connections: Connection[]
  tags: Tag[]
  clusters: Cluster[]
  loading: boolean
  error: string | null
  db: DBClient | null

  // Init
  init: () => Promise<void>

  // Idea CRUD
  addIdea: (title: string, content?: string, posX?: number, posY?: number, color?: string) => Promise<Idea>
  updateIdea: (id: string, update: Partial<Idea>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  // Connection CRUD
  addConnection: (sourceId: string, targetId: string, type: Connection['type'], weight?: number, label?: string | null) => Promise<Connection>
  updateConnection: (id: string, update: Partial<Connection>) => Promise<void>
  deleteConnection: (id: string) => Promise<void>

  // Tag CRUD
  addTag: (name: string, color?: string | null) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  tagIdea: (ideaId: string, tagId: string) => Promise<void>
  untagIdea: (ideaId: string, tagId: string) => Promise<void>

  // Cluster CRUD
  addCluster: (name: string, color?: string | null) => Promise<Cluster>
  deleteCluster: (id: string) => Promise<void>
  assignCluster: (ideaId: string, clusterId: string | null) => Promise<void>

  // Bulk / Sync
  bulkUpsertIdeas: (ideas: Idea[]) => Promise<void>
  bulkUpsertConnections: (connections: Connection[]) => Promise<void>
  getGraph: () => IdeaGraph
}

// ─── Tag / Cluster In-Memory (werden in Phase 4 in SQLite migriert) ──

const tagStore = new Map<string, Tag>()
const clusterStore = new Map<string, Cluster>()
const ideaTagStore = new Set<string>() // "ideaId:tagId"

export const useGraphStore = create<GraphState>((set, get) => ({
  ideas: [],
  connections: [],
  tags: [],
  clusters: [],
  loading: false,
  error: null,
  db: null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const db = await getDB()
      const [ideas, connections] = await Promise.all([
        db.getAllIdeas(),
        db.getAllConnections(),
      ])
      set({
        ideas,
        connections,
        tags: [...tagStore.values()],
        clusters: [...clusterStore.values()],
        db,
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  // ─── Idea CRUD ────────────────────────────────────────────────

  addIdea: async (title, content = '', posX = 0, posY = 0, color = '#7c5cff') => {
    const db = get().db ?? (await getDB())
    const idea = await db.createIdea({ title, content, posX, posY, color })
    set((s) => ({ ideas: [...s.ideas, idea] }))
    return idea
  },

  updateIdea: async (id, update) => {
    const db = get().db ?? (await getDB())
    const updated = await db.updateIdea(id, update)
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === id ? updated : i)),
    }))
  },

  deleteIdea: async (id) => {
    const db = get().db ?? (await getDB())
    await db.deleteIdea(id)
    set((s) => ({
      ideas: s.ideas.filter((i) => i.id !== id),
      connections: s.connections.filter((c) => c.sourceId !== id && c.targetId !== id),
    }))
  },

  // ─── Connection CRUD ──────────────────────────────────────────

  addConnection: async (sourceId, targetId, type, weight = 0.5, label = null) => {
    const db = get().db ?? (await getDB())
    const conn = await db.createConnection({ sourceId, targetId, type, weight, label })
    set((s) => ({ connections: [...s.connections, conn] }))
    return conn
  },

  updateConnection: async (id, update) => {
    const db = get().db ?? (await getDB())
    const updated = await db.updateConnection(id, update)
    set((s) => ({
      connections: s.connections.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteConnection: async (id) => {
    const db = get().db ?? (await getDB())
    await db.deleteConnection(id)
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }))
  },

  // ─── Tag CRUD ─────────────────────────────────────────────────

  addTag: async (name, color = null) => {
    const existing = [...tagStore.values()].find((t) => t.name === name)
    if (existing) return existing
    const tag: Tag = { id: uuidv4(), name, color, createdAt: Date.now() }
    tagStore.set(tag.id, tag)
    set((s) => ({ tags: [...s.tags, tag] }))
    return tag
  },

  deleteTag: async (id) => {
    tagStore.delete(id)
    // Entferne alle Idea-Tag-Verknüpfungen
    for (const key of ideaTagStore) {
      if (key.endsWith(`:${id}`)) ideaTagStore.delete(key)
    }
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }))
  },

  tagIdea: async (ideaId, tagId) => {
    ideaTagStore.add(`${ideaId}:${tagId}`)
  },

  untagIdea: async (ideaId, tagId) => {
    ideaTagStore.delete(`${ideaId}:${tagId}`)
  },

  // ─── Cluster CRUD ─────────────────────────────────────────────

  addCluster: async (name, color = null) => {
    const cluster: Cluster = {
      id: uuidv4(),
      name,
      color,
      autoGenerated: false,
      createdAt: Date.now(),
    }
    clusterStore.set(cluster.id, cluster)
    set((s) => ({ clusters: [...s.clusters, cluster] }))
    return cluster
  },

  deleteCluster: async (id) => {
    clusterStore.delete(id)
    // Ideas mit diesem Cluster entlinken
    const db = get().db ?? (await getDB())
    const ideas = get().ideas
    for (const idea of ideas) {
      if (idea.clusterId === id) {
        await db.updateIdea(idea.id, { clusterId: null })
      }
    }
    set((s) => ({
      clusters: s.clusters.filter((c) => c.id !== id),
      ideas: s.ideas.map((i) => (i.clusterId === id ? { ...i, clusterId: null } : i)),
    }))
  },

  assignCluster: async (ideaId, clusterId) => {
    const db = get().db ?? (await getDB())
    await db.updateIdea(ideaId, { clusterId })
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === ideaId ? { ...i, clusterId } : i)),
    }))
  },

  // ─── Bulk / Sync ──────────────────────────────────────────────

  bulkUpsertIdeas: async (ideas) => {
    const db = get().db ?? (await getDB())
    await db.bulkUpsertIdeas(ideas)
    set((s) => {
      const map = new Map(s.ideas.map((i) => [i.id, i]))
      for (const idea of ideas) map.set(idea.id, idea)
      return { ideas: [...map.values()] }
    })
  },

  bulkUpsertConnections: async (connections) => {
    const db = get().db ?? (await getDB())
    await db.bulkUpsertConnections(connections)
    set((s) => {
      const map = new Map(s.connections.map((c) => [c.id, c]))
      for (const conn of connections) map.set(conn.id, conn)
      return { connections: [...map.values()] }
    })
  },

  getGraph: () => {
    const { ideas, connections, tags, clusters } = get()
    return { ideas, connections, tags, clusters }
  },
}))
