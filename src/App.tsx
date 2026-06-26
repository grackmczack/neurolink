import { useEffect } from 'react'
import { useNoteStore } from '@/store/noteStore'
import { useUIStore } from '@/store/uiStore'
import { AppLayout } from '@/components/layout/AppLayout'

export default function App() {
  const init = useNoteStore((s) => s.init)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    init()
  }, [init])

  return <AppLayout />
}
