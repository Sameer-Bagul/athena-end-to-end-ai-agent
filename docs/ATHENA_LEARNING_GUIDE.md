# 🎓 Athena AI System Architecture: The Ultimate Learning Guide
> **Mastering Full-Stack AI Desktop Applications: Tech + Simple English + Mini Flowcharts + Real Examples**

---

## 🏛️ Master 3-Tier System Overview

Athena is built using a **3-Tier Modular Architecture**. This design ensures that heavy operations (like AI reasoning, web browsing, and voice processing) never freeze or crash the user interface.

```
+---------------------------------------------------------------------------------------------------+
|                                  1. RENDERER FRONTEND (UI & 3D)                                   |
|   React 18 Chat UI  ===>  useAssistant Hook  ===>  LipSync Engine (60 FPS)  ===>  3D VRM Avatar   |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (IPC Bridge: preload.ts)
+---------------------------------------------------------------------------------------------------+
|                                     2. ELECTRON MAIN PROCESS                                      |
|    IPC Bridge Handler  ===>  NativeAgent ReAct Loop  ===>  ModelRouter  ===>  Tool Registry       |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (HTTP / WebSocket / Stdio)
+---------------------------------------------------------------------------------------------------+
|                                    3. SERVICES & CLOUD APIs                                       |
|    Whisper STT (9001)  │  Supertonic TTS (3001)  │  Gemini Cloud API  │  agent-browser MCP (3000) |
+---------------------------------------------------------------------------------------------------+
```

---

# 🎨 TIER 1: RENDERER FRONTEND (UI & 3D)

The Frontend is what the user sees and interacts with on screen. It runs inside a sandboxed web browser window (Vite + React 18 + Three.js).

---

## 1.1 React 18 Chat UI (`store.ts` / Zustand)

### 🔄 Mini Flowchart
```
[User Types Text / Speaks] ➔ [React Chat Component] ➔ [Zustand Store (store.ts)] ➔ [Renders Chat Bubbles]
```

### 💻 Technical Breakdown
* **File**: `renderer/src/store.ts` & `renderer/src/components/Chat/`
* **Role**: Manages the global state of the application using **Zustand** (a lightweight state management library).
* **Key Functionality**: Stores conversation history, active model selections, UI theme states, and streaming token buffers.

### 💡 Simple English Analogy (The Dining Table)
Imagine sitting at a restaurant table. The Chat UI is the tablecloth and menu where you type your order and read the response. It doesn't cook the food; it just displays it neatly for you.

### 📝 Code Example (`store.ts`)
```typescript
// Adding a new message to global chat state in Zustand
addMessage: (message) => set((state) => ({
  messages: [...state.messages, message]
}))
```

---

## 1.2 `useAssistant` Hook (Sentence Queue & Streaming)

### 🔄 Mini Flowchart
```
[Streamed Tokens Arrive] ➔ [Regex Splitter: [.!?]] ➔ [Sentence Buffer Queue] ➔ [Send Sentence to TTS]
```

### 💻 Technical Breakdown
* **File**: `renderer/src/hooks/useAssistant.ts`
* **Role**: Handles real-time token streaming and breaks raw text into speakable sentence chunks.
* **Key Functionality**: Instead of waiting for a 500-word paragraph to finish generating before speaking, `useAssistant` uses Regex (`/[.!?]+/`) to slice text into individual sentences as they arrive and pushes them to the TTS audio queue.

### 💡 Simple English Analogy (The Teleprompter Reader)
Imagine a news anchor reading news live. As soon as a single sentence appears on the teleprompter, the anchor reads it out loud without waiting for the entire script to be printed.

### 📝 Code Example (`useAssistant.ts`)
```typescript
// Slicing incoming stream into complete sentences for instant speech
const sentences = textBuffer.split(/(?<=[.!?])\s+/);
if (sentences.length > 1) {
  const completeSentence = sentences.shift();
  speakSentence(completeSentence); // Trigger TTS immediately
}
```

