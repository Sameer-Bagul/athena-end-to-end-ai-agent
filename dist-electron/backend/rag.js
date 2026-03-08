"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragService = exports.RagService = void 0;
const ollama_1 = require("@langchain/ollama");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
// @ts-ignore
const text_1 = require("@langchain/classic/document_loaders/fs/text");
const textsplitters_1 = require("@langchain/textsplitters");
// @ts-ignore
const memory_1 = require("@langchain/classic/vectorstores/memory");
const prompts_1 = require("@langchain/core/prompts");
// @ts-ignore
const combine_documents_1 = require("@langchain/classic/chains/combine_documents");
// @ts-ignore
const retrieval_1 = require("@langchain/classic/chains/retrieval");
const node_path_1 = __importDefault(require("node:path"));
class RagService {
    constructor(modelName = "dolphin-mistral") {
        this.vectorStore = null;
        this.indexedFiles = [];
        this.modelName = modelName;
        this.llm = new ollama_1.Ollama({ model: modelName });
        this.embeddings = new ollama_1.OllamaEmbeddings({ model: "nomic-embed-text:latest" });
    }
    async loadDocument(filePath) {
        console.log(`[RAG] 📄 Loading document: ${filePath}`);
        let loader;
        const ext = node_path_1.default.extname(filePath).toLowerCase();
        if (ext === ".pdf") {
            loader = new pdf_1.PDFLoader(filePath);
        }
        else if (ext === ".txt" || ext === ".md") {
            loader = new text_1.TextLoader(filePath);
        }
        else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
        let docs;
        try {
            docs = await loader.load();
            console.log(`[RAG] Loaded ${docs.length} document objects.`);
        }
        catch (error) {
            console.error(`❌ [RAG] Failed to load document: ${error.message}`);
            if (error.message.includes("pdf-parse")) {
                throw new Error("PDF parsing failed. This usually means a dependency issue with pdf-parse.");
            }
            throw error;
        }
        const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 100,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        console.log(`[RAG] ✂️ Split into ${splitDocs.length} chunks for indexing.`);
        try {
            if (!this.vectorStore) {
                this.vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splitDocs, this.embeddings);
            }
            else {
                await this.vectorStore.addDocuments(splitDocs);
            }
        }
        catch (error) {
            console.error(`❌ [RAG] Vector store error: ${error.message}`);
            if (error.message.includes("fetch failed") || error.code === "ECONNREFUSED") {
                throw new Error("Failed to connect to Ollama. Please ensure Ollama is running on http://localhost:11434");
            }
            if (error.message.includes("maximum context length")) {
                throw new Error("Document chunk too large for the embedding model. Try smaller chunkSize.");
            }
            throw error;
        }
        this.indexedFiles.push(node_path_1.default.basename(filePath));
        return { success: true, fileName: node_path_1.default.basename(filePath) };
    }
    async getRelevantContext(input) {
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
            const contexts = docs.map((doc) => doc.pageContent);
            console.log(`[RAG] ✅ Found ${contexts.length} relevant chunks for context.`);
            return contexts;
        }
        catch (error) {
            console.error(`❌ [RAG] Retrieval error: ${error.message}`);
            return [];
        }
    }
    async query(input) {
        const contexts = await this.getRelevantContext(input);
        if (contexts.length === 0)
            return null;
        const retriever = this.vectorStore.asRetriever({ k: 5 });
        const prompt = prompts_1.ChatPromptTemplate.fromTemplate(`You are Athena. Answer concisely based on context: {context}\nQuestion: {input}`);
        const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
            llm: this.llm,
            prompt,
        });
        const chain = await (0, retrieval_1.createRetrievalChain)({
            combineDocsChain,
            retriever,
        });
        try {
            const response = await chain.invoke({ input });
            return {
                answer: response.answer,
                context: contexts,
            };
        }
        catch (error) {
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
    }
}
exports.RagService = RagService;
exports.ragService = new RagService();
