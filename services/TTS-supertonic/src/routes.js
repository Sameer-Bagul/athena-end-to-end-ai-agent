import { TTSEngine } from './tts-engine.js';
import logger from './logger.js';

export function setupRoutes(app, ttsEngine) {
  // simple health
  app.get('/health', (req, res) => {
    logger.info('Health check requested');
    res.json({ ok: true });
  });

  // POST /tts -> returns audio/wav
  app.post('/tts', async (req, res) => {
    try {
      const { text, voiceStyle = 'M1', totalStep = 5, speed = 1.05 } = req.body || {};
      if (!text || typeof text !== 'string') {
        logger.warn('Invalid text in /tts request');
        return res.status(400).json({ error: 'text required' });
      }

      logger.info(`Generating TTS for text: ${text.substring(0, 50)}...`);
      const wavBuffer = await ttsEngine.synthesize(text, voiceStyle, totalStep, speed);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', `attachment; filename="tts.wav"`);
      res.send(wavBuffer);
      logger.info('TTS generation completed');
    } catch (err) {
      logger.error('Error in /tts', err);
      res.status(500).json({ error: err.message });
    }
  });
}