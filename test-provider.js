#!/usr/bin/env node

/**
 * AI Provider API Test Script
 * Usage: 
 *   node test-provider.js <provider> <api_key> [model] [base_url]
 * 
 * Providers: 'openai', 'gemini', 'ollama'
 * 
 * Examples:
 *   node test-provider.js ollama "" "dolphin-mistral:latest" "http://localhost:11434"
 *   node test-provider.js openai "sk-YOUR_KEY" "gpt-3.5-turbo" "https://api.openai.com/v1"
 *   node test-provider.js gemini "AIzaSyYOUR_KEY" "gemini-1.5-flash"
 */

const provider = process.argv[2]?.toLowerCase();
const apiKey = process.argv[3] || '';
const model = process.argv[4] || (
    provider === 'openai' ? 'gpt-3.5-turbo' :
        provider === 'gemini' ? 'gemini-2.0-flash' :
            'dolphin-mistral:latest'
);
const baseUrl = process.argv[5] || (
    provider === 'openai' ? 'https://api.openai.com/v1' :
        provider === 'ollama' ? 'http://localhost:11434' :
            ''
);

if (!provider || !['openai', 'gemini', 'ollama'].includes(provider)) {
    console.error("❌ Invalid provider. Choose 'openai', 'gemini', or 'ollama'.");
    console.log("Usage: node test-provider.js <provider> <api_key> [model] [base_url]");
    process.exit(1);
}

console.log(`\n🧪 Testing ${provider.toUpperCase()} API...`);
console.log(`Model: ${model}`);
if (provider !== 'gemini') console.log(`Base URL: ${baseUrl}`);
if (apiKey) console.log(`API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
console.log('----------------------------------------\n');

async function testOpenAI() {
    if (!apiKey) {
        console.error("❌ OpenAI requires an API key.");
        return;
    }
    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Say "Hello, World!"' }],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const data = await response.json();
        console.log("✅ SUCCESS!");
        console.log("Response:", data.choices[0].message.content);
    } catch (e) {
        console.error("❌ Error testing OpenAI:", e.message);
    }
}

async function testGemini() {
    if (!apiKey) {
        console.error("❌ Gemini requires an API key.");
        return;
    }
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "Hello, World!"' }] }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const data = await response.json();
        console.log("✅ SUCCESS!");
        console.log("Response:", data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("❌ Error testing Gemini:", e.message);
    }
}

async function testOllama() {
    try {
        // First check if Ollama is running
        const health = await fetch(baseUrl);
        if (!health.ok) throw new Error("Ollama server not responding at " + baseUrl);

        const response = await fetch(`${baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: 'Say "Hello, World!"',
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const data = await response.json();
        console.log("✅ SUCCESS!");
        console.log("Response:", data.response);
    } catch (e) {
        console.error("❌ Error testing Ollama:");
        console.error("   " + e.message);
        console.error("   Make sure Ollama is running and the model is pulled (`ollama pull " + model + "`).");
    }
}

// Run the corresponding test
if (provider === 'openai') testOpenAI();
else if (provider === 'gemini') testGemini();
else if (provider === 'ollama') testOllama();
