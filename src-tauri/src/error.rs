use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AthenaError {
    #[error("I/O error: {0}")]
    Io(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Agent execution error: {0}")]
    Agent(String),

    #[error("Tool execution error: {0}")]
    Tool(String),

    #[error("MCP error: {0}")]
    Mcp(String),

    #[error("Audio error: {0}")]
    Audio(String),

    #[error("System error: {0}")]
    System(String),

    #[error("{0}")]
    Other(String),
}

impl From<std::io::Error> for AthenaError {
    fn from(err: std::io::Error) -> Self {
        AthenaError::Io(err.to_string())
    }
}

impl From<rusqlite::Error> for AthenaError {
    fn from(err: rusqlite::Error) -> Self {
        AthenaError::Database(err.to_string())
    }
}

impl From<reqwest::Error> for AthenaError {
    fn from(err: reqwest::Error) -> Self {
        AthenaError::Network(err.to_string())
    }
}

impl From<serde_json::Error> for AthenaError {
    fn from(err: serde_json::Error) -> Self {
        AthenaError::Agent(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AthenaError>;

