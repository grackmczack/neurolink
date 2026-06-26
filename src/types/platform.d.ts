// ─── Ambient Module Declarations für Tauri/Capacitor ────────────
// Diese Module sind nur in den jeweiligen Plattform-Builds verfügbar.
// Im Web-Dev-Build werden sie nicht geladen (dynamischer Import).

declare module '@tauri-apps/plugin-sql' {
  export interface Database {
    execute(sql: string, bindValues?: unknown[]): Promise<void>
    select<T = Record<string, unknown>>(sql: string, bindValues?: unknown[]): Promise<T[]>
    close(): Promise<void>
  }
  export const Database: {
    load(connection: string): Promise<Database>
  }
  export default Database
  export interface Migration {
    version: number
    description: string
    sql: string
    kind: 'up' | 'down'
  }
}

declare module '@tauri-apps/api' {
  export const invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>
}
