import { useState } from 'react'
import { Trash2, Search } from 'lucide-react'
import { useGraphStore } from '@/store/graphStore'

export function IdeasListPage() {
  const ideas = useGraphStore((s) => s.ideas)
  const deleteIdea = useGraphStore((s) => s.deleteIdea)
  const [query, setQuery] = useState('')

  const filtered = ideas
    .filter((i) => !i.deletedAt)
    .filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="Ideen durchsuchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((idea) => (
          <div
            key={idea.id}
            className="group rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 hover:border-[var(--accent)]"
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-medium text-[var(--text-primary)]">{idea.title}</h3>
              <button
                onClick={() => deleteIdea(idea.id)}
                className="rounded p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {idea.content && (
              <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{idea.content}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: idea.color }}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {new Date(idea.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-[var(--text-secondary)]">
          Keine Ideen gefunden. Doppelklicke auf den Canvas, um eine zu erstellen.
        </div>
      )}
    </div>
  )
}
