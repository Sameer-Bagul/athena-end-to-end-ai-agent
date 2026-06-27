<div align="center">
  <img src="athena.png" alt="Athena Banner" />
  <h1>Athena - 3D VRM AI Assistant</h1>
  <p>A fully integrated, autonomous 3D AI companion driven by LangGraph, Electron, Three.js, and local AI microservices.</p>
</div>

---

## 🎯 Overview

Athena is an intelligent, emotionally responsive 3D avatar that lives on your desktop. Built for immersion and autonomy, Athena breaks out of the standard chatbox paradigm by featuring fully interactive 3D graphics driven by face-tracking, a localized RAG memory system, dynamic tool routing, and zero-latency local speech services.

### Core Capabilities
- 🧠 **LangGraph Agent Engine**: Powered by Google Gemini (and locally via Ollama), Athena acts as an agent, autonomously determining when to use tools.
- 🗣️ **Local Voice Stack**: Lightning-fast local inference using Python `whisper-fast` for Speech-to-Text and Node-based `SuperTonic` for Text-to-Speech.
- 👁️ **Face/Head Tracking**: MediaPipe integration allows Athena to look at you, maintain eye contact, and blink naturally based on your webcam.
- 🛠️ **MCP & Tools Integration**: Athena dynamically uses duckduckgo web search, weather APIs, system timers (linked to the 3D UI), and a local Model Context Protocol (MCP) sidecar for time data.
- 📚 **Localized Document RAG**: Drop PDFs into Athena's settings, and her `knowledge_search` tool will perform semantic vector searches against a local persistence store.
- ⏪ **Message Replay**: Review past responses instantly with a dedicated replay feature that seamlessly re-triggers TTS and animations without requiring an LLM callback.
- 🎨 **Minimalist UI**: Sleek, modern, and immersive desktop widget layout designed for a distraction-free AI presence.

---

## ⚡ Performance Specs & 3D Optimizations

Athena uses a highly optimized custom Three.js rendering pipeline designed to be lightweight enough for laptops while maintaining a buttery smooth 60 FPS:

- **Aggressive Memory Management**: Integrates custom `deepDispose` routines for FBX animation geometries. Retargeted animations instantly clear their source geometry data, preventing multi-gigabyte RAM leaks over long sessions.
- **CPU Throttling & LipSync Math**: The Audio FFT Formant analysis (which maps audio frequencies to mouth blendshapes) is throttled to 20Hz (~50ms intervals) while maintaining 60Hz visual interpolation, slashing idle CPU overhead by 66%.
- **Shader Precompilation**: Uses `renderer.compileAsync` during the loading screen to warm up the GPU shaders, eliminating the infamous "Three.js first-render stutter".
- **Advanced VRM Culling**: Custom traversal of VRM meshes disables shadow-casting on complex transparent materials (like hair outlines) and locks root `frustumCulled` vectors to prevent camera clipping, vastly reducing GPU draw-calls.
- **Dedicated GPU Enforcer**: Explicit `powerPreference: "high-performance"` WebGL context prevents laptops from defaulting to weak integrated graphics.

---

## 🏗️ Architecture

Athena utilizes a modular microservice architecture orchestrated via Electron IPC.

```mermaid
graph TD
    UI[React / Vite Frontend] -->|IPC Bridge| MAIN[Electron Main]
    
    subgraph "Backend Services"
        MAIN -->|Agent Requests| LG[LangGraph Agent]
        MAIN -->|Audio Processing| TTS[SuperTonic TTS Port: 3000]
        MAIN -->|Audio Processing| STT[Whisper STT Port: 9001]
        MAIN -->|Sidecars| MCP[MCP Time Server]
    end

    subgraph "LangGraph Agent Tools"
        LG -->|Web| DuckDuckGo[DuckDuckGo Search]
        LG -->|API| Weather[OpenWeather API]
        LG -->|Local Memory| RAG[VectorStore RAG]
        LG -->|System| Timer[UI Broadcast Timer]
    end

    subgraph "Frontend Engine"
        UI --> THREE[Three.js Scene]
        THREE --> VRM[VRM Avatar Model]
        THREE --> ANIM[FBX Animation Manager]
        UI --> MP[MediaPipe Face Tracking]
    end
```

