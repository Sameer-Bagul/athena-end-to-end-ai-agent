# 🚀 **Production-Ready TTS Microservice (Supertonic ONNX)**

**Architecture • Folder Structure • Deployment • Scaling • APIs • Best Practices**

Fully tuned for AI agent usage.

## What This Service Does

This is a high-performance, production-ready Text-to-Speech (TTS) microservice built with Supertonic ONNX models. It provides:

- **Ultra-fast on-device TTS** (no external API calls)
- **HTTP API** for easy integration with AI agents and LLM pipelines
- **WebSocket streaming** for real-time audio generation
- **Multiple voice styles** (M1, F1, etc.)
- **Concurrency-safe** inference pipelines
- **Docker-ready** deployment
- **Scalable architecture** for high-throughput applications

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will be available at `http://localhost:3000`.

### Test the API

```bash
# Generate speech
curl -X POST "http://localhost:3000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world from Supertonic TTS", "voiceStyle":"M1"}' \
  --output speech.wav
```

### Health Check

```bash
curl http://localhost:3000/health
```

## API Reference

### POST /tts

Generate speech from text.

**Request Body:**
```json
{
  "text": "Your text here",
  "voiceStyle": "M1",  // optional, defaults to "M1"
  "totalStep": 5,      // optional, denoising steps (higher = better quality)
  "speed": 1.05        // optional, speech speed multiplier
}
```

**Response:** WAV audio file (16-bit PCM, 24kHz)

### WebSocket /ws-tts

Real-time streaming TTS.

**Client sends:**
```json
{
  "text": "Streaming text",
  "voiceStyle": "M1",
  "totalStep": 5,
  "speed": 1.05
}
```

**Server responds:**
1. JSON metadata: `{"sampleRate": 24000, "format": "wav"}`
2. Binary WAV data

### Additional API details

- POST `/tts` response headers:
  - `Content-Type: audio/wav` (for successful audio responses)
  - `Content-Length` set to the size of the generated WAV payload

- Error response (JSON):

  {
    "error": "Model not loaded",
    "code": 503
  }

- WebSocket behavior:
  - Client sends a single JSON message with generation options (see above).
  - Server may stream multiple binary frames containing progressive audio chunks followed by a final metadata JSON.

Example POST response handling (client):

```bash
curl -X POST "http://localhost:3000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voiceStyle":"M1"}' \
  --output out.wav

file out.wav  # should show WAV header / PCM audio
```

### GET /health

Health check endpoint.

**Response:**
```json
{"ok": true}
```

## Voice Styles

Available voices in `assets/voice_styles/`:

- `M1.json` - Male voice 1 (default)
- `F1.json` - Female voice 1
- `M2.json` - Male voice 2
- `F2.json` - Female voice 2

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t supertonic-tts .

# Run container
docker run -p 3000:3000 supertonic-tts
```

### Docker Compose

```bash
docker-compose up -d
```

## Scaling

### PM2 (Multi-core)

```bash
npm install -g pm2
pm2 start src/server.js -i max
```

### Horizontal Scaling

Run multiple instances behind a load balancer:

```bash
# Instance 1
PORT=3000 npm start

# Instance 2
PORT=3001 npm start

# Instance 3
PORT=3002 npm start
```

## Integration with AI Agents

### JavaScript/TypeScript

```js
async function speak(text) {
  const response = await fetch('http://localhost:3000/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceStyle: 'M1' })
  });

  const audioBuffer = await response.arrayBuffer();
  // Play audio in your agent
  playAudio(audioBuffer);
}
```

### Python

```python
import requests

def generate_speech(text):
    response = requests.post('http://localhost:3000/tts',
        json={'text': text, 'voiceStyle': 'F1'})
    with open('output.wav', 'wb') as f:
        f.write(response.content)
```

## Performance Tuning

### Warm-up

Preload models for faster first requests:

```bash
node scripts/warmup.js
```

### Benchmarking

Test performance:

```bash
node scripts/benchmark.js
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `ORT_FORCE_CPU` - Force CPU inference (default: 1)

## Security

- Rate limiting recommended for production
- Limit request body size (currently 10MB)
- HTTPS recommended
- Do not expose `/assets` directory

## Troubleshooting

### Common Issues

1. **"TTS engine not initialized"**
   - Ensure models are in `assets/onnx/`
   - Check file permissions

2. **Memory issues**
   - Reduce `totalStep` for lower quality/faster inference
   - Use PM2 with fewer instances

3. **Slow first request**
   - Run warmup script before traffic
   - Use persistent server instead of serverless

## Architecture

```
supertonic-tts/
├── assets/           # ONNX models & voice styles
├── src/              # Application code
│   ├── server.js     # Express server
│   ├── tts-engine.js # TTS wrapper
│   └── ...
├── lib/              # Core TTS library
├── scripts/          # Utilities
└── Dockerfile        # Container config
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use ES modules consistently

## License

MIT
