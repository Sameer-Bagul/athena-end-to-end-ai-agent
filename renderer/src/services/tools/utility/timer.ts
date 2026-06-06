
import type { Tool } from "../core/types";

export const TimerTool: Tool = {
    name: "Timer",
    description: "Set a timer or alarm for a specified duration.",
    category: "utility",
    parameters: {
        type: "object",
        properties: {
            duration: {
                type: "number",
                description: "The amount of time for the timer."
            },
            unit: {
                type: "string",
                description: "The unit of time.",
                enum: ["seconds", "minutes", "hours"]
            },
            label: {
                type: "string",
                description: "Optional label for the timer (e.g., 'Take a break')."
            }
        },
        required: ["duration", "unit"]
    },
    keywords: ["timer", "alarm", "remind", "countdown"],
    execute: async (params: { duration: number, unit: 'seconds' | 'minutes' | 'hours', label?: string }) => {
        console.log('[TimerTool] Executing with params:', params);
        // Dispatch custom event for AppContext to handle
        const event = new CustomEvent('athena:add-timer', {
            detail: {
                duration: params.duration,
                unit: params.unit,
                label: params.label
            }
        });
        console.log('[TimerTool] Dispatching athena:add-timer event');
        window.dispatchEvent(event);

        return `Successfully set a timer for ${params.duration} ${params.unit}. I'll show a countdown in the 3D space for you!`;
    }
};
