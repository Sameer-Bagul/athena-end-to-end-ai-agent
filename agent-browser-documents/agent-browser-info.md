This is actually one of the strongest parts of Agent Browser. It's not just a browser CLI anymore. It's becoming an ecosystem with **Skills**, **MCP**, **Cloud Browser Providers**, and **Coding Agent integrations**.

For Athena, this is very relevant because you can reuse many of these components instead of reinventing them.

---

# 1. Built-in Skills

Run:

```bash
agent-browser skills list
```

or

```bash
agent-browser skills get core --full
```

The available built-in skills currently include: ([GitHub][1])

## core

The main browser automation skill.

It teaches an agent how to:

* Navigate websites
* Use snapshots
* Click elements
* Fill forms
* Authentication
* Sessions
* Screenshots
* Downloads
* Uploads
* Diff pages
* Browser state
* Full command reference

This is the first skill every coding agent should load.

---

## electron

```bash
agent-browser skills get electron
```

Automates Electron applications like: ([GitHub][1])

* VS Code
* Slack
* Discord
* Figma
* Cursor
* Obsidian
* Notion Desktop
* Spotify Desktop

It connects through Chrome DevTools Protocol (CDP).

For Athena this is huge.

Imagine:

> Athena, open VS Code and create a React project.

or

> Open Figma Desktop and export this frame.

---

## slack

```bash
agent-browser skills get slack
```

Adds workflows for Slack automation: ([GitHub][1])

Examples:

* Read unread messages
* Open channels
* Search conversations
* Send messages
* Collect data
* Navigate workspaces

---

## dogfood

```bash
agent-browser skills get dogfood
```

This one is very interesting.

It teaches the AI how to perform:

* Exploratory testing
* QA
* Bug hunting
* UX review
* Screenshot capture
* Reproduction reports
* Video recording

Think:

> Test my website.

The AI browses like a human and reports:

* broken buttons
* layout issues
* missing images
* console errors
* navigation bugs

---

## vercel-sandbox

Runs Agent Browser inside Vercel Sandbox microVMs. ([GitHub][1])

Useful if you want isolated cloud browser sessions.

---

## agentcore

Runs browsers inside AWS Bedrock AgentCore. ([GitHub][1])

Useful for enterprise deployments.

---

# 2. MCP Server

This is probably the feature that will interest you most.

Agent Browser includes an MCP server.

Start it with:

```bash
agent-browser mcp
```

or expose all tool groups:

```bash
agent-browser mcp --tools all
```

or choose only certain categories:

```bash
agent-browser mcp --tools core,network,react
```

([GitHub][2])

This means any MCP client can use Agent Browser.

For example:

* Claude Desktop
* Cursor
* Claude Code
* Gemini CLI
* Codex
* Continue
* Cline

Instead of calling the CLI, they communicate with the MCP server.

---

# 3. Dashboard

Start:

```bash
agent-browser dashboard start
```

Then open

```
http://localhost:4848
```

The dashboard lets you inspect: ([GitHub][1])

* Active browser sessions
* Browser status
* Screenshots
* Runtime streams
* Logs

This is great for debugging Athena.

---

# 4. Runtime Streaming

```bash
agent-browser stream enable
```

Now browser events stream over WebSockets.

Athena could receive events like:

```text
Clicked Login

Navigated

Screenshot taken

Download started

Download completed
```

Imagine your desktop pet saying:

> Downloading report...

while the browser is actually downloading it.

---

# 5. Authentication Vault

Commands:

```bash
agent-browser auth save
```

```bash
agent-browser auth login
```

```bash
agent-browser auth list
```

This securely stores login profiles.

Athena could remember:

* GitHub
* LinkedIn
* Gmail
* AWS

without logging in every session.

---

# 6. Session Persistence

```bash
--session-name work
```

or

```bash
--profile Default
```

Athena could maintain multiple browser identities.

Example:

```
Personal

Work

Testing

Incognito
```

---

# 7. Cloud Browser Providers

Agent Browser can run on several providers instead of your local Chrome: ([GitHub][1])

```
browserbase

browserless

browseruse

kernel

agentcore

ios
```

Example:

```bash
agent-browser -p browserbase
```

Athena could execute browser tasks in the cloud while your laptop sleeps.

