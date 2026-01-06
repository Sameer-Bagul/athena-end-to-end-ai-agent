
import type { Tool } from "../core/types";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export const WeatherTool: Tool = {
    name: "Weather",
    description: "Get current weather for a specific city.",
    keywords: ["weather", "temperature", "forecast", "hot", "cold", "rain", "sunny"],
    execute: async (params: string) => {
        if (!API_KEY) {
            return "Weather tool is not configured. Please add VITE_OPENWEATHER_API_KEY to your .env file.";
        }

        // Simple extraction of city name. 
        // Improvement: Use LLM to extract city, but for now we'll try to find a city in the params or default to "London" if really unclear, 
        // but actually the prompt usually contains the location.
        // Let's assume the params *is* the user prompt and we try to extract common cities or just match everything after "in".

        let city = "London"; // Default
        const match = params.match(/in\s+([a-zA-Z\s]+)/i);
        if (match && match[1]) {
            city = match[1].trim();
        } else {
            // If no "in city" found, maybe we shouldn't guess, but for a simple tool let's try to just use the whole query if it's short, or ask for clarification?
            // For this MVP, let's just try to fallback to a default or tell user to specify.
            // Actually, if the user just says "weather", we can't know. 
            // Let's assume the LLM might pass us arguments later? No, currently we pass the full text.
            // We'll stick to extracting after "in" or "at".
            if (!match) return "Please specify a city, for example: 'Weather in Tokyo'.";
        }

        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
            if (!response.ok) {
                if (response.status === 404) return `Could not find weather data for ${city}.`;
                return `Weather API error: ${response.statusText}`;
            }

            const data = await response.json();
            const weather = data.weather[0];
            const main = data.main;

            return `Current weather in ${data.name}: ${weather.main} (${weather.description}). Temperature: ${main.temp}°C. Humidity: ${main.humidity}%.`;
        } catch (error) {
            return `Failed to fetch weather: ${error}`;
        }
    }
};
