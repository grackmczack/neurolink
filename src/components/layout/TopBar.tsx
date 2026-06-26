import { Menu, Moon, Sun, Plus } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useGraphStore } from '@/store/graphStore'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const addIdea = useGraphStore((s) => s.addIdea)

  const handleQuickAdd = async () => {
    const title = prompt('Ideen-Titel:')
    if (title) await addIdea(title)
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

      <button
        onClick={handleQuickAdd}
        className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-dim)]"
      >
        <Plus className="h-4 w-4" />
        Neue Idee
      </button>

      <button
        onClick={toggleTheme}
        className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  )
}
