import logger from './logger.js';

export function setupWebSocket(wss, ttsEngine) {
  wss.on('connection', (ws) => {
    logger.info('[ws] client connected');
    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        const { text, voiceStyle = 'M1', totalStep = 5, speed = 1.05 } = data;
        if (!text) {
          logger.warn('No text in WebSocket message');
          return ws.send(JSON.stringify({ error: 'text required' }));
        }

        logger.info(`WebSocket TTS for: ${text.substring(0, 50)}...`);
        const wavBuffer = await ttsEngine.synthesize(text, voiceStyle, totalStep, speed);

        ws.send(JSON.stringify({ sampleRate: ttsEngine.tts.sampleRate, format: 'wav' }));
        ws.send(wavBuffer, { binary: true });
        logger.info('WebSocket TTS sent');
      } catch (e) {
        logger.error('[ws] error', e);
        ws.send(JSON.stringify({ error: e.message }));
      }
    });
  });
}