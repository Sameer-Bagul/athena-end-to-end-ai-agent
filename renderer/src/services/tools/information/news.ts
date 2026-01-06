
import type { Tool } from "../core/types";

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export const NewsTool: Tool = {
    name: "News",
    description: "Get top news headlines.",
    keywords: ["news", "headline", "headlines", "world updates"],
    execute: async (params: string) => {
        if (!API_KEY) {
            return "News tool is not configured. Please add VITE_NEWS_API_KEY to your .env file.";
        }

        // Determine category or query?
        // For MVP, just get top headlines.
        // If user says "Tech news", we could try to filter.

        let url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEY}`;

        // Simple keyword check for categories
        const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
        const foundCategory = categories.find(c => params.toLowerCase().includes(c));

        if (foundCategory) {
            url = `https://newsapi.org/v2/top-headlines?category=${foundCategory}&language=en&apiKey=${API_KEY}`;
        } else if (params.toLowerCase().includes("about")) {
            // Search query
            const query = params.split("about")[1].trim();
            if (query) {
                url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${API_KEY}`;
            }
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

            return `Here are the top headlines:\n${summary}`;
        } catch (error) {
            return `Failed to fetch news: ${error}`;
        }
    }
};
