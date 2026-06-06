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
import { config } from "./config.js";

export class RagService {
    private llm: Ollama;
    private embeddings: OllamaEmbeddings;
    private vectorStore: MemoryVectorStore | null = null;
    private indexedFiles: string[] = [];
    private modelName: string;
    private persistencePath: string;

    constructor(modelName: string = config.DEFAULT_MODEL) {
        this.modelName = modelName;
        this.llm = new Ollama({ model: modelName, baseUrl: config.OLLAMA_URL });
        this.embeddings = new OllamaEmbeddings({ model: config.EMBEDDING_MODEL, baseUrl: config.OLLAMA_URL });
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
                console.log(`\n\x1b[35m[RAG]\x1b[0m Loaded \x1b[32m${this.indexedFiles.length}\x1b[0m indexed files from persistence`);

                if (data.vectors && data.vectors.length > 0) {
                    this.vectorStore = new MemoryVectorStore(this.embeddings);
                    this.vectorStore.memoryVectors = data.vectors;
                    console.log(`\n\x1b[35m[RAG]\x1b[0m Successfully restored \x1b[32m${data.vectors.length}\x1b[0m vector embeddings from disk.`);
                }
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
                vectors: this.vectorStore ? this.vectorStore.memoryVectors : [],
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(this.persistencePath, JSON.stringify(data));
            console.log(`\n\x1b[35m[RAG]\x1b[0m Data persisted successfully (\x1b[32m${data.vectors.length}\x1b[0m vectors)`);
        } catch (error: any) {
            console.error('[RAG] Failed to persist data:', error.message);
        }
    }

    /**
     * Get optimal chunk size based on file extension
     */
    private getOptimalChunkSize(ext: string): { size: number, overlap: number } {
        switch (ext) {
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
        console.log(`\n\x1b[35m[RAG]\x1b[0m Loading document: \x1b[36m${filePath}\x1b[0m`);
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
            console.log(`\n\x1b[35m[RAG]\x1b[0m Loaded \x1b[32m${docs.length}\x1b[0m document objects.`);
        } catch (error: any) {
            console.error(`\n\x1b[31m[RAG]\x1b[0m Failed to load document: ${error.message}`);
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
        console.log(`\n\x1b[35m[RAG]\x1b[0m Split into \x1b[32m${splitDocs.length}\x1b[0m chunks (size: ${size}, overlap: ${overlap}).`);

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
                throw new Error(`Failed to connect to Ollama. Please ensure Ollama is running on ${config.OLLAMA_URL}`);
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

        console.log(`\n\x1b[35m[RAG]\x1b[0m Retrieving context for: \x1b[33m"${input}"\x1b[0m`);
        const retriever = this.vectorStore.asRetriever({
            k: 5, // Reduced k slightly for speed
            searchType: "similarity",
        });

        try {
            const docs = await retriever.invoke(input);
            const contexts = docs.map((doc: any) => doc.pageContent);
            console.log(`\n\x1b[35m[RAG]\x1b[0m Found \x1b[32m${contexts.length}\x1b[0m relevant chunks for context.`);
            return contexts;
        } catch (error: any) {
            console.error(`\n\x1b[31m[RAG]\x1b[0m Retrieval error: ${error.message}`);
            return [];
        }
    }

    async query(input: string) {
        const contexts = await this.getRelevantContext(input);
        if (contexts.length === 0 || !this.vectorStore) return null;

        const retriever = this.vectorStore.asRetriever({ k: 5 });
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
