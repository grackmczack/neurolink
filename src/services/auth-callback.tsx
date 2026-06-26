import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

// ─── OAuth Callback Handler ──────────────────────────────────────
// Wird auf /auth/callback geroutet. Tauscht den Code gegen ein Token.

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const err = params.get('error')

    if (err) {
      setError(`Google OAuth Fehler: ${err}`)
      return
    }

    if (!code) {
      setError('Kein Authorization Code empfangen.')
      return
    }

    // Code im localStorage zwischenspeichern für die Settings-Seite,
    // die den Token-Austausch durchführt (da sie Client-ID/Secret hat)
    localStorage.setItem('neurolink-oauth-code', code)
    navigate('/settings')
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
      {error ? (
        <div className="text-center">
          <p className="mb-4 text-[var(--danger)]">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white"
          >
            Zurück zur App
          </button>
        </div>
      ) : (
        <p className="text-[var(--text-secondary)]">Authentifizierung läuft...</p>
      )}
    </div>
  )
}

export function AuthRoutes() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  )
}
