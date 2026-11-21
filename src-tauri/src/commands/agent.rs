use crate::services::agent_engine::{AgentEngine, AgentModelOutput};
use crate::state::AppState;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

const MAX_ITERATIONS: usize = 5;

#[tauri::command]
pub async fn agent_query(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    query: String,
    system_prompt: Option<String>,
    model_name: Option<String>,
    api_key: Option<String>,
) -> Result<serde_json::Value, String> {
    let engine = AgentEngine::new(state.http_client.clone());
    let sys_instruction = engine.build_system_prompt(system_prompt.as_deref());

    let mut messages = vec![serde_json::json!({
        "role": "user",
        "parts": [{ "text": query }]
    })];

    let target_model = model_name.unwrap_or_else(|| "gemini-flash-latest".to_string());
    let key = api_key.or_else(|| std::env::var("GOOGLE_API_KEY").ok());

    let mut iterations = 0;
    while iterations < MAX_ITERATIONS {
        iterations += 1;

        let response_text = if target_model.contains("gemini") {
            let k = key
                .as_ref()
                .ok_or_else(|| "Missing Google Gemini API Key".to_string())?;
            engine
                .run_gemini(k, &target_model, &sys_instruction, &messages)
                .await?
        } else {
            engine
                .run_ollama(&target_model, &sys_instruction, &messages)
                .await?
        };

        messages.push(serde_json::json!({
            "role": "model",
            "parts": [{ "text": response_text }]
        }));

        if let Ok(parsed) = serde_json::from_str::<AgentModelOutput>(&response_text) {
            match parsed {
                AgentModelOutput::FinalResponse { response } => {
                    return Ok(serde_json::json!({
                        "success": true,
                        "response": response
                    }));
                }
                AgentModelOutput::ToolCall { tool, args } => {
                    let tool_result = engine.execute_tool(&app, &tool, &args).await;
                    messages.push(serde_json::json!({
                        "role": "user",
                        "parts": [{
                            "text": format!("[TOOL_RESULT from '{}']\n{}", tool, tool_result)
                        }]
                    }));
                }
            }
        } else {
            // Direct text response fallback
            return Ok(serde_json::json!({
                "success": true,
                "response": response_text
            }));
        }
    }

    Ok(serde_json::json!({
        "success": true,
        "response": "I've completed processing your request."
    }))
}

#[tauri::command]
pub async fn agent_query_stream(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    query_id: String,
    query: String,
    system_prompt: Option<String>,
    model_name: Option<String>,
    api_key: Option<String>,
) -> Result<(), String> {
    let app_handle = app.clone();
    let qid = query_id.clone();
    let client = state.http_client.clone();

    tokio::spawn(async move {
        let engine = AgentEngine::new(client);
        let sys_instruction = engine.build_system_prompt(system_prompt.as_deref());

        let _ = app_handle.emit(&format!("agent:progress-{}", qid), "Analyzing query...");

        let mut messages = vec![serde_json::json!({
            "role": "user",
            "parts": [{ "text": query }]
        })];

        let target_model = model_name.unwrap_or_else(|| "gemini-flash-latest".to_string());
        let key = api_key.or_else(|| std::env::var("GOOGLE_API_KEY").ok());

        let mut iterations = 0;
        let mut final_answer = String::new();

        while iterations < MAX_ITERATIONS {
            iterations += 1;

            let result = if target_model.contains("gemini") {
                match key.as_ref() {
                    Some(k) => engine.run_gemini(k, &target_model, &sys_instruction, &messages).await,
                    None => Err("Missing Google Gemini API Key. Please add in Settings.".to_string()),
                }
            } else {
                engine.run_ollama(&target_model, &sys_instruction, &messages).await
            };

            match result {
                Ok(response_text) => {
                    messages.push(serde_json::json!({
                        "role": "model",
                        "parts": [{ "text": response_text }]
                    }));

                    if let Ok(parsed) = serde_json::from_str::<AgentModelOutput>(&response_text) {
                        match parsed {
                            AgentModelOutput::FinalResponse { response } => {
                                final_answer = response.clone();
                                // Stream tokens word by word
                                for word in response.split_inclusive(' ') {
                                    let _ = app_handle.emit(&format!("agent:token-{}", qid), word);
                                    tokio::time::sleep(std::time::Duration::from_millis(15)).await;
                                }
                                break;
                            }
                            AgentModelOutput::ToolCall { tool, args } => {
                                let _ = app_handle.emit(
                                    &format!("agent:progress-{}", qid),
                                    format!("Executing tool: {}...", tool),
                                );
                                let tool_result = engine.execute_tool(&app_handle, &tool, &args).await;
                                messages.push(serde_json::json!({
                                    "role": "user",
                                    "parts": [{
                                        "text": format!("[TOOL_RESULT from '{}']\n{}", tool, tool_result)
                                    }]
                                }));
                            }
                        }
                    } else {
                        final_answer = response_text.clone();
                        let _ = app_handle.emit(&format!("agent:token-{}", qid), &final_answer);
                        break;
                    }
                }
                Err(err) => {
                    let _ = app_handle.emit(
                        &format!("agent:complete-{}", qid),
                        serde_json::json!({
                            "success": false,
                            "error": err
                        }),
                    );
                    return;
                }
            }
        }

        let _ = app_handle.emit(
            &format!("agent:complete-{}", qid),
            serde_json::json!({
                "success": true,
                "response": final_answer
            }),
        );
    });

    Ok(())
}

#[tauri::command]
pub async fn agent_browser_query_stream(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    query_id: String,
    query: String,
    model_name: Option<String>,
    api_key: Option<String>,
) -> Result<(), String> {
    // Forward to general agent loop with browser emphasis
    let sys_prompt = "You are Athena's autonomous browser navigation specialist. Analyze the user's web instruction and execute steps precisely.";
    agent_query_stream(
        app,
        state,
        query_id,
        query,
        Some(sys_prompt.to_string()),
        model_name,
        api_key,
    )
    .await
}

