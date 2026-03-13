// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

struct BackendProcess(Mutex<Option<Child>>);

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("Show", "show"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(SystemTrayMenuItem::new("Exit", "exit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let app_handle = app.handle();
            
            // Start backend server
            start_backend(&app_handle);
            
            Ok(())
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick {
                    position: _,
                    size: _,
                    ..
                } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        "exit" => {
                            stop_backend(app);
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Hide window instead of closing
                    event.window().hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_backend(app: &tauri::AppHandle) {
    let backend_path = app
        .path_resolver()
        .resolve_resource("backend/llmfit-backend.exe")
        .expect("failed to resolve backend executable");

    // Find available port
    let port = portpicker::pick_unused_port().expect("no available port");
    
    // Set environment variable for port
    std::env::set_var("LLMFIT_PORT", port.to_string());

    let child = Command::new(backend_path)
        .arg("--port")
        .arg(port.to_string())
        .spawn()
        .expect("failed to start backend");

    let state: tauri::State<BackendProcess> = app.state();
    *state.0.lock().unwrap() = Some(child);

    println!("Backend started on port {}", port);
}

fn stop_backend(app: &tauri::AppHandle) {
    let state: tauri::State<BackendProcess> = app.state();
    if let Some(mut child) = state.0.lock().unwrap().take() {
        let _ = child.kill();
        println!("Backend stopped");
    }
}