---

## 1.3 3D VRM Avatar (`Sakurada` Male Model / `M1` Voice)

### 🔄 Mini Flowchart
```
[VRM File Loaded] ➔ [Three.js 3D Scene] ➔ [Skeletal FBX Gesture Manager] ➔ [60 FPS Canvas Render]
```

### 💻 Technical Breakdown
* **File**: `renderer/src/components/Avatar/ThreeStage.tsx` & `VRMAvatar.ts`
* **Role**: Renders a 3D anime avatar using **Three.js** and `@pixiv/three-vrm`.
* **Key Functionality**: Loads 3D humanoid models (`.vrm`), applies natural idle breathing, nodding, gesturing animations, and maps voice blendshapes. Default avatar: **Sakurada** with male `M1` voice profile.

### 💡 Simple English Analogy (The Digital Actor)
Think of the 3D Avatar as an actor on stage. It wears a costume (3D mesh), stands on a stage (Three.js scene), and moves its body when speaking.

### 📝 Code Example (`VRMAvatar.ts`)
```typescript
// Loading and updating the 3D VRM model every frame
vrm.update(deltaTime);
vrm.humanoid.getRawBoneNode('head').rotation.y = Math.sin(time) * 0.05; // Idle breathing
```

---

## 1.4 LipSync Engine & Formant Energy (60 FPS Vowel Lerp)

### 🔄 Mini Flowchart
```
[WAV Audio Playing] ➔ [Web Audio AnalyserNode] ➔ [Formant Energy Filter] ➔ [Lerp (0.4) Vowel Blendshapes]
                                                                                      │
                                                                                      ▼
                                                                        Morphs: aa, ih, ou, ee, oh
```

### 💻 Technical Breakdown
* **File**: `renderer/src/lib/audio/lipSync.ts`
* **Role**: Synchronizes the 3D avatar's mouth movements with synthesized voice audio in real time at 60 FPS.
* **Key Functionality**: Uses Web Audio API `AnalyserNode` to compute frequency energy across Low, Mid, and High bands. Maps sound energy to 5 VRM vowel morph targets (`aa`, `ih`, `ou`, `ee`, `oh`) with a **0.4 Linear Interpolation (Lerp)** smoothing factor for natural mouth movement without jitter.

### 💡 Simple English Analogy (The Puppet Master)
Imagine a puppeteer pulling strings to move a puppet's mouth. When the voice is loud and open (like "AA"), the puppet's mouth opens wide. When the voice is quiet, the mouth closes smoothly.

### 📝 Code Example (`lipSync.ts`)
```typescript
// Computing vowel morph target weight from frequency energy
const lowEnergy = getEnergyRange(analyser, 200, 800);
const targetAa = Math.min(1.0, lowEnergy * 2.5);
// Smooth transition using Lerp
currentAa = currentAa + (targetAa - currentAa) * 0.4;
vrm.expressionManager.setValue('aa', currentAa);
```

---

# ⚙️ TIER 2: ELECTRON MAIN PROCESS

The Main Process is the desktop coordinator running inside Node.js. It has full OS access and manages IPC communication, intent routing, and tool execution.

---

## 2.1 IPC Bridge (`preload.ts` & `agentIpc.ts`)

### 🔄 Mini Flowchart
```
[React UI Call] ➔ [preload.ts (contextBridge)] ➔ [Electron IPC Channel] ➔ [agentIpc.ts Handler]
```

### 💻 Technical Breakdown
* **Files**: `electron/preload.ts` & `electron/ipc/agentIpc.ts`
* **Role**: Connects the isolated Frontend sandbox with the Node.js Main Process safely.
* **Key Functionality**: Exposes `window.athena` to React. Listens for `ipcMain.on("agent:query-stream")` and streams back real-time tokens (`agent:token-${queryId}`).

### 💡 Simple English Analogy (The Restaurant Waiter)
The IPC Bridge is the waiter who takes your order from the table to the kitchen and brings back your food word-by-word.

