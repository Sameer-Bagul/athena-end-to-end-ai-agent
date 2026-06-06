
import type { Tool } from "../core/types";

export const ClockTool: Tool = {
    name: "Clock",
    description: "Get the current date and time or check a specific timezone.",
    category: "utility",
    parameters: {
        type: "object",
        properties: {
            timezone: {
                type: "string",
                description: "The timezone to check (e.g., 'UTC', 'America/New_York', 'Asia/Kolkata'). Optional."
            }
        }
    },
    keywords: ["time", "date", "clock", "today", "now"],
    execute: async (params: { timezone?: string }) => {
        try {
            const options: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };

            if (params.timezone) {
                options.timeZone = params.timezone;
            }

            const now = new Date();
            const formatted = new Intl.DateTimeFormat('en-US', options).format(now);

            return `The current time is ${formatted}.`;
        } catch (error: any) {
            return `Error getting time: ${error.message}`;
        }
    }
};
