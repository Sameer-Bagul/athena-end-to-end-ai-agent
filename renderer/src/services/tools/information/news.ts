
import type { Tool } from "../core/types";



export const NewsTool: Tool = {
    name: "News",
    description: "Get top news headlines or search for news about a specific topic.",
    category: "information",
    parameters: {
        type: "object",
        properties: {
            category: {
                type: "string",
                description: "News category",
                enum: ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
            },
            query: {
                type: "string",
                description: "Specific topic or search query to find news about."
            }
        }
    },
    keywords: ["news", "headline", "headlines", "world updates"],
    execute: async (params: { category?: string, query?: string }) => {
        // Prioritize Settings (localStorage) over Env
        let apiKey = "";
        try {
            const stored = localStorage.getItem("athena-plugin-config");
            if (stored) {
                const config = JSON.parse(stored);
                apiKey = config.newsApiKey;
            }
        } catch (e) {
            console.error("Failed to read news key from storage", e);
        }

        // Fallback to Env if no settings key found
        if (!apiKey || apiKey.trim() === "") {
            apiKey = import.meta.env.VITE_NEWS_API_KEY;
        }

        if (!apiKey) {
            return "News tool is not configured. Please add an API Key in Settings > Plugins.";
        }

        let url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

        if (params.category) {
            url = `https://newsapi.org/v2/top-headlines?category=${params.category}&language=en&apiKey=${apiKey}`;
        } else if (params.query) {
            url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(params.query)}&apiKey=${apiKey}`;
        }

        try {
            // Use Electron Proxy to bypass CORS
            // @ts-ignore
            if (!window.athena?.getNews) {
                return "Error: Athena News Proxy not available. Please restart the app.";
            }

            // @ts-ignore
            const data = await window.athena.getNews(url);

            if (data.error) {
                return `News API error: ${data.error}`;
            }

            if (!data.articles || data.articles.length === 0) {
                return "No news found for that topic.";
            }

            // Return top 5
            const articles = data.articles.slice(0, 5);
            const summary = articles.map((a: any, i: number) => `${i + 1}. ${a.title}`).join("\n");

            return `Here are the top headlines:\n${summary}\n[Source: NewsAPI | Live Data]`;
        } catch (error) {
            return `Failed to fetch news: ${error}`;
        }
    }
};
