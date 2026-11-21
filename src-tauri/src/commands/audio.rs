use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn tts_generate(
    state: State<'_, Arc<AppState>>,
    text: String,
    voice_style: Option<String>,
) -> Result<String, String> {
    let tts_url = std::env::var("TTS_URL").unwrap_or_else(|_| "http://localhost:3001".to_string());
    let style = voice_style.unwrap_or_else(|| "M1".to_string());

    let payload = serde_json::json!({
        "text": text,
        "voiceStyle": style
    });

    let res = state
        .http_client
        .post(format!("{}/tts", tts_url))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("TTS connection error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("TTS returned status {}", res.status()));
    }

    let bytes = res.bytes().await.map_err(|e| e.to_string())?;
    let b64 = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        &bytes,
    );
    Ok(format!("data:audio/wav;base64,{}", b64))
}

#[tauri::command]
pub async fn stt_transcribe(
    state: State<'_, Arc<AppState>>,
    audio_bytes: Vec<u8>,
) -> Result<String, String> {
    let stt_url = std::env::var("STT_URL").unwrap_or_else(|_| "http://127.0.0.1:9001".to_string());

    let part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name("audio.webm")
        .mime_str("audio/webm")
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new().part("file", part);

    let res = state
        .http_client
        .post(format!("{}/stt", stt_url))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("STT connection error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("STT returned status {}", res.status()));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json["text"].as_str().unwrap_or("").to_string())
}

