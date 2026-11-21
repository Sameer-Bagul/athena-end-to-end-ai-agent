#![allow(clippy::collapsible_if)]

pub mod commands;
pub mod error;
pub mod services;
pub mod state;

use std::sync::Arc;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

use commands::agent::*;
use commands::audio::*;
use commands::chat::*;
use commands::mcp::*;
use commands::model_registry::*;
use commands::ollama::*;
use commands::rag::*;
use commands::system::*;
use commands::tools::*;
use commands::window::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| dirs::data_dir().unwrap_or_default().join("athena"));

            let app_state = state::AppState::new(app_data_dir)
                .expect("Failed to initialize Athena AppState");
            app.manage(Arc::new(app_state));

            // Register Alt+Space Global Shortcut
            let app_handle = app.handle().clone();
            let _ = app.global_shortcut().on_shortcut("Alt+Space", move |_app, _shortcut, event| {
                if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    log::info!("Alt+Space Global Shortcut triggered");
                    if let Some(main) = app_handle.get_webview_window("main") {
                        let _ = main.emit("shortcut:pressed", ());
                    }
                    if let Some(widget) = app_handle.get_webview_window("widget") {
                        let _ = widget.emit("shortcut:pressed", ());
                    }
                }
            });

            // Window event listeners for Auto-Widget toggle on minimize/restore
            if let Some(main_win) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                main_win.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Resized(_) => {
                            if let Some(main) = handle.get_webview_window("main") {
                                if main.is_minimized().unwrap_or(false) {
                                    if let Some(widget) = handle.get_webview_window("widget") {
                                        let _ = widget.show();
                                        let _ = widget.set_focus();
                                    }
                                }
                            }
                        }
                        tauri::WindowEvent::Focused(true) => {
                            if let Some(widget) = handle.get_webview_window("widget") {
                                let _ = widget.hide();
                            }
                        }
                        _ => {}
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window controls
            window_minimize,
            window_maximize,
            window_close,
            widget_open,
            widget_close,
            widget_resize,
            sync_broadcast,
            widget_input,
            // System controls
            system_get_volume,
            system_set_volume,
            system_set_brightness,
            system_get_battery,
            system_list_files,
            system_read_file,
            system_file_stats,
            // Chat
            chat_save_history,
            chat_load_history,
            // Tools
            tool_web_search,
            tool_weather,
            tool_clock,
            tool_timer,
            tool_news,
            // RAG
            rag_upload_document,
            rag_status,
            rag_clear,
            rag_get_context,
            // Agent
            agent_query,
            agent_query_stream,
            agent_browser_query_stream,
            // Ollama
            ollama_check_status,
            ollama_list_models,
            ollama_delete_model,
            ollama_pull_model,
            // Model Registry
            model_check_status,
            model_pull,
            model_delete,
            // Audio
            tts_generate,
            stt_transcribe,
            // MCP
            agent_call_mcp,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
