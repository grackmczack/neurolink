# NeuroLink 🧠

**Ideensammler mit neurologischer Verknüpfung** — Ein graph-basierter Idea-Manager.
Ideen sind Knoten, Verbindungen sind typisierte Kanten (Synapsen). Visuell bearbeitbar auf einem interaktiven Canvas.

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS v4 |
| State | Zustand |
| Canvas | React Flow (@xyflow/react) |
| Editor | TipTap (geplant) |
| Desktop | Tauri v2 (geplant) |
| Mobile | Capacitor (geplant) |
| Storage | SQLite (Tauri/Capacitor) / In-Memory (Dev) |
| Sync | Google Drive API (drive.appdata) |

## Quick Start

```bash
# Dependencies
npm install

# Dev-Server (http://localhost:1420)
npm run dev

# Production Build
npm run build

# Preview Build
npm run preview
```

## Projekt-Struktur

```
neurolink/
├── src/
│   ├── components/
│   │   ├── canvas/      # React Flow Idea-Graph
│   │   ├── layout/      # Sidebar, TopBar, AppLayout
│   │   └── ui/          # Wiederverwendbare UI-Komponenten
│   ├── db/              # DB-Client-Interface + Implementierungen
│   │   ├── client.ts    # Interface & Helpers
│   │   ├── memory-db.ts # In-Memory (Dev-Fallback)
│   │   └── schema.sql   # SQLite Schema
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Utility-Funktionen
│   ├── services/        # Google Drive Sync (Phase 4)
│   ├── store/           # Zustand Stores
│   │   ├── graphStore.ts
│   │   └── uiStore.ts
│   ├── types/           # TypeScript Domain-Modelle
│   └── App.tsx
├── .env.example         # Google OAuth Credentials (Phase 4)
├── vite.config.ts
└── package.json
```

## Datenmodell

Siehe `src/db/schema.sql` für das vollständige SQLite-Schema.

**Kern-Entitäten:**
- **Idea** — Knoten mit Titel, Content, Position, Color
- **Connection** — Gerichtete Kante (source→target) mit Type und Weight (0.0–1.0)
- **Tag** — Labels für Ideen (M:N)
- **Cluster** — Gruppen von Ideen
- **SyncMeta** — Cloud-Sync-Zustand pro Gerät

**Connection-Types:** `associates`, `extends`, `contradicts`, `inspires`, `refines`, `custom`

## Build-Targets (geplant)

### Desktop (Tauri)
```bash
npm run tauri dev    # Development
npm run tauri build  # Production (Windows/Linux/Mac)
```

### Android (Capacitor)
```bash
npx cap add android
npx cap sync
npx cap open android  # Öffnet Android Studio
```

## Google Drive Sync (Phase 4)

Die App nutzt den `drive.appdata` Scope — Daten werden in einem versteckten App-Ordner auf dem Google Drive des Nutzers gespeichert.

1. Google Cloud Project erstellen → Drive API aktivieren
2. OAuth 2.0 Client ID erstellen (Typ: Desktop App)
3. `.env` Datei anlegen (siehe `.env.example`)

## Lizenz

MIT
