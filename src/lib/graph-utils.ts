import type { Connection, Idea } from '@/types'

// ─── Graph Traversal Utilities ───────────────────────────────────

/** Alle direkten Nachbarn einer Idee (ein- und ausgehend) */
export function getNeighbors(ideaId: string, connections: Connection[]): string[] {
  const neighbors = new Set<string>()
  for (const c of connections) {
    if (c.sourceId === ideaId) neighbors.add(c.targetId)
    if (c.targetId === ideaId) neighbors.add(c.sourceId)
  }
  return [...neighbors]
}

/** Alle Connections einer Idee (ein- und ausgehend) */
export function getIdeaConnections(ideaId: string, connections: Connection[]): Connection[] {
  return connections.filter((c) => c.sourceId === ideaId || c.targetId === ideaId)
}

/** BFS: alle Ideen, die innerhalb von `maxDepth` Hops erreichbar sind */
export function getReachable(
  startId: string,
  connections: Connection[],
  maxDepth = 3,
): string[] {
  const visited = new Set<string>([startId])
  let frontier = [startId]

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const neighbor of getNeighbors(id, connections)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          next.push(neighbor)
        }
      }
    }
    frontier = next
  }
  return [...visited]
}

/** Finde Verbindung zwischen zwei Ideen, falls vorhanden */
export function findConnection(
  sourceId: string,
  targetId: string,
  connections: Connection[],
): Connection | null {
  return (
    connections.find((c) => c.sourceId === sourceId && c.targetId === targetId) ??
    connections.find((c) => c.sourceId === targetId && c.targetId === sourceId) ??
    null
  )
}

/** Ideen nach Anzahl ihrer Verbindungen sortieren (Hub-Detection) */
export function getHubIdeas(
  ideas: Idea[],
  connections: Connection[],
  limit = 5,
): { idea: Idea; degree: number }[] {
  const degree = new Map<string, number>()
  for (const c of connections) {
    degree.set(c.sourceId, (degree.get(c.sourceId) ?? 0) + 1)
    degree.set(c.targetId, (degree.get(c.targetId) ?? 0) + 1)
  }
  return ideas
    .filter((i) => !i.deletedAt)
    .map((idea) => ({ idea, degree: degree.get(idea.id) ?? 0 }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, limit)
}

/** Simple Cluster-Erkennung: zusammenhängende Komponenten */
export function detectClusters(ideas: Idea[], connections: Connection[]): Idea[][] {
  const activeIdeas = ideas.filter((i) => !i.deletedAt)
  const adj = new Map<string, Set<string>>()
  for (const idea of activeIdeas) adj.set(idea.id, new Set())
  for (const c of connections) {
    if (adj.has(c.sourceId) && adj.has(c.targetId)) {
      adj.get(c.sourceId)!.add(c.targetId)
      adj.get(c.targetId)!.add(c.sourceId)
    }
  }

  const visited = new Set<string>()
  const clusters: Idea[][] = []

  for (const idea of activeIdeas) {
    if (visited.has(idea.id)) continue
    const component: Idea[] = []
    const queue = [idea.id]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const found = activeIdeas.find((i) => i.id === id)
      if (found) component.push(found)
      for (const neighbor of adj.get(id) ?? []) {
        if (!visited.has(neighbor)) queue.push(neighbor)
      }
    }
    if (component.length > 0) clusters.push(component)
  }

  return clusters.sort((a, b) => b.length - a.length)
}
