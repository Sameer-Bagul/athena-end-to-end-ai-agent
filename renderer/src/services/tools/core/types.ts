export interface Tool {
    name: string;
    description: string;
    category: 'information' | 'utility' | 'system' | 'browser';
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required?: string[];
    };
    execute: (params: any) => Promise<string>;
    // Keep keywords for backward compatibility or as a secondary trigger
    keywords: string[];
}