### 📝 Code Example (`agentIpc.ts`)
```typescript
// Listening for query streams from UI and invoking NativeAgent
ipcMain.on("agent:query-stream", async (event, { queryId, query, systemPrompt }) => {
  await runAgent(query, systemPrompt, modelName, apiKey,
    (token) => event.sender.send(`agent:token-${queryId}`, token) // Stream token back
  );
});
```

---

## 2.2 NativeAgent Core (`nativeAgent.ts` ReAct Loop)

### 🔄 Mini Flowchart
```
[User Query] ➔ [Build System Context] ➔ [Call Gemini API]
                      ▲                        │
                      │               +--------┴--------+
                      │               | Needs Tool Call?|
                      │               +--------┬--------+
                      │             YES │        │ NO
                      │                 ▼        ▼
                      └─── [Execute Tool]    [Stream Final Answer]
```

### 💻 Technical Breakdown
* **File**: `backend/agent/nativeAgent.ts`
* **Role**: Autonomous ReAct (Reasoning + Acting) execution engine.
* **Key Functionality**: Runs an iterative loop (up to `MAX_ITERATIONS = 5`). Injects time, persona, and JSON tool schemas. If Gemini requests a tool, `NativeAgent` executes it locally, appends the result to history, and re-queries Gemini until a final text response is produced.

### 💡 Simple English Analogy (The Detective & Action Loop)
Think of a detective solving a case. The detective thinks (*"I need to check the weather in Tokyo"*), takes an action (*calls weather service*), looks at the evidence (*"It's sunny"*), and gives you the final report (*"Tokyo is sunny today!"*).

### 📝 Code Example (`nativeAgent.ts`)
```typescript
// ReAct loop executing tools and feeding results back into conversation memory
if (parsed.tool) {
  const tool = tools.find(t => t.name === parsed.tool);
  const toolResult = await tool.invoke(parsed.args);
  messages.push({ role: "user", parts: [{ text: `Tool Result: ${toolResult}` }] });
  // Loop continues to next iteration
}
```

---

## 2.3 Intent ModelRouter (`modelRouter.ts`)

### 🔄 Mini Flowchart
```
[User Query] ➔ [Regex Intent Matching] ➔ [Select Role: coder | browser | default_chat] ➔ [Assign Model]
```

### 💻 Technical Breakdown
* **File**: `backend/providers/modelRouter.ts`
* **Role**: Routes incoming user prompts to the most optimal AI model.
* **Key Functionality**: Analyzes query intent (coding vs web browsing vs general chat). Assigns role defaults (e.g. `gemini-3.6-flash`).

### 💡 Simple English Analogy (The Traffic Controller)
Like a hospital triage nurse who sends a patient with a broken arm to X-Ray and a patient with a fever to general medicine.

---

## 2.4 Native Tool Registry (`backend/agent/tools/`)

### 🔄 Mini Flowchart
```
[Agent Tool Request] ➔ [Tool Registry Lookup] ➔ [Execute Handler (weather/search/clock)] ➔ [Return Output]
```

### 💻 Technical Breakdown
* **Directory**: `backend/agent/tools/` (`weather.ts`, `clock.ts`, `webSearch.ts`, `browser.ts`)
* **Role**: Isolated, modular tools that the AI can call to fetch live data or control the system.

---

# 🚀 TIER 3: SERVICES & CLOUD APIs

Dedicated microservices that run locally on dedicated ports or connect to external cloud providers.

---

## 3.1 Whisper STT Server (Port 9001 - Python FastAPI)

### 🔄 Mini Flowchart
```
[Microphone Audio Blob] ➔ [HTTP POST http://localhost:9001/transcribe] ➔ [Python Whisper Model] ➔ [Return Text]
```

### 💻 Technical Breakdown
* **Service**: Python FastAPI + Uvicorn server running OpenAI Whisper on Port 9001.
* **Role**: Converts spoken human speech into clean text strings.

