
export interface Tool {
    name: string;
    description: string;
    keywords: string[]; // Simple keyword matching for now
    execute: (params: string) => Promise<string>;
}
