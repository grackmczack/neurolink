import { useState, useEffect } from 'react'
import { Modal, Input, Textarea, Select, Button, Badge } from '@/components/ui'
import type { Idea, ConnectionType } from '@/types'
import { useGraphStore } from '@/store/graphStore'

interface IdeaDetailModalProps {
  idea: Idea | null
  open: boolean
  onClose: () => void
}

const colorPresets = [
  '#7c5cff', '#5cff8f', '#ff5c5c', '#ffc85c',
  '#5cb8ff', '#ff5cb8', '#5cffe4', '#ffa05c',
]

const connectionTypes: { value: ConnectionType; label: string }[] = [
  { value: 'associates', label: 'Assoziation' },
  { value: 'extends', label: 'Erweiterung' },
  { value: 'contradicts', label: 'Widerspruch' },
  { value: 'inspires', label: 'Inspiration' },
  { value: 'refines', label: 'Verfeinerung' },
  { value: 'custom', label: 'Custom' },
]

export function IdeaDetailModal({ idea, open, onClose }: IdeaDetailModalProps) {
  const updateIdea = useGraphStore((s) => s.updateIdea)
  const deleteIdea = useGraphStore((s) => s.deleteIdea)
  const connections = useGraphStore((s) => s.connections)
  const ideas = useGraphStore((s) => s.ideas)
  const addConnection = useGraphStore((s) => s.addConnection)
  const deleteConnection = useGraphStore((s) => s.deleteConnection)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('#7c5cff')
  const [selectedConnType, setSelectedConnType] = useState<ConnectionType>('associates')
  const [targetIdeaId, setTargetIdeaId] = useState('')

  useEffect(() => {
    if (idea) {
      setTitle(idea.title)
      setContent(idea.content)
      setColor(idea.color)
    }
  }, [idea])

  if (!idea) return null

  const handleSave = async () => {
    await updateIdea(idea.id, { title, content, color })
    onClose()
  }

  const handleDelete = async () => {
    await deleteIdea(idea.id)
    onClose()
  }

  const handleAddConnection = async () => {
    if (!targetIdeaId) return
    await addConnection(idea.id, targetIdeaId, selectedConnType)
    setTargetIdeaId('')
  }

  const ideaConnections = connections.filter(
    (c) => c.sourceId === idea.id || c.targetId === idea.id,
  )

  const otherIdeas = ideas.filter((i) => i.id !== idea.id && !i.deletedAt)

  return (
    <Modal open={open} onClose={onClose} title="Idee bearbeiten" size="lg">
      <div className="space-y-4">
        <Input
          label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. KI-gestützte Mustererkennung"
        />

        <Textarea
          label="Inhalt"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Beschreibe deine Idee..."
          rows={5}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Farbe
          </label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: color === c ? 'var(--text-primary)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Connections */}
        <div className="border-t border-[var(--border)] pt-4">
          <h4 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Verknüpfungen</h4>

          {ideaConnections.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {ideaConnections.map((c) => {
                const otherId = c.sourceId === idea.id ? c.targetId : c.sourceId
                const other = ideas.find((i) => i.id === otherId)
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: other?.color || '#7c5cff' }}
                      />
                      <span className="text-[var(--text-primary)]">{other?.title || 'Unbekannt'}</span>
                      <Badge variant="accent">{c.type}</Badge>
                    </div>
                    <button
                      onClick={() => deleteConnection(c.id)}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--danger)]"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Select
              value={targetIdeaId}
              onChange={(e) => setTargetIdeaId(e.target.value)}
              options={[
                { value: '', label: 'Ziel-Idee wählen...' },
                ...otherIdeas.map((i) => ({ value: i.id, label: i.title })),
              ]}
              className="flex-1"
            />
            <Select
              value={selectedConnType}
              onChange={(e) => setSelectedConnType(e.target.value as ConnectionType)}
              options={connectionTypes}
              className="w-40"
            />
            <Button onClick={handleAddConnection} size="md" disabled={!targetIdeaId}>
              +
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t border-[var(--border)] pt-4">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Löschen
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
