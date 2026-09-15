// Core Engine & 3D Module exports
export { AthenaEngine } from './engine/AthenaEngine.js';
export { AthenaScene } from './three/AthenaScene.js';
export { AthenaVRMLoader } from './three/VRMLoader.js';
export { LipSyncEngine } from './audio/LipSyncEngine.js';
export { FaceTracker } from './tracking/FaceTracker.js';
export { EmotionEngine, type VRMEmotion } from './three/EmotionEngine.js';
export { GestureController } from './three/GestureController.js';

// Provider Adapters & Connectors exports
export { GeminiAdapter, type GeminiAdapterOptions } from './providers/ai/GeminiAdapter.js';
export { OpenAIAdapter, type OpenAIAdapterOptions } from './providers/ai/OpenAIAdapter.js';
export { AnthropicAdapter, type AnthropicAdapterOptions } from './providers/ai/AnthropicAdapter.js';
export { GroqAdapter, type GroqAdapterOptions } from './providers/ai/GroqAdapter.js';
export { DeepSeekAdapter, type DeepSeekAdapterOptions } from './providers/ai/DeepSeekAdapter.js';
export { OllamaAdapter, type OllamaAdapterOptions } from './providers/ai/OllamaAdapter.js';
export { CustomAgentAdapter, type CustomAgentAdapterOptions } from './providers/ai/CustomAgentAdapter.js';

export { ElevenLabsTTSAdapter, type ElevenLabsOptions } from './providers/tts/ElevenLabsTTSAdapter.js';
export { OpenAITTSAdapter, type OpenAITTSOptions } from './providers/tts/OpenAITTSAdapter.js';
export { CartesiaTTSAdapter, type CartesiaOptions } from './providers/tts/CartesiaTTSAdapter.js';
export { AzureTTSAdapter, type AzureTTSOptions } from './providers/tts/AzureTTSAdapter.js';
export { WebSpeechTTSAdapter } from './providers/tts/WebSpeechTTSAdapter.js';

export { WebSpeechSTTAdapter } from './providers/stt/WebSpeechSTTAdapter.js';
export { DeepgramSTTAdapter, type DeepgramSTTOptions } from './providers/stt/DeepgramSTTAdapter.js';
export { GroqWhisperSTTAdapter, type GroqWhisperOptions } from './providers/stt/GroqWhisperSTTAdapter.js';

// Types exports
export * from './types/index.js';
