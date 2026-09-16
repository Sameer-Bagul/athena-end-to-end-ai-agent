/**
 * Weather Tool - Get current weather for a city
 */
export const weatherTool = {
    name: "weather",
    description: "Get current weather for a specific city. Use this when user asks about weather, temperature, or climate conditions.",
    schema: {
        type: "object",
        properties: {
            city: { type: "string", description: "The name of the city to get weather for (e.g., 'London', 'Mumbai', 'New York')" }
        },
        required: ["city"]
    },
    invoke: async ({ city }) => {
        console.log(`[WeatherTool] Fetching weather for ${city}`);
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return "Weather tool is not configured. Please add an API Key in Settings.";
        }
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
            if (!response.ok) {
                if (response.status === 404)
                    return `Could not find weather data for ${city}.`;
                if (response.status === 401)
                    return `Weather API Error: Invalid API Key.`;
                return `Weather API error: ${response.statusText}`;
            }
            const data = await response.json();
            const weather = data.weather[0];
            const main = data.main;
            const timestamp = new Date().toLocaleTimeString();
            return `Current weather in ${data.name}: ${weather.main} (${weather.description}). Temperature: ${main.temp}°C. Humidity: ${main.humidity}%. [Source: OpenWeatherMap | ${timestamp}]`;
        }
        catch (error) {
            return `Failed to fetch weather: ${error}`;
        }
    }
};
