import { z } from "zod";
import type { Tool } from "./types";

/**
 * Converts a simplified JSON schema to a Zod schema.
 * Note: This is a basic implementation supporting string type and basic object structure.
 */
function jsonSchemaToZod(parameters: any): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};
    const props = parameters.properties || {};
    const required = parameters.required || [];

    for (const [key, value] of Object.entries(props)) {
        let schema: z.ZodTypeAny;
        const val = value as any;

        if (val.type === 'string') {
            if (val.enum) {
                schema = z.enum(val.enum as [string, ...string[]]);
            } else {
                schema = z.string();
            }
        } else if (val.type === 'number') {
            schema = z.number();
        } else if (val.type === 'boolean') {
            schema = z.boolean();
        } else {
            // Fallback to string for unknown types for now
            schema = z.string();
        }

        if (val.description) {
            schema = schema.describe(val.description);
        }

        if (!required.includes(key)) {
            schema = schema.optional();
        }

        shape[key] = schema;
    }

    return z.object(shape);
}

/**
 * Converts an Athena Tool definition into a LangChain DynamicStructuredTool.
 */
export async function convertToLangChainTool(athenaTool: Tool): Promise<any> {
    try {
        console.log(`[LangChainTools] Converting tool: ${athenaTool.name}`);
        const { DynamicStructuredTool } = await import("@langchain/core/tools");

        const tool = new DynamicStructuredTool({
            name: athenaTool.name,
            description: athenaTool.description,
            schema: jsonSchemaToZod(athenaTool.parameters),
            func: async (params: any) => {
                console.log(`[LangChainTools] Executing ${athenaTool.name} with params:`, params);
                try {
                    return await athenaTool.execute(params);
                } catch (execError) {
                    console.error(`[LangChainTools] Error executing ${athenaTool.name}:`, execError);
                    throw execError;
                }
            },
        });
        
        console.log(`[LangChainTools] Successfully converted tool: ${athenaTool.name}`);
        return tool;
    } catch (error) {
        console.error(`[LangChainTools] Error converting tool ${athenaTool.name}:`, error);
        throw error;
    }
}
