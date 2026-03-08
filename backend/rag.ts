import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// @ts-ignore
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// @ts-ignore
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// @ts-ignore
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
// @ts-ignore
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";

export class RagService {
    private llm: Ollama;
    private embeddings: OllamaEmbeddings;
    private vectorStore: MemoryVectorStore | null = null;
    private indexedFiles: string[] = [];
    private modelName: string;
    private persistencePath: string;

    constructor(modelName: string = "dolphin-mistral") {
        this.modelName = modelName;
        this.llm = new Ollama({ model: modelName });
        this.embeddings = new OllamaEmbeddings({ model: "nomic-embed-text:latest" });
        this.persistencePath = path.join(app.getPath('userData'), 'rag-data.json');
        
        // Load persisted data on initialization
        this.loadPersistedData();
    }

    /**
     * Load persisted vector store data from disk
     */
    private async loadPersistedData() {
        try {
            if (fs.existsSync(this.persistencePath)) {
                const data = JSON.parse(fs.readFileSync(this.persistencePath, 'utf-8'));
                this.indexedFiles = data.indexedFiles || [];
                console.log(`[RAG] Loaded ${this.indexedFiles.length} indexed files from persistence`);
                
                // Note: Full vector store serialization is complex
                // For production, consider using a proper vector DB like Chroma or FAISS
            }
        } catch (error: any) {
            console.error('[RAG] Failed to load persisted data:', error.message);
        }
    }

    /**
     * Persist vector store data to disk
     */
    private async persistData() {
        try {
            const data = {
                indexedFiles: this.indexedFiles,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
            console.log('[RAG] Data persisted successfully');
        } catch (error: any) {
            console.error('[RAG] Failed to persist data:', error.message);
        }
    }

    /**
     * Get optimal chunk size based on file extension
     */
    private getOptimalChunkSize(ext: string): { size: number, overlap: number } {
        switch(ext) {
            case '.pdf':
                return { size: 1000, overlap: 200 }; // PDFs have structured content
            case '.md':
                return { size: 600, overlap: 100 };  // Markdown has clear sections
            case '.txt':
                return { size: 800, overlap: 150 };  // General text
            default:
                return { size: 800, overlap: 100 };
        }
    }

    async loadDocument(filePath: string) {
        console.log(`[RAG] 📄 Loading document: ${filePath}`);
        let loader;
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".pdf") {
            loader = new PDFLoader(filePath);
        } else if (ext === ".txt" || ext === ".md") {
            loader = new TextLoader(filePath);
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }

        let docs;
        try {
            docs = await loader.load();
            console.log(`[RAG] Loaded ${docs.length} document objects.`);
        } catch (error: any) {
            console.error(`❌ [RAG] Failed to load document: ${error.message}`);
            if (error.message.includes("pdf-parse")) {
                throw new Error("PDF parsing failed. This usually means a dependency issue with pdf-parse.");
            }
            throw error;
        }

        // Use optimal chunk size based on file type
        const { size, overlap } = this.getOptimalChunkSize(ext);
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: size,
            chunkOverlap: overlap,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        console.log(`[RAG] ✂️ Split into ${splitDocs.length} chunks (size: ${size}, overlap: ${overlap}).`);

        try {
            if (!this.vectorStore) {
                this.vectorStore = await MemoryVectorStore.fromDocuments(
                    splitDocs,
                    this.embeddings
                );
            } else {
                await this.vectorStore.addDocuments(splitDocs);
            }
        } catch (error: any) {
            console.error(`❌ [RAG] Vector store error: ${error.message}`);
            if (error.message.includes("fetch failed") || error.code === "ECONNREFUSED") {
                throw new Error("Failed to connect to Ollama. Please ensure Ollama is running on http://localhost:11434");
            }
            if (error.message.includes("maximum context length")) {
                throw new Error("Document chunk too large for the embedding model. Try smaller chunkSize.");
            }
            throw error;
        }

        this.indexedFiles.push(path.basename(filePath));
        await this.persistData(); // Persist after successful indexing
        return { success: true, fileName: path.basename(filePath) };
    }

    async getRelevantContext(input: string) {
        if (!this.vectorStore) {
            return [];
        }

        console.log(`[RAG] 🔍 Retrieving context for: "${input}"`);
        const retriever = this.vectorStore.asRetriever({
            k: 5, // Reduced k slightly for speed
            searchType: "similarity",
        });

        try {
            const docs = await retriever.invoke(input);
            const contexts = docs.map((doc: any) => doc.pageContent);
            console.log(`[RAG] ✅ Found ${contexts.length} relevant chunks for context.`);
            return contexts;
        } catch (error: any) {
            console.error(`❌ [RAG] Retrieval error: ${error.message}`);
            return [];
        }
    }

    async query(input: string) {
        const contexts = await this.getRelevantContext(input);
        if (contexts.length === 0) return null;

        const retriever = this.vectorStore!.asRetriever({ k: 5 });
        const prompt = ChatPromptTemplate.fromTemplate(
            `You are Athena. Answer concisely based on context: {context}\nQuestion: {input}`
        );
        const combineDocsChain = await createStuffDocumentsChain({
            llm: this.llm,
            prompt,
        });

        const chain = await createRetrievalChain({
            combineDocsChain,
            retriever,
        });

        try {
            const response = await chain.invoke({ input });
            return {
                answer: response.answer,
                context: contexts,
            };
        } catch (error: any) {
            console.error(`❌ [RAG] End-to-end query error: ${error.message}`);
            return {
                answer: "I encountered an error formulating the answer.",
                context: contexts
            };
        }
    }

    getStatus() {
        return {
            isReady: !!this.vectorStore,
            indexedFiles: this.indexedFiles,
        };
    }

    clearContext() {
        this.vectorStore = null;
        this.indexedFiles = [];
        this.persistData(); // Clear persisted data too
    }
}

export const ragService = new RagService();
