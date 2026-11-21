use tauri::{AppHandle, Emitter, Manager, PhysicalSize, WebviewWindow};

#[tauri::command]
pub async fn window_minimize(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_maximize(window: WebviewWindow) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn window_close(window: WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn widget_open(app: AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget.show().map_err(|e| e.to_string())?;
        widget.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn widget_close(app: AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn widget_resize(app: AppHandle, width: u32, height: u32) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget
            .set_size(PhysicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn sync_broadcast(app: AppHandle, data: serde_json::Value) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        let _ = widget.emit("sync:receive", data);
    }
    Ok(())
}

#[tauri::command]
pub async fn widget_input(app: AppHandle, text: String) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.emit("widget:receive-input", text);
    }
    Ok(())
}

