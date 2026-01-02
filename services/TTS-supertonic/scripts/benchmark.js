import { TTSEngine } from "../src/tts-engine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const engine = new TTSEngine(path.join(__dirname, "../assets"));
await engine.init();

const testText = "This is a test sentence for benchmarking the TTS engine.";
const start = Date.now();

for (let i = 0; i < 5; i++) {
  await engine.synthesize(testText);
}

const end = Date.now();
const avgTime = (end - start) / 5;
console.log(`Average synthesis time: ${avgTime} ms`);