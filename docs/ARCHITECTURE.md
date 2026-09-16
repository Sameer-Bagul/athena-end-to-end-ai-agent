# Athena Architecture Documentation (Clean & Modular)

Welcome to Athena's clean, modular system architecture guide!

Unlike complex webs with overlapping arrows, Athena's architecture is presented in **5 clean, crystal-clear diagrams** with **zero line crossings or spaghetti arrows**.

---

## 1. Clean 3-Tier System Map (`clean_system_map.mmd`)

Organized into 3 distinct vertical columns (Frontend ➔ Desktop Main Process ➔ Services & Cloud APIs) with clean numbered arrows (1 to 9).

- **Mermaid File**: [`docs/architecture/clean_system_map.mmd`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/clean_system_map.mmd)

```mermaid
graph LR
    subgraph Tier1 ["1. RENDERER FRONTEND (UI & 3D)"]
        direction TB
        UI["React 18 Chat UI (store.ts / Zustand)"]
        Assistant["useAssistant Hook (Sentence Queue)"]
        Avatar["3D VRM Avatar (Sakurada Male / M1 Voice)"]
        LipSyncEngine["LipSync Engine (60 FPS Vowel Lerp)"]
        
        UI --> Assistant
        Assistant --> LipSyncEngine
        LipSyncEngine --> Avatar
    end

    subgraph Tier2 ["2. ELECTRON MAIN PROCESS"]
        direction TB
        Bridge["IPC Bridge (preload.ts / agentIpc.ts)"]
        AgentCore["NativeAgent Core (ReAct Execution Loop)"]
        Router["ModelRouter (Intent Selection)"]
        Registry["Tool Registry (Native Tools & MCP)"]
        
        Bridge --> AgentCore
        AgentCore --> Router
        AgentCore --> Registry
    end

    subgraph Tier3 ["3. SERVICES & CLOUD APIs"]
        direction TB
        STT["Whisper STT Service (Port 9001 - FastAPI)"]
        TTS["Supertonic TTS Service (Port 3001 - ONNX Neural)"]
        Gemini["Google Gemini Cloud API (gemini-3.6-flash)"]
        BrowserMCP["agent-browser MCP (Port 3000 WebSocket)"]
        
        STT
        TTS
        Gemini
        BrowserMCP
    end

    UI -->|1. User Prompt| Bridge
    Bridge -->|2. Route Query| AgentCore
    AgentCore -->|3. Call LLM| Gemini
    Gemini -->|4. Response / Tool Call| AgentCore
    AgentCore -->|5. Run Tool / Browser| BrowserMCP
    AgentCore -->|6. Stream Tokens| Bridge
    Bridge -->|7. Update UI Text| Assistant
    Assistant -->|8. Request Audio| TTS
    TTS -->|9. Audio WAV Buffer| LipSyncEngine
```

---

## 2. Master End-to-End Sequence Flow (`grand_agent_sequence.mmd`)

A clean chronological sequence diagram detailing the complete lifecycle from input to LLM execution, 503 retries, tool execution, sentence token streaming, neural TTS generation, and 60 FPS VRM lip-sync.

- **Mermaid File**: [`docs/architecture/grand_agent_sequence.mmd`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/grand_agent_sequence.mmd)

```mermaid
sequenceDiagram
    autonumber
    actor User as Master User
    participant Mic as Whisper STT (Port 9001)
    participant UI as React UI (store.ts)
    participant IPC as Electron IPC Bridge
    participant Agent as NativeAgent Core
    participant Cloud as Gemini Cloud API
    participant Tools as Tools & MCP Sidecars
    participant TTS as Supertonic TTS (Port 3001)
    participant Audio as Web Audio Analyser
    participant Avatar as 3D VRM Avatar

    alt Voice Input Mode
        User->>Mic: Speak prompt into microphone
        Mic->>Mic: Python Whisper transcribe
        Mic-->>UI: Return transcribed text
    else Text Input Mode
        User->>UI: Type message and press Enter
    end

    UI->>IPC: agent:query-stream (IPC Event)
    IPC->>Agent: runAgent(query, model)
    
    loop ReAct Reasoning & Execution Loop
        Agent->>Cloud: POST generateContent (gemini-3.6-flash)
        alt 503 Service Unavailable
            Cloud-->>Agent: HTTP 503 High Demand
            Agent->>Agent: Retry with Exponential Backoff (1s to 2s) & Model Fallback
        end
        Cloud-->>Agent: HTTP 200 OK (Model Response)
        
        alt Tool Call Requested by Model
            Agent->>Tools: Execute Tool (Weather / Search / Browser)
            Tools-->>Agent: Return Tool Result Output
        else Final Response Ready
            Agent->>Agent: Exit ReAct Loop
        end
    end

    loop Token & Audio Streaming
        Agent-->>IPC: Stream Text Tokens
        IPC-->>UI: Update Chat Bubble Text
        UI->>TTS: POST /tts (Port 3001 - Sentence Chunks)
        TTS-->>UI: Return Audio WAV Data
        UI->>Audio: Decode WAV & Compute Formant Frequencies
        Audio->>Avatar: Update Blendshapes (aa, ih, ou, ee, oh) at 60 FPS
        Avatar-->>User: 3D Avatar Speaks with Male M1 Voice & Gesture
    end
```

