
import type { Tool } from "../core/types";



export const WeatherTool: Tool = {
    name: "Weather",
    description: "Get current weather for a specific city.",
    keywords: ["weather", "temperature", "forecast", "hot", "cold", "rain", "sunny"],
    execute: async (params: string) => {
        // Prioritize Settings (localStorage) over Env
        let apiKey = "";
        try {
            const stored = localStorage.getItem("athena-plugin-config");
            if (stored) {
                const config = JSON.parse(stored);
                apiKey = config.weatherApiKey;
            }
        } catch (e) {
            console.error("Failed to read weather key from storage", e);
        }

        // Fallback to Env if no settings key found
        if (!apiKey || apiKey.trim() === "") {
            apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        }

        if (!apiKey) {
            return "Weather tool is not configured. Please add an API Key in Settings > Plugins.";
        }

        // Simple extraction of city name. 
        // Improvement: Use LLM to extract city, but for now we'll try to find a city in the params or default to "London" if really unclear, 
        // but actually the prompt usually contains the location.
        // Let's assume the params *is* the user prompt and we try to extract common cities or just match everything after "in".

        let city = "London"; // Default location
        const match = params.match(/in\s+([a-zA-Z\s]+)/i);
        if (match && match[1]) {
            city = match[1].trim();
        }
        // Removed strict check. If no city specified, we show London weather.
        // Future todo: Get default location from User Profile.

        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
            if (!response.ok) {
                if (response.status === 404) return `Could not find weather data for ${city}.`;
                if (response.status === 401) return `Weather API Error: Invalid API Key.`;
                return `Weather API error: ${response.statusText}`;
            }

            const data = await response.json();
            const weather = data.weather[0];
            const main = data.main;
            const timestamp = new Date().toLocaleTimeString();

            return `Current weather in ${data.name}: ${weather.main} (${weather.description}). Temperature: ${main.temp}°C. Humidity: ${main.humidity}%. \n[Source: OpenWeatherMap API | Verified at ${timestamp}]`;
        } catch (error) {
            return `Failed to fetch weather: ${error}`;
        }
    }
};
