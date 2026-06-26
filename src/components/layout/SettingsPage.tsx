import { useState, useEffect } from 'react'
import { Cloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import {
  getOAuthUrl,
  exchangeCodeForToken,
  syncToDrive,
  isTokenValid,
  clearToken,
  getStoredToken,
} from '@/services/drive-sync'
import { useGraphStore } from '@/store/graphStore'

// ─── Sync Settings Page ──────────────────────────────────────────
// Hier werden Google OAuth Credentials eingetragen und Sync ausgelöst.

const CLIENT_ID_KEY = 'neurolink-client-id'
const CLIENT_SECRET_KEY = 'neurolink-client-secret'
const DEVICE_ID_KEY = 'neurolink-device-id'

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function SettingsPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'ok' | 'error'>('none')
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const bulkUpsertIdeas = useGraphStore((s) => s.bulkUpsertIdeas)
  const bulkUpsertConnections = useGraphStore((s) => s.bulkUpsertConnections)

  useEffect(() => {
    const savedId = localStorage.getItem(CLIENT_ID_KEY) ?? ''
    const savedSecret = localStorage.getItem(CLIENT_SECRET_KEY) ?? ''
    setClientId(savedId)
    setClientSecret(savedSecret)
    setAuthStatus(isTokenValid() ? 'ok' : 'none')

    // Check für OAuth-Callback (Code wurde in localStorage abgelegt)
    const code = localStorage.getItem('neurolink-oauth-code')
    if (code && savedId && savedSecret) {
      setAuthStatus('pending')
      exchangeCodeForToken(code, savedId, savedSecret)
        .then(() => {
          localStorage.removeItem('neurolink-oauth-code')
          setAuthStatus('ok')
        })
        .catch((err) => {
          console.error(err)
          setAuthStatus('error')
        })
    }
  }, [])

  const handleSaveCredentials = () => {
    localStorage.setItem(CLIENT_ID_KEY, clientId)
    localStorage.setItem(CLIENT_SECRET_KEY, clientSecret)
    setSyncStatus('Credentials gespeichert.')
  }

  const handleStartOAuth = () => {
    if (!clientId) {
      setSyncStatus('Bitte zuerst Client ID eingeben.')
      return
    }
    localStorage.setItem(CLIENT_ID_KEY, clientId)
    window.location.href = getOAuthUrl(clientId)
  }

  const handleSync = async () => {
    if (!clientId || !clientSecret) {
      setSyncStatus('Bitte zuerst OAuth Credentials eingeben.')
      return
    }
    setSyncing(true)
    setSyncStatus(null)
    try {
      const result = await syncToDrive(clientId, clientSecret, getDeviceId())
      if (result) {
        setSyncStatus(`Sync fertig: ${result.uploaded} Ideen hochgeladen, ${result.downloaded} heruntergeladen.`)
        // Store aktualisieren
        const { getGraph } = useGraphStore.getState()
        const graph = getGraph()
        await bulkUpsertIdeas(graph.ideas)
        await bulkUpsertConnections(graph.connections)
      }
    } catch (err) {
      setSyncStatus(`Sync-Fehler: ${(err as Error).message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = () => {
    clearToken()
    setAuthStatus('none')
    setSyncStatus('Google Drive getrennt.')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-bold text-[var(--text-primary)]">Sync Settings</h1>

      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">Google Drive Sync</h2>
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Die App speichert Daten in einem versteckten App-Ordner auf deinem Google Drive.
          Niemand sonst hat Zugriff darauf.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxx"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSaveCredentials}>
              Speichern
            </Button>
            <Button
              variant={authStatus === 'ok' ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleStartOAuth}
              disabled={authStatus === 'pending'}
            >
              {authStatus === 'pending' ? 'Authentifizierung...' : 'Mit Google verbinden'}
            </Button>
            {authStatus === 'ok' && (
              <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                Trennen
              </Button>
            )}
          </div>

          {/* Auth Status */}
          <div className="flex items-center gap-2 text-sm">
            {authStatus === 'ok' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                <span className="text-[var(--success)]">Verbunden</span>
              </>
            )}
            {authStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
                <span className="text-[var(--danger)]">Authentifizierung fehlgeschlagen</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Sync Action */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Synchronisation</h2>
          {getStoredToken() && (
            <span className="text-xs text-[var(--text-secondary)]">
              Gerät: {getDeviceId().slice(0, 8)}...
            </span>
          )}
        </div>

        <Button onClick={handleSync} disabled={syncing || authStatus !== 'ok'}>
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Synchronisiere...
            </>
          ) : (
            'Jetzt synchronisieren'
          )}
        </Button>

        {syncStatus && (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">{syncStatus}</p>
        )}
      </Card>

      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-secondary)]">
        <h3 className="mb-2 font-medium text-[var(--text-primary)]">Setup-Anleitung</h3>
        <ol className="list-inside list-decimal space-y-1">
          <li>Öffne die <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">Google Cloud Console</a></li>
          <li>Erstelle ein neues Projekt oder wähle ein bestehendes</li>
          <li>Aktiviere die <strong>Google Drive API</strong></li>
          <li>Erstelle OAuth 2.0 Client Credentials (Typ: Desktop App)</li>
          <li>Kopiere Client ID und Client Secret in die Felder oben</li>
          <li>Klicke auf "Mit Google verbinden" und erlaube den Zugriff</li>
        </ol>
      </div>
    </div>
  )
}
