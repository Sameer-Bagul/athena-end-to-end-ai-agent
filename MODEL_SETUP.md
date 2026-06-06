# LLM Model Setup for Athena

## Tool-Compatible Models Required

The LangGraph agent requires models that support **function/tool calling**. The default `dolphin-mistral` does NOT support this feature.

## Recommended Models

### Option 1: Llama 3.1 (Recommended - Best Overall)
```bash
ollama pull llama3.1
```
- **Size**: ~4.7GB (8B parameter version)
- **Quality**: Excellent for agents
- **Speed**: Medium
- **Tool Support**: ✅ Full

### Option 2: Qwen 2.5 (Fastest)
```bash
ollama pull qwen2.5
```
- **Size**: ~4.7GB (7B parameter version)
- **Quality**: Excellent, very good reasoning
- **Speed**: Fast
- **Tool Support**: ✅ Full

### Option 3: Mistral Nemo
```bash
ollama pull mistral-nemo
```
- **Size**: ~7GB (12B parameter version)
- **Quality**: Strong reasoning
- **Speed**: Medium-slow
- **Tool Support**: ✅ Full

## Quick Start

1. **Install a model** (choose one):
   ```bash
   ollama pull llama3.1
   ```

2. **Verify it works**:
   ```bash
   ollama run llama3.1
   ```

3. **Test tool calling** (in the ollama chat):
   ```
   You have access to a weather tool. What's the weather like in London?
   ```
   
   The model should indicate it would call a weather tool.

4. **Start Athena**:
   ```bash
   npm start
   ```

## Current Configuration

The app is now configured to use:
- **Default Model**: `llama3.1:latest`
- **Temperature**: `0.2` (for reliable tool calling)
- **Graph Compilation**: Cached (compiles once, reuses for speed)

## Performance Optimization

The agent graph is now compiled **once** when first used and cached for subsequent requests. This makes the agent much faster on repeat queries.

## Troubleshooting

### Error: "model does not support tools"
- You're using a model without tool calling support
- Switch to `llama3.1`, `qwen2.5`, or `mistral-nemo`

### Slow Response
- First query compiles the graph (one-time cost)
- Subsequent queries should be much faster
- Consider using `qwen2.5` for fastest inference

### Model Not Found
- Run: `ollama list` to see installed models
- Pull the model: `ollama pull llama3.1`

## Available Tools

Your agent currently has access to:

1. **Weather Tool** - Get current weather for any city
2. **Clock Tool** - Get current date/time in any timezone  
3. **Knowledge Search** - Search your uploaded documents (RAG)

The agent will automatically decide which tools to use based on your query.
