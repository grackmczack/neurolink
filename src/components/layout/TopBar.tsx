import { useNoteStore } from '@/store/noteStore'
import { useUIStore } from '@/store/uiStore'
import { Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const createNote = useNoteStore((s) => s.createNote)
  const setSidebar = useUIStore((s) => s.setSidebar)

  const handleQuickAdd = async () => {
    await createNote({ title: 'Neue Notiz' })
    setSidebar(false)
  }

  return (
    <header className="flex h-12 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      <Button size="sm" onClick={handleQuickAdd}>
        <Plus className="h-4 w-4" />
        Neue Notiz
      </Button>

      <button
        onClick={toggleTheme}
        className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
