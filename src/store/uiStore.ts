import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

const STORAGE_KEY = 'neurolink-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: light)') ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  sidebarOpen: true,

  toggleTheme: () => {
    set((s) => {
      const next: Theme = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    })
  },

  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}))
