import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNoteStore } from '@/store/noteStore'
import { useUIStore } from '@/store/uiStore'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Note } from '@/types'

// ─── Markdown mit [[Wiki-Links]] ─────────────────────────────────
// Wandelt [[Title]] in interne Links um, die die aktive Notiz wechseln.

function preprocessWikiLinks(body: string): string {
  // [[Title]] → [Title](#wiki:Title)
  return body.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    return `[${title}](#wiki:${encodeURIComponent(title)})`
  })
}

export function NoteView() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const setEditing = useNoteStore((s) => s.setEditing)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const getNoteByTitle = useNoteStore((s) => s.getNoteByTitle)
  const getBacklinks = useNoteStore((s) => s.getBacklinks)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const theme = useUIStore((s) => s.theme)

  const activeNote: Note | undefined = notes.find((n) => n.id === activeNoteId)
  const backlinks = activeNote ? getBacklinks(activeNote.id) : []

  const processedBody = useMemo(
    () => (activeNote ? preprocessWikiLinks(activeNote.body) : ''),
    [activeNote?.body],
  )

  if (!activeNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-[var(--text-secondary)]">Keine Notiz ausgewählt</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Wähle links eine Notiz aus oder erstelle eine neue.
          </p>
        </div>
      </div>
    )
  }

  const handleWikiLink = (href: string) => {
    if (href.startsWith('#wiki:')) {
      const title = decodeURIComponent(href.substring(6))
      const note = getNoteByTitle(title)
      if (note) {
        setActiveNote(note.id)
        return true
      }
    }
    return false
  }

  const handleDelete = async () => {
    if (confirm(`Notiz "${activeNote.title}" löschen?`)) {
      await deleteNote(activeNote.id)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" onClick={() => setEditing(true)}>
          <Edit className="h-3.5 w-3.5" />
          Bearbeiten
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl px-8 py-8">
          <h1 className="mb-6 text-3xl font-bold text-[var(--text-primary)]">
            {activeNote.title}
          </h1>

          <div
            className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}
            style={{
              '--tw-prose-body': 'var(--text-primary)',
              '--tw-prose-headings': 'var(--text-primary)',
              '--tw-prose-links': 'var(--accent)',
              '--tw-prose-code': 'var(--accent)',
              '--tw-prose-border': 'var(--border)',
            } as React.CSSProperties}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    onClick={(e) => {
                      if (href && handleWikiLink(href)) {
                        e.preventDefault()
                      }
                    }}
                    className={
                      href?.startsWith('#wiki:')
                        ? 'cursor-pointer text-[var(--accent)] underline decoration-dotted underline-offset-2 hover:text-[var(--accent-dim)]'
                        : 'text-[var(--accent)] underline'
                    }
                  >
                    {children}
                  </a>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  if (isBlock) {
                    return (
                      <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
                        <code>{children}</code>
                      </pre>
                    )
                  }
                  return (
                    <code className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--accent)]">
                      {children}
                    </code>
                  )
                },
              }}
            >
              {processedBody}
            </ReactMarkdown>
          </div>

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <div className="mt-12 border-t border-[var(--border)] pt-6">
              <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                Verlinkt von:
              </h3>
              <div className="flex flex-wrap gap-2">
                {backlinks.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setActiveNote(note.id)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]"
                  >
                    {note.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="mt-8 text-xs text-[var(--text-secondary)]">
            Erstellt: {new Date(activeNote.createdAt).toLocaleString('de-DE')} ·
            Aktualisiert: {new Date(activeNote.updatedAt).toLocaleString('de-DE')}
          </div>
        </article>
      </div>
    </div>
  )
}