---

## 3. ReAct Loop & Multi-Model Fallback Resiliency (`clean_agent_loop.mmd`)

A step-by-step flowchart showing prompt reception, intent routing to `gemini-3.6-flash`, automatic 503 backoff retry (1s, 2s), model fallback chain, tool execution loop, and output streaming.

- **Mermaid File**: [`docs/architecture/clean_agent_loop.mmd`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/clean_agent_loop.mmd)

```mermaid
graph TD
    Start["User Query Received"] --> Step1["1. Intent Classification<br/>ModelRouter selects gemini-3.6-flash"]
    Step1 --> Step2["2. Build System Context<br/>Inject Persona & Available Tool Schemas"]
    Step2 --> Step3["3. Send Request to ProviderLayer"]
    
    Step3 --> CallCloud{"4. Execute Gemini Cloud Call"}
    
    CallCloud -->|HTTP 503 / 429 Error| Retry1["Attempt 1: Wait 1s Exponential Backoff"]
    Retry1 -->|Retry Primary Model| CallCloud
    Retry1 -->|Still 503 Error| Retry2["Attempt 2: Wait 2s & Fallback Model<br/>gemini-flash-latest to gemini-2.5-flash"]
    Retry2 --> CallCloud
    
    CallCloud -->|HTTP 200 Success| Evaluate{"5. Evaluate Model Output"}
    
    Evaluate -->|Tool Call Requested| ExecTool["6. Execute Tool / MCP Sidecar<br/>weather / clock / search / browser"]
    ExecTool -->|Append Result to Messages| Step2
    
    Evaluate -->|Final Text Response| Stream["7. Stream Tokens to Electron IPC"]
    Stream --> AudioStep["8. Chunk Sentences to Supertonic TTS"]
    AudioStep --> Finish["9. Render 60 FPS VRM Avatar Speech"]

    classDef startStyle fill:#431407,stroke:#fb923c,color:#ffffff;
    classDef stepStyle fill:#1e293b,stroke:#38bdf8,color:#ffffff;
    classDef errStyle fill:#831843,stroke:#f472b6,color:#ffffff;
    classDef decStyle fill:#312e81,stroke:#a5b4fc,color:#ffffff;
    classDef endStyle fill:#064e3b,stroke:#34d399,color:#ffffff;

    class Start startStyle;
    class Step1,Step2,Step3,ExecTool,Stream,AudioStep stepStyle;
    class Retry1,Retry2 errStyle;
    class CallCloud,Evaluate decStyle;
    class Finish endStyle;
```

---

## 4. 4-Step TTS & Lip Sync Pipeline (`clean_tts_lipsync.mmd`)

A 4-step horizontal pipeline showing how sentence text chunks generate neural WAV audio on Port 3001, and how Web Audio API formant energy analysis computes 60 FPS VRM mouth blendshapes (`aa`, `ih`, `ou`, `ee`, `oh`).

- **Mermaid File**: [`docs/architecture/clean_tts_lipsync.mmd`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/clean_tts_lipsync.mmd)

