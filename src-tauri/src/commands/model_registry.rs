use crate::state::AppState;
use futures_util::StreamExt;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

struct ModelFile {
    name: &'static str,
    url: &'static str,
}

struct ModelDef {
    category: &'static str,
    files: &'static [ModelFile],
}

fn get_model_def(model_id: &str) -> Option<ModelDef> {
    match model_id {
        "tiny.en" => Some(ModelDef {
            category: "intelligence",
            files: &[
                ModelFile { name: "model.bin", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/model.bin" },
                ModelFile { name: "config.json", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/config.json" },
                ModelFile { name: "vocabulary.txt", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/vocabulary.txt" },
                ModelFile { name: "tokenizer.json", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/tokenizer.json" },
            ],
        }),
        "base.en" => Some(ModelDef {
            category: "intelligence",
            files: &[
                ModelFile { name: "model.bin", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/model.bin" },
                ModelFile { name: "config.json", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/config.json" },
                ModelFile { name: "vocabulary.txt", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/vocabulary.txt" },
                ModelFile { name: "tokenizer.json", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/tokenizer.json" },
            ],
        }),
        "standard-v1" => Some(ModelDef {
            category: "presence",
            files: &[
                ModelFile { name: "duration_predictor.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/duration_predictor.onnx" },
                ModelFile { name: "text_encoder.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/text_encoder.onnx" },
                ModelFile { name: "vector_estimator.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/vector_estimator.onnx" },
                ModelFile { name: "vocoder.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/vocoder.onnx" },
                ModelFile { name: "tts.json", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/tts.json" },
                ModelFile { name: "unicode_indexer.json", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/unicode_indexer.json" },
            ],
        }),
        _ => None,
    }
}

fn get_local_model_dir(app_data_dir: &Path, category: &str, model_id: &str) -> PathBuf {
    app_data_dir.join("models").join(category).join(model_id)
}

#[tauri::command]
pub async fn model_check_status(
    state: State<'_, Arc<AppState>>,
    model_id: String,
) -> Result<serde_json::Value, String> {
    if let Some(def) = get_model_def(&model_id) {
        let dir = get_local_model_dir(&state.app_data_dir, def.category, &model_id);
        if dir.exists() {
            let all_exist = def.files.iter().all(|f| dir.join(f.name).exists());
            return Ok(serde_json::json!({ "isInstalled": all_exist }));
        }
    }
    Ok(serde_json::json!({ "isInstalled": false }))
}

#[tauri::command]
pub async fn model_pull(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    model_id: String,
) -> Result<(), String> {
    let def = match get_model_def(&model_id) {
        Some(d) => d,
        None => {
            let _ = app.emit(
                "model:pull-progress",
                serde_json::json!({
                    "model": model_id,
                    "status": "error",
                    "error": "Model not found in registry"
                }),
            );
            return Ok(());
        }
    };

    let dir = get_local_model_dir(&state.app_data_dir, def.category, &model_id);
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| e.to_string())?;

    let client = state.http_client.clone();
    let mid = model_id.clone();

    tokio::spawn(async move {
        for file in def.files {
            let dest_path = dir.join(file.name);
            if dest_path.exists() {
                continue;
            }

            let _ = app.emit(
                "model:pull-progress",
                serde_json::json!({
                    "model": mid,
                    "status": "downloading",
                    "detail": format!("Downloading {}...", file.name)
                }),
            );

            let res = match client.get(file.url).send().await {
                Ok(r) => r,
                Err(e) => {
                    let _ = app.emit(
                        "model:pull-progress",
                        serde_json::json!({
                            "model": mid,
                            "status": "error",
                            "error": e.to_string()
                        }),
                    );
                    return;
                }
            };

            let total_size = res.content_length().unwrap_or(0);
            let mut stream = res.bytes_stream();
            let mut downloaded: u64 = 0;
            let mut file_buf = Vec::new();

            while let Some(chunk_res) = stream.next().await {
                match chunk_res {
                    Ok(chunk) => {
                        file_buf.extend_from_slice(&chunk);
                        downloaded += chunk.len() as u64;
                        let _ = app.emit(
                            "model:pull-progress",
                            serde_json::json!({
                                "model": mid,
                                "status": "downloading",
                                "completed": downloaded,
                                "total": total_size
                            }),
                        );
                    }
                    Err(e) => {
                        let _ = app.emit(
                            "model:pull-progress",
                            serde_json::json!({
                                "model": mid,
                                "status": "error",
                                "error": e.to_string()
                            }),
                        );
                        return;
                    }
                }
            }

            let _ = tokio::fs::write(&dest_path, file_buf).await;
        }

        let _ = app.emit(
            "model:pull-progress",
            serde_json::json!({
                "model": mid,
                "status": "success"
            }),
        );
    });

    Ok(())
}

#[tauri::command]
pub async fn model_delete(
    state: State<'_, Arc<AppState>>,
    model_id: String,
) -> Result<serde_json::Value, String> {
    if let Some(def) = get_model_def(&model_id) {
        let dir = get_local_model_dir(&state.app_data_dir, def.category, &model_id);
        if dir.exists() {
            let _ = tokio::fs::remove_dir_all(&dir).await;
            return Ok(serde_json::json!({ "success": true }));
        }
    }
    Ok(serde_json::json!({ "success": false }))
}

