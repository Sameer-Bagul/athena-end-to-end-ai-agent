use crate::state::AppState;
use serde::Serialize;
use std::path::Path;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize)]
pub struct RagStatus {
    pub indexed_files: Vec<String>,
    pub vector_count: usize,
}

#[derive(Serialize)]
pub struct RagDocumentResult {
    pub success: bool,
    pub filename: String,
    pub chunks_created: usize,
    pub error: Option<String>,
}

fn chunk_text(text: &str, chunk_size: usize, overlap: usize) -> Vec<String> {
    let mut chunks = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let mut start = 0;

    while start < chars.len() {
        let end = (start + chunk_size).min(chars.len());
        let chunk: String = chars[start..end].iter().collect();
        let trimmed = chunk.trim().to_string();
        if !trimmed.is_empty() {
            chunks.push(trimmed);
        }
        if end == chars.len() {
            break;
        }
        start += chunk_size - overlap;
    }

    chunks
}

// Compute simple word-frequency vector for cosine similarity
fn text_to_word_vector(text: &str) -> std::collections::HashMap<String, f32> {
    let mut vec = std::collections::HashMap::new();
    for word in text.split_whitespace() {
        let clean = word
            .chars()
            .filter(|c| c.is_alphanumeric())
            .collect::<String>()
            .to_lowercase();
        if clean.len() > 2 {
            *vec.entry(clean).or_insert(0.0) += 1.0;
        }
    }
    vec
}

fn cosine_similarity(
    vec_a: &std::collections::HashMap<String, f32>,
    vec_b: &std::collections::HashMap<String, f32>,
) -> f32 {
    let mut dot_product = 0.0;
    let mut norm_a = 0.0;
    let mut norm_b = 0.0;

    for (k, v) in vec_a {
        norm_a += v * v;
        if let Some(other_v) = vec_b.get(k) {
            dot_product += v * other_v;
        }
    }

    for v in vec_b.values() {
        norm_b += v * v;
    }

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot_product / (norm_a.sqrt() * norm_b.sqrt())
}

#[tauri::command]
pub async fn rag_upload_document(
    state: State<'_, Arc<AppState>>,
    file_path: String,
) -> Result<RagDocumentResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    let filename = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let content = if file_path.ends_with(".pdf") {
        // Simple PDF text stream extractor
        let bytes = tokio::fs::read(&path).await.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&bytes);
        let mut extracted = String::new();
        for line in text.lines() {
            if line.contains("(") && line.contains(")") {
                extracted.push_str(line);
                extracted.push('\n');
            }
        }
        if extracted.trim().is_empty() {
            text.chars().filter(|c| c.is_ascii_graphic() || c.is_whitespace()).collect()
        } else {
            extracted
        }
    } else {
        tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| e.to_string())?
    };

    let chunks = chunk_text(&content, 600, 100);
    let chunk_count = chunks.len();

    let conn = state.db.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO rag_documents (filename, file_path, chunk_count) VALUES (?1, ?2, ?3)",
        [&filename, &file_path, &chunk_count.to_string()],
    ).map_err(|e| e.to_string())?;

    let doc_id = conn.last_insert_rowid();

    conn.execute("DELETE FROM rag_chunks WHERE document_id = ?1", [doc_id])
        .map_err(|e| e.to_string())?;

    for (idx, chunk) in chunks.iter().enumerate() {
        let vec = text_to_word_vector(chunk);
        let vec_json = serde_json::to_string(&vec).unwrap_or_default();
        conn.execute(
            "INSERT INTO rag_chunks (document_id, chunk_index, content, embedding_json) VALUES (?1, ?2, ?3, ?4)",
            [&doc_id.to_string(), &idx.to_string(), chunk, &vec_json],
        ).map_err(|e| e.to_string())?;
    }

    Ok(RagDocumentResult {
        success: true,
        filename,
        chunks_created: chunk_count,
        error: None,
    })
}

#[tauri::command]
pub async fn rag_status(state: State<'_, Arc<AppState>>) -> Result<RagStatus, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT filename FROM rag_documents")
        .map_err(|e| e.to_string())?;

    let files_iter = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut indexed_files = Vec::new();
    for f in files_iter.flatten() {
        indexed_files.push(f);
    }

    let vector_count: usize = conn
        .query_row("SELECT COUNT(*) FROM rag_chunks", [], |row| row.get(0))
        .unwrap_or(0);

    Ok(RagStatus {
        indexed_files,
        vector_count,
    })
}

#[tauri::command]
pub async fn rag_clear(state: State<'_, Arc<AppState>>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute_batch(
        "DELETE FROM rag_chunks; DELETE FROM rag_documents;",
    ).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn rag_get_context(
    state: State<'_, Arc<AppState>>,
    input: String,
) -> Result<String, String> {
    let query_vec = text_to_word_vector(&input);
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT content, embedding_json FROM rag_chunks")
        .map_err(|e| e.to_string())?;

    let chunks_iter = stmt
        .query_map([], |row| {
            let content: String = row.get(0)?;
            let vec_json: String = row.get(1)?;
            Ok((content, vec_json))
        })
        .map_err(|e| e.to_string())?;

    let mut scored_chunks = Vec::new();
    for chunk in chunks_iter.flatten() {
        if let Ok(vec) = serde_json::from_str::<std::collections::HashMap<String, f32>>(&chunk.1) {
            let score = cosine_similarity(&query_vec, &vec);
            if score > 0.05 {
                scored_chunks.push((score, chunk.0));
            }
        }
    }

    scored_chunks.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
    let top_chunks: Vec<String> = scored_chunks.into_iter().take(3).map(|c| c.1).collect();

    if top_chunks.is_empty() {
        Ok("No relevant context found in knowledge base.".to_string())
    } else {
        Ok(top_chunks.join("\n\n---\n\n"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunk_text_should_split_long_text_into_overlapping_chunks() {
        let input = "Athena is a high performance 3D desktop companion with real time LipSync and agent capabilities.";
        let chunks = chunk_text(input, 30, 10);
        assert!(!chunks.is_empty());
        assert!(chunks.len() >= 3);
    }

    #[test]
    fn cosine_similarity_should_return_one_for_identical_vectors() {
        let mut vec = std::collections::HashMap::new();
        vec.insert("athena".to_string(), 2.0);
        vec.insert("assistant".to_string(), 1.0);

        let score = cosine_similarity(&vec, &vec);
        assert!((score - 1.0).abs() < 1e-4);
    }

    #[test]
    fn cosine_similarity_should_return_zero_for_disjoint_vectors() {
        let mut vec_a = std::collections::HashMap::new();
        vec_a.insert("apple".to_string(), 1.0);

        let mut vec_b = std::collections::HashMap::new();
        vec_b.insert("banana".to_string(), 1.0);

        let score = cosine_similarity(&vec_a, &vec_b);
        assert_eq!(score, 0.0);
    }
}


