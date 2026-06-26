import { NavLink } from 'react-router-dom'
import { Brain, List, Settings, Cloud } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: 'Canvas', icon: Brain },
  { to: '/ideas', label: 'Ideen', icon: List },
]

export function Sidebar() {

  return (
    <aside className="flex w-60 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-2 px-4 py-4">
        <Brain className="h-6 w-6 text-[var(--accent)]" />
        <span className="text-lg font-semibold tracking-tight">NeuroLink</span>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent-dim)]/20 text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border)] px-2 py-2">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          <Cloud className="h-4 w-4" />
          Sync
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}
