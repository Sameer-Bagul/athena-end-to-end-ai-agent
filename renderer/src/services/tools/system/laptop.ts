
import type { Tool } from "../core/types";

export const LaptopControlTool: Tool = {
    name: "LaptopControl",
    description: "Control system hardware like volume, brightness, or check battery status.",
    category: "system",
    parameters: {
        type: "object",
        properties: {
            action: {
                type: "string",
                description: "The action to perform.",
                enum: ["setVolume", "getVolume", "setBrightness", "getBattery"]
            },
            value: {
                type: "number",
                description: "The value (0-100) for volume or brightness."
            }
        },
        required: ["action"]
    },
    keywords: ["volume", "sound", "mute", "unmute", "brightness", "dim", "light", "battery", "power"],
    execute: async (params: { action: string, value?: number }) => {
        // @ts-ignore
        const system = window.athena?.system;
        if (!system) return "System control is not available in this environment.";

        try {
            switch (params.action) {
                case "setVolume":
                    if (params.value === undefined) return "Please specify a volume value (0-100).";
                    return await system.setVolume(params.value);
                case "getVolume":
                    const vol = await system.getVolume();
                    return `Current volume is ${vol}%.`;
                case "setBrightness":
                    if (params.value === undefined) return "Please specify a brightness value (0-100).";
                    return await system.setBrightness(params.value);
                case "getBattery":
                    return await system.getBattery();
                default:
                    return `Unknown action: ${params.action}`;
            }
        } catch (error: any) {
            return `System Error: ${error.message}`;
        }
    }
};
