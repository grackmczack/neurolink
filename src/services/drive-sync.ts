// ─── Google Drive Sync Configuration ─────────────────────────────
// Diese Werte müssen aus der Google Cloud Console geholt werden.
// Siehe README.md für Schritt-für-Schritt-Anleitung.
//
// ⚠️  TRAGE HIER DEINE CREDENTIALS EIN (oder in .env):
//
// const CLIENT_ID = 'your_client_id.apps.googleusercontent.com'
// const CLIENT_SECRET = 'your_client_secret'
//
// Diese werden in Phase 4 von Grack eingefügt.

import { getDB } from '@/db/memory-db'
import type { Connection, Idea, SyncMeta } from '@/types'

// Scopes: drive.appdata = versteckter App-Ordner auf dem User-Drive
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:1420/auth/callback'

// Token-Speicher (localStorage für Web, später Tauri/Capacitor SecureStorage)
const TOKEN_KEY = 'neurolink-gdrive-token'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

interface StoredToken {
  accessToken: string
  refreshToken: string | null
  expiresAt: number // Unix ms
}

// ─── Token Management ────────────────────────────────────────────

export function getStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredToken
  } catch {
    return null
  }
}

export function isTokenValid(): boolean {
  const token = getStoredToken()
  if (!token) return false
  return Date.now() < token.expiresAt - 60000 // 1 Min Puffer
}

export function storeToken(resp: TokenResponse): void {
  const token: StoredToken = {
    accessToken: resp.access_token,
    refreshToken: resp.refresh_token ?? getStoredToken()?.refreshToken ?? null,
    expiresAt: Date.now() + resp.expires_in * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ─── OAuth Flow ──────────────────────────────────────────────────

export function getOAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent', // erzwingt refresh_token
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return resp.json()
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse | null> {
  const stored = getStoredToken()
  if (!stored?.refreshToken) return null

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: stored.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  if (!resp.ok) {
    clearToken()
    return null
  }
  return resp.json()
}

// ─── Drive API: App-Data Folder ──────────────────────────────────

const API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const SYNC_FILE_NAME = 'neurolink_sync.json'

async function getValidToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (isTokenValid()) {
    return getStoredToken()!.accessToken
  }
  const refreshed = await refreshAccessToken(clientId, clientSecret)
  if (refreshed) {
    storeToken(refreshed)
    return refreshed.access_token
  }
  return null
}

async function findSyncFile(accessToken: string): Promise<string | null> {
  const resp = await fetch(
    `${API_BASE}/files?spaces=appDataFolder&q=name='${SYNC_FILE_NAME}'&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!resp.ok) return null
  const data = await resp.json()
  return data.files?.[0]?.id ?? null
}

async function createSyncFile(accessToken: string, content: string): Promise<string> {
  // Erst leere Datei erstellen, dann Inhalt hochladen
  const createResp = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: SYNC_FILE_NAME,
      parents: ['appDataFolder'],
    }),
  })
  if (!createResp.ok) throw new Error('Failed to create sync file')
  const file = await createResp.json()
  const fileId = file.id

  // Inhalt hochladen (multipart upload)
  const updateResp = await fetch(`${UPLOAD_URL}/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: createMultipartBody(content),
  })
  if (!updateResp.ok) throw new Error('Failed to upload sync data')
  return fileId
}

function createMultipartBody(jsonContent: string): string {
  const boundary = 'neurolink_boundary_' + Math.random().toString(36).slice(2)
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    `\r\n--${boundary}--`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return body
}

async function downloadSyncFile(accessToken: string, fileId: string): Promise<string | null> {
  const resp = await fetch(`${API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (resp.status === 404) return null
  if (!resp.ok) throw new Error('Failed to download sync file')
  return resp.text()
}

// ─── Sync Logic ──────────────────────────────────────────────────

export interface SyncPayload {
  ideas: Idea[]
  connections: Connection[]
  lastVersion: number
  exportedAt: number
}

export async function syncToDrive(
  clientId: string,
  clientSecret: string,
  deviceId: string,
): Promise<{ uploaded: number; downloaded: number } | null> {
  const token = await getValidToken(clientId, clientSecret)
  if (!token) throw new Error('Nicht authentifiziert. Bitte zuerst OAuth durchlaufen.')

  const db = await getDB()
  const [ideas, connections] = await Promise.all([db.getAllIdeas(true), db.getAllConnections()])

  // Lokaler Sync-Stand (für zukünftige Delta-Syncs)
  // const localMeta = await db.getSyncMeta(deviceId)
  const lastVersion = Math.max(
    ...ideas.map((i) => i.syncVersion),
    ...connections.map((c) => c.syncVersion),
    0,
  )

  // Remote-Stand herunterladen
  const fileId = await findSyncFile(token)
  let remotePayload: SyncPayload | null = null
  if (fileId) {
    const raw = await downloadSyncFile(token, fileId)
    if (raw) {
      try {
        remotePayload = JSON.parse(raw) as SyncPayload
      } catch {
        remotePayload = null
      }
    }
  }

  // Merge: Last-Write-Wins auf syncVersion-Ebene
  let mergedIdeas = ideas
  let mergedConnections = connections
  if (remotePayload) {
    const ideaMap = new Map<string, Idea>(ideas.map((i) => [i.id, i]))
    for (const remoteIdea of remotePayload.ideas) {
      const local = ideaMap.get(remoteIdea.id)
      if (!local || remoteIdea.syncVersion > local.syncVersion) {
        ideaMap.set(remoteIdea.id, remoteIdea)
      }
    }
    mergedIdeas = [...ideaMap.values()]

    const connMap = new Map<string, Connection>(connections.map((c) => [c.id, c]))
    for (const remoteConn of remotePayload.connections) {
      const local = connMap.get(remoteConn.id)
      if (!local || remoteConn.syncVersion > local.syncVersion) {
        connMap.set(remoteConn.id, remoteConn)
      }
    }
    mergedConnections = [...connMap.values()]

    // Gemergte Daten lokal speichern
    await db.bulkUpsertIdeas(mergedIdeas)
    await db.bulkUpsertConnections(mergedConnections)
  }

  // Neuer Stand hochladen
  const payload: SyncPayload = {
    ideas: mergedIdeas,
    connections: mergedConnections,
    lastVersion,
    exportedAt: Date.now(),
  }

  const jsonContent = JSON.stringify(payload)
  if (fileId) {
    // Update bestehende Datei
    await fetch(`${UPLOAD_URL}/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: createMultipartBody(jsonContent),
    })
  } else {
    // Erstelle neue Datei
    await createSyncFile(token, jsonContent)
  }

  // Sync-Meta aktualisieren
  const meta: SyncMeta = {
    deviceId,
    lastSyncAt: Date.now(),
    lastVersion,
    cursorToken: null,
  }
  await db.upsertSyncMeta(meta)

  const uploaded = mergedIdeas.length
  const downloaded = remotePayload ? remotePayload.ideas.length : 0
  return { uploaded, downloaded }
}
