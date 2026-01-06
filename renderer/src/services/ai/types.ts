export interface AIProvider {
    name: string;
    generateStream(
        prompt: string,
        systemPrompt: string,
        onChunk: (token: string) => void,
        signal?: AbortSignal
    ): Promise<string>;
}
