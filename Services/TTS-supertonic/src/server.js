// server.js
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { TTSEngine } from './tts-engine.js';
import { setupRoutes } from './routes.js';
import { setupWebSocket } from './stream.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../assets");

async function main() {
  logger.info('Starting TTS server...');
  const ttsEngine = new TTSEngine(ASSETS_DIR);
  await ttsEngine.init();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Setup routes
  setupRoutes(app, ttsEngine);

  // WebSocket streaming
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws-tts' });
  setupWebSocket(wss, ttsEngine);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`[server] listening :${PORT}`);
  });
}

main().catch(err => {
  logger.error('Fatal error starting server', err);
  process.exit(1);
});
