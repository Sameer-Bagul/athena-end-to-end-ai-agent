# 📘 Athena 3D AI Agent SDK Complete Developer Guide & API Reference

Welcome to the complete developer documentation for the **Athena 3D AI Agent SDK**. This guide provides end-to-end instructions for embedding 3D VRM avatars into React, Next.js, Vue, Svelte, Web Components, and Vanilla TypeScript applications.

---

## 📑 Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Installation Guide](#2-installation-guide)
3. [Framework Integration Recipes](#3-framework-integration-recipes)
   - [React & Next.js (`@athena-ai/react`)](#react--nextjs-athena-aireact)
   - [Plain HTML & Web Components (`@athena-ai/web`)](#plain-html--web-components-athena-aiweb)
   - [Vue 3 Integration](#vue-3-integration)
   - [Svelte 4/5 Integration](#svelte-45-integration)
   - [Headless Core TypeScript Engine (`@athena-ai/core`)](#headless-core-typescript-engine-athena-aicore)
4. [Complete Connector Matrix & Configuration](#4-complete-connector-matrix--configuration)
   - [AI / LLM Adapters](#ai--llm-adapters)
   - [TTS Speech Synthesis Adapters](#tts-speech-synthesis-adapters)
   - [STT Speech Recognition Adapters](#stt-speech-recognition-adapters)
5. [Complete API Reference](#5-complete-api-reference)
6. [NPM Publishing & Deployment Guide](#6-npm-publishing--deployment-guide)

---

## 1. Architectural Overview

Athena SDK uses a **3-Layer Modular Monorepo Architecture**:

1. **`@athena-ai/core`**: Headless WebGL rendering engine, WebAudio LipSync FFT, sentiment-driven `EmotionEngine`, procedural `GestureController`, and pluggable AI/TTS/STT connectors.
2. **`@athena-ai/react`**: React components (`<AthenaWidget />`, `<AthenaCanvas />`, `<AthenaSettingsModal />`) and hooks (`useAthenaAgent`).
3. **`@athena-ai/web`**: Custom HTML Element `<athena-agent>` packaged as an UMD/IIFE bundle for zero-dependency CDN integration.

---

## 2. Installation Guide

### Installing via Package Managers

```bash
# Using npm
npm install @athena-ai/core @athena-ai/react

# Using pnpm
pnpm add @athena-ai/core @athena-ai/react

# Using yarn
yarn add @athena-ai/core @athena-ai/react
```

### Script Tag CDN (Zero-Install HTML)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@athena-ai/web/dist/index.js"></script>
```

---

## 3. Framework Integration Recipes

### React & Next.js (`@athena-ai/react`)

#### Standard React App
```tsx
import React from 'react';
import { AthenaWidget } from '@athena-ai/react';
import '@athena-ai/react/dist/style.css';

export default function App() {
  return (
    <div>
      <h1>My Application</h1>
      <AthenaWidget 
        avatarUrl="/models/athena.vrm"
        position="bottom-right"
      />
    </div>
  );
}
```

#### Next.js (SSR Safe Dynamic Import)
Because 3D canvas rendering depends on browser WebGL objects (`window`, `HTMLCanvasElement`), wrap `<AthenaWidget />` in Next.js dynamic import with `ssr: false`:

```tsx
// components/AthenaWrapper.tsx
'use client';
import dynamic from 'next/dynamic';

const AthenaWidget = dynamic(
  () => import('@athena-ai/react').then((mod) => mod.AthenaWidget),
  { ssr: false }
);

export default function AthenaWrapper() {
  return <AthenaWidget avatarUrl="/models/athena.vrm" position="bottom-right" />;
}
```

---

### Plain HTML & Web Components (`@athena-ai/web`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Athena Web Component Demo</title>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@athena-ai/web/dist/index.js"></script>
</head>
<body>
  <h1>Plain HTML Web Page</h1>

  <!-- Embedded Web Component -->
  <athena-agent 
    avatar-url="/models/athena.vrm"
    ai-provider="gemini"
    position="bottom-right">
  </athena-agent>
</body>
</html>
```

---

### Vue 3 Integration

In Vue 3, you can use `<athena-agent>` custom element directly or wrap `@athena-ai/core`:

```html
<template>
  <div class="app-container">
    <h1>Vue 3 + Athena 3D Agent</h1>
    <athena-agent 
      avatar-url="/models/athena.vrm" 
      ai-provider="gemini"
      position="bottom-right">
    </athena-agent>
  </div>
</template>

<script setup>
import '@athena-ai/web';
</script>
```

---

### Headless Core TypeScript Engine (`@athena-ai/core`)

```typescript
import { 
  AthenaEngine, 
  GeminiAdapter, 
  ElevenLabsTTSAdapter,
  DeepgramSTTAdapter 
} from '@athena-ai/core';

// 1. Target Canvas
const canvas = document.getElementById('avatar-canvas') as HTMLCanvasElement;

// 2. Initialize Engine
const engine = new AthenaEngine({
  canvas,
  avatarUrl: '/models/athena.vrm',
  aiProvider: new GeminiAdapter({ apiKey: 'YOUR_GEMINI_KEY' }),
  ttsProvider: new ElevenLabsTTSAdapter({ apiKey: 'YOUR_ELEVENLABS_KEY' }),
  sttProvider: new DeepgramSTTAdapter({ apiKey: 'YOUR_DEEPGRAM_KEY' }),
});

await engine.init('/models/athena.vrm');

// 3. Spoken Query
await engine.say("Hello! I am Athena, your 3D interactive AI assistant.");

// 4. Set Expression
engine.setEmotion('happy', 1.0);
```

---

## 4. Complete Connector Matrix & Configuration

### AI / LLM Adapters

| Adapter Class | Import | Provider | Options |
|---|---|---|---|
| `GeminiAdapter` | `@athena-ai/core` | Google Gemini | `{ apiKey, model?: 'gemini-1.5-flash' }` |
| `OpenAIAdapter` | `@athena-ai/core` | OpenAI GPT-4o | `{ apiKey, model?: 'gpt-4o-mini' }` |
| `AnthropicAdapter` | `@athena-ai/core` | Anthropic Claude | `{ apiKey, model?: 'claude-3-5-sonnet-20241022' }` |
| `GroqAdapter` | `@athena-ai/core` | Groq (Llama 3.3 70B) | `{ apiKey, model?: 'llama-3.3-70b-versatile' }` |
| `DeepSeekAdapter` | `@athena-ai/core` | DeepSeek (V3 / R1) | `{ apiKey, model?: 'deepseek-chat' }` |
| `OllamaAdapter` | `@athena-ai/core` | Local Ollama | `{ endpoint?: 'http://localhost:11434' }` |
| `CustomAgentAdapter` | `@athena-ai/core` | Custom Gateway | `{ endpoint, headers?: {} }` |

---

### TTS Speech Synthesis Adapters

| Adapter Class | Import | Provider | Latency |
|---|---|---|---|
| `ElevenLabsTTSAdapter` | `@athena-ai/core` | ElevenLabs | Low (Expressive) |
| `CartesiaTTSAdapter` | `@athena-ai/core` | Cartesia Sonic | Ultra-Low (<100ms) |
| `OpenAITTSAdapter` | `@athena-ai/core` | OpenAI `tts-1` | Medium |
| `AzureTTSAdapter` | `@athena-ai/core` | Azure Speech Services | Low |
| `WebSpeechTTSAdapter` | `@athena-ai/core` | Browser Native | Zero-Cost Fallback |

---

### STT Speech Recognition Adapters

| Adapter Class | Import | Provider | Mode |
|---|---|---|---|
| `DeepgramSTTAdapter` | `@athena-ai/core` | Deepgram Nova-2 | Real-time WebSocket |
| `GroqWhisperSTTAdapter` | `@athena-ai/core` | Groq Whisper API | High Accuracy Audio |
| `WebSpeechSTTAdapter` | `@athena-ai/core` | Browser Native | In-Browser |

---

## 5. Complete API Reference

### `<AthenaWidget />` Props (React)

```typescript
interface AthenaWidgetProps {
  avatarUrl?: string; // Path or URL to .vrm file (Default: '/models/athena.vrm')
  apiKey?: string; // Default Gemini API key
  position?: 'bottom-right' | 'bottom-left' | 'inline'; // Layout positioning
  theme?: 'dark' | 'light';
}
```

### `AthenaEngine` Methods (Core)

```typescript
class AthenaEngine {
  init(vrmUrl: string): Promise<void>;
  say(text: string): Promise<void>;
  ask(prompt: string): Promise<string>;
  listen(): void;
  stopListening(): void;
  setEmotion(emotion: 'neutral' | 'happy' | 'sorrow' | 'angry' | 'surprised' | 'relaxed', weight?: number): void;
  loadCustomAvatarFile(file: File): Promise<void>;
  startFaceTracking(): void;
  stopFaceTracking(): void;
  destroy(): void;
}
```

---

## 6. NPM Publishing & Deployment Guide

To build publish-ready npm packages:

```bash
cd athena-sdk
pnpm clean
pnpm build
```

Publish to NPM:

```bash
cd packages/core && pnpm publish --access public
cd ../react && pnpm publish --access public
cd ../web && pnpm publish --access public
```
