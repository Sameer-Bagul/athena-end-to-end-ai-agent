/**
 * Web Search Tool - Search the internet for real-time information
 */
export const webSearchTool = {
    name: "web_search",
    description: "Search the internet for real-time information, facts, or documentation. Use this whenever you don't have the answer in your training data or for recent events.",
    schema: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search query" }
        },
        required: ["query"]
    },
    invoke: async ({ query }) => {
        console.log(`[WebSearchTool] Searching for: ${query}`);
        try {
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!response.ok)
                throw new Error(`Search API error: ${response.status}`);
            const html = await response.text();
            const snippets = [...html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g)]
                .map(m => m[1].replace(/<\/?[^>]+(>|$)/g, "").trim())
                .slice(0, 3);
            if (snippets.length > 0) {
                return `I found the following web results for "${query}":\n\n` + snippets.map(s => `- ${s}`).join('\n\n') + '\n\n(Source: DuckDuckGo)';
            }
            return `I searched for "${query}" but couldn't find a definitive answer. Try rephrasing or being more specific.`;
        }
        catch (error) {
            console.error('[WebSearchTool] Error:', error);
            return `Search failed: ${error.message}. I'm currently having trouble reaching the search servers.`;
        }
    }
};
/**
 * Knowledge Search Tool - RAG integration
 */
export const knowledgeSearchTool = {
    name: "knowledge_search",
    description: "Search the internal knowledge base for information from uploaded documents. Use this when the user asks about specific information that might be in their documents.",
    schema: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search query to find relevant information in the knowledge base" }
        },
        required: ["query"]
    },
    invoke: async ({ query }) => {
        console.log(`[KnowledgeSearchTool] Searching for: ${query}`);
        try {
            const { ragService } = await import('../../services/rag.js');
            const result = await ragService.query(query);
            if (result && result.answer) {
                return result.answer;
            }
            return "No relevant information found in the knowledge base.";
        }
        catch (error) {
            console.error('[KnowledgeSearchTool] Error:', error);
            return "Knowledge base is not available or has not been initialized.";
        }
    }
};
