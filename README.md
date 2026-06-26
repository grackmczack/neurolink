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
| Desktop | Tauri v2 |
| Mobile | Capacitor 6 (Android) |
| Storage | SQLite (Tauri/Capacitor) / In-Memory (Dev) |
| Sync | Google Drive API (drive.appdata) |

## Quick Start

```bash
# Dependencies
npm install

# Dev-Server (http://localhost:1420)
npm run dev

# Production Build (Web)
npm run build

# Preview Build
npm run preview
```

## Desktop Build (Tauri)

**Voraussetzungen:** Rust + Cargo installiert ([rustup.rs](https://rustup.rs))

```bash
# Tauri CLI installieren (falls nicht vorhanden)
npm install -D @tauri-apps/cli

# Development (öffnet Desktop-Fenster)
npm run tauri:dev

# Production Build (erstellt .deb / .AppImage / .msi / .app)
npm run tauri:build
```

Die Binaries liegen danach in `src-tauri/target/release/bundle/`.

## Android Build (Capacitor)

**Voraussetzungen:** Android Studio + JDK 17 installiert

```bash
# Capacitor Dependencies
npm install

# Android Platform hinzufügen
npm run cap:android

# Nach Änderungen am Web-Code synchronisieren
npm run cap:sync

# In Android Studio öffnen
npm run cap:open
```

In Android Studio dann "Run" drücken, um die APK zu bauen.

## Projekt-Struktur

```
neurolink/
├── src/
│   ├── components/
│   │   ├── canvas/        # React Flow Idea-Graph + Detail-Modal
│   │   ├── layout/        # Sidebar, TopBar, BottomNav, AppLayout
│   │   └── ui/            # Button, Input, Card, Modal, Badge
│   ├── db/
│   │   ├── client.ts      # DB-Interface & Helpers
│   │   ├── memory-db.ts   # In-Memory (Dev) + Factory
│   │   ├── tauri-db.ts    # Tauri SQLite (Desktop)
│   │   └── schema.sql     # SQLite Schema
│   ├── hooks/             # useGraph
│   ├── lib/               # graph-utils (Traversal, Cluster)
│   ├── services/          # drive-sync, auth-callback
│   ├── store/             # graphStore, uiStore
│   ├── types/             # Domain-Modelle
│   └── App.tsx
├── src-tauri/             # Tauri Desktop (Rust)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── lib.rs         # Tauri Plugin-SQL + Migrations
│       └── main.rs
├── capacitor.config.ts    # Android Config
├── .env.example           # Google OAuth Credentials
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

**Sync-Strategie:** Last-Write-Wins über `sync_version` (monoton steigend). Soft-Deletes via Tombstone (`deleted_at`).

## Google Drive Sync Setup

1. Öffne die [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die **Google Drive API**
4. Erstelle OAuth 2.0 Client Credentials (Typ: Desktop App)
5. Trage Client ID und Client Secret in der App unter **Settings** ein
6. Klicke auf "Mit Google verbinden" und erlaube den Zugriff

Die App nutzt den `drive.appdata` Scope — Daten werden in einem versteckten App-Ordner auf deinem Google Drive gespeichert. Niemand sonst hat Zugriff.

## Lizenz

MIT
