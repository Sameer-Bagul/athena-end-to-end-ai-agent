use serde::Serialize;
use std::path::{Path, PathBuf};
use tokio::process::Command;

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub is_directory: bool,
    pub size: u64,
    pub path: String,
}

#[derive(Serialize)]
pub struct FileStats {
    pub size: u64,
    pub is_file: bool,
    pub is_directory: bool,
    pub modified: Option<u64>,
}

fn resolve_path(target_path: &str) -> PathBuf {
    if target_path.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            return home.join(target_path.trim_start_matches("~/").trim_start_matches('~'));
        }
    }
    PathBuf::from(target_path)
}

#[tauri::command]
pub async fn system_set_volume(percent: u32) -> Result<String, String> {
    let val = percent.min(100);
    let output = Command::new("amixer")
        .args(["sset", "Master", &format!("{}%", val)])
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => Ok(format!("Volume set to {}%", val)),
        _ => {
            // Try wpctl or pactl fallback
            let wp = Command::new("wpctl")
                .args(["set-volume", "@DEFAULT_AUDIO_SINK@", &format!("{:.2}", (val as f32) / 100.0)])
                .output()
                .await;
            if let Ok(w_out) = wp {
                if w_out.status.success() {
                    return Ok(format!("Volume set to {}%", val));
                }
            }
            Ok(format!("Volume set to {}%", val))
        }
    }
}

#[tauri::command]
pub async fn system_get_volume() -> Result<serde_json::Value, String> {
    let output = Command::new("amixer")
        .args(["sget", "Master"])
        .output()
        .await;

    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        let re = regex::Regex::new(r"\[(\d+)%\]").unwrap();
        if let Some(caps) = re.captures(&text) {
            if let Some(m) = caps.get(1) {
                if let Ok(val) = m.as_str().parse::<u32>() {
                    return Ok(serde_json::json!(val));
                }
            }
        }
    }

    // Try wpctl fallback
    let wp = Command::new("wpctl")
        .args(["get-volume", "@DEFAULT_AUDIO_SINK@"])
        .output()
        .await;
    if let Ok(out) = wp {
        let text = String::from_utf8_lossy(&out.stdout);
        let re = regex::Regex::new(r"Volume:\s+([0-9.]+)").unwrap();
        if let Some(caps) = re.captures(&text) {
            if let Some(m) = caps.get(1) {
                if let Ok(val) = m.as_str().parse::<f32>() {
                    return Ok(serde_json::json!((val * 100.0).round() as u32));
                }
            }
        }
    }

    Ok(serde_json::json!("Unknown"))
}

#[tauri::command]
pub async fn system_set_brightness(percent: u32) -> Result<String, String> {
    let val = percent.min(100);
    let output = Command::new("brightnessctl")
        .args(["set", &format!("{}%", val)])
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => Ok(format!("Brightness set to {}%", val)),
        Ok(out) => Err(String::from_utf8_lossy(&out.stderr).to_string()),
        Err(e) => Err(format!("brightnessctl error: {}", e)),
    }
}

#[tauri::command]
pub async fn system_get_battery() -> Result<String, String> {
    for bat in ["BAT0", "BAT1"] {
        let cap_path = format!("/sys/class/power_supply/{}/capacity", bat);
        let stat_path = format!("/sys/class/power_supply/{}/status", bat);

        if Path::new(&cap_path).exists() {
            let cap = tokio::fs::read_to_string(&cap_path).await.unwrap_or_default().trim().to_string();
            let stat = tokio::fs::read_to_string(&stat_path).await.unwrap_or_default().trim().to_string();
            return Ok(format!("Battery: {}% ({})", cap, stat));
        }
    }
    Ok("Battery info unavailable on this system or not a laptop.".to_string())
}

#[tauri::command]
pub async fn system_list_files(target_path: String) -> Result<Vec<FileEntry>, String> {
    let path = resolve_path(&target_path);
    let mut dir = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| format!("Failed to read directory {}: {}", path.display(), e))?;

    let mut entries = Vec::new();
    while let Ok(Some(entry)) = dir.next_entry().await {
        let meta = entry.metadata().await.ok();
        let is_dir = meta.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
        let file_name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path().to_string_lossy().to_string();

        entries.push(FileEntry {
            name: file_name,
            is_directory: is_dir,
            size,
            path: full_path,
        });
    }

    Ok(entries)
}

#[tauri::command]
pub async fn system_read_file(target_path: String) -> Result<String, String> {
    let path = resolve_path(&target_path);
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))
}

#[tauri::command]
pub async fn system_file_stats(target_path: String) -> Result<FileStats, String> {
    let path = resolve_path(&target_path);
    let meta = tokio::fs::metadata(&path)
        .await
        .map_err(|e| format!("Failed to read metadata for {}: {}", path.display(), e))?;

    let modified = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(FileStats {
        size: meta.len(),
        is_file: meta.is_file(),
        is_directory: meta.is_dir(),
        modified,
    })
}

