import { useUIStore } from '@/store/uiStore'
import { useNoteStore } from '@/store/noteStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NoteView } from '@/components/editor/NoteView'
import { NoteEditor } from '@/components/editor/NoteEditor'

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const editing = useNoteStore((s) => s.editing)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar als Overlay auf Mobile, fest auf Desktop */}
      {sidebarOpen && (
        <>
          {/* Backdrop auf Mobile */}
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => useUIStore.getState().setSidebar(false)}
          />
          <div className="fixed z-30 h-full md:static md:z-auto">
            <Sidebar />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {activeNoteId ? (
            editing ? <NoteEditor /> : <NoteView />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-lg text-[var(--text-secondary)]">
                  Willkommen bei NeuroLink
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Erstelle deine erste Notiz, um zu starten.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
