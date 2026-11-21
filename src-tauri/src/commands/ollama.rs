use crate::state::AppState;
use futures_util::StreamExt;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn ollama_check_status(state: State<'_, Arc<AppState>>) -> Result<serde_json::Value, String> {
    let res = state
        .http_client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await;

    match res {
        Ok(r) => Ok(serde_json::json!({ "ok": r.status().is_success() })),
        Err(_) => Ok(serde_json::json!({ "ok": false })),
    }
}

#[tauri::command]
pub async fn ollama_list_models(state: State<'_, Arc<AppState>>) -> Result<serde_json::Value, String> {
    let res = state
        .http_client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err("Failed to fetch models from Ollama".to_string());
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json.get("models").cloned().unwrap_or(serde_json::json!([])))
}

#[tauri::command]
pub async fn ollama_delete_model(
    state: State<'_, Arc<AppState>>,
    name: String,
) -> Result<serde_json::Value, String> {
    let res = state
        .http_client
        .delete("http://127.0.0.1:11434/api/delete")
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "ok": res.status().is_success() }))
}

#[tauri::command]
pub async fn ollama_pull_model(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    name: String,
) -> Result<(), String> {
    let client = state.http_client.clone();
    let model_name = name.clone();

    tokio::spawn(async move {
        let res = client
            .post("http://127.0.0.1:11434/api/pull")
            .json(&serde_json::json!({ "name": model_name, "stream": true }))
            .send()
            .await;

        match res {
            Ok(response) => {
                let mut stream = response.bytes_stream();
                let mut buffer = String::new();

                while let Some(item) = stream.next().await {
                    match item {
                        Ok(bytes) => {
                            buffer.push_str(&String::from_utf8_lossy(&bytes));
                            while let Some(pos) = buffer.find('\n') {
                                let line = buffer[..pos].trim().to_string();
                                buffer = buffer[pos + 1..].to_string();
                                if !line.is_empty() {
                                    if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&line) {
                                        if let Some(obj) = json.as_object_mut() {
                                            obj.insert("model".to_string(), serde_json::json!(model_name));
                                        }
                                        let _ = app.emit("ollama:pull-progress", json);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            let _ = app.emit(
                                "ollama:pull-progress",
                                serde_json::json!({
                                    "model": model_name,
                                    "status": "error",
                                    "error": e.to_string()
                                }),
                            );
                            break;
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit(
                    "ollama:pull-progress",
                    serde_json::json!({
                        "model": model_name,
                        "status": "error",
                        "error": e.to_string()
                    }),
                );
            }
        }
    });

    Ok(())
}