### Clean Architecture Principles
1. **No React Three Fiber**: The 3D scene is strictly imperative Three.js, decoupled entirely from the React render cycle for maximum performance.
2. **Local First**: Audio (STT/TTS) and document retrieval (RAG) execute locally via spawned background processes.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Recommended: Node 20 LTS)
- Python 3.10+ (for Whisper STT)
- ffmpeg (required by Whisper)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd athena

# 2. Install root and electron dependencies
npm install

# 3. Install frontend renderer dependencies
cd renderer && npm install && cd ..
```

### Configuration

Create a `.env` file in the root directory and configure your keys:

```ini
# Required for Gemini LLM
GOOGLE_API_KEY="your-google-api-key"

# Required for Weather tool
OPENWEATHER_API_KEY="your-openweather-api-key"

# Optional overrides
ELECTRON_DISABLE_SANDBOX=1
```

> **Note**: You can also configure the AI Provider (Gemini, Ollama, LMStudio) and enter your API keys directly through the Athena UI Settings Panel.

### Required Assets

Ensure your 3D assets are placed correctly:

- **VRM Model:** `renderer/public/models/athena.vrm`
- **FBX Animations:** `renderer/public/animations/*.fbx` (using Mixamo standard rigs)

### Running the Application

Start all services (Frontend, Electron, STT, TTS, Agent) simultaneously:

```bash
npm start
```
*Note: Athena will automatically assign dynamic open ports to the STT and TTS background services to prevent collisions.*

---

## 📦 Project Structure

```text
athena/
├── backend/               # LangGraph Agent, RAG, MCP Manager, LLM Logic
├── electron/              # Main process, Preload scripts, IPC Bridge
├── renderer/              # Vite React Frontend
│   ├── public/            # Static assets (Models, FBX Animations)
│   └── src/
│       ├── components/    # React UI Components
│       ├── hooks/         # React Hooks (useAssistant, useFaceTracking)
│       └── three/         # Pure Three.js Engine (VRM, FBX Managers)
├── services/              # Local microservices
│   ├── stt-env/           # Python virtual environment
│   ├── whisper-fast/      # Python FastAPI for local STT
│   └── TTS-supertonic/    # Node.js local TTS engine
└── README.md
```

---

## 🛠️ Tool System (LangGraph)

Athena does not just answer queries textually; she executes functions autonomously.

1. **`knowledge_search(query)`**: Performs a cosine-similarity search against uploaded PDFs using `MemoryVectorStore`.
2. **`web_search(query)`**: Scrapes DuckDuckGo HTML results when external, up-to-date knowledge is required.
3. **`weather(city)`**: Calls the OpenWeather API.
4. **`timer(seconds)`**: An action-based tool that injects an IPC payload to render a 3D countdown timer in the frontend.
5. **`clock(timezone)`**: Calls an external MCP (Model Context Protocol) sidecar process to retrieve global time.

---

## 🎨 Modifying Athena

### Adding New Animations
1. Drop your `.fbx` (Mixamo Rigged) into `renderer/public/animations/`.
2. Update the `AnimationAction` enum in `renderer/src/three/AnimationManager.ts`.
3. Add the mapping to `ANIMATION_FILES`.

### Changing the LLM
Athena's factory supports hot-swapping providers. In the frontend Settings Dialog, simply switch the active provider to:
- **Gemini** (Cloud - `gemini-1.5-flash`)
- **Ollama** (Local - `dolphin-mistral`, `llama3`)
- **LM Studio** (Local - `http://localhost:1234/v1`)

---

## 🐛 Troubleshooting

- **Crash `EADDRINUSE`**: Fixed in v1.1. Athena now uses dynamic port resolution for the Python STT server and Node TTS server.
- **RAG Upload Errors**: Ensure `pdf-parse@1.x` is installed. `pdf-parse@2.x` is not supported by Langchain Community loaders.
- **Gemini Crash on Tool Execution**: Fixed in v1.1. ToolMessages now strictly pass the `name` field required by the `@langchain/google-genai` SDK.
- **Audio Device Errors**: Use the Settings panel inside Athena to explicitly set your target Microphone and Speaker interfaces.

---

<div align="center">
  <b>Built with ❤️ by Sameer Bagul</b>
</div>
