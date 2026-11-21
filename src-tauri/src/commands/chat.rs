use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn chat_save_history(
    state: State<'_, Arc<AppState>>,
    history: serde_json::Value,
) -> Result<bool, String> {
    let history_path = state.app_data_dir.join("chat-history.json");
    let json_str = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
    tokio::fs::write(&history_path, json_str)
        .await
        .map_err(|e| e.to_string())?;

    // Also persist in SQLite
    if let Ok(conn) = state.db.lock() {
        if let Some(arr) = history.as_array() {
            let _ = conn.execute("DELETE FROM chat_history WHERE session_id = 'default'", []);
            for msg in arr {
                let role = msg.get("role").and_then(|r| r.as_str()).unwrap_or("user");
                let content = msg.get("content").and_then(|c| c.as_str()).unwrap_or("");
                let _ = conn.execute(
                    "INSERT INTO chat_history (session_id, role, content) VALUES ('default', ?1, ?2)",
                    [role, content],
                );
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub async fn chat_load_history(state: State<'_, Arc<AppState>>) -> Result<serde_json::Value, String> {
    let history_path = state.app_data_dir.join("chat-history.json");
    if history_path.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&history_path).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(arr) = val.as_array() {
                    if !arr.is_empty() {
                        return Ok(val);
                    }
                }
            }
        }
    }

    // Try fallback from chat.json in current directory
    if let Ok(content) = tokio::fs::read_to_string("chat.json").await {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
            return Ok(val);
        }
    }

    Ok(serde_json::Value::Null)
}

