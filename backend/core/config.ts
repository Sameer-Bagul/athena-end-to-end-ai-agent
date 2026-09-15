/**
 * Centralized Configuration for Athena Backend Services
 */
export const config = {
    // LLM & RAG Configuration
    OLLAMA_URL: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
    DEFAULT_MODEL: process.env.DEFAULT_MODEL || "dolphin-mistral",
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",

    // External Services
    STT_URL: process.env.STT_URL || "http://127.0.0.1:9001",
    TTS_URL: process.env.TTS_URL || "http://127.0.0.1:3001",

    // Performance & Limits
    LLM_TIMEOUT: 30000,
    STT_TIMEOUT: 30000,
    MAX_RETRIES: 3,
};
