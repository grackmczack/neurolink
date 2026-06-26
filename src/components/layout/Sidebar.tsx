import { useState, useMemo } from 'react'
import { Brain, Search, Plus, FileText } from 'lucide-react'
import { useNoteStore } from '@/store/noteStore'
import { useUIStore } from '@/store/uiStore'
import { clsx } from 'clsx'

export function Sidebar() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const createNote = useNoteStore((s) => s.createNote)
  const setSidebar = useUIStore((s) => s.setSidebar)

  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      notes
        .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, query],
  )

  const handleNew = async () => {
    await createNote({ title: 'Neue Notiz' })
    setSidebar(false)
  }

  return (
    <aside className="flex w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Brain className="h-5 w-5 text-[var(--accent)]" />
        <span className="text-lg font-semibold tracking-tight">NeuroLink</span>
      </div>

      {/* Neue Notiz */}
      <div className="px-3 pb-2">
        <button
          onClick={handleNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-dim)]"
        >
          <Plus className="h-4 w-4" />
          Neue Notiz
        </button>
      </div>

      {/* Suche */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Suchen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Notizen-Liste */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[var(--text-secondary)]">
            Noch keine Notizen. Klicke auf "Neue Notiz" zum Starten.
          </p>
        ) : (
          filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setActiveNote(note.id)
                setSidebar(false)
              }}
              className={clsx(
                'mb-0.5 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                note.id === activeNoteId
                  ? 'bg-[var(--accent-dim)]/20 text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
              )}
            >
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{note.title}</p>
                <p className="truncate text-xs text-[var(--text-secondary)]">
                  {new Date(note.updatedAt).toLocaleDateString('de-DE')}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)]">
        {notes.length} Notiz{notes.length !== 1 ? 'en' : ''}
      </div>
    </aside>
  )
}
