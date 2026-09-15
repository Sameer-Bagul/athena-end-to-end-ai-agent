# Athena 3D Interactive AI Agent SDK & Plugin Architecture Plan

## Executive Overview

This document presents the complete architectural specification and **Live Status Tracking Roadmap** for refactoring the **Athena 3D Talking AI Companion** into a modular, production-ready **SDK and Plugin Suite**.

Developers can embed a 3D avatar with voice, lip-sync, head tracking, and multi-provider AI engine into **React, Next.js, Vue, Svelte, Angular, WordPress, or Vanilla HTML** applications with minimal code.

---

## 📊 Live Master TODO Checklist

### Phase 1: Workspace Infrastructure & Monorepo Setup
- [x] Create `pnpm-workspace.yaml` with `packages/*` and `apps/*`.
- [x] Configure `@athena-ai/core` (`packages/core/package.json`, `tsup.config.ts`).
- [x] Configure `@athena-ai/react` (`packages/react/package.json`, `vite.config.ts`).
- [x] Configure `@athena-ai/web` (`packages/web/package.json`, `tsup.config.ts`).
- [x] Establish shared TypeScript configuration (`tsconfig.base.json`).

### Phase 2: `@athena-ai/core` Headless 3D & Audio Engine
- [x] **Three.js Scene Manager (`AthenaScene.ts`)**: Pure WebGL rendering, camera framing, lighting, and frustum culling locks.
- [x] **VRM Model Loader (`VRMLoader.ts`)**: Asynchronous `.vrm` parsing & mesh optimizations.
- [x] **WebAudio FFT LipSync (`LipSyncEngine.ts`)**: Real-time spectral analysis mapping frequency formants to VRM mouth blendshapes (`aa`, `ih`, `ou`, `ee`, `oh`).
- [x] **Provider Adapters**:
  - [x] `GeminiAdapter` (Google Gemini 1.5/2.0 API streaming).
  - [x] `OpenAIAdapter` (GPT-4o, GPT-4o-mini, Groq, OpenRouter, DeepSeek).
  - [x] `OllamaAdapter` (Zero-cost local LLMs on `http://localhost:11434`).
  - [x] `ElevenLabsTTSAdapter` (High-quality synthetic voice).
  - [x] `OpenAITTSAdapter` (OpenAI speech API `tts-1` voices).
  - [x] `WebSpeechTTSAdapter` (Browser text-to-speech fallback).
  - [x] `WebSpeechSTTAdapter` (Browser speech recognition fallback).
- [x] **Master Orchestrator (`AthenaEngine.ts`)**: Unified state machine coordinating 3D scene, speech synthesis, microphone input, and event callbacks.

### Phase 3: `@athena-ai/react` UI & Component Library
- [x] **`<AthenaCanvas />`**: React wrapper mounting WebGL canvas with ResizeObserver.
- [x] **`<AthenaWidget />`**: Floating glassmorphic 3D avatar widget for bottom-right screen placement.
- [x] **`<VoiceFallbackBanner />`**: Alert badge warning when browser speech fallback is active (`⚠️ Using basic browser speech synthesis fallback. Connect an ElevenLabs or OpenAI API key for realistic natural voice.`).
- [x] **`<AthenaSettingsModal />`**: Dynamic drawer to hot-swap AI & Voice providers and paste API keys.
- [x] **`useAthenaAgent()`**: React hook exposing reactive state (`isTalking`, `isListening`, `currentExpression`) and methods (`say()`, `ask()`, `listen()`).

### Phase 4: `@athena-ai/web` Framework-Agnostic Web Component
- [x] **`<athena-agent>` Custom Element**: Encapsulating core engine and Shadow DOM UI.
- [x] **Standalone UMD CDN Bundle**: `dist/index.global.js` packaged for script tag inclusion in HTML/Vue/Svelte/PHP.

### Phase 5: Documentation, DX & Type Definitions
- [x] Generate TypeScript `.d.ts` declaration maps across all packages.
- [x] Document developer quickstarts for Next.js, Vite React, and HTML.

### Phase 6: Showcase Demo Applications & Verification
- [x] **`apps/demo-react`**: React showcase app testing `<AthenaWidget />`.
- [x] **`apps/demo-vanilla`**: Plain HTML showcase app testing `<athena-agent>`.
- [x] **Verification**: Clean monorepo build with 0 compilation errors.

---

## 3-Layer Monorepo Architecture

```text
athena/
├── docs/                                  # Comprehensive Architectural & Phase Plans
│   └── SDK_PLUGIN_ARCHITECTURE_PLAN.md
├── packages/
│   ├── core/                              # @athena-ai/core (Headless TypeScript Engine)
│   ├── react/                             # @athena-ai/react (React UI & Component Library)
│   └── web/                               # @athena-ai/web (Web Component Custom Element)
├── apps/
│   ├── demo-react/                        # Next.js / Vite React Showcase App
│   └── demo-vanilla/                      # Plain HTML / Web Component Showcase App
├── pnpm-workspace.yaml
└── package.json
```

---

## Quick Reference: Integration Examples

### 1. Next.js / React (3 Lines)
```tsx
import { AthenaWidget } from '@athena-ai/react';
import '@athena-ai/react/dist/style.css';

export default function App() {
  return (
    <AthenaWidget 
      avatarUrl="/models/athena.vrm"
      position="bottom-right"
    />
  );
}
```

### 2. Plain HTML Web Component (Script Tag)
```html
<script src="https://cdn.jsdelivr.net/npm/@athena-ai/web"></script>

<athena-agent 
  avatar-url="https://example.com/athena.vrm" 
  ai-provider="gemini" 
  position="bottom-right">
</athena-agent>
```

### 3. Headless Core Engine Usage
```typescript
import { AthenaEngine, GeminiAdapter, ElevenLabsTTSAdapter } from '@athena-ai/core';

const engine = new AthenaEngine({
  canvas: document.getElementById('avatar-canvas') as HTMLCanvasElement,
  avatarUrl: '/models/athena.vrm',
  aiProvider: new GeminiAdapter({ apiKey: 'YOUR_KEY' }),
  ttsProvider: new ElevenLabsTTSAdapter({ apiKey: 'YOUR_ELEVENLABS_KEY' }),
});

await engine.init('/models/athena.vrm');
engine.say("Hello! How can I help you today?");
```