---

# 8. Coding Agent Integrations

It is designed to work with: ([GitHub][1])

* Claude Code
* Cursor
* Codex
* Continue
* Cline
* Windsurf
* Gemini CLI
* GitHub Copilot

The discovery skill teaches these agents to prefer Agent Browser over their built-in browser tooling.

---

# 9. Engines

It currently supports multiple browser engines: ([agent-browser][3])

```
Chrome

Lightpanda
```

Lightpanda is an extremely lightweight browser engine aimed at AI agents, making it attractive for servers and automation.

---

# 10. Video Recording

```bash
agent-browser record start demo.webm
```

Perform actions...

```bash
agent-browser record stop
```

Athena could generate videos such as:

* QA recordings
* Bug reproductions
* Tutorials
* Audit evidence

---

# 11. Trace & Profiler

```bash
agent-browser trace start
```

```bash
agent-browser profiler start
```

Useful for:

* Performance debugging
* Network analysis
* Chrome DevTools traces

---

# 12. Network Control

You can inspect and mock requests:

```bash
agent-browser network requests
```

or intercept them:

```bash
agent-browser network route
```

This is useful for testing APIs and frontend behavior.

---

# What excites me most for Athena

Out of everything, these are the features I'd prioritize:

1. **MCP Server** so Athena can expose browser automation as an MCP tool to other AI systems.
2. **Electron Skill** to control desktop applications like VS Code, Figma, Slack, and Obsidian from the same automation framework.
3. **Streaming API** so your 3D desktop pet can narrate or visualize what it's doing in real time.
4. **Authentication Vault** to let Athena securely reuse user sessions across websites.
5. **Dogfood Skill** as the foundation for an automated website testing and QA mode.
6. **Dashboard** to observe browser sessions and debug workflows visually.

Taken together, these features make Agent Browser much more than a Playwright replacement. It's evolving into a general execution layer for AI agents that need to operate browsers and Chromium-based desktop applications efficiently.

[1]: https://github.com/vercel-labs/agent-browser/blob/main/skills/agent-browser/SKILL.md?utm_source=chatgpt.com "agent-browser/skills/agent-browser/SKILL.md at main"
[2]: https://github.com/vercel-labs/agent-browser?utm_source=chatgpt.com "vercel-labs/agent-browser"
[3]: https://agent-browser.dev/skills?utm_source=chatgpt.com "Skills | agent-browser"


---
---
Absolutely. In fact, I think we should treat this as **Athena's research documentation**, not just notes.

Since Athena is going to be an agent platform, understanding Agent Browser deeply will influence your architecture (tool system, MCP support, desktop automation, browser automation, agent memory, streaming, etc.).

I propose creating something closer to an engineering handbook than a README.

# Document Structure

I would make it around **120 to 200 pages worth of material** (roughly 40,000 to 60,000 words) divided into chapters.

---

# Part I

## Understanding Agent Browser

* Why Agent Browser exists
* Problems with Playwright and Puppeteer
* Token efficiency
* Accessibility Tree
* Element References
* Browser state
* Sessions
* Internal Architecture
* How the AI loop works
* Why Vercel built it
* Comparison with Browser Use, Stagehand, Playwright, Puppeteer, Selenium and OpenAI Computer Use. ([GitHub][1])

---

# Part II

## Complete CLI Documentation

Every command explained in detail.

Instead of

```
open
click
fill
```

We'll explain

```
open

Purpose

Architecture

Syntax

Parameters

Examples

Best Practices

Edge Cases

How AI uses it

How Athena should use it
```

for every command.

This alone will probably be 80+ pages.

---

# Part III

## Skills

Instead of just saying

```
Electron Skill
```

We'll explain

* Internal structure
* Discovery
* Loading
* Prompt injection
* How skills are stored
* Progressive loading
* When agents load them
* Memory optimization
* Real examples

Then dedicate chapters to

* Core Skill
* Electron Skill
* Slack Skill
* Dogfood
* Vercel Sandbox
* AgentCore

with real workflows. ([GitHub][1])

---

# Part IV

## MCP Integration

Probably 50 pages itself.

Topics like

* What MCP actually is
* Client
* Server
* Tool discovery
* Resources
* Prompts
* JSON RPC
* Transport
* Streaming
* Authentication
* Security
* Permissions

