import { useCallback, useEffect, useRef } from 'react'
import { useGraphStore } from '@/store/graphStore'
import type { IdeaGraph } from '@/types'

// ─── useGraph: Convenience Hook für Graph-Operationen ────────────

export function useGraph() {
  const store = useGraphStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      store.init()
      initialized.current = true
    }
  }, [store])

  const createIdea = useCallback(
    async (title: string, content = '', posX = 0, posY = 0) => {
      return store.addIdea(title, content, posX, posY)
    },
    [store],
  )

  const editIdea = useCallback(
    async (id: string, update: Parameters<typeof store.updateIdea>[1]) => {
      await store.updateIdea(id, update)
    },
    [store],
  )

  const removeIdea = useCallback(
    async (id: string) => {
      await store.deleteIdea(id)
    },
    [store],
  )

  const linkIdeas = useCallback(
    async (sourceId: string, targetId: string, type: Parameters<typeof store.addConnection>[2], weight?: number) => {
      return store.addConnection(sourceId, targetId, type, weight)
    },
    [store],
  )

  const unlink = useCallback(
    async (id: string) => {
      await store.deleteConnection(id)
    },
    [store],
  )

  const graph: IdeaGraph = {
    ideas: store.ideas,
    connections: store.connections,
    tags: [],
    clusters: [],
  }

  return {
    ideas: store.ideas,
    connections: store.connections,
    loading: store.loading,
    error: store.error,
    graph,
    createIdea,
    editIdea,
    removeIdea,
    linkIdeas,
    unlink,
    refresh: store.init,
  }
}
