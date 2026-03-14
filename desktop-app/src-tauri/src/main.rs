// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::menu::{Menu, MenuItem};

struct BackendProcess(Mutex<Option<Child>>);

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let app_handle = app.handle();
            
            // Create tray menu
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let exit_item = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &exit_item])?;
            
            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "exit" => {
                            stop_backend(app);
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            
            // Start backend server
            start_backend(&app_handle);
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_backend(app: &tauri::AppHandle) {
    // Get the resource directory
    let resource_dir = app.path()
        .resource_dir()
        .expect("failed to get resource dir");
    
    let backend_path = resource_dir
        .join("backend")
        .join("llmfit-backend.exe");

    println!("Starting backend from: {:?}", backend_path);

    let child = Command::new(backend_path)
        .arg("--port")
        .arg("8000")
        .spawn()
        .expect("failed to start backend");

    let state: tauri::State<BackendProcess> = app.state();
    *state.0.lock().unwrap() = Some(child);

    println!("Backend started on port 8000");
}

fn stop_backend(app: &tauri::AppHandle) {
    let state: tauri::State<BackendProcess> = app.state();
    let mut child_option = state.0.lock().unwrap();
    if let Some(mut child) = child_option.take() {
        let _ = child.kill();
        println!("Backend stopped");
    }
}