```mermaid
graph LR
    subgraph Step1 ["1. Text Processing"]
        Text["Sentence Chunk<br/>Regex: [.!?]"]
    end

    subgraph Step2 ["2. Neural Audio Synthesis"]
        TTS["Supertonic TTS Server<br/>Port 3001 - ONNX Neural Voice"]
        WAV["WAV Audio Blob<br/>(24kHz / 16-bit Mono)"]
        Text -->|HTTP POST /tts| TTS
        TTS -->|Return Audio| WAV
    end

    subgraph Step3 ["3. Audio Analysis"]
        AudioCtx["Web Audio API<br/>AnalyserNode"]
        Formant["Formant Energy Filter<br/>Low, Mid, High Frequencies"]
        WAV -->|Decode Audio| AudioCtx
        AudioCtx -->|Frequency Array| Formant
    end

    subgraph Step4 ["4. 3D Render Loop"]
        Lerp["60 FPS Lerp Interpolation<br/>Factor: 0.4 Smooth Transition"]
        VRM["Sakurada VRM Avatar<br/>Blendshapes: aa, ih, ou, ee, oh"]
        Formant -->|Viseme Energy| Lerp
        Lerp -->|Set Morph Weights| VRM
    end

    classDef textStyle fill:#1e1b4b,stroke:#818cf8,color:#ffffff;
    classDef ttsStyle fill:#0284c7,stroke:#38bdf8,color:#ffffff;
    classDef audioStyle fill:#701a75,stroke:#f0abfc,color:#ffffff;
    classDef vrmStyle fill:#064e3b,stroke:#34d399,color:#ffffff;

    class Text textStyle;
    class TTS,WAV ttsStyle;
    class AudioCtx,Formant audioStyle;
    class Lerp,VRM vrmStyle;
```

---

## 5. Tools & MCP Sidecar Architecture (`mcp_tools_map.mmd`)

Detailed view of native tools (Weather, System Clock, Web Search) and stdio JSON-RPC MCP sidecars (Playwright agent-browser on Port 3000 stream bridge).

- **Mermaid File**: [`docs/architecture/mcp_tools_map.mmd`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/mcp_tools_map.mmd)

```mermaid
graph TB
    subgraph AgentLayer ["NativeAgent Tool Engine"]
        Agent["NativeAgent ReAct Controller"]
        Registry["ToolRegistry Resolver"]
        Agent --> Registry
    end

    subgraph NativeTools ["Local Native Tools"]
        Weather["Weather Tool<br/>(OpenWeatherMap API)"]
        Clock["System Clock Tool<br/>(Date/Time & Timezones)"]
        WebSearch["Web Search Tool<br/>(Live Web Intelligence)"]
        Registry --> Weather
        Registry --> Clock
        Registry --> WebSearch
    end

    subgraph MCPTools ["MCP Sidecar Protocols (Stdio JSON-RPC)"]
        MCPManager["MCP Manager Service"]
        BrowserMCP["agent-browser MCP<br/>(Playwright Automated Browser)"]
        TimeMCP["Time MCP<br/>(Temporal Calculations)"]
        
        Registry --> MCPManager
        MCPManager -->|JSON-RPC| BrowserMCP
        MCPManager -->|JSON-RPC| TimeMCP
    end

    subgraph External ["Target Resources"]
        WebSite["Live Web Pages & Portals"]
        Bridge["Browser Stream Bridge<br/>(Port 3000 WebSocket)"]
        
        BrowserMCP -->|Automate / Click / Type| WebSite
        BrowserMCP -->|Stream Frame Data| Bridge
    end

    classDef agentStyle fill:#431407,stroke:#fb923c,color:#ffffff;
    classDef toolStyle fill:#1e293b,stroke:#38bdf8,color:#ffffff;
    classDef mcpStyle fill:#312e81,stroke:#a5b4fc,color:#ffffff;
    classDef extStyle fill:#064e3b,stroke:#34d399,color:#ffffff;

    class Agent,Registry agentStyle;
    class Weather,Clock,WebSearch toolStyle;
    class MCPManager,BrowserMCP,TimeMCP mcpStyle;
    class WebSite,Bridge extStyle;
```

---

## Interactive HTML Viewer

Open [`docs/architecture/viewer.html`](file:///home/sameerbagul/Projects/Github/CV_Projects%F0%9F%A4%A9/athena/docs/architecture/viewer.html) in your web browser to interactively switch between all **5 clean architecture diagrams** in a dark-mode, glassmorphism interface!