---

## 3.2 Supertonic TTS Server (Port 3001 - ONNX Neural TTS)

### 🔄 Mini Flowchart
```
[Sentence Text String] ➔ [HTTP POST http://localhost:3001/tts] ➔ [ONNX Neural Synthesis] ➔ [Return WAV Audio]
```

### 💻 Technical Breakdown
* **Service**: Node.js ONNX Neural Voice Synthesis microservice on Port 3001.
* **Role**: Synthesizes natural, human-sounding voice audio in real-time. Configured with male `M1` voice style.

---

## 3.3 Google Gemini Cloud API & Resiliency (`providerLayer.ts`)

### 🔄 Mini Flowchart
```
[LLM Request] ➔ [HTTPS POST to Gemini] ➔ [HTTP 503 Service Unavailable?]
                                                │
                                    +-----------┴-----------+
                                YES │                       │ NO
                                    ▼                       ▼
                     [Wait 1s, 2s Backoff Retry]   [HTTP 200 OK Response]
                                    │
                                    ▼
                     [Fallback: gemini-flash-latest]
```

### 💻 Technical Breakdown
* **File**: `backend/providers/providerLayer.ts`
* **Role**: Handles Gemini cloud API execution with built-in fault tolerance.
* **Key Functionality**: Automatically handles Google Cloud 503 high demand spikes and 429 rate limits using **Exponential Backoff Retries** (waiting 1s, 2s) and candidate fallback (`gemini-3.6-flash` ➔ `gemini-flash-latest` ➔ `gemini-2.5-flash`).

### 💡 Simple English Analogy (The Emergency Generator)
If the main power grid flickering during peak hours, your house automatically switches to a backup generator without turning off your lights.

---

## 3.4 `agent-browser` MCP Sidecar (Port 3000 WebSocket Stream)

### 🔄 Mini Flowchart
```
[Agent Request] ➔ [Stdio JSON-RPC MCP Call] ➔ [Playwright Automated Browser] ➔ [Stream Screenshots over Port 3000]
```

### 💻 Technical Breakdown
* **Service**: Model Context Protocol (MCP) sidecar executing Playwright automation.
* **Role**: Allows the AI to navigate websites, click, type, and extract live web data while streaming visual frames to the UI over WebSocket Port 3000.

---

# 🔎 End-to-End Real World Example

### User Command: *"What is the weather in Tokyo right now?"*

```
1. USER (Voice Mode): Speaks into mic.
2. WHISPER STT (Port 9001): Transcribes audio to text: "What is the weather in Tokyo right now?"
3. REACT UI: Displays text in chat bubble and sends IPC event `agent:query-stream` via preload.ts.
4. ELECTRON MAIN: Receives IPC event and passes query to NativeAgent.
5. NATIVE AGENT (Iteration 1): Assembles system prompt with current time and tool schemas, calls Gemini API.
6. GEMINI CLOUD API: Sees query and returns JSON: { "tool": "weather", "args": { "location": "Tokyo" } }.
7. NATIVE AGENT: Executes weather.ts tool ➔ Fetches OpenWeather API ➔ Gets "Sunny, 22°C".
8. NATIVE AGENT (Iteration 2): Feeds "Tool Result: Sunny, 22°C" back to Gemini.
9. GEMINI CLOUD API: Returns final response: { "response": "It's currently sunny and 22°C in Tokyo!" }.
10. NATIVE AGENT: Streams tokens via IPC back to React UI.
11. USEASSISTANT HOOK: Detects sentence completion ("...Tokyo!"), POSTs text to Supertonic TTS (Port 3001).
12. SUPERTONIC TTS (Port 3001): Returns 24kHz WAV audio blob.
13. LIPSYNC ENGINE: Plays WAV audio, calculates formant frequencies via Web Audio API, drives 3D Sakurada VRM mouth blendshapes (aa, ih, ou, ee, oh) smoothly at 60 FPS!
```
