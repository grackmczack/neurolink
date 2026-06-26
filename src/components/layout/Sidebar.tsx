import { NavLink } from 'react-router-dom'
import { Brain, List, Settings, Cloud } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Canvas', icon: Brain },
  { to: '/ideas', label: 'Ideen', icon: List },
  { to: '/settings', label: 'Sync', icon: Cloud },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-2 px-4 py-4">
        <Brain className="h-6 w-6 text-[var(--accent)]" />
        <span className="text-lg font-semibold tracking-tight">NeuroLink</span>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map(({ to, label, icon: Icon }, idx) => (
          <NavLink
            key={`${to}-${idx}`}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 rounded-lg bg-[var(--accent-dim)]/20 px-3 py-2 text-sm font-medium text-[var(--accent)]'
                : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
