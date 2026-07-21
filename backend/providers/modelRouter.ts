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
  default_chat: 'gemini-2.5-flash',
  planner: 'gemini-2.5-pro',
  browser_agent: 'gemini-2.5-flash',
  coder: 'gemini-2.5-pro',
  vision: 'gemini-2.5-pro',
  voice: 'gemini-live-2.5-flash-native-audio',
  background: 'gemini-2.5-flash-lite'
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