Then

How Agent Browser exposes MCP.

Then

How Cursor discovers it.

Then

How Claude discovers it.

Then

How Gemini CLI discovers it.

Then

How Athena should expose its own MCP server. ([Wikipedia][2])

---

# Part V

## Dashboard

Complete reverse engineering

* Sessions
* Runtime
* Stream
* Browser inspector
* Logs
* Screenshots
* Videos
* Traces
* Performance

---

# Part VI

## Browser Engines

Chrome

Lightpanda

CDP

Architecture

Why Lightpanda exists

Performance comparison

Memory usage

Future roadmap

---

# Part VII

## Cloud Providers

Everything.

Browserbase

Browserless

Kernel

Browser Use

AWS AgentCore

Vercel Sandbox

Pricing

Latency

Use cases

Security

---

# Part VIII

## Authentication

One huge chapter.

Profiles

Cookies

Vault

Persistent Sessions

Encryption

State Files

Best practices

Enterprise deployment

---

# Part IX

## Runtime Streaming

WebSocket protocol

Events

Message structure

UI synchronization

Desktop companion integration

Live animations

How Athena's 3D pet can react to browser events.

---

# Part X

## Desktop Automation

Electron

VS Code

Cursor

Slack

Discord

Spotify

Obsidian

Figma

Chrome Apps

How Chromium based desktop apps expose CDP.

---

# Part XI

## AI Integration

Claude Code

Cursor

Gemini CLI

Codex

Continue

Windsurf

GitHub Copilot

How Skills integrate.

How MCP integrates.

How tools are discovered.

---

# Part XII

## Building Athena

This is where the document becomes unique.

Instead of documenting Agent Browser, we'll design Athena.

Topics like

Browser Tool

```
Gemini

↓

Planner

↓

Browser Tool

↓

Agent Browser

↓

Chromium
```

Tool Calling

Planning

Retries

Reflection

Memory

Long tasks

Confirmation dialogs

Interruptibility

User takeover

Browser permissions

Multi browser orchestration

Cloud fallback

Offline mode

---

# Part XIII

## Building Our Own Agent Browser Chat

Since Vercel's chat is basically

```
LLM

↓

Snapshot

↓

Reason

↓

Action

↓

Snapshot

↓

Reason

↓

Action
```

We'll recreate it.

In Python.

Then

TypeScript.

Then

Rust.

---

# Part XIV

## Advanced Topics

Visual grounding

DOM grounding

Accessibility Trees

Computer Use Agents

OpenAI CUA

Anthropic Computer Use

Gemini Computer Use

OSWorld

Browser benchmarks

Academic research

Future directions. ([arXiv][3])

---

# Part XV

## Security

Prompt Injection

Tool Injection

Malicious websites

Authentication leakage

Permission models

Sandboxing

MCP security

Enterprise deployment. ([Wikipedia][2])

---

# Appendices

* Every CLI command
* Every configuration option
* Environment variables
* Browser providers
* Skills reference
* MCP reference
* CDP reference
* Useful prompts
* Debugging guide
* Common errors
* Troubleshooting

---

## What would make this different from existing documentation

The official documentation explains **how to use Agent Browser**. ([GitHub][1])

What I think would be far more valuable for you is a document that explains:

* **How Agent Browser works internally.**
* **Why each feature exists.**
* **How it fits into the broader AI agent ecosystem (Skills, MCP, cloud browsers, coding agents).**
* **How to integrate it into Athena's architecture.**
* **How to extend or even reimplement similar capabilities when needed.**

The result would be an engineering handbook you could keep alongside Athena's documentation and refer to whenever you're designing new browser automation or agent capabilities. I think this would become one of the core technical references for the project.

[1]: https://github.com/vercel-labs/agent-browser/blob/main/skills/agent-browser/SKILL.md?utm_source=chatgpt.com "agent-browser/skills/agent-browser/SKILL.md at main"
[2]: https://en.wikipedia.org/wiki/Model_Context_Protocol?utm_source=chatgpt.com "Model Context Protocol"
[3]: https://arxiv.org/abs/2602.12430?utm_source=chatgpt.com "Agent Skills for Large Language Models: Architecture, Acquisition, Security, and the Path Forward"

