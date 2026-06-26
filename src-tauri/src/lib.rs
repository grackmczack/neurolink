#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationStrategy};

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "Create NeuroLink schema",
        sql: include_str!("../src/db/schema.sql"),
        kind: MigrationStrategy::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:neurolink.db", migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
