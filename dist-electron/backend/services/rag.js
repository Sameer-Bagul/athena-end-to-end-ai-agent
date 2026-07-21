import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
// Utility for simple text chunking
function splitTextIntoChunks(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push(chunk);
        if (end === text.length)
            break;
        start += chunkSize - overlap;
    }
    return chunks;
}
// Simple native cosine similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
export class RagService {
    indexedFiles = [];
    vectors = [];
    persistencePath;
    constructor() {
        this.persistencePath = path.join(app.getPath('userData'), 'rag-data-native.json');
        this.loadPersistedData();
    }
    /**
     * Load persisted vector store data from disk
     */
    loadPersistedData() {
        try {
            if (fs.existsSync(this.persistencePath)) {
                const data = JSON.parse(fs.readFileSync(this.persistencePath, 'utf-8'));
                this.indexedFiles = data.indexedFiles || [];
                this.vectors = data.vectors || [];
                console.log(`\n\x1b[35m[RAG]\x1b[0m Loaded \x1b[32m${this.indexedFiles.length}\x1b[0m indexed files and \x1b[32m${this.vectors.length}\x1b[0m vectors from persistence`);
            }
        }
        catch (error) {
            console.error('[RAG] Failed to load persisted data:', error.message);
        }
    }
    /**
     * Persist vector store data to disk
     */
    persistData() {
        try {
            const data = {
                indexedFiles: this.indexedFiles,
                vectors: this.vectors,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(this.persistencePath, JSON.stringify(data));
            console.log(`\n\x1b[35m[RAG]\x1b[0m Data persisted successfully (\x1b[32m${this.vectors.length}\x1b[0m vectors)`);
        }
        catch (error) {
            console.error('[RAG] Failed to persist data:', error.message);
        }
    }
    /**
     * Call Gemini API to get text embeddings
     */
    async getGeminiEmbedding(text) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey)
            throw new Error("GOOGLE_API_KEY environment variable is not set.");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] }
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Embedding failed: ${response.status} ${errText}`);
        }
        const data = await response.json();
        return data.embedding.values;
    }
    async loadDocument(filePath) {
        console.log(`\n\x1b[35m[RAG]\x1b[0m Loading document: \x1b[36m${filePath}\x1b[0m`);
        const ext = path.extname(filePath).toLowerCase();
        let fullText = "";
        try {
            if (ext === ".pdf") {
                // @ts-ignore
                const pdfParse = (await import('pdf-parse')).default;
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                fullText = data.text;
            }
            else if (ext === ".txt" || ext === ".md") {
                fullText = fs.readFileSync(filePath, 'utf-8');
            }
            else {
                throw new Error(`Unsupported file type: ${ext}`);
            }
        }
        catch (error) {
            console.error(`\n\x1b[31m[RAG]\x1b[0m Failed to parse document: ${error.message}`);
            throw error;
        }
        const chunkSize = ext === ".pdf" ? 1000 : 800;
        const overlap = ext === ".pdf" ? 200 : 150;
        const chunks = splitTextIntoChunks(fullText, chunkSize, overlap);
        console.log(`\n\x1b[35m[RAG]\x1b[0m Split into \x1b[32m${chunks.length}\x1b[0m chunks. Generating Gemini embeddings...`);
        for (const chunk of chunks) {
            if (!chunk.trim())
                continue;
            try {
                const embedding = await this.getGeminiEmbedding(chunk);
                this.vectors.push({ content: chunk, embedding });
            }
            catch (err) {
                console.error(`\x1b[31m[RAG]\x1b[0m Error generating embedding: ${err.message}`);
            }
        }
        this.indexedFiles.push(path.basename(filePath));
        this.persistData();
        return { success: true, fileName: path.basename(filePath) };
    }
    async getRelevantContext(input) {
        if (this.vectors.length === 0)
            return [];
        console.log(`\n\x1b[35m[RAG]\x1b[0m Retrieving context for: \x1b[33m"${input}"\x1b[0m`);
        try {
            const inputEmbedding = await this.getGeminiEmbedding(input);
            const scoredChunks = this.vectors.map(v => ({
                content: v.content,
                score: cosineSimilarity(inputEmbedding, v.embedding)
            }));
            // Sort by highest similarity
            scoredChunks.sort((a, b) => b.score - a.score);
            // Return top 5 chunks
            const top5 = scoredChunks.slice(0, 5).map(s => s.content);
            console.log(`\n\x1b[35m[RAG]\x1b[0m Found \x1b[32m${top5.length}\x1b[0m relevant chunks for context.`);
            return top5;
        }
        catch (error) {
            console.error(`\n\x1b[31m[RAG]\x1b[0m Retrieval error: ${error.message}`);
            return [];
        }
    }
    async query(input) {
        const contexts = await this.getRelevantContext(input);
        if (contexts.length === 0)
            return null;
        const prompt = `You are Athena. Answer concisely based on context: \n\n${contexts.join('\n\n')}\n\nQuestion: ${input}`;
        try {
            const { getAIProvider } = await import('../providers/providerLayer.js');
            const provider = getAIProvider('gemini');
            const response = await provider.generate([
                { role: 'user', parts: [{ text: prompt }] }
            ]);
            return { answer: response, context: contexts };
        }
        catch (error) {
            console.error(`❌ [RAG] End-to-end query error: ${error.message}`);
            return { answer: "I encountered an error formulating the answer.", context: contexts };
        }
    }
    getStatus() {
        return {
            isReady: this.vectors.length > 0,
            indexedFiles: this.indexedFiles,
        };
    }
    clearContext() {
        this.vectors = [];
        this.indexedFiles = [];
        this.persistData();
    }
}
export const ragService = new RagService();
