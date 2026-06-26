// ─── NeuroLink Note Model ─────────────────────────────────────────

export type UUID = string
export type Timestamp = number

/** Eine Markdown-Notiz mit Wiki-Style Links */
export interface Note {
  id: UUID
  title: string
  body: string // Markdown mit [[note-title]] Links
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface NoteInput {
  title: string
  body?: string
}

export interface NoteUpdate {
  title?: string
  body?: string
}
