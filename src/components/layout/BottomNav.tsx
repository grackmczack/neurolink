import { NavLink } from 'react-router-dom'
import { Brain, List } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: 'Canvas', icon: Brain },
  { to: '/ideas', label: 'Ideen', icon: List },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-[var(--border)] bg-[var(--bg-secondary)] md:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs transition-colors',
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)]',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
