/**
 * Model Router for Athena
 * Maps capabilities (roles) to specific AI models based on the recommended architecture.
 */
export const MODEL_ROUTER = {
    default_chat: 'gemini-3.6-flash',
    planner: 'gemini-3.6-flash',
    browser_agent: 'gemini-3.6-flash',
    coder: 'gemini-3.6-flash',
    vision: 'gemini-3.6-flash',
    voice: 'gemini-3.6-flash',
    background: 'gemini-3.6-flash'
};
/**
 * Gets the configured model for a specific capability/role.
 */
export function getModelForRole(role) {
    return MODEL_ROUTER[role] || MODEL_ROUTER.default_chat;
}
/**
 * Intent Router (Concept)
 * Determines which role a specific user query falls into.
 */
export function determineRoleForQuery(query) {
    const lowerQuery = query.toLowerCase();
    // Basic heuristics for intent routing
    if (lowerQuery.includes('build') && lowerQuery.includes('app') || lowerQuery.includes('analyze') && lowerQuery.includes('repo')) {
        return 'planner';
    }
    if (lowerQuery.includes('edit file') || lowerQuery.includes('refactor')) {
        return 'coder';
    }
    if (lowerQuery.includes('open browser') || lowerQuery.includes('go to') || lowerQuery.includes('click')) {
        return 'browser_agent';
    }
    return 'default_chat';
}
