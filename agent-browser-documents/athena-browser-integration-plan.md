# Athena + Agent Browser Integration Plan
**Industry-Level Browser Automation Architecture**

This plan outlines the architecture and implementation steps to give Athena (an Electron + LangChain application) advanced, autonomous web browsing capabilities using Vercel's Agent Browser. 

## 1. Architectural Overview

Athena is currently structured as an Electron app using LangChain for AI orchestration. We will integrate Agent Browser via the Model Context Protocol (MCP) to decouple browser execution from the main Electron process.

### The Stack
*   **Frontend**: React (Renderer process) for visual streaming and HITL (Human-in-the-Loop) approvals.
*   **Backend**: Node.js (Electron Main process) running LangChain/LangGraph.
*   **Execution Layer**: Agent Browser (Rust CLI) exposing an MCP server.

## 2. Headed vs. Headless Management

Industry-level automation requires dynamically switching between local (headed) and background (headless) execution based on context.

### Headed Mode (Local Debugging & Assistant Mode)
*   **Trigger**: User explicitly asks Athena to "show me" or the workflow requires a visual CAPTCHA/login.
*   **Implementation**: 
    *   Spawn Agent Browser with the `chrome` engine.
    *   Connect Athena's frontend to the Agent Browser WebSocket stream (`agent-browser stream enable`) to display live screenshots and action logs within the Athena dashboard.

### Headless Mode (Background & Cloud Mode)
*   **Trigger**: Scheduled tasks (e.g., "scrape my email every hour"), long-running background research, or memory-intensive jobs.
*   **Implementation**:
    *   **Local Headless**: Use the `lightpanda` engine for rapid, low-memory background execution without popping open Chrome windows.
    *   **Cloud Headless**: Route requests to `browserbase` or `agentcore` using `--provider browserbase`. This allows Athena to perform complex scraping while the user's laptop is asleep.

## 3. Implementation Steps

### Phase 1: MCP Tool Orchestration
1.  **Start Agent Browser Server**: Modify Electron's `main.js` to spawn `agent-browser mcp --tools all` as a child process on startup.
2.  **LangChain Integration**: Use `@langchain/community` MCP tools to connect to the local Agent Browser MCP server.
3.  **Tool Registry**: Register tools (`open`, `snapshot`, `click`, `fill`) into Athena's LangGraph tool node.

### Phase 2: The Agentic Loop (LangGraph)
Design a LangGraph workflow specific for web execution:
1.  **State**: `url`, `snapshot_ref_map`, `current_objective`.
2.  **Node - Navigate**: LLM calls `open` MCP tool.
3.  **Node - Perceive**: LLM calls `snapshot` MCP tool. Parses the distilled accessibility tree.
4.  **Node - Act**: LLM determines the `[ref]` ID to interact with and calls `click` or `fill`.
5.  **Node - Reflect**: LLM evaluates if the objective is complete or if an error occurred (e.g., element not found).

### Phase 3: Advanced Capabilities
1.  **Electron-to-Electron (Meta Automation)**: Use the Agent Browser `electron` skill. Athena (an Electron app) can now connect via CDP to other Electron apps (VS Code, Slack) running on the same machine.
2.  **Authentication Vault Management**: 
    *   Create a UI tab in Athena for "Connected Accounts".
    *   Under the hood, this uses `agent-browser auth save/login`. 
    *   Athena encrypts this vault locally and passes the profile flag (`--profile user_x`) during browser spawns.
3.  **Human-in-the-Loop (HITL) Interruption**:
    *   If Agent Browser detects a payment form or irreversible action, the LangGraph pauses.
    *   Electron fires an IPC event to the renderer, showing the live snapshot to the user for approval.

## 4. Security & Isolation
*   **Vercel Sandbox**: For untrusted links (e.g., "Athena, check out this weird URL"), force Agent Browser into the `vercel-sandbox` microVM provider to prevent local exploits.
*   **Prompt Injection**: Sanitize all snapshots before feeding them into LangChain to prevent hidden CSS from altering Athena's system instructions.

## 5. Next Steps for Development
1.  Ensure `agent-browser` is globally installed on the host machine.
2.  Write an MCP Client wrapper in TypeScript for `@langchain/core`.
3.  Create the initial `BrowserGraph` using LangGraph.
