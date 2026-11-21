use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use rusqlite::Connection;
use tokio::sync::Mutex as AsyncMutex;

pub struct AppState {
    pub db: Arc<Mutex<Connection>>,
    pub http_client: reqwest::Client,
    pub app_data_dir: PathBuf,
    pub active_timers: Arc<AsyncMutex<HashMap<String, tokio::task::JoinHandle<()>>>>,
}

impl AppState {
    pub fn new(app_data_dir: PathBuf) -> crate::error::Result<Self> {
        std::fs::create_dir_all(&app_data_dir)?;
        let db_path = app_data_dir.join("athena.sqlite");
        let conn = Connection::open(&db_path)?;

        // Initialize SQLite tables
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL DEFAULT 'default',
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS rag_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                file_path TEXT NOT NULL,
                chunk_count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS rag_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                embedding_json TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES rag_documents(id) ON DELETE CASCADE
            );
            ",
        )?;

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|e| crate::error::AthenaError::Network(e.to_string()))?;

        Ok(Self {
            db: Arc::new(Mutex::new(conn)),
            http_client: client,
            app_data_dir,
            active_timers: Arc::new(AsyncMutex::new(HashMap::new())),
        })
    }
}

