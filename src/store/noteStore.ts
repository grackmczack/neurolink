import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Note, NoteInput, NoteUpdate } from '@/types'

// ─── localStorage Persistenz ─────────────────────────────────────

const STORAGE_KEY = 'neurolink_notes'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Note[]
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

// ─── Store ───────────────────────────────────────────────────────

interface NoteState {
  notes: Note[]
  activeNoteId: string | null
  editing: boolean

  init: () => Promise<void>
  createNote: (input: NoteInput) => Promise<Note>
  updateNote: (id: string, update: NoteUpdate) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  getNote: (id: string) => Note | null
  getNoteByTitle: (title: string) => Note | null
  setActiveNote: (id: string | null) => void
  setEditing: (editing: boolean) => void
  /** Alle Notizen, die auf eine gegebene Notiz verlinken */
  getBacklinks: (id: string) => Note[]
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  editing: false,

  init: async () => {
    const notes = loadNotes()
    set({ notes, activeNoteId: notes[0]?.id ?? null })
  },

  createNote: async (input) => {
    const now = Date.now()
    const note: Note = {
      id: uuidv4(),
      title: input.title || 'Untitled',
      body: input.body ?? '',
      createdAt: now,
      updatedAt: now,
    }
    set((s) => {
      const notes = [...s.notes, note]
      saveNotes(notes)
      return { notes, activeNoteId: note.id, editing: true }
    })
    return note
  },

  updateNote: async (id, update) => {
    set((s) => {
      const notes = s.notes.map((n) =>
        n.id === id ? { ...n, ...update, updatedAt: Date.now() } : n,
      )
      saveNotes(notes)
      return { notes }
    })
  },

  deleteNote: async (id) => {
    set((s) => {
      const notes = s.notes.filter((n) => n.id !== id)
      saveNotes(notes)
      const nextActive = s.activeNoteId === id
        ? notes[0]?.id ?? null
        : s.activeNoteId
      return { notes, activeNoteId: nextActive }
    })
  },

  getNote: (id) => get().notes.find((n) => n.id === id) ?? null,

  getNoteByTitle: (title) =>
    get().notes.find(
      (n) => n.title.toLowerCase() === title.toLowerCase(),
    ) ?? null,

  setActiveNote: (id) => set({ activeNoteId: id, editing: false }),

  setEditing: (editing) => set({ editing }),

  getBacklinks: (id) => {
    const note = get().getNote(id)
    if (!note) return []
    const linkPattern = new RegExp(
      `\\[\\[${note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`,
      'i',
    )
    return get().notes.filter((n) => n.id !== id && linkPattern.test(n.body))
  },
}))
