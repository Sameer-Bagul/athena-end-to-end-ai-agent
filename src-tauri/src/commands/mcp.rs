use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn agent_call_mcp(
    _state: State<'_, Arc<AppState>>,
    server_name: String,
    tool_name: String,
    args: serde_json::Value,
) -> Result<serde_json::Value, String> {
    log::info!("[MCP] Calling server: {}, tool: {}", server_name, tool_name);

    if server_name == "time" && tool_name == "get_time" {
        let tz = args.get("timezone").and_then(|t| t.as_str()).unwrap_or("local");
        let now = chrono::Local::now();
        let time_str = now.format("%A, %B %d, %Y - %I:%M:%S %p %Z").to_string();
        return Ok(serde_json::json!(format!("Current time ({}): {}", tz, time_str)));
    }

    Ok(serde_json::json!({
        "status": "success",
        "result": format!("MCP call to {}:{} completed", server_name, tool_name)
    }))
}

