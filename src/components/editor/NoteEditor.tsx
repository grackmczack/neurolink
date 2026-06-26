import { useRef, useState, useMemo, useEffect } from 'react'
import { useNoteStore } from '@/store/noteStore'
import { Button } from '@/components/ui'

// ─── NoteEditor: Markdown mit [[Wiki-Link]] Autocomplete ─────────

export function NoteEditor() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const updateNote = useNoteStore((s) => s.updateNote)
  const setEditing = useNoteStore((s) => s.setEditing)
  const deleteNote = useNoteStore((s) => s.deleteNote)

  const activeNote = notes.find((n) => n.id === activeNoteId)

  const [title, setTitle] = useState(activeNote?.title ?? '')
  const [body, setBody] = useState(activeNote?.body ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Autocomplete State
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompleteIndex, setAutocompleteIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState(0)

  useEffect(() => {
    setTitle(activeNote?.title ?? '')
    setBody(activeNote?.body ?? '')
  }, [activeNote?.id])

  if (!activeNote) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
        Keine Notiz ausgewählt.
      </div>
    )
  }

  // ─── Autocomplete: [[ erkennen ────────────────────────────────

  const filteredNotes = useMemo(() => {
    if (!autocompleteQuery) return notes.filter((n) => n.id !== activeNote.id).slice(0, 10)
    return notes
      .filter((n) => n.id !== activeNote.id)
      .filter((n) => n.title.toLowerCase().includes(autocompleteQuery.toLowerCase()))
      .slice(0, 10)
  }, [notes, autocompleteQuery, activeNote.id])

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const pos = e.target.selectionStart
    setBody(value)
    setCursorPos(pos)

    // Prüfe ob wir in einem [[ Link sind
    const beforeCursor = value.substring(0, pos)
    const lastOpen = beforeCursor.lastIndexOf('[[')
    const lastClose = beforeCursor.lastIndexOf(']]')

    if (lastOpen > lastClose && lastOpen >= 0) {
      const query = beforeCursor.substring(lastOpen + 2)
      // Nur wenn kein Leerzeichen oder newline im Query
      if (!query.includes('\n') && !query.includes(' ')) {
        setShowAutocomplete(true)
        setAutocompleteQuery(query)
        setAutocompleteIndex(0)
        return
      }
    }
    setShowAutocomplete(false)
  }

  const insertLink = (noteTitle: string) => {
    const before = body.substring(0, cursorPos)
    const after = body.substring(cursorPos)
    const lastOpen = before.lastIndexOf('[[')
    const newBody = before.substring(0, lastOpen) + `[[${noteTitle}]]` + after
    setBody(newBody)
    setShowAutocomplete(false)

    // Cursor hinter den Link setzen
    const newPos = lastOpen + noteTitle.length + 4
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(newPos, newPos)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAutocompleteIndex((i) => Math.min(i + 1, filteredNotes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAutocompleteIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filteredNotes[autocompleteIndex]) {
        insertLink(filteredNotes[autocompleteIndex].title)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowAutocomplete(false)
    }
  }

  const handleSave = async () => {
    await updateNote(activeNote.id, { title: title || 'Untitled', body })
    setEditing(false)
  }

  const handleDelete = async () => {
    if (confirm(`Notiz "${activeNote.title}" löschen?`)) {
      await deleteNote(activeNote.id)
    }
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          ← Zurück
        </Button>
        <div className="flex-1" />
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Löschen
        </Button>
        <Button size="sm" onClick={handleSave}>
          Speichern
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel"
          className="mb-4 w-full bg-transparent text-2xl font-bold text-[var(--text-primary)] focus:outline-none"
        />

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            placeholder="Schreibe in Markdown... Verlinde andere Notizen mit [[Notiz-Titel]]"
            className="min-h-[60vh] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
            spellCheck={false}
          />

          {/* Autocomplete Dropdown */}
          {showAutocomplete && filteredNotes.length > 0 && (
            <div
              className="absolute z-50 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] shadow-xl"
              style={{
                top: `${(cursorPos / Math.max(body.length, 1)) * 100}%`,
                left: '0',
                maxWidth: '300px',
              }}
            >
              {filteredNotes.map((note, i) => (
                <button
                  key={note.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertLink(note.title)
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                    i === autocompleteIndex
                      ? 'bg-[var(--accent-dim)]/20 text-[var(--accent)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {note.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
