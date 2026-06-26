import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection as RFConnection,
  addEdge as rfAddEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import type { ConnectionType } from '@/types'

const connectionTypeColors: Record<ConnectionType, string> = {
  associates: '#7c5cff',
  extends: '#5cff8f',
  contradicts: '#ff5c5c',
  inspires: '#ffc85c',
  refines: '#5cb8ff',
  custom: '#9a9aa3',
}

export function CanvasPage() {
  const ideas = useGraphStore((s) => s.ideas)
  const connections = useGraphStore((s) => s.connections)
  const addConnection = useGraphStore((s) => s.addConnection)
  const updateIdea = useGraphStore((s) => s.updateIdea)
  const addIdea = useGraphStore((s) => s.addIdea)
  const theme = useUIStore((s) => s.theme)

  const nodes: Node[] = useMemo(
    () =>
      ideas
        .filter((i) => !i.deletedAt)
        .map((idea) => ({
          id: idea.id,
          position: { x: idea.posX, y: idea.posY },
          data: { label: idea.title },
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: `2px solid ${idea.color}`,
            borderRadius: '8px',
            fontSize: '13px',
            padding: '8px 12px',
            width: 'auto',
          },
        })),
    [ideas],
  )

  const edges: Edge[] = useMemo(
    () =>
      connections.map((c) => ({
        id: c.id,
        source: c.sourceId,
        target: c.targetId,
        label: c.label ?? undefined,
        animated: c.weight > 0.7,
        style: { stroke: connectionTypeColors[c.type], strokeWidth: 1 + c.weight * 3 },
      })),
    [connections],
  )

  const [rfNodes, , onNodesChange] = useNodesState(nodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges)

  const onConnect = useCallback(
    async (conn: RFConnection) => {
      if (!conn.source || !conn.target) return
      const newConn = await addConnection(conn.source, conn.target, 'associates')
      setRfEdges((eds) =>
        rfAddEdge(
          {
            id: newConn.id,
            source: newConn.sourceId,
            target: newConn.targetId,
            style: { stroke: connectionTypeColors.associates, strokeWidth: 2 },
          },
          eds,
        ),
      )
    },
    [addConnection, setRfEdges],
  )

  const onNodeDragStop = useCallback(
    async (_event: unknown, node: Node) => {
      await updateIdea(node.id, { posX: node.position.x, posY: node.position.y })
    },
    [updateIdea],
  )

  const onDoubleClick = useCallback(async (evt: React.MouseEvent) => {
    // Doppelklick auf leeren Canvas → neue Idee an Klick-Position
    const target = evt.target as HTMLElement
    if (target.className.includes('react-flow__pane') === false) return
    const title = prompt('Neue Idee:')
    if (!title) return
    const bounds = (evt.currentTarget as HTMLElement).getBoundingClientRect()
    await addIdea(title, '', evt.clientX - bounds.left, evt.clientY - bounds.top)
  }, [addIdea])

  return (
    <div className="h-full w-full" onDoubleClick={onDoubleClick}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
        colorMode={theme}
        className="bg-[var(--bg-primary)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls className="!bg-[var(--bg-secondary)] !border-[var(--border)]" />
        <MiniMap
          className="!bg-[var(--bg-secondary)] !border-[var(--border)]"
          nodeColor={(n) => (n.style?.border as string) || 'var(--accent)'}
        />
      </ReactFlow>
    </div>
  )
}
