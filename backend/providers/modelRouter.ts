/**
 * Model Router for Athena
 * Maps capabilities (roles) to specific AI models based on the recommended architecture.
 */

export type ModelRole = 
  | 'default_chat' 
  | 'planner' 
  | 'browser_agent' 
  | 'coder' 
  | 'vision' 
  | 'voice' 
  | 'background';

export const MODEL_ROUTER: Record<ModelRole, string> = {
  default_chat: 'gemini-flash-latest',
  planner: 'gemini-flash-latest',
  browser_agent: 'gemini-flash-latest',
  coder: 'gemini-flash-latest',
  vision: 'gemini-flash-latest',
  voice: 'gemini-flash-latest',
  background: 'gemini-flash-latest'
};

/**
 * Gets the configured model for a specific capability/role.
 */
export function getModelForRole(role: ModelRole): string {
  return MODEL_ROUTER[role] || MODEL_ROUTER.default_chat;
}

/**
 * Intent Router (Concept)
 * Determines which role a specific user query falls into.
 */
export function determineRoleForQuery(query: string): ModelRole {
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
