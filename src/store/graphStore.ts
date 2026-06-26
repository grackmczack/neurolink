import { create } from 'zustand'
import type { Connection, Idea, IdeaGraph } from '@/types'
import type { DBClient } from '@/db/client'
import { getDB } from '@/db/memory-db'

// ─── Store State ─────────────────────────────────────────────────

interface GraphState {
  ideas: Idea[]
  connections: Connection[]
  loading: boolean
  error: string | null
  db: DBClient | null

  // Actions
  init: () => Promise<void>
  addIdea: (title: string, content?: string, posX?: number, posY?: number) => Promise<Idea>
  updateIdea: (id: string, update: Partial<Idea>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  addConnection: (sourceId: string, targetId: string, type: Connection['type'], weight?: number) => Promise<Connection>
  deleteConnection: (id: string) => Promise<void>
  getGraph: () => IdeaGraph
}

export const useGraphStore = create<GraphState>((set, get) => ({
  ideas: [],
  connections: [],
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
      set({ ideas, connections, db, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  addIdea: async (title, content = '', posX = 0, posY = 0) => {
    const db = get().db ?? (await getDB())
    const idea = await db.createIdea({ title, content, posX, posY })
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

  addConnection: async (sourceId, targetId, type, weight = 0.5) => {
    const db = get().db ?? (await getDB())
    const conn = await db.createConnection({ sourceId, targetId, type, weight })
    set((s) => ({ connections: [...s.connections, conn] }))
    return conn
  },

  deleteConnection: async (id) => {
    const db = get().db ?? (await getDB())
    await db.deleteConnection(id)
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }))
  },

  getGraph: () => {
    const { ideas, connections } = get()
    return { ideas, connections, tags: [], clusters: [] }
  },
}))
