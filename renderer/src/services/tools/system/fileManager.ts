import type { Tool } from "../core/types";

export const FileManagerTool: Tool = {
    name: "FileManager",
    description: "Browse and read files from the local system. Supports 'list', 'read', and 'stats' actions.",
    category: "system",
    keywords: ["file", "directory", "folder", "list", "read", "open", "browse"],

    parameters: {
        type: "object",
        properties: {
            action: {
                type: "string",
                enum: ["list", "read", "stats"],
                description: "The action to perform: 'list' directories, 'read' file content, or get file 'stats'."
            },
            path: {
                type: "string",
                description: "The absolute path or relative to home (e.g. '~/Documents')."
            }
        },
        required: ["action", "path"]
    },

    execute: async (params: { action: 'list' | 'read' | 'stats'; path: string }) => {
        try {
            const { action, path } = params;
            let result;

            switch (action) {
                case 'list':
                    const files = await (window as any).athena.system.listFiles(path);
                    result = {
                        success: true,
                        count: files.length,
                        files: files.map((f: any) => `${f.isDirectory ? '[DIR]' : '[FILE]'} ${f.name}`)
                    };
                    break;
                case 'read':
                    const content = await (window as any).athena.system.readFile(path);
                    result = {
                        success: true,
                        content: content.slice(0, 10000) // Truncate very large files for the LLM
                    };
                    break;
                case 'stats':
                    const stats = await (window as any).athena.system.fileStats(path);
                    result = {
                        success: true,
                        stats
                    };
                    break;
                default:
                    result = { success: false, error: "Invalid action" };
            }
            return JSON.stringify(result, null, 2);
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message
            });
        }
    }
};
