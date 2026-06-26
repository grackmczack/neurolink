import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { CanvasPage } from '@/components/canvas/CanvasPage'
import { IdeasListPage } from '@/components/layout/IdeasListPage'

export default function App() {
  const init = useGraphStore((s) => s.init)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    init()
  }, [init])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CanvasPage />} />
        <Route path="/ideas" element={<IdeasListPage />} />
      </Route>
    </Routes>
  )
}
