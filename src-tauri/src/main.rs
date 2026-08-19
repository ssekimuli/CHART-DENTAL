// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_app_version(window: Window) -> String {
    window.app_handle().package_info().version.to_string()
}

#[tauri::command]
fn check_update() -> String {
    "Update check initiated".to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, get_app_version, check_update])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
