import fs from 'fs';
import path from 'path';
import { loadTextToSpeech, loadVoiceStyle, encodeWavFile } from '../lib/supertonic.js';

export class TTSEngine {
  constructor(assetPath) {
    this.assetPath = assetPath;
    this.onnxDir = path.join(assetPath, 'onnx');
    this.voiceStylesDir = path.join(assetPath, 'voice_styles');
    this.tts = null;
  }

  async init() {
    console.log('[TTS] Loading TTS pipeline...');

    // Check if we have a locally downloaded version in ATHENA_USER_DATA
    const userData = process.env.ATHENA_USER_DATA;
    let onnxDir = this.onnxDir;

    if (userData) {
      const possiblePath = path.join(userData, "models", "presence", "standard-v1");
      if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, "duration_predictor.onnx"))) {
        onnxDir = possiblePath;
        console.log(`[TTS] Using local model from: ${onnxDir}`);
      }
    }

    this.tts = await loadTextToSpeech(onnxDir, false);
    console.log('[TTS] Engine ready');
  }

  loadStyleByName(name) {
    // accept either "M1" or full path; fall back to M1
    if (!name) name = 'M1';
    const candidate = path.join(this.voiceStylesDir, `${name}.json`);
    if (fs.existsSync(candidate)) return [candidate];
    // fallback: if user passed full path, try that
    if (fs.existsSync(name)) return [name];
    // fallback default
    return [path.join(this.voiceStylesDir, 'M1.json')];
  }

  async synthesize(text, voice = 'M1', totalStep = 5, speed = 1.05) {
    if (!this.tts) throw new Error('TTS engine not initialized');

    const stylePaths = this.loadStyleByName(voice);
    const style = loadVoiceStyle(stylePaths, false);

    const { wav } = await this.tts.call(text, style, totalStep, speed);

    // Encode to WAV buffer
    const wavBuffer = encodeWavFile(wav, this.tts.sampleRate);
    return wavBuffer;
  }
}